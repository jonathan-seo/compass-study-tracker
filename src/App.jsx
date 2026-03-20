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
  GripVertical
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
    title: '', ministryId: 'mens', stage: 'planning', notes: '', updates: '',
    location: 'Orangeville', startDate: new Date().toISOString().split('T')[0]
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
      setFormData({ ...study });
    } else {
      setEditingStudy(null);
      setFormData({
        title: '', ministryId: 'mens', stage: targetStage || activeStage, notes: '', updates: '',
        location: 'Orangeville', startDate: new Date().toISOString().split('T')[0]
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
    if (!user || !window.confirm("Delete this record?")) return;
    try {
      await deleteDoc(doc(db, 'ministry_studies', id));
      setIsModalOpen(false);
    } catch (err) { console.error("Delete error:", err); }
  };

  const StudyCard = ({ study, compact = false }) => {
    const ministry = MINISTRIES[study.ministryId.toUpperCase()] || MINISTRIES.MENS;
    const isDragging = draggedId === study.id;
    return (
      <div 
        draggable
        onDragStart={(e) => onDragStart(e, study.id)}
        className={`group bg-white border rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden mb-3 cursor-grab active:cursor-grabbing ${compact ? 'p-3' : 'p-5'} ${isDragging ? 'opacity-40 scale-95' : 'opacity-100'}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
              {compact && <GripVertical size={10} className="text-slate-300" />}
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${ministry.color}`}>
                {ministry.name}
              </span>
            </div>
            <h3 className={`font-bold text-slate-800 leading-tight truncate ${!compact ? 'text-base' : 'text-[13px]'}`}>
              {study.title}
            </h3>
          </div>
          <button onClick={() => handleOpenModal(study)} className="p-1 text-slate-300 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical size={!compact ? 18 : 14} />
          </button>
        </div>
        {!compact && study.notes && (
          <p className="mt-2 text-xs text-slate-500 line-clamp-3 italic whitespace-pre-wrap">{study.notes}</p>
        )}
        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-medium">
          <span className="flex items-center gap-1"><MapPin size={10} /> {study.location}</span>
          {!compact && <span>{study.startDate}</span>}
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-600" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100">
      <header className="bg-white border-b px-8 py-4 sticky top-0 z-30 shadow-sm">
        <div className="w-full mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg"><BookOpen className="text-white" size={20} /></div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">Study Tracker</h1>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Compass Discipleship</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button 
              onClick={() => setViewMode('detail')} 
              className={`flex items-center gap-2 px-6 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'detail' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <LayoutGrid size={14} /> Detail
            </button>
            <button 
              onClick={() => setViewMode('pipeline')} 
              className={`flex items-center gap-2 px-6 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'pipeline' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Columns size={14} /> Pipeline
            </button>
          </div>

          <button onClick={() => handleOpenModal()} className="bg-slate-900 text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-800 active:scale-95 transition-all shadow-lg shadow-slate-200">
            <Plus size={18} strokeWidth={3} /> New Study
          </button>
        </div>
      </header>

      <main className="w-full mx-auto p-8">
        {viewMode === 'detail' ? (
          <div className="flex flex-col lg:flex-row gap-10">
            <aside className="lg:w-64 flex-shrink-0">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2 tracking-[0.2em]">Stages</h3>
              <nav className="space-y-1">
                {STAGES.map((stage) => (
                  <button
                    key={stage.id}
                    onClick={() => setActiveStage(stage.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                      activeStage === stage.id ? 'bg-blue-600 text-white shadow-md font-bold' : 'text-slate-600 hover:bg-white border border-transparent hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 text-sm">
                      <stage.icon size={18} />
                      {stage.name}
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeStage === stage.id ? 'bg-white/20' : 'bg-slate-200'}`}>
                      {studiesByStage[stage.id]?.length || 0}
                    </span>
                  </button>
                ))}
              </nav>
            </aside>

            <section className="flex-1 min-w-0">
              <h2 className="text-3xl font-black text-slate-800 mb-8">{STAGES.find(s => s.id === activeStage)?.name}</h2>
              {(studiesByStage[activeStage] || []).length === 0 ? (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-24 text-center text-slate-300 font-bold italic text-lg">
                  No active studies in this stage.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
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
                className={`flex-1 min-w-[280px] flex flex-col rounded-3xl transition-all duration-300 ${dragOverStage === stage.id ? 'bg-blue-50 ring-4 ring-blue-200 ring-inset scale-[1.02]' : 'bg-transparent'}`}
              >
                <div className="flex items-center justify-between mb-4 px-4 py-3 bg-slate-200/50 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-[0.1em] flex items-center gap-2 truncate">
                    <stage.icon size={14} className="text-slate-400" /> {stage.name}
                  </h4>
                  <span className="text-[10px] font-black bg-white px-2.5 py-1 rounded-lg border text-slate-400 shadow-sm">
                    {(studiesByStage[stage.id] || []).length}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 pb-6 scrollbar-hide px-1">
                  {(studiesByStage[stage.id] || []).map(study => (
                    <StudyCard key={study.id} study={study} compact={true} />
                  ))}
                  <button 
                    onClick={() => handleOpenModal(null, stage.id)}
                    className="w-full py-5 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:text-blue-500 hover:border-blue-200 hover:bg-white transition-all text-xs font-black flex items-center justify-center gap-2 uppercase tracking-widest"
                  >
                    <Plus size={16} strokeWidth={4} /> Add Study
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 border-b flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">{editingStudy ? 'Update Study Record' : 'Register New Study'}</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Compass Discipleship Pathway</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-4 hover:bg-white border border-transparent hover:border-slate-200 rounded-3xl transition-all shadow-sm hover:shadow-md">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-10 space-y-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Study Title</label>
                  <input required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold text-lg focus:ring-4 focus:ring-blue-100 focus:bg-white outline-none transition-all" placeholder="e.g. Gospel of John" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Ministry Area</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold text-sm focus:ring-4 focus:ring-blue-100 outline-none transition-all focus:bg-white appearance-none" value={formData.ministryId} onChange={e => setFormData({...formData, ministryId: e.target.value})}>
                      {Object.values(MINISTRIES).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Current Stage</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold text-sm focus:ring-4 focus:ring-blue-100 outline-none transition-all focus:bg-white appearance-none" value={formData.stage} onChange={e => setFormData({...formData, stage: e.target.value})}>
                      {STAGES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Logistics & Discipleship Notes</label>
                  <textarea rows={4} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-base focus:ring-4 focus:ring-blue-100 outline-none transition-all focus:bg-white" placeholder="Sourcing details, book counts, team assignments..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-4 pt-6 justify-end border-t border-slate-50">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 font-bold text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
                <button type="submit" className="bg-blue-600 px-12 py-4 rounded-[1.5rem] font-black text-base text-white shadow-2xl shadow-blue-200 flex items-center gap-3 hover:bg-blue-700 active:scale-95 transition-all">
                  <Save size={20} strokeWidth={3} /> {editingStudy ? 'Update Tracker' : 'Save Tracker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- MOUNTING LOGIC ---
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}

export default App;