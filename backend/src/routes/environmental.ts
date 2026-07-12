import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireManager, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// ── Goals Endpoints ──
router.get('/environmental-goals', async (req: Request, res: Response) => {
  const goals = await prisma.environmentalGoal.findMany({
    include: { department: true },
    orderBy: { deadline: 'asc' },
  });
  return res.json(goals);
});

router.post('/environmental-goals', requireManager, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) return res.status(401).json({ error: 'User not found' });

    const reqDeptId = parseInt(data.departmentId);
    if (user.role === 'Manager' && user.departmentId !== reqDeptId) {
      return res.status(403).json({ error: 'Managers can only create goals for their own department.' });
    }

    const goal = await prisma.environmentalGoal.create({
      data: {
        name: data.name,
        departmentId: reqDeptId,
        targetCO2: parseFloat(data.targetCO2),
        currentCO2: parseFloat(data.currentCO2) || 0,
        deadline: new Date(data.deadline),
        status: data.status || 'Active',
      },
    });
    return res.status(201).json(goal);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/environmental-goals', requireManager, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) return res.status(401).json({ error: 'User not found' });

    const goal = await prisma.environmentalGoal.findUnique({ where: { id: parseInt(data.id) } });
    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    if (user.role === 'Manager' && user.departmentId !== goal.departmentId) {
      return res.status(403).json({ error: 'Managers can only update goals for their own department.' });
    }

    const updated = await prisma.environmentalGoal.update({
      where: { id: parseInt(data.id) },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.currentCO2 !== undefined && { currentCO2: parseFloat(data.currentCO2) }),
        ...(data.status && { status: data.status }),
      },
    });
    return res.json(updated);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/environmental-goals', requireManager, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.query.id as string;
    if (!id) return res.status(400).json({ error: 'ID required' });

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) return res.status(401).json({ error: 'User not found' });

    const goal = await prisma.environmentalGoal.findUnique({ where: { id: parseInt(id) } });
    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    if (user.role === 'Manager' && user.departmentId !== goal.departmentId) {
      return res.status(403).json({ error: 'Managers can only delete goals for their own department.' });
    }

    await prisma.environmentalGoal.delete({ where: { id: parseInt(id) } });
    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Carbon Transactions Endpoints ──
router.get('/carbon-transactions', async (req: Request, res: Response) => {
  const transactions = await prisma.carbonTransaction.findMany({
    include: { department: true, emissionFactor: true },
    orderBy: { transactionDate: 'desc' },
  });
  return res.json(transactions);
});

router.post('/carbon-transactions', requireManager, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) return res.status(401).json({ error: 'User not found' });

    const reqDeptId = parseInt(data.departmentId);
    if (user.role === 'Manager' && user.departmentId !== reqDeptId) {
      return res.status(403).json({ error: 'Managers can only log carbon transactions for their own department.' });
    }

    const emissionFactor = await prisma.emissionFactor.findUnique({
      where: { id: parseInt(data.emissionFactorId) },
    });
    if (!emissionFactor) return res.status(400).json({ error: 'Invalid emission factor' });

    const autoCalc = await prisma.eSGConfig.findUnique({ where: { key: 'auto_emission_calculation' } });
    const quantity = parseFloat(data.quantity);
    const calculatedEmissions = autoCalc?.value === 'true'
      ? quantity * emissionFactor.factorValue
      : parseFloat(data.calculatedEmissions) || 0;

    const transaction = await prisma.carbonTransaction.create({
      data: {
        departmentId: reqDeptId,
        sourceType: data.sourceType,
        quantity,
        emissionFactorId: emissionFactor.id,
        calculatedEmissions,
        transactionDate: data.transactionDate ? new Date(data.transactionDate) : new Date(),
      },
    });
    return res.status(201).json(transaction);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Emission Factors ──
router.get('/emission-factors', async (req: Request, res: Response) => {
  const factors = await prisma.emissionFactor.findMany({ orderBy: { activityType: 'asc' } });
  return res.json(factors);
});

router.post('/emission-factors', requireManager, async (req: Request, res: Response) => {
  const data = req.body;
  const factor = await prisma.emissionFactor.create({
    data: {
      activityType: data.activityType,
      factorValue: parseFloat(data.factorValue),
      unit: data.unit,
    },
  });
  return res.status(201).json(factor);
});

router.delete('/emission-factors', requireManager, async (req: Request, res: Response) => {
  const id = req.query.id as string;
  if (!id) return res.status(400).json({ error: 'ID required' });
  await prisma.emissionFactor.delete({ where: { id: parseInt(id) } });
  return res.json({ success: true });
});

// ── Product Profiles Endpoints ──
router.get('/product-profiles', async (req: Request, res: Response) => {
  const profiles = await prisma.productESGProfile.findMany({ orderBy: { id: 'desc' } });
  return res.json(profiles);
});

router.post('/product-profiles', requireManager, async (req: Request, res: Response) => {
  const data = req.body;
  const profile = await prisma.productESGProfile.create({
    data: {
      productName: data.productName,
      carbonFootprint: parseFloat(data.carbonFootprint),
      sustainabilityRating: data.sustainabilityRating || 'A',
      notes: data.notes || '',
    },
  });
  return res.status(201).json(profile);
});

router.delete('/product-profiles', requireManager, async (req: Request, res: Response) => {
  const id = req.query.id as string;
  if (!id) return res.status(400).json({ error: 'ID required' });
  await prisma.productESGProfile.delete({ where: { id: parseInt(id) } });
  return res.json({ success: true });
});

export default router;
