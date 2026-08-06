import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createLaunchPlan,
  getCheckpointAttentionDate,
  getDefaultMinistryYearStart,
  getLaunchSummary,
  getStudyEndDate,
  isStudyPast,
  sanitizeLaunchPlan,
} from './launch-contract.js';

const orangevilleMonday = {
  title: 'Luke: Gut-Level Compassion',
  ministryId: 'womens_mon',
  startDate: '2026-09-21',
  weeks: 8,
  location: 'Orangeville',
  physicalResources: 'Order placed',
  digitalResources: 'Required',
};

test('creates the streamlined study launch plan with inferred resource profiles', () => {
  const launchPlan = createLaunchPlan(orangevilleMonday);

  assert.equal(launchPlan.version, 4);
  assert.equal(launchPlan.pageMode, 'information_only');
  assert.equal(launchPlan.productionPath, 'admin_handoff');
  assert.equal(launchPlan.publicLaunchDate, '2026-08-10');
  assert.deepEqual(launchPlan.profiles, [
    'universal_core',
    'planning_center_information_page',
    'physical_resource',
    'digital_streaming',
  ]);
  assert.equal(launchPlan.checkpoints.some((checkpoint) => checkpoint.id === 'physical_resource_received'), true);
  assert.equal(launchPlan.checkpoints.some((checkpoint) => checkpoint.id === 'digital_access_tested'), true);
  assert.equal(launchPlan.checkpoints.some((checkpoint) => checkpoint.id === 'planning_center_independent_proof'), false);
  assert.equal(launchPlan.checkpoints.find((checkpoint) => checkpoint.id === 'master_brief_ready').taskPolicy, 'create');
  assert.equal(launchPlan.checkpoints.some((checkpoint) => checkpoint.id === 'social_media_copy_ready'), false);
  assert.equal(launchPlan.checkpoints.some((checkpoint) => checkpoint.id === 'targeted_invitation_plan_ready'), true);
  assert.equal(launchPlan.checkpoints.some((checkpoint) => checkpoint.id === 'early_operational_check'), true);
  assert.equal(launchPlan.checkpoints.find((checkpoint) => checkpoint.id === 'planning_center_page_live').taskPolicy, 'monitor');
  assert.equal('kickoffDate' in launchPlan, false);
  assert.equal(launchPlan.checkpoints.some((checkpoint) => checkpoint.id === 'final_readiness_complete'), false);
  assert.deepEqual(
    ['planning_center_copy_ready', 'leader_email_copy_ready', 'targeted_invitation_plan_ready']
      .filter((id) => launchPlan.checkpoints.some((checkpoint) => checkpoint.id === id)),
    ['planning_center_copy_ready', 'leader_email_copy_ready', 'targeted_invitation_plan_ready'],
  );
});

test('adds only the broad communication channels selected for the study', () => {
  const launchPlan = createLaunchPlan(orangevilleMonday, {
    profiles: ['universal_core', 'planning_center_information_page', 'compass_news', 'sunday_slide'],
  });

  assert.equal(launchPlan.checkpoints.some((checkpoint) => checkpoint.id === 'compass_news_copy_ready'), true);
  assert.equal(launchPlan.checkpoints.some((checkpoint) => checkpoint.id === 'sunday_slide_brief_ready'), true);
  assert.equal(launchPlan.checkpoints.some((checkpoint) => checkpoint.id === 'social_media_copy_ready'), false);
  assert.deepEqual(
    launchPlan.checkpoints.find((checkpoint) => checkpoint.id === 'promotion_submitted').dependsOn,
    ['leader_email_copy_ready', 'targeted_invitation_plan_ready', 'planning_center_copy_ready', 'compass_news_copy_ready', 'sunday_slide_brief_ready'],
  );
});

test('preserves legacy broad-channel checkpoints when upgrading a version-3 plan', () => {
  const previous = createLaunchPlan(orangevilleMonday, {
    version: 3,
    profiles: ['universal_core', 'planning_center_information_page'],
    checkpoints: [{ id: 'social_media_copy_ready', status: 'done', evidence: 'Scheduled.' }],
  });

  assert.equal(previous.profiles.includes('social_media'), true);
  assert.equal(previous.checkpoints.find((checkpoint) => checkpoint.id === 'social_media_copy_ready').status, 'done');
});

test('adds the independent-proof checkpoint only for Jonathan self-service', () => {
  const launchPlan = createLaunchPlan(orangevilleMonday, { productionPath: 'jonathan_self_service' });
  const proof = launchPlan.checkpoints.find((checkpoint) => checkpoint.id === 'planning_center_independent_proof');
  const page = launchPlan.checkpoints.find((checkpoint) => checkpoint.id === 'planning_center_page_live');

  assert.equal(Boolean(proof), true);
  assert.equal(proof.calculatedDueDate, '2026-08-09');
  assert.equal(page.owner, 'Jonathan');
  assert.equal(page.taskPolicy, 'create');
});

test('calculates a business-day attention date separately from the target date', () => {
  const launchPlan = createLaunchPlan(orangevilleMonday);
  const masterBrief = launchPlan.checkpoints.find((checkpoint) => checkpoint.id === 'master_brief_ready');

  assert.equal(masterBrief.calculatedDueDate, '2026-08-03');
  assert.equal(getCheckpointAttentionDate(masterBrief), '2026-07-27');

  masterBrief.dueDateOverride = '2026-07-27';
  assert.equal(getCheckpointAttentionDate(masterBrief), '2026-07-20');
});

test('updates the automatic Planning Center owner when the production path changes', () => {
  const adminPlan = createLaunchPlan(orangevilleMonday);
  const selfServicePlan = createLaunchPlan(orangevilleMonday, {
    ...adminPlan,
    productionPath: 'jonathan_self_service',
  });
  const selfServicePage = selfServicePlan.checkpoints.find((checkpoint) => checkpoint.id === 'planning_center_page_live');

  assert.equal(selfServicePage.owner, 'Jonathan');

  selfServicePage.owner = 'Sarah';
  const customOwnerPlan = createLaunchPlan(orangevilleMonday, selfServicePlan);
  const customOwnerPage = customOwnerPlan.checkpoints.find((checkpoint) => checkpoint.id === 'planning_center_page_live');

  assert.equal(customOwnerPage.owner, 'Sarah');
});

test('removes the Planning Center profile when a public page is not required', () => {
  const plan = createLaunchPlan(orangevilleMonday, {
    pageMode: 'not_required',
    profiles: ['universal_core', 'planning_center_information_page'],
  });

  assert.equal(plan.pageMode, 'not_required');
  assert.equal(plan.profiles.includes('planning_center_information_page'), false);
  assert.equal(plan.checkpoints.some((checkpoint) => checkpoint.id === 'planning_center_page_live'), false);
  assert.equal(plan.checkpoints.some((checkpoint) => checkpoint.id === 'public_information_exception_confirmed'), true);
});

test('adds signup and payment checks only for the selected Planning Center mode', () => {
  const optional = createLaunchPlan(orangevilleMonday, { pageMode: 'optional_signup' });
  const paid = createLaunchPlan(orangevilleMonday, { pageMode: 'paid_registration' });

  assert.equal(optional.checkpoints.some((checkpoint) => checkpoint.id === 'signup_flow_verified'), true);
  assert.equal(optional.checkpoints.some((checkpoint) => checkpoint.id === 'payment_flow_verified'), false);
  assert.equal(paid.checkpoints.some((checkpoint) => checkpoint.id === 'signup_flow_verified'), true);
  assert.equal(paid.checkpoints.some((checkpoint) => checkpoint.id === 'payment_flow_verified'), true);
});

test('preserves checkpoint progress while recalculating dates', () => {
  const first = createLaunchPlan(orangevilleMonday);
  const ordered = first.checkpoints.find((checkpoint) => checkpoint.id === 'physical_resource_ordered');
  ordered.status = 'done';
  ordered.notes = 'Supplier confirmed the order by email. Keep the delivery thread here.';
  ordered.evidence = 'Ekkuip order placed';
  ordered.completedAt = '2026-07-14';

  const revised = createLaunchPlan({ ...orangevilleMonday, startDate: '2026-09-28' }, first);
  const preserved = revised.checkpoints.find((checkpoint) => checkpoint.id === 'physical_resource_ordered');

  assert.equal(preserved.status, 'done');
  assert.equal(preserved.notes, 'Supplier confirmed the order by email. Keep the delivery thread here.');
  assert.equal(preserved.evidence, 'Ekkuip order placed');
  assert.equal(preserved.calculatedDueDate, '2026-08-17');
});

test('summarizes overdue, blocked, and completion state', () => {
  const launchPlan = createLaunchPlan(orangevilleMonday);
  launchPlan.checkpoints[0].status = 'done';
  launchPlan.checkpoints[1].status = 'blocked';
  launchPlan.checkpoints[1].blocker = 'Waiting on dates';

  const summary = getLaunchSummary({ ...orangevilleMonday, launchPlan }, '2026-08-04');

  assert.equal(summary.complete, 1);
  assert.equal(summary.blocked, 1);
  assert.equal(summary.overdue > 0, true);
  assert.equal(summary.nextCheckpoint.id, 'master_brief_ready');
  assert.equal(summary.attentionNow > 0, true);
});

test('identifies past studies from an explicit or calculated end date', () => {
  assert.equal(getStudyEndDate(orangevilleMonday), '2026-11-16');
  assert.equal(isStudyPast(orangevilleMonday, '2026-11-17'), true);
  assert.equal(isStudyPast(orangevilleMonday, '2026-11-16'), false);
  assert.equal(isStudyPast({
    ...orangevilleMonday,
    launchPlan: { studyEndDate: '2026-10-30' },
  }, '2026-10-31'), true);
});

test('defaults the calendar to the earliest active or upcoming ministry year', () => {
  const pastStudy = { ...orangevilleMonday, startDate: '2025-09-22', weeks: 8 };
  const upcomingStudy = { ...orangevilleMonday, startDate: '2026-09-21' };

  assert.equal(getDefaultMinistryYearStart([pastStudy, upcomingStudy], '2026-07-16'), 2026);
  assert.equal(getDefaultMinistryYearStart([pastStudy], '2026-07-16'), 2026);
  assert.equal(getDefaultMinistryYearStart([], '2026-02-16'), 2025);
});

test('calculates readiness without post-launch follow-up or a manual final checkbox', () => {
  const launchPlan = createLaunchPlan(orangevilleMonday);
  launchPlan.checkpoints.forEach((checkpoint) => {
    checkpoint.status = checkpoint.affectsReadiness === false ? 'blocked' : 'done';
  });
  const acceptedRisk = launchPlan.checkpoints.find((checkpoint) => checkpoint.id === 'venue_host_av_ready');
  acceptedRisk.status = 'accepted_risk';
  acceptedRisk.acceptedRiskOwner = 'Jonathan';
  acceptedRisk.acceptedRiskMitigation = 'Confirm the remaining signage on arrival.';
  acceptedRisk.acceptedRiskReviewDate = '2026-09-21';

  const summary = getLaunchSummary({ ...orangevilleMonday, launchPlan }, '2026-09-20');

  assert.equal(summary.ready, true);
  assert.equal(summary.readinessPercent, 100);
  assert.equal(summary.acceptedRisk, 1);
  assert.equal(summary.blocked, 0);
});

test('does not count not-required or accepted-risk checkpoints without decision details as complete', () => {
  const launchPlan = createLaunchPlan(orangevilleMonday);
  const targeted = launchPlan.checkpoints.find((checkpoint) => checkpoint.id === 'targeted_invitation_plan_ready');
  const venue = launchPlan.checkpoints.find((checkpoint) => checkpoint.id === 'venue_host_av_ready');
  targeted.status = 'not_required';
  venue.status = 'accepted_risk';

  let summary = getLaunchSummary({ ...orangevilleMonday, launchPlan }, '2026-08-01');
  assert.equal(summary.missingCompletionDetails, 2);

  targeted.notRequiredReason = 'Confirmed by the ministry owner: invitations are being handled through the linked kickoff event.';
  venue.acceptedRiskOwner = 'Jonathan';
  venue.acceptedRiskMitigation = 'Use the portable speaker if the installed system is unavailable.';
  venue.acceptedRiskReviewDate = '2026-09-21';
  summary = getLaunchSummary({ ...orangevilleMonday, launchPlan }, '2026-08-01');
  assert.equal(summary.missingCompletionDetails, 0);
});

test('sanitizes nested launch data and rejects invalid checkpoint status', () => {
  const launchPlan = createLaunchPlan(orangevilleMonday);
  launchPlan.checkpoints[0].status = 'mystery';

  const result = sanitizeLaunchPlan(launchPlan);

  assert.equal(result.errors.some((error) => error.includes('Invalid launchPlan.checkpoints[0].status')), true);
  assert.equal(result.launchPlan.checkpoints[0].status, 'not_started');
});

test('sanitization preserves communication profiles represented by legacy checkpoints', () => {
  const launchPlan = createLaunchPlan(orangevilleMonday, {
    profiles: ['universal_core', 'planning_center_information_page', 'social_media'],
  });
  launchPlan.version = 3;
  launchPlan.profiles = ['universal_core', 'planning_center_information_page'];

  const result = sanitizeLaunchPlan(launchPlan);

  assert.equal(result.launchPlan.version, 4);
  assert.equal(result.launchPlan.profiles.includes('social_media'), true);
});

test('sanitizes checkpoint working notes independently from completion evidence', () => {
  const launchPlan = createLaunchPlan(orangevilleMonday);
  const masterBrief = launchPlan.checkpoints.find((checkpoint) => checkpoint.id === 'master_brief_ready');
  masterBrief.notes = 'Master brief draft with audience, message, dates, and calls to action.';
  masterBrief.evidence = 'Approved by Jonathan on 2026-07-18.';

  const result = sanitizeLaunchPlan(launchPlan);
  const sanitized = result.launchPlan.checkpoints.find((checkpoint) => checkpoint.id === 'master_brief_ready');

  assert.deepEqual(result.errors, []);
  assert.equal(sanitized.notes, masterBrief.notes);
  assert.equal(sanitized.evidence, masterBrief.evidence);
});

test('prevents communication submission from completing before selected outputs and core communication', () => {
  const launchPlan = createLaunchPlan(orangevilleMonday, {
    profiles: ['universal_core', 'planning_center_information_page', 'compass_news'],
  });
  const promotion = launchPlan.checkpoints.find((checkpoint) => checkpoint.id === 'promotion_submitted');
  promotion.status = 'done';

  const result = sanitizeLaunchPlan(launchPlan);

  assert.equal(result.errors.some((error) => error.includes('promotion_submitted cannot be done before')), true);
});
