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
  Trash2
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
// Note: These are your production keys for Vercel
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
  { id: 'planning', name: 'Planning', icon: Calendar },
  { id: 'approval', name: 'Approval', icon: ClipboardCheck },
  { id: 'sourcing', name: 'Sourcing', icon: Package },
  { id: 'promotion', name: 'Promotion', icon: Megaphone },
  { id: 'active', name: 'Active', icon: BookOpen },
  { id: 'review', name: 'Review', icon: Users },
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
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudy, setEditingStudy] = useState(null);

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

  const handleOpenModal = (study = null) => {
    if (study) {
      setEditingStudy(study);
      setFormData({ ...study });
    } else {
      setEditingStudy(null);
      setFormData({
        title: '', ministryId: 'mens', stage: activeStage, notes: '', updates: '',
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

  const StudyCard = ({ study, isDetailed = false }) => {
    const ministry = MINISTRIES[study.ministryId.toUpperCase()] || MINISTRIES.MENS;
    return (
      <div className={`group bg-white border rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden mb-3 ${isDetailed ? 'p-5' : 'p-3'}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${ministry.color}`}>
                {ministry.name}
              </span>
            </div>
            <h3 className={`font-bold text-slate-800 leading-tight truncate ${isDetailed ? 'text-base' : 'text-[13px]'}`}>
              {study.title}
            </h3>
          </div>
          <button onClick={() => handleOpenModal(study)} className="p-1 text-slate-300 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical size={isDetailed ? 18 : 14} />
          </button>
        </div>
        {isDetailed && study.notes && (
          <p className="mt-2 text-xs text-slate-500 line-clamp-2 italic">{study.notes}</p>
        )}
        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-medium">
          <span className="flex items-center gap-1"><MapPin size={10} /> {study.location}</span>
          {isDetailed && <span>{study.startDate}</span>}
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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white border-b px-6 py-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg"><BookOpen className="text-white" size={20} /></div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">Compass Study Tracker</h1>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Ministry Pipeline</p>
            </div>
          </div>
          <button onClick={() => handleOpenModal()} className="bg-slate-900 text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
            <Plus size={18} strokeWidth={3} /> New Study
          </button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar / Focus View */}
          <aside className="lg:w-60 flex-shrink-0">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2">Workflow</h3>
            <nav className="space-y-1">
              {STAGES.map((stage) => (
                <button
                  key={stage.id}
                  onClick={() => setActiveStage(stage.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all ${
                    activeStage === stage.id ? 'bg-blue-600 text-white shadow-md font-bold' : 'text-slate-600 hover:bg-white'
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

          {/* Expanded Pipeline View */}
          <div className="flex-1 min-w-0">
            <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
              {STAGES.map(stage => (
                <div key={stage.id} className="w-64 flex-shrink-0">
                  <div className="flex items-center justify-between mb-4 px-2">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <stage.icon size={12} /> {stage.name}
                    </h4>
                    <span className="text-[10px] font-bold text-slate-300">{(studiesByStage[stage.id] || []).length}</span>
                  </div>
                  <div className="bg-slate-100/50 p-2 rounded-2xl min-h-[500px] border border-slate-200/50">
                    {(studiesByStage[stage.id] || []).map(study => (
                      <StudyCard key={study.id} study={study} isDetailed={stage.id === activeStage} />
                    ))}
                    <button 
                      onClick={() => handleOpenModal(null)}
                      className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:text-blue-500 hover:border-blue-200 hover:bg-white transition-all text-[11px] font-bold flex items-center justify-center gap-1"
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex items-center justify-between bg-slate-50">
              <h2 className="text-xl font-black text-slate-800">{editingStudy ? 'Update Study' : 'New Entry'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-xl"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-5">
              <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold" placeholder="Study Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              <div className="grid grid-