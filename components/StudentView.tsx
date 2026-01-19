import React, { useState, useEffect } from 'react';
import { Student, Observation, Criterion, Session } from '../types';
import { Plus, Check, X, ArrowLeft, AlertTriangle, Clock, Box, ShieldAlert, BookOpen, Activity, Lock, Timer, Flag } from 'lucide-react';

interface Props {
  students: Student[];
  onObserve: (obs: Omit<Observation, 'id' | 'timestamp'>) => void;
  session: Session;
  criteria?: Criterion[];
}

type TabMode = 'SESSION' | 'OBSERVATION';

export const StudentView: React.FC<Props> = ({ students, onObserve, session, criteria = [] }) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabMode>('OBSERVATION');

  // État pour le Chrono Expert (CA1)
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);

  // Sync tab availability
  useEffect(() => {
    if (session.showObservationToStudents && !session.showSessionToStudents) setActiveTab('OBSERVATION');
    if (!session.showObservationToStudents && session.showSessionToStudents) setActiveTab('SESSION');
    if (session.showObservationToStudents && session.showSessionToStudents && !activeTab) setActiveTab('OBSERVATION');
  }, [session.showObservationToStudents, session.showSessionToStudents]);

  // Chrono Effect
  useEffect(() => {
    let interval: any;
    if (isRunning) {
        interval = setInterval(() => {
            setStopwatchTime(prev => prev + 100); // 100ms precision
        }, 100);
    } else {
        clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (ms: number) => {
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    const dec = Math.floor((ms % 1000) / 100);
    return `${min}:${sec < 10 ? '0' : ''}${sec}.${dec}`;
  };

  const handleObserve = (variableName: string, value: any) => {
    if (!selectedStudentId) return;
    onObserve({
      sessionId: session.id,
      studentId: selectedStudentId,
      variableName,
      value,
      authorRole: 'ELEVE'
    });
  };

  const handleLap = () => {
      const currentLap = laps.length > 0 ? stopwatchTime - laps[laps.length - 1] : stopwatchTime;
      const newLaps = [...laps, stopwatchTime];
      setLaps(newLaps);
      
      // Enregistrement automatique des laps
      handleObserve('CHRONO_LAP', { type: 'LAPS', totalTime: stopwatchTime, laps: newLaps });
  };

  const handleReset = () => {
      setIsRunning(false);
      setStopwatchTime(0);
      setLaps([]);
  };

  // 1. WAITING SCREEN
  if (!session.showSessionToStudents && !session.showObservationToStudents) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-50 p-8 text-center space-y-6">
        <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center animate-pulse">
            <Lock size={48} className="text-slate-400" />
        </div>
        <div>
            <h2 className="text-2xl font-bold text-slate-800">En attente</h2>
            <p className="text-slate-500 mt-2">Le professeur n'a pas encore publié le contenu de la séance.</p>
        </div>
      </div>
    );
  }

  // 2. STUDENT SELECTION
  if (!selectedStudentId) {
    return (
      <div className="flex flex-col h-full bg-slate-50">
        <header className="bg-white p-4 border-b border-slate-200 sticky top-0 z-10">
             <h2 className="text-lg font-bold text-slate-800">Qui observes-tu ?</h2>
             <p className="text-xs text-slate-500">Sélectionne un élève pour commencer</p>
        </header>
        <div className="p-4 space-y-3 overflow-y-auto">
            {students.map(student => (
                <button
                key={student.id}
                onClick={() => setSelectedStudentId(student.id)}
                className="w-full bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between active:scale-95 transition-transform min-h-[72px]"
                >
                <div className="text-left">
                    <div className="font-bold text-slate-900 text-lg">{student.firstName} <span className="uppercase">{student.lastName}</span></div>
                    <div className="text-sm text-slate-500">{student.group}</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <ArrowLeft className="rotate-180" size={20} />
                </div>
                </button>
            ))}
        </div>
      </div>
    );
  }

  const currentStudent = students.find(s => s.id === selectedStudentId);

  // 3. MAIN STUDENT VIEW
  return (
    <div className="flex flex-col h-full bg-slate-50">
      
      {/* HEADER */}
      <div className="bg-white px-4 py-3 border-b border-slate-200 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
            <button 
                onClick={() => setSelectedStudentId(null)}
                className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition text-slate-500"
            >
                <ArrowLeft size={24} />
            </button>
            <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">En observation</div>
                <div className="text-lg font-bold text-slate-900 leading-none">{currentStudent?.firstName}</div>
            </div>
        </div>
      </div>

      {/* TABS (Only if both enabled) */}
      {session.showSessionToStudents && session.showObservationToStudents && (
          <div className="flex bg-white border-b border-slate-200">
              <button 
                onClick={() => setActiveTab('SESSION')}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition ${activeTab === 'SESSION' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}
              >
                  <BookOpen size={18} /> MA SÉANCE
              </button>
              <button 
                onClick={() => setActiveTab('OBSERVATION')}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition ${activeTab === 'OBSERVATION' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}
              >
                  <Activity size={18} /> MON OBS
              </button>
          </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        
        {/* === TAB: SESSION CONTENT === */}
        {activeTab === 'SESSION' && session.showSessionToStudents && (
            <div className="space-y-6 animate-fade-in">
                {session.safetyAlert && (
                    <div className="bg-red-50 p-4 rounded-xl border border-red-200 shadow-sm">
                        <div className="flex items-center gap-2 text-red-700 font-bold mb-2">
                            <ShieldAlert size={20} /> SÉCURITÉ
                        </div>
                        <p className="text-red-900 text-sm leading-relaxed whitespace-pre-line">{session.safetyAlert}</p>
                    </div>
                )}
                {/* Timeline rendering (unchanged logic) */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 flex items-center gap-2">
                        <Clock size={18} /> DÉROULEMENT
                    </div>
                    <div className="divide-y divide-slate-100">
                        {(session.timeline || []).map((seq, idx) => (
                            <div key={seq.id} className="p-4 flex gap-4 items-start">
                                <div className="flex flex-col items-center gap-1 min-w-[3rem]">
                                    <span className="text-xs font-bold text-slate-400">SEQ {idx + 1}</span>
                                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                                        seq.type === 'ECHAUFFEMENT' ? 'bg-amber-100 text-amber-700' :
                                        seq.type === 'CALME' ? 'bg-blue-100 text-blue-700' :
                                        'bg-indigo-100 text-indigo-700'
                                    }`}>{seq.durationMin}'</span>
                                </div>
                                <div>
                                    <div className="font-bold text-slate-800">{seq.title}</div>
                                    <div className="text-xs text-slate-500 mt-0.5">{seq.type}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* === TAB: OBSERVATION FORM === */}
        {activeTab === 'OBSERVATION' && session.showObservationToStudents && (
            <div className="space-y-6 animate-fade-in">
                
                {/* SPECIAL CA1 : CHRONOMÈTRE EXPERT */}
                {session.ca === 'CA1' && (
                    <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-emerald-400 font-bold">
                                <Timer size={24} /> MODE PERFORMANCE
                            </div>
                            <div className="text-xs bg-slate-800 px-2 py-1 rounded">CA1</div>
                        </div>

                        <div className="text-center py-6">
                            <div className="text-6xl font-mono font-bold tracking-wider mb-2">
                                {formatTime(stopwatchTime)}
                            </div>
                            <div className="text-slate-400 text-sm">Temps écoulé</div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            {!isRunning ? (
                                <button onClick={() => setIsRunning(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl text-lg transition">
                                    START
                                </button>
                            ) : (
                                <button onClick={() => setIsRunning(false)} className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl text-lg transition">
                                    STOP
                                </button>
                            )}
                            <button onClick={handleLap} disabled={!isRunning} className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl text-lg transition flex items-center justify-center gap-2">
                                <Flag size={20} /> LAP
                            </button>
                        </div>
                        
                        <button onClick={handleReset} className="w-full text-slate-500 hover:text-white text-sm py-2">
                            Réinitialiser
                        </button>

                        {/* LAPS LIST */}
                        {laps.length > 0 && (
                            <div className="mt-4 bg-slate-800 rounded-xl p-4 max-h-40 overflow-y-auto">
                                <div className="text-xs text-slate-400 uppercase font-bold mb-2">Temps intermédiaires</div>
                                {laps.map((lap, idx) => {
                                    const prevLap = idx > 0 ? laps[idx-1] : 0;
                                    const diff = lap - prevLap;
                                    return (
                                        <div key={idx} className="flex justify-between py-1 border-b border-slate-700 last:border-0 text-sm font-mono">
                                            <span className="text-slate-400">Tour {idx + 1}</span>
                                            <span className="text-emerald-400">+{formatTime(diff)}</span>
                                            <span className="text-white">{formatTime(lap)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* CRITÈRES STANDARDS */}
                {criteria && criteria.length > 0 ? (
                    criteria.map(crit => (
                        <div key={crit.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <span className="font-bold text-slate-800 text-lg leading-tight">{crit.label}</span>
                                {crit.config.unit && <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-500 uppercase">{crit.config.unit}</span>}
                            </div>
                            
                            {/* WIDGETS (Binary, Multi-choice, etc. unchanged) */}
                            {crit.uiMode === 'BINARY' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={() => handleObserve(crit.id, { type: 'BOOLEAN', value: true })} className="py-5 bg-emerald-50 border-2 border-emerald-100 text-emerald-700 rounded-xl font-bold active:bg-emerald-100 active:border-emerald-300 transition flex flex-col items-center gap-1 min-h-[80px] justify-center shadow-sm">
                                        <Check size={28}/> <span className="text-sm">OUI</span>
                                    </button>
                                    <button onClick={() => handleObserve(crit.id, { type: 'BOOLEAN', value: false })} className="py-5 bg-red-50 border-2 border-red-100 text-red-700 rounded-xl font-bold active:bg-red-100 active:border-red-300 transition flex flex-col items-center gap-1 min-h-[80px] justify-center shadow-sm">
                                        <X size={28}/> <span className="text-sm">NON</span>
                                    </button>
                                </div>
                            )}

                             {crit.uiMode === 'STEPPER' && (
                                <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-100">
                                    <div className="pl-4">
                                        <div className="text-xs text-slate-400 uppercase font-bold">Compteur</div>
                                    </div>
                                    <button onClick={() => handleObserve(crit.id, { type: 'COUNTER', value: 1 })} className="w-16 h-16 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 flex items-center justify-center active:scale-90 transition">
                                        <Plus size={32} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                ) : !session.ca.includes('CA1') && (
                    <div className="text-center p-12 bg-white rounded-xl border border-dashed border-slate-300">
                        <Activity className="mx-auto text-slate-300 mb-2" size={32} />
                        <p className="text-slate-500 font-medium">Aucun critère d'observation.</p>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};