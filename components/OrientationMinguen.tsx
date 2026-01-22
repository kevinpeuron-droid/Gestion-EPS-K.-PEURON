import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ActivityResult, Student } from '../types';
import { 
  Compass, Users, Settings, Play, Check, X, 
  AlertTriangle, Timer, Download, Trash2, 
  Trophy, Search, Flag, UserPlus, Save, Clock
} from 'lucide-react';

interface Props {
  activityName: string;
  onSaveResult?: (payload: Omit<ActivityResult, 'id' | 'date'>) => void;
  students?: Student[]; // Injecté par le Kernel
}

// --- TYPES INTERNES ---

type Level = 'N1' | 'N2' | 'N3';

interface BaliseDefinition {
  id: string;
  number: string;
  level: Level;
}

interface BaliseRunState {
  status: 'IDLE' | 'SEARCHING' | 'VALIDATED' | 'ERROR';
  startTime: number | null; // Timestamp absolu
  duration: number | null;  // Durée figée en secondes
  errors: number;
}

interface StudentRun {
  studentId: string;
  groupId: string | null;
  balises: Record<string, BaliseRunState>; // Key: Balise ID (index)
}

// --- CONSTANTES & CONFIG PAR DÉFAUT ---

const DEFAULT_CONFIG: BaliseDefinition[] = [
  { id: '0', number: '31', level: 'N1' },
  { id: '1', number: '32', level: 'N1' },
  { id: '2', number: '33', level: 'N1' },
  { id: '3', number: '34', level: 'N1' },
  { id: '4', number: '35', level: 'N1' },
  { id: '5', number: '41', level: 'N2' },
  { id: '6', number: '42', level: 'N2' },
  { id: '7', number: '43', level: 'N2' },
  { id: '8', number: '51', level: 'N3' },
  { id: '9', number: '52', level: 'N3' },
];

const LEVEL_COLORS = {
  'N1': { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', badge: 'bg-emerald-500' },
  'N2': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', badge: 'bg-blue-500' },
  'N3': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200', badge: 'bg-purple-500' },
};

// --- COMPOSANT PRINCIPAL ---

export const OrientationMinguen: React.FC<Props> = ({ activityName, onSaveResult, students = [] }) => {
  
  // --- STATE ---
  
  // Configuration des balises
  const [config, setConfig] = useState<BaliseDefinition[]>(() => {
    const saved = localStorage.getItem('minguen_config');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  // Données de course (State principal)
  const [runs, setRuns] = useState<Record<string, StudentRun>>({});
  
  // Affectation des groupes (Cache local pour l'UI)
  const [groups, setGroups] = useState<Record<string, string>>({});

  // UI States
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'RUN' | 'ADMIN' | 'GROUPS'>('RUN');
  const [globalTicker, setGlobalTicker] = useState(Date.now());

  // --- INITIALISATION ---

  // Synchronisation des élèves entrants avec le state local
  useEffect(() => {
    setRuns(prev => {
      const next = { ...prev };
      let changed = false;
      students.forEach(s => {
        if (!next[s.id]) {
          // Initier la structure vide pour ce nouvel élève
          const initialBalises: Record<string, BaliseRunState> = {};
          config.forEach(b => {
            initialBalises[b.id] = { status: 'IDLE', startTime: null, duration: null, errors: 0 };
          });
          
          next[s.id] = {
            studentId: s.id,
            groupId: null, // Par défaut pas de groupe
            balises: initialBalises
          };
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [students, config]);

  // Global Timer Tick (pour mettre à jour les chronos visuels chaque seconde)
  useEffect(() => {
    const interval = setInterval(() => setGlobalTicker(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Persistance Config
  useEffect(() => {
    localStorage.setItem('minguen_config', JSON.stringify(config));
  }, [config]);


  // --- LOGIQUE MÉTIER (FIDÉLITÉ SOURCE) ---

  // Récupérer les membres du groupe d'un élève
  const getGroupMembers = (studentId: string): string[] => {
    const userGroupId = groups[studentId];
    if (!userGroupId) return [studentId];
    return students.filter(s => groups[s.id] === userGroupId).map(s => s.id);
  };

  // Calcul du temps limite avant pénalité (Logique Minguen)
  const getTimeLimitSeconds = (activeCount: number): number => {
    if (activeCount <= 1) return 360; // 6 min
    if (activeCount === 2) return 480; // 8 min
    return 600; // 10 min
  };

  // Formatage mm:ss
  const formatDuration = (seconds: number) => {
    const m = Math.floor(Math.abs(seconds) / 60);
    const s = Math.abs(seconds) % 60;
    const sign = seconds < 0 ? '-' : '';
    return `${sign}${m}:${s.toString().padStart(2, '0')}`;
  };

  // --- ACTIONS ---

  // Démarrer / Arrêter la recherche (Toggle)
  const toggleSearch = (baliseId: string) => {
    if (!selectedStudentId) return;

    const members = getGroupMembers(selectedStudentId);
    
    setRuns(prev => {
      const next = { ...prev };
      const now = Date.now();

      members.forEach(memberId => {
        if (!next[memberId]) return;
        
        const currentBaliseState = next[memberId].balises[baliseId];
        
        // Si déjà en cours -> Annuler (Reset partiel)
        if (currentBaliseState.status === 'SEARCHING') {
          next[memberId] = {
            ...next[memberId],
            balises: {
              ...next[memberId].balises,
              [baliseId]: { ...currentBaliseState, status: 'IDLE', startTime: null }
            }
          };
        } 
        // Sinon -> Démarrer
        else if (currentBaliseState.status === 'IDLE' || currentBaliseState.status === 'ERROR') {
          next[memberId] = {
            ...next[memberId],
            balises: {
              ...next[memberId].balises,
              [baliseId]: { ...currentBaliseState, status: 'SEARCHING', startTime: now }
            }
          };
        }
      });
      return next;
    });
  };

  // Valider une balise (Vrai ou Faux)
  const validateBalise = (baliseId: string, isSuccess: boolean) => {
    if (!selectedStudentId) return;
    const members = getGroupMembers(selectedStudentId);
    const now = Date.now();

    setRuns(prev => {
      const next = { ...prev };
      
      members.forEach(memberId => {
        if (!next[memberId]) return;
        const current = next[memberId].balises[baliseId];
        
        let newDuration = current.duration;
        
        // Calcul du temps si on était en recherche
        if (current.startTime) {
           newDuration = Math.round((now - current.startTime) / 1000);
        }

        if (isSuccess) {
           // SUCCÈS : On fige le temps et le statut
           next[memberId] = {
             ...next[memberId],
             balises: {
               ...next[memberId].balises,
               [baliseId]: {
                 ...current,
                 status: 'VALIDATED',
                 startTime: null, // Stop chrono
                 duration: newDuration
               }
             }
           };
           // Envoi au Kernel
           sendResultToKernel(memberId, next[memberId]);

        } else {
           // ÉCHEC : On incrémente les erreurs, on garde le temps précédent (ou null) et on reset le status
           next[memberId] = {
             ...next[memberId],
             balises: {
               ...next[memberId].balises,
               [baliseId]: {
                 ...current,
                 status: 'ERROR',
                 errors: current.errors + 1,
                 startTime: null, // Le chrono s'arrête-t-il sur une erreur ? Dans la source oui.
                 duration: current.duration // On garde l'ancien temps validé s'il y en avait un, sinon null
               }
             }
           };
        }
      });
      return next;
    });
  };

  // Envoyer les données au Kernel
  const sendResultToKernel = (studentId: string, run: StudentRun) => {
    if (!onSaveResult) return;
    
    const studentDef = students.find(s => s.id === studentId);
    if (!studentDef) return;

    // Calculs Statistiques
    let totalBalises = 0;
    let foundBalises = 0;
    let totalErrors = 0;
    let totalTime = 0;
    let score = 0;

    Object.values(run.balises).forEach((b, idx) => {
      const def = config[idx]; // Attention index
      if (!def) return;
      
      if (b.status === 'VALIDATED') {
        foundBalises++;
        totalTime += (b.duration || 0);
        // Pondération simple pour le score : N1=1, N2=2, N3=3
        score += (def.level === 'N1' ? 1 : def.level === 'N2' ? 2 : 3);
      }
      totalErrors += b.errors;
      totalBalises++;
    });

    onSaveResult({
      studentId: studentId,
      studentName: `${studentDef.firstName} ${studentDef.lastName}`,
      activityId: activityName,
      engineId: 'MINGUEN',
      data: {
        found: foundBalises,
        total: config.length,
        errors: totalErrors,
        totalTimeSeconds: totalTime,
        scoreFinal: score,
        group: groups[studentId] || 'Indiv.'
      }
    });
  };

  // Gestion des Groupes
  const handleGroupChange = (studentId: string, val: string) => {
    setGroups(prev => {
      const next = { ...prev };
      if (val.trim() === '') delete next[studentId];
      else next[studentId] = val.trim();
      return next;
    });
    // Update local run state
    setRuns(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], groupId: val.trim() || null }
    }));
  };

  // Export CSV de secours
  const exportCSV = () => {
    let csv = "Nom,Prénom,Groupe,N1 Réussies,N2 Réussies,N3 Réussies,Total Erreurs,Temps Total (s)\n";
    
    students.forEach(s => {
      const run = runs[s.id];
      if (!run) return;

      let n1 = 0, n2 = 0, n3 = 0, err = 0, time = 0;
      
      Object.entries(run.balises).forEach(([bId, val]) => {
         const bState = val as BaliseRunState;
         const def = config.find(c => c.id === bId);
         if (!def) return;
         
         if (bState.status === 'VALIDATED') {
            if(def.level === 'N1') n1++;
            if(def.level === 'N2') n2++;
            if(def.level === 'N3') n3++;
            time += (bState.duration || 0);
         }
         err += bState.errors;
      });

      csv += `"${s.lastName}","${s.firstName}","${groups[s.id] || ''}",${n1},${n2},${n3},${err},${time}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `minguen_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- RENDERERS ---

  const renderConfigPanel = () => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-enter">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Settings className="text-slate-400"/> Configuration des Balises
        </h3>
        <button onClick={() => setViewMode('RUN')} className="text-sm text-indigo-600 font-bold hover:underline">
          Retour au suivi
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {config.map((b, idx) => (
          <div key={b.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
             <div className="text-xs font-bold text-slate-400 mb-2 uppercase">Balise {idx + 1}</div>
             <input 
               value={b.number}
               onChange={(e) => {
                 const newConfig = [...config];
                 newConfig[idx].number = e.target.value;
                 setConfig(newConfig);
               }}
               className="w-full mb-2 p-2 border rounded font-bold text-center text-lg"
               placeholder="Num"
             />
             <select
                value={b.level}
                onChange={(e) => {
                  const newConfig = [...config];
                  newConfig[idx].level = e.target.value as Level;
                  setConfig(newConfig);
                }}
                className="w-full p-2 border rounded text-sm bg-white"
             >
                <option value="N1">Niveau 1</option>
                <option value="N2">Niveau 2</option>
                <option value="N3">Niveau 3</option>
             </select>
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-end">
         <button 
           onClick={() => {
             const newId = config.length.toString();
             setConfig([...config, { id: newId, number: '', level: 'N1' }]);
             // Update runs structure for all students
             setRuns(prev => {
                const next = { ...prev };
                Object.keys(next).forEach(sId => {
                   next[sId].balises[newId] = { status: 'IDLE', startTime: null, duration: null, errors: 0 };
                });
                return next;
             });
           }}
           className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg font-bold text-slate-700 flex items-center gap-2"
         >
            <UserPlus size={18}/> Ajouter Balise
         </button>
      </div>
    </div>
  );

  const renderGroupsPanel = () => (
     <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-enter">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="text-slate-400"/> Gestion des Groupes
          </h3>
          <button onClick={() => setViewMode('RUN')} className="text-sm text-indigo-600 font-bold hover:underline">
            Retour au suivi
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {students.map(s => (
             <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="font-medium text-slate-700">{s.lastName} {s.firstName}</div>
                <input 
                  type="text" 
                  placeholder="Groupe..."
                  value={groups[s.id] || ''}
                  onChange={(e) => handleGroupChange(s.id, e.target.value)}
                  className="w-24 p-2 text-sm border border-slate-300 rounded focus:border-indigo-500 outline-none text-center font-bold"
                />
             </div>
           ))}
        </div>
     </div>
  );

  // --- RENDER MAIN VIEW ---

  // Calculer les données pour l'élève sélectionné (ou son groupe)
  const currentRunData = useMemo(() => {
    if (!selectedStudentId || !runs[selectedStudentId]) return null;
    
    // On prend les données brutes de l'élève (la logique de groupe applique déjà les modifs à tous les membres)
    const rawData = runs[selectedStudentId].balises;

    // Compter les balises actives pour le groupe
    let activeCount = 0;
    Object.values(rawData).forEach((b) => {
      if ((b as BaliseRunState).status === 'SEARCHING') activeCount++;
    });

    return { rawData, activeCount };
  }, [selectedStudentId, runs]);

  return (
    <div className="h-full flex flex-col relative bg-slate-50/50">
       
       {/* HEADER */}
       <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                <Compass size={24} />
             </div>
             <div>
                <h1 className="text-xl font-black text-slate-800 leading-none">MINGUEN ORIENTATION</h1>
                <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide">
                   {activityName} • Mode Connecté
                </div>
             </div>
          </div>

          <div className="flex items-center gap-2">
             <button 
               onClick={() => setViewMode(viewMode === 'GROUPS' ? 'RUN' : 'GROUPS')}
               className={`p-2 rounded-lg border transition ${viewMode === 'GROUPS' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-500'}`}
               title="Gérer Groupes"
             >
                <Users size={20} />
             </button>
             <button 
               onClick={() => setViewMode(viewMode === 'ADMIN' ? 'RUN' : 'ADMIN')}
               className={`p-2 rounded-lg border transition ${viewMode === 'ADMIN' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-500'}`}
               title="Configuration Balises"
             >
                <Settings size={20} />
             </button>
             <div className="w-px h-8 bg-slate-200 mx-2"></div>
             <button 
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg font-bold text-sm hover:bg-slate-700 transition"
             >
                <Download size={16} /> Export CSV
             </button>
          </div>
       </div>

       {/* BODY CONTENT */}
       <div className="flex-1 overflow-hidden p-6">
          
          {viewMode === 'ADMIN' && renderConfigPanel()}
          
          {viewMode === 'GROUPS' && renderGroupsPanel()}

          {viewMode === 'RUN' && (
             <div className="flex h-full gap-6">
                
                {/* LEFT SIDEBAR : LISTE ÉLÈVES */}
                <div className="w-80 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                   <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-slate-500 text-xs uppercase tracking-widest">
                      Élèves / Groupes
                   </div>
                   <div className="flex-1 overflow-y-auto p-2 space-y-2">
                      {students.map(student => {
                         const grp = groups[student.id];
                         const isSelected = selectedStudentId === student.id;
                         
                         // Check active status
                         const run = runs[student.id];
                         const isRunning = run && Object.values(run.balises).some((b) => (b as BaliseRunState).status === 'SEARCHING');
                         const successCount = run ? Object.values(run.balises).filter((b) => (b as BaliseRunState).status === 'VALIDATED').length : 0;

                         return (
                            <button
                               key={student.id}
                               onClick={() => setSelectedStudentId(student.id)}
                               className={`w-full text-left p-3 rounded-xl border transition-all duration-200 relative overflow-hidden ${
                                  isSelected 
                                    ? 'bg-indigo-50 border-indigo-500 shadow-md z-10' 
                                    : 'bg-white border-slate-100 hover:border-slate-300'
                               }`}
                            >
                               <div className="flex justify-between items-start mb-1">
                                  <span className={`font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                                     {student.firstName} <span className="uppercase">{student.lastName}</span>
                                  </span>
                                  {grp && (
                                     <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded">
                                        GR {grp}
                                     </span>
                                  )}
                               </div>
                               
                               <div className="flex items-center gap-3 mt-2">
                                  {isRunning && (
                                     <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full animate-pulse">
                                        <Timer size={10} /> En course
                                     </div>
                                  )}
                                  {successCount > 0 && (
                                     <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                        <Trophy size={10} /> {successCount}
                                     </div>
                                  )}
                               </div>
                            </button>
                         );
                      })}
                   </div>
                </div>

                {/* RIGHT PANEL : TRACKING */}
                <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
                   
                   {!selectedStudentId ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                         <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
                            <Search size={48} className="opacity-50"/>
                         </div>
                         <h3 className="text-xl font-bold text-slate-700 mb-2">Sélectionnez un élève</h3>
                         <p>Cliquez sur un nom à gauche pour afficher son parcours.</p>
                      </div>
                   ) : (
                      <div className="flex-1 flex flex-col overflow-hidden">
                         
                         {/* STUDENT HEADER */}
                         <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                            <div>
                               <h2 className="text-2xl font-black text-slate-800">
                                  {students.find(s => s.id === selectedStudentId)?.firstName} {students.find(s => s.id === selectedStudentId)?.lastName}
                               </h2>
                               {groups[selectedStudentId] && (
                                  <div className="flex items-center gap-2 mt-1">
                                     <span className="px-2 py-0.5 bg-indigo-600 text-white text-xs font-bold rounded">
                                        Groupe {groups[selectedStudentId]}
                                     </span>
                                     <span className="text-xs text-slate-500">
                                        • {getGroupMembers(selectedStudentId).length} élèves synchronisés
                                     </span>
                                  </div>
                               )}
                            </div>
                            
                            {/* Global Active Timer for Student */}
                            {currentRunData?.activeCount ? (
                               <div className="px-4 py-2 bg-amber-100 border border-amber-200 rounded-xl flex items-center gap-3 animate-pulse">
                                  <Clock className="text-amber-600" />
                                  <div>
                                     <div className="text-xs font-bold text-amber-600 uppercase">Courses en cours</div>
                                     <div className="text-lg font-black text-amber-800 leading-none">{currentRunData.activeCount}</div>
                                  </div>
                               </div>
                            ) : null}
                         </div>

                         {/* BALISES GRID */}
                         <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            
                            {['N1', 'N2', 'N3'].map(level => {
                               const levelConfig = config.filter(b => b.level === level);
                               if (levelConfig.length === 0) return null;
                               
                               const styles = LEVEL_COLORS[level as Level];

                               return (
                                  <div key={level} className={`rounded-2xl border ${styles.border} overflow-hidden`}>
                                     <div className={`px-4 py-2 ${styles.bg} border-b ${styles.border} flex items-center gap-2`}>
                                        <Flag size={16} className={styles.text} />
                                        <span className={`font-black ${styles.text}`}>Niveau {level}</span>
                                     </div>
                                     
                                     <div className="p-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 bg-white/50">
                                        {levelConfig.map(balise => {
                                           const state = currentRunData?.rawData[balise.id];
                                           if (!state) return null;

                                           const isSearching = state.status === 'SEARCHING';
                                           const isValidated = state.status === 'VALIDATED';
                                           const isError = state.status === 'ERROR';
                                           
                                           // Calcul Temps Réel
                                           let displayTime = '--:--';
                                           let isPenalty = false;
                                           let remainingTime = 0;

                                           if (isSearching && state.startTime) {
                                              const elapsed = Math.round((globalTicker - state.startTime) / 1000);
                                              const limit = getTimeLimitSeconds(currentRunData?.activeCount || 1);
                                              remainingTime = limit - elapsed;
                                              isPenalty = remainingTime < 0;
                                              displayTime = formatDuration(elapsed);
                                           } else if (state.duration) {
                                              displayTime = formatDuration(state.duration);
                                           }

                                           return (
                                              <div 
                                                key={balise.id} 
                                                className={`
                                                   relative flex flex-col bg-white rounded-xl shadow-sm border-2 transition-all
                                                   ${isSearching 
                                                      ? (isPenalty ? 'border-red-500 ring-2 ring-red-200' : 'border-amber-400 ring-2 ring-amber-100') 
                                                      : isValidated 
                                                         ? 'border-emerald-500 opacity-90'
                                                         : isError 
                                                            ? 'border-red-200'
                                                            : 'border-slate-100 hover:border-indigo-200'
                                                   }
                                                `}
                                              >
                                                 {/* HEADER CARD */}
                                                 <div className="p-3 border-b border-slate-50 flex justify-between items-start">
                                                    <span className="text-xl font-black text-slate-700">{balise.number}</span>
                                                    {state.errors > 0 && (
                                                       <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                                                          {state.errors} err.
                                                       </span>
                                                    )}
                                                 </div>

                                                 {/* BODY CARD */}
                                                 <div className="flex-1 p-3 flex flex-col items-center justify-center min-h-[80px]">
                                                    {isSearching ? (
                                                       <div className="text-center">
                                                          <div className={`text-2xl font-mono font-bold ${isPenalty ? 'text-red-600 animate-pulse' : 'text-amber-600'}`}>
                                                             {displayTime}
                                                          </div>
                                                          {isPenalty && (
                                                             <div className="text-[10px] font-bold text-red-500 uppercase mt-1">Pénalité !</div>
                                                          )}
                                                       </div>
                                                    ) : isValidated ? (
                                                       <div className="text-emerald-600 font-bold flex flex-col items-center">
                                                          <Check size={24} strokeWidth={3} />
                                                          <span className="text-xs font-mono mt-1">{displayTime}</span>
                                                       </div>
                                                    ) : isError ? (
                                                       <div className="text-red-400 font-bold flex flex-col items-center opacity-50">
                                                          <X size={24} />
                                                          <span className="text-xs mt-1">Erreur</span>
                                                       </div>
                                                    ) : (
                                                       <div className="text-slate-300">
                                                          <Compass size={32} />
                                                       </div>
                                                    )}
                                                 </div>

                                                 {/* FOOTER ACTIONS */}
                                                 <div className="p-2 bg-slate-50 flex gap-2">
                                                    {isSearching ? (
                                                       <>
                                                          <button 
                                                            onClick={() => validateBalise(balise.id, true)}
                                                            className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg flex items-center justify-center transition"
                                                            title="Valider"
                                                          >
                                                             <Check size={18} />
                                                          </button>
                                                          <button 
                                                            onClick={() => validateBalise(balise.id, false)}
                                                            className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center transition"
                                                            title="Erreur / Abandon"
                                                          >
                                                             <X size={18} />
                                                          </button>
                                                       </>
                                                    ) : (
                                                       <button 
                                                         onClick={() => toggleSearch(balise.id)}
                                                         className={`w-full py-2 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition ${isValidated ? 'bg-slate-200 text-slate-500' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
                                                       >
                                                          {isValidated ? 'Refaire' : (isError ? 'Réessayer' : 'Départ')}
                                                       </button>
                                                    )}
                                                 </div>
                                              </div>
                                           );
                                        })}
                                     </div>
                                  </div>
                               );
                            })}
                         </div>
                      </div>
                   )}
                </div>
             </div>
          )}
       </div>
    </div>
  );
};