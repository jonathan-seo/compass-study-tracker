import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { 
  BookOpen, 
  Calendar, 
  Users, 
  Megaphone, 
  ClipboardCheck, 
  Package, 
  MoreVertical,
  Plus,
  Info,
  Clock,
  MapPin,
  X,
  Save,
  Loader2,
  Trash2,
  LayoutGrid,
  Columns,
  GripVertical,
  Globe,
  Hash,
  FileText,
  AlertTriangle,
  LogOut,
  Upload,
  Check,
  AlertCircle,
  ListChecks,
  RefreshCcw,
  History
} from 'lucide-react';

const getMinistryYearForDate = (startDate) => {
  if (!startDate || typeof startDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return '';
  const year = Number(startDate.slice(0, 4));
  const month = Number(startDate.slice(5, 7));
  return month >= 9 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
};

import {
  LAUNCH_STATUSES,
  PLANNING_CENTER_PAGE_MODES,
  PLANNING_CENTER_PRODUCTION_PATHS,
  createLaunchPlan,
  effectiveDueDate,
  getCheckpointAttentionDate,
  getDefaultMinistryYearStart,
  getLaunchSummary,
  getUnmetDependencies,
  isStudyPast,
} from '../api/_lib/launch-contract.js';

const STAGE_INDEXES = { planning: 0, approval: 1, sourcing: 2, promotion: 3, active: 4, review: 5 };
const getStudyWarnings = (study) => {
  if (study.launchPlan?.enabled) return { missingResources: false, missingPromotion: false };
  const isPastApproval = STAGE_INDEXES[study.stage] > 1;
  return {
    missingResources: isPastApproval && !study.resourcesObtained,
    missingPromotion: isPastApproval && !study.websiteUpdated
  };
};

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  addDoc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';

// --- COMPASS FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyBJm5JVgTwMCYhByStI7r3zJkHre0yxRjo",
  authDomain: "compass-study-tracker.firebaseapp.com",
  projectId: "compass-study-tracker",
  storageBucket: "compass-study-tracker.firebasestorage.app",
  messagingSenderId: "354022817100",
  appId: "1:354022817100:web:5c9cd1ac7a4605de9a23e9"
};

const MINISTRIES = {
  MENS: { id: 'mens', name: "Men's Ministry", color: 'bg-blue-100 text-blue-800 border-blue-200', dot: 'bg-blue-500' },
  WOMENS_MON: { id: 'womens_mon', name: "Women's (Mon Eve)", color: 'bg-purple-100 text-purple-800 border-purple-200', dot: 'bg-purple-500' },
  WOMENS_THU: { id: 'womens_thu', name: "Women's (Thu AM)", color: 'bg-pink-100 text-pink-800 border-pink-200', dot: 'bg-pink-500' },
  WOMENS_SHEL: { id: 'womens_shel', name: "Women's (Shelburne)", color: 'bg-rose-100 text-rose-800 border-rose-200', dot: 'bg-rose-500' },
  WOMENS_GV: { id: 'womens_gv', name: "Women's (Grand Valley)", color: 'bg-orange-100 text-orange-800 border-orange-200', dot: 'bg-orange-500' },
  SENIORS: { id: 'seniors', name: "Compass Seniors (Wed AM)", color: 'bg-emerald-100 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' },
  FOCUS_GROUPS: { id: 'focus_groups', name: "Focus Groups", color: 'bg-indigo-100 text-indigo-800 border-indigo-200', dot: 'bg-indigo-500' },
};

const STAGES = [
  { id: 'planning', name: '1. Team Planning', icon: Calendar },
  { id: 'approval', name: '2. Review & Approval', icon: ClipboardCheck },
  { id: 'sourcing', name: '3. Sourcing & Creation', icon: Package },
  { id: 'promotion', name: '4. Promotion', icon: Megaphone },
  { id: 'active', name: '5. Active Study', icon: BookOpen },
  { id: 'review', name: '6. Post-Study Review', icon: Users },
];

const OPTIONS = {
  STUDY_MATERIAL: ['Not Started', 'Requested from Team', 'Received from Team', 'Reviewed by Director', 'Approved / Team Notified'],
  LIVE_TRACKING: ['Not started', 'In Progress', 'Completed'],
  POST_REVIEW: ['Not Started', 'In Progress', 'Completed']
};

const LOCATIONS = ["Orangeville", "Shelburne", "Grand Valley", "Other"];

const LAUNCH_STATUS_LABELS = {
  not_started: 'Not started',
  in_progress: 'In progress',
  waiting_on_owner: 'Waiting on owner',
  blocked: 'Blocked',
  done: 'Done',
  not_required: 'Not required',
  accepted_risk: 'Accepted risk',
};

const PAGE_MODE_LABELS = {
  information_only: 'Information only (current default)',
  optional_signup: 'Optional signup',
  required_signup: 'Required signup',
  paid_registration: 'Paid registration',
  not_required: 'No public Planning Center page',
};

const PRODUCTION_PATH_LABELS = {
  admin_handoff: 'Hand off to Director of Admin',
  jonathan_self_service: 'Jonathan builds or corrects',
  other_owner: 'Another owner',
};

const emptyStudyForm = (stage = 'planning') => ({
  title: '',
  ministryId: 'mens',
  stage,
  location: 'Orangeville',
  startDate: new Date().toISOString().split('T')[0],
  weeks: 6,
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
  launchPlan: null,
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const App = () => {
  const [user, setUser] = useState(null);
  const [studies, setStudies] = useState([]);
  const [blackouts, setBlackouts] = useState([]);
  const [isBlackoutModalOpen, setIsBlackoutModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [activeStage, setActiveStage] = useState('active');
  const [viewMode, setViewMode] = useState('pipeline'); 
  const [trimEmptyMonths, setTrimEmptyMonths] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudy, setEditingStudy] = useState(null);
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);

  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [formData, setFormData] = useState(() => emptyStudyForm());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const studiesRef = collection(db, 'ministry_studies');
    const q = query(studiesRef);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStudies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => {
      console.error("Firestore error:", err);
      setLoading(false);
    });

    const bQuery = query(collection(db, 'global_blackouts'));
    const unSubB = onSnapshot(bQuery, (snap) => {
      setBlackouts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubscribe();
      unSubB();
    };
  }, [user]);

  const studiesByStage = useMemo(() => {
    return STAGES.reduce((acc, stage) => {
      acc[stage.id] = studies.filter(s => s.stage === stage.id);
      return acc;
    }, {});
  }, [studies]);

  const onDragStart = (e, id) => {
    e.dataTransfer.setData("studyId", id);
    e.dataTransfer.effectAllowed = "move";
    // Defer state update so it doesn't cancel the native drag event
    setTimeout(() => setDraggedId(id), 0);
  };

  const onDragOver = (e, stageId) => {
    e.preventDefault();
    if (dragOverStage !== stageId) setDragOverStage(stageId);
  };

  const onDrop = async (e, targetStageId) => {
    e.preventDefault();
    const studyId = e.dataTransfer.getData("studyId") || draggedId;
    setDragOverStage(null);
    setDraggedId(null);
    if (!studyId) return;
    try {
      await updateDoc(doc(db, 'ministry_studies', studyId), {
        stage: targetStageId,
        updatedAt: new Date().toISOString(),
        updatedBy: 'tracker-app'
      });
    } catch (err) { console.error("Drop failed:", err); }
  };

  const handleOpenModal = (study = null, targetStage = null) => {
    if (study) {
      setEditingStudy(study);
      setFormData({
        ...emptyStudyForm(study.stage),
        ...study,
        launchPlan: study.launchPlan ? createLaunchPlan(study, study.launchPlan) : null,
      });
    } else {
      setEditingStudy(null);
      setFormData(emptyStudyForm(targetStage || activeStage));
    }
    setIsModalOpen(true);
  };

  const updateStudyField = (field, value) => {
    setFormData((current) => {
      const next = { ...current, [field]: value };
      if (current.launchPlan && ['startDate', 'weeks'].includes(field)) {
        next.launchPlan = createLaunchPlan(next, current.launchPlan);
      }
      return next;
    });
  };

  const enableLaunchPlan = () => {
    setFormData((current) => ({ ...current, launchPlan: createLaunchPlan(current) }));
  };

  const updateLaunchPlan = (changes, recalculate = true) => {
    setFormData((current) => {
      const draft = { ...current.launchPlan, ...changes };
      return {
        ...current,
        launchPlan: recalculate ? createLaunchPlan(current, draft) : draft,
      };
    });
  };

  const updateResourceRequirement = (field, profile, required) => {
    setFormData((current) => {
      const next = {
        ...current,
        [field]: required
          ? (current[field] === 'Not required' ? 'Required' : current[field])
          : 'Not required',
      };
      if (!current.launchPlan) return next;
      const profiles = required
        ? [...new Set([...current.launchPlan.profiles, profile])]
        : current.launchPlan.profiles.filter((item) => item !== profile);
      next.launchPlan = createLaunchPlan(next, { ...current.launchPlan, profiles });
      return next;
    });
  };

  const updateCheckpoint = (checkpointId, changes) => {
    setFormData((current) => {
      const today = new Date().toISOString().slice(0, 10);
      const checkpoints = current.launchPlan.checkpoints.map((checkpoint) => {
        if (checkpoint.id !== checkpointId) return checkpoint;
        const updated = { ...checkpoint, ...changes };
        if (changes.status) {
          updated.completedAt = ['done', 'not_required', 'accepted_risk'].includes(changes.status)
            ? (checkpoint.completedAt || today)
            : '';
        }
        return updated;
      });
      const proof = checkpoints.find((checkpoint) => checkpoint.id === 'planning_center_independent_proof');
      return {
        ...current,
        launchPlan: {
          ...current.launchPlan,
          checkpoints,
          independentProofObtained: proof ? proof.status === 'done' : current.launchPlan.independentProofObtained,
        },
      };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      if (editingStudy) {
        await updateDoc(doc(db, 'ministry_studies', editingStudy.id), {
          ...formData,
          updatedAt: new Date().toISOString(),
          updatedBy: 'tracker-app'
        });
      } else {
        const now = new Date().toISOString();
        await addDoc(collection(db, 'ministry_studies'), {
          ...formData,
          createdAt: now,
          updatedAt: now,
          updatedBy: 'tracker-app'
        });
      }
      setIsModalOpen(false);
    } catch (err) { console.error("Save error:", err); }
  };

  const handleDelete = async (id) => {
    if (!user || !window.confirm("Delete this record permanently?")) return;
    try {
      await deleteDoc(doc(db, 'ministry_studies', id));
      setIsModalOpen(false);
    } catch (err) { console.error("Delete error:", err); }
  };

  const StudyCard = ({ study, compact = false }) => {
    const ministry = MINISTRIES[study.ministryId.toUpperCase()] || MINISTRIES.MENS;
    const isDragging = draggedId === study.id;
    const launchSummary = getLaunchSummary(study);
    
    const getStatusColor = (val) => {
      if (val?.includes('Approved') || val?.includes('available') || val?.includes('distributed')) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      if (val?.includes('Required') || val?.includes('Not Started') || val?.includes('Request')) return 'text-rose-700 bg-rose-50 border-rose-200';
      return 'text-amber-700 bg-amber-50 border-amber-200';
    };

    return (
      <div 
        draggable
        onDragStart={(e) => onDragStart(e, study.id)}
        onDragEnd={() => setDraggedId(null)}
        className={`select-none group bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow transition-all overflow-hidden mb-2 cursor-grab active:cursor-grabbing flex gap-3 md:gap-4 ${compact ? 'p-4' : 'p-6 lg:p-8'} ${isDragging ? 'opacity-40 scale-95' : 'opacity-100'}`}
      >
        {study.imageUrl && (
          <img src={study.imageUrl} alt="Cover" className={`object-cover border border-slate-100 shadow-sm flex-shrink-0 rounded bg-slate-50 ${compact ? 'w-12 h-16' : 'w-24 h-36 md:w-32 md:h-48'}`} />
        )}
        <div className="flex-1 min-w-0 flex flex-col h-full">
          <div>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pointer-events-none">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {compact && <GripVertical size={14} className="text-slate-300" />}
                  <span className={`px-2 py-0.5 rounded font-semibold uppercase tracking-wide border ${ministry.color} ${compact ? 'text-[10px]' : 'text-xs'}`}>
                    {ministry.name}
                  </span>
                </div>
                <h3 className={`font-semibold text-slate-800 leading-tight ${compact ? 'truncate text-sm' : 'line-clamp-2 text-xl md:text-2xl mb-1'}`}>
                  {study.title}
                </h3>
                {(() => {
                  const warnings = getStudyWarnings(study);
                  return (warnings.missingResources || warnings.missingPromotion) && (
                    <div className={`flex flex-col gap-1.5 mt-2 ${!compact ? 'md:flex-row' : ''}`}>
                      {warnings.missingResources && (
                        <span className={`flex items-center gap-1 font-semibold text-red-700 bg-red-50 border border-red-200 rounded-md w-fit shadow-sm ${compact ? 'text-[10px] px-2 py-0.5' : 'text-xs px-3 py-1'}`}><AlertTriangle size={compact ? 12 : 14} /> Needs Resources</span>
                      )}
                      {warnings.missingPromotion && (
                        <span className={`flex items-center gap-1 font-semibold text-red-700 bg-red-50 border border-red-200 rounded-md w-fit shadow-sm ${compact ? 'text-[10px] px-2 py-0.5' : 'text-xs px-3 py-1'}`}><AlertTriangle size={compact ? 12 : 14} /> Needs Promo/Web</span>
                      )}
                    </div>
                  );
                })()}
                {launchSummary.enabled && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 pointer-events-none">
                    <span className={`flex items-center gap-1 rounded border font-semibold ${compact ? 'text-[9px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1'} ${launchSummary.blocked ? 'border-red-200 bg-red-50 text-red-700' : (launchSummary.overdue || launchSummary.acceptedRisk) ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-teal-200 bg-teal-50 text-teal-800'}`}>
                      <ListChecks size={compact ? 11 : 14} /> Launch {launchSummary.readinessPercent}%
                    </span>
                    {launchSummary.blocked > 0 && <span className="text-[10px] font-semibold text-red-700">{launchSummary.blocked} blocked</span>}
                    {launchSummary.overdue > 0 && <span className="text-[10px] font-semibold text-amber-800">{launchSummary.overdue} overdue</span>}
                    {launchSummary.acceptedRisk > 0 && <span className="text-[10px] font-semibold text-amber-800">{launchSummary.acceptedRisk} accepted risk</span>}
                  </div>
                )}
              </div>
              <button aria-label={`Edit ${study.title}`} title="Edit study" onClick={() => handleOpenModal(study)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all">
                <MoreVertical size={compact ? 16 : 20} />
              </button>
            </div>

            <div className={`mt-3 flex flex-wrap pointer-events-none ${compact ? 'gap-1' : 'gap-2'}`}>
              {study.studyMaterial !== 'Not Started' && (
                <span className={`font-bold rounded border ${getStatusColor(study.studyMaterial)} ${compact ? 'text-[8px] px-1.5 py-0.5 mt-1' : 'text-[10px] lg:text-xs px-2.5 py-1'}`}>
                  Material: {study.studyMaterial}
                </span>
              )}
              {!launchSummary.enabled && study.physicalResources !== 'Not required' && (
                <span className={`font-bold rounded border ${getStatusColor(study.physicalResources)} ${compact ? 'text-[8px] px-1.5 py-0.5 mt-1' : 'text-[10px] lg:text-xs px-2.5 py-1'}`}>
                  Resources: {study.physicalResources}
                </span>
              )}
              {launchSummary.enabled && study.launchPlan.profiles.includes('physical_resource') && (
                <span className={`font-bold rounded border text-emerald-700 bg-emerald-50 border-emerald-200 ${compact ? 'text-[8px] px-1.5 py-0.5 mt-1' : 'text-[10px] lg:text-xs px-2.5 py-1'}`}>Physical resources</span>
              )}
              {launchSummary.enabled && study.launchPlan.profiles.includes('digital_streaming') && (
                <span className={`font-bold rounded border text-blue-700 bg-blue-50 border-blue-200 ${compact ? 'text-[8px] px-1.5 py-0.5 mt-1' : 'text-[10px] lg:text-xs px-2.5 py-1'}`}>Digital material</span>
              )}
            </div>

            {!compact && study.notes && (
              <p className="mt-4 text-sm text-slate-500 line-clamp-4 italic whitespace-pre-wrap leading-relaxed pointer-events-none block">{study.notes}</p>
            )}
          </div>
          
          <div className="mt-auto pt-4">
            <div className={`flex items-center justify-between font-bold uppercase tracking-wider pointer-events-none text-slate-400 ${compact ? 'text-[10px]' : 'text-xs pt-4 border-t border-slate-100'}`}>
              <span className="flex items-center gap-1.5"><MapPin size={compact ? 10 : 14} /> {study.location}</span>
              {!compact && <span className="flex items-center gap-1.5"><Calendar size={14}/> {study.startDate}</span>}
              {compact && study.weeks && <span className="flex items-center gap-1.5"><Clock size={10}/> {study.weeks}w</span>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const LaunchAttentionView = () => {
    const rows = studies
      .filter((study) => !isStudyPast(study))
      .map((study) => ({ study, summary: getLaunchSummary(study) }))
      .sort((left, right) => {
        if (left.summary.enabled !== right.summary.enabled) return left.summary.enabled ? -1 : 1;
        if (left.summary.blocked !== right.summary.blocked) return right.summary.blocked - left.summary.blocked;
        if (left.summary.overdue !== right.summary.overdue) return right.summary.overdue - left.summary.overdue;
        const leftDue = effectiveDueDate(left.summary.nextCheckpoint || {}) || '9999-12-31';
        const rightDue = effectiveDueDate(right.summary.nextCheckpoint || {}) || '9999-12-31';
        return leftDue.localeCompare(rightDue);
      });
    const activeRows = rows.filter(({ summary }) => summary.enabled);
    const blocked = activeRows.reduce((total, { summary }) => total + summary.blocked, 0);
    const overdue = activeRows.reduce((total, { summary }) => total + summary.overdue, 0);
    const dueSoon = activeRows.reduce((total, { summary }) => total + summary.dueSoon, 0);
    const attentionNow = activeRows.reduce((total, { summary }) => total + summary.attentionNow, 0);

    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Launch attention</h2>
            <p className="text-sm text-slate-500 mt-1">The next work needed to get every study ready on time.</p>
          </div>
          <div className="grid grid-cols-4 border border-slate-200 rounded-lg bg-white overflow-hidden min-w-[360px]">
            <div className="px-4 py-3 border-r border-slate-200"><div className="text-xl font-semibold text-red-700">{blocked}</div><div className="text-[10px] uppercase font-semibold text-slate-500">Blocked</div></div>
            <div className="px-4 py-3 border-r border-slate-200"><div className="text-xl font-semibold text-amber-700">{overdue}</div><div className="text-[10px] uppercase font-semibold text-slate-500">Overdue</div></div>
            <div className="px-4 py-3 border-r border-slate-200"><div className="text-xl font-semibold text-blue-700">{attentionNow}</div><div className="text-[10px] uppercase font-semibold text-slate-500">Start now</div></div>
            <div className="px-4 py-3"><div className="text-xl font-semibold text-teal-700">{dueSoon}</div><div className="text-[10px] uppercase font-semibold text-slate-500">Due soon</div></div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="hidden lg:grid grid-cols-[minmax(220px,1.4fr)_110px_110px_minmax(260px,1.6fr)_90px] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-semibold text-slate-500">
            <span>Study</span><span>Readiness</span><span>Attention</span><span>Next checkpoint</span><span></span>
          </div>
          {rows.length === 0 ? (
            <div className="px-6 py-16 text-center text-slate-500">No current or upcoming studies need a launch checklist.</div>
          ) : rows.map(({ study, summary }) => {
            const ministry = MINISTRIES[study.ministryId.toUpperCase()] || MINISTRIES.MENS;
            const nextDue = effectiveDueDate(summary.nextCheckpoint || {});
            const nextAttention = getCheckpointAttentionDate(summary.nextCheckpoint || {});
            return (
              <div key={study.id} className="grid lg:grid-cols-[minmax(220px,1.4fr)_110px_110px_minmax(260px,1.6fr)_90px] gap-3 lg:gap-4 items-center px-5 py-4 border-b border-slate-100 last:border-b-0">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 truncate">{study.title}</div>
                  <div className="text-xs text-slate-500 mt-1">{ministry.name} · {study.startDate}</div>
                </div>
                {summary.enabled ? (
                  <>
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1"><span>{summary.readinessPercent}%</span><span>{summary.complete}/{summary.total}</span></div>
                      <div className="h-1.5 bg-slate-100 rounded overflow-hidden"><div className="h-full bg-teal-600" style={{ width: `${summary.readinessPercent}%` }} /></div>
                    </div>
                    <div className="text-xs font-semibold">
                      {summary.blocked > 0 ? <span className="text-red-700">{summary.blocked} blocked</span> : summary.overdue > 0 ? <span className="text-amber-800">{summary.overdue} overdue</span> : summary.attentionNow > 0 ? <span className="text-blue-700">Start now</span> : summary.acceptedRisk > 0 ? <span className="text-amber-800">Accepted risk</span> : summary.ready ? <span className="text-teal-700">Ready</span> : <span className="text-teal-700">On track</span>}
                    </div>
                    <div className="min-w-0">
                      {summary.nextCheckpoint ? <><div className="text-sm font-medium text-slate-800 truncate">{summary.nextCheckpoint.title}</div><div className="text-xs text-slate-500 mt-1">Start {nextAttention || 'date not set'} · Target {nextDue || 'date not set'} · {LAUNCH_STATUS_LABELS[summary.nextCheckpoint.status]}</div></> : <span className={`text-sm font-medium ${summary.acceptedRisk ? 'text-amber-800' : 'text-teal-700'}`}>{summary.acceptedRisk ? 'Ready with accepted risk' : 'Ready'}</span>}
                    </div>
                  </>
                ) : (
                  <div className="lg:col-span-3 text-sm text-slate-500">Launch checklist not set up.</div>
                )}
                <button type="button" onClick={() => handleOpenModal(study)} className="justify-self-start lg:justify-self-end px-3 py-2 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50">{summary.enabled ? 'Open' : 'Set up'}</button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const BlackoutModal = () => {
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [targetMinistries, setTargetMinistries] = useState(['all']);
    const [editingId, setEditingId] = useState(null);
    const [showHistory, setShowHistory] = useState(false);

    const targetCutoffDateStr = useMemo(() => {
      const today = new Date();
      const formatYMD = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };
      const todayStr = formatYMD(today);
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth(); // 0-11
      const defaultStartYear = currentMonth >= 8 ? currentYear : currentYear - 1;
      const currentMinYearLabel = `${defaultStartYear}-${defaultStartYear + 1}`;

      // Check if all studies in current calendar ministry year are complete
      const yearStudies = studies.filter(s => getMinistryYearForDate(s.startDate) === currentMinYearLabel);
      
      let maxStudyEndStr = null;
      if (yearStudies.length > 0) {
        yearStudies.forEach(s => {
          if (!s.startDate || !s.weeks) return;
          const [y, m, d] = s.startDate.split('-');
          const sStart = new Date(Number(y), Number(m) - 1, Number(d));
          let currentIterDate = new Date(sStart);
          let weeksToComplete = s.weeks;
          let totalDurationDays = 0;
          
          while (weeksToComplete > 0 && totalDurationDays < 365 * 5) {
            const sundayOfWeek = new Date(currentIterDate);
            sundayOfWeek.setDate(sundayOfWeek.getDate() - sundayOfWeek.getDay());
            const dateStr = formatYMD(sundayOfWeek);
            const isBlackout = blackouts.some(b => {
              const bdStart = b.startDate || b.date;
              const bdEnd = b.endDate || b.date;
              const applies = (b.ministries || ['all']).includes('all') || (b.ministries || []).includes(s.ministryId);
              return applies && dateStr >= bdStart && dateStr <= bdEnd;
            });
            if (!isBlackout) weeksToComplete--;
            currentIterDate.setDate(currentIterDate.getDate() + 7);
            totalDurationDays += 7;
          }
          const sEnd = new Date(sStart.getTime() + totalDurationDays * (1000 * 60 * 60 * 24));
          const endStr = formatYMD(sEnd);
          if (!maxStudyEndStr || endStr > maxStudyEndStr) {
            maxStudyEndStr = endStr;
          }
        });
      }

      let effectiveStartYear = defaultStartYear;
      if (yearStudies.length === 0 || (maxStudyEndStr && todayStr > maxStudyEndStr)) {
        effectiveStartYear = defaultStartYear + 1;
      }

      return `${effectiveStartYear}-09-01`;
    }, [studies, blackouts]);

    const { filteredBlackouts, historicalCount } = useMemo(() => {
      let historical = 0;
      const sorted = [...blackouts].sort((a,b) => (a.startDate || a.date).localeCompare(b.startDate || b.date));
      
      const filtered = sorted.filter(b => {
        const bEnd = b.endDate || b.startDate || b.date;
        const isPast = bEnd && bEnd < targetCutoffDateStr;
        if (isPast) historical++;
        if (showHistory) return true;
        return !isPast;
      });

      return { filteredBlackouts: filtered, historicalCount: historical };
    }, [blackouts, targetCutoffDateStr, showHistory]);

    const isAll = targetMinistries.includes('all');

    const handleToggleMinistry = (minId) => {
      if (minId === 'all') {
        setTargetMinistries(isAll ? [] : ['all']);
        return;
      }
      let newT = targetMinistries.filter(m => m !== 'all');
      if (newT.includes(minId)) {
        newT = newT.filter(m => m !== minId);
      } else {
        newT.push(minId);
      }
      setTargetMinistries(newT);
    };

    const handleSave = async (e) => {
      e.preventDefault();
      if (!startDate || !endDate || !name) return;
      
      const alignToSunday = (dateStr) => {
        let d = new Date(dateStr + 'T00:00:00');
        if (d.getDay() !== 0) d.setDate(d.getDate() - d.getDay()); 
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };

      const sDate = alignToSunday(startDate);
      const eDate = alignToSunday(endDate);
      const payload = {
        name, startDate: sDate, endDate: eDate,
        ministries: targetMinistries.length ? targetMinistries : ['all']
      };

      try {
        if (editingId) {
          await updateDoc(doc(db, 'global_blackouts', editingId), payload);
        } else {
          await addDoc(collection(db, 'global_blackouts'), payload);
        }
        resetForm();
      } catch (err) { console.error(err); }
    };
    
    const resetForm = () => {
      setName(''); setStartDate(''); setEndDate(''); setTargetMinistries(['all']); setEditingId(null);
    };

    const handleEdit = (b) => {
      setEditingId(b.id);
      setName(b.name || '');
      setStartDate(b.startDate || b.date); 
      setEndDate(b.endDate || b.date);
      setTargetMinistries(b.ministries || ['all']);
    };

    const handleDelete = async (id) => {
      try {
        await deleteDoc(doc(db, 'global_blackouts', id));
      } catch (err) { console.error(err); }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-900/40 backdrop-blur-sm">
        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl p-6 md:p-8 animate-in zoom-in-95 max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100 flex-shrink-0">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Blackouts & Cancellations</h2>
              <p className="text-sm text-slate-500 mt-1 font-medium">Suspend tracking logic globally or for specific ministries</p>
            </div>
            <button onClick={() => setIsBlackoutModalOpen(false)} className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"><X size={20}/></button>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar md:pr-4 flex flex-col md:flex-row gap-8">
            <div className="md:w-1/2 flex flex-col">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4 ml-1">{editingId ? 'Edit Cancellation' : 'New Cancellation'}</h3>
              <form onSubmit={handleSave} className="space-y-5 flex-1 p-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">Event / Reason</label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. March Break, Snow Day" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all shadow-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">Start Week</label>
                    <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">End Week</label>
                    <input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all shadow-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2 ml-1">Affects Ministries</label>
                  <div className="space-y-1.5 bg-slate-50 p-4 border border-slate-200 rounded-xl shadow-inner">
                    <label className="flex items-center gap-3 cursor-pointer group pb-3 border-b border-slate-200/60 mb-1.5">
                      <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${isAll ? 'bg-blue-600 border-blue-600 shadow-sm' : 'bg-white border-slate-300 group-hover:border-blue-400'}`} onClick={() => handleToggleMinistry('all')}>
                        {isAll && <div className="w-2.5 h-2.5 bg-white rounded-sm"></div>}
                      </div>
                      <span className="text-sm font-bold text-slate-800" onClick={() => handleToggleMinistry('all')}>All Ministries</span>
                    </label>
                    {Object.values(MINISTRIES).map(min => (
                      <label key={min.id} className={`flex items-center gap-3 cursor-pointer group transition-opacity py-1 ${isAll ? 'opacity-50' : 'opacity-100'}`}>
                        <div className={`w-4 h-4 rounded-sm flex items-center justify-center border transition-all ${targetMinistries.includes(min.id) || isAll ? 'bg-blue-500 border-blue-500' : 'bg-white border-slate-300 group-hover:border-blue-400'}`} onClick={(e) => { e.preventDefault(); handleToggleMinistry(min.id); }}>
                          {(targetMinistries.includes(min.id) || isAll) && <div className="w-2 h-2 bg-white rounded-[1px]"></div>}
                        </div>
                        <span className="text-xs font-bold text-slate-700" onClick={(e) => { e.preventDefault(); handleToggleMinistry(min.id); }}>{min.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="pt-2 flex gap-3">
                  {editingId && <button type="button" onClick={resetForm} className="flex-1 bg-white border border-slate-300 text-slate-600 py-3 rounded-lg font-semibold hover:bg-slate-50 transition-colors shadow-sm text-sm">Cancel</button>}
                  <button type="submit" className="flex-1 bg-[#2b5278] text-white py-3 rounded-lg font-semibold hover:bg-[#1f3f5e] transition-colors shadow-md text-sm">{editingId ? 'Update' : 'Add Cancellation'}</button>
                </div>
              </form>
            </div>
            
            <div className="md:w-1/2 flex flex-col border-t md:border-t-0 md:border-l border-slate-100 pt-8 md:pt-0 md:pl-8">
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Active Interruptions</h3>
                <button 
                  type="button" 
                  onClick={() => setShowHistory(!showHistory)} 
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all border shadow-sm active:scale-95 flex items-center gap-1.5 ${
                    showHistory 
                      ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <History size={13}/> 
                  {showHistory ? 'Showing All' : `Show History${historicalCount > 0 ? ` (${historicalCount})` : ''}`}
                </button>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar p-1">
                {filteredBlackouts.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <p className="text-sm text-slate-400 font-bold">
                      {historicalCount > 0 && !showHistory 
                        ? 'No active interruptions for upcoming ministry year' 
                        : 'No active interruptions'}
                    </p>
                    {historicalCount > 0 && !showHistory && (
                      <button 
                        type="button"
                        onClick={() => setShowHistory(true)}
                        className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        View {historicalCount} historical {historicalCount === 1 ? 'interruption' : 'interruptions'}
                      </button>
                    )}
                  </div>
                ) : filteredBlackouts.map(b => (
                  <div key={b.id} className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200 shadow-sm relative group hover:border-blue-300 hover:shadow-md transition-all">
                    <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white">
                      <button onClick={() => handleEdit(b)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all border border-transparent hover:border-blue-100"><FileText size={14}/></button>
                      <button onClick={() => handleDelete(b.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all border border-transparent hover:border-rose-100"><Trash2 size={14}/></button>
                    </div>
                    <h4 className="font-bold text-slate-800 text-base pr-16 leading-tight">{b.name || 'Global Blackout'}</h4>
                    <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-slate-500">
                      <Calendar size={12} className="text-slate-400"/> 
                      {b.startDate || b.date} {b.endDate && b.endDate !== b.startDate && b.endDate !== (b.startDate||b.date) ? `to ${b.endDate}` : ''}
                    </div>
                    <div className="mt-3.5 flex flex-wrap gap-1.5">
                      {(b.ministries || ['all']).includes('all') ? (
                         <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200">ALL MINISTRIES</span>
                      ) : (
                         (b.ministries || []).map(m => (
                           <span key={m} className={`text-[9px] font-bold px-2 py-1 rounded-md border ${MINISTRIES[m.toUpperCase()]?.color || 'bg-slate-100'}`}>{MINISTRIES[m.toUpperCase()]?.name || m}</span>
                         ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- IMPORT MODAL AND RESOLVER ---
  const ImportModal = () => {
    const [fileContent, setFileContent] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [previewData, setPreviewData] = useState(null); // { newStudies: [], conflicts: [], duplicates: [] }
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [activeTab, setActiveTab] = useState('new'); // 'new' | 'conflict' | 'duplicate'
    const [isImporting, setIsImporting] = useState(false);

    const getDifferences = (existing, imported) => {
      const diffs = {};
      const fieldsToCheck = [
        'weeks', 'location', 'stage', 'notes', 'studyMaterial', 
        'physicalResources', 'digitalResources', 'imageUrl', 
        'resourcesObtained', 'websiteUpdated', 'liveTracking', 
        'postReview', 'promoText', 'updates', 'launchPlan'
      ];
      
      fieldsToCheck.forEach(field => {
        if (!(field in imported)) return;
        
        let valExist = existing[field];
        let valImport = imported[field];
        
        if (typeof valExist === 'boolean' || typeof valImport === 'boolean') {
          if (!!valExist !== !!valImport) {
            diffs[field] = { existing: !!valExist, imported: !!valImport };
          }
          return;
        }
        
        if (field === 'weeks') {
          if (Number(valExist || 6) !== Number(valImport || 6)) {
            diffs[field] = { existing: Number(valExist || 6), imported: Number(valImport || 6) };
          }
          return;
        }

        if (field === 'launchPlan') {
          if (JSON.stringify(valExist || null) !== JSON.stringify(valImport || null)) {
            diffs[field] = { existing: valExist || null, imported: valImport || null };
          }
          return;
        }
        
        let strExist = String(valExist || '').trim();
        let strImport = String(valImport || '').trim();
        if (strExist !== strImport) {
          diffs[field] = { existing: strExist, imported: strImport };
        }
      });
      
      return diffs;
    };

    const handleTextSubmit = (e) => {
      e.preventDefault();
      handleParse(fileContent);
    };

    const handleFileUpload = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        setFileContent(text);
        handleParse(text);
      };
      reader.readAsText(file);
    };

    const handleParse = (text) => {
      try {
        const data = JSON.parse(text);
        if (!Array.isArray(data)) {
          throw new Error("Input must be a JSON array of studies.");
        }
        
        const newStudies = [];
        const conflicts = [];
        const duplicates = [];
        
        data.forEach((item, index) => {
          if (!item.title || typeof item.title !== 'string' || !item.title.trim()) {
            throw new Error(`Item at index ${index} is missing a valid 'title'.`);
          }
          if (!item.ministryId || typeof item.ministryId !== 'string' || !item.ministryId.trim()) {
            throw new Error(`Item at index ${index} ('${item.title}') is missing a valid 'ministryId'.`);
          }
          const validMinIds = Object.values(MINISTRIES).map(m => m.id);
          if (!validMinIds.includes(item.ministryId.trim().toLowerCase())) {
            throw new Error(`Item at index ${index} ('${item.title}') has an invalid 'ministryId' ('${item.ministryId}'). Valid choices: ${validMinIds.join(', ')}`);
          }
          if (!item.startDate || typeof item.startDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(item.startDate)) {
            throw new Error(`Item at index ${index} ('${item.title}') is missing or has an invalid 'startDate' (format must be YYYY-MM-DD).`);
          }
          
          const match = studies.find(s => 
            s.title.trim().toLowerCase() === item.title.trim().toLowerCase() && 
            s.ministryId.trim().toLowerCase() === item.ministryId.trim().toLowerCase() && 
            s.startDate.trim() === item.startDate.trim()
          );
          
          if (match) {
            const diffs = getDifferences(match, item);
            if (Object.keys(diffs).length > 0) {
              conflicts.push({
                tempId: `conflict-${index}`,
                imported: item,
                existing: match,
                differences: diffs
              });
            } else {
              duplicates.push({
                tempId: `duplicate-${index}`,
                imported: item,
                existing: match,
                differences: {}
              });
            }
          } else {
            newStudies.push({
              tempId: `new-${index}`,
              imported: item,
              existing: null,
              differences: {}
            });
          }
        });
        
        setPreviewData({ newStudies, conflicts, duplicates });
        setErrorMsg('');
        
        // Auto-select new and conflict items
        const initialSelected = new Set();
        newStudies.forEach(s => initialSelected.add(s.tempId));
        conflicts.forEach(s => initialSelected.add(s.tempId));
        setSelectedIds(initialSelected);
        
        // Auto-focus on active tab with items
        if (newStudies.length > 0) {
          setActiveTab('new');
        } else if (conflicts.length > 0) {
          setActiveTab('conflict');
        } else {
          setActiveTab('duplicate');
        }
        
      } catch (err) {
        setErrorMsg(err.message || "Failed to parse JSON. Please check syntax.");
        setPreviewData(null);
      }
    };

    const toggleSelectItem = (id) => {
      const next = new Set(selectedIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      setSelectedIds(next);
    };

    const getItemsByTab = () => {
      if (!previewData) return [];
      if (activeTab === 'new') return previewData.newStudies;
      if (activeTab === 'conflict') return previewData.conflicts;
      return previewData.duplicates;
    };

    const toggleSelectAllTabItems = () => {
      const items = getItemsByTab();
      const next = new Set(selectedIds);
      const allSelected = items.every(item => next.has(item.tempId));
      
      items.forEach(item => {
        if (allSelected) {
          next.delete(item.tempId);
        } else {
          next.add(item.tempId);
        }
      });
      setSelectedIds(next);
    };

    const handleImportSelected = async () => {
      if (!previewData || !user) return;
      setIsImporting(true);
      setErrorMsg('');
      try {
        const { newStudies, conflicts, duplicates } = previewData;
        const allItems = [...newStudies, ...conflicts, ...duplicates];
        
        for (const item of allItems) {
          if (!selectedIds.has(item.tempId)) continue;
          
          const studyData = {
            title: item.imported.title.trim(),
            ministryId: item.imported.ministryId.trim(),
            startDate: item.imported.startDate.trim(),
            weeks: Number(item.imported.weeks || 6),
            location: item.imported.location || 'Orangeville',
            stage: item.imported.stage || 'planning',
            studyMaterial: item.imported.studyMaterial || 'Not Started',
            physicalResources: item.imported.physicalResources || 'Not required',
            digitalResources: item.imported.digitalResources || 'Not required',
            imageUrl: item.imported.imageUrl || '',
            resourcesObtained: !!item.imported.resourcesObtained,
            websiteUpdated: !!item.imported.websiteUpdated,
            liveTracking: item.imported.liveTracking || 'Not started',
            postReview: item.imported.postReview || 'Not Started',
            notes: item.imported.notes || '',
            promoText: item.imported.promoText || '',
            updates: item.imported.updates || ''
          };
          if (item.imported.launchPlan) {
            studyData.launchPlan = createLaunchPlan(studyData, item.imported.launchPlan);
          }
          
          if (item.existing) {
            await updateDoc(doc(db, 'ministry_studies', item.existing.id), {
              ...studyData,
              updatedAt: new Date().toISOString(),
              updatedBy: 'tracker-import'
            });
          } else {
            const now = new Date().toISOString();
            await addDoc(collection(db, 'ministry_studies'), {
              ...studyData,
              createdAt: now,
              updatedAt: now,
              updatedBy: 'tracker-import'
            });
          }
        }
        
        setIsImportModalOpen(false);
        setPreviewData(null);
        setFileContent('');
      } catch (err) {
        console.error("Import error:", err);
        setErrorMsg("Failed to import database entries: " + err.message);
      } finally {
        setIsImporting(false);
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-md overflow-y-auto font-sans">
        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl my-auto overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
          <div className="p-8 border-b flex items-center justify-between bg-slate-50/50 flex-shrink-0">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Import Studies</h2>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-1">Review & Merge Discipleship Data</p>
            </div>
            <button onClick={() => setIsImportModalOpen(false)} className="p-3 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-3 shadow-sm">
                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {!previewData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-3">Upload File</h3>
                  <label className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30 transition-all rounded-[2rem] p-10 flex flex-col items-center justify-center cursor-pointer min-h-[250px] shadow-inner text-center">
                    <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                    <div className="p-4 bg-white rounded-2xl shadow-sm mb-4 border border-slate-100 text-blue-500">
                      <Upload size={32} />
                    </div>
                    <span className="font-bold text-slate-700 text-base">Select JSON study file</span>
                    <span className="text-xs text-slate-400 font-medium mt-1">or drag and drop it here</span>
                  </label>
                </div>

                <div className="flex flex-col">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-3">Or Paste JSON Data</h3>
                  <form onSubmit={handleTextSubmit} className="flex flex-col flex-1 gap-4">
                    <textarea 
                      placeholder="Paste JSON array here..." 
                      className="w-full flex-1 min-h-[200px] md:min-h-0 bg-slate-50 border border-slate-200 rounded-[1.5rem] p-4 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all shadow-inner custom-scrollbar"
                      value={fileContent}
                      onChange={e => setFileContent(e.target.value)}
                    />
                    <button 
                      type="submit" 
                      disabled={!fileContent.trim()} 
                      className="w-full bg-[#2b5278] hover:bg-[#1f3f5e] text-white py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 shadow-md active:scale-[0.98]"
                    >
                      Verify Data
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="lg:w-64 flex-shrink-0">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">Import Status</h3>
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => setActiveTab('new')} 
                      className={`flex items-center justify-between p-4 rounded-2xl text-left border font-semibold transition-all ${
                        activeTab === 'new' ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-sm">New Studies</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-lg font-bold ${activeTab === 'new' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        {previewData.newStudies.length}
                      </span>
                    </button>

                    <button 
                      onClick={() => setActiveTab('conflict')} 
                      className={`flex items-center justify-between p-4 rounded-2xl text-left border font-semibold transition-all ${
                        activeTab === 'conflict' ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-sm">Conflicts</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-lg font-bold ${activeTab === 'conflict' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        {previewData.conflicts.length}
                      </span>
                    </button>

                    <button 
                      onClick={() => setActiveTab('duplicate')} 
                      className={`flex items-center justify-between p-4 rounded-2xl text-left border font-semibold transition-all ${
                        activeTab === 'duplicate' ? 'bg-slate-50 border-slate-300 text-slate-800 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-sm">Unchanged</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-lg font-bold ${activeTab === 'duplicate' ? 'bg-slate-400 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        {previewData.duplicates.length}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-4 px-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Previewing: {activeTab === 'new' ? 'New studies to be inserted' : activeTab === 'conflict' ? 'Studies with differences' : 'Identical matches (already saved)'}
                    </span>
                    {getItemsByTab().length > 0 && (
                      <button 
                        onClick={toggleSelectAllTabItems} 
                        className="text-xs font-bold text-blue-600 hover:text-blue-800"
                      >
                        {getItemsByTab().every(item => selectedIds.has(item.tempId)) ? 'Deselect All' : 'Select All'}
                      </button>
                    )}
                  </div>

                  <div className="space-y-4 max-h-[45vh] overflow-y-auto custom-scrollbar pr-2 p-1">
                    {getItemsByTab().length === 0 ? (
                      <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/50">
                        <p className="text-sm text-slate-400 font-bold">No studies found in this category.</p>
                      </div>
                    ) : (
                      getItemsByTab().map(item => {
                        const isChecked = selectedIds.has(item.tempId);
                        const min = Object.values(MINISTRIES).find(m => m.id === item.imported.ministryId);
                        return (
                          <div 
                            key={item.tempId} 
                            onClick={() => toggleSelectItem(item.tempId)}
                            className={`p-5 bg-white border rounded-2xl shadow-sm hover:shadow transition-all cursor-pointer flex gap-4 items-start ${
                              isChecked ? 'border-blue-400 ring-2 ring-blue-50' : 'border-slate-200'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                              isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300'
                            }`}>
                              {isChecked && <Check size={14} strokeWidth={3} />}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${min?.color || 'bg-slate-100 border-slate-200'}`}>
                                  {min?.name || item.imported.ministryId}
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold">{item.imported.startDate}</span>
                              </div>
                              <h4 className="font-bold text-slate-800 text-base leading-snug">{item.imported.title}</h4>
                              
                              {item.differences && Object.keys(item.differences).length > 0 && (
                                <div className="mt-4 space-y-2 bg-slate-50/70 p-3.5 border border-slate-100 rounded-xl shadow-inner">
                                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Detailed Changes:</div>
                                  {Object.entries(item.differences).map(([field, diff]) => (
                                    <div key={field} className="grid grid-cols-3 gap-2 text-xs py-1 border-b border-slate-100 last:border-0 leading-normal">
                                      <div className="font-bold text-slate-500 capitalize">{field.replace(/([A-Z])/g, ' $1')}</div>
                                      <div className="text-red-600 font-medium line-through truncate" title={String(diff.existing)}>{String(diff.existing) || '(empty)'}</div>
                                      <div className="text-emerald-700 font-bold truncate" title={String(diff.imported)}>➡️ {String(diff.imported) || '(empty)'}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-8 border-t bg-slate-50/50 flex-shrink-0 flex justify-between items-center">
            {previewData ? (
              <>
                <button 
                  onClick={() => setPreviewData(null)} 
                  disabled={isImporting}
                  className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 px-6 py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 text-sm shadow-sm"
                >
                  Back to Upload
                </button>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsImportModalOpen(false)} 
                    disabled={isImporting}
                    className="bg-white hover:bg-slate-100 border border-transparent text-slate-500 px-6 py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleImportSelected} 
                    disabled={isImporting || selectedIds.size === 0}
                    className="bg-[#2b5278] hover:bg-[#1f3f5e] text-white px-6 py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2 text-sm shadow-md active:scale-[0.98]"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="animate-spin" size={16} /> Importing...
                      </>
                    ) : (
                      `Accept Import (${selectedIds.size})`
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="w-full flex justify-end">
                <button 
                  onClick={() => setIsImportModalOpen(false)} 
                  className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 px-6 py-3.5 rounded-xl font-bold transition-all text-sm shadow-sm"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const CalendarView = () => {
    const defaultStartYear = getDefaultMinistryYearStart(studies);
    
    const [startYear, setStartYear] = useState(defaultStartYear);
    const endYear = startYear + 1;
    const msPerDay = 1000 * 60 * 60 * 24;

    const yearStart = new Date(startYear, 8, 1);
    const yearEnd = new Date(endYear, 8, 1);

    const formatDateObj = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    // 1. Pre-calculate sStart and sEnd (including blackouts) for all valid studies
    const validStudies = studies.filter(s => s.startDate && s.weeks > 0);
    const analyzedStudies = validStudies.map(study => {
      const [y, m, d] = study.startDate.split('-');
      const sStart = new Date(y, m - 1, d);
      
      let currentIterDate = new Date(sStart);
      let weeksToComplete = study.weeks;
      let totalDurationDays = 0;
      
      while (weeksToComplete > 0 && totalDurationDays < 365 * 5) {
        const sundayOfWeek = new Date(currentIterDate);
        sundayOfWeek.setDate(sundayOfWeek.getDate() - sundayOfWeek.getDay());
        const dateStr = formatDateObj(sundayOfWeek);
        const isBlackout = blackouts.some(b => {
           const bdStart = b.startDate || b.date;
           const bdEnd = b.endDate || b.date;
           const applies = (b.ministries || ['all']).includes('all') || (b.ministries || []).includes(study.ministryId);
           return applies && dateStr >= bdStart && dateStr <= bdEnd;
        });
        
        if (!isBlackout) {
          weeksToComplete--;
        }
        currentIterDate.setDate(currentIterDate.getDate() + 7);
        totalDurationDays += 7;
      }
      
      const sEnd = new Date(sStart.getTime() + totalDurationDays * msPerDay);
      return { study, sStart, sEnd, totalDurationDays };
    });

    // 2. Filter studies that fall within the current ministry year
    const activeAnalyzed = analyzedStudies.filter(({ sStart, sEnd }) => {
      return sEnd > yearStart && sStart < yearEnd;
    });

    // 3. Determine dynamic ministry start/end bounds
    let ministryStart = yearStart;
    let ministryEnd = yearEnd;

    if (trimEmptyMonths && activeAnalyzed.length > 0) {
      const startDates = activeAnalyzed.map(a => a.sStart.getTime());
      const endDates = activeAnalyzed.map(a => a.sEnd.getTime());
      const earliestStart = new Date(Math.min(...startDates));
      const latestEnd = new Date(Math.max(...endDates));

      // Align to first day of earliest start month, and first day of month after latest end
      ministryStart = new Date(earliestStart.getFullYear(), earliestStart.getMonth(), 1);
      ministryEnd = new Date(latestEnd.getFullYear(), latestEnd.getMonth() + 1, 1);
    }

    const totalDays = Math.round((ministryEnd - ministryStart) / msPerDay);
    const totalMonths = (ministryEnd.getFullYear() - ministryStart.getFullYear()) * 12 + (ministryEnd.getMonth() - ministryStart.getMonth());

    // Calculate proportional months
    const timelineMonths = [];
    let lastYear = null;
    for (let i = 0; i < totalMonths; i++) {
      const mDate = new Date(ministryStart.getFullYear(), ministryStart.getMonth() + i, 1);
      const nextMonth = new Date(ministryStart.getFullYear(), ministryStart.getMonth() + i + 1, 1);
      const daysInMonth = Math.round((nextMonth - mDate) / msPerDay);
      const monthName = mDate.toLocaleString('default', { month: 'short' });
      const year = mDate.getFullYear();
      const showYear = i === 0 || year !== lastYear;
      lastYear = year;

      timelineMonths.push({ 
        name: monthName, 
        year,
        showYear,
        days: daysInMonth, 
        widthPct: (daysInMonth / totalDays) * 100 
      });
    }

    // Calculate all Sundays
    const sundays = [];
    let currDate = new Date(ministryStart);
    while (currDate.getDay() !== 0) {
      currDate.setDate(currDate.getDate() + 1);
    }
    while (currDate < ministryEnd) {
      const leftOffsetDays = (currDate - ministryStart) / msPerDay;
      const leftPct = (leftOffsetDays / totalDays) * 100;
      const dateStr = formatDateObj(currDate);
      const isBlackout = blackouts.some(b => {
        const bdStart = b.startDate || b.date;
        const bdEnd = b.endDate || b.date;
        const appliesAll = (b.ministries || ['all']).includes('all');
        return appliesAll && dateStr >= bdStart && dateStr <= bdEnd;
      });
      
      sundays.push({ 
        date: currDate.getDate(), 
        dateStr,
        leftPct, 
        isBlackout,
        widthPct: (7 / totalDays) * 100 
      });
      currDate.setDate(currDate.getDate() + 7);
    }
    
    // Map active studies into plotted coordinates based on dynamic bounds
    const plottedStudies = activeAnalyzed.map(({ study, sStart, sEnd, totalDurationDays }) => {
      if (sEnd <= ministryStart || sStart >= ministryEnd) return null;
      
      let leftOffsetDays = (sStart - ministryStart) / msPerDay;
      let durationDays = totalDurationDays;
      
      if (leftOffsetDays < 0) {
        durationDays += leftOffsetDays;
        leftOffsetDays = 0;
      }
      if (leftOffsetDays + durationDays > totalDays) {
        durationDays = totalDays - leftOffsetDays;
      }
      
      const leftPct = (leftOffsetDays / totalDays) * 100;
      const widthPct = (durationDays / totalDays) * 100;
      
      return { ...study, leftPct, widthPct };
    }).filter(Boolean);

    const grouped = Object.values(MINISTRIES).map(ministry => ({
      ...ministry,
      studies: plottedStudies.filter(s => s.ministryId === ministry.id).sort((a,b) => new Date(a.startDate) - new Date(b.startDate))
    })).filter(g => g.studies.length > 0);

    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 overflow-hidden flex flex-col h-[calc(100vh-140px)]">
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-xl font-semibold text-slate-800">Ministry Year Planner</h2>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setTrimEmptyMonths(!trimEmptyMonths)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${
                trimEmptyMonths 
                  ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' 
                  : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {trimEmptyMonths ? 'Active Months Only' : 'Full Year Range'}
            </button>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md border border-slate-200">
              <button onClick={() => setStartYear(y => y - 1)} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-all">← {startYear - 1}-{startYear}</button>
              <span className="px-3 py-1.5 text-xs font-semibold text-[#2b5278] bg-white shadow-sm rounded">{startYear}-{endYear}</span>
              <button onClick={() => setStartYear(y => y + 1)} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-all">{startYear + 1}-{endYear + 1} →</button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar border border-slate-200 rounded-md bg-white">
          <div className="min-w-[1200px] h-full flex flex-col">
            <div className="flex flex-col sticky top-0 bg-white z-20 border-b border-slate-200 shadow-sm">
              <div className="flex">
                <div className="w-28 md:w-64 flex-shrink-0 bg-slate-50 p-3 border-r border-slate-200 flex flex-col justify-end">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide truncate">Ministry / Study</span>
                </div>
                <div className="flex-1 flex relative h-12">
                  <div className="flex absolute top-0 left-0 right-0 h-7 border-b border-slate-200 bg-slate-50">
                    {timelineMonths.map((m, idx) => (
                      <div key={idx} style={{ width: `${m.widthPct}%` }} className="border-r border-slate-200 p-1 text-center flex items-center justify-center">
                        <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                          {m.name}{m.showYear ? ` '${String(m.year).slice(2)}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="absolute top-7 bottom-0 left-0 right-0 bg-white">
                    {sundays.map((s, i) => (
                      <div key={i} style={{ left: `${s.leftPct}%` }} className="absolute h-full border-l border-slate-200 flex items-center pl-1 group/sunday">
                        <span className="text-[9px] font-medium text-slate-400 group-hover/sunday:text-blue-600 transition-colors">{s.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 relative pb-10 bg-slate-50/30">
              <div className="absolute top-0 bottom-0 left-28 md:left-64 right-0 pointer-events-none z-0">
                {sundays.map((s, i) => (
                  <React.Fragment key={i}>
                    <div style={{ left: `${s.leftPct}%` }} className="absolute top-0 bottom-0 border-l border-dashed border-slate-200"></div>
                  </React.Fragment>
                ))}
              </div>

              {grouped.length === 0 ? (
                <div className="p-16 text-center text-slate-400 font-medium text-lg">No studies scheduled for the {startYear}-{endYear} ministry year.</div>
              ) : (
                grouped.map(group => (
                  <div key={group.id} className="border-b border-slate-200 last:border-0 relative z-10">
                    <div className="absolute top-0 bottom-0 left-28 md:left-64 right-0 pointer-events-none z-0">
                      {sundays.map((s, i) => {
                        const isGroupBlackout = blackouts.some(b => {
                          const bdStart = b.startDate || b.date;
                          const bdEnd = b.endDate || b.date;
                          const applies = (b.ministries || ['all']).includes('all') || (b.ministries || []).includes(group.id);
                          return applies && s.dateStr >= bdStart && s.dateStr <= bdEnd;
                        });
                        return isGroupBlackout ? (
                          <div key={i} style={{ left: `${s.leftPct}%`, width: `${s.widthPct}%` }} className="absolute top-0 bottom-0 bg-slate-200/60 border-x border-slate-300/40 border-dashed"></div>
                        ) : null;
                      })}
                    </div>
                    <div className="bg-slate-100 px-3 py-2 border-b border-slate-200 sticky left-0 z-10 w-28 md:w-64 shadow-[1px_0_0_0_#e2e8f0] flex items-center overflow-hidden">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide border ${group.color}`}>
                        {group.name}
                      </span>
                    </div>
                    {group.studies.map(study => (
                      <div key={study.id} className="flex group/row hover:bg-slate-50 transition-colors h-14 border-b border-slate-100 last:border-0 relative">
                        <div className="w-28 md:w-64 flex-shrink-0 px-3 py-2 border-r border-slate-200 bg-white group-hover/row:bg-slate-50 transition-colors sticky left-0 z-10 flex flex-col justify-center shadow-[1px_0_0_0_#e2e8f0] overflow-hidden">
                          <div className="flex items-center gap-2 pr-2">
                            <h4 className="text-sm font-medium text-slate-800 truncate" title={study.title}>{study.title}</h4>
                            {(() => {
                              const warnings = getStudyWarnings(study);
                              return (warnings.missingResources || warnings.missingPromotion) && (
                                <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
                              );
                            })()}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-[10px] text-slate-500">{study.weeks} weeks • {study.startDate}</span>
                            {(() => {
                              const warnings = getStudyWarnings(study);
                              return (warnings.missingResources || warnings.missingPromotion) && (
                                <div className="flex gap-1">
                                  {warnings.missingResources && <span className="text-[9px] font-medium bg-red-50 text-red-600 px-1 rounded border border-red-200">NO RES</span>}
                                  {warnings.missingPromotion && <span className="text-[9px] font-medium bg-red-50 text-red-600 px-1 rounded border border-red-200">NO PROMO</span>}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                        <div className="flex-1 relative py-2">
                          <div 
                            onClick={() => handleOpenModal(study)}
                            className={`absolute top-1/2 -translate-y-1/2 h-7 rounded shadow-sm border cursor-pointer hover:shadow hover:ring-2 ring-blue-200 transition-all overflow-hidden flex items-center px-2 ${group.color.replace('bg-', 'bg-white ').replace('text-', 'text-slate-800 ')}`}
                            style={{ 
                              left: `${study.leftPct}%`, 
                              width: `max(4rem, ${study.widthPct}%)`, 
                              backgroundColor: 'white' 
                            }}
                            title={`${study.title}\nStarts: ${study.startDate}\nDuration: ${study.weeks} weeks`}
                          >
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${group.dot}`}></div>
                            <span className="relative text-[11px] font-medium truncate pl-1.5 pointer-events-none w-full text-slate-700">
                              {study.title}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleLogin = async (e, email, password) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error(err);
      setAuthError("Invalid credentials or account not found.");
      setIsLoggingIn(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compass Discipleship Cloud...</span>
      </div>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 selection:bg-blue-100 font-sans">
      <div className="bg-white p-10 rounded-[2rem] shadow-xl w-full max-w-md border border-slate-200 flex flex-col items-center animate-in zoom-in-95 duration-500">
        <div className="bg-[#2b5278] p-3 rounded-xl shadow-sm mb-6"><BookOpen className="text-white" size={32} /></div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">Compass Study Tracker</h1>
        <p className="text-sm text-slate-500 mb-8 text-center font-medium">Enter the team credentials to access the discipleship workflow.</p>
        
        <form onSubmit={(e) => handleLogin(e, e.target.email.value, e.target.password.value)} className="w-full space-y-4">
          {authError && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 text-center font-medium shadow-sm">{authError}</div>}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">Team Email</label>
            <input name="email" type="email" required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all shadow-sm" placeholder="team@compass.local" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">Passcode</label>
            <input name="password" type="password" required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all shadow-sm" placeholder="••••••••" />
          </div>
          <button disabled={isLoggingIn} type="submit" className="w-full bg-[#2b5278] text-white py-3 rounded-lg font-semibold mt-4 hover:bg-[#1f3f5e] transition-colors disabled:opacity-70 shadow-md">
            {isLoggingIn ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 font-sans">
      <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 sticky top-0 z-30 flex flex-wrap lg:flex-nowrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
          <div className="flex items-center gap-3">
            <div className="bg-[#2b5278] p-2 rounded shadow-sm"><BookOpen className="text-white" size={18} /></div>
            <div>
              <h1 className="text-base md:text-lg font-semibold text-slate-800 leading-tight">Compass Study Tracker</h1>
              <p className="text-[10px] md:text-[11px] text-slate-500 mt-0.5">Compass Community Church</p>
            </div>
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            <button onClick={() => setIsImportModalOpen(true)} className="bg-white border border-slate-300 text-slate-700 p-2 rounded-md font-medium flex items-center justify-center hover:bg-slate-50 shadow-sm active:scale-95 transition-all">
              <Upload size={18} />
            </button>
            <button onClick={() => handleOpenModal()} className="bg-[#2b5278] text-white p-2 rounded-md font-medium flex items-center justify-center hover:bg-[#1f3f5e] shadow-sm active:scale-95 transition-all">
              <Plus size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="w-full lg:w-auto overflow-x-auto scrollbar-hide py-1">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md border border-slate-200 min-w-max">
            <button 
              onClick={() => setViewMode('detail')} 
              className={`flex items-center gap-2 px-3 md:px-4 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === 'detail' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <LayoutGrid size={16} /> Detail
            </button>
            <button 
              onClick={() => setViewMode('pipeline')} 
              className={`flex items-center gap-2 px-3 md:px-4 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === 'pipeline' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <Columns size={16} /> Pipeline
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-3 md:px-4 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === 'calendar' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <Calendar size={16} /> Calendar
            </button>
            <button
              onClick={() => setViewMode('launch')}
              className={`flex items-center gap-2 px-3 md:px-4 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === 'launch' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <ListChecks size={16} /> Launch
            </button>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <button onClick={() => { signOut(auth); setUser(null); }} className="text-slate-400 hover:text-slate-600 text-sm font-medium mr-2 flex items-center gap-1 transition-colors">
            <LogOut size={16} /> Logout
          </button>
          <button onClick={() => setIsImportModalOpen(true)} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-50 active:scale-95 transition-all shadow-sm flex items-center gap-2">
            <Upload size={16} /> Import Studies
          </button>
          <button onClick={() => setIsBlackoutModalOpen(true)} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-50 active:scale-95 transition-all shadow-sm">
             Manage Blackouts
          </button>
          <button onClick={() => handleOpenModal()} className="bg-[#2b5278] text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-[#1f3f5e] active:scale-95 transition-all shadow-sm">
            <Plus size={16} strokeWidth={2.5} /> New Study
          </button>
        </div>
      </header>

      <main className="w-full mx-auto p-6">
        {viewMode === 'launch' ? (
          <LaunchAttentionView />
        ) : viewMode === 'detail' ? (
          <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
            <aside className="lg:w-64 flex-shrink-0">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-2">Workflow Stages</h3>
              <nav className="space-y-1.5">
                {STAGES.map((stage) => (
                  <button
                    key={stage.id}
                    onClick={() => setActiveStage(stage.id)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all ${
                      activeStage === stage.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-100 font-bold' : 'text-slate-600 hover:bg-white border border-transparent hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 text-sm">
                      <stage.icon size={18} />
                      {stage.name}
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${activeStage === stage.id ? 'bg-white/20' : 'bg-slate-200'}`}>
                      {studiesByStage[stage.id]?.length || 0}
                    </span>
                  </button>
                ))}
              </nav>
            </aside>

            <section className="flex-1 min-w-0">
              <h2 className="text-3xl font-black text-slate-800 mb-8 tracking-tight">{STAGES.find(s => s.id === activeStage)?.name}</h2>
              {(studiesByStage[activeStage] || []).length === 0 ? (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-24 text-center text-slate-300 font-black italic text-xl">
                  No active studies in this phase.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                  {(studiesByStage[activeStage] || []).map(study => (
                    <StudyCard key={study.id} study={study} />
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : viewMode === 'pipeline' ? (
          <div className="flex flex-row gap-4 h-[calc(100vh-140px)] w-full overflow-x-auto lg:overflow-x-visible pb-4 snap-x snap-mandatory scroll-p-4">
            {STAGES.map(stage => (
              <div 
                key={stage.id} 
                onDragOver={(e) => onDragOver(e, stage.id)}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={(e) => onDrop(e, stage.id)}
                className={`w-[85vw] md:w-auto md:flex-1 md:min-w-[360px] flex-shrink-0 snap-center flex flex-col rounded-lg transition-all duration-200 border ${dragOverStage === stage.id ? 'bg-blue-50/50 border-blue-300 ring-2 ring-blue-200' : 'bg-slate-100/50 border-slate-200'}`}
              >
                <div className="flex items-center justify-between mb-3 px-4 py-3 bg-white rounded-t-lg border-b border-slate-200 shadow-sm">
                  <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2 truncate">
                    <stage.icon size={16} className="text-slate-400" /> {stage.name}
                  </h4>
                  <span className="text-xs font-semibold bg-slate-100 px-2.5 py-1 rounded-md text-slate-600">
                    {(studiesByStage[stage.id] || []).length}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 pb-4 scrollbar-hide px-3 pt-3">
                  {(studiesByStage[stage.id] || []).map(study => (
                    <StudyCard key={study.id} study={study} compact={true} />
                  ))}
                  <button 
                    onClick={() => handleOpenModal(null, stage.id)}
                    className="w-full py-4 border border-dashed border-slate-300 rounded-lg text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Plus size={16} /> Add Study
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <CalendarView />
        )}
      </main>

      {isBlackoutModalOpen && <BlackoutModal />}
      {isImportModalOpen && <ImportModal />}

      {/* Expanded Modal with Restored Fields */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-lg md:rounded-[3.5rem] shadow-2xl w-full max-w-4xl my-auto overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-5 md:p-10 border-b flex items-center justify-between bg-slate-50/50 sticky top-0 z-10">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-none">{editingStudy ? 'Update Study' : 'Register New Study'}</h2>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-2">Discipleship Pathway Documentation</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-4 hover:bg-white border border-transparent hover:border-slate-200 rounded-3xl transition-all shadow-sm hover:shadow-md">
                <X size={28} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-5 md:p-10 space-y-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
              
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-blue-600">
                  <Info size={18} strokeWidth={3} />
                  <h3 className="text-xs font-black uppercase tracking-[0.2em]">General Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-slate-500 mb-1 ml-1">Study Title</label>
                      <input required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 font-semibold text-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all shadow-sm" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                    </div>
                    <div className="md:w-1/3">
                      <label className="block text-xs font-semibold text-slate-500 mb-1 ml-1">Cover Image URL (Optional)</label>
                      <input type="url" placeholder="Paste image address..." className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all shadow-sm" value={formData.imageUrl || ''} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Ministry Area</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold text-sm focus:ring-4 focus:ring-blue-100 outline-none transition-all" value={formData.ministryId} onChange={e => setFormData({...formData, ministryId: e.target.value})}>
                      {Object.values(MINISTRIES).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Discipleship Stage</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold text-sm focus:ring-4 focus:ring-blue-100 outline-none transition-all" value={formData.stage} onChange={e => setFormData({...formData, stage: e.target.value})}>
                      {STAGES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Start Date</label>
                    <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold text-sm focus:ring-4 focus:ring-blue-100 outline-none transition-all" value={formData.startDate} onChange={e => updateStudyField('startDate', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Number of Weeks</label>
                    <div className="relative">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-4 font-bold text-sm focus:ring-4 focus:ring-blue-100 outline-none transition-all" value={formData.weeks} onChange={e => updateStudyField('weeks', parseInt(e.target.value) || 0)} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-2 text-emerald-600">
                  <Package size={18} strokeWidth={3} />
                  <h3 className="text-xs font-black uppercase tracking-[0.2em]">Study Setup</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Study Material Status</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold text-sm focus:ring-4 focus:ring-emerald-100 outline-none transition-all" value={formData.studyMaterial} onChange={e => setFormData({...formData, studyMaterial: e.target.value})}>
                      {OPTIONS.STUDY_MATERIAL.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <label className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 cursor-pointer">
                    <input type="checkbox" checked={formData.physicalResources !== 'Not required'} onChange={(e) => updateResourceRequirement('physicalResources', 'physical_resource', e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                    <span className="text-sm font-semibold text-slate-700">Physical books or workbooks required</span>
                  </label>
                  <label className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 cursor-pointer">
                    <input type="checkbox" checked={formData.digitalResources !== 'Not required'} onChange={(e) => updateResourceRequirement('digitalResources', 'digital_streaming', e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                    <span className="text-sm font-semibold text-slate-700">Digital or streamed material required</span>
                  </label>
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Location</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold text-sm focus:ring-4 focus:ring-emerald-100 outline-none transition-all" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}>
                      {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Study Notes</label>
                    <textarea rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all focus:bg-white" placeholder="Record study-specific context or unresolved facts." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-6 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-teal-700">
                    <ListChecks size={18} strokeWidth={3} />
                    <h3 className="text-xs font-black uppercase tracking-[0.2em]">Launch Readiness</h3>
                  </div>
                  {formData.launchPlan && (
                    <button type="button" onClick={() => setFormData((current) => ({ ...current, launchPlan: createLaunchPlan(current, current.launchPlan) }))} className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 self-start">
                      <RefreshCcw size={14} /> Recalculate dates
                    </button>
                  )}
                </div>

                {!formData.launchPlan ? (
                  <div className="border border-dashed border-teal-300 bg-teal-50/40 rounded-lg p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-slate-900">Create a dated launch checklist</div>
                      <p className="text-sm text-slate-600 mt-1">Starts with the universal workflow and information-only Planning Center page.</p>
                    </div>
                    <button type="button" onClick={enableLaunchPlan} className="px-4 py-2.5 rounded-md bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800 self-start">Create checklist</button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">Planning Center page mode</label>
                        <select value={formData.launchPlan.pageMode} onChange={(e) => updateLaunchPlan({ pageMode: e.target.value })} className="w-full bg-white border border-slate-300 rounded-md px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-teal-500 outline-none">
                          {PLANNING_CENTER_PAGE_MODES.map((mode) => <option key={mode} value={mode}>{PAGE_MODE_LABELS[mode]}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">Page production path</label>
                        <select value={formData.launchPlan.productionPath} onChange={(e) => updateLaunchPlan({ productionPath: e.target.value })} className="w-full bg-white border border-slate-300 rounded-md px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-teal-500 outline-none">
                          {PLANNING_CENTER_PRODUCTION_PATHS.map((path) => <option key={path} value={path}>{PRODUCTION_PATH_LABELS[path]}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">Public launch date</label>
                        <input type="date" value={formData.launchPlan.publicLaunchDate} onChange={(e) => updateLaunchPlan({ publicLaunchDate: e.target.value })} className="w-full bg-white border border-slate-300 rounded-md px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-teal-500 outline-none" />
                      </div>
                    </div>

                    {formData.launchPlan.productionPath === 'jonathan_self_service' && (
                      <div className="flex items-start gap-3 px-4 py-3 border border-amber-200 bg-amber-50 rounded-md">
                        <AlertCircle size={18} className="text-amber-700 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-amber-900">Independent proof is required only when Jonathan builds or materially corrects the page. Complete that checkpoint after someone has checked it.</p>
                      </div>
                    )}

                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-800">Launch checkpoints</span>
                        <span className="text-xs text-slate-500">{getLaunchSummary(formData).complete}/{getLaunchSummary(formData).total} ready</span>
                      </div>
                      {formData.launchPlan.checkpoints.map((checkpoint, index, checkpoints) => (
                        <React.Fragment key={checkpoint.id}>
                          {checkpoint.phase === 'follow_up' && checkpoints[index - 1]?.phase !== 'follow_up' && (
                            <div className="px-4 py-3 bg-slate-50 border-y border-slate-200 text-sm font-semibold text-slate-800">After-launch follow-up</div>
                          )}
                        <div className="p-4 border-b border-slate-100 last:border-b-0 space-y-3">
                          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900">{checkpoint.title}</div>
                              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{checkpoint.description}</p>
                              <p className="text-xs text-blue-700 mt-1">Start by {getCheckpointAttentionDate(checkpoint) || 'date not set'} · Target {effectiveDueDate(checkpoint) || 'date not set'}</p>
                              {getUnmetDependencies(formData.launchPlan, checkpoint).length > 0 && (
                                <p className="text-xs font-semibold text-amber-800 mt-1">{getUnmetDependencies(formData.launchPlan, checkpoint).length} prerequisite{getUnmetDependencies(formData.launchPlan, checkpoint).length === 1 ? '' : 's'} remaining</p>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-2 flex-shrink-0">
                              <select aria-label={`${checkpoint.title} status`} value={checkpoint.status} onChange={(e) => updateCheckpoint(checkpoint.id, { status: e.target.value })} className="border border-slate-300 rounded-md px-2.5 py-2 text-xs font-semibold bg-white focus:ring-2 focus:ring-teal-500 outline-none">
                                {LAUNCH_STATUSES.map((status) => <option key={status} value={status} disabled={status === 'done' && getUnmetDependencies(formData.launchPlan, checkpoint).length > 0}>{LAUNCH_STATUS_LABELS[status]}</option>)}
                              </select>
                              <input aria-label={`${checkpoint.title} target date`} title={`Calculated target: ${checkpoint.calculatedDueDate || 'not set'}`} type="date" value={checkpoint.dueDateOverride || checkpoint.calculatedDueDate} onChange={(e) => updateCheckpoint(checkpoint.id, { dueDateOverride: e.target.value === checkpoint.calculatedDueDate ? '' : e.target.value })} className="border border-slate-300 rounded-md px-2.5 py-2 text-xs font-semibold bg-white focus:ring-2 focus:ring-teal-500 outline-none" />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2">
                            <input aria-label={`${checkpoint.title} owner`} placeholder="Owner" value={checkpoint.owner} onChange={(e) => updateCheckpoint(checkpoint.id, { owner: e.target.value })} className="border border-slate-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
                            <input aria-label={`${checkpoint.title} next action`} placeholder="Next action" value={checkpoint.nextAction} onChange={(e) => updateCheckpoint(checkpoint.id, { nextAction: e.target.value })} className="border border-slate-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
                          </div>
                          {(checkpoint.status === 'blocked' || checkpoint.blocker) && (
                            <input aria-label={`${checkpoint.title} blocker`} placeholder="What is blocking this?" value={checkpoint.blocker} onChange={(e) => updateCheckpoint(checkpoint.id, { blocker: e.target.value })} className="w-full border border-red-200 bg-red-50 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-red-400 outline-none" />
                          )}
                          <details className="text-xs text-slate-500">
                            <summary className="cursor-pointer font-semibold hover:text-slate-700">Working notes</summary>
                            <textarea rows={6} maxLength={12000} aria-label={`${checkpoint.title} working notes`} value={checkpoint.notes || ''} onChange={(e) => updateCheckpoint(checkpoint.id, { notes: e.target.value })} className="mt-2 w-full border border-slate-200 rounded-md px-3 py-2 text-sm leading-relaxed text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none resize-y" placeholder="Store draft copy, supplier communication, decisions, or other working context for this stage." />
                          </details>
                          <details className="text-xs text-slate-500">
                            <summary className="cursor-pointer font-semibold hover:text-slate-700">Evidence or link</summary>
                            <textarea rows={2} aria-label={`${checkpoint.title} evidence`} value={checkpoint.evidence} onChange={(e) => updateCheckpoint(checkpoint.id, { evidence: e.target.value })} className="mt-2 w-full border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Record the URL or concise confirmation that proves this is complete." />
                          </details>
                        </div>
                        </React.Fragment>
                      ))}
                    </div>

                    <button type="button" onClick={() => setFormData((current) => ({ ...current, launchPlan: null }))} className="text-xs font-semibold text-slate-500 hover:text-red-700">Remove launch checklist</button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 md:gap-4 pt-10 justify-end border-t border-slate-100 pb-2">
                {editingStudy && (
                  <button type="button" onClick={() => handleDelete(editingStudy.id)} className="px-4 md:px-8 py-4 font-black text-[10px] text-rose-500 uppercase tracking-widest hover:bg-rose-50 rounded-2xl transition-all">Delete</button>
                )}
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 md:px-8 py-4 font-bold text-slate-400">Cancel</button>
                <button type="submit" className="bg-slate-900 px-6 md:px-12 py-4 rounded-[2rem] font-black text-base text-white shadow-2xl shadow-slate-200 flex items-center gap-3 active:scale-95 transition-all">
                  <Save size={20} strokeWidth={3} /> {editingStudy ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<App />);
}

export default App;
