import React, { useState, useEffect } from 'react';
import { Student, Observation, Criterion, Session } from '../types';
import { Plus, Check, X, ArrowLeft, ShieldAlert, Clock, Box, BookOpen, Activity, Lock } from 'lucide-react';

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

  // Local state to track selections for visual feedback (highlighting selected buttons)
  // Key: criterionId, Value: selected value
  const [localSelections, setLocalSelections] = useState<Record<string, any>>({});

  // Sync tab availability
  useEffect(() => {
    if (session.showObservationToStudents && !session.showSessionToStudents) setActiveTab('OBSERVATION');
    if (!session.showObservationToStudents && session.showSessionToStudents) setActiveTab('SESSION');
    if (session.showObservationToStudents && session.showSessionToStudents && !activeTab) setActiveTab('OBSERVATION');
  }, [session.showObservationToStudents, session.showSessionToStudents]);

  // Reset selections when student changes
  useEffect(() => {
    setLocalSelections({});
  }, [selectedStudentId]);

  const handleObserve = (critId: string, payload: { type: string, value: any }) => {
    if (!selectedStudentId) return;
    
    // Update visual state locally
    setLocalSelections(prev => ({
        ...prev,
        [critId]: payload.value
    }));

    // Send to Kernel
    onObserve({
      sessionId: session.id,
      studentId: selectedStudentId,
      variableName: critId, // Using criteria ID as variable name
      criteriaId: critId,
      value: payload.value,
      type: payload.type,
      authorRole: 'ELEVE'
    });
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
                {/* Safety Alert */}
                {session.safetyAlert && (
                    <div className="bg-red-50 p-4 rounded-xl border border-red-200 shadow-sm">
                        <div className="flex items-center gap-2 text-red-700 font-bold mb-2">
                            <ShieldAlert size={20} />
                            CONSIGNES DE SÉCURITÉ
                        </div>
                        <p className="text-red-900 text-sm leading-relaxed whitespace-pre-line">
                            {session.safetyAlert}
                        </p>
                    </div>
                )}

                {/* Materials */}
                {session.materials && (
                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 shadow-sm">
                        <div className="flex items-center gap-2 text-orange-800 font-bold mb-2">
                            <Box size={20} />
                            MATÉRIEL
                        </div>
                        <p className="text-orange-900 text-sm leading-relaxed whitespace-pre-line">
                            {session.materials}
                        </p>
                    </div>
                )}

                {/* Timeline */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 flex items-center gap-2">
                        <Clock size={18} />
                        DÉROULEMENT
                    </div>
                    <div className="divide-y divide-slate-100">
                        {session.timeline.map((seq, idx) => (
                            <div key={seq.id} className="p-4 flex gap-4 items-start">
                                <div className="flex flex-col items-center gap-1 min-w-[3rem]">
                                    <span className="text-xs font-bold text-slate-400">SEQ {idx + 1}</span>
                                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                                        seq.type === 'ECHAUFFEMENT' ? 'bg-amber-100 text-amber-700' :
                                        seq.type === 'CALME' ? 'bg-blue-100 text-blue-700' :
                                        'bg-indigo-100 text-indigo-700'
                                    }`}>
                                        {seq.durationMin}'
                                    </span>
                                </div>
                                <div>
                                    <div className="font-bold text-slate-800">{seq.title}</div>
                                    <div className="text-xs text-slate-500 mt-0.5">{seq.type}</div>
                                </div>
                            </div>
                        ))}
                        {session.timeline.length === 0 && (
                            <div className="p-6 text-center text-slate-400 text-sm italic">Aucune séquence définie.</div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* === TAB: OBSERVATION FORM === */}
        {activeTab === 'OBSERVATION' && session.showObservationToStudents && (
            <div className="space-y-6 animate-fade-in">
                {criteria && criteria.length > 0 ? (
                    criteria.map(crit => (
                        <div key={crit.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <span className="font-bold text-slate-800 text-lg leading-tight">{crit.label}</span>
                                {crit.config.unit && <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-500 uppercase">{crit.config.unit}</span>}
                            </div>
                            
                            {/* WIDGET: BINARY (OUI/NON) */}
                            {crit.uiMode === 'BINARY' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        onClick={() => handleObserve(crit.id, { type: 'BOOLEAN', value: true })} 
                                        className={`py-5 rounded-xl font-bold transition flex flex-col items-center gap-1 min-h-[80px] justify-center shadow-sm border-2 ${localSelections[crit.id] === true ? 'bg-emerald-500 border-emerald-600 text-white scale-[1.02]' : 'bg-emerald-50 border-emerald-100 text-emerald-700 active:scale-95'}`}
                                    >
                                        <Check size={28}/> 
                                        <span className="text-sm">OUI</span>
                                    </button>
                                    <button 
                                        onClick={() => handleObserve(crit.id, { type: 'BOOLEAN', value: false })} 
                                        className={`py-5 rounded-xl font-bold transition flex flex-col items-center gap-1 min-h-[80px] justify-center shadow-sm border-2 ${localSelections[crit.id] === false ? 'bg-red-500 border-red-600 text-white scale-[1.02]' : 'bg-red-50 border-red-100 text-red-700 active:scale-95'}`}
                                    >
                                        <X size={28}/> 
                                        <span className="text-sm">NON</span>
                                    </button>
                                </div>
                            )}

                            {/* WIDGET: MULTI-CHOICE (SEGMENTED CHIPS) - UPDATED */}
                            {crit.uiMode === 'MULTI_CHOICE' && (
                                <div className="flex flex-wrap gap-2 w-full">
                                    {crit.config.options?.map(opt => {
                                        const isSelected = localSelections[crit.id] === opt.value;
                                        return (
                                            <button 
                                                key={opt.value}
                                                onClick={() => handleObserve(crit.id, { type: 'STRING', value: opt.value })}
                                                className={`
                                                    flex-1 min-w-[30%] py-4 px-3 rounded-xl border text-sm font-bold transition-all duration-200 shadow-sm min-h-[56px] flex items-center justify-center text-center break-words leading-tight
                                                    ${isSelected 
                                                        ? 'bg-indigo-600 border-indigo-700 text-white scale-[1.02] shadow-indigo-200' 
                                                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 active:scale-95'
                                                    }
                                                `}
                                            >
                                                {opt.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* WIDGET: STEPPER */}
                            {crit.uiMode === 'STEPPER' && (
                                <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-100">
                                    <div className="pl-4">
                                        <div className="text-xs text-slate-400 uppercase font-bold">Compteur</div>
                                        <div className="text-sm text-slate-600 font-medium">
                                            {localSelections[crit.id] ? `Actuel : ${localSelections[crit.id]}` : 'Appuyez pour ajouter'}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleObserve(crit.id, { type: 'COUNTER', value: (localSelections[crit.id] || 0) + 1 })} 
                                        className="w-16 h-16 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 flex items-center justify-center active:scale-90 transition hover:bg-indigo-700"
                                    >
                                        <Plus size={32} />
                                    </button>
                                </div>
                            )}

                            {/* WIDGET: SCALE / RATING */}
                            {(crit.uiMode === 'SCALE_GRADIENT' || crit.uiMode === 'RATING') && (
                                <div className="flex justify-between gap-2">
                                    {[1,2,3,4].map(n => {
                                        const isSelected = localSelections[crit.id] === n;
                                        return (
                                            <button 
                                                key={n} 
                                                onClick={() => handleObserve(crit.id, { type: 'RATING', value: n })} 
                                                className={`
                                                    flex-1 py-4 border-2 rounded-xl font-bold text-xl min-h-[60px] transition-all
                                                    ${isSelected 
                                                        ? 'bg-indigo-600 border-indigo-600 text-white scale-110 shadow-lg z-10' 
                                                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 active:scale-95'
                                                    }
                                                `}
                                            >
                                                {n}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
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