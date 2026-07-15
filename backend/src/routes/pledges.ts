import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

// GET /pledges — all pledges feed
router.get('/', requireAuth, async (_req, res: Response) => {
  const pledges = await prisma.sustainabilityPledge.findMany({
    include: {
      user: { select: { id: true, name: true } },
      endorsements: {
        include: { user: { select: { id: true, name: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return res.json(pledges);
});

// POST /pledges — create a pledge
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { pledge, durationDays } = req.body;
    if (!pledge) return res.status(400).json({ error: 'pledge text is required' });

    const created = await prisma.sustainabilityPledge.create({
      data: {
        userId: req.user!.userId,
        pledge,
        durationDays: durationDays || 30,
      },
      include: {
        user: { select: { id: true, name: true } },
        endorsements: true,
      },
    });

    return res.status(201).json(created);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /pledges/:id/endorse — endorse someone's pledge
router.post('/:id/endorse', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const pledgeId = parseInt(req.params.id);
    const userId = req.user!.userId;

    // Can't endorse own pledge
    const pledge = await prisma.sustainabilityPledge.findUnique({ where: { id: pledgeId } });
    if (!pledge) return res.status(404).json({ error: 'Pledge not found' });
    if (pledge.userId === userId) {
      return res.status(400).json({ error: 'Cannot endorse your own pledge' });
    }

    // Check if already endorsed
    const existing = await prisma.pledgeEndorsement.findUnique({
      where: { pledgeId_userId: { pledgeId, userId } },
    });
    if (existing) {
      return res.status(409).json({ error: 'Already endorsed' });
    }

    const endorsement = await prisma.pledgeEndorsement.create({
      data: { pledgeId, userId },
      include: { user: { select: { id: true, name: true } } },
    });

    return res.status(201).json(endorsement);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
