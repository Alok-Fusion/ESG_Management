import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// ── Leaderboard Endpoints ──
router.get('/leaderboard', async (req: Request, res: Response) => {
  const topUsers = await prisma.user.findMany({
    where: { status: 'Active' },
    orderBy: { xpTotal: 'desc' },
    select: { id: true, name: true, xpTotal: true, department: { select: { name: true } } },
    take: 10,
  });
  const departments = await prisma.department.findMany({
    where: { status: 'Active' },
    include: { employees: { select: { xpTotal: true } } },
  });
  const deptScores = departments.map(d => ({
    id: d.id,
    name: d.name,
    xp: d.employees.reduce((sum, e) => sum + e.xpTotal, 0),
    type: 'department' as const,
  })).sort((a, b) => b.xp - a.xp);

  const combined = [
    ...topUsers.map(u => ({ name: u.name, xp: u.xpTotal, type: 'user' as const, dept: u.department?.name })),
    ...deptScores.map(d => ({ name: `${d.name} Dept`, xp: d.xp, type: 'department' as const, dept: undefined })),
  ].sort((a, b) => b.xp - a.xp);

  return res.json(combined);
});

// ── Badges Endpoints ──
router.get('/badges', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const badges = await prisma.badge.findMany();
  const userBadges = await prisma.userBadge.findMany({
    where: { userId: req.user!.userId },
    select: { badgeId: true },
  });
  return res.json({
    allBadges: badges,
    userBadges: userBadges.map(ub => ub.badgeId),
  });
});

// ── Rewards Endpoints ──
router.get('/rewards', async (req: Request, res: Response) => {
  const rewards = await prisma.reward.findMany({ where: { status: 'Active' }, orderBy: { pointsRequired: 'asc' } });
  return res.json(rewards);
});

router.post('/rewards', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { rewardId } = req.body;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const reward = await tx.reward.findUnique({ where: { id: parseInt(rewardId) } });
      if (!reward) throw new Error('Reward not found');
      if (reward.stock <= 0) throw new Error('Out of stock');

      const user = await tx.user.findUnique({ where: { id: req.user!.userId } });
      if (!user) throw new Error('User not found');
      if (user.pointsBalance < reward.pointsRequired) throw new Error('Insufficient points');

      await tx.reward.update({
        where: { id: reward.id },
        data: { stock: { decrement: 1 } },
      });
      await tx.user.update({
        where: { id: user.id },
        data: { pointsBalance: { decrement: reward.pointsRequired } },
      });
      return tx.rewardRedemption.create({
        data: { employeeId: user.id, rewardId: reward.id, pointsDeducted: reward.pointsRequired, status: 'Completed' },
      });
    });
    return res.status(201).json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Redemption failed' });
  }
});

// ── Departments CRUD ──
router.get('/departments', async (req: Request, res: Response) => {
  const departments = await prisma.department.findMany({
    include: { head: { select: { name: true } }, parentDepartment: { select: { name: true } } },
    orderBy: { name: 'asc' },
  });
  return res.json(departments);
});

router.post('/departments', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const data = req.body;
  const dept = await prisma.department.create({
    data: {
      name: data.name,
      code: data.code,
      headUserId: data.headUserId ? parseInt(data.headUserId) : null,
      parentDepartmentId: data.parentDepartmentId ? parseInt(data.parentDepartmentId) : null,
      employeeCount: parseInt(data.employeeCount) || 0,
      status: data.status || 'Active',
    },
  });
  return res.status(201).json(dept);
});

router.patch('/departments', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const data = req.body;
  const updated = await prisma.department.update({
    where: { id: parseInt(data.id) },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.code && { code: data.code }),
      ...(data.employeeCount !== undefined && { employeeCount: parseInt(data.employeeCount) }),
      ...(data.status && { status: data.status }),
    },
  });
  return res.json(updated);
});

router.delete('/departments', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const id = req.query.id as string;
  if (!id) return res.status(400).json({ error: 'ID required' });
  await prisma.department.delete({ where: { id: parseInt(id) } });
  return res.json({ success: true });
});

// ── Categories CRUD ──
router.get('/categories', async (req: Request, res: Response) => {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  return res.json(categories);
});

router.post('/categories', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const data = req.body;
  const category = await prisma.category.create({
    data: { name: data.name, type: data.type, status: 'Active' },
  });
  return res.status(201).json(category);
});

router.delete('/categories', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const id = req.query.id as string;
  if (!id) return res.status(400).json({ error: 'ID required' });
  await prisma.category.delete({ where: { id: parseInt(id) } });
  return res.json({ success: true });
});

// ── Config Settings ──
router.get('/settings', async (req: Request, res: Response) => {
  const configs = await prisma.eSGConfig.findMany();
  const configMap: Record<string, string> = {};
  configs.forEach(c => { configMap[c.key] = c.value; });
  return res.json(configMap);
});

router.patch('/settings', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const updates = req.body;
  for (const [key, value] of Object.entries(updates)) {
    await prisma.eSGConfig.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });
  }
  return res.json({ success: true });
});

export default router;
