import assert from 'node:assert/strict';
import test from 'node:test';

import {
  enrichStudy,
  ministryYearForDate,
  sanitizeStudyChanges,
  studyIdentity,
} from './study-contract.js';

test('maps dates into the September-to-August ministry year', () => {
  assert.equal(ministryYearForDate('2027-01-11'), '2026-2027');
  assert.equal(ministryYearForDate('2026-09-21'), '2026-2027');
});

test('surfaces resource and promotion action signals without inventing due dates', () => {
  const study = enrichStudy({
    title: 'Luke',
    ministryId: 'womens_mon',
    startDate: '2026-09-21',
    stage: 'sourcing',
    studyMaterial: 'Approved / Team Notified',
    physicalResources: 'Order placed',
    digitalResources: 'Required',
    resourcesObtained: false,
    websiteUpdated: false,
  });

  assert.equal(study.ministryYear, '2026-2027');
  assert.deepEqual(study.actionSignals.map((signal) => signal.code), [
    'physical-resources',
    'digital-resources',
    'promotion',
  ]);
});

test('does not flag physical resources when none are required', () => {
  const study = enrichStudy({
    startDate: '2026-09-21',
    stage: 'sourcing',
    studyMaterial: 'Approved / Team Notified',
    physicalResources: 'Not required',
    digitalResources: 'Not required',
    resourcesObtained: false,
    websiteUpdated: true,
  });

  assert.equal(study.needsAction, false);
});

test('creation validation supplies defaults and rejects unknown fields', () => {
  const result = sanitizeStudyChanges({
    title: '  Luke  ',
    ministryId: 'womens_mon',
    startDate: '2026-09-21',
    privateSecret: 'nope',
  }, { creating: true });

  assert.equal(result.changes.title, 'Luke');
  assert.equal(result.changes.weeks, 6);
  assert.deepEqual(result.errors, ['Field is not writable: privateSecret']);
});

test('study identity is stable across casing and whitespace', () => {
  assert.equal(
    studyIdentity({ title: ' Luke ', ministryId: 'WOMENS_MON', startDate: '2026-09-21' }),
    'luke|womens_mon|2026-09-21',
  );
});

test('accepts a validated launch plan as a writable nested field', () => {
  const result = sanitizeStudyChanges({
    launchPlan: {
      version: 1,
      enabled: true,
      profiles: ['universal_core', 'planning_center_information_page'],
      pageMode: 'information_only',
      productionPath: 'admin_handoff',
      publicLaunchDate: '2026-08-10',
      studyEndDate: '2026-11-16',
      independentProofObtained: false,
      checkpoints: [{
        id: 'facts_locked',
        title: 'Public facts confirmed',
        description: '',
        owner: 'Jonathan',
        status: 'done',
        calculatedDueDate: '2026-07-27',
        dueDateOverride: '',
        nextAction: '',
        blocker: '',
        evidence: 'Confirmed from ministry calendar',
        completedAt: '2026-07-16',
      }],
    },
  });

  assert.deepEqual(result.errors, []);
  assert.equal(result.changes.launchPlan.pageMode, 'information_only');
  assert.equal(result.changes.launchPlan.checkpoints[0].status, 'done');
});
