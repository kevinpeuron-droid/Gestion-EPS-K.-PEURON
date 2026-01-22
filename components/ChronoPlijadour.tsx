
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ActivityResult, Student } from '../types';
import { 
  Timer, Play, Pause, RotateCcw, Flag, 
  Settings, Download, TrendingUp, Activity, 
  CheckCircle, AlertTriangle, StopCircle, 
  Gauge, User, Trophy, Save
} from 'lucide-react';

interface Props {
  activityName: string;
  onSaveResult?: (payload: Omit<ActivityResult, 'id' | 'date'>) => void;
  students?: Student[]; // Injecté par le Kernel
}

// --- TYPES INTERNES ---

interface LapData {
  lapIndex: number;
  duration: number; // Temps du tour en ms
  splitTime: number; // Temps cumulé au passage en ms
  distance: number; // Distance cumulée
  speedKmH: number; // Vitesse sur ce tour
}

interface RunnerState {
  studentId: string;
  status: 'IDLE' | 'RUNNING' | 'FINISHED';
  laps: LapData[];
  startTime: number | null; // Offset individuel si départ décalé (optionnel, ici synchro global)
  finishTime: number | null;
  totalDistance: number;
}

interface SessionConfig {
  lapDistance: number; // ex: 50m (piscine) ou 400m (piste)
  targetDistance: number; // ex: 500m
  mode: 'NATATION' | 'COURSE'; 
}

// --- UTILITAIRES DE CALCUL ---

const formatTime = (ms: number, showMs: boolean = true) => {
  if (!ms && ms !== 0) return '--:--';
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const deciseconds = Math.floor((ms % 1000) / 100);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}${showMs ? '.' + deciseconds : ''}`;
};

const calculateSpeed = (distMeters: number, timeMs: number): number => {
  if (timeMs <= 0) return 0;
  const hours = timeMs / 1000 / 3600;
  const km = distMeters / 1000;
  return parseFloat((km / hours).toFixed(2));
};

const calculatePace = (timeMs: number, distMeters: number): string => {
  if (distMeters <= 0) return "-";
  // Allure en min/100m ou min/km
  // Ici on standardise sur min/100m pour la natation et min/km pour la course
  // Mais pour simplifier l'affichage Plijadour, on renvoie souvent m/s ou km/h
  const mps = distMeters / (timeMs / 1000);
  return mps.toFixed(2) + " m/s";
};

const analyzeRegularity = (laps: LapData[]): { index: number, label: string, color: string } => {
  if (laps.length < 2) return { index: 10, label: 'En attente', color: 'text-slate-400' };
  
  // Calcul écart type ou variance des vitesses
  const speeds = laps.map(l => l.speedKmH);
  const avg = speeds.reduce((a, b) => a + b, 0) / speeds.length;
  const variance = speeds.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / speeds.length;
  const stdDev = Math.sqrt(variance);
  
  // Indice de régularité sur 10 (10 = écart type nul, 0 = écart type énorme > 2km/h)
  const score = Math.max(0, 10 - (stdDev * 2)); // Formule arbitraire adaptée EPS
  
  let label = 'Irrégulier';
  let color = 'text-red-500';
  if (score >= 8) { label = 'Métronome'; color = 'text-emerald-500'; }
  else if (score >= 5) { label = 'Stable'; color = 'text-amber-500'; }
  
  return { index: parseFloat(score.toFixed(1)), label, color };
};

// --- COMPOSANT PRINCIPAL ---

export const ChronoPlijadour: React.FC<Props> = ({ activityName, onSaveResult, students = [] }) => {
  
  // --- STATE ---
  
  // Config
  const [config, setConfig] = useState<SessionConfig>({
    lapDistance: 50, // Défaut Piscine
    targetDistance: 500,
    mode: 'NATATION'
  });
  
  const [showConfig, setShowConfig] = useState(false);

  // Master Timer
  const [globalTime, setGlobalTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [masterStartTime, setMasterStartTime] = useState<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Data Runners
  const [runnerStates, setRunnerStates] = useState<Record<string, RunnerState>>({});

  // UI State
  const [selectedRunnerId, setSelectedRunnerId] = useState<string | null>(null);

  // --- INIT & SYNC ---

  // Initialisation des coureurs à partir des props students
  useEffect(() => {
    setRunnerStates(prev => {
      const next = { ...prev };
      let changed = false;
      students.forEach(s => {
        if (!next[s.id]) {
          next[s.id] = {
            studentId: s.id,
            status: 'IDLE',
            laps: [],
            startTime: null,
            finishTime: null,
            totalDistance: 0
          };
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [students]);

  // --- TIMER LOGIC ---

  useEffect(() => {
    if (isRunning) {
      const start = Date.now() - globalTime;
      setMasterStartTime(start);
      intervalRef.current = window.setInterval(() => {
        setGlobalTime(Date.now() - start);
      }, 100); // 10Hz update is enough for UI
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const toggleMasterTimer = () => {
    if (!isRunning && globalTime === 0) {
      // START : Set all IDLE to RUNNING
      setRunnerStates(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          if (next[key].status === 'IDLE') next[key].status = 'RUNNING';
        });
        return next;
      });
    }
    setIsRunning(!isRunning);
  };

  const resetMasterTimer = () => {
    setIsRunning(false);
    setGlobalTime(0);
    setMasterStartTime(null);
    setRunnerStates(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(key => {
        next[key] = {
          ...next[key],
          status: 'IDLE',
          laps: [],
          startTime: null,
          finishTime: null,
          totalDistance: 0
        };
      });
      return next;
    });
  };

  // --- RUNNER ACTIONS ---

  const handleLap = (studentId: string) => {
    if (!isRunning) return;

    setRunnerStates(prev => {
      const runner = prev[studentId];
      if (!runner || runner.status === 'FINISHED') return prev;

      const now = globalTime;
      const lastLapEnd = runner.laps.length > 0 ? runner.laps[runner.laps.length - 1].splitTime : 0;
      const lapDuration = now - lastLapEnd;
      
      // Anti-rebond (minimum 2 secondes par tour)
      if (lapDuration < 2000) return prev;

      const currentDistance = config.lapDistance;
      const speed = calculateSpeed(currentDistance, lapDuration);

      const newLap: LapData = {
        lapIndex: runner.laps.length + 1,
        duration: lapDuration,
        splitTime: now,
        distance: currentDistance,
        speedKmH: speed
      };

      const newTotalDistance = runner.totalDistance + currentDistance;
      const isFinished = newTotalDistance >= config.targetDistance;

      const updatedRunner: RunnerState = {
        ...runner,
        laps: [...runner.laps, newLap],
        totalDistance: newTotalDistance,
        status: isFinished ? 'FINISHED' : 'RUNNING',
        finishTime: isFinished ? now : null
      };

      // Auto-save result if finished
      if (isFinished) {
        saveToKernel(updatedRunner);
      }

      return { ...prev, [studentId]: updatedRunner };
    });
  };

  const handleForceFinish = (studentId: string) => {
    setRunnerStates(prev => {
      const runner = prev[studentId];
      if (!runner) return prev;
      
      const updatedRunner: RunnerState = {
        ...runner,
        status: 'FINISHED',
        finishTime: globalTime
      };
      
      saveToKernel(updatedRunner);
      return { ...prev, [studentId]: updatedRunner };
    });
  };

  const handleCorrection = (studentId: string) => {
    // Undo last lap
    setRunnerStates(prev => {
      const runner = prev[studentId];
      if (!runner || runner.laps.length === 0) return prev;

      const newLaps = [...runner.laps];
      const removedLap = newLaps.pop();
      
      return {
        ...prev,
        [studentId]: {
          ...runner,
          laps: newLaps,
          totalDistance: runner.totalDistance - (removedLap?.distance || 0),
          status: 'RUNNING',
          finishTime: null
        }
      };
    });
  };

  // --- DATA BRIDGE ---

  const saveToKernel = (runner: RunnerState) => {
    if (!onSaveResult) return;
    
    const studentDef = students.find(s => s.id === runner.studentId);
    if (!studentDef) return;

    const regul = analyzeRegularity(runner.laps);
    const totalTime = runner.finishTime || globalTime;
    const avgSpeed = calculateSpeed(runner.totalDistance, totalTime);

    const payload: Omit<ActivityResult, 'id' | 'date'> = {
      studentId: runner.studentId,
      studentName: `${studentDef.firstName} ${studentDef.lastName}`,
      activityId: activityName,
      engineId: 'CHRONO_PLIJADOUR',
      data: {
        totalTime: totalTime,
        totalDistance: runner.totalDistance,
        avgSpeedKmH: avgSpeed,
        lapsCount: runner.laps.length,
        regularityIndex: regul.index,
        regularityLabel: regul.label,
        bestLap: Math.min(...runner.laps.map(l => l.duration)),
        worstLap: Math.max(...runner.laps.map(l => l.duration)),
        laps: runner.laps // Full detail
      }
    };

    onSaveResult(payload);
  };

  const exportCSV = () => {
    let csv = "Nom,Prénom,Groupe,Distance Totale,Temps Total,Vitesse Moy (km/h),Indice Régul,Tours...\n";
    
    students.forEach(s => {
      const runner = runnerStates[s.id];
      if (!runner || runner.laps.length === 0) return;

      const totalTimeStr = formatTime(runner.finishTime || globalTime, false);
      const avgSpeed = calculateSpeed(runner.totalDistance, runner.finishTime || globalTime);
      const regul = analyzeRegularity(runner.laps);

      let line = `"${s.lastName}","${s.firstName}","${s.group}",${runner.totalDistance},${totalTimeStr},${avgSpeed},${regul.index}`;
      
      runner.laps.forEach(l => {
        line += `,${formatTime(l.duration, false)} (${l.speedKmH}km/h)`;
      });
      
      csv += line + "\n";
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `plijadour_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- RENDERERS ---

  return (
    <div className="h-full flex flex-col bg-slate-50 relative">
      
      {/* 1. TOP BAR: CHRONO & CONTROLS */}
      <div className="bg-white border-b border-slate-200 p-4 shadow-sm z-20 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Title & Config Toggle */}
        <div className="flex items-center gap-4">
           <div className={`p-3 rounded-xl ${config.mode === 'NATATION' ? 'bg-cyan-100 text-cyan-600' : 'bg-orange-100 text-orange-600'}`}>
              <Timer size={24} strokeWidth={2.5} />
           </div>
           <div>
              <h1 className="text-xl font-black text-slate-800 leading-none">CHRONO PLIJADOUR</h1>
              <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide flex items-center gap-2">
                 {config.mode} • {config.lapDistance}m / tour
                 <button onClick={() => setShowConfig(!showConfig)} className="text-indigo-600 hover:underline ml-2 flex items-center gap-1">
                    <Settings size={10} /> Config
                 </button>
              </div>
           </div>
        </div>

        {/* Master Timer Display */}
        <div className="flex-1 flex justify-center">
           <div className={`
              text-5xl font-mono font-black tracking-wider transition-colors duration-300 select-none
              ${isRunning ? 'text-slate-900' : 'text-slate-400'}
           `}>
              {formatTime(globalTime)}
           </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
           <button 
             onClick={toggleMasterTimer}
             className={`
                flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95
                ${isRunning ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'}
             `}
           >
              {isRunning ? <><Pause fill="currentColor" /> PAUSE</> : <><Play fill="currentColor" /> DÉPART</>}
           </button>
           
           {!isRunning && globalTime > 0 && (
             <button 
               onClick={resetMasterTimer}
               className="p-3 bg-slate-200 text-slate-600 rounded-xl hover:bg-slate-300 transition"
               title="Réinitialiser"
             >
                <RotateCcw size={20} />
             </button>
           )}

           <button 
             onClick={exportCSV}
             className="p-3 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition"
             title="Exporter CSV"
           >
              <Download size={20} />
           </button>
        </div>
      </div>

      {/* 2. CONFIG PANEL (Drawer) */}
      {showConfig && (
        <div className="bg-slate-100 border-b border-slate-200 p-6 grid grid-cols-1 md:grid-cols-3 gap-6 animate-enter">
           <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Mode d'activité</label>
              <div className="flex bg-white p-1 rounded-lg border border-slate-300">
                 <button 
                   onClick={() => setConfig(c => ({...c, mode: 'NATATION', lapDistance: 50}))}
                   className={`flex-1 py-2 text-sm font-bold rounded-md transition ${config.mode === 'NATATION' ? 'bg-cyan-500 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
                 >
                    Natation
                 </button>
                 <button 
                   onClick={() => setConfig(c => ({...c, mode: 'COURSE', lapDistance: 400}))}
                   className={`flex-1 py-2 text-sm font-bold rounded-md transition ${config.mode === 'COURSE' ? 'bg-orange-500 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
                 >
                    Course
                 </button>
              </div>
           </div>
           <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Distance du tour (m)</label>
              <input 
                type="number" 
                value={config.lapDistance}
                onChange={(e) => setConfig(c => ({...c, lapDistance: parseInt(e.target.value) || 0}))}
                className="w-full p-2.5 font-bold text-center border border-slate-300 rounded-lg outline-none focus:border-indigo-500"
              />
           </div>
           <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Distance Cible (m)</label>
              <input 
                type="number" 
                value={config.targetDistance}
                onChange={(e) => setConfig(c => ({...c, targetDistance: parseInt(e.target.value) || 0}))}
                className="w-full p-2.5 font-bold text-center border border-slate-300 rounded-lg outline-none focus:border-indigo-500"
              />
           </div>
        </div>
      )}

      {/* 3. MAIN CONTENT (Split View) */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
         
         {/* LEFT: RUNNERS GRID */}
         <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
               {students.map(student => {
                  const runner = runnerStates[student.id];
                  if (!runner) return null;

                  const isFinished = runner.status === 'FINISHED';
                  const lastLap = runner.laps.length > 0 ? runner.laps[runner.laps.length - 1] : null;
                  const progress = Math.min(100, (runner.totalDistance / config.targetDistance) * 100);
                  
                  // Color Logic based on Speed Trend (compared to avg)
                  let trendColor = 'bg-white';
                  if (lastLap && runner.laps.length > 1) {
                     const avgSpeed = calculateSpeed(runner.totalDistance - config.lapDistance, runner.laps[runner.laps.length-2].splitTime);
                     const diff = lastLap.speedKmH - avgSpeed;
                     if (diff > 0.5) trendColor = 'bg-emerald-50 ring-1 ring-emerald-200'; // Accélération
                     else if (diff < -0.5) trendColor = 'bg-red-50 ring-1 ring-red-200'; // Décélération
                  }
                  if (isFinished) trendColor = 'bg-emerald-100 ring-2 ring-emerald-500';

                  return (
                     <div 
                        key={student.id}
                        onClick={() => setSelectedRunnerId(student.id)}
                        className={`
                           relative flex flex-col rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all cursor-pointer hover:shadow-md
                           ${selectedRunnerId === student.id ? 'ring-2 ring-indigo-500 transform scale-[1.02]' : ''}
                           ${trendColor}
                        `}
                     >
                        {/* Progress Bar Background */}
                        <div className="absolute bottom-0 left-0 h-1.5 bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }} />

                        {/* Card Header */}
                        <div className="p-3 flex justify-between items-start">
                           <div>
                              <div className="font-bold text-slate-800 leading-tight">{student.firstName}</div>
                              <div className="text-xs text-slate-500 uppercase font-medium">{student.lastName}</div>
                           </div>
                           <div className="text-right">
                              <div className="text-xs font-bold text-slate-400">DIST.</div>
                              <div className="text-lg font-black text-slate-700 leading-none">{runner.totalDistance}m</div>
                           </div>
                        </div>

                        {/* Card Stats */}
                        <div className="px-3 pb-2 flex items-end justify-between">
                           <div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase">Dernier Tour</div>
                              <div className="font-mono font-bold text-slate-800">
                                 {lastLap ? formatTime(lastLap.duration, false) : '--:--'}
                              </div>
                           </div>
                           {lastLap && (
                              <div className="text-right">
                                 <div className="text-xs font-bold text-indigo-600">{lastLap.speedKmH} km/h</div>
                              </div>
                           )}
                        </div>

                        {/* BIG LAP BUTTON */}
                        <button 
                           onClick={(e) => { e.stopPropagation(); handleLap(student.id); }}
                           disabled={isFinished || !isRunning}
                           className={`
                              w-full py-4 text-center font-black text-sm uppercase tracking-widest transition-colors border-t border-slate-100
                              ${isFinished 
                                 ? 'bg-emerald-500 text-white cursor-default' 
                                 : isRunning 
                                    ? 'bg-slate-900 text-white hover:bg-slate-800 active:bg-indigo-600' 
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              }
                           `}
                        >
                           {isFinished ? 'TERMINÉ' : '+ TOUR'}
                        </button>
                     </div>
                  );
               })}
            </div>
         </div>

         {/* RIGHT: DETAILS PANEL */}
         <div className="w-full md:w-[400px] xl:w-[500px] bg-white border-l border-slate-200 flex flex-col shadow-xl z-10">
            {selectedRunnerId ? (
               <>
                  {(() => {
                     const runner = runnerStates[selectedRunnerId];
                     const student = students.find(s => s.id === selectedRunnerId);
                     const regul = analyzeRegularity(runner?.laps || []);
                     if (!runner || !student) return null;

                     return (
                        <>
                           {/* Panel Header */}
                           <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                              <div className="flex justify-between items-start mb-4">
                                 <div>
                                    <div className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-1">Analyse détaillée</div>
                                    <h2 className="text-2xl font-black text-slate-800">{student.firstName} {student.lastName}</h2>
                                    <span className="text-sm text-slate-500 font-medium">{student.group}</span>
                                 </div>
                                 <div className={`px-3 py-1 rounded-full text-xs font-bold border ${runner.status === 'FINISHED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                    {runner.status === 'FINISHED' ? 'Terminé' : 'En cours'}
                                 </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                 <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-1">
                                       <Gauge size={14} /> Vitesse Moy.
                                    </div>
                                    <div className="text-xl font-black text-slate-800">
                                       {calculateSpeed(runner.totalDistance, runner.finishTime || globalTime)} <span className="text-sm font-medium text-slate-400">km/h</span>
                                    </div>
                                 </div>
                                 <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-1">
                                       <Activity size={14} /> Régularité
                                    </div>
                                    <div className={`text-xl font-black ${regul.color}`}>
                                       {regul.index}/10 <span className="text-xs font-medium text-slate-400">({regul.label})</span>
                                    </div>
                                 </div>
                              </div>
                           </div>

                           {/* Lap Table */}
                           <div className="flex-1 overflow-y-auto p-0">
                              <table className="w-full text-sm text-left">
                                 <thead className="bg-white sticky top-0 z-10 shadow-sm text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    <tr>
                                       <th className="px-6 py-3 bg-slate-50">Tour</th>
                                       <th className="px-6 py-3 bg-slate-50 text-right">Temps</th>
                                       <th className="px-6 py-3 bg-slate-50 text-right">Vitesse</th>
                                       <th className="px-6 py-3 bg-slate-50 text-right">Cumul</th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-slate-50">
                                    {runner.laps.slice().reverse().map((lap) => (
                                       <tr key={lap.lapIndex} className="hover:bg-slate-50 transition">
                                          <td className="px-6 py-3 font-bold text-slate-700">#{lap.lapIndex}</td>
                                          <td className="px-6 py-3 text-right font-mono text-slate-600">{formatTime(lap.duration, true)}</td>
                                          <td className="px-6 py-3 text-right font-bold text-indigo-600">{lap.speedKmH}</td>
                                          <td className="px-6 py-3 text-right text-slate-400">{formatTime(lap.splitTime, false)}</td>
                                       </tr>
                                    ))}
                                    {runner.laps.length === 0 && (
                                       <tr>
                                          <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">Aucun tour enregistré</td>
                                       </tr>
                                    )}
                                 </tbody>
                              </table>
                           </div>

                           {/* Panel Footer Actions */}
                           <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
                              <button 
                                 onClick={() => handleCorrection(runner.studentId)}
                                 className="flex-1 py-3 border border-slate-300 bg-white text-slate-600 rounded-xl font-bold text-xs uppercase hover:bg-slate-50 transition"
                              >
                                 Corriger (Annuler Tour)
                              </button>
                              {runner.status !== 'FINISHED' && (
                                 <button 
                                    onClick={() => handleForceFinish(runner.studentId)}
                                    className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-bold text-xs uppercase hover:bg-slate-700 transition flex items-center justify-center gap-2"
                                 >
                                    <StopCircle size={16} /> Stop & Fin
                                 </button>
                              )}
                           </div>
                        </>
                     );
                  })()}
               </>
            ) : (
               <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                     <User size={32} className="opacity-50" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-700 mb-2">Détails Élève</h3>
                  <p>Sélectionnez un élève dans la grille pour voir l'analyse tour par tour et accéder aux corrections.</p>
               </div>
            )}
         </div>

      </div>
    </div>
  );
};
