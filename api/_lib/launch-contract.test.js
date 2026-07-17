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

  assert.equal(launchPlan.version, 3);
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
  assert.equal(launchPlan.checkpoints.find((checkpoint) => checkpoint.id === 'social_media_copy_ready').taskPolicy, 'group');
  assert.equal(launchPlan.checkpoints.find((checkpoint) => checkpoint.id === 'planning_center_page_live').taskPolicy, 'monitor');
  assert.equal('kickoffDate' in launchPlan, false);
  assert.equal(launchPlan.checkpoints.some((checkpoint) => checkpoint.id === 'final_readiness_complete'), false);
  assert.deepEqual(
    ['planning_center_copy_ready', 'compass_news_copy_ready', 'social_media_copy_ready', 'sunday_slide_brief_ready', 'leader_email_copy_ready']
      .filter((id) => launchPlan.checkpoints.some((checkpoint) => checkpoint.id === id)),
    ['planning_center_copy_ready', 'compass_news_copy_ready', 'social_media_copy_ready', 'sunday_slide_brief_ready', 'leader_email_copy_ready'],
  );
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
});

test('preserves checkpoint progress while recalculating dates', () => {
  const first = createLaunchPlan(orangevilleMonday);
  const ordered = first.checkpoints.find((checkpoint) => checkpoint.id === 'physical_resource_ordered');
  ordered.status = 'done';
  ordered.evidence = 'Ekkuip order placed';
  ordered.completedAt = '2026-07-14';

  const revised = createLaunchPlan({ ...orangevilleMonday, startDate: '2026-09-28' }, first);
  const preserved = revised.checkpoints.find((checkpoint) => checkpoint.id === 'physical_resource_ordered');

  assert.equal(preserved.status, 'done');
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

  const summary = getLaunchSummary({ ...orangevilleMonday, launchPlan }, '2026-09-20');

  assert.equal(summary.ready, true);
  assert.equal(summary.readinessPercent, 100);
  assert.equal(summary.acceptedRisk, 1);
  assert.equal(summary.blocked, 0);
});

test('sanitizes nested launch data and rejects invalid checkpoint status', () => {
  const launchPlan = createLaunchPlan(orangevilleMonday);
  launchPlan.checkpoints[0].status = 'mystery';

  const result = sanitizeLaunchPlan(launchPlan);

  assert.equal(result.errors.some((error) => error.includes('Invalid launchPlan.checkpoints[0].status')), true);
  assert.equal(result.launchPlan.checkpoints[0].status, 'not_started');
});

test('prevents promotion submission from completing before all five standard outputs', () => {
  const launchPlan = createLaunchPlan(orangevilleMonday);
  const promotion = launchPlan.checkpoints.find((checkpoint) => checkpoint.id === 'promotion_submitted');
  promotion.status = 'done';

  const result = sanitizeLaunchPlan(launchPlan);

  assert.equal(result.errors.some((error) => error.includes('promotion_submitted cannot be done before')), true);
});
