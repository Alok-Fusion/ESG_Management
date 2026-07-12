import { prisma } from './prisma';

export async function environmentalScore(departmentId: number): Promise<number> {
  const goals = await prisma.environmentalGoal.findMany({
    where: { departmentId, status: { in: ['Active', 'On Track'] } },
  });
  if (goals.length === 0) return 100;
  const totalProgress = goals.reduce((sum, g) => {
    const progress = g.targetCO2 > 0 ? Math.min((1 - g.currentCO2 / g.targetCO2) * 100, 100) : 100;
    return sum + Math.max(progress, 0);
  }, 0);
  return Math.round(totalProgress / goals.length);
}

export async function socialScore(departmentId: number): Promise<number> {
  const dept = await prisma.department.findUnique({ where: { id: departmentId } });
  if (!dept || dept.employeeCount === 0) return 0;

  const employees = await prisma.user.findMany({
    where: { departmentId },
    select: { id: true },
  });
  const employeeIds = employees.map(e => e.id);
  if (employeeIds.length === 0) return 0;

  const approvedCount = await prisma.employeeParticipation.count({
    where: {
      employeeId: { in: employeeIds },
      approvalStatus: 'Approved',
    },
  });

  return Math.min(Math.round((approvedCount / dept.employeeCount) * 100), 100);
}

export async function governanceScore(departmentId: number): Promise<number> {
  const totalIssues = await prisma.complianceIssue.count({
    where: { departmentId },
  });
  if (totalIssues === 0) return 100;

  const resolvedCount = await prisma.complianceIssue.count({
    where: { departmentId, status: 'Resolved' },
  });

  const overdueCount = await prisma.complianceIssue.count({
    where: {
      departmentId,
      status: 'Open',
      dueDate: { lt: new Date() },
    },
  });

  const baseScore = (resolvedCount / totalIssues) * 100;
  const penalty = overdueCount * 10;
  return Math.max(Math.round(baseScore - penalty), 0);
}

export async function getWeights(): Promise<{ env: number; social: number; gov: number }> {
  const envW = await prisma.eSGConfig.findUnique({ where: { key: 'weight_environmental' } });
  const socW = await prisma.eSGConfig.findUnique({ where: { key: 'weight_social' } });
  const govW = await prisma.eSGConfig.findUnique({ where: { key: 'weight_governance' } });
  return {
    env: envW ? parseFloat(envW.value) / 100 : 0.4,
    social: socW ? parseFloat(socW.value) / 100 : 0.3,
    gov: govW ? parseFloat(govW.value) / 100 : 0.3,
  };
}

export async function departmentTotalScore(departmentId: number): Promise<{
  envScore: number;
  socScore: number;
  govScore: number;
  total: number;
}> {
  const envScore = await environmentalScore(departmentId);
  const socScore = await socialScore(departmentId);
  const govScore = await governanceScore(departmentId);
  const weights = await getWeights();
  const total = Math.round(envScore * weights.env + socScore * weights.social + govScore * weights.gov);
  return { envScore, socScore, govScore, total };
}

export async function overallESGScore(): Promise<{
  environmental: number;
  social: number;
  governance: number;
  overall: number;
}> {
  const departments = await prisma.department.findMany({ where: { status: 'Active' } });
  let totalWeight = 0;
  let weightedEnv = 0;
  let weightedSoc = 0;
  let weightedGov = 0;
  let weightedTotal = 0;

  for (const dept of departments) {
    const scores = await departmentTotalScore(dept.id);
    const w = dept.employeeCount || 1;
    totalWeight += w;
    weightedEnv += scores.envScore * w;
    weightedSoc += scores.socScore * w;
    weightedGov += scores.govScore * w;
    weightedTotal += scores.total * w;
  }

  if (totalWeight === 0) {
    return { environmental: 0, social: 0, governance: 0, overall: 0 };
  }

  return {
    environmental: Math.round(weightedEnv / totalWeight),
    social: Math.round(weightedSoc / totalWeight),
    governance: Math.round(weightedGov / totalWeight),
    overall: Math.round(weightedTotal / totalWeight),
  };
}

export async function recalculateAllScores() {
  const departments = await prisma.department.findMany({ where: { status: 'Active' } });
  const results = [];

  for (const dept of departments) {
    const scores = await departmentTotalScore(dept.id);
    const record = await prisma.departmentScore.create({
      data: {
        departmentId: dept.id,
        environmentalScore: scores.envScore,
        socialScore: scores.socScore,
        governanceScore: scores.govScore,
        totalScore: scores.total,
      },
    });
    results.push(record);
  }

  return results;
}
