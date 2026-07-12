import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireManager, AuthenticatedRequest } from '../middleware/auth';
import { notifyComplianceIssue, notifyParticipationApproved, notifyParticipationRejected } from '../lib/notifications';
import { checkAndAwardBadges } from '../lib/badges';

const router = Router();

// ── CSR Activities Endpoints ──
router.get('/csr-activities', async (req: Request, res: Response) => {
  const activities = await prisma.cSRActivity.findMany({
    include: { category: true, department: true },
    orderBy: { id: 'desc' },
  });
  return res.json(activities);
});

router.post('/csr-activities', requireManager, async (req: AuthenticatedRequest, res: Response) => {
  const data = req.body;
  const activity = await prisma.cSRActivity.create({
    data: {
      title: data.title,
      categoryId: data.categoryId ? parseInt(data.categoryId) : null,
      icon: data.icon || '🌱',
      description: data.description || '',
      departmentId: data.departmentId ? parseInt(data.departmentId) : null,
      evidenceRequired: data.evidenceRequired || false,
      status: 'Open',
    },
  });
  return res.status(201).json(activity);
});

router.post('/csr-activities/join', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { activityId } = req.body;
  const activity = await prisma.cSRActivity.findUnique({ where: { id: parseInt(activityId) } });
  if (!activity) return res.status(404).json({ error: 'Activity not found' });

  await prisma.cSRActivity.update({
    where: { id: activity.id },
    data: { joinCount: activity.joinCount + 1 },
  });

  const participation = await prisma.employeeParticipation.create({
    data: {
      employeeId: req.user!.userId,
      activityId: activity.id,
      pointsEarned: 25,
      approvalStatus: 'Pending',
    },
  });
  return res.status(201).json(participation);
});

router.get('/csr-activities/:id', async (req: Request, res: Response) => {
  try {
    const activity = await prisma.cSRActivity.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { category: true, department: true },
    });
    if (!activity) return res.status(404).json({ error: 'Activity not found' });
    return res.json(activity);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/participations/complete', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id, proofFileName } = req.body;
    if (!id) return res.status(400).json({ error: 'Participation ID is required' });

    const ep = await prisma.employeeParticipation.findUnique({
      where: { id: parseInt(id) },
      include: { activity: true }
    });

    if (!ep) return res.status(404).json({ error: 'Participation record not found' });
    if (ep.employeeId !== req.user!.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!proofFileName || proofFileName.trim() === '') {
      return res.status(400).json({ error: 'Proof of completion is required for all activities' });
    }

    const updated = await prisma.employeeParticipation.update({
      where: { id: ep.id },
      data: {
        proofFileName: proofFileName,
        approvalStatus: 'Pending',
      }
    });

    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Participations Endpoints ──
router.get('/participations', async (req: Request, res: Response) => {
  const participations = await prisma.employeeParticipation.findMany({
    include: { employee: true, activity: true, challenge: true },
    orderBy: { completionDate: 'desc' },
  });
  return res.json(participations);
});

router.patch('/participations', async (req: Request, res: Response) => {
  const { id, approvalStatus } = req.body;
  const participation = await prisma.employeeParticipation.findUnique({
    where: { id: parseInt(id) },
    include: { activity: true, challenge: true },
  });
  if (!participation) return res.status(404).json({ error: 'Not found' });

  const evidenceConfig = await prisma.eSGConfig.findUnique({ where: { key: 'require_evidence' } });
  if (evidenceConfig?.value === 'true' && approvalStatus === 'Approved') {
    const needsEvidence = participation.activity?.evidenceRequired || participation.challenge?.evidenceRequired;
    if (needsEvidence && !participation.proofFileName) {
      return res.status(400).json({ error: 'Evidence required but not provided' });
    }
  }

  const updated = await prisma.employeeParticipation.update({
    where: { id: parseInt(id) },
    data: { approvalStatus },
  });

  if (approvalStatus === 'Approved') {
    await prisma.user.update({
      where: { id: participation.employeeId },
      data: {
        pointsBalance: { increment: participation.pointsEarned },
        xpTotal: { increment: participation.pointsEarned },
      },
    });
    const title = participation.activity?.title || participation.challenge?.title || 'an activity';
    await notifyParticipationApproved(participation.employeeId, title, participation.pointsEarned);
    await checkAndAwardBadges(participation.employeeId);
  } else if (approvalStatus === 'Rejected') {
    const title = participation.activity?.title || participation.challenge?.title || 'an activity';
    await notifyParticipationRejected(participation.employeeId, title);
  }
  return res.json(updated);
});

export default router;
