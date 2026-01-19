import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Student, BaliseDefinition, OrientationResult, OrientationStudentData, BaliseLevel } from '../types';
import { 
  Map, Target, Trophy, AlertTriangle, Timer, Check, X, 
  Search, Users, Settings, RotateCcw, Download, Image as ImageIcon
} from 'lucide-react';
import html2canvas from 'html2canvas'; // Make sure to add this package if not present, or remove logic if cannot add.

interface Props {
  students: Student[];
  onSaveObservation?: (obs: any) => void;
}

const DEFAULT_BALISES: BaliseDefinition[] = [
  { id: 'b1', number: '31', level: 'N1' },
  { id: 'b2', number: '32', level: 'N1' },
  { id: 'b3', number: '33', level: 'N1' },
  { id: 'b4', number: '34', level: 'N1' },
  { id: 'b5', number: '35', level: 'N1' },
  { id: 'b6', number: '41', level: 'N2' },
  { id: 'b7', number: '42', level: 'N2' },
  { id: 'b8', number: '43', level: 'N2' },
  { id: 'b9', number: '51', level: 'N3' },
  { id: 'b10', number: '52', level: 'N3' },
];

export const OrientationMinguen: React.FC<Props> = ({ students, onSaveObservation }) => {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'TRACKING' | 'ADMIN' | 'STATS'>('TRACKING');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  
  // Config Balises
  const [balises, setBalises] = useState<BaliseDefinition[]>(() => {
      const saved = localStorage.getItem('minguen_balises');
      return saved ? JSON.parse(saved) : DEFAULT_BALISES;
  });

  // Données de course (Persistantes)
  const [runData, setRunData] = useState<Record<string, OrientationStudentData>>(() => {
      const saved = localStorage.getItem('minguen_run_data');
      return saved ? JSON.parse(saved) : {};
  });

  // Global Timer for UI updates
  const [now, setNow] = useState(Date.now());

  // --- PERSISTENCE ---
  useEffect(() => {
      localStorage.setItem('minguen_balises', JSON.stringify(balises));
  }, [balises]);

  useEffect(() => {
      localStorage.setItem('minguen_run_data', JSON.stringify(runData));
  }, [runData]);

  useEffect(() => {
      const interval = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(interval);
  }, []);

  // --- HELPERS ---
  const getStudentIdsInGroup = (groupIdOrStudentId: string) => {
      // Si c'est un groupe (ex: "Groupe 1"), on trouve tous les élèves
      // Si c'est un ID élève, on trouve son groupe puis ses pairs
      
      // Cas simple: on utilise le selecteur qui retourne un groupId ou un studentId
      // On va supposer que `selectedGroupId` est soit un nom de groupe "Groupe 1", soit un ID élève.
      
      const groupName = students.find(s => s.id === groupIdOrStudentId)?.group || groupIdOrStudentId;
      const groupStudents = students.filter(s => s.group === groupName);
      
      if (groupStudents.length > 0) return groupStudents.map(s => s.id);
      return [groupIdOrStudentId]; // Fallback single student
  };

  const currentGroupStudents = useMemo(() => {
      if (!selectedGroupId) return [];
      return students.filter(s => s.group === selectedGroupId || s.id === selectedGroupId);
  }, [selectedGroupId, students]);

  const uniqueGroups = useMemo(() => {
      const groups = new Set(students.map(s => s.group).filter(Boolean));
      return Array.from(groups).sort();
  }, [students]);

  // --- LOGIC ---
  const getTimeLimit = (studentIds: string[]) => {
      // Compter combien de balises sont en cours de recherche pour ce groupe
      // On prend le premier élève du groupe comme référence (car données partagées)
      const refId = studentIds[0];
      if (!refId) return 360; // 6 min default

      const studentData = runData[refId] || {};
      const activeCount = Object.values(studentData).filter(r => r.status === 'SEARCHING').length;

      if (activeCount <= 1) return 360; // 6 min
      if (activeCount === 2) return 480; // 8 min
      return 600; // 10 min
  };

  const getBaliseStatus = (baliseId: string) => {
      if (currentGroupStudents.length === 0) return null;
      const refData = runData[currentGroupStudents[0].id];
      return refData ? refData[baliseId] : null;
  };

  const updateGroupBalise = (baliseId: string, patch: Partial<OrientationResult>) => {
      const studentIds = currentGroupStudents.map(s => s.id);
      setRunData(prev => {
          const next = { ...prev };
          studentIds.forEach(id => {
              const currentBaliseData = next[id]?.[baliseId] || { status: null, startTime: null, endTime: null, duration: null, errors: 0 };
              
              // Logic Update
              let updated = { ...currentBaliseData, ...patch };
              
              // Si on passe en SEARCHING
              if (patch.status === 'SEARCHING') {
                  if (!currentBaliseData.startTime) updated.startTime = Date.now();
                  updated.endTime = null;
              }
              // Si on Valide SUCCESS
              else if (patch.status === 'SUCCESS') {
                  updated.endTime = Date.now();
                  if (updated.startTime && !updated.duration) {
                      updated.duration = Math.round((updated.endTime - updated.startTime) / 1000);
                  }
                  updated.startTime = null; // Clean active state
              }
              // Si on signale ERREUR
              else if (patch.errors !== undefined) {
                 // Just increment, keep status
              }

              next[id] = {
                  ...next[id],
                  [baliseId]: updated
              };
          });
          return next;
      });
  };

  const handleToggleSearch = (baliseId: string) => {
      const current = getBaliseStatus(baliseId);
      if (current?.status === 'SEARCHING') {
          // Cancel search ? Or just do nothing? HTML toggles.
          // Let's stop searching (reset start time)
           updateGroupBalise(baliseId, { status: null, startTime: null });
      } else {
          updateGroupBalise(baliseId, { status: 'SEARCHING' });
      }
  };

  const handleValidate = (baliseId: string) => {
      updateGroupBalise(baliseId, { status: 'SUCCESS' });
  };

  const handleError = (baliseId: string) => {
      const current = getBaliseStatus(baliseId);
      const newErrors = (current?.errors || 0) + 1;
      updateGroupBalise(baliseId, { status: 'FAILURE', errors: newErrors });
      // Note: HTML keeps time running on error usually, or fails immediately. 
      // Minguen logic implies we mark error but maybe continue? 
      // "La balise devient rouge en cas de dépassement" -> Penalty logic.
      // "Bouton X" -> Mark error.
  };

  const formatDuration = (seconds: number) => {
      const m = Math.floor(Math.abs(seconds) / 60);
      const s = Math.abs(seconds) % 60;
      const sign = seconds < 0 ? '+' : '';
      return `${sign}${m}m ${s.toString().padStart(2, '0')}s`;
  };

  // --- RENDER HELPERS ---
  const renderBaliseCard = (balise: BaliseDefinition) => {
      const status = getBaliseStatus(balise.id);
      const isSearching = status?.status === 'SEARCHING';
      const isSuccess = status?.status === 'SUCCESS';
      const isFailure = status?.status === 'FAILURE';
      const errors = status?.errors || 0;

      let timerDisplay = null;
      let isPenalty = false;

      if (isSearching && status?.startTime) {
          const elapsed = Math.round((now - status.startTime) / 1000);
          const limit = getTimeLimit(currentGroupStudents.map(s => s.id));
          const remaining = limit - elapsed;
          isPenalty = remaining < 0;

          timerDisplay = (
              <div className={`font-mono font-bold text-lg ${isPenalty ? 'text-red-600 animate-pulse' : 'text-amber-600'}`}>
                  {isPenalty ? '⚠️ PÉNALITÉ' : '⏱️ En cours'}
                  <div className="text-xl">{formatDuration(isPenalty ? remaining : elapsed)}</div>
              </div>
          );
      } else if (status?.duration) {
          timerDisplay = (
              <div className="font-mono font-bold text-emerald-600 text-sm">
                  ⏱️ {formatDuration(status.duration)}
              </div>
          );
      }

      return (
          <div 
            key={balise.id}
            className={`
                relative flex flex-col items-center justify-between p-4 rounded-xl border-2 transition-all shadow-sm min-h-[160px]
                ${isSuccess ? 'bg-emerald-50 border-emerald-500' : 
                  isFailure ? 'bg-red-50 border-red-500' :
                  isSearching ? (isPenalty ? 'bg-red-100 border-red-500 ring-4 ring-red-200' : 'bg-amber-50 border-amber-400 ring-4 ring-amber-100') : 
                  'bg-white border-slate-200 hover:border-indigo-300'}
            `}
          >
              {/* Header */}
              <div className="w-full flex justify-between items-start mb-2">
                   <div className="flex flex-col">
                       <span className="text-2xl font-black text-slate-800">#{balise.number}</span>
                       {errors > 0 && (
                           <span className="text-xs font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                               {errors} erreur{errors > 1 ? 's' : ''}
                           </span>
                       )}
                   </div>
                   {isSearching && (
                       <span className={`text-[10px] font-black uppercase px-2 py-1 rounded text-white ${isPenalty ? 'bg-red-600' : 'bg-amber-500'}`}>
                           {isPenalty ? 'Pénalité' : 'Recherche'}
                       </span>
                   )}
              </div>

              {/* Timer / Status */}
              <div className="mb-4 text-center">
                  {timerDisplay}
              </div>

              {/* Actions */}
              <div className="flex gap-2 w-full mt-auto">
                  <button 
                    onClick={() => handleToggleSearch(balise.id)}
                    className={`flex-1 py-2 rounded-lg flex items-center justify-center transition ${isSearching ? 'bg-amber-200 text-amber-800' : 'bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-700'}`}
                    title={isSearching ? "Annuler" : "Démarrer recherche"}
                  >
                      <Search size={20} />
                  </button>
                  <button 
                    onClick={() => handleValidate(balise.id)}
                    className="flex-1 py-2 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center hover:bg-emerald-200 transition"
                    title="Valider"
                  >
                      <Check size={20} />
                  </button>
                  <button 
                    onClick={() => handleError(balise.id)}
                    className="flex-1 py-2 bg-red-100 text-red-700 rounded-lg flex items-center justify-center hover:bg-red-200 transition"
                    title="Signaler Erreur"
                  >
                      <X size={20} />
                  </button>
              </div>
          </div>
      );
  };

  const renderStats = () => {
    // Aggregated Stats Table
    return (
        <div id="orientation-stats-export" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Trophy className="text-indigo-500" /> Tableau des Résultats
            </h3>
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-xs">
                        <th className="p-3">Groupe / Élève</th>
                        <th className="p-3 text-center">N1 Validées</th>
                        <th className="p-3 text-center">N2 Validées</th>
                        <th className="p-3 text-center">N3 Validées</th>
                        <th className="p-3 text-center">Erreurs Tot.</th>
                        <th className="p-3 text-center">Taux Réussite</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {uniqueGroups.map(group => {
                        const studentsInGroup = students.filter(s => s.group === group);
                        if (studentsInGroup.length === 0) return null;
                        const refId = studentsInGroup[0].id;
                        const data = runData[refId] || {};
                        
                        let n1 = 0, n2 = 0, n3 = 0, err = 0, attempts = 0, success = 0;

                        Object.entries(data).forEach(([bId, res]) => {
                            const def = balises.find(b => b.id === bId);
                            if (!def) return;
                            
                            err += res.errors;
                            if (res.status === 'SUCCESS' || res.status === 'FAILURE') attempts++;
                            if (res.status === 'SUCCESS') {
                                success++;
                                if (def.level === 'N1') n1++;
                                if (def.level === 'N2') n2++;
                                if (def.level === 'N3') n3++;
                            }
                        });

                        const rate = attempts > 0 ? Math.round((success / attempts) * 100) : 0;

                        return (
                            <tr key={group} className="hover:bg-slate-50">
                                <td className="p-3 font-medium text-slate-900">
                                    {group} <span className="text-slate-400 text-xs font-normal">({studentsInGroup.map(s => s.firstName).join(', ')})</span>
                                </td>
                                <td className="p-3 text-center font-bold text-emerald-600">{n1}</td>
                                <td className="p-3 text-center font-bold text-blue-600">{n2}</td>
                                <td className="p-3 text-center font-bold text-purple-600">{n3}</td>
                                <td className="p-3 text-center font-bold text-red-500">{err}</td>
                                <td className="p-3 text-center">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${rate >= 75 ? 'bg-emerald-100 text-emerald-700' : rate >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                        {rate}%
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
  };

  // --- ACTIONS EXPORT ---
  const handleExportCSV = () => {
    let csv = "Groupe,Eleves,N1,N2,N3,Erreurs,Taux\n";
    uniqueGroups.forEach(group => {
        const studentsInGroup = students.filter(s => s.group === group);
        if (studentsInGroup.length === 0) return;
        const refId = studentsInGroup[0].id;
        const data = runData[refId] || {};
        let n1 = 0, n2 = 0, n3 = 0, err = 0, attempts = 0, success = 0;

        Object.entries(data).forEach(([bId, res]) => {
            const def = balises.find(b => b.id === bId);
            if (!def) return;
            err += res.errors;
            if (res.status === 'SUCCESS' || res.status === 'FAILURE') attempts++;
            if (res.status === 'SUCCESS') {
                success++;
                if (def.level === 'N1') n1++;
                else if (def.level === 'N2') n2++;
                else if (def.level === 'N3') n3++;
            }
        });
        const rate = attempts > 0 ? Math.round((success / attempts) * 100) : 0;
        const names = studentsInGroup.map(s => `${s.firstName} ${s.lastName}`).join(' & ');
        csv += `"${group}","${names}",${n1},${n2},${n3},${err},${rate}%\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orientation_results_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const handleExportImage = () => {
      const element = document.getElementById('orientation-stats-export');
      if (element) {
          html2canvas(element).then(canvas => {
              const link = document.createElement('a');
              link.download = `orientation_stats_${new Date().toISOString().slice(0,10)}.png`;
              link.href = canvas.toDataURL();
              link.click();
          });
      } else {
          alert("Veuillez d'abord afficher l'onglet Stats");
      }
  };

  const resetAll = () => {
      if (confirm("Réinitialiser toutes les courses ?")) {
          setRunData({});
      }
  };

  // --- RENDER ---
  return (
    <div className="h-full flex flex-col gap-4 animate-enter p-2">
      
      {/* 1. TOP BAR */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
          {/* Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setActiveTab('TRACKING')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'TRACKING' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
                 <Map size={16} className="inline mr-2"/> Suivi Terrain
              </button>
              <button onClick={() => setActiveTab('STATS')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'STATS' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
                 <Trophy size={16} className="inline mr-2"/> Résultats
              </button>
              <button onClick={() => setActiveTab('ADMIN')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === 'ADMIN' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
                 <Settings size={16} className="inline mr-2"/> Config
              </button>
          </div>

          {/* Group Selector (Only in Tracking) */}
          {activeTab === 'TRACKING' && (
              <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 uppercase">Groupe Actif</span>
                  <select 
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="bg-slate-50 border border-slate-300 text-slate-800 text-sm font-bold rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 min-w-[200px]"
                  >
                      <option value="">-- Sélectionner --</option>
                      {uniqueGroups.map(g => (
                          <option key={g} value={g}>{g}</option>
                      ))}
                      {/* Also add individual students who might not be in a group, or just allow selecting any student */}
                      <optgroup label="Élèves Individuels">
                          {students.filter(s => !s.group).map(s => (
                              <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                          ))}
                      </optgroup>
                  </select>
              </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
              <button onClick={resetAll} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="Réinitialiser">
                  <RotateCcw size={20} />
              </button>
              {activeTab === 'STATS' && (
                  <>
                    <button onClick={handleExportCSV} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="CSV">
                        <Download size={20} />
                    </button>
                    <button onClick={handleExportImage} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition" title="Image">
                        <ImageIcon size={20} />
                    </button>
                  </>
              )}
          </div>
      </div>

      {/* 2. MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50 rounded-2xl border border-slate-200 p-4 relative">
          
          {/* VIEW: TRACKING */}
          {activeTab === 'TRACKING' && (
              selectedGroupId ? (
                  <div className="space-y-8">
                      {/* Levels Rendering */}
                      {(['N1', 'N2', 'N3'] as BaliseLevel[]).map(level => {
                          const levelBalises = balises.filter(b => b.level === level);
                          if (levelBalises.length === 0) return null;

                          return (
                              <div key={level} className="space-y-4">
                                  <div className="flex items-center gap-3">
                                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider
                                        ${level === 'N1' ? 'bg-emerald-100 text-emerald-700' : 
                                          level === 'N2' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}
                                      `}>
                                          Niveau {level}
                                      </span>
                                      <div className="h-px bg-slate-200 flex-1"></div>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                      {levelBalises.map(balise => renderBaliseCard(balise))}
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                      <Users size={48} className="mb-4 opacity-20" />
                      <p>Sélectionnez un groupe ou un élève pour commencer le suivi.</p>
                  </div>
              )
          )}

          {/* VIEW: STATS */}
          {activeTab === 'STATS' && renderStats()}

          {/* VIEW: ADMIN */}
          {activeTab === 'ADMIN' && (
              <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-6">Configuration des Balises</h3>
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                      {balises.map((balise, idx) => (
                          <div key={balise.id} className="flex gap-4 items-center">
                              <span className="text-slate-400 font-mono text-sm w-6">{idx + 1}.</span>
                              <input 
                                value={balise.number}
                                onChange={(e) => {
                                    const next = [...balises];
                                    next[idx].number = e.target.value;
                                    setBalises(next);
                                }}
                                className="border border-slate-300 rounded p-2 text-sm font-bold w-24 text-center"
                                placeholder="Num"
                              />
                              <select 
                                value={balise.level}
                                onChange={(e) => {
                                    const next = [...balises];
                                    next[idx].level = e.target.value as BaliseLevel;
                                    setBalises(next);
                                }}
                                className="border border-slate-300 rounded p-2 text-sm flex-1"
                              >
                                  <option value="N1">Niveau 1 (Vert)</option>
                                  <option value="N2">Niveau 2 (Bleu)</option>
                                  <option value="N3">Niveau 3 (Violet)</option>
                              </select>
                              <button 
                                onClick={() => setBalises(balises.filter((_, i) => i !== idx))}
                                className="text-red-400 hover:text-red-600"
                              >
                                  <X size={18} />
                              </button>
                          </div>
                      ))}
                  </div>
                  <button 
                    onClick={() => setBalises([...balises, { id: crypto.randomUUID(), number: '', level: 'N1' }])}
                    className="mt-6 w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 font-bold hover:bg-slate-50 hover:border-slate-300 transition"
                  >
                      + Ajouter une balise
                  </button>
              </div>
          )}
      </div>
    </div>
  );
};
