import { prisma } from './lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Seeding EcoSphere backend database...');

  // Clear existing data
  await prisma.notification.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.rewardRedemption.deleteMany();
  await prisma.challengeParticipation.deleteMany();
  await prisma.employeeParticipation.deleteMany();
  await prisma.policyAcknowledgement.deleteMany();
  await prisma.complianceIssue.deleteMany();
  await prisma.audit.deleteMany();
  await prisma.departmentScore.deleteMany();
  await prisma.carbonTransaction.deleteMany();
  await prisma.environmentalGoal.deleteMany();
  await prisma.productESGProfile.deleteMany();
  await prisma.cSRActivity.deleteMany();
  await prisma.challenge.deleteMany();
  await prisma.eSGPolicy.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.reward.deleteMany();
  await prisma.emissionFactor.deleteMany();
  await prisma.category.deleteMany();
  await prisma.eSGConfig.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  const passwordHash = bcrypt.hashSync('password123', 10);

  // ── Departments ──
  const manufacturing = await prisma.department.create({
    data: { name: 'Manufacturing', code: 'MFG', employeeCount: 134, status: 'Active' },
  });
  const logistics = await prisma.department.create({
    data: { name: 'Logistics', code: 'LOG', parentDepartmentId: manufacturing.id, employeeCount: 58, status: 'Active' },
  });
  const corporate = await prisma.department.create({
    data: { name: 'Corporate', code: 'COR', employeeCount: 41, status: 'Active' },
  });
  const sales = await prisma.department.create({
    data: { name: 'Sales', code: 'SAL', employeeCount: 27, status: 'Active' },
  });
  const rnd = await prisma.department.create({
    data: { name: 'R&D', code: 'RND', employeeCount: 19, status: 'Active' },
  });

  // ── Users ──
  const admin = await prisma.user.create({
    data: {
      name: 'S. Nair',
      email: 'admin@ecosphere.com',
      passwordHash,
      role: 'Admin',
      departmentId: manufacturing.id,
      xpTotal: 500,
      pointsBalance: 200,
    },
  });

  const rIyer = await prisma.user.create({
    data: {
      name: 'R. Iyer',
      email: 'riyer@ecosphere.com',
      passwordHash,
      role: 'Employee',
      departmentId: logistics.id,
      xpTotal: 350,
      pointsBalance: 120,
    },
  });

  const aMehta = await prisma.user.create({
    data: {
      name: 'A. Mehta',
      email: 'amehta@ecosphere.com',
      passwordHash,
      role: 'Employee',
      departmentId: corporate.id,
      xpTotal: 280,
      pointsBalance: 90,
    },
  });

  const aditiRao = await prisma.user.create({
    data: {
      name: 'Aditi Rao',
      email: 'aditi@ecosphere.com',
      passwordHash,
      role: 'Employee',
      departmentId: manufacturing.id,
      xpTotal: 3910,
      pointsBalance: 150,
    },
  });

  const karanShah = await prisma.user.create({
    data: {
      name: 'Karan Shah',
      email: 'karan@ecosphere.com',
      passwordHash,
      role: 'Employee',
      departmentId: corporate.id,
      xpTotal: 220,
      pointsBalance: 80,
    },
  });

  const priya = await prisma.user.create({
    data: {
      name: 'Priya Sharma',
      email: 'priya@ecosphere.com',
      passwordHash,
      role: 'Employee',
      departmentId: logistics.id,
      xpTotal: 180,
      pointsBalance: 60,
    },
  });

  const vikram = await prisma.user.create({
    data: {
      name: 'Vikram Malhotra',
      email: 'vikram@ecosphere.com',
      passwordHash,
      role: 'Manager',
      departmentId: manufacturing.id,
      xpTotal: 1200,
      pointsBalance: 400,
    },
  });

  const neha = await prisma.user.create({
    data: {
      name: 'Neha Kapoor',
      email: 'neha@ecosphere.com',
      passwordHash,
      role: 'Manager',
      departmentId: logistics.id,
      xpTotal: 1400,
      pointsBalance: 450,
    },
  });

  const amit = await prisma.user.create({
    data: {
      name: 'Amit Verma',
      email: 'amit@ecosphere.com',
      passwordHash,
      role: 'Manager',
      departmentId: corporate.id,
      xpTotal: 1100,
      pointsBalance: 350,
    },
  });

  // Update department heads
  await prisma.department.update({ where: { id: manufacturing.id }, data: { headUserId: vikram.id } });
  await prisma.department.update({ where: { id: logistics.id }, data: { headUserId: neha.id } });
  await prisma.department.update({ where: { id: corporate.id }, data: { headUserId: amit.id } });

  // ── Categories ──
  const csrCat1 = await prisma.category.create({ data: { name: 'Community Service', type: 'CSR_Activity' } });
  const csrCat2 = await prisma.category.create({ data: { name: 'Health & Wellness', type: 'CSR_Activity' } });
  const csrCat3 = await prisma.category.create({ data: { name: 'Environment', type: 'CSR_Activity' } });
  const challCat1 = await prisma.category.create({ data: { name: 'Sustainability', type: 'Challenge' } });
  const challCat2 = await prisma.category.create({ data: { name: 'Green Living', type: 'Challenge' } });

  // ── Emission Factors ──
  const efElectricity = await prisma.emissionFactor.create({
    data: { activityType: 'Electricity', factorValue: 0.82, unit: 'kWh' },
  });
  const efDiesel = await prisma.emissionFactor.create({
    data: { activityType: 'Diesel', factorValue: 2.68, unit: 'liter' },
  });
  const efFlight = await prisma.emissionFactor.create({
    data: { activityType: 'Flight (short-haul)', factorValue: 0.15, unit: 'km' },
  });
  const efPaper = await prisma.emissionFactor.create({
    data: { activityType: 'Paper', factorValue: 0.9, unit: 'kg' },
  });

  // ── Environmental Goals ──
  await prisma.environmentalGoal.create({
    data: {
      name: 'Reduce Fleet Emissions',
      departmentId: logistics.id,
      targetCO2: 500,
      currentCO2: 390,
      deadline: new Date('2026-12-31'),
      status: 'Active',
    },
  });
  await prisma.environmentalGoal.create({
    data: {
      name: 'Cut Packaging Waste',
      departmentId: manufacturing.id,
      targetCO2: 120,
      currentCO2: 98,
      deadline: new Date('2026-09-30'),
      status: 'On Track',
    },
  });
  await prisma.environmentalGoal.create({
    data: {
      name: 'Office Energy Cut',
      departmentId: corporate.id,
      targetCO2: 80,
      currentCO2: 80,
      deadline: new Date('2026-06-30'),
      status: 'Completed',
    },
  });

  // ── CSR Activities ──
  const treePlantation = await prisma.cSRActivity.create({
    data: {
      title: 'Tree Plantation',
      categoryId: csrCat3.id,
      icon: '🌳',
      description: 'Plant trees in local community parks and forests.',
      joinCount: 24,
      evidenceRequired: true,
      status: 'Open',
    },
  });
  const bloodDonation = await prisma.cSRActivity.create({
    data: {
      title: 'Blood Donation',
      categoryId: csrCat2.id,
      icon: '🩸',
      description: 'Organize blood donation camps for local hospitals.',
      joinCount: 18,
      evidenceRequired: false,
      status: 'Open',
    },
  });
  const beachCleanup = await prisma.cSRActivity.create({
    data: {
      title: 'Beach Cleanup',
      categoryId: csrCat3.id,
      icon: '🏖️',
      description: 'Clean up beaches to reduce ocean pollution.',
      joinCount: 31,
      evidenceRequired: false,
      status: 'Open',
    },
  });
  const esgWorkshop = await prisma.cSRActivity.create({
    data: {
      title: 'ESG Workshop',
      categoryId: csrCat1.id,
      icon: '📚',
      description: 'Attend workshops on ESG best practices.',
      joinCount: 52,
      evidenceRequired: false,
      status: 'Open',
    },
  });

  // ── Employee Participations ──
  await prisma.employeeParticipation.create({
    data: {
      employeeId: aditiRao.id,
      activityId: treePlantation.id,
      proofFileName: 'photo.jpg',
      pointsEarned: 50,
      approvalStatus: 'Pending',
    },
  });
  await prisma.employeeParticipation.create({
    data: {
      employeeId: karanShah.id,
      activityId: esgWorkshop.id,
      proofFileName: 'cert.pdf',
      pointsEarned: 30,
      approvalStatus: 'Approved',
    },
  });

  // Additional participations to drive social scores
  await prisma.employeeParticipation.create({
    data: {
      employeeId: admin.id,
      activityId: beachCleanup.id,
      proofFileName: 'beach_evidence.jpg',
      pointsEarned: 40,
      approvalStatus: 'Approved',
    },
  });
  await prisma.employeeParticipation.create({
    data: {
      employeeId: rIyer.id,
      activityId: bloodDonation.id,
      proofFileName: '',
      pointsEarned: 35,
      approvalStatus: 'Approved',
    },
  });
  await prisma.employeeParticipation.create({
    data: {
      employeeId: priya.id,
      activityId: treePlantation.id,
      proofFileName: 'tree_proof.jpg',
      pointsEarned: 50,
      approvalStatus: 'Approved',
    },
  });
  await prisma.employeeParticipation.create({
    data: {
      employeeId: aMehta.id,
      activityId: esgWorkshop.id,
      proofFileName: 'workshop_cert.pdf',
      pointsEarned: 30,
      approvalStatus: 'Approved',
    },
  });

  // ── Challenges ──
  const sustainabilitySprint = await prisma.challenge.create({
    data: {
      title: 'Sustainability Sprint',
      categoryId: challCat1.id,
      description: 'Complete a series of sustainability tasks over 2 weeks.',
      xp: 200,
      difficulty: 'Hard',
      evidenceRequired: true,
      deadline: new Date('2026-07-20'),
      status: 'Active',
    },
  });
  const recycleChallenge = await prisma.challenge.create({
    data: {
      title: 'Recycle Challenge',
      categoryId: challCat2.id,
      description: 'Recycle 5kg of materials and log your progress.',
      xp: 80,
      difficulty: 'Easy',
      evidenceRequired: false,
      deadline: new Date('2026-07-15'),
      status: 'Active',
    },
  });
  const commuteGreen = await prisma.challenge.create({
    data: {
      title: 'Commute Green Week',
      categoryId: challCat2.id,
      description: 'Use public transport or bike for a full week.',
      xp: 120,
      difficulty: 'Medium',
      evidenceRequired: true,
      deadline: new Date('2026-07-25'),
      status: 'Draft',
    },
  });

  // ── Challenge Participations ──
  await prisma.challengeParticipation.create({
    data: {
      challengeId: sustainabilitySprint.id,
      employeeId: aditiRao.id,
      progressPct: 100,
      proofFileName: 'sprint_evidence.pdf',
      approvalStatus: 'Approved',
      xpAwarded: 200,
    },
  });
  await prisma.challengeParticipation.create({
    data: {
      challengeId: recycleChallenge.id,
      employeeId: aditiRao.id,
      progressPct: 100,
      proofFileName: 'recycle_log.jpg',
      approvalStatus: 'Approved',
      xpAwarded: 80,
    },
  });
  await prisma.challengeParticipation.create({
    data: {
      challengeId: recycleChallenge.id,
      employeeId: karanShah.id,
      progressPct: 60,
      proofFileName: '',
      approvalStatus: 'Pending',
      xpAwarded: 0,
    },
  });
  await prisma.challengeParticipation.create({
    data: {
      challengeId: sustainabilitySprint.id,
      employeeId: rIyer.id,
      progressPct: 100,
      proofFileName: 'sprint_proof.pdf',
      approvalStatus: 'Approved',
      xpAwarded: 200,
    },
  });

  // ── Badges ──
  const greenBeginner = await prisma.badge.create({
    data: { name: 'Green Beginner', description: 'Earn your first 50 XP', icon: '🌱', unlockRuleType: 'xp', unlockThreshold: 50 },
  });
  const carbonSaver = await prisma.badge.create({
    data: { name: 'Carbon Saver', description: 'Reach 150 XP from carbon-related actions', icon: '♻️', unlockRuleType: 'xp', unlockThreshold: 150 },
  });
  const champion = await prisma.badge.create({
    data: { name: 'Sustainability Champion', description: 'Earn 200 XP total', icon: '🏆', unlockRuleType: 'xp', unlockThreshold: 200 },
  });
  const teamPlayer = await prisma.badge.create({
    data: { name: 'Team Player', description: 'Complete 3 challenges', icon: '🤝', unlockRuleType: 'challengeCount', unlockThreshold: 3 },
  });

  // Award badges to qualifying users
  await prisma.userBadge.create({ data: { userId: aditiRao.id, badgeId: greenBeginner.id } });
  await prisma.userBadge.create({ data: { userId: aditiRao.id, badgeId: carbonSaver.id } });
  await prisma.userBadge.create({ data: { userId: aditiRao.id, badgeId: champion.id } });
  await prisma.userBadge.create({ data: { userId: admin.id, badgeId: greenBeginner.id } });
  await prisma.userBadge.create({ data: { userId: admin.id, badgeId: carbonSaver.id } });
  await prisma.userBadge.create({ data: { userId: admin.id, badgeId: champion.id } });
  await prisma.userBadge.create({ data: { userId: rIyer.id, badgeId: greenBeginner.id } });
  await prisma.userBadge.create({ data: { userId: rIyer.id, badgeId: carbonSaver.id } });
  await prisma.userBadge.create({ data: { userId: rIyer.id, badgeId: champion.id } });
  await prisma.userBadge.create({ data: { userId: karanShah.id, badgeId: greenBeginner.id } });
  await prisma.userBadge.create({ data: { userId: karanShah.id, badgeId: carbonSaver.id } });
  await prisma.userBadge.create({ data: { userId: karanShah.id, badgeId: champion.id } });
  await prisma.userBadge.create({ data: { userId: priya.id, badgeId: greenBeginner.id } });
  await prisma.userBadge.create({ data: { userId: priya.id, badgeId: carbonSaver.id } });
  await prisma.userBadge.create({ data: { userId: aMehta.id, badgeId: greenBeginner.id } });
  await prisma.userBadge.create({ data: { userId: aMehta.id, badgeId: carbonSaver.id } });
  await prisma.userBadge.create({ data: { userId: aMehta.id, badgeId: champion.id } });

  // ── Rewards ──
  await prisma.reward.create({
    data: { name: 'Eco Water Bottle', description: 'Reusable stainless steel water bottle', pointsRequired: 100, stock: 25 },
  });
  await prisma.reward.create({
    data: { name: 'Plant a Tree Certificate', description: 'We plant a tree in your name', pointsRequired: 50, stock: 100 },
  });
  await prisma.reward.create({
    data: { name: 'Extra Day Off', description: 'One additional paid day off', pointsRequired: 500, stock: 5 },
  });
  await prisma.reward.create({
    data: { name: 'Eco Tote Bag', description: 'Organic cotton tote bag with EcoSphere logo', pointsRequired: 75, stock: 50 },
  });

  // ── ESG Policies ──
  const wastePolicy = await prisma.eSGPolicy.create({
    data: {
      title: 'Waste Management Policy',
      description: 'Guidelines for proper waste segregation and disposal across all departments.',
      category: 'Environmental',
      version: '2.1',
      mandatory: true,
    },
  });
  const diversityPolicy = await prisma.eSGPolicy.create({
    data: {
      title: 'Diversity & Inclusion Policy',
      description: 'Framework for promoting diversity and inclusive workplace practices.',
      category: 'Social',
      version: '1.5',
      mandatory: true,
    },
  });
  const ethicsPolicy = await prisma.eSGPolicy.create({
    data: {
      title: 'Code of Ethics',
      description: 'Ethical guidelines and standards of conduct for all employees.',
      category: 'Governance',
      version: '3.0',
      mandatory: true,
    },
  });
  const energyPolicy = await prisma.eSGPolicy.create({
    data: {
      title: 'Energy Conservation Guidelines',
      description: 'Best practices for reducing energy consumption in offices and facilities.',
      category: 'Environmental',
      version: '1.2',
      mandatory: false,
    },
  });

  // ── Policy Acknowledgements ──
  await prisma.policyAcknowledgement.create({
    data: { policyId: wastePolicy.id, employeeId: aditiRao.id, status: 'Acknowledged', acknowledgedAt: new Date() },
  });
  await prisma.policyAcknowledgement.create({
    data: { policyId: wastePolicy.id, employeeId: karanShah.id, status: 'Pending' },
  });
  await prisma.policyAcknowledgement.create({
    data: { policyId: diversityPolicy.id, employeeId: aditiRao.id, status: 'Acknowledged', acknowledgedAt: new Date() },
  });
  await prisma.policyAcknowledgement.create({
    data: { policyId: diversityPolicy.id, employeeId: priya.id, status: 'Pending' },
  });
  await prisma.policyAcknowledgement.create({
    data: { policyId: ethicsPolicy.id, employeeId: admin.id, status: 'Acknowledged', acknowledgedAt: new Date() },
  });

  // ── Audits ──
  const wasteAudit = await prisma.audit.create({
    data: {
      title: 'Q2 Waste Audit',
      departmentId: manufacturing.id,
      auditorId: admin.id,
      date: new Date('2026-06-12'),
      findings: '3 minor issues found: improper waste segregation in Zone B, missing labels on hazardous bins, outdated disposal logs.',
      status: 'Completed',
    },
  });
  const vendorAudit = await prisma.audit.create({
    data: {
      title: 'Vendor Compliance Check',
      departmentId: logistics.id,
      auditorId: rIyer.id,
      date: new Date('2026-07-01'),
      findings: '1 open issue: vendor XYZ missing updated compliance certificate.',
      status: 'UnderReview',
    },
  });

  // ── Compliance Issues ──
  await prisma.complianceIssue.create({
    data: {
      title: 'Missing MSDS sheets',
      auditId: wasteAudit.id,
      severity: 'High',
      departmentId: manufacturing.id,
      ownerId: admin.id,
      dueDate: new Date('2026-06-01'), // PAST → overdue
      status: 'Open',
    },
  });
  await prisma.complianceIssue.create({
    data: {
      title: 'Late vendor disclosure',
      auditId: vendorAudit.id,
      severity: 'Medium',
      departmentId: logistics.id,
      ownerId: rIyer.id,
      dueDate: new Date('2026-08-01'),
      status: 'Resolved',
    },
  });

  // ── Carbon Transactions ──
  const months = [
    { month: 7, year: 2025 }, { month: 8, year: 2025 }, { month: 9, year: 2025 },
    { month: 10, year: 2025 }, { month: 11, year: 2025 }, { month: 12, year: 2025 },
    { month: 1, year: 2026 }, { month: 2, year: 2026 }, { month: 3, year: 2026 },
    { month: 4, year: 2026 }, { month: 5, year: 2026 }, { month: 6, year: 2026 },
  ];
  const emissionValues = [450, 420, 410, 395, 380, 370, 355, 340, 330, 315, 300, 285];

  for (let i = 0; i < months.length; i++) {
    const { month, year } = months[i];
    const quantity = emissionValues[i];
    await prisma.carbonTransaction.create({
      data: {
        departmentId: manufacturing.id,
        sourceType: 'Manufacturing',
        quantity,
        emissionFactorId: efElectricity.id,
        calculatedEmissions: quantity * 0.82,
        transactionDate: new Date(year, month - 1, 15),
      },
    });
  }

  for (let i = 0; i < months.length; i++) {
    const { month, year } = months[i];
    await prisma.carbonTransaction.create({
      data: {
        departmentId: logistics.id,
        sourceType: 'Fleet',
        quantity: 200 - i * 8,
        emissionFactorId: efDiesel.id,
        calculatedEmissions: (200 - i * 8) * 2.68,
        transactionDate: new Date(year, month - 1, 15),
      },
    });
  }

  // ── Product ESG Profiles ──
  await prisma.productESGProfile.create({
    data: { productName: 'EcoWidget Pro', carbonFootprint: 12.5, sustainabilityRating: 'A', notes: 'Made from 80% recycled materials' },
  });
  await prisma.productESGProfile.create({
    data: { productName: 'GreenPack Container', carbonFootprint: 8.2, sustainabilityRating: 'A+', notes: 'Fully biodegradable packaging' },
  });
  await prisma.productESGProfile.create({
    data: { productName: 'Standard Component X', carbonFootprint: 45.0, sustainabilityRating: 'C', notes: 'Needs sustainability review' },
  });

  // ── ESG Configuration ──
  await prisma.eSGConfig.create({ data: { key: 'auto_emission_calculation', value: 'true' } });
  await prisma.eSGConfig.create({ data: { key: 'require_evidence', value: 'true' } });
  await prisma.eSGConfig.create({ data: { key: 'auto_award_badges', value: 'true' } });
  await prisma.eSGConfig.create({ data: { key: 'email_compliance_alerts', value: 'true' } });
  await prisma.eSGConfig.create({ data: { key: 'weight_environmental', value: '40' } });
  await prisma.eSGConfig.create({ data: { key: 'weight_social', value: '30' } });
  await prisma.eSGConfig.create({ data: { key: 'weight_governance', value: '30' } });

  // ── Department Scores ──
  await prisma.departmentScore.create({
    data: { departmentId: manufacturing.id, environmentalScore: 78, socialScore: 65, governanceScore: 85, totalScore: 77, calculatedAt: new Date() },
  });
  await prisma.departmentScore.create({
    data: { departmentId: logistics.id, environmentalScore: 82, socialScore: 72, governanceScore: 90, totalScore: 82, calculatedAt: new Date() },
  });
  await prisma.departmentScore.create({
    data: { departmentId: corporate.id, environmentalScore: 88, socialScore: 80, governanceScore: 92, totalScore: 87, calculatedAt: new Date() },
  });
  await prisma.departmentScore.create({
    data: { departmentId: sales.id, environmentalScore: 85, socialScore: 78, governanceScore: 88, totalScore: 84, calculatedAt: new Date() },
  });
  await prisma.departmentScore.create({
    data: { departmentId: rnd.id, environmentalScore: 80, socialScore: 70, governanceScore: 85, totalScore: 79, calculatedAt: new Date() },
  });

  // ── Notifications ──
  await prisma.notification.create({
    data: { userId: admin.id, type: 'compliance_issue', message: 'New compliance issue: Missing MSDS sheets', read: false },
  });
  await prisma.notification.create({
    data: { userId: aditiRao.id, type: 'badge_unlocked', message: '🏆 Badge unlocked: "Green Beginner"!', read: true },
  });
  await prisma.notification.create({
    data: { userId: karanShah.id, type: 'participation_approved', message: 'Your participation in "ESG Workshop" was approved! +30 points', read: false },
  });

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
