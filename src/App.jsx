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
  SquareCheck,
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
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compass Discipleship Cloud...</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100">
      <header className="bg-white border-b px-8 py-4 sticky top-0 z-30 shadow-sm">
        <div className="w-full mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-100"><BookOpen className="text-white" size={20} /></div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">Study Tracker</h1>
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
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-24 text-center text-slate-300 font-black italic text-xl">
                  No active studies in this phase.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {(studiesByStage[activeStage] || []).map(study => (
                    <StudyCard key={study.id} study={study} />
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="flex flex-row gap-6 h-[calc(100vh-160px)] w-full overflow-x-auto lg:overflow-x-visible pb-4">
            {STAGES.map(stage => (
              <div 
                key={stage.id} 
                onDragOver={(e) => onDragOver(e, stage.id)}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={(e) => onDrop(e, stage.id)}
                className={`flex-1 min-w-[300px] flex flex-col rounded-[2.5rem] transition-all duration-300 ${dragOverStage === stage.id ? 'bg-blue-50 ring-4 ring-blue-100 ring-inset scale-[1.02]' : 'bg-transparent'}`}
              >
                <div className="flex items-center justify-between mb-4 px-5 py-4 bg-slate-200/50 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2 truncate">
                    <stage.icon size={14} className="text-slate-400" /> {stage.name}
                  </h4>
                  <span className="text-[10px] font-black bg-white px-3 py-1 rounded-lg border text-slate-400 shadow-sm">
                    {(studiesByStage[stage.id] || []).length}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 pb-4 scrollbar-hide px-1">
                  {(studiesByStage[stage.id] || []).map(study => (
                    <StudyCard key={study.id} study={study} compact={true} />
                  ))}
                  <button 
                    onClick={() => handleOpenModal(null, stage.id)}
                    className="w-full py-5 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 hover:text-blue-500 hover:border-blue-200 hover:bg-white transition-all text-xs font-black flex items-center justify-center gap-2 uppercase tracking-widest"
                  >
                    <Plus size={16} strokeWidth={4} /> Add Study
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Expanded Modal with Restored Fields */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-4xl my-auto overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 border-b flex items-center justify-between bg-slate-50/50 sticky top-0 z-10">
              <div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-none">{editingStudy ? 'Update Study' : 'Register New Study'}</h2>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-2">Discipleship Pathway Documentation</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-4 hover:bg-white border border-transparent hover:border-slate-200 rounded-3xl transition-all shadow-sm hover:shadow-md">
                <X size={28} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-10 space-y-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
              
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-blue-600">
                  <Info size={18} strokeWidth={3} />
                  <h3 className="text-xs font-black uppercase tracking-[0.2em]">General Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Study Title</label>
                    <input required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold text-xl focus:ring-4 focus:ring-blue-100 focus:bg-white outline-none transition-all" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
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
                    <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold text-sm focus:ring-4 focus:ring-blue-100 outline-none transition-all" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Number of Weeks</label>
                    <div className="relative">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-4 font-bold text-sm focus:ring-4 focus:ring-blue-100 outline-none transition-all" value={formData.weeks} onChange={e => setFormData({...formData, weeks: parseInt(e.target.value) || 0})} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-2 text-emerald-600">
                  <Package size={18} strokeWidth={3} />
                  <h3 className="text-xs font-black uppercase tracking-[0.2em]">Resources & Tracking</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Study Material Status</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold text-sm focus:ring-4 focus:ring-emerald-100 outline-none transition-all" value={formData.studyMaterial} onChange={e => setFormData({...formData, studyMaterial: e.target.value})}>
                      {OPTIONS.STUDY_MATERIAL.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Physical Resources</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold text-sm focus:ring-4 focus:ring-emerald-100 outline-none transition-all" value={formData.physicalResources} onChange={e => setFormData({...formData, physicalResources: e.target.value})}>
                      {OPTIONS.PHYSICAL_RESOURCES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Digital Resources</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold text-sm focus:ring-4 focus:ring-emerald-100 outline-none transition-all" value={formData.digitalResources} onChange={e => setFormData({...formData, digitalResources: e.target.value})}>
                      {OPTIONS.DIGITAL_RESOURCES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Location</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold text-sm focus:ring-4 focus:ring-emerald-100 outline-none transition-all" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}>
                      {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-2 text-purple-600">
                  <Megaphone size={18} strokeWidth={3} />
                  <h3 className="text-xs font-black uppercase tracking-[0.2em]">Promotion & Post-Study</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4">
                    <input 
                      type="checkbox" 
                      id="websiteUpdated"
                      className="w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500" 
                      checked={formData.websiteUpdated} 
                      onChange={e => setFormData({...formData, websiteUpdated: e.target.checked})} 
                    />
                    <label htmlFor="websiteUpdated" className="text-sm font-bold text-slate-700 cursor-pointer">Website Updated / Study Promoted?</label>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Live Study Tracking</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold text-sm focus:ring-4 focus:ring-purple-100 outline-none transition-all" value={formData.liveTracking} onChange={e => setFormData({...formData, liveTracking: e.target.value})}>
                      {OPTIONS.LIVE_TRACKING.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Proposed Promo Text</label>
                    <div className="relative">
                      <FileText className="absolute left-5 top-5 text-slate-400" size={18} />
                      <textarea rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-14 pr-5 py-4 text-base focus:ring-4 focus:ring-purple-100 outline-none transition-all focus:bg-white" placeholder="Enter blurb..." value={formData.promoText} onChange={e => setFormData({...formData, promoText: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Post-Study Review Status</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold text-sm focus:ring-4 focus:ring-purple-100 outline-none transition-all" value={formData.postReview} onChange={e => setFormData({...formData, postReview: e.target.value})}>
                      {OPTIONS.POST_REVIEW.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                   <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Quick Logistics Notes</label>
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold text-sm focus:ring-4 focus:ring-purple-100 outline-none transition-all" placeholder="Any final thoughts?" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-10 justify-end border-t border-slate-100 sticky bottom-0 bg-white pb-2">
                {editingStudy && (
                  <button type="button" onClick={() => handleDelete(editingStudy.id)} className="px-8 py-4 font-black text-[10px] text-rose-500 uppercase tracking-widest hover:bg-rose-50 rounded-2xl transition-all">Delete</button>
                )}
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 font-bold text-slate-400">Cancel</button>
                <button type="submit" className="bg-slate-900 px-12 py-4 rounded-[2rem] font-black text-base text-white shadow-2xl shadow-slate-200 flex items-center gap-3 active:scale-95 transition-all">
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