import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { hashPassword } from '../lib/auth';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// ── Admin-Only User Management ──
router.get('/admin/users', requireAdmin, async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    include: { department: true },
    orderBy: { name: 'asc' }
  });
  return res.json(users);
});

router.post('/admin/users', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, email, role, departmentId, password } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, role, and password are required' });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const passwordHash = hashPassword(password);
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        departmentId: departmentId ? parseInt(departmentId) : null,
      },
      include: { department: true }
    });
    return res.status(201).json(newUser);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create user' });
  }
});

router.patch('/admin/users', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id, name, email, role, departmentId, status, password } = req.body;
    if (!id) return res.status(400).json({ error: 'User ID is required' });

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (departmentId !== undefined) updateData.departmentId = departmentId ? parseInt(departmentId) : null;
    if (status) updateData.status = status;
    if (password) updateData.passwordHash = hashPassword(password);

    const updated = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { department: true }
    });
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

router.delete('/admin/users', requireAdmin, async (req: Request, res: Response) => {
  const id = req.query.id as string;
  if (!id) return res.status(400).json({ error: 'ID required' });
  await prisma.user.delete({ where: { id: parseInt(id) } });
  return res.json({ success: true });
});

// ── User Profile Details ──
router.get('/users/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: true,
        badges: { include: { badge: true } },
        challengeParticipations: { include: { challenge: { include: { category: true } } } },
        employeeParticipations: { include: { activity: { include: { category: true } } } },
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/users/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { name, email, departmentId, password } = req.body;

    const data: any = {};
    if (name) data.name = name;
    if (email) {
      const existing = await prisma.user.findFirst({ where: { email, NOT: { id: userId } } });
      if (existing) return res.status(400).json({ error: 'Email already in use' });
      data.email = email;
    }
    if (departmentId !== undefined) {
      data.departmentId = departmentId ? parseInt(departmentId) : null;
    }
    if (password) {
      data.passwordHash = hashPassword(password);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      include: { department: true },
    });
    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/users', requireAuth, async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true } });
  return res.json(users);
});

export default router;
