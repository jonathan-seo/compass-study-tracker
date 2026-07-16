import { getLaunchSummary, sanitizeLaunchPlan } from './launch-contract.js';

export const MINISTRY_IDS = [
  'mens',
  'womens_mon',
  'womens_thu',
  'womens_shel',
  'womens_gv',
  'seniors',
  'focus_groups',
];

export const STAGES = ['planning', 'approval', 'sourcing', 'promotion', 'active', 'review'];
export const STUDY_MATERIAL = [
  'Not Started',
  'Requested from Team',
  'Received from Team',
  'Reviewed by Director',
  'Approved / Team Notified',
];
export const PHYSICAL_RESOURCES = [
  'Required',
  'Quote request sent',
  'Order placed',
  'Received and distributed',
  'Not required',
];
export const DIGITAL_RESOURCES = ['Required', 'Procured and available', 'Not required'];
export const LIVE_TRACKING = ['Not started', 'In Progress', 'Completed'];
export const POST_REVIEW = ['Not Started', 'In Progress', 'Completed'];
export const LOCATIONS = ['Orangeville', 'Shelburne', 'Grand Valley', 'Other'];

export const WRITABLE_FIELDS = [
  'title',
  'ministryId',
  'startDate',
  'weeks',
  'location',
  'stage',
  'studyMaterial',
  'physicalResources',
  'digitalResources',
  'imageUrl',
  'resourcesObtained',
  'websiteUpdated',
  'liveTracking',
  'postReview',
  'notes',
  'promoText',
  'updates',
  'launchPlan',
];

const DEFAULTS = {
  weeks: 6,
  location: 'Orangeville',
  stage: 'planning',
  studyMaterial: 'Not Started',
  physicalResources: 'Not required',
  digitalResources: 'Not required',
  imageUrl: '',
  resourcesObtained: false,
  websiteUpdated: false,
  liveTracking: 'Not started',
  postReview: 'Not Started',
  notes: '',
  promoText: '',
  updates: '',
};

const ENUM_FIELDS = {
  ministryId: MINISTRY_IDS,
  stage: STAGES,
  studyMaterial: STUDY_MATERIAL,
  physicalResources: PHYSICAL_RESOURCES,
  digitalResources: DIGITAL_RESOURCES,
  liveTracking: LIVE_TRACKING,
  postReview: POST_REVIEW,
  location: LOCATIONS,
};

const TEXT_FIELDS = ['title', 'imageUrl', 'notes', 'promoText', 'updates'];
const BOOLEAN_FIELDS = ['resourcesObtained', 'websiteUpdated'];

export function ministryYearForDate(startDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate || '')) return null;
  const year = Number(startDate.slice(0, 4));
  const month = Number(startDate.slice(5, 7));
  return month >= 9 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

export function getActionSignals(study) {
  const signals = [];
  const stageIndex = STAGES.indexOf(study.stage);
  const sourcingOrLater = stageIndex >= STAGES.indexOf('sourcing');
  const hasLaunchPlan = study.launchPlan?.enabled === true;

  if (study.studyMaterial !== 'Approved / Team Notified' && stageIndex >= STAGES.indexOf('approval')) {
    signals.push({ code: 'material-review', label: 'Study material still needs approval or team notification' });
  }

  if (!hasLaunchPlan) {
    const physicalOutstanding = !['Not required', 'Received and distributed'].includes(study.physicalResources);
    if (sourcingOrLater && physicalOutstanding && !study.resourcesObtained) {
      signals.push({ code: 'physical-resources', label: `Physical resources: ${study.physicalResources || 'Required'}` });
    }

    if (sourcingOrLater && study.digitalResources === 'Required') {
      signals.push({ code: 'digital-resources', label: 'Digital resources still required' });
    }

    if (sourcingOrLater && !study.websiteUpdated) {
      signals.push({ code: 'promotion', label: 'Website or promotion not complete' });
    }

    if (study.stage === 'active' && study.liveTracking === 'Not started') {
      signals.push({ code: 'live-tracking', label: 'Live-study tracking has not started' });
    }

    if (study.stage === 'review' && study.postReview !== 'Completed') {
      signals.push({ code: 'post-review', label: `Post-study review: ${study.postReview || 'Not Started'}` });
    }
  }

  const launchSummary = getLaunchSummary(study);
  if (launchSummary.enabled && launchSummary.blocked > 0) {
    signals.push({ code: 'launch-blocked', label: `${launchSummary.blocked} launch checkpoint${launchSummary.blocked === 1 ? '' : 's'} blocked` });
  }
  if (launchSummary.enabled && launchSummary.overdue > 0) {
    signals.push({ code: 'launch-overdue', label: `${launchSummary.overdue} launch checkpoint${launchSummary.overdue === 1 ? '' : 's'} overdue` });
  }

  return signals;
}

export function enrichStudy(study) {
  const actionSignals = getActionSignals(study);
  return {
    ...study,
    ministryYear: ministryYearForDate(study.startDate),
    launchSummary: getLaunchSummary(study),
    actionSignals,
    needsAction: actionSignals.length > 0,
  };
}

export function sanitizeStudyChanges(input, { creating = false } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { changes: {}, errors: ['Study data must be a JSON object.'] };
  }

  const source = creating ? { ...DEFAULTS, ...input } : input;
  const changes = {};
  const errors = [];

  for (const key of Object.keys(input)) {
    if (!WRITABLE_FIELDS.includes(key)) errors.push(`Field is not writable: ${key}`);
  }

  for (const field of WRITABLE_FIELDS) {
    if (!(field in source)) continue;
    const value = source[field];

    if (ENUM_FIELDS[field]) {
      if (!ENUM_FIELDS[field].includes(value)) errors.push(`Invalid ${field}: ${value}`);
      else changes[field] = value;
      continue;
    }

    if (TEXT_FIELDS.includes(field)) {
      if (typeof value !== 'string') errors.push(`${field} must be a string.`);
      else changes[field] = field === 'title' ? value.trim() : value;
      continue;
    }

    if (BOOLEAN_FIELDS.includes(field)) {
      if (typeof value !== 'boolean') errors.push(`${field} must be a boolean.`);
      else changes[field] = value;
      continue;
    }

    if (field === 'launchPlan') {
      const result = sanitizeLaunchPlan(value);
      errors.push(...result.errors);
      if (result.launchPlan) changes.launchPlan = result.launchPlan;
      continue;
    }

    if (field === 'startDate') {
      if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        errors.push('startDate must use YYYY-MM-DD.');
      } else changes[field] = value;
      continue;
    }

    if (field === 'weeks') {
      if (!Number.isInteger(value) || value < 1 || value > 104) {
        errors.push('weeks must be an integer between 1 and 104.');
      } else changes[field] = value;
    }
  }

  if (creating) {
    for (const field of ['title', 'ministryId', 'startDate']) {
      if (!changes[field]) errors.push(`${field} is required.`);
    }
  }

  if (changes.imageUrl && !/^https?:\/\//i.test(changes.imageUrl)) {
    errors.push('imageUrl must be empty or an HTTP(S) URL.');
  }

  return { changes, errors: [...new Set(errors)] };
}

export function studyIdentity(study) {
  return [study.title, study.ministryId, study.startDate]
    .map((value) => String(value || '').trim().toLowerCase())
    .join('|');
}
