import React, { useState } from 'react';
import { useEPSKernel } from '../hooks/useEPSKernel';
import { Save, AlertTriangle, Clock, Target, Box, Plus, Trash, Share2, Eye, EyeOff, Smartphone } from 'lucide-react';
import { SessionSequence } from '../types';

interface Props {
  kernel: ReturnType<typeof useEPSKernel>;
}

export const SessionPlanner: React.FC<Props> = ({ kernel }) => {
  const { currentSession, updateSession } = kernel;
  
  const [newSeqDuration, setNewSeqDuration] = useState(10);
  const [newSeqTitle, setNewSeqTitle] = useState('');
  const [newSeqType, setNewSeqType] = useState<SessionSequence['type']>('CORPS');

  // PROTECTION : Timeline par défaut vide si undefined
  const timeline = currentSession.timeline || [];
  const variables = currentSession.variables || { simplify: '', complexify: '' };

  const addSequence = () => {
    if (!newSeqTitle) return;
    const newSeq: SessionSequence = {
      id: crypto.randomUUID(),
      title: newSeqTitle,
      durationMin: newSeqDuration,
      type: newSeqType
    };
    updateSession({ timeline: [...timeline, newSeq] });
    setNewSeqTitle('');
  };

  const removeSequence = (id: string) => {
    updateSession({ timeline: timeline.filter(s => s.id !== id) });
  };

  const totalTime = timeline.reduce((acc, curr) => acc + curr.durationMin, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div>
            <h2 className="text-2xl font-bold text-slate-800">Concepteur de Séance</h2>
            <p className="text-slate-500">Préparez votre intervention : <span className="font-semibold text-indigo-600">{currentSession.activity}</span> ({currentSession.group})</p>
         </div>
         <div className="flex items-center gap-3">
             <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 shadow-sm transition font-medium text-sm">
                 <Save size={18} /> Sauvegarder
             </button>
         </div>
      </div>

      {/* STUDENT VISIBILITY */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><Share2 size={24} /></div>
            <div>
                <h3 className="font-bold text-slate-800">Diffusion Élèves</h3>
                <p className="text-xs text-slate-500">Contrôlez ce qui apparaît sur les tablettes.</p>
            </div>
         </div>

         <div className="flex gap-4">
             <label className={`cursor-pointer flex items-center gap-3 px-4 py-2 rounded-lg border-2 transition-all select-none ${currentSession.showSessionToStudents ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                 <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={currentSession.showSessionToStudents}
                    onChange={(e) => updateSession({ showSessionToStudents: e.target.checked })}
                 />
                 <div className={`p-1.5 rounded-full ${currentSession.showSessionToStudents ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                     {currentSession.showSessionToStudents ? <Eye size={16} /> : <EyeOff size={16} />}
                 </div>
                 <span className={`font-bold text-sm ${currentSession.showSessionToStudents ? 'text-emerald-800' : 'text-slate-500'}`}>Fiche Séance</span>
             </label>

             <label className={`cursor-pointer flex items-center gap-3 px-4 py-2 rounded-lg border-2 transition-all select-none ${currentSession.showObservationToStudents ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-slate-50'}`}>
                 <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={currentSession.showObservationToStudents}
                    onChange={(e) => updateSession({ showObservationToStudents: e.target.checked })}
                 />
                 <div className={`p-1.5 rounded-full ${currentSession.showObservationToStudents ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                     <Smartphone size={16} />
                 </div>
                 <span className={`font-bold text-sm ${currentSession.showObservationToStudents ? 'text-indigo-800' : 'text-slate-500'}`}>Saisie Obs</span>
             </label>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            {/* DIDACTIQUE */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Target className="text-indigo-500" size={20}/> Choix Didactiques
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1">Simplification</label>
                        <input 
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                            value={variables.simplify}
                            onChange={e => updateSession({ variables: { ...variables, simplify: e.target.value } })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1">Complexification</label>
                        <input 
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                            value={variables.complexify}
                            onChange={e => updateSession({ variables: { ...variables, complexify: e.target.value } })}
                        />
                    </div>
                </div>
            </div>

            {/* TIMELINE */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Clock className="text-blue-500" size={20}/> Chronologie ({totalTime} min / 120)
                    </h3>
                </div>

                <div className="flex h-4 rounded-full overflow-hidden mb-6 bg-slate-100">
                    {timeline.map(seq => (
                        <div 
                            key={seq.id} 
                            style={{ width: `${(seq.durationMin / 120) * 100}%` }}
                            className={`${seq.type === 'ECHAUFFEMENT' ? 'bg-amber-400' : seq.type === 'CALME' ? 'bg-blue-400' : 'bg-indigo-500'} h-full border-r border-white`}
                        />
                    ))}
                </div>

                <div className="flex flex-col md:flex-row gap-2 items-end mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                     <input value={newSeqTitle} onChange={e => setNewSeqTitle(e.target.value)} className="flex-1 w-full p-2 rounded border border-slate-300 text-sm" placeholder="Titre séquence" />
                     <input type="number" value={newSeqDuration} onChange={e => setNewSeqDuration(Number(e.target.value))} className="w-20 p-2 rounded border border-slate-300 text-sm" />
                     <select value={newSeqType} onChange={e => setNewSeqType(e.target.value as any)} className="w-32 p-2 rounded border border-slate-300 text-sm bg-white">
                        <option value="ECHAUFFEMENT">Échauff.</option>
                        <option value="CORPS">Corps</option>
                        <option value="CALME">Calme</option>
                     </select>
                     <button onClick={addSequence} className="bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700"><Plus size={20}/></button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {timeline.map(seq => (
                        <div key={seq.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <span className="font-medium text-sm text-slate-700">{seq.title}</span>
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-bold text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">{seq.durationMin} min</span>
                                <button onClick={() => removeSequence(seq.id)} className="text-slate-400 hover:text-red-500"><Trash size={16}/></button>
                            </div>
                        </div>
                    ))}
                    {timeline.length === 0 && <div className="text-center text-slate-400 text-sm py-4 italic">Vide</div>}
                </div>
            </div>
          </div>

          <div className="space-y-6">
             <div className="bg-red-50 p-6 rounded-xl shadow-sm border border-red-200">
                <h3 className="text-lg font-bold text-red-700 mb-2 flex items-center gap-2"><AlertTriangle size={20}/> Alerte Sécurité</h3>
                <textarea 
                    className="w-full h-24 bg-white border border-red-200 rounded-lg p-3 text-sm text-red-900 placeholder-red-300 outline-none"
                    value={currentSession.safetyAlert}
                    onChange={e => updateSession({ safetyAlert: e.target.value })}
                />
             </div>
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2"><Box size={20} className="text-orange-500"/> Matériel</h3>
                <textarea 
                    className="w-full h-48 bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm outline-none"
                    value={currentSession.materials}
                    onChange={e => updateSession({ materials: e.target.value })}
                />
             </div>
          </div>
      </div>
    </div>
  );
};