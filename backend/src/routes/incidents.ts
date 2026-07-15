import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

// GET /incidents — list incidents (admin sees all, employees see own non-anonymous)
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) return res.status(401).json({ error: 'User not found' });

  let incidents;
  if (user.role === 'Admin' || user.role === 'Manager') {
    incidents = await prisma.incidentReport.findMany({
      include: { reporter: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  } else {
    incidents = await prisma.incidentReport.findMany({
      where: { reporterId: user.id },
      include: { reporter: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Hide reporter info for anonymous reports (unless admin)
  const result = incidents.map((inc) => ({
    ...inc,
    reporter: inc.isAnonymous && user.role !== 'Admin' ? null : inc.reporter,
    reporterId: inc.isAnonymous && user.role !== 'Admin' ? null : inc.reporterId,
  }));

  return res.json(result);
});

// POST /incidents — create a new incident report
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, category, severity, isAnonymous } = req.body;

    if (!title || !description || !category || !severity) {
      return res.status(400).json({ error: 'title, description, category, severity are required' });
    }

    const incident = await prisma.incidentReport.create({
      data: {
        title,
        description,
        category,
        severity,
        isAnonymous: isAnonymous || false,
        reporterId: isAnonymous ? null : req.user!.userId,
      },
    });

    return res.status(201).json(incident);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /incidents/:id — update status (admin/manager only)
router.patch('/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, resolution } = req.body;
    const id = parseInt(req.params.id);

    const data: Record<string, unknown> = {};
    if (status) data.status = status;
    if (resolution !== undefined) data.resolution = resolution;
    if (status === 'Resolved') data.resolvedAt = new Date();

    const updated = await prisma.incidentReport.update({
      where: { id },
      data,
    });

    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
