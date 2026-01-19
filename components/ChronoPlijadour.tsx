import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Student, Observation, SwimmerData } from '../types';
import { 
  Play, Pause, RotateCcw, Download, 
  Timer, Activity, CheckCircle2, Coffee, Settings2, FileSpreadsheet
} from 'lucide-react';

interface Props {
  students: Student[];
  onSaveObservation: (obs: Omit<Observation, 'id' | 'timestamp'>) => void;
}

export const ChronoPlijadour: React.FC<Props> = ({ students, onSaveObservation }) => {
  // --- CONFIGURATION GLOBALE ---
  const [globalConfig, setGlobalConfig] = useState({
    minDistance: 50,
    maxDistance: 500,
    measureInterval: 50, // "Intervalle de mesure" du fichier original
    defaultReps: 1,
    defaultDist: 250
  });

  // --- STATE CHRONO ---
  const [isRunning, setIsRunning] = useState(false);
  const [globalTime, setGlobalTime] = useState(0); // Temps global en ms
  const timerRef = useRef<number | null>(null);

  // --- STATE NAGEURS (Mirroring students array from HTML) ---
  const [swimmers, setSwimmers] = useState<Record<string, SwimmerData>>({});

  // Initialisation des nageurs
  useEffect(() => {
    const initialSwimmers: Record<string, SwimmerData> = {};
    students.forEach(s => {
      // On préserve l'état si déjà existant pour éviter reset au re-render
      if (!swimmers[s.id]) {
        initialSwimmers[s.id] = {
            studentId: s.id,
            targetDistance: globalConfig.defaultDist,
            targetReps: globalConfig.defaultReps,
            checkpoints: {},
            restStartGlobalTime: null,
            restDurations: [],
            currentRep: 1,
            repStartGlobalTime: 0,
            finished: false
        };
      }
    });
    // Fusionner avec les existants pour ne pas écraser les progrès
    setSwimmers(prev => ({ ...initialSwimmers, ...prev }));
  }, [students, globalConfig.defaultDist, globalConfig.defaultReps]);

  // --- BOUCLE DE TEMPS ---
  useEffect(() => {
    if (isRunning) {
      const startTime = Date.now() - globalTime;
      timerRef.current = window.setInterval(() => {
        setGlobalTime(Date.now() - startTime);
      }, 100); // 100ms precision comme demandé
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning]);

  // --- LOGIQUE METIER (Portage recordTime) ---
  const handleRecordTime = (studentId: string) => {
    if (!isRunning) return;

    setSwimmers(prev => {
        const s = { ...prev[studentId] }; // Copie mutable
        const totalDistance = s.targetDistance * s.targetReps;
        
        // 1. GESTION DU REPOS (Fin de pause)
        if (s.restStartGlobalTime !== null) {
            const restDuration = globalTime - s.restStartGlobalTime;
            s.restDurations.push(restDuration);
            s.restStartGlobalTime = null;
            s.repStartGlobalTime = globalTime; // Redémarrage chrono pour la nouvelle rep
            return { ...prev, [studentId]: s };
        }

        // 2. GESTION DE LA NAGE (Enregistrement temps)
        // Trouver la prochaine distance checkpoint
        const interval = globalConfig.measureInterval;
        let nextCheckpoint = interval;
        while (nextCheckpoint <= totalDistance && s.checkpoints[nextCheckpoint] !== undefined) {
            nextCheckpoint += interval;
        }

        if (nextCheckpoint <= totalDistance) {
            // Calcul du temps relatif à la répétition (pour les stats pures)
            // Note: Le HTML original stocke le temps relatif au DEBUT de la répétition
            const relativeTime = globalTime - s.repStartGlobalTime;
            s.checkpoints[nextCheckpoint] = relativeTime;

            // Vérification Fin de Répétition
            const distPerRep = s.targetDistance;
            const isRepFinish = nextCheckpoint % distPerRep === 0;
            const isTotalFinish = nextCheckpoint >= totalDistance;

            if (isRepFinish && !isTotalFinish) {
                // Début de pause
                s.restStartGlobalTime = globalTime;
                s.currentRep++;
            } else if (isTotalFinish) {
                s.finished = true;
                handleSaveSingleObservation(s);
            }
        }

        return { ...prev, [studentId]: s };
    });
  };

  const handleUpdateConfig = (studentId: string, field: 'targetDistance' | 'targetReps', value: number) => {
      setSwimmers(prev => ({
          ...prev,
          [studentId]: { ...prev[studentId], [field]: value }
      }));
  };

  // --- SAUVEGARDE & EXPORT ---
  
  const calculateStats = (s: SwimmerData) => {
    const checkpoints = Object.values(s.checkpoints);
    if (checkpoints.length === 0) return { avg50: 0, best: 0, avgSeries: 0 };

    // Moyenne 50m
    // Formule HTML: (Temps Total / Distance Nagee) * 50
    // On prend le dernier checkpoint enregistré comme "Total"
    const maxDist = Math.max(...Object.keys(s.checkpoints).map(Number));
    const totalTime = s.checkpoints[maxDist]; // Ce temps est relatif au début de la rep...
    // ATTENTION: La logique HTML originale accumulait les temps de série différemment.
    // Pour être exact avec le HTML, on doit sommer les temps de chaque série si Plijadour reset le chrono.
    // Ici, repStartGlobalTime reset le chrono. Donc s.checkpoints contient le temps DE LA SERIE.
    
    // On doit reconstruire le temps TOTAL de nage effective (hors repos)
    let sumSeriesTimes = 0;
    let seriesCounts = 0;
    let bestSeries = Infinity;

    // On itère par série
    for (let r = 1; r <= s.targetReps; r++) {
        const distEndSeries = r * s.targetDistance;
        if (s.checkpoints[distEndSeries]) {
            const time = s.checkpoints[distEndSeries]; // Temps de la série
            sumSeriesTimes += time;
            seriesCounts++;
            if (time < bestSeries) bestSeries = time;
        }
    }

    const avgSeries = seriesCounts > 0 ? sumSeriesTimes / seriesCounts : 0;
    const avg50 = maxDist > 0 ? (sumSeriesTimes / maxDist) * 50 : 0;

    return { 
        avg50, 
        avgSeries, 
        best: bestSeries === Infinity ? 0 : bestSeries 
    };
  };

  const handleSaveSingleObservation = (s: SwimmerData) => {
      const stats = calculateStats(s);
      onSaveObservation({
          sessionId: 'natation-session',
          studentId: s.studentId,
          variableName: 'PERF_NATATION',
          value: { stats, data: s },
          authorRole: 'PROF',
          type: 'COMPLEX'
      });
  };

  const handleExportCSV = () => {
    let csv = 'N°,Nom,Prénom,Distance,Répétitions';
    
    // Explicit typing for Object.values return to avoid unknown type issues
    const list = Object.values(swimmers) as SwimmerData[];

    if (list.length === 0) return;

    // Génération Header Dynamique
    const maxReps = Math.max(...list.map(s => s.targetReps));
    const maxTotalDist = Math.max(...list.map(s => s.targetDistance * s.targetReps));
    const interval = globalConfig.measureInterval;

    for (let d = interval; d <= maxTotalDist; d += interval) csv += `,${d}m`;
    for (let i = 1; i < maxReps; i++) csv += `,P${i}`;
    csv += ',Moy. 50m,Moy. séries,Meilleur\n';

    // Lignes Élèves
    list.forEach(s => {
        const student = students.find(st => st.id === s.studentId);
        if (!student) return;

        csv += `${student.id},${student.lastName},${student.firstName},${s.targetDistance},${s.targetReps}`;
        
        const totalDist = s.targetDistance * s.targetReps;
        
        // Temps Checkpoints
        for (let d = interval; d <= maxTotalDist; d += interval) {
             if (d > totalDist) {
                 csv += ',-';
             } else {
                 const t = s.checkpoints[d];
                 csv += `,${t ? formatTime(t) : ''}`;
             }
        }

        // Temps Repos
        for (let i = 0; i < maxReps - 1; i++) {
            csv += `,${s.restDurations[i] ? formatTime(s.restDurations[i]) : '-'}`;
        }

        // Stats
        const stats = calculateStats(s);
        csv += `,${formatTime(stats.avg50)},${formatTime(stats.avgSeries)},${formatTime(stats.best)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `natation_resultats_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  // --- HELPERS AFFICHAGE ---
  const formatTime = (ms: number) => {
    if (!ms && ms !== 0) return '-';
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    const dec = Math.floor((ms % 1000) / 100);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${dec}`;
  };

  return (
    <div className="h-full flex flex-col gap-4 animate-enter p-2">
      
      {/* 1. CONTROL ROOM (Top Bar) */}
      <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 shrink-0">
         
         {/* Chrono Géant */}
         <div className="flex items-center gap-6">
            <div className={`w-32 h-32 rounded-3xl flex items-center justify-center text-4xl font-mono font-bold shadow-inner ${isRunning ? 'bg-emerald-500 text-emerald-950 animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
                {formatTime(globalTime)}
            </div>
            <div>
                <div className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Temps Global</div>
                <div className="flex gap-2">
                    {!isRunning ? (
                        <button onClick={() => setIsRunning(true)} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold flex items-center gap-2 transition">
                            <Play size={20} fill="currentColor"/> DÉPART
                        </button>
                    ) : (
                        <button onClick={() => setIsRunning(false)} className="px-6 py-3 bg-orange-500 hover:bg-orange-400 text-white rounded-xl font-bold flex items-center gap-2 transition">
                            <Pause size={20} fill="currentColor"/> PAUSE
                        </button>
                    )}
                    <button onClick={() => { setIsRunning(false); setGlobalTime(0); setSwimmers({}); }} className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition">
                        <RotateCcw size={20} />
                    </button>
                </div>
            </div>
         </div>

         {/* Configuration Rapide */}
         <div className="flex items-center gap-4 bg-slate-800 p-4 rounded-2xl border border-slate-700">
             <div className="text-right border-r border-slate-600 pr-4 mr-2">
                 <div className="text-xs text-slate-400 font-bold uppercase">Intervalle</div>
                 <div className="font-mono text-xl text-emerald-400">{globalConfig.measureInterval}m</div>
             </div>
             <div className="flex gap-2">
                 <select 
                    className="bg-slate-700 text-white p-2 rounded-lg text-sm outline-none border border-slate-600 focus:border-emerald-500"
                    onChange={(e) => setGlobalConfig(prev => ({ ...prev, defaultDist: Number(e.target.value) }))}
                    value={globalConfig.defaultDist}
                 >
                     <option value="50">50m / série</option>
                     <option value="100">100m / série</option>
                     <option value="250">250m / série</option>
                     <option value="500">500m / série</option>
                 </select>
                 <select 
                    className="bg-slate-700 text-white p-2 rounded-lg text-sm outline-none border border-slate-600 focus:border-emerald-500"
                    onChange={(e) => setGlobalConfig(prev => ({ ...prev, defaultReps: Number(e.target.value) }))}
                    value={globalConfig.defaultReps}
                 >
                     <option value="1">x1 Série</option>
                     <option value="2">x2 Séries</option>
                     <option value="3">x3 Séries</option>
                     <option value="4">x4 Séries</option>
                 </select>
             </div>
             <button onClick={handleExportCSV} className="ml-2 p-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white shadow-lg transition" title="Exporter CSV">
                 <Download size={20} />
             </button>
         </div>
      </div>

      {/* 2. GRILLE NAGEURS (Main Content) */}
      <div className="flex-1 overflow-y-auto bg-slate-50 rounded-[2rem] border border-slate-200 p-4 shadow-inner">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {students.map(student => {
                  const s = swimmers[student.id];
                  if (!s) return null;

                  const isResting = s.restStartGlobalTime !== null;
                  const isFinished = s.finished;
                  const stats = calculateStats(s);
                  const lastDist = Math.max(0, ...Object.keys(s.checkpoints).map(Number));
                  
                  // Calcul progression
                  const progress = (lastDist / (s.targetDistance * s.targetReps)) * 100;

                  return (
                      <div 
                        key={student.id}
                        className={`
                            relative rounded-2xl p-4 border-2 transition-all cursor-pointer select-none group overflow-hidden min-h-[140px] flex flex-col justify-between
                            ${isFinished 
                                ? 'bg-emerald-50 border-emerald-500 opacity-60' 
                                : isResting 
                                    ? 'bg-amber-50 border-amber-400 shadow-amber-100 shadow-lg scale-[1.02] z-10' 
                                    : 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-md'
                            }
                        `}
                        onClick={() => handleRecordTime(student.id)}
                      >
                          {/* Header Card */}
                          <div className="flex justify-between items-start z-10">
                              <div>
                                  <div className="font-bold text-slate-900 leading-tight">{student.firstName}</div>
                                  <div className="text-xs font-semibold text-slate-400 uppercase">{student.lastName}</div>
                              </div>
                              <div className={`px-2 py-1 rounded-md text-xs font-bold ${isResting ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
                                  {isFinished ? 'TERMINE' : isResting ? 'REPOS' : `${s.currentRep}/${s.targetReps}`}
                              </div>
                          </div>

                          {/* Stats Rapides */}
                          <div className="grid grid-cols-2 gap-2 my-2 z-10">
                             <div className="bg-slate-50 rounded p-1.5">
                                 <div className="text-[10px] text-slate-400 font-bold uppercase">Moy 50m</div>
                                 <div className="font-mono text-sm font-bold text-slate-700">{formatTime(stats.avg50)}</div>
                             </div>
                             <div className="bg-slate-50 rounded p-1.5">
                                 <div className="text-[10px] text-slate-400 font-bold uppercase">Dernier</div>
                                 <div className="font-mono text-sm font-bold text-indigo-600">
                                     {lastDist > 0 ? formatTime(s.checkpoints[lastDist]) : '-'}
                                 </div>
                             </div>
                          </div>

                          {/* Action Overlay / Repos Timer */}
                          {isResting && isRunning && (
                              <div className="absolute inset-0 bg-amber-400/10 backdrop-blur-[1px] flex flex-col items-center justify-center z-20">
                                  <Coffee size={32} className="text-amber-600 mb-1" />
                                  <div className="font-mono text-2xl font-bold text-amber-700">
                                      {formatTime(globalTime - (s.restStartGlobalTime || 0))}
                                  </div>
                                  <div className="text-xs font-bold text-amber-800 uppercase mt-1">En Pause</div>
                              </div>
                          )}

                          {/* Progress Bar Background */}
                          {!isFinished && (
                              <div 
                                className="absolute bottom-0 left-0 h-1.5 bg-indigo-500 transition-all duration-500" 
                                style={{ width: `${progress}%` }} 
                              />
                          )}

                          {/* Click Ripple Hint */}
                          <div className="absolute inset-0 bg-black/0 group-active:bg-black/5 transition-colors z-0" />
                      </div>
                  );
              })}
          </div>
      </div>

    </div>
  );
};