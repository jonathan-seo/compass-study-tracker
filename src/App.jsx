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
  const [viewMode, setViewMode] = useState('pipeline'); // 'detail' or 'pipeline'
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
            <h3 className={`font-bold text-slate-800 leading-tight truncate ${!compact ? 'text-base' : 'text-[12px]'}`}>
              {study.title}
            </h3>
          </div>
          <button onClick={() => handleOpenModal(study)} className="p-1 text-slate-300 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical size={!compact ? 18 : 14} />
          </button>
        </div>
        {!compact && study.notes && (
          <p className="mt-2 text-xs text-slate-500 line-clamp-2 italic whitespace-pre-wrap">{study.notes}</p>
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
        <div className="max-w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg"><BookOpen className="text-white" size={20} /></div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">Study Tracker</h1>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Compass Discipleship</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button 
              onClick={() => setViewMode('detail')} 
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'detail' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <LayoutGrid size={14} /> Detail
            </button>
            <button 
              onClick={() => setViewMode('pipeline')} 
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'pipeline' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Columns size={14} /> Pipeline
            </button>
          </div>

          <button onClick={() => handleOpenModal()} className="bg-slate-900 text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-800 active:scale-95 transition-all shadow-lg shadow-slate-200">
            <Plus size={18} strokeWidth={3} /> New Study
          </button>
        </div>
      </header>

      <main className="max-w-full mx-auto p-8">
        {viewMode === 'detail' ? (
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="lg:w-60 flex-shrink-0">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2 tracking-[0.2em]">Stages</h3>
              <nav className="space-y-1">
                {STAGES.map((stage) => (
                  <button
                    key={stage.id}
                    onClick={() => setActiveStage(stage.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all ${
                      activeStage === stage.id ? 'bg-blue-600 text-white shadow-md font-bold' : 'text-slate-600 hover:bg-white border border-transparent hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 text-sm">
                      <stage.icon size={16} />
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
              <h2 className="text-2xl font-black text-slate-800 mb-6">{STAGES.find(s => s.id === activeStage)?.name}</h2>
              {(studiesByStage[activeStage] || []).length === 0 ? (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center text-slate-400 font-medium italic">
                  No active studies in this stage.
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                  {(studiesByStage[activeStage] || []).map(study => (
                    <StudyCard key={study.id} study={study} />
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide h-[calc(100vh-140px)]">
            {STAGES.map(stage => (
              <div 
                key={stage.id} 
                onDragOver={(e) => onDragOver(e, stage.id)}
                onDragLeave={() => setDragOverStage(null)}
                onDrop={(e) => onDrop(e, stage.id)}
                className={`w-56 flex-shrink-0 flex flex-col rounded-2xl transition-all duration-200 ${dragOverStage === stage.id ? 'bg-blue-50 ring-2 ring-blue-300 ring-inset scale-[1.01]' : 'bg-transparent'}`}
              >
                <div className="flex items-center justify-between mb-4 px-2 py-1.5 bg-slate-200/50 rounded-xl border border-slate-200">
                  <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5 truncate">
                    <stage.icon size={12} /> {stage.name}
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400">{(studiesByStage[stage.id] || []).length}</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 pb-4">
                  {(studiesByStage[stage.id] || []).map(study => (
                    <StudyCard key={study.id} study={study} compact={true} />
                  ))}
                  <button 
                    onClick={() => handleOpenModal(null, stage.id)}
                    className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:text-blue-500 hover:border-blue-200 hover:bg-white transition-all text-[11px] font-bold flex items-center justify-center gap-1"
                  >
                    <Plus size={14} strokeWidth={3} /> Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">{editingStudy ? 'Update Study' : 'Register New Study'}</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Discipleship Pathway</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white border border-transparent hover:border-slate-200 rounded-2xl transition-all">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Title</label>
                  <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all" placeholder="Study Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Ministry Area</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:bg-white" value={formData.ministryId} onChange={e => setFormData({...formData, ministryId: e.target.value})}>
                      {Object.values(MINISTRIES).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Current Stage</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:bg-white" value={formData.stage} onChange={e => setFormData({...formData, stage: e.target.value})}>
                      {STAGES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Logistics & Notes</label>
                  <textarea rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:bg-white" placeholder="Sourcing details, book counts..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-3 pt-4 justify-end border-t border-slate-50">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-bold text-slate-400 hover:text-slate-600">Cancel</button>
                <button type="submit" className="bg-blue-600 px-10 py-3 rounded-2xl font-black text-sm text-white shadow-xl shadow-blue-100 flex items-center gap-2 hover:bg-blue-700 active:scale-95 transition-all">
                  <Save size={18} strokeWidth={3} /> {editingStudy ? 'Update Record' : 'Save Record'}
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