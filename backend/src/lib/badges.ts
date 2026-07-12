import { prisma } from './prisma';
import { notifyBadgeUnlocked } from './notifications';

export async function checkAndAwardBadges(userId: number) {
  const configToggle = await prisma.eSGConfig.findUnique({ where: { key: 'auto_award_badges' } });
  if (configToggle && configToggle.value === 'false') return [];

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return [];

  const allBadges = await prisma.badge.findMany();
  const existingBadges = await prisma.userBadge.findMany({
    where: { userId },
    select: { badgeId: true },
  });
  const existingBadgeIds = new Set(existingBadges.map(b => b.badgeId));

  const completedChallenges = await prisma.challengeParticipation.count({
    where: { employeeId: userId, approvalStatus: 'Approved' },
  });

  const newBadges = [];

  for (const badge of allBadges) {
    if (existingBadgeIds.has(badge.id)) continue;

    let qualified = false;
    if (badge.unlockRuleType === 'xp') {
      qualified = user.xpTotal >= badge.unlockThreshold;
    } else if (badge.unlockRuleType === 'challengeCount') {
      qualified = completedChallenges >= badge.unlockThreshold;
    }

    if (qualified) {
      await prisma.userBadge.create({
        data: { userId, badgeId: badge.id },
      });
      await notifyBadgeUnlocked(userId, badge.name);
      newBadges.push(badge);
    }
  }

  return newBadges;
}
