import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

// Emission factors for calculation (kg CO2e)
const COMMUTE_FACTORS: Record<string, number> = {
  car: 0.21,        // kg CO2 per km
  bus: 0.089,
  bike: 0,
  walk: 0,
  wfh: 0,
};

const MEAL_FACTORS: Record<string, number> = {
  vegan: 0.5,       // kg CO2 per meal
  vegetarian: 1.0,
  mixed: 2.5,
  meat_heavy: 5.0,
};

const ELECTRICITY_FACTOR = 0.5; // kg CO2 per kWh

// POST /carbon-calculator/calculate — calculate and log
router.post('/calculate', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { commuteMode, commuteKm, electricityKwh, mealType } = req.body;

    if (!commuteMode || !mealType) {
      return res.status(400).json({ error: 'commuteMode and mealType are required' });
    }

    const commuteCO2 = (COMMUTE_FACTORS[commuteMode] || 0) * (commuteKm || 0);
    const electricityCO2 = ELECTRICITY_FACTOR * (electricityKwh || 0);
    const mealCO2 = (MEAL_FACTORS[mealType] || 2.5) * 3; // 3 meals per day
    const totalCO2Kg = Math.round((commuteCO2 + electricityCO2 + mealCO2) * 100) / 100;

    const log = await prisma.carbonFootprintLog.create({
      data: {
        userId: req.user!.userId,
        commuteMode,
        commuteKm: commuteKm || 0,
        electricityKwh: electricityKwh || 0,
        mealType,
        totalCO2Kg,
      },
    });

    return res.status(201).json({
      ...log,
      breakdown: {
        commute: Math.round(commuteCO2 * 100) / 100,
        electricity: Math.round(electricityCO2 * 100) / 100,
        meals: Math.round(mealCO2 * 100) / 100,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /carbon-calculator/history — user's past logs
router.get('/history', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const logs = await prisma.carbonFootprintLog.findMany({
    where: { userId: req.user!.userId },
    orderBy: { logDate: 'desc' },
    take: 30,
  });
  return res.json(logs);
});

// GET /carbon-calculator/factors — return the emission factors for the UI
router.get('/factors', (_req: Request, res: Response) => {
  return res.json({
    commute: COMMUTE_FACTORS,
    meals: MEAL_FACTORS,
    electricity: ELECTRICITY_FACTOR,
  });
});

export default router;
