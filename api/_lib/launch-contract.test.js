import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createLaunchPlan,
  getLaunchSummary,
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

test('creates a backward-compatible launch plan with inferred resource profiles', () => {
  const launchPlan = createLaunchPlan(orangevilleMonday);

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
});

test('adds the independent-proof checkpoint only for Jonathan self-service', () => {
  const launchPlan = createLaunchPlan(orangevilleMonday, { productionPath: 'jonathan_self_service' });
  const proof = launchPlan.checkpoints.find((checkpoint) => checkpoint.id === 'planning_center_independent_proof');

  assert.equal(Boolean(proof), true);
  assert.equal(proof.calculatedDueDate, '2026-08-09');
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
});

test('sanitizes nested launch data and rejects invalid checkpoint status', () => {
  const launchPlan = createLaunchPlan(orangevilleMonday);
  launchPlan.checkpoints[0].status = 'mystery';

  const result = sanitizeLaunchPlan(launchPlan);

  assert.equal(result.errors.some((error) => error.includes('Invalid launchPlan.checkpoints[0].status')), true);
  assert.equal(result.launchPlan.checkpoints[0].status, 'not_started');
});
