import { prisma } from './prisma';

export async function createNotification(userId: number, type: string, message: string) {
  return prisma.notification.create({
    data: { userId, type, message },
  });
}

export async function notifyComplianceIssue(issueTitle: string, ownerId: number) {
  return createNotification(
    ownerId,
    'compliance_issue',
    `New compliance issue assigned to you: "${issueTitle}"`
  );
}

export async function notifyParticipationApproved(userId: number, activityTitle: string, points: number) {
  return createNotification(
    userId,
    'participation_approved',
    `Your participation in "${activityTitle}" was approved! +${points} points`
  );
}

export async function notifyParticipationRejected(userId: number, activityTitle: string) {
  return createNotification(
    userId,
    'participation_rejected',
    `Your participation in "${activityTitle}" was rejected.`
  );
}

export async function notifyBadgeUnlocked(userId: number, badgeName: string) {
  return createNotification(
    userId,
    'badge_unlocked',
    `🏆 Badge unlocked: "${badgeName}"!`
  );
}

export async function notifyPolicyReminder(userId: number, policyTitle: string) {
  return createNotification(
    userId,
    'policy_reminder',
    `Reminder: Please acknowledge policy "${policyTitle}"`
  );
}
