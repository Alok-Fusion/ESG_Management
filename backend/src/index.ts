import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { prisma } from './lib/prisma';
import { hashPassword, verifyPassword, signToken, getSession, JWTPayload } from './lib/auth';
import { checkAndAwardBadges } from './lib/badges';
import { notifyComplianceIssue, notifyParticipationApproved, notifyParticipationRejected } from './lib/notifications';
import { environmentalScore, socialScore, governanceScore, departmentTotalScore, overallESGScore, recalculateAllScores } from './lib/scoring';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Auth middleware helper
interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const session = getSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.user = session;
  next();
}

// ── Auth Endpoints ──
app.post('/api/auth/signup', async (req: Request, res: Response) => {
  try {
    const { name, email, password, departmentId } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const passwordHash = hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'Employee',
        departmentId: departmentId ? parseInt(departmentId) : null,
      },
    });
    const token = signToken({ userId: user.id, email: user.email, role: user.role, name: user.name });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    return res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = signToken({ userId: user.id, email: user.email, role: user.role, name: user.name });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId,
        xpTotal: user.xpTotal,
        pointsBalance: user.pointsBalance,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  res.cookie('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return res.json({ success: true });
});

app.get('/api/auth/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, name: true, email: true, role: true, departmentId: true, xpTotal: true, pointsBalance: true, status: true },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({ user });
});

// ── User Profile Details ──
app.get('/api/users/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: true,
        badges: {
          include: { badge: true }
        },
        challengeParticipations: {
          include: { challenge: true }
        },
        employeeParticipations: {
          include: { activity: true }
        }
      }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/users/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { name, email, departmentId, password } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (departmentId) updateData.departmentId = parseInt(departmentId);
    if (password) {
      updateData.passwordHash = hashPassword(password);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: { department: true }
    });

    return res.json(updatedUser);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Dashboard Data Endpoints ──
app.get('/api/dashboard', async (req: Request, res: Response) => {
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

// ── CSR Activity Endpoints ──
app.get('/api/csr-activities', async (req: Request, res: Response) => {
  const activities = await prisma.cSRActivity.findMany({
    include: { category: true, department: true },
    orderBy: { id: 'desc' },
  });
  return res.json(activities);
});

app.post('/api/csr-activities', async (req: Request, res: Response) => {
  const data = req.body;
  const activity = await prisma.cSRActivity.create({
    data: {
      title: data.title,
      categoryId: data.categoryId ? parseInt(data.categoryId) : null,
      icon: data.icon || '🌱',
      description: data.description || '',
      departmentId: data.departmentId ? parseInt(data.departmentId) : null,
      evidenceRequired: data.evidenceRequired || false,
      status: 'Open',
    },
  });
  return res.status(201).json(activity);
});

app.post('/api/csr-activities/join', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { activityId } = req.body;
  const activity = await prisma.cSRActivity.findUnique({ where: { id: parseInt(activityId) } });
  if (!activity) return res.status(404).json({ error: 'Activity not found' });

  await prisma.cSRActivity.update({
    where: { id: activity.id },
    data: { joinCount: activity.joinCount + 1 },
  });

  const participation = await prisma.employeeParticipation.create({
    data: {
      employeeId: req.user!.userId,
      activityId: activity.id,
      pointsEarned: 25,
      approvalStatus: 'Pending',
    },
  });
  return res.status(201).json(participation);
});

// ── Participations Endpoints ──
app.get('/api/participations', async (req: Request, res: Response) => {
  const participations = await prisma.employeeParticipation.findMany({
    include: { employee: true, activity: true, challenge: true },
    orderBy: { completionDate: 'desc' },
  });
  return res.json(participations);
});

app.patch('/api/participations', async (req: Request, res: Response) => {
  const { id, approvalStatus } = req.body;
  const participation = await prisma.employeeParticipation.findUnique({
    where: { id: parseInt(id) },
    include: { activity: true, challenge: true },
  });
  if (!participation) return res.status(404).json({ error: 'Not found' });

  const evidenceConfig = await prisma.eSGConfig.findUnique({ where: { key: 'require_evidence' } });
  if (evidenceConfig?.value === 'true' && approvalStatus === 'Approved') {
    const needsEvidence = participation.activity?.evidenceRequired || participation.challenge?.evidenceRequired;
    if (needsEvidence && !participation.proofFileName) {
      return res.status(400).json({ error: 'Evidence required but not provided' });
    }
  }

  const updated = await prisma.employeeParticipation.update({
    where: { id: parseInt(id) },
    data: { approvalStatus },
  });

  if (approvalStatus === 'Approved') {
    await prisma.user.update({
      where: { id: participation.employeeId },
      data: {
        pointsBalance: { increment: participation.pointsEarned },
        xpTotal: { increment: participation.pointsEarned },
      },
    });
    const title = participation.activity?.title || participation.challenge?.title || 'an activity';
    await notifyParticipationApproved(participation.employeeId, title, participation.pointsEarned);
    await checkAndAwardBadges(participation.employeeId);
  } else if (approvalStatus === 'Rejected') {
    const title = participation.activity?.title || participation.challenge?.title || 'an activity';
    await notifyParticipationRejected(participation.employeeId, title);
  }
  return res.json(updated);
});

// ── Challenges Endpoints ──
app.get('/api/challenges', async (req: Request, res: Response) => {
  const challenges = await prisma.challenge.findMany({
    include: { category: true },
    orderBy: { id: 'desc' },
  });
  return res.json(challenges);
});

app.post('/api/challenges', async (req: Request, res: Response) => {
  const data = req.body;
  const challenge = await prisma.challenge.create({
    data: {
      title: data.title,
      categoryId: data.categoryId ? parseInt(data.categoryId) : null,
      description: data.description || '',
      xp: parseInt(data.xp) || 0,
      difficulty: data.difficulty || 'Medium',
      evidenceRequired: data.evidenceRequired || false,
      deadline: new Date(data.deadline),
      status: data.status || 'Draft',
    },
  });
  return res.status(201).json(challenge);
});

app.patch('/api/challenges', async (req: Request, res: Response) => {
  const { id, status } = req.body;
  const validTransitions: Record<string, string[]> = {
    'Draft': ['Active'],
    'Active': ['UnderReview', 'Archived'],
    'UnderReview': ['Completed', 'Active'],
    'Completed': ['Archived'],
    'Archived': [],
  };
  const challenge = await prisma.challenge.findUnique({ where: { id: parseInt(id) } });
  if (!challenge) return res.status(404).json({ error: 'Not found' });

  const allowed = validTransitions[challenge.status] || [];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `Cannot transition from ${challenge.status} to ${status}` });
  }

  const updated = await prisma.challenge.update({
    where: { id: parseInt(id) },
    data: { status },
  });
  return res.json(updated);
});

// ── Challenge Participation Endpoints ──
app.get('/api/challenge-participations', async (req: Request, res: Response) => {
  const participations = await prisma.challengeParticipation.findMany({
    include: { employee: true, challenge: true },
    orderBy: { id: 'desc' },
  });
  return res.json(participations);
});

app.post('/api/challenge-participations', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { challengeId } = req.body;
  const challenge = await prisma.challenge.findUnique({ where: { id: parseInt(challengeId) } });
  if (!challenge || challenge.status !== 'Active') {
    return res.status(400).json({ error: 'Challenge not available' });
  }
  const existing = await prisma.challengeParticipation.findFirst({
    where: { challengeId: challenge.id, employeeId: req.user!.userId },
  });
  if (existing) return res.status(409).json({ error: 'Already participating' });

  const participation = await prisma.challengeParticipation.create({
    data: {
      challengeId: challenge.id,
      employeeId: req.user!.userId,
      progressPct: 0,
      approvalStatus: 'Pending',
    },
  });
  return res.status(201).json(participation);
});

app.patch('/api/challenge-participations', async (req: Request, res: Response) => {
  const { id, approvalStatus } = req.body;
  const participation = await prisma.challengeParticipation.findUnique({
    where: { id: parseInt(id) },
    include: { challenge: true },
  });
  if (!participation) return res.status(404).json({ error: 'Not found' });

  const evidenceConfig = await prisma.eSGConfig.findUnique({ where: { key: 'require_evidence' } });
  if (evidenceConfig?.value === 'true' && approvalStatus === 'Approved') {
    if (participation.challenge.evidenceRequired && !participation.proofFileName) {
      return res.status(400).json({ error: 'Evidence required but not provided' });
    }
  }

  const xpAwarded = approvalStatus === 'Approved' ? participation.challenge.xp : 0;
  const updated = await prisma.challengeParticipation.update({
    where: { id: parseInt(id) },
    data: { approvalStatus, xpAwarded, progressPct: approvalStatus === 'Approved' ? 100 : participation.progressPct },
  });

  if (approvalStatus === 'Approved') {
    await prisma.user.update({
      where: { id: participation.employeeId },
      data: { xpTotal: { increment: xpAwarded } },
    });
    await notifyParticipationApproved(participation.employeeId, participation.challenge.title, xpAwarded);
    await checkAndAwardBadges(participation.employeeId);
  } else if (approvalStatus === 'Rejected') {
    await notifyParticipationRejected(participation.employeeId, participation.challenge.title);
  }
  return res.json(updated);
});

// ── Badges Endpoints ──
app.get('/api/badges', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
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

// ── Leaderboard Endpoints ──
app.get('/api/leaderboard', async (req: Request, res: Response) => {
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

// ── Rewards Endpoints ──
app.get('/api/rewards', async (req: Request, res: Response) => {
  const rewards = await prisma.reward.findMany({ where: { status: 'Active' }, orderBy: { pointsRequired: 'asc' } });
  return res.json(rewards);
});

app.post('/api/rewards', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
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

// ── Audits Endpoints ──
app.get('/api/audits', async (req: Request, res: Response) => {
  const audits = await prisma.audit.findMany({
    include: { department: true, auditor: true },
    orderBy: { date: 'desc' },
  });
  return res.json(audits);
});

app.post('/api/audits', async (req: Request, res: Response) => {
  const data = req.body;
  const audit = await prisma.audit.create({
    data: {
      title: data.title,
      departmentId: parseInt(data.departmentId),
      auditorId: parseInt(data.auditorId),
      date: new Date(data.date),
      findings: data.findings || '',
      status: data.status || 'UnderReview',
    },
  });
  return res.status(201).json(audit);
});

// ── Compliance Endpoints ──
app.get('/api/compliance-issues', async (req: Request, res: Response) => {
  const issues = await prisma.complianceIssue.findMany({
    include: { department: true, owner: true, audit: true },
    orderBy: { id: 'desc' },
  });
  const now = new Date();
  const enriched = issues.map(issue => ({
    ...issue,
    isOverdue: issue.status === 'Open' && new Date(issue.dueDate) < now,
  }));
  return res.json(enriched);
});

app.post('/api/compliance-issues', async (req: Request, res: Response) => {
  const data = req.body;
  if (!data.ownerId) return res.status(400).json({ error: 'Owner is required' });
  if (!data.dueDate) return res.status(400).json({ error: 'Due date is required' });
  if (!data.title) return res.status(400).json({ error: 'Title is required' });

  const issue = await prisma.complianceIssue.create({
    data: {
      title: data.title,
      auditId: data.auditId ? parseInt(data.auditId) : null,
      severity: data.severity || 'Medium',
      departmentId: parseInt(data.departmentId),
      ownerId: parseInt(data.ownerId),
      dueDate: new Date(data.dueDate),
      status: 'Open',
    },
  });
  await notifyComplianceIssue(issue.title, issue.ownerId);
  return res.status(201).json(issue);
});

app.patch('/api/compliance-issues', async (req: Request, res: Response) => {
  const { id, status } = req.body;
  const updated = await prisma.complianceIssue.update({
    where: { id: parseInt(id) },
    data: { status },
  });
  return res.json(updated);
});

// ── Policies Endpoints ──
app.get('/api/policies', async (req: Request, res: Response) => {
  const policies = await prisma.eSGPolicy.findMany({ orderBy: { publishedDate: 'desc' } });
  return res.json(policies);
});

app.post('/api/policies', async (req: Request, res: Response) => {
  const data = req.body;
  const policy = await prisma.eSGPolicy.create({
    data: {
      title: data.title,
      description: data.description || '',
      category: data.category || 'General',
      version: data.version || '1.0',
      mandatory: data.mandatory || false,
    },
  });
  return res.status(201).json(policy);
});

app.delete('/api/policies', async (req: Request, res: Response) => {
  const id = req.query.id as string;
  if (!id) return res.status(400).json({ error: 'ID required' });
  await prisma.eSGPolicy.delete({ where: { id: parseInt(id) } });
  return res.json({ success: true });
});

// ── Policy Acknowledgements ──
app.get('/api/policy-acknowledgements', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const acknowledgements = await prisma.policyAcknowledgement.findMany({
    where: { employeeId: req.user!.userId },
    include: { policy: true },
  });
  const allPolicies = await prisma.eSGPolicy.findMany();
  const ackPolicyIds = new Set(acknowledgements.map(a => a.policyId));
  const unacknowledged = allPolicies.filter(p => !ackPolicyIds.has(p.id));
  return res.json({ acknowledgements, unacknowledged });
});

app.post('/api/policy-acknowledgements', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { policyId } = req.body;
  const ack = await prisma.policyAcknowledgement.upsert({
    where: {
      policyId_employeeId: {
        policyId: parseInt(policyId),
        employeeId: req.user!.userId,
      },
    },
    update: { status: 'Acknowledged', acknowledgedAt: new Date() },
    create: { policyId: parseInt(policyId), employeeId: req.user!.userId, status: 'Acknowledged', acknowledgedAt: new Date() },
  });
  return res.json(ack);
});

// ── Goals Endpoints ──
app.get('/api/environmental-goals', async (req: Request, res: Response) => {
  const goals = await prisma.environmentalGoal.findMany({
    include: { department: true },
    orderBy: { deadline: 'asc' },
  });
  return res.json(goals);
});

app.post('/api/environmental-goals', async (req: Request, res: Response) => {
  const data = req.body;
  const goal = await prisma.environmentalGoal.create({
    data: {
      name: data.name,
      departmentId: parseInt(data.departmentId),
      targetCO2: parseFloat(data.targetCO2),
      currentCO2: parseFloat(data.currentCO2) || 0,
      deadline: new Date(data.deadline),
      status: data.status || 'Active',
    },
  });
  return res.status(201).json(goal);
});

app.patch('/api/environmental-goals', async (req: Request, res: Response) => {
  const data = req.body;
  const updated = await prisma.environmentalGoal.update({
    where: { id: parseInt(data.id) },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.currentCO2 !== undefined && { currentCO2: parseFloat(data.currentCO2) }),
      ...(data.status && { status: data.status }),
    },
  });
  return res.json(updated);
});

app.delete('/api/environmental-goals', async (req: Request, res: Response) => {
  const id = req.query.id as string;
  if (!id) return res.status(400).json({ error: 'ID required' });
  await prisma.environmentalGoal.delete({ where: { id: parseInt(id) } });
  return res.json({ success: true });
});

// ── Carbon Transactions Endpoints ──
app.get('/api/carbon-transactions', async (req: Request, res: Response) => {
  const transactions = await prisma.carbonTransaction.findMany({
    include: { department: true, emissionFactor: true },
    orderBy: { transactionDate: 'desc' },
  });
  return res.json(transactions);
});

app.post('/api/carbon-transactions', async (req: Request, res: Response) => {
  const data = req.body;
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
      departmentId: parseInt(data.departmentId),
      sourceType: data.sourceType,
      quantity,
      emissionFactorId: emissionFactor.id,
      calculatedEmissions,
      transactionDate: data.transactionDate ? new Date(data.transactionDate) : new Date(),
    },
  });
  return res.status(201).json(transaction);
});

// ── Emission Factors ──
app.get('/api/emission-factors', async (req: Request, res: Response) => {
  const factors = await prisma.emissionFactor.findMany({ orderBy: { activityType: 'asc' } });
  return res.json(factors);
});

app.post('/api/emission-factors', async (req: Request, res: Response) => {
  const data = req.body;
  const factor = await prisma.emissionFactor.create({
    data: { activityType: data.activityType, factorValue: parseFloat(data.factorValue), unit: data.unit },
  });
  return res.status(201).json(factor);
});

app.delete('/api/emission-factors', async (req: Request, res: Response) => {
  const id = req.query.id as string;
  if (!id) return res.status(400).json({ error: 'ID required' });
  await prisma.emissionFactor.delete({ where: { id: parseInt(id) } });
  return res.json({ success: true });
});

// ── Product ESG Profiles ──
app.get('/api/product-profiles', async (req: Request, res: Response) => {
  const profiles = await prisma.productESGProfile.findMany({ orderBy: { productName: 'asc' } });
  return res.json(profiles);
});

app.post('/api/product-profiles', async (req: Request, res: Response) => {
  const data = req.body;
  const profile = await prisma.productESGProfile.create({
    data: { productName: data.productName, carbonFootprint: parseFloat(data.carbonFootprint), sustainabilityRating: data.sustainabilityRating, notes: data.notes || '' },
  });
  return res.status(201).json(profile);
});

app.delete('/api/product-profiles', async (req: Request, res: Response) => {
  const id = req.query.id as string;
  if (!id) return res.status(400).json({ error: 'ID required' });
  await prisma.productESGProfile.delete({ where: { id: parseInt(id) } });
  return res.json({ success: true });
});

// ── Reports Endpoint ──
app.get('/api/reports', async (req: Request, res: Response) => {
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

// ── Users List ──
app.get('/api/users', async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    where: { status: 'Active' },
    select: { id: true, name: true, role: true },
    orderBy: { name: 'asc' },
  });
  return res.json(users);
});

// ── Departments CRUD ──
app.get('/api/departments', async (req: Request, res: Response) => {
  const departments = await prisma.department.findMany({
    include: { head: { select: { name: true } }, parentDepartment: { select: { name: true } } },
    orderBy: { name: 'asc' },
  });
  return res.json(departments);
});

app.post('/api/departments', async (req: Request, res: Response) => {
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

app.patch('/api/departments', async (req: Request, res: Response) => {
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

app.delete('/api/departments', async (req: Request, res: Response) => {
  const id = req.query.id as string;
  if (!id) return res.status(400).json({ error: 'ID required' });
  await prisma.department.delete({ where: { id: parseInt(id) } });
  return res.json({ success: true });
});

// ── Categories CRUD ──
app.get('/api/categories', async (req: Request, res: Response) => {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  return res.json(categories);
});

app.post('/api/categories', async (req: Request, res: Response) => {
  const data = req.body;
  const category = await prisma.category.create({
    data: { name: data.name, type: data.type, status: 'Active' },
  });
  return res.status(201).json(category);
});

app.delete('/api/categories', async (req: Request, res: Response) => {
  const id = req.query.id as string;
  if (!id) return res.status(400).json({ error: 'ID required' });
  await prisma.category.delete({ where: { id: parseInt(id) } });
  return res.json({ success: true });
});

// ── Config Settings ──
app.get('/api/settings', async (req: Request, res: Response) => {
  const configs = await prisma.eSGConfig.findMany();
  const configMap: Record<string, string> = {};
  configs.forEach(c => { configMap[c.key] = c.value; });
  return res.json(configMap);
});

app.patch('/api/settings', async (req: Request, res: Response) => {
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

// ── Recalculate Score Endpoint ──
app.post('/api/scores/recalculate', async (req: Request, res: Response) => {
  try {
    const results = await recalculateAllScores();
    return res.json({ success: true, scores: results });
  } catch (error) {
    return res.status(500).json({ error: 'Recalculation failed' });
  }
});

// ── Notifications Endpoints ──
app.get('/api/notifications', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  return res.json(notifications);
});

app.patch('/api/notifications', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.userId, read: false },
    data: { read: true },
  });
  return res.json({ success: true });
});

// ── AI Insights Endpoint ──
app.post('/api/insights/generate', async (req: Request, res: Response) => {
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

app.listen(PORT, () => {
  console.log(`🚀 EcoSphere API Server running on port ${PORT}`);
});
