export const LAUNCH_PLAN_VERSION = 7;

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
  'social_media',
  'sunday_slide',
  'focus_group_companion',
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
  social_media: 'Social media',
  sunday_slide: 'Service announcement graphics',
  focus_group_companion: 'Focus Group companion requirements',
};

export const LAUNCH_CHECKPOINT_TEMPLATES = [
  {
    id: 'planning_center_copy_ready',
    title: 'Planning Center master blurb ready',
    description: 'The final title, purpose, dates, time, location wording, resources, contact route, and next step are ready to build the Planning Center page and supply any selected communication channel.',
    profile: 'planning_center_information_page',
    anchor: 'first_study_session_date',
    offsetDays: -42,
    owner: 'Jonathan',
  },
  {
    id: 'social_media_copy_ready',
    title: 'Social-media copy prepared',
    description: 'The social-media version has been derived from the approved master brief.',
    profile: 'social_media',
    anchor: 'first_study_session_date',
    offsetDays: -42,
    owner: 'Jonathan',
    dependsOn: ['planning_center_copy_ready'],
  },
  {
    id: 'sunday_slide_brief_ready',
    title: 'Service announcement graphics handed off',
    description: 'The appropriate approved Canva graphics, especially the widescreen pre-roll asset, are complete and their shared link has been sent to the current service-announcement owner. The Planning Center master blurb is the copy source; a separate announcement script is not required unless requested.',
    profile: 'sunday_slide',
    anchor: 'first_study_session_date',
    offsetDays: -42,
    owner: 'Jonathan',
    dependsOn: ['planning_center_copy_ready'],
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
    dependsOn: ['planning_center_copy_ready'],
  },
  {
    id: 'planning_center_page_live',
    title: 'Planning Center information page live',
    description: 'The public information page is published, accurate, link-tested, and verified.',
    profile: 'planning_center_information_page',
    anchor: 'public_launch_date',
    offsetDays: 0,
    owner: 'Director of Admin',
    dependsOn: ['planning_center_copy_ready'],
  },
  {
    id: 'planning_center_registration_settings_verified',
    title: 'Registration configured and tested',
    description: 'Compass Office support, required phone number, current subscribers, confirmation message, participation rules, participant-data handling, late entry, and participant/subscriber delivery are configured and tested end to end.',
    profile: 'planning_center_information_page',
    anchor: 'public_launch_date',
    offsetDays: 0,
    owner: 'Jonathan',
    condition: 'signup_enabled',
    dependsOn: ['planning_center_page_live'],
  },
  {
    id: 'payment_flow_verified',
    title: 'Payment and Finance handoff verified',
    description: 'Approved cost, payment, discounts, refunds, close timing, and Finance handoff are confirmed and tested.',
    profile: 'planning_center_information_page',
    anchor: 'public_launch_date',
    offsetDays: 0,
    owner: 'Jonathan',
    condition: 'paid_registration',
    dependsOn: ['planning_center_registration_settings_verified'],
  },
  {
    id: 'public_information_exception_confirmed',
    title: 'No-public-page exception confirmed',
    description: 'The reason, confirming owner, and alternative accurate information path are recorded.',
    profile: 'universal_core',
    anchor: 'public_launch_date',
    offsetDays: -14,
    owner: 'Jonathan',
    condition: 'no_public_page',
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
    anchor: 'resource_distribution_date',
    offsetDays: -7,
    owner: 'Jonathan',
    dependsOn: ['physical_resource_ordered'],
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
    id: 'venue_host_av_ready',
    title: 'Venue, host, and AV ready',
    description: 'Access, setup, accessibility, hospitality, AV, signage, cancellation, and privacy-safe public location wording are confirmed as applicable.',
    profile: 'universal_core',
    anchor: 'first_study_session_date',
    offsetDays: -7,
    owner: 'Jonathan',
  },
  {
    id: 'focus_group_companion_confirmed',
    title: 'Focus Group companion requirements confirmed',
    description: 'Program-specific training, care, confidentiality, licensing, safety, communication, and follow-up requirements are covered by an approved companion profile or SOP.',
    profile: 'focus_group_companion',
    anchor: 'first_study_session_date',
    offsetDays: -28,
    owner: 'Jonathan',
  },
  {
    id: 'leaders_notified_launch_ready',
    title: 'Leaders notified that launch is ready',
    description: 'Leaders have received the live page, confirmed dates and location, applicable physical/digital resource status, participant-contact responsibility, and support route. A reply is required only when readiness depends on it.',
    profile: 'universal_core',
    anchor: 'first_study_session_date',
    offsetDays: -2,
    owner: 'Jonathan',
  },
  {
    id: 'early_operational_check',
    title: 'Early operational check complete',
    description: 'Within two business days, participation, resource gaps, public-information confusion, room/AV issues, and urgent leader needs are recorded.',
    profile: 'universal_core',
    anchor: 'first_study_session_date',
    offsetDays: 2,
    owner: 'Jonathan',
    phase: 'follow_up',
    affectsReadiness: false,
  },
  {
    id: 'week_one_check_in',
    title: 'Seven-to-14-day leader health check complete',
    description: 'Group health, leader strain, participant fit, late arrivals, resources, technology, and follow-up are reviewed.',
    profile: 'universal_core',
    anchor: 'first_study_session_date',
    offsetDays: 10,
    owner: 'Jonathan',
    phase: 'follow_up',
    affectsReadiness: false,
  },
  {
    id: 'launch_lessons_captured',
    title: 'Launch lessons captured',
    description: 'Wins, friction, costs, inventory, communication results, and SOP or tracker changes are recorded.',
    profile: 'universal_core',
    anchor: 'study_end_date',
    offsetDays: 0,
    owner: 'Jonathan',
    phase: 'follow_up',
    affectsReadiness: false,
  },
];

const CHECKPOINT_TASK_RULES = {
  planning_center_copy_ready: { attentionLeadBusinessDays: 5, taskPolicy: 'create' },
  social_media_copy_ready: { attentionLeadBusinessDays: 5, taskPolicy: 'group', taskGroup: 'communication_outputs' },
  sunday_slide_brief_ready: { attentionLeadBusinessDays: 5, taskPolicy: 'group', taskGroup: 'communication_outputs' },
  planning_center_independent_proof: { attentionLeadBusinessDays: 2, taskPolicy: 'create' },
  planning_center_page_live: { attentionLeadBusinessDays: 5, taskPolicy: 'monitor' },
  planning_center_registration_settings_verified: { attentionLeadBusinessDays: 2, taskPolicy: 'create' },
  payment_flow_verified: { attentionLeadBusinessDays: 2, taskPolicy: 'create' },
  public_information_exception_confirmed: { attentionLeadBusinessDays: 5, taskPolicy: 'create' },
  physical_resource_ordered: { attentionLeadBusinessDays: 10, taskPolicy: 'create' },
  physical_resource_received: { attentionLeadBusinessDays: 2, taskPolicy: 'monitor' },
  digital_access_tested: { attentionLeadBusinessDays: 5, taskPolicy: 'create' },
  venue_host_av_ready: { attentionLeadBusinessDays: 7, taskPolicy: 'create' },
  focus_group_companion_confirmed: { attentionLeadBusinessDays: 7, taskPolicy: 'create' },
  leaders_notified_launch_ready: { attentionLeadBusinessDays: 2, taskPolicy: 'create' },
  early_operational_check: { attentionLeadBusinessDays: 1, taskPolicy: 'create' },
  week_one_check_in: { attentionLeadBusinessDays: 2, taskPolicy: 'create' },
  launch_lessons_captured: { attentionLeadBusinessDays: 5, taskPolicy: 'create' },
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const FOLLOW_UP_CHECKPOINT_IDS = new Set(['early_operational_check', 'week_one_check_in', 'launch_lessons_captured']);
const OBSOLETE_CHECKPOINT_IDS = new Set([
  'final_readiness_complete',
  'kickoff_ready',
  'offsite_privacy_ready',
  'sunday_services_verified',
  'facts_locked',
  'master_brief_ready',
  'compass_news_copy_ready',
  'leader_email_copy_ready',
  'targeted_invitation_plan_ready',
  'signup_flow_verified',
  'promotion_submitted',
  'promotion_outputs_verified',
  'leader_communication_confirmed',
]);

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

export function subtractBusinessDays(dateValue, days) {
  const date = parseDate(dateValue);
  if (!date) return '';
  let remaining = Math.max(0, Number(days) || 0);
  while (remaining > 0) {
    date.setUTCDate(date.getUTCDate() - 1);
    const day = date.getUTCDay();
    if (day !== 0 && day !== 6) remaining -= 1;
  }
  return formatDate(date);
}

export function inferLaunchProfiles(study) {
  const profiles = ['universal_core', 'planning_center_information_page'];
  if (study.physicalResources && study.physicalResources !== 'Not required') profiles.push('physical_resource');
  if (study.digitalResources && study.digitalResources !== 'Not required') profiles.push('digital_streaming');
  if (study.ministryId === 'focus_groups') profiles.push('focus_group_companion');
  return profiles;
}

function legacyCommunicationProfiles(existingPlan = {}) {
  if (!existingPlan.version || existingPlan.version >= 4) return [];
  const ids = new Set((existingPlan.checkpoints || []).map((checkpoint) => checkpoint.id));
  return [
    ids.has('social_media_copy_ready') ? 'social_media' : '',
    ids.has('sunday_slide_brief_ready') ? 'sunday_slide' : '',
  ].filter(Boolean);
}

export function getStudyEndDate(study, plan = study.launchPlan || {}) {
  if (DATE_PATTERN.test(plan.studyEndDate || '')) return plan.studyEndDate;
  const weeks = Number.isInteger(study.weeks) ? study.weeks : Number(study.weeks || 6);
  return addDays(study.startDate, Math.max(1, weeks) * 7);
}

function localDateValue(value) {
  if (typeof value === 'string') return value;
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return '';
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isStudyPast(study, today = new Date()) {
  const todayValue = localDateValue(today);
  const endDate = getStudyEndDate(study);
  return DATE_PATTERN.test(todayValue) && DATE_PATTERN.test(endDate) && endDate < todayValue;
}

export function getDefaultMinistryYearStart(studies, today = new Date()) {
  const todayValue = localDateValue(today);
  const remainingStudies = (studies || [])
    .filter((study) => !isStudyPast(study, todayValue))
    .filter((study) => DATE_PATTERN.test(study.startDate || ''))
    .sort((left, right) => left.startDate.localeCompare(right.startDate));
  const referenceDate = remainingStudies[0]?.startDate || todayValue;
  const year = Number(referenceDate.slice(0, 4));
  const month = Number(referenceDate.slice(5, 7));

  // Once summer begins, an empty tracker should open on the coming ministry year.
  return month >= 9 || (remainingStudies.length === 0 && month >= 7) ? year : year - 1;
}

export function getLaunchGridSections(studies, today = new Date()) {
  const todayValue = localDateValue(today);
  const ministryYearStart = getDefaultMinistryYearStart(studies, todayValue);
  const yearStart = `${ministryYearStart}-09-01`;
  const yearEnd = `${ministryYearStart + 1}-08-31`;
  const upcoming = (studies || [])
    .filter((study) => DATE_PATTERN.test(study.startDate || ''))
    .filter((study) => study.startDate >= todayValue && study.startDate >= yearStart && study.startDate <= yearEnd)
    .sort((left, right) => left.startDate.localeCompare(right.startDate) || String(left.title || '').localeCompare(String(right.title || '')));
  const nextStudies = [];
  const laterStudies = [];
  const seenStreams = new Set();

  upcoming.forEach((study) => {
    const streamKey = `${study.ministryId || 'unknown'}::${study.location || 'unknown'}`;
    if (seenStreams.has(streamKey)) laterStudies.push(study);
    else {
      seenStreams.add(streamKey);
      nextStudies.push(study);
    }
  });

  return {
    ministryYearStart,
    ministryYearLabel: `${ministryYearStart}-${ministryYearStart + 1}`,
    nextStudies,
    laterStudies,
  };
}

function resolveAnchor(study, plan, anchor) {
  if (anchor === 'public_launch_date') return plan.publicLaunchDate || addDays(study.startDate, -42);
  if (anchor === 'resource_distribution_date') return plan.resourceDistributionDate || study.startDate;
  if (anchor === 'study_end_date') return getStudyEndDate(study, plan);
  return study.startDate;
}

function templateApplies(template, profiles, productionPath, pageMode) {
  if (!profiles.includes(template.profile)) return false;
  if (template.condition === 'jonathan_self_service') return productionPath === 'jonathan_self_service';
  if (template.condition === 'signup_enabled') return ['optional_signup', 'required_signup', 'paid_registration'].includes(pageMode);
  if (template.condition === 'paid_registration') return pageMode === 'paid_registration';
  if (template.condition === 'no_public_page') return pageMode === 'not_required';
  return true;
}

function templateDependencies(template, applicableIds, productionPath) {
  const dependencies = [...(template.dependsOn || [])];
  if (template.id === 'planning_center_page_live' && productionPath === 'jonathan_self_service') {
    dependencies.push('planning_center_independent_proof');
  }
  if (template.id === 'leaders_notified_launch_ready') {
    dependencies.push(
      'planning_center_page_live',
      'public_information_exception_confirmed',
      'planning_center_registration_settings_verified',
      'payment_flow_verified',
      'physical_resource_received',
      'digital_access_tested',
      'social_media_copy_ready',
      'sunday_slide_brief_ready',
      'venue_host_av_ready',
      'focus_group_companion_confirmed',
    );
  }
  return unique(dependencies).filter((id) => applicableIds.has(id));
}

export function isCheckpointComplete(checkpoint) {
  if (checkpoint?.status === 'done') return true;
  if (checkpoint?.status === 'not_required') return Boolean(checkpoint.notRequiredReason?.trim());
  if (checkpoint?.status === 'accepted_risk') {
    return Boolean(
      checkpoint.acceptedRiskOwner?.trim()
      && checkpoint.acceptedRiskMitigation?.trim()
      && DATE_PATTERN.test(checkpoint.acceptedRiskReviewDate || ''),
    );
  }
  return false;
}

function checkpointDefaultOwner(template, productionPath) {
  if (template.id !== 'planning_center_page_live') return template.owner;
  if (productionPath === 'jonathan_self_service') return 'Jonathan';
  if (productionPath === 'other_owner') return '';
  return 'Director of Admin';
}

function checkpointOwner(template, previous, productionPath) {
  const defaultOwner = checkpointDefaultOwner(template, productionPath);
  if (template.id !== 'planning_center_page_live') return previous.owner || defaultOwner;

  const previousWasAutomatic = !previous.owner || ['Director of Admin', 'Jonathan'].includes(previous.owner);
  return previousWasAutomatic ? defaultOwner : previous.owner;
}

function mergeLegacyRegistrationCheckpoint(existingById) {
  const configuration = existingById.get('planning_center_registration_settings_verified');
  const signupTest = existingById.get('signup_flow_verified');
  if (!configuration) return signupTest || {};
  if (!signupTest) return configuration;

  const bothComplete = isCheckpointComplete(configuration) && isCheckpointComplete(signupTest);
  const incompletePriority = ['blocked', 'waiting_on_owner', 'in_progress', 'not_started'];
  const incomplete = [configuration, signupTest]
    .filter((checkpoint) => !isCheckpointComplete(checkpoint))
    .sort((left, right) => incompletePriority.indexOf(left.status) - incompletePriority.indexOf(right.status))[0];
  const primary = bothComplete ? configuration : (incomplete || configuration);
  const joinDistinct = (field) => unique([configuration[field], signupTest[field]].filter(Boolean)).join('\n');

  return {
    ...primary,
    status: bothComplete ? 'done' : primary.status,
    notes: joinDistinct('notes'),
    evidence: joinDistinct('evidence'),
    nextAction: joinDistinct('nextAction'),
    blocker: joinDistinct('blocker'),
    completedAt: bothComplete ? (signupTest.completedAt || configuration.completedAt || '') : '',
  };
}

function previousCheckpointForTemplate(template, existingPlan, existingById) {
  const current = existingById.get(template.id);
  const isLegacyPlan = Number(existingPlan.version || 0) < LAUNCH_PLAN_VERSION;
  if (template.id === 'planning_center_registration_settings_verified' && isLegacyPlan) {
    return mergeLegacyRegistrationCheckpoint(existingById);
  }
  if (current) return current;
  if (template.id === 'planning_center_copy_ready') return existingById.get('master_brief_ready') || {};
  if (template.id === 'leaders_notified_launch_ready' && isLegacyPlan) {
    const legacy = existingById.get('leader_communication_confirmed');
    return legacy ? { ...legacy, status: 'not_started', completedAt: '' } : {};
  }
  return {};
}

export function createLaunchPlan(study, existingPlan = {}) {
  const productionPath = PLANNING_CENTER_PRODUCTION_PATHS.includes(existingPlan.productionPath)
    ? existingPlan.productionPath
    : 'admin_handoff';
  const pageMode = PLANNING_CENTER_PAGE_MODES.includes(existingPlan.pageMode)
    ? existingPlan.pageMode
    : 'information_only';
  const requestedProfiles = existingPlan.profiles?.length ? existingPlan.profiles : inferLaunchProfiles(study);
  const profiles = unique(['universal_core', ...requestedProfiles, ...legacyCommunicationProfiles(existingPlan)])
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
    resourceDistributionDate: existingPlan.resourceDistributionDate || study.startDate,
    studyEndDate: existingPlan.studyEndDate || getStudyEndDate(study, existingPlan),
    independentProofObtained: Boolean(existingPlan.independentProofObtained),
    checkpoints: [],
  };

  const existingById = new Map((existingPlan.checkpoints || []).map((checkpoint) => [checkpoint.id, checkpoint]));
  const applicableTemplates = LAUNCH_CHECKPOINT_TEMPLATES
    .filter((template) => templateApplies(template, profiles, productionPath, pageMode));
  const applicableIds = new Set(applicableTemplates.map((template) => template.id));
  plan.checkpoints = applicableTemplates.map((template) => {
      const previous = previousCheckpointForTemplate(template, existingPlan, existingById);
      const calculatedDueDate = addDays(resolveAnchor(study, plan, template.anchor), template.offsetDays);
      return {
        id: template.id,
        title: template.title,
        description: template.description,
        phase: template.phase || 'pre_launch',
        affectsReadiness: template.affectsReadiness !== false,
        dependsOn: templateDependencies(template, applicableIds, productionPath),
        owner: checkpointOwner(template, previous, productionPath),
        status: LAUNCH_STATUSES.includes(previous.status) ? previous.status : 'not_started',
        calculatedDueDate,
        dueDateOverride: previous.dueDateOverride || '',
        dueDateOverrideReason: previous.dueDateOverrideReason || '',
        nextAction: previous.nextAction || '',
        blocker: previous.blocker || '',
        notRequiredReason: previous.notRequiredReason || '',
        acceptedRiskOwner: previous.acceptedRiskOwner || '',
        acceptedRiskMitigation: previous.acceptedRiskMitigation || '',
        acceptedRiskReviewDate: previous.acceptedRiskReviewDate || '',
        notes: previous.notes || '',
        evidence: previous.evidence || '',
        completedAt: previous.completedAt || '',
        attentionLeadBusinessDays: CHECKPOINT_TASK_RULES[template.id]?.attentionLeadBusinessDays || 5,
        taskPolicy: template.id === 'planning_center_page_live' && productionPath === 'jonathan_self_service'
          ? 'create'
          : (CHECKPOINT_TASK_RULES[template.id]?.taskPolicy || 'create'),
        taskGroup: CHECKPOINT_TASK_RULES[template.id]?.taskGroup || '',
      };
    });

  return plan;
}

export function effectiveDueDate(checkpoint) {
  return checkpoint.dueDateOverride || checkpoint.calculatedDueDate || '';
}

export function getCheckpointAttentionDate(checkpoint) {
  const rule = CHECKPOINT_TASK_RULES[checkpoint?.id] || {};
  const lead = Number.isInteger(checkpoint?.attentionLeadBusinessDays)
    ? checkpoint.attentionLeadBusinessDays
    : (rule.attentionLeadBusinessDays || 5);
  return subtractBusinessDays(effectiveDueDate(checkpoint), lead);
}

export function getUnmetDependencies(plan, checkpoint) {
  if (!checkpoint?.dependsOn?.length) return [];
  const byId = new Map((plan?.checkpoints || []).map((item) => [item.id, item]));
  return checkpoint.dependsOn.filter((id) => !isCheckpointComplete(byId.get(id)));
}

export function getLaunchSummary(study, today = new Date().toISOString().slice(0, 10)) {
  if (!study.launchPlan?.enabled) {
    return {
      enabled: false,
      total: 0,
      complete: 0,
      readinessPercent: 0,
      ready: false,
      acceptedRisk: 0,
      blocked: 0,
      overdue: 0,
      dueSoon: 0,
      attentionNow: 0,
      missingOwner: 0,
      missingCompletionDetails: 0,
      nextCheckpoint: null,
    };
  }

  const checkpoints = (study.launchPlan.checkpoints || []).filter((checkpoint) => (
    checkpoint.affectsReadiness !== false
    && !FOLLOW_UP_CHECKPOINT_IDS.has(checkpoint.id)
    && !OBSOLETE_CHECKPOINT_IDS.has(checkpoint.id)
  ));
  const incomplete = checkpoints.filter((checkpoint) => !isCheckpointComplete(checkpoint));
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
  const attentionNow = incomplete.filter((checkpoint) => {
    const dueDate = effectiveDueDate(checkpoint);
    const attentionDate = getCheckpointAttentionDate(checkpoint);
    return attentionDate && attentionDate <= today && (!dueDate || dueDate >= today);
  });
  const ordered = [...incomplete].sort((left, right) => {
    const leftBlocked = left.status === 'blocked' ? 0 : 1;
    const rightBlocked = right.status === 'blocked' ? 0 : 1;
    if (leftBlocked !== rightBlocked) return leftBlocked - rightBlocked;
    const attentionOrder = getCheckpointAttentionDate(left).localeCompare(getCheckpointAttentionDate(right));
    return attentionOrder || effectiveDueDate(left).localeCompare(effectiveDueDate(right));
  });
  const complete = checkpoints.length - incomplete.length;
  const acceptedRisk = checkpoints.filter((checkpoint) => checkpoint.status === 'accepted_risk' && isCheckpointComplete(checkpoint)).length;
  const missingOwner = incomplete.filter((checkpoint) => !checkpoint.owner?.trim()).length;
  const missingCompletionDetails = checkpoints.filter((checkpoint) => (
    ['not_required', 'accepted_risk'].includes(checkpoint.status) && !isCheckpointComplete(checkpoint)
  ) || (checkpoint.dueDateOverride && !checkpoint.dueDateOverrideReason?.trim())).length;

  return {
    enabled: true,
    total: checkpoints.length,
    complete,
    readinessPercent: checkpoints.length ? Math.round((complete / checkpoints.length) * 100) : 0,
    ready: checkpoints.length > 0 && incomplete.length === 0,
    acceptedRisk,
    blocked: blocked.length,
    overdue: overdue.length,
    dueSoon: dueSoon.length,
    attentionNow: attentionNow.length,
    missingOwner,
    missingCompletionDetails,
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
  const inputCheckpointIds = new Set((Array.isArray(input.checkpoints) ? input.checkpoints : []).map((checkpoint) => checkpoint?.id));
  [
    ['social_media_copy_ready', 'social_media'],
    ['sunday_slide_brief_ready', 'sunday_slide'],
    ['focus_group_companion_confirmed', 'focus_group_companion'],
  ].forEach(([checkpointId, profile]) => {
    if (inputCheckpointIds.has(checkpointId) && !profiles.includes(profile)) profiles.push(profile);
  });

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
    const template = LAUNCH_CHECKPOINT_TEMPLATES.find((candidate) => candidate.id === id);
    const taskRule = CHECKPOINT_TASK_RULES[id] || {};
    return {
      id,
      title: cleanText(checkpoint.title || '', 160, `${prefix}.title`, errors),
      description: cleanText(checkpoint.description || '', 600, `${prefix}.description`, errors),
      phase: template?.phase || (checkpoint.phase === 'follow_up' ? 'follow_up' : 'pre_launch'),
      affectsReadiness: template ? template.affectsReadiness !== false : checkpoint.affectsReadiness !== false,
      dependsOn: template?.dependsOn ? [...template.dependsOn] : [],
      owner: cleanText(checkpoint.owner || '', 120, `${prefix}.owner`, errors),
      status: LAUNCH_STATUSES.includes(checkpoint.status) ? checkpoint.status : 'not_started',
      calculatedDueDate: cleanOptionalDate(checkpoint.calculatedDueDate, `${prefix}.calculatedDueDate`, errors),
      dueDateOverride: cleanOptionalDate(checkpoint.dueDateOverride, `${prefix}.dueDateOverride`, errors),
      dueDateOverrideReason: cleanText(checkpoint.dueDateOverrideReason || '', 500, `${prefix}.dueDateOverrideReason`, errors),
      nextAction: cleanText(checkpoint.nextAction || '', 500, `${prefix}.nextAction`, errors),
      blocker: cleanText(checkpoint.blocker || '', 500, `${prefix}.blocker`, errors),
      notRequiredReason: cleanText(checkpoint.notRequiredReason || '', 500, `${prefix}.notRequiredReason`, errors),
      acceptedRiskOwner: cleanText(checkpoint.acceptedRiskOwner || '', 120, `${prefix}.acceptedRiskOwner`, errors),
      acceptedRiskMitigation: cleanText(checkpoint.acceptedRiskMitigation || '', 1000, `${prefix}.acceptedRiskMitigation`, errors),
      acceptedRiskReviewDate: cleanOptionalDate(checkpoint.acceptedRiskReviewDate, `${prefix}.acceptedRiskReviewDate`, errors),
      notes: cleanText(checkpoint.notes || '', 12000, `${prefix}.notes`, errors),
      evidence: cleanText(checkpoint.evidence || '', 1000, `${prefix}.evidence`, errors),
      completedAt: cleanOptionalDate(checkpoint.completedAt, `${prefix}.completedAt`, errors),
      attentionLeadBusinessDays: taskRule.attentionLeadBusinessDays || 5,
      taskPolicy: id === 'planning_center_page_live' && productionPath === 'jonathan_self_service'
        ? 'create'
        : (taskRule.taskPolicy || 'create'),
      taskGroup: taskRule.taskGroup || '',
    };
  }).filter(Boolean);

  const launchPlan = {
    version: LAUNCH_PLAN_VERSION,
    enabled: input.enabled !== false,
    profiles,
    pageMode: pageMode || 'information_only',
    productionPath: productionPath || 'admin_handoff',
    publicLaunchDate: cleanOptionalDate(input.publicLaunchDate, 'launchPlan.publicLaunchDate', errors),
    resourceDistributionDate: cleanOptionalDate(input.resourceDistributionDate, 'launchPlan.resourceDistributionDate', errors),
    studyEndDate: cleanOptionalDate(input.studyEndDate, 'launchPlan.studyEndDate', errors),
    independentProofObtained: Boolean(input.independentProofObtained),
    checkpoints,
  };

  const checkpointIds = new Set(checkpoints.map((checkpoint) => checkpoint.id));
  checkpoints.forEach((checkpoint) => {
    const template = LAUNCH_CHECKPOINT_TEMPLATES.find((candidate) => candidate.id === checkpoint.id);
    checkpoint.dependsOn = template
      ? templateDependencies(template, checkpointIds, launchPlan.productionPath)
      : checkpoint.dependsOn.filter((id) => checkpointIds.has(id));
  });

  if (launchPlan.productionPath === 'jonathan_self_service' && !launchPlan.independentProofObtained) {
    const pageCheckpoint = checkpoints.find((checkpoint) => checkpoint.id === 'planning_center_page_live');
    if (pageCheckpoint && checkpointIds.has('planning_center_independent_proof')) {
      pageCheckpoint.dependsOn = unique([...pageCheckpoint.dependsOn, 'planning_center_independent_proof']);
    }
    const proofCheckpoint = checkpoints.find((checkpoint) => checkpoint.id === 'planning_center_independent_proof');
    if (proofCheckpoint?.status === 'done') launchPlan.independentProofObtained = true;
  }

  checkpoints.forEach((checkpoint) => {
    if (checkpoint.status !== 'done') return;
    const unmet = getUnmetDependencies(launchPlan, checkpoint);
    if (unmet.length > 0) {
      errors.push(`launchPlan checkpoint ${checkpoint.id} cannot be done before: ${unmet.join(', ')}.`);
    }
  });

  return { launchPlan, errors: [...new Set(errors)] };
}
