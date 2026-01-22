
import React, { useState, useEffect } from 'react';
import { useEPSKernel } from '../hooks/useEPSKernel';
import { BookOpenCheck, Save, FileText, AlertTriangle } from 'lucide-react';
import { SessionContent } from '../types';

interface Props {
  kernel: ReturnType<typeof useEPSKernel>;
}

export const SessionPlanner: React.FC<Props> = ({ kernel }) => {
  const { currentActivity, currentSessionContent, updateSessionContent } = kernel;
  
  // Local state pour l'édition fluide
  const [content, setContent] = useState<SessionContent>(currentSessionContent);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Sync avec le Kernel si l'activité change
  useEffect(() => {
    setContent(currentSessionContent);
    setHasUnsavedChanges(false);
  }, [currentActivity, currentSessionContent]);

  const handleChange = (field: keyof SessionContent, value: string) => {
    setContent(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    updateSessionContent(currentActivity, content);
    setHasUnsavedChanges(false);
  };

  return (
    <div className="h-full w-full flex flex-col p-6 animate-fade-in gap-6">
        
        {/* EN-TÊTE */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <BookOpenCheck size={28} className="text-indigo-600" />
                    Fiche de Séance
                </h2>
                <p className="text-slate-500">Rédigez le contenu pédagogique pour <span className="font-bold text-indigo-600">{currentActivity}</span>.</p>
            </div>
            <button 
                onClick={handleSave}
                disabled={!hasUnsavedChanges}
                className={`flex items-center gap-2 px-6 py-3 font-bold rounded-xl transition shadow-lg ${hasUnsavedChanges ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 scale-105' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
            >
                <Save size={18} />
                {hasUnsavedChanges ? 'Enregistrer les modifications' : 'Tout est sauvegardé'}
            </button>
        </div>

        {/* ÉDITEUR BENTO GRID */}
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-6 overflow-y-auto pb-10">
            
            {/* OBJECTIFS */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4">
                <div className="flex items-center gap-2 text-indigo-600 font-bold uppercase tracking-wider text-sm">
                    <FileText size={16} /> Objectifs & Compétences
                </div>
                <textarea 
                    value={content.objectives}
                    onChange={(e) => handleChange('objectives', e.target.value)}
                    placeholder="Quels sont les objectifs de la séance ?"
                    className="flex-1 w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 resize-none font-medium text-slate-700"
                />
            </div>

            {/* ÉCHAUFFEMENT */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4">
                <div className="flex items-center gap-2 text-amber-600 font-bold uppercase tracking-wider text-sm">
                    <FileText size={16} /> Échauffement
                </div>
                <textarea 
                    value={content.warmUp}
                    onChange={(e) => handleChange('warmUp', e.target.value)}
                    placeholder="Description de l'échauffement..."
                    className="flex-1 w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-200 resize-none font-medium text-slate-700"
                />
            </div>

            {/* SITUATIONS */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4 xl:col-span-2 min-h-[300px]">
                <div className="flex items-center gap-2 text-emerald-600 font-bold uppercase tracking-wider text-sm">
                    <FileText size={16} /> Situations d'Apprentissage
                </div>
                <textarea 
                    value={content.situations}
                    onChange={(e) => handleChange('situations', e.target.value)}
                    placeholder="Détail des exercices, rotations et consignes..."
                    className="flex-1 w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-200 resize-none font-medium text-slate-700 min-h-[200px]"
                />
            </div>

            {/* BILAN / ÉVALUATION */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4 xl:col-span-2">
                <div className="flex items-center gap-2 text-rose-600 font-bold uppercase tracking-wider text-sm">
                    <FileText size={16} /> Bilan & Critères de Réussite
                </div>
                <textarea 
                    value={content.assessment}
                    onChange={(e) => handleChange('assessment', e.target.value)}
                    placeholder="Comment évaluer la réussite de la séance ?"
                    className="flex-1 w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-200 resize-none font-medium text-slate-700 h-32"
                />
            </div>

        </div>
    </div>
  );
};
