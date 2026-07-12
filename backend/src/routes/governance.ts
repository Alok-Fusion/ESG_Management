import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAdmin, requireManager, AuthenticatedRequest } from '../middleware/auth';
import { notifyComplianceIssue } from '../lib/notifications';

const router = Router();

// ── Policies Endpoints ──
router.get('/policies', async (req: Request, res: Response) => {
  const policies = await prisma.eSGPolicy.findMany({ orderBy: { publishedDate: 'desc' } });
  return res.json(policies);
});

router.post('/policies', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const data = req.body;
  const policy = await prisma.eSGPolicy.create({
    data: {
      title: data.title,
      description: data.description || '',
      category: data.category || 'Environmental',
      version: data.version || '1.0',
      mandatory: data.mandatory || false,
    },
  });
  return res.status(201).json(policy);
});

router.delete('/policies', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const id = req.query.id as string;
  if (!id) return res.status(400).json({ error: 'ID required' });
  await prisma.eSGPolicy.delete({ where: { id: parseInt(id) } });
  return res.json({ success: true });
});

// ── Policy Acknowledgements ──
router.get('/policy-acknowledgements', async (req: Request, res: Response) => {
  const acks = await prisma.policyAcknowledgement.findMany({
    include: { employee: true, policy: true },
    orderBy: { id: 'desc' },
  });
  return res.json(acks);
});

router.post('/policy-acknowledgements', requireManager, async (req: AuthenticatedRequest, res: Response) => {
  const { policyId } = req.body;
  const existing = await prisma.policyAcknowledgement.findFirst({
    where: { policyId: parseInt(policyId), employeeId: req.user!.userId },
  });
  if (existing) return res.status(409).json({ error: 'Already acknowledged' });

  const ack = await prisma.policyAcknowledgement.create({
    data: {
      policyId: parseInt(policyId),
      employeeId: req.user!.userId,
    },
  });
  return res.status(201).json(ack);
});

// ── Audits Endpoints ──
router.get('/audits', async (req: Request, res: Response) => {
  const audits = await prisma.audit.findMany({
    include: { department: true, auditor: true },
    orderBy: { date: 'desc' },
  });
  return res.json(audits);
});

router.post('/audits', requireManager, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) return res.status(401).json({ error: 'User not found' });

    const reqDeptId = parseInt(data.departmentId);
    if (user.role === 'Manager' && user.departmentId !== reqDeptId) {
      return res.status(403).json({ error: 'Managers can only create audits for their own department.' });
    }

    const audit = await prisma.audit.create({
      data: {
        title: data.title,
        departmentId: reqDeptId,
        auditorId: parseInt(data.auditorId),
        date: new Date(data.date),
        findings: data.findings || '',
        status: data.status || 'UnderReview',
      },
    });
    return res.status(201).json(audit);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Compliance Endpoints ──
router.get('/compliance-issues', async (req: Request, res: Response) => {
  const issues = await prisma.complianceIssue.findMany({
    include: { department: true, owner: true, audit: true },
    orderBy: { id: 'desc' },
  });
  const now = new Date();
  const enriched = issues.map(issue => ({
    ...issue,
    isOverdue: issue.status === 'Open' && new Date(issue.dueDate) < now,
  }));
  return res.json(enriched);
});

router.post('/compliance-issues', requireManager, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = req.body;
    if (!data.ownerId) return res.status(400).json({ error: 'Owner is required' });
    if (!data.dueDate) return res.status(400).json({ error: 'Due date is required' });
    if (!data.title) return res.status(400).json({ error: 'Title is required' });

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) return res.status(401).json({ error: 'User not found' });

    const reqDeptId = parseInt(data.departmentId);
    if (user.role === 'Manager' && user.departmentId !== reqDeptId) {
      return res.status(403).json({ error: 'Managers can only create compliance issues for their own department.' });
    }

    const issue = await prisma.complianceIssue.create({
      data: {
        title: data.title,
        auditId: data.auditId ? parseInt(data.auditId) : null,
        severity: data.severity || 'Medium',
        departmentId: reqDeptId,
        ownerId: parseInt(data.ownerId),
        dueDate: new Date(data.dueDate),
        status: 'Open',
      },
    });
    await notifyComplianceIssue(issue.title, issue.ownerId);
    return res.status(201).json(issue);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/compliance-issues', requireManager, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id, status } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) return res.status(401).json({ error: 'User not found' });

    const issue = await prisma.complianceIssue.findUnique({ where: { id: parseInt(id) } });
    if (!issue) return res.status(404).json({ error: 'Compliance issue not found' });

    if (user.role === 'Manager' && user.departmentId !== issue.departmentId) {
      return res.status(403).json({ error: 'Managers can only update compliance issues for their own department.' });
    }

    const updated = await prisma.complianceIssue.update({
      where: { id: parseInt(id) },
      data: { status },
    });
    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
