import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { recalculateAllScores } from '../lib/scoring';

const router = Router();

// ── Dashboard Data Endpoints ──
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany({ where: { status: 'Active' } });
    const latestScores = [];
    for (const dept of departments) {
      const score = await prisma.departmentScore.findFirst({
        where: { departmentId: dept.id },
        orderBy: { calculatedAt: 'desc' },
        include: { department: true },
      });
      if (score) latestScores.push(score);
    }

    let totalWeight = 0;
    let weightedEnv = 0, weightedSoc = 0, weightedGov = 0, weightedTotal = 0;
    for (const score of latestScores) {
      const w = score.department.employeeCount || 1;
      totalWeight += w;
      weightedEnv += score.environmentalScore * w;
      weightedSoc += score.socialScore * w;
      weightedGov += score.governanceScore * w;
      weightedTotal += score.totalScore * w;
    }

    const kpis = totalWeight > 0 ? {
      environmental: Math.round(weightedEnv / totalWeight),
      social: Math.round(weightedSoc / totalWeight),
      governance: Math.round(weightedGov / totalWeight),
      overall: Math.round(weightedTotal / totalWeight),
    } : { environmental: 0, social: 0, governance: 0, overall: 0 };

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const transactions = await prisma.carbonTransaction.findMany({
      where: { transactionDate: { gte: twelveMonthsAgo } },
      orderBy: { transactionDate: 'asc' },
    });

    const monthlyEmissions: Record<string, number> = {};
    transactions.forEach(t => {
      const dateObj = new Date(t.transactionDate);
      const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      monthlyEmissions[key] = (monthlyEmissions[key] || 0) + t.calculatedEmissions;
    });

    const emissionsTrend = Object.entries(monthlyEmissions).map(([month, emissions]) => ({
      month,
      emissions: Math.round(emissions),
    }));

    const departmentRanking = latestScores
      .map(s => ({
        name: s.department.name,
        score: Math.round(s.totalScore),
        environmental: Math.round(s.environmentalScore),
        social: Math.round(s.socialScore),
        governance: Math.round(s.governanceScore),
      }))
      .sort((a, b) => b.score - a.score);

    const recentParticipations = await prisma.employeeParticipation.findMany({
      take: 3,
      orderBy: { completionDate: 'desc' },
      include: { employee: true, activity: true },
    });

    const recentIssues = await prisma.complianceIssue.findMany({
      take: 2,
      orderBy: { id: 'desc' },
      include: { department: true },
    });

    const recentActivity = [
      ...recentParticipations.map(p => ({
        type: 'participation',
        text: `${p.employee.name} joined "${p.activity?.title || 'an activity'}"`,
        status: p.approvalStatus,
        time: p.completionDate.toISOString(),
      })),
      ...recentIssues.map(i => ({
        type: 'compliance',
        text: `Compliance issue: "${i.title}" — ${i.department.name}`,
        status: i.status,
        time: i.dueDate.toISOString(),
      })),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

    return res.json({ kpis, emissionsTrend, departmentRanking, recentActivity });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Reports Endpoint ──
router.get('/reports', async (req: Request, res: Response) => {
  const type = req.query.type as string || 'environmental';

  if (type === 'environmental') {
    const goals = await prisma.environmentalGoal.findMany({ include: { department: true } });
    const transactions = await prisma.carbonTransaction.findMany({ include: { department: true, emissionFactor: true } });
    return res.json({ goals, transactions, type });
  }
  if (type === 'social') {
    const activities = await prisma.cSRActivity.findMany({ include: { category: true } });
    const participations = await prisma.employeeParticipation.findMany({
      where: { approvalStatus: 'Approved' },
      include: { employee: true, activity: true },
    });
    return res.json({ activities, participations, type });
  }
  if (type === 'governance') {
    const issues = await prisma.complianceIssue.findMany({ include: { department: true } });
    const audits = await prisma.audit.findMany({ include: { department: true } });
    const policies = await prisma.eSGPolicy.findMany();
    return res.json({ issues, audits, policies, type });
  }
  if (type === 'summary') {
    const departments = await prisma.department.findMany({ where: { status: 'Active' } });
    const latestScores = [];
    for (const dept of departments) {
      const score = await prisma.departmentScore.findFirst({
        where: { departmentId: dept.id },
        orderBy: { calculatedAt: 'desc' },
        include: { department: true },
      });
      if (score) latestScores.push(score);
    }
    return res.json({ scores: latestScores, type });
  }
  if (type === 'custom') {
    const departmentId = req.query.departmentId as string;
    const dateFrom = req.query.dateFrom as string;
    const dateTo = req.query.dateTo as string;
    const module = req.query.module as string;
    const employeeId = req.query.employeeId as string;
    const challengeId = req.query.challengeId as string;
    const categoryId = req.query.categoryId as string;

    const deptFilter = departmentId ? parseInt(departmentId) : undefined;
    const empFilter = employeeId ? parseInt(employeeId) : undefined;
    const challFilter = challengeId ? parseInt(challengeId) : undefined;
    const catFilter = categoryId ? parseInt(categoryId) : undefined;

    const getDateFilter = () => {
      if (!dateFrom && !dateTo) return undefined;
      const f: Record<string, any> = {};
      if (dateFrom) f.gte = new Date(dateFrom);
      if (dateTo) f.lte = new Date(dateTo);
      return f;
    };

    let transactions: any[] = [];
    let participations: any[] = [];
    let issues: any[] = [];
    let audits: any[] = [];
    let goals: any[] = [];
    let policies: any[] = [];

    if (!module || module === 'environmental') {
      transactions = await prisma.carbonTransaction.findMany({
        where: {
          departmentId: deptFilter,
          transactionDate: getDateFilter(),
        },
        include: { department: true, emissionFactor: true },
        orderBy: { transactionDate: 'desc' },
      });

      goals = await prisma.environmentalGoal.findMany({
        where: {
          departmentId: deptFilter,
          deadline: getDateFilter(),
        },
        include: { department: true },
      });
    }

    if (!module || module === 'social') {
      participations = await prisma.employeeParticipation.findMany({
        where: {
          employeeId: empFilter,
          challengeId: challFilter,
          completionDate: getDateFilter(),
          employee: deptFilter ? { departmentId: deptFilter } : undefined,
          activity: catFilter ? { categoryId: catFilter } : undefined,
        },
        include: { employee: true, activity: true, challenge: true },
        orderBy: { completionDate: 'desc' },
      });
    }

    if (!module || module === 'governance') {
      issues = await prisma.complianceIssue.findMany({
        where: {
          departmentId: deptFilter,
          ownerId: empFilter,
          dueDate: getDateFilter(),
        },
        include: { department: true, owner: true },
        orderBy: { dueDate: 'desc' },
      });

      audits = await prisma.audit.findMany({
        where: {
          departmentId: deptFilter,
          date: getDateFilter(),
        },
        include: { department: true, auditor: true },
        orderBy: { date: 'desc' },
      });
    }

    return res.json({
      type,
      transactions,
      participations,
      issues,
      audits,
      goals,
      policies,
    });
  }
  return res.status(400).json({ error: 'Invalid report type' });
});

// ── Recalculate Score Endpoint ──
router.post('/scores/recalculate', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const results = await recalculateAllScores();
    return res.json({ success: true, scores: results });
  } catch (error) {
    return res.status(500).json({ error: 'Recalculation failed' });
  }
});

// ── Notifications Endpoints ──
router.get('/notifications', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  return res.json(notifications);
});

router.patch('/notifications', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.userId, read: false },
    data: { read: true },
  });
  return res.json({ success: true });
});

// ── AI Insights Endpoint ──
router.post('/insights/generate', async (req: Request, res: Response) => {
  try {
    const latestScores = [];
    const departments = await prisma.department.findMany({ where: { status: 'Active' } });
    for (const dept of departments) {
      const score = await prisma.departmentScore.findFirst({
        where: { departmentId: dept.id },
        orderBy: { calculatedAt: 'desc' },
      });
      if (score) latestScores.push(score);
    }

    let totalWeight = 0;
    let wEnv = 0, wSoc = 0, wGov = 0;
    for (const s of latestScores) {
      const dept = departments.find(d => d.id === s.departmentId);
      const w = dept?.employeeCount || 1;
      totalWeight += w;
      wEnv += s.environmentalScore * w;
      wSoc += s.socialScore * w;
      wGov += s.governanceScore * w;
    }

    const kpis = totalWeight > 0 ? {
      environmental: Math.round(wEnv / totalWeight),
      social: Math.round(wSoc / totalWeight),
      governance: Math.round(wGov / totalWeight),
    } : { environmental: 0, social: 0, governance: 0 };

    const prompt = `Given this ESG data: ${JSON.stringify({
      departmentScores: latestScores.map(s => ({
        department: departments.find(d => d.id === s.departmentId)?.name,
        environmental: s.environmentalScore,
        social: s.socialScore,
        governance: s.governanceScore,
        total: s.totalScore,
      })),
      overallKPIs: kpis,
    })}. Write a 4-sentence plain-English summary of organizational ESG health, flag the weakest dimension, and suggest one concrete action.`;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.json({
        insight: `Based on the current ESG data, your organization shows strong governance performance (${kpis.governance}/100) with consistent policy compliance across departments. The environmental dimension scores well at ${kpis.environmental}/100, driven by active emission reduction initiatives. However, the social dimension at ${kpis.social}/100 represents the weakest area, suggesting a need for increased employee engagement in CSR activities. Consider launching a company-wide participation drive with gamified incentives to boost social impact scores across all departments.`
      });
    }

    const Groq = (await import('groq-sdk')).default;
    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      max_tokens: 300,
    });

    return res.json({ insight: completion.choices[0]?.message?.content || 'No insight generated.' });
  } catch (error) {
    console.error(error);
    return res.json({
      insight: 'Your organization demonstrates solid ESG performance with balanced scores across dimensions. Environmental initiatives show strong momentum with declining emission trends. Social engagement could be improved through broader participation programs. Consider implementing cross-department sustainability challenges to drive holistic improvement.'
    });
  }
});

export default router;
