import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
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
  CheckSquare,
  Globe,
  Hash,
  FileText
} from 'lucide-react';

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
  signInAnonymously 
} from 'firebase/auth';

// --- Constants & Config ---
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
  PHYSICAL_RESOURCES: ['Required', 'Quote request sent', 'Order placed', 'Received and distributed', 'Not required'],
  DIGITAL_RESOURCES: ['Required', 'Procured and available', 'Not required'],
  LIVE_TRACKING: ['Not started', 'In Progress', 'Completed'],
  POST_REVIEW: ['Not Started', 'In Progress', 'Completed']
};

const LOCATIONS = ["Orangeville", "Shelburne", "Grand Valley", "Other"];

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const App = () => {
  const [user, setUser] = useState(null);
  const [studies, setStudies] = useState([]);
  const [activeStage, setActiveStage] = useState('active');
  const [viewMode, setViewMode] = useState('pipeline'); 
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudy, setEditingStudy] = useState(null);
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);

  const [formData, setFormData] = useState({
    title: '', 
    ministryId: 'mens', 
    stage: 'planning', 
    location: 'Orangeville', 
    startDate: new Date().toISOString().split('T')[0],
    weeks: 6,
    studyMaterial: 'Not Started',
    physicalResources: 'Not required',
    digitalResources: 'Not required',
    websiteUpdated: false,
    liveTracking: 'Not started',
    postReview: 'Not Started',
    notes: '', 
    promoText: '',
    updates: ''
  });

  useEffect(() => {
    signInAnonymously(auth).catch(err => console.error("Auth error:", err));
    const unsubscribe = onAuthStateChanged(auth, setUser);
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
    return () => unsubscribe();
  }, [user]);

  const studiesByStage = useMemo(() => {
    return STAGES.reduce((acc, stage) => {
      acc[stage.id] = studies.filter(s => s.stage === stage.id);
      return acc;
    }, {});
  }, [studies]);

  // Drag & Drop Handlers
  const onDragStart = (e, id) => {
    setDraggedId(id);
    e.dataTransfer.setData("studyId", id);
    e.dataTransfer.effectAllowed = "move";
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
      await updateDoc(doc(db, 'ministry_studies', studyId), { stage: targetStageId });
    } catch (err) { console.error("Drop failed:", err); }
  };

  const handleOpenModal = (study = null, targetStage = null) => {
    if (study) {
      setEditingStudy(study);
      setFormData({ 
        weeks: 6,
        studyMaterial: 'Not Started',
        physicalResources: 'Not required',
        digitalResources: 'Not required',
        websiteUpdated: false,
        liveTracking: 'Not started',
        postReview: 'Not Started',
        promoText: '',
        ...study 
      });
    } else {
      setEditingStudy(null);
      setFormData({
        title: '', 
        ministryId: 'mens', 
        stage: targetStage || activeStage, 
        location: 'Orangeville', 
        startDate: new Date().toISOString().split('T')[0],
        weeks: 6,
        studyMaterial: 'Not Started',
        physicalResources: 'Not required',
        digitalResources: 'Not required',
        websiteUpdated: false,
        liveTracking: 'Not started',
        postReview: 'Not Started',
        notes: '', 
        promoText: '',
        updates: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      if (editingStudy) {
        await updateDoc(doc(db, 'ministry_studies', editingStudy.id), formData);
      } else {
        await addDoc(collection(db, 'ministry_studies'), { ...formData, createdAt: new Date().toISOString() });
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
    
    // Status color helpers
    const getStatusColor = (val) => {
      if (val?.includes('Approved') || val?.includes('available') || val?.includes('distributed')) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      if (val?.includes('Required') || val?.includes('Not Started') || val?.includes('Request')) return 'text-rose-600 bg-rose-50 border-rose-100';
      return 'text-amber-600 bg-amber-50 border-amber-100';
    };

    return (
      <div 
        draggable
        onDragStart={(e) => onDragStart(e, study.id)}
        className={`group bg-white border rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden mb-3 cursor-grab active:cursor-grabbing ${compact ? 'p-3' : 'p-5'} ${isDragging ? 'opacity-40 scale-95' : 'opacity-100'}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
              {compact && <GripVertical size={10} className="text-slate-300" />}
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${ministry.color}`}>
                {ministry.name}
              </span>
            </div>
            <h3 className={`font-bold text-slate-800 leading-tight truncate ${!compact ? 'text-base' : 'text-[12px]'}`}>
              {study.title}
            </h3>
          </div>
          <button onClick={() => handleOpenModal(study)} className="p-1 text-slate-300 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical size={!compact ? 18 : 14} />
          </button>
        </div>

        {/* Status Indicators for Pipeline View */}
        <div className="mt-2 flex flex-wrap gap-1">
          {study.studyMaterial !== 'Not Started' && (
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${getStatusColor(study.studyMaterial)}`}>
              Material: {study.studyMaterial}
            </span>
          )}
          {study.physicalResources !== 'Not required' && (
            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${getStatusColor(study.physicalResources)}`}>
              Resources: {study.physicalResources}
            </span>
          )}
        </div>

        {!compact && study.notes && (
          <p className="mt-3 text-xs text-slate-500 line-clamp-3 italic whitespace-pre-wrap leading-relaxed">{study.notes}</p>
        )}
        
        <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1"><MapPin size={10} /> {study.location}</span>
          {!compact && <span className="flex items-center gap-1"><Calendar size={10}/> {study.startDate}</span>}
          {compact && study.weeks && <span className="flex items-center gap-1"><Clock size={10}/> {study.weeks}w</span>}
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Discipleship Cloud...</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100">
      <header className="bg-white border-b px-8 py-4 sticky top-0 z-30 shadow-sm">
        <div className="w-full mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-100"><BookOpen className="text-white" size={20} /></div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">Ministry Study Tracker</h1>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Compass Community Church</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button 
              onClick={() => setViewMode('detail')} 
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'detail' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <LayoutGrid size={14} /> Detail View
            </button>
            <button 
              onClick={() => setViewMode('pipeline')} 
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'pipeline' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Columns size={14} /> Pipeline View
            </button>
          </div>

          <button onClick={() => handleOpenModal()} className="bg-slate-900 text-white px-6 py-2.5 rounded-2xl text-sm font-black flex items-center gap-2 hover:bg-slate-800 active:scale-95 transition-all shadow-xl shadow-slate-200">
            <Plus size={18} strokeWidth={3} /> New Study
          </button>
        </div>
      </header>

      <main className="w-full mx-auto p-6">
        {viewMode === 'detail' ? (
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
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-