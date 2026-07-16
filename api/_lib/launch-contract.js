export const LAUNCH_PLAN_VERSION = 1;

export const LAUNCH_STATUSES = [
  'not_started',
  'in_progress',
  'waiting_on_owner',
  'blocked',
  'done',
  'not_required',
  'accepted_risk',
];

export const LAUNCH_PROFILE_IDS = [
  'universal_core',
  'planning_center_information_page',
  'physical_resource',
  'digital_streaming',
  'offsite_or_home_hosted',
  'sunday_services_promotion',
  'kickoff_before_study',
];

export const PLANNING_CENTER_PAGE_MODES = [
  'information_only',
  'optional_signup',
  'required_signup',
  'paid_registration',
  'not_required',
];

export const PLANNING_CENTER_PRODUCTION_PATHS = [
  'admin_handoff',
  'jonathan_self_service',
  'other_owner',
];

export const LAUNCH_PROFILE_LABELS = {
  universal_core: 'Universal launch core',
  planning_center_information_page: 'Planning Center information page',
  physical_resource: 'Physical books or workbooks',
  digital_streaming: 'Digital or streamed material',
  offsite_or_home_hosted: 'Offsite or home-hosted',
  sunday_services_promotion: 'Sunday services promotion',
  kickoff_before_study: 'Kickoff before first study session',
};

export const LAUNCH_CHECKPOINT_TEMPLATES = [
  {
    id: 'facts_locked',
    title: 'Public facts confirmed',
    description: 'Title, material, dates, time, location wording, and leader contact agree across sources.',
    profile: 'universal_core',
    anchor: 'first_study_session_date',
    offsetDays: -56,
    owner: 'Jonathan',
  },
  {
    id: 'master_brief_ready',
    title: 'Master communication brief ready',
    description: 'One approved brief is ready to drive the Planning Center page and every communication channel.',
    profile: 'universal_core',
    anchor: 'first_study_session_date',
    offsetDays: -49,
    owner: 'Jonathan',
  },
  {
    id: 'planning_center_page_live',
    title: 'Planning Center information page live',
    description: 'The public information page is published, accurate, link-tested, and verified.',
    profile: 'planning_center_information_page',
    anchor: 'public_launch_date',
    offsetDays: 0,
    owner: 'Director of Admin',
  },
  {
    id: 'planning_center_independent_proof',
    title: 'Independent proof obtained',
    description: 'Required only when Jonathan builds or materially corrects the Planning Center page.',
    profile: 'planning_center_information_page',
    anchor: 'public_launch_date',
    offsetDays: -1,
    owner: 'Jonathan',
    condition: 'jonathan_self_service',
  },
  {
    id: 'physical_resource_ordered',
    title: 'Physical resources ordered',
    description: 'Quantity, supplier, cost, return terms, approval, and expected delivery are recorded.',
    profile: 'physical_resource',
    anchor: 'first_study_session_date',
    offsetDays: -42,
    owner: 'Jonathan',
  },
  {
    id: 'physical_resource_received',
    title: 'Physical resources received and ready',
    description: 'Quantity and condition are verified and the distribution plan is ready.',
    profile: 'physical_resource',
    anchor: 'first_study_session_date',
    offsetDays: -14,
    owner: 'Jonathan',
  },
  {
    id: 'digital_access_tested',
    title: 'Digital access and playback tested',
    description: 'Licensing, actual-account access, room equipment, sound, display, and fallback are confirmed.',
    profile: 'digital_streaming',
    anchor: 'first_study_session_date',
    offsetDays: -14,
    owner: 'Jonathan',
  },
  {
    id: 'promotion_submitted',
    title: 'Promotion package submitted',
    description: 'Applicable channels, owners, dates, approved copy, call to action, and assets are recorded.',
    profile: 'universal_core',
    anchor: 'first_study_session_date',
    offsetDays: -35,
    owner: 'Jonathan',
  },
  {
    id: 'sunday_services_verified',
    title: 'Sunday services elements verified',
    description: 'Requested slides, pre-roll, announcements, or spoken cues are scheduled and accurate.',
    profile: 'sunday_services_promotion',
    anchor: 'first_study_session_date',
    offsetDays: -14,
    owner: 'Jonathan',
  },
  {
    id: 'leader_communication_confirmed',
    title: 'Leader communication confirmed',
    description: 'Leaders know the plan, participant route, resource plan, cancellation process, and support contact.',
    profile: 'universal_core',
    anchor: 'first_study_session_date',
    offsetDays: -14,
    owner: 'Jonathan',
  },
  {
    id: 'venue_host_av_ready',
    title: 'Venue, host, and AV ready',
    description: 'Access, setup, accessibility, hospitality, AV, signage, and cancellation route are confirmed.',
    profile: 'universal_core',
    anchor: 'kickoff_or_first_session_date',
    offsetDays: -7,
    owner: 'Jonathan',
  },
  {
    id: 'offsite_privacy_ready',
    title: 'Offsite privacy and access ready',
    description: 'Private address handling, parking, accessibility, weather route, and local contact are confirmed.',
    profile: 'offsite_or_home_hosted',
    anchor: 'kickoff_or_first_session_date',
    offsetDays: -7,
    owner: 'Jonathan',
  },
  {
    id: 'kickoff_ready',
    title: 'Kickoff event ready',
    description: 'Kickoff-specific hospitality, communication, room, leader, and participant details are complete.',
    profile: 'kickoff_before_study',
    anchor: 'kickoff_date',
    offsetDays: -2,
    owner: 'Jonathan',
  },
  {
    id: 'final_readiness_complete',
    title: 'Final readiness review complete',
    description: 'Every required checkpoint is done, not required, or has an explicitly accepted risk.',
    profile: 'universal_core',
    anchor: 'kickoff_or_first_session_date',
    offsetDays: -2,
    owner: 'Jonathan',
  },
  {
    id: 'week_one_check_in',
    title: 'Week-one leader check-in complete',
    description: 'Group health, leader strain, participant fit, resources, technology, and follow-up are reviewed.',
    profile: 'universal_core',
    anchor: 'first_study_session_date',
    offsetDays: 10,
    owner: 'Jonathan',
  },
  {
    id: 'launch_lessons_captured',
    title: 'Launch lessons captured',
    description: 'Wins, friction, costs, inventory, communication results, and SOP or tracker changes are recorded.',
    profile: 'universal_core',
    anchor: 'study_end_date',
    offsetDays: 0,
    owner: 'Jonathan',
  },
];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const COMPLETE_STATUSES = new Set(['done', 'not_required']);

function unique(values) {
  return [...new Set(values)];
}

function parseDate(value) {
  if (!DATE_PATTERN.test(value || '')) return null;
  const date = new Date(`${value}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(dateValue, days) {
  const date = parseDate(dateValue);
  if (!date) return '';
  date.setUTCDate(date.getUTCDate() + days);
  return formatDate(date);
}

export function inferLaunchProfiles(study) {
  const profiles = ['universal_core', 'planning_center_information_page'];
  if (study.physicalResources && study.physicalResources !== 'Not required') profiles.push('physical_resource');
  if (study.digitalResources && study.digitalResources !== 'Not required') profiles.push('digital_streaming');
  return profiles;
}

function studyEndDate(study, plan) {
  if (DATE_PATTERN.test(plan.studyEndDate || '')) return plan.studyEndDate;
  const weeks = Number.isInteger(study.weeks) ? study.weeks : Number(study.weeks || 6);
  return addDays(study.startDate, Math.max(1, weeks) * 7);
}

function resolveAnchor(study, plan, anchor) {
  if (anchor === 'public_launch_date') return plan.publicLaunchDate || addDays(study.startDate, -42);
  if (anchor === 'kickoff_date') return plan.kickoffDate || study.startDate;
  if (anchor === 'kickoff_or_first_session_date') return plan.kickoffDate || study.startDate;
  if (anchor === 'study_end_date') return studyEndDate(study, plan);
  return study.startDate;
}

function templateApplies(template, profiles, productionPath) {
  if (!profiles.includes(template.profile)) return false;
  if (template.condition === 'jonathan_self_service') return productionPath === 'jonathan_self_service';
  return true;
}

export function createLaunchPlan(study, existingPlan = {}) {
  const productionPath = PLANNING_CENTER_PRODUCTION_PATHS.includes(existingPlan.productionPath)
    ? existingPlan.productionPath
    : 'admin_handoff';
  const pageMode = PLANNING_CENTER_PAGE_MODES.includes(existingPlan.pageMode)
    ? existingPlan.pageMode
    : 'information_only';
  const requestedProfiles = existingPlan.profiles?.length ? existingPlan.profiles : inferLaunchProfiles(study);
  const profiles = unique(['universal_core', ...requestedProfiles])
    .filter((profile) => LAUNCH_PROFILE_IDS.includes(profile))
    .filter((profile) => pageMode !== 'not_required' || profile !== 'planning_center_information_page');
  if (!profiles.includes('planning_center_information_page') && pageMode !== 'not_required') {
    profiles.push('planning_center_information_page');
  }

  const plan = {
    version: LAUNCH_PLAN_VERSION,
    enabled: existingPlan.enabled !== false,
    profiles,
    pageMode,
    productionPath,
    publicLaunchDate: existingPlan.publicLaunchDate || addDays(study.startDate, -42),
    kickoffDate: existingPlan.kickoffDate || '',
    studyEndDate: existingPlan.studyEndDate || studyEndDate(study, existingPlan),
    independentProofObtained: Boolean(existingPlan.independentProofObtained),
    checkpoints: [],
  };

  const existingById = new Map((existingPlan.checkpoints || []).map((checkpoint) => [checkpoint.id, checkpoint]));
  plan.checkpoints = LAUNCH_CHECKPOINT_TEMPLATES
    .filter((template) => templateApplies(template, profiles, productionPath))
    .map((template) => {
      const previous = existingById.get(template.id) || {};
      const calculatedDueDate = addDays(resolveAnchor(study, plan, template.anchor), template.offsetDays);
      return {
        id: template.id,
        title: template.title,
        description: template.description,
        owner: previous.owner || template.owner,
        status: LAUNCH_STATUSES.includes(previous.status) ? previous.status : 'not_started',
        calculatedDueDate,
        dueDateOverride: previous.dueDateOverride || '',
        nextAction: previous.nextAction || '',
        blocker: previous.blocker || '',
        evidence: previous.evidence || '',
        completedAt: previous.completedAt || '',
      };
    });

  return plan;
}

export function effectiveDueDate(checkpoint) {
  return checkpoint.dueDateOverride || checkpoint.calculatedDueDate || '';
}

export function getLaunchSummary(study, today = new Date().toISOString().slice(0, 10)) {
  if (!study.launchPlan?.enabled) {
    return {
      enabled: false,
      total: 0,
      complete: 0,
      readinessPercent: 0,
      blocked: 0,
      overdue: 0,
      dueSoon: 0,
      nextCheckpoint: null,
    };
  }

  const checkpoints = study.launchPlan.checkpoints || [];
  const incomplete = checkpoints.filter((checkpoint) => !COMPLETE_STATUSES.has(checkpoint.status));
  const blocked = incomplete.filter((checkpoint) => checkpoint.status === 'blocked');
  const overdue = incomplete.filter((checkpoint) => {
    const dueDate = effectiveDueDate(checkpoint);
    return dueDate && dueDate < today;
  });
  const dueSoonCutoff = addDays(today, 14);
  const dueSoon = incomplete.filter((checkpoint) => {
    const dueDate = effectiveDueDate(checkpoint);
    return dueDate && dueDate >= today && dueDate <= dueSoonCutoff;
  });
  const ordered = [...incomplete].sort((left, right) => {
    const leftBlocked = left.status === 'blocked' ? 0 : 1;
    const rightBlocked = right.status === 'blocked' ? 0 : 1;
    if (leftBlocked !== rightBlocked) return leftBlocked - rightBlocked;
    return effectiveDueDate(left).localeCompare(effectiveDueDate(right));
  });
  const complete = checkpoints.length - incomplete.length;

  return {
    enabled: true,
    total: checkpoints.length,
    complete,
    readinessPercent: checkpoints.length ? Math.round((complete / checkpoints.length) * 100) : 0,
    blocked: blocked.length,
    overdue: overdue.length,
    dueSoon: dueSoon.length,
    nextCheckpoint: ordered[0] || null,
  };
}

function cleanText(value, maxLength, field, errors) {
  if (typeof value !== 'string') {
    errors.push(`${field} must be a string.`);
    return '';
  }
  if (value.length > maxLength) errors.push(`${field} must be ${maxLength} characters or fewer.`);
  return value.slice(0, maxLength);
}

function cleanOptionalDate(value, field, errors) {
  if (value === '' || value == null) return '';
  if (!DATE_PATTERN.test(value)) errors.push(`${field} must use YYYY-MM-DD.`);
  return DATE_PATTERN.test(value) ? value : '';
}

export function sanitizeLaunchPlan(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { launchPlan: null, errors: ['launchPlan must be a JSON object.'] };
  }

  const errors = [];
  const profiles = Array.isArray(input.profiles)
    ? unique(input.profiles.filter((profile) => LAUNCH_PROFILE_IDS.includes(profile)))
    : [];
  if (!profiles.includes('universal_core')) profiles.unshift('universal_core');

  const pageMode = PLANNING_CENTER_PAGE_MODES.includes(input.pageMode) ? input.pageMode : null;
  if (!pageMode) errors.push(`Invalid launchPlan.pageMode: ${input.pageMode}`);
  const productionPath = PLANNING_CENTER_PRODUCTION_PATHS.includes(input.productionPath)
    ? input.productionPath
    : null;
  if (!productionPath) errors.push(`Invalid launchPlan.productionPath: ${input.productionPath}`);

  if (!Array.isArray(input.checkpoints)) errors.push('launchPlan.checkpoints must be an array.');
  if (input.checkpoints?.length > 100) errors.push('launchPlan.checkpoints cannot exceed 100 items.');

  const seenIds = new Set();
  const checkpoints = (Array.isArray(input.checkpoints) ? input.checkpoints : []).slice(0, 100).map((checkpoint, index) => {
    const prefix = `launchPlan.checkpoints[${index}]`;
    if (!checkpoint || typeof checkpoint !== 'object' || Array.isArray(checkpoint)) {
      errors.push(`${prefix} must be an object.`);
      return null;
    }
    const id = cleanText(checkpoint.id, 80, `${prefix}.id`, errors);
    if (!id) errors.push(`${prefix}.id is required.`);
    if (seenIds.has(id)) errors.push(`${prefix}.id must be unique.`);
    seenIds.add(id);
    if (!LAUNCH_STATUSES.includes(checkpoint.status)) errors.push(`Invalid ${prefix}.status: ${checkpoint.status}`);
    return {
      id,
      title: cleanText(checkpoint.title || '', 160, `${prefix}.title`, errors),
      description: cleanText(checkpoint.description || '', 600, `${prefix}.description`, errors),
      owner: cleanText(checkpoint.owner || '', 120, `${prefix}.owner`, errors),
      status: LAUNCH_STATUSES.includes(checkpoint.status) ? checkpoint.status : 'not_started',
      calculatedDueDate: cleanOptionalDate(checkpoint.calculatedDueDate, `${prefix}.calculatedDueDate`, errors),
      dueDateOverride: cleanOptionalDate(checkpoint.dueDateOverride, `${prefix}.dueDateOverride`, errors),
      nextAction: cleanText(checkpoint.nextAction || '', 500, `${prefix}.nextAction`, errors),
      blocker: cleanText(checkpoint.blocker || '', 500, `${prefix}.blocker`, errors),
      evidence: cleanText(checkpoint.evidence || '', 1000, `${prefix}.evidence`, errors),
      completedAt: cleanOptionalDate(checkpoint.completedAt, `${prefix}.completedAt`, errors),
    };
  }).filter(Boolean);

  const launchPlan = {
    version: LAUNCH_PLAN_VERSION,
    enabled: input.enabled !== false,
    profiles,
    pageMode: pageMode || 'information_only',
    productionPath: productionPath || 'admin_handoff',
    publicLaunchDate: cleanOptionalDate(input.publicLaunchDate, 'launchPlan.publicLaunchDate', errors),
    kickoffDate: cleanOptionalDate(input.kickoffDate, 'launchPlan.kickoffDate', errors),
    studyEndDate: cleanOptionalDate(input.studyEndDate, 'launchPlan.studyEndDate', errors),
    independentProofObtained: Boolean(input.independentProofObtained),
    checkpoints,
  };

  if (launchPlan.productionPath === 'jonathan_self_service' && !launchPlan.independentProofObtained) {
    const proofCheckpoint = checkpoints.find((checkpoint) => checkpoint.id === 'planning_center_independent_proof');
    if (proofCheckpoint?.status === 'done') launchPlan.independentProofObtained = true;
  }

  return { launchPlan, errors: [...new Set(errors)] };
}
