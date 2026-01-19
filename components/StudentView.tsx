import React, { useState } from 'react';
import { Student, Observation, CAType, Criterion } from '../types';
import { Plus, Check, X, ArrowLeft, AlertTriangle } from 'lucide-react';

interface Props {
  students: Student[];
  onObserve: (obs: Omit<Observation, 'id' | 'timestamp'>) => void;
  sessionId: string;
  activeCA: CAType;
  criteria?: Criterion[];
}

export const StudentView: React.FC<Props> = ({ students, onObserve, sessionId, activeCA, criteria = [] }) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const handleObserve = (variableName: string, value: any) => {
    if (!selectedStudentId) return;
    onObserve({
      sessionId,
      studentId: selectedStudentId,
      variableName,
      value,
      authorRole: 'ELEVE'
    });
  };

  if (!selectedStudentId) {
    return (
      <div className="flex flex-col h-full bg-slate-50">
        <div className="p-4">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Qui observes-tu ?</h2>
            <div className="space-y-3">
            {students.map(student => (
                <button
                key={student.id}
                onClick={() => setSelectedStudentId(student.id)}
                className="w-full bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between active:scale-95 transition-transform"
                >
                <div className="text-left">
                    <div className="font-bold text-slate-900">{student.firstName} {student.lastName}</div>
                    <div className="text-sm text-slate-500">{student.group}</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <ArrowLeft className="rotate-180" size={16} />
                </div>
                </button>
            ))}
            </div>
        </div>
      </div>
    );
  }

  const currentStudent = students.find(s => s.id === selectedStudentId);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white p-4 border-b border-slate-200 flex items-center gap-3 sticky top-0 z-10">
        <button 
            onClick={() => setSelectedStudentId(null)}
            className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition"
        >
            <ArrowLeft size={24} className="text-slate-600" />
        </button>
        <div>
            <div className="text-xs font-bold text-slate-500 uppercase">En observation</div>
            <div className="text-lg font-bold text-slate-900 leading-none">{currentStudent?.firstName}</div>
        </div>
      </div>

      <div className="p-4 space-y-6 overflow-y-auto pb-20">
        {criteria && criteria.length > 0 ? (
            criteria.map(crit => (
                <div key={crit.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-slate-800 text-lg">{crit.label}</span>
                        {crit.config.unit && <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-500">{crit.config.unit}</span>}
                    </div>
                    
                    {crit.uiMode === 'BINARY' && (
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => handleObserve(crit.id, { type: 'BOOLEAN', value: true })} className="py-4 bg-emerald-50 border-2 border-emerald-100 text-emerald-700 rounded-xl font-bold active:bg-emerald-100 active:border-emerald-300 transition flex flex-col items-center gap-1">
                                <Check size={24}/> OUI
                            </button>
                            <button onClick={() => handleObserve(crit.id, { type: 'BOOLEAN', value: false })} className="py-4 bg-red-50 border-2 border-red-100 text-red-700 rounded-xl font-bold active:bg-red-100 active:border-red-300 transition flex flex-col items-center gap-1">
                                <X size={24}/> NON
                            </button>
                        </div>
                    )}

                    {crit.uiMode === 'MULTI_CHOICE' && (
                         <div className="grid grid-cols-2 gap-2">
                            {crit.config.options?.map(opt => (
                                <button 
                                    key={opt.value}
                                    onClick={() => handleObserve(crit.id, { type: 'STRING', value: opt.value })}
                                    className={`py-3 px-2 rounded-lg border-2 text-sm font-bold active:scale-95 transition ${opt.color ? opt.color.replace('text-', 'border-').replace('bg-', 'bg-opacity-10 ') : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                         </div>
                    )}

                    {crit.uiMode === 'STEPPER' && (
                        <div className="flex items-center justify-center gap-6">
                            <button onClick={() => handleObserve(crit.id, { type: 'COUNTER', value: 1 })} className="w-16 h-16 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-200 flex items-center justify-center active:scale-90 transition">
                                <Plus size={32} />
                            </button>
                            <div className="text-center">
                                <div className="text-xs text-slate-400 uppercase">Ajouter</div>
                                <div className="font-bold text-slate-700">1 rep</div>
                            </div>
                        </div>
                    )}

                    {(crit.uiMode === 'SCALE_GRADIENT' || crit.uiMode === 'RATING') && (
                        <div className="flex justify-between gap-1">
                            {[1,2,3,4].map(n => (
                                <button key={n} onClick={() => handleObserve(crit.id, { type: 'RATING', value: n })} className="flex-1 py-3 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-600 active:bg-indigo-600 active:text-white transition">
                                    {n}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Fallback for complex widgets not fully implemented in this view */}
                    {['CHRONO', 'TIMER_HOLD', 'HEATMAP_ZONE'].includes(crit.uiMode) && (
                         <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 text-orange-800 text-sm flex items-center gap-2">
                            <AlertTriangle size={16} />
                            <span>Widget {crit.uiMode} simplifié pour mobile.</span>
                            <button onClick={() => handleObserve(crit.id, { type: 'STRING', value: 'DONE' })} className="ml-auto bg-white border border-orange-200 px-3 py-1 rounded text-xs font-bold shadow-sm">
                                Noter
                            </button>
                         </div>
                    )}
                </div>
            ))
        ) : (
            <div className="text-center p-8 bg-white rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-500">Aucun critère d'observation configuré pour cette séance.</p>
            </div>
        )}
      </div>
    </div>
  );
};