import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { notifyParticipationApproved, notifyParticipationRejected } from '../lib/notifications';
import { checkAndAwardBadges } from '../lib/badges';

const router = Router();

// ── Challenges Endpoints ──
router.get('/challenges', async (req: Request, res: Response) => {
  const challenges = await prisma.challenge.findMany({
    include: { category: true },
    orderBy: { id: 'desc' },
  });
  return res.json(challenges);
});

router.get('/challenges/:id', async (req: Request, res: Response) => {
  try {
    const challenge = await prisma.challenge.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { category: true },
    });
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    return res.json(challenge);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/challenges', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const data = req.body;
  const challenge = await prisma.challenge.create({
    data: {
      title: data.title,
      categoryId: data.categoryId ? parseInt(data.categoryId) : null,
      description: data.description || '',
      xp: parseInt(data.xp) || 0,
      difficulty: data.difficulty || 'Medium',
      evidenceRequired: data.evidenceRequired || false,
      deadline: new Date(data.deadline),
      status: data.status || 'Draft',
    },
  });
  return res.status(201).json(challenge);
});

router.patch('/challenges', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id, status } = req.body;
  const validTransitions: Record<string, string[]> = {
    'Draft': ['Active'],
    'Active': ['UnderReview', 'Archived'],
    'UnderReview': ['Completed', 'Active'],
    'Completed': ['Archived'],
    'Archived': [],
  };
  const challenge = await prisma.challenge.findUnique({ where: { id: parseInt(id) } });
  if (!challenge) return res.status(404).json({ error: 'Not found' });

  const allowed = validTransitions[challenge.status] || [];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `Cannot transition from ${challenge.status} to ${status}` });
  }

  const updated = await prisma.challenge.update({
    where: { id: parseInt(id) },
    data: { status },
  });
  return res.json(updated);
});

// ── Challenge Participation Endpoints ──
router.get('/challenge-participations', async (req: Request, res: Response) => {
  const participations = await prisma.challengeParticipation.findMany({
    include: { employee: true, challenge: true },
    orderBy: { id: 'desc' },
  });
  return res.json(participations);
});

router.post('/challenge-participations', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { challengeId } = req.body;
  const challenge = await prisma.challenge.findUnique({ where: { id: parseInt(challengeId) } });
  if (!challenge || challenge.status !== 'Active') {
    return res.status(400).json({ error: 'Challenge not available' });
  }
  const existing = await prisma.challengeParticipation.findFirst({
    where: { challengeId: challenge.id, employeeId: req.user!.userId },
  });
  if (existing) return res.status(409).json({ error: 'Already participating' });

  const participation = await prisma.challengeParticipation.create({
    data: {
      challengeId: challenge.id,
      employeeId: req.user!.userId,
      progressPct: 0,
      approvalStatus: 'Pending',
    },
  });
  return res.status(201).json(participation);
});

router.post('/challenge-participations/complete', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id, proofFileName } = req.body;
    if (!id) return res.status(400).json({ error: 'Participation ID is required' });

    const cp = await prisma.challengeParticipation.findUnique({
      where: { id: parseInt(id) },
      include: { challenge: true }
    });

    if (!cp) return res.status(404).json({ error: 'Participation record not found' });
    if (cp.employeeId !== req.user!.userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!proofFileName || proofFileName.trim() === '') {
      return res.status(400).json({ error: 'Proof of completion is required for all challenges' });
    }

    const updated = await prisma.challengeParticipation.update({
      where: { id: cp.id },
      data: {
        proofFileName: proofFileName,
        progressPct: 100,
        approvalStatus: 'Pending',
      }
    });

    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/challenge-participations', async (req: Request, res: Response) => {
  const { id, approvalStatus } = req.body;
  const participation = await prisma.challengeParticipation.findUnique({
    where: { id: parseInt(id) },
    include: { challenge: true },
  });
  if (!participation) return res.status(404).json({ error: 'Not found' });

  const evidenceConfig = await prisma.eSGConfig.findUnique({ where: { key: 'require_evidence' } });
  if (evidenceConfig?.value === 'true' && approvalStatus === 'Approved') {
    if (!participation.proofFileName) {
      return res.status(400).json({ error: 'Evidence required but not provided' });
    }
  }

  const xpAwarded = approvalStatus === 'Approved' ? participation.challenge.xp : 0;
  const updated = await prisma.challengeParticipation.update({
    where: { id: parseInt(id) },
    data: { approvalStatus, xpAwarded, progressPct: approvalStatus === 'Approved' ? 100 : participation.progressPct },
  });

  if (approvalStatus === 'Approved') {
    await prisma.user.update({
      where: { id: participation.employeeId },
      data: { 
        xpTotal: { increment: xpAwarded },
        pointsBalance: { increment: xpAwarded }
      },
    });
    await notifyParticipationApproved(participation.employeeId, participation.challenge.title, xpAwarded);
    await checkAndAwardBadges(participation.employeeId);
  } else if (approvalStatus === 'Rejected') {
    await notifyParticipationRejected(participation.employeeId, participation.challenge.title);
  }
  return res.json(updated);
});

export default router;
