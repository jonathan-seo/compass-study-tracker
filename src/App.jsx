import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  BookOpen, Calendar, Users, Megaphone, ClipboardCheck, Package, 
  MoreVertical, Plus, Info, Clock, MapPin, X, Save, Loader2, Trash2,
  LayoutGrid, Columns, GripVertical
} from 'lucide-react';

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, onSnapshot, query, addDoc, updateDoc, deleteDoc 
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';

// --- COMPASS FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyBJm5JVgTwMCYhByStI7r3zJkHre0yxRjo",
  authDomain: "compass-study-tracker.firebaseapp.com",
  projectId: "compass-study-tracker",
  storageBucket: "compass-study-tracker.firebasestorage.app",
  messagingSenderId: "354022817100",
  appId: "1:354022817100:web:5c9cd1ac7a4605de9a23e9"
};

const STAGES = [
  { id: 'planning', name: '1. Team Planning', icon: Calendar },
  { id: 'approval', name: '2. Review & Approval', icon: ClipboardCheck },
  { id: 'sourcing', name: '3. Sourcing & Creation', icon: Package },
  { id: 'promotion', name: '4. Promotion', icon: Megaphone },
  { id: 'active', name: '5. Active Study', icon: BookOpen },
  { id: 'review', name: '6. Post-Study Review', icon: Users },
];

const MINISTRIES = {
  MENS: { id: 'mens', name: "Men's Ministry", color: 'bg-blue-100 text-blue-800 border-blue-200', dot: 'bg-blue-500' },
  WOMENS_MON: { id: 'womens_mon', name: "Women's (Mon Eve)", color: 'bg-purple-100 text-purple-800 border-purple-200', dot: 'bg-purple-500' },
  WOMENS_THU: { id: 'womens_thu', name: "Women's (Thu AM)", color: 'bg-pink-100 text-pink-800 border-pink-200', dot: 'bg-pink-500' },
  WOMENS_SHEL: { id: 'womens_shel', name: "Women's (Shelburne)", color: 'bg-rose-100 text-rose-800 border-rose-200', dot: 'bg-rose-500' },
  WOMENS_GV: { id: 'womens_gv', name: "Women's (Grand Valley)", color: 'bg-orange-100 text-orange-800 border-orange-200', dot: 'bg-orange-500' },
  SENIORS: { id: 'seniors', name: "Compass Seniors (Wed AM)", color: 'bg-emerald-100 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' },
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
    title: '', ministryId: 'mens', stage: 'planning', notes: '', updates: '',
    location: 'Orangeville', startDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    signInAnonymously(auth).catch(err => console.error("Auth failed:", err));
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    const studiesRef = collection(db, 'ministry_studies');
    const q = query(studiesRef);
    return onSnapshot(q, (snapshot) => {
      setStudies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });
  }, [user]);

  const studiesByStage = useMemo(() => {
    return STAGES.reduce((acc, stage) => {
      acc[stage.id] = studies.filter(s => s.stage === stage.id);
      return acc;
    }, {});
  }, [studies]);

  const onDragStart = (e, studyId) => {
    setDraggedId(studyId);
    e.dataTransfer.setData("studyId", studyId);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e, stageId) => {
    e.preventDefault();
    if (dragOverStage !== stageId) setDragOverStage(stageId);
  };

  const onDragLeave = () => setDragOverStage(null);

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

  const handleSave = async (e) => {
    e.preventDefault();
    const studiesRef = collection(db, 'ministry_studies');
    try {
      if (editingStudy) {
        await updateDoc(doc(db, 'ministry_studies', editingStudy.id), formData);
      } else {
        await addDoc(studiesRef, { ...formData, createdAt: new Date().toISOString() });
      }
      setIsModalOpen(false);
    } catch (err) { console.error("Save error:", err); }
  };

  const handleDelete = async (id) => {
    if (!user || !window.confirm("Delete this study record?")) return;
    try {
      await deleteDoc(doc(db, 'ministry_studies', id));
      setIsModalOpen(false);
    } catch (err) { console.error("Delete error:", err); }
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

  const StudyCard = ({ study, compact = false }) => {
    const ministry = MINISTRIES[study.ministryId.toUpperCase()] || MINISTRIES.MENS;
    const isDragging = draggedId === study.id;
    return (
      <div 
        draggable 
        onDragStart={(e) => onDragStart(e, study.id)}
        className={`group bg-white border rounded-xl shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${compact ? 'p-3' : 'p-5'} ${isDragging ? 'opacity-40 scale-95' : 'opacity-100'}`}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-1.5">
            {compact && <GripVertical size={12} className="text-slate-300" />}
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${ministry.color}`}>{ministry.name}</span>
          </div>
          <button onClick={() => handleOpenModal(study)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 transition-opacity"><MoreVertical size={16}/></button>
        </div>
        <h3 className={`font-bold text-slate-800 leading-snug mb-2 ${compact ? 'text-xs' : 'text-sm'}`}>{study.title}</h3>
        {!compact && study.notes && <div className="bg-slate-50 p-3 rounded-xl border text-xs text-slate-600 mb-3 italic whitespace-pre-wrap">{study.notes}</div>}
        <div className="flex items-center justify-between border-t border-slate-50 pt-2 text-[10px] text-slate-400 font-medium">
          <div className="flex items-center gap-1"><MapPin size={10}/> {study.location}</div>
          {study.updates && !compact && <div className="text-blue-500 font-bold flex items-center gap-1"><Clock size={10}/> {study.updates}</div>}
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <span className="font-bold text-xs uppercase tracking-widest text-slate-500 tracking-tighter">Compass Study Tracker</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100">
      <header className="bg-white border-b px-8 py-4 sticky top-0 z-30 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white shadow-lg shadow-blue-100"><BookOpen size={20}/></div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">Study Tracker</h1>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Compass Discipleship</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button onClick={() => setViewMode('detail')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'detail' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><LayoutGrid size={14} /> Detail</button>
          <button onClick={() => setViewMode('pipeline')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'pipeline' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Columns size={14} /> Pipeline</button>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-slate-900 text-white px-5 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-800 active:scale-95 transition-all shadow-lg shadow-slate-200"><Plus size={18} strokeWidth={3}/> New Study</button>
      </header>

      <main className="max-w-[1600px] mx-auto p-6">
        {viewMode === 'detail' ? (
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="lg:w-64 space-y-8">
              <nav className="space-y-1">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-2">Stages</h3>
                {STAGES.map(s => (
                  <button key={s.id} onClick={() => setActiveStage(s.id)} className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${activeStage === s.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-white border border-transparent hover:border-slate-200'}`}>
                    <div className="flex items-center gap-3"><s.icon size={18} /> <span className="text-sm font-bold">{s.name}</span></div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeStage === s.id ? 'bg-white/20' : 'bg-slate-200 text-slate-500'}`}>{studiesByStage[s.id]?.length || 0}</span>
                  </button>
                ))}
              </nav>
            </aside>
            <section className="flex-1 min-w-0">
              <h2 className="text-2xl font-black text-slate-800 mb-6">{STAGES.find(s => s.id === activeStage)?.name}</h2>
              {(studiesByStage[activeStage] || []).length === 0 ? (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center text-slate-400 font-medium">No studies in this stage.</div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {(studiesByStage[activeStage] || []).map(study => <StudyCard key={study.id} study={study} />)}
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide h-[calc(100vh-140px)]">
            {STAGES.map(stage => (
              <div 
                key={stage.id} 
                onDragOver={(e) => onDragOver(e, stage.id)} 
                onDragLeave={onDragLeave} 
                onDrop={(e) => onDrop(e, stage.id)}
                className={`w-80 flex-shrink-0 flex flex-col rounded-2xl transition-all duration-200 ${dragOverStage === stage.id ? 'bg-blue-50 ring-2 ring-blue-300 ring-inset scale-[1.01]' : 'bg-transparent'}`}
              >
                <div className="flex items-center justify-between mb-4 bg-slate-200/50 p-3 rounded-xl border border-slate-200">
                  <h3 className="text-[11px] font-black text-slate-600 uppercase tracking-widest">{stage.name}</h3>
                  <span className="text-[10px] font-black bg-white px-2 py-0.5 rounded-lg border text-slate-500">{studiesByStage[stage.id]?.length || 0}</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 pb-4 px-1">
                  {(studiesByStage[stage.id] || []).map(study => <StudyCard key={study.id} study={study} compact={true} />)}
                  <button onClick={() => handleOpenModal(null, stage.id)} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:text-blue-500 hover:bg-white transition-all text-xs font-bold flex items-center justify-center gap-2"><Plus size={16}/> Add Study</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <form onSubmit={handleSave} className="bg-white rounded-[2rem] w-full max-w-xl shadow-2xl overflow-hidden p-8 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-black text-slate-800 text-xl tracking-tight">{editingStudy ? 'Update Details' : 'Register Study'}</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-lg transition-colors"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Title</label>
                <input required className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Ministry Area</label>
                  <select className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-sm" value={formData.ministryId} onChange={e => setFormData({...formData, ministryId: e.target.value})}>
                    {Object.values(MINISTRIES).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Stage</label>
                  <select className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-sm" value={formData.stage} onChange={e => setFormData({...formData, stage: e.target.value})}>
                    {STAGES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Logistics & Notes</label>
                <textarea rows={3} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm" placeholder="Orders, sourcing details..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                {editingStudy ? (
                  <button type="button" onClick={() => handleDelete(editingStudy.id)} className="text-red-500 font-bold text-[10px] uppercase tracking-widest hover:underline">Delete Record</button>
                ) : <div />}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-bold text-slate-400">Cancel</button>
                  <button type="submit" className="bg-blue-600 text-white px-10 py-3 rounded-2xl font-black text-sm shadow-xl shadow-blue-100 flex items-center gap-2 active:scale-95 transition-all"><Save size={18}/> Save</button>
                </div>
              </div>
            </div>
          </form>
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