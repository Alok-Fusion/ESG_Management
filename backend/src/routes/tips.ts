import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

// GET /tips/today — get today's tip (rotates daily)
router.get('/today', requireAuth, async (_req, res: Response) => {
  const count = await prisma.sustainabilityTip.count();
  if (count === 0) return res.json(null);

  // Deterministic daily rotation based on day of year
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const index = dayOfYear % count;

  const tip = await prisma.sustainabilityTip.findFirst({
    skip: index,
    orderBy: { id: 'asc' },
  });

  return res.json(tip);
});

// GET /tips — list all tips (admin)
router.get('/', requireAuth, async (_req, res: Response) => {
  const tips = await prisma.sustainabilityTip.findMany({ orderBy: { id: 'desc' } });
  return res.json(tips);
});

// POST /tips — create a tip (admin only)
router.post('/', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, content, category } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'title and content are required' });
    }

    const tip = await prisma.sustainabilityTip.create({
      data: { title, content, category: category || 'General' },
    });

    return res.status(201).json(tip);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /tips/:id/helpful — mark tip as helpful
router.post('/:id/helpful', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const tip = await prisma.sustainabilityTip.update({
      where: { id },
      data: { helpfulCount: { increment: 1 } },
    });
    return res.json(tip);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
