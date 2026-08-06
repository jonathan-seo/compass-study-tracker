import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createLaunchPlan,
  getCheckpointAttentionDate,
  getDefaultMinistryYearStart,
  getLaunchGridSections,
  getLaunchSummary,
  getStudyEndDate,
  isStudyPast,
  sanitizeLaunchPlan,
} from './launch-contract.js';

const orangevilleMonday = {
  id: 'orangeville-one',
  title: 'Luke: Gut-Level Compassion',
  ministryId: 'womens_mon',
  startDate: '2026-09-21',
  weeks: 8,
  location: 'Orangeville',
  physicalResources: 'Order placed',
  digitalResources: 'Required',
};

test('creates the streamlined version-7 launch plan with inferred resource profiles', () => {
  const launchPlan = createLaunchPlan(orangevilleMonday);

  assert.equal(launchPlan.version, 7);
  assert.equal(launchPlan.pageMode, 'information_only');
  assert.equal(launchPlan.productionPath, 'admin_handoff');
  assert.equal(launchPlan.publicLaunchDate, '2026-08-10');
  assert.deepEqual(launchPlan.profiles, [
    'universal_core',
    'planning_center_information_page',
    'physical_resource',
    'digital_streaming',
  ]);
  assert.equal(launchPlan.checkpoints.some((checkpoint) => checkpoint.id === 'planning_center_copy_ready'), true);
  assert.equal(launchPlan.checkpoints.some((checkpoint) => checkpoint.id === 'physical_resource_received'), true);
  assert.equal(launchPlan.checkpoints.some((checkpoint) => checkpoint.id === 'digital_access_tested'), true);
  assert.equal(launchPlan.checkpoints.some((checkpoint) => checkpoint.id === 'leaders_notified_launch_ready'), true);
  assert.equal(launchPlan.checkpoints.some((checkpoint) => checkpoint.id === 'planning_center_independent_proof'), false);
  assert.equal(launchPlan.checkpoints.some((checkpoint) => checkpoint.id === 'facts_locked'), false);
  assert.equal(launchPlan.checkpoints.some((checkpoint) => checkpoint.id === 'master_brief_ready'), false);
  assert.equal(launchPlan.checkpoints.some((checkpoint) => checkpoint.id === 'targeted_invitation_plan_ready'), false);
  assert.equal(launchPlan.checkpoints.some((checkpoint) => checkpoint.id === 'promotion_submitted'), false);
  assert.equal(launchPlan.checkpoints.find((checkpoint) => checkpoint.id === 'planning_center_page_live').taskPolicy, 'monitor');
});

test('adds only selected study-level communication channels', () => {
  const launchPlan = createLaunchPlan(orangevilleMonday, {
    profiles: ['universal_core', 'planning_center_information_page', 'compass_news', 'social_media', 'sunday_slide'],
  });

  assert.equal(launchPlan.profiles.includes('compass_news'), false);
  assert.equal(launchPlan.checkpoints.some((checkpoint) => checkpoint.id === 'compass_news_copy_ready'), false);
  assert.equal(launchPlan.checkpoints.some((checkpoint) => checkpoint.id === 'social_media_copy_ready'), true);
  assert.equal(launchPlan.checkpoints.some((checkpoint) => checkpoint.id === 'sunday_slide_brief_ready'), true);
  assert.match(
    launchPlan.checkpoints.find((checkpoint) => checkpoint.id === 'sunday_slide_brief_ready').description,
    /widescreen pre-roll/i,
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
  assert.deepEqual(page.dependsOn, ['planning_center_copy_ready', 'planning_center_independent_proof']);
});

test('calculates a business-day attention date separately from the target date', () => {
  const launchPlan = createLaunchPlan(orangevilleMonday);
  const masterBlurb = launchPlan.checkpoints.find((checkpoint) => checkpoint.id === 'planning_center_copy_ready');

  assert.equal(masterBlurb.calculatedDueDate, '2026-08-10');
  assert.equal(getCheckpointAttentionDate(masterBlurb), '2026-08-03');

  masterBlurb.dueDateOverride = '2026-07-27';
  assert.equal(getCheckpointAttentionDate(masterBlurb), '2026-07-20');
});

test('updates the automatic Planning Center owner when the production path changes', () => {
  const adminPlan = createLaunchPlan(orangevilleMonday);
  const selfServicePlan = createLaunchPlan(orangevilleMonday, { ...adminPlan, productionPath: 'jonathan_self_service' });
  const selfServicePage = selfServicePlan.checkpoints.find((checkpoint) => checkpoint.id === 'planning_center_page_live');
  assert.equal(selfServicePage.owner, 'Jonathan');

  selfServicePage.owner = 'Sarah';
  const customOwnerPlan = createLaunchPlan(orangevilleMonday, selfServicePlan);
  assert.equal(customOwnerPlan.checkpoints.find((checkpoint) => checkpoint.id === 'planning_center_page_live').owner, 'Sarah');
});

test('uses the no-public-page exception when a public page is not required', () => {
  const plan = createLaunchPlan(orangevilleMonday, {
    pageMode: 'not_required',
    profiles: ['universal_core', 'planning_center_information_page'],
  });

  assert.equal(plan.profiles.includes('planning_center_information_page'), false);
  assert.equal(plan.checkpoints.some((checkpoint) => checkpoint.id === 'planning_center_page_live'), false);
  assert.equal(plan.checkpoints.some((checkpoint) => checkpoint.id === 'public_information_exception_confirmed'), true);
  assert.deepEqual(
    plan.checkpoints.find((checkpoint) => checkpoint.id === 'leaders_notified_launch_ready').dependsOn,
    ['public_information_exception_confirmed', 'venue_host_av_ready'],
  );
});

test('combines signup configuration and end-to-end testing, with payment conditional', () => {
  const optional = createLaunchPlan(orangevilleMonday, { pageMode: 'optional_signup' });
  const paid = createLaunchPlan(orangevilleMonday, { pageMode: 'paid_registration' });
  const registration = optional.checkpoints.find((checkpoint) => checkpoint.id === 'planning_center_registration_settings_verified');

  assert.equal(Boolean(registration), true);
  assert.match(registration.description, /required phone number/i);
  assert.match(registration.description, /tested end to end/i);
  assert.equal(optional.checkpoints.some((checkpoint) => checkpoint.id === 'signup_flow_verified'), false);
  assert.equal(optional.checkpoints.some((checkpoint) => checkpoint.id === 'payment_flow_verified'), false);
  assert.equal(paid.checkpoints.some((checkpoint) => checkpoint.id === 'payment_flow_verified'), true);
});

test('makes final leader notification depend on every applicable readiness endpoint', () => {
  const launchPlan = createLaunchPlan(orangevilleMonday, {
    pageMode: 'paid_registration',
    profiles: ['universal_core', 'planning_center_information_page', 'physical_resource', 'digital_streaming', 'social_media', 'sunday_slide'],
  });
  const notification = launchPlan.checkpoints.find((checkpoint) => checkpoint.id === 'leaders_notified_launch_ready');

  assert.deepEqual(notification.dependsOn, [
    'planning_center_page_live',
    'planning_center_registration_settings_verified',
    'payment_flow_verified',
    'physical_resource_received',
    'digital_access_tested',
    'social_media_copy_ready',
    'sunday_slide_brief_ready',
    'venue_host_av_ready',
  ]);
});

test('preserves progress while recalculating dates', () => {
  const first = createLaunchPlan(orangevilleMonday);
  const ordered = first.checkpoints.find((checkpoint) => checkpoint.id === 'physical_resource_ordered');
  ordered.status = 'done';
  ordered.notes = 'Supplier confirmed the order by email.';
  ordered.evidence = 'Order placed';
  ordered.completedAt = '2026-07-14';

  const revised = createLaunchPlan({ ...orangevilleMonday, startDate: '2026-09-28' }, first);
  const preserved = revised.checkpoints.find((checkpoint) => checkpoint.id === 'physical_resource_ordered');

  assert.equal(preserved.status, 'done');
  assert.equal(preserved.notes, ordered.notes);
  assert.equal(preserved.evidence, ordered.evidence);
  assert.equal(preserved.calculatedDueDate, '2026-08-17');
});

test('migrates version-6 progress without falsely completing combined or final checkpoints', () => {
  const versionSix = {
    version: 6,
    profiles: ['universal_core', 'planning_center_information_page'],
    pageMode: 'required_signup',
    productionPath: 'admin_handoff',
    checkpoints: [
      { id: 'planning_center_copy_ready', status: 'done', evidence: 'Live copy approved.' },
      { id: 'planning_center_registration_settings_verified', status: 'done', notes: 'Settings complete.' },
      { id: 'signup_flow_verified', status: 'in_progress', notes: 'Subscriber delivery still to test.' },
      { id: 'leader_communication_confirmed', status: 'done', evidence: 'Old acknowledgement received.' },
    ],
  };
  const migrated = createLaunchPlan(orangevilleMonday, versionSix);
  const ids = migrated.checkpoints.map((checkpoint) => checkpoint.id);
  const registration = migrated.checkpoints.find((checkpoint) => checkpoint.id === 'planning_center_registration_settings_verified');
  const leaders = migrated.checkpoints.find((checkpoint) => checkpoint.id === 'leaders_notified_launch_ready');

  assert.equal(migrated.version, 7);
  assert.equal(ids.includes('signup_flow_verified'), false);
  assert.equal(ids.includes('leader_communication_confirmed'), false);
  assert.equal(registration.status, 'in_progress');
  assert.match(registration.notes, /Settings complete/);
  assert.match(registration.notes, /Subscriber delivery still to test/);
  assert.equal(leaders.status, 'not_started');
  assert.equal(leaders.completedAt, '');
});

test('marks the combined registration checkpoint done only when both legacy parts were complete', () => {
  const migrated = createLaunchPlan(orangevilleMonday, {
    version: 6,
    pageMode: 'optional_signup',
    productionPath: 'admin_handoff',
    checkpoints: [
      { id: 'planning_center_registration_settings_verified', status: 'done' },
      { id: 'signup_flow_verified', status: 'done', completedAt: '2026-08-04' },
    ],
  });
  const registration = migrated.checkpoints.find((checkpoint) => checkpoint.id === 'planning_center_registration_settings_verified');
  assert.equal(registration.status, 'done');
  assert.equal(registration.completedAt, '2026-08-04');
});

test('splits the ministry-year grid into the next study per stream and later studies', () => {
  const shelburne = { ...orangevilleMonday, id: 'shel-one', ministryId: 'womens_shel', location: 'Shelburne', startDate: '2026-09-15' };
  const orangevilleLater = { ...orangevilleMonday, id: 'orange-two', title: 'Winter study', startDate: '2027-01-11' };
  const outsideYear = { ...orangevilleMonday, id: 'outside', startDate: '2027-09-20' };
  const sections = getLaunchGridSections([orangevilleLater, outsideYear, orangevilleMonday, shelburne], '2026-08-06');

  assert.equal(sections.ministryYearLabel, '2026-2027');
  assert.deepEqual(sections.nextStudies.map((study) => study.id), ['shel-one', 'orangeville-one']);
  assert.deepEqual(sections.laterStudies.map((study) => study.id), ['orange-two']);
});

test('summarizes overdue, blocked, and completion state', () => {
  const launchPlan = createLaunchPlan(orangevilleMonday);
  launchPlan.checkpoints[0].status = 'done';
  launchPlan.checkpoints[1].status = 'blocked';
  launchPlan.checkpoints[1].blocker = 'Waiting on dates';
  const summary = getLaunchSummary({ ...orangevilleMonday, launchPlan }, '2026-08-11');

  assert.equal(summary.complete, 1);
  assert.equal(summary.blocked, 1);
  assert.equal(summary.overdue > 0, true);
  assert.equal(Boolean(summary.nextCheckpoint), true);
});

test('identifies past studies from an explicit or calculated end date', () => {
  assert.equal(getStudyEndDate(orangevilleMonday), '2026-11-16');
  assert.equal(isStudyPast(orangevilleMonday, '2026-11-17'), true);
  assert.equal(isStudyPast(orangevilleMonday, '2026-11-16'), false);
  assert.equal(isStudyPast({ ...orangevilleMonday, launchPlan: { studyEndDate: '2026-10-30' } }, '2026-10-31'), true);
});

test('defaults the calendar to the earliest active or upcoming ministry year', () => {
  const pastStudy = { ...orangevilleMonday, startDate: '2025-09-22', weeks: 8 };
  const upcomingStudy = { ...orangevilleMonday, startDate: '2026-09-21' };

  assert.equal(getDefaultMinistryYearStart([pastStudy, upcomingStudy], '2026-07-16'), 2026);
  assert.equal(getDefaultMinistryYearStart([pastStudy], '2026-07-16'), 2026);
  assert.equal(getDefaultMinistryYearStart([], '2026-02-16'), 2025);
});

test('calculates readiness without post-launch follow-up checkpoints', () => {
  const launchPlan = createLaunchPlan(orangevilleMonday);
  launchPlan.checkpoints.forEach((checkpoint) => {
    checkpoint.status = checkpoint.affectsReadiness === false ? 'blocked' : 'done';
  });
  const venue = launchPlan.checkpoints.find((checkpoint) => checkpoint.id === 'venue_host_av_ready');
  venue.status = 'accepted_risk';
  venue.acceptedRiskOwner = 'Jonathan';
  venue.acceptedRiskMitigation = 'Confirm the remaining signage on arrival.';
  venue.acceptedRiskReviewDate = '2026-09-21';

  const summary = getLaunchSummary({ ...orangevilleMonday, launchPlan }, '2026-09-20');
  assert.equal(summary.ready, true);
  assert.equal(summary.readinessPercent, 100);
  assert.equal(summary.acceptedRisk, 1);
});

test('requires decision details for not-required and accepted-risk completion', () => {
  const launchPlan = createLaunchPlan(orangevilleMonday);
  const digital = launchPlan.checkpoints.find((checkpoint) => checkpoint.id === 'digital_access_tested');
  const venue = launchPlan.checkpoints.find((checkpoint) => checkpoint.id === 'venue_host_av_ready');
  digital.status = 'not_required';
  venue.status = 'accepted_risk';

  let summary = getLaunchSummary({ ...orangevilleMonday, launchPlan }, '2026-08-01');
  assert.equal(summary.missingCompletionDetails, 2);

  digital.notRequiredReason = 'The approved study has no digital component.';
  venue.acceptedRiskOwner = 'Jonathan';
  venue.acceptedRiskMitigation = 'Use the portable speaker if needed.';
  venue.acceptedRiskReviewDate = '2026-09-21';
  summary = getLaunchSummary({ ...orangevilleMonday, launchPlan }, '2026-08-01');
  assert.equal(summary.missingCompletionDetails, 0);
});

test('sanitizes nested launch data and preserves legacy profile inference', () => {
  const launchPlan = createLaunchPlan(orangevilleMonday, {
    profiles: ['universal_core', 'planning_center_information_page', 'social_media'],
  });
  launchPlan.version = 3;
  launchPlan.profiles = ['universal_core', 'planning_center_information_page'];
  launchPlan.checkpoints[0].status = 'mystery';
  const result = sanitizeLaunchPlan(launchPlan);

  assert.equal(result.errors.some((error) => error.includes('Invalid launchPlan.checkpoints[0].status')), true);
  assert.equal(result.launchPlan.checkpoints[0].status, 'not_started');
  assert.equal(result.launchPlan.version, 7);
  assert.equal(result.launchPlan.profiles.includes('social_media'), true);
});

test('sanitizes checkpoint working notes independently from completion evidence', () => {
  const launchPlan = createLaunchPlan(orangevilleMonday);
  const masterBlurb = launchPlan.checkpoints.find((checkpoint) => checkpoint.id === 'planning_center_copy_ready');
  masterBlurb.notes = 'Master blurb draft with audience, dates, location, resources, and next step.';
  masterBlurb.evidence = 'Approved by Jonathan on 2026-07-18.';

  const result = sanitizeLaunchPlan(launchPlan);
  const sanitized = result.launchPlan.checkpoints.find((checkpoint) => checkpoint.id === 'planning_center_copy_ready');

  assert.deepEqual(result.errors, []);
  assert.equal(sanitized.notes, masterBlurb.notes);
  assert.equal(sanitized.evidence, masterBlurb.evidence);
});

test('prevents final leader notification before readiness dependencies are complete', () => {
  const launchPlan = createLaunchPlan(orangevilleMonday);
  launchPlan.checkpoints.find((checkpoint) => checkpoint.id === 'leaders_notified_launch_ready').status = 'done';
  const result = sanitizeLaunchPlan(launchPlan);

  assert.equal(result.errors.some((error) => error.includes('leaders_notified_launch_ready cannot be done before')), true);
});
