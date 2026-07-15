import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

const GREEN_ACTIONS = [
  { action: 'Used public transport', category: 'Transport' },
  { action: 'Biked or walked to work', category: 'Transport' },
  { action: 'Worked from home', category: 'Transport' },
  { action: 'Brought reusable bottle', category: 'Waste' },
  { action: 'No single-use plastics today', category: 'Waste' },
  { action: 'Composted food waste', category: 'Waste' },
  { action: 'Turned off lights when leaving', category: 'Energy' },
  { action: 'Used stairs instead of elevator', category: 'Energy' },
  { action: 'Went paperless today', category: 'Waste' },
  { action: 'Ate a plant-based meal', category: 'Food' },
  { action: 'Carpooled with colleagues', category: 'Transport' },
  { action: 'Reduced water usage', category: 'General' },
];

// GET /streaks/actions — list available green actions
router.get('/actions', (_req, res: Response) => {
  return res.json(GREEN_ACTIONS);
});

// POST /streaks/check-in — log today's green action
router.post('/check-in', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { action, category } = req.body;
    if (!action) return res.status(400).json({ error: 'action is required' });

    // Use date-only for uniqueness (strip time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    const existing = await prisma.greenCheckIn.findUnique({
      where: { userId_checkDate: { userId: req.user!.userId, checkDate: today } },
    });

    if (existing) {
      return res.status(409).json({ error: 'Already checked in today', checkIn: existing });
    }

    const XP_PER_CHECKIN = 5;

    const checkIn = await prisma.greenCheckIn.create({
      data: {
        userId: req.user!.userId,
        action,
        category: category || 'General',
        xpEarned: XP_PER_CHECKIN,
        checkDate: today,
      },
    });

    // Award XP
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { xpTotal: { increment: XP_PER_CHECKIN } },
    });

    return res.status(201).json(checkIn);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /streaks/my-streak — get current user's streak info
router.get('/my-streak', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const checkIns = await prisma.greenCheckIn.findMany({
    where: { userId: req.user!.userId },
    orderBy: { checkDate: 'desc' },
  });

  // Calculate current streak
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < checkIns.length; i++) {
    const checkDate = new Date(checkIns[i].checkDate);
    checkDate.setHours(0, 0, 0, 0);

    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);
    expectedDate.setHours(0, 0, 0, 0);

    if (checkDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else {
      break;
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let currentRun = 1;
  for (let i = 1; i < checkIns.length; i++) {
    const prev = new Date(checkIns[i - 1].checkDate);
    const curr = new Date(checkIns[i].checkDate);
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      currentRun++;
    } else {
      longestStreak = Math.max(longestStreak, currentRun);
      currentRun = 1;
    }
  }
  longestStreak = Math.max(longestStreak, currentRun);

  const checkedInToday = checkIns.length > 0 && (() => {
    const lastDate = new Date(checkIns[0].checkDate);
    lastDate.setHours(0, 0, 0, 0);
    return lastDate.getTime() === today.getTime();
  })();

  return res.json({
    currentStreak: streak,
    longestStreak,
    totalCheckIns: checkIns.length,
    totalXpEarned: checkIns.reduce((sum, c) => sum + c.xpEarned, 0),
    checkedInToday,
    recentActions: checkIns.slice(0, 7),
  });
});

// GET /streaks/leaderboard — top streaks
router.get('/leaderboard', requireAuth, async (_req, res: Response) => {
  const users = await prisma.user.findMany({
    where: { status: 'Active' },
    select: { id: true, name: true, greenCheckIns: { orderBy: { checkDate: 'desc' } } },
  });

  const leaderboard = users.map((u) => {
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < u.greenCheckIns.length; i++) {
      const checkDate = new Date(u.greenCheckIns[i].checkDate);
      checkDate.setHours(0, 0, 0, 0);
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      expected.setHours(0, 0, 0, 0);
      if (checkDate.getTime() === expected.getTime()) {
        streak++;
      } else {
        break;
      }
    }
    return { id: u.id, name: u.name, streak, totalCheckIns: u.greenCheckIns.length };
  });

  leaderboard.sort((a, b) => b.streak - a.streak || b.totalCheckIns - a.totalCheckIns);
  return res.json(leaderboard.slice(0, 20));
});

export default router;
