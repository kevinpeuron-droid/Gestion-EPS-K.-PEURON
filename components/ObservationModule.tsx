
import React, { useState } from 'react';
import { useEPSKernel } from '../hooks/useEPSKernel';
import { Criterion, UIMode } from '../types';
import { Plus, Trash2, Check, X, Settings2, Eye, LayoutList, List } from 'lucide-react';

interface Props {
  kernel: ReturnType<typeof useEPSKernel>;
}

export const ObservationModule: React.FC<Props> = ({ kernel }) => {
  const { criteria, updateCriteria, currentActivity } = kernel;
  
  // State pour le formulaire d'ajout
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<UIMode>('BINARY');
  const [multiOptions, setMultiOptions] = useState(''); // "A, B, C"

  const handleAddCriterion = () => {
    if (!newLabel.trim()) return;

    let config: any = {};
    if (newType === 'MULTI_CHOICE') {
      // Parse des options séparées par virgule
      const opts = multiOptions.split(',').map(s => s.trim()).filter(s => s);
      if (opts.length === 0) {
        alert("Veuillez saisir des options (ex: Acquis, En cours, Non Acquis)");
        return;
      }
      config.options = opts.map(o => ({ label: o, value: o }));
    }

    const newCrit: Criterion = {
      id: crypto.randomUUID(),
      label: newLabel,
      type: 'SIMPLE',
      uiMode: newType,
      config
    };

    updateCriteria([...criteria, newCrit]);
    setNewLabel('');
    setMultiOptions('');
  };

  const handleDeleteCriterion = (id: string) => {
    updateCriteria(criteria.filter(c => c.id !== id));
  };

  return (
    <div className="h-full w-full flex flex-col p-6 animate-fade-in gap-8">
        
        {/* EN-TÊTE */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Settings2 size={28} className="text-emerald-600" />
                    Grille d'Observation Native
                </h2>
                <p className="text-slate-500">Créez vos indicateurs d'évaluation pour <span className="font-bold text-emerald-600">{currentActivity}</span>.</p>
            </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-8 h-full overflow-hidden">
            
            {/* ZONE GAUCHE : ÉDITEUR */}
            <div className="flex-1 flex flex-col gap-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm overflow-y-auto">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <LayoutList size={20} className="text-indigo-500"/>
                    Éditeur de Critères
                </h3>

                {/* Formulaire d'ajout */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Titre du critère</label>
                        <input 
                            value={newLabel}
                            onChange={(e) => setNewLabel(e.target.value)}
                            placeholder="Ex: Respect de la zone, Prise d'élan..."
                            className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Type d'évaluation</label>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setNewType('BINARY')}
                                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm border-2 transition ${newType === 'BINARY' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                            >
                                <Check size={16} className="inline mr-2 mb-0.5"/> Binaire (Oui/Non)
                            </button>
                            <button 
                                onClick={() => setNewType('MULTI_CHOICE')}
                                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm border-2 transition ${newType === 'MULTI_CHOICE' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                            >
                                <List size={16} className="inline mr-2 mb-0.5"/> Échelle / Choix
                            </button>
                        </div>
                    </div>

                    {newType === 'MULTI_CHOICE' && (
                        <div className="animate-enter">
                            <label className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1 block">Options (séparées par virgule)</label>
                            <input 
                                value={multiOptions}
                                onChange={(e) => setMultiOptions(e.target.value)}
                                placeholder="Ex: Acquis, En cours, Non Acquis"
                                className="w-full p-3 bg-white border-2 border-indigo-100 rounded-xl font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    )}

                    <button 
                        onClick={handleAddCriterion}
                        disabled={!newLabel}
                        className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-emerald-100"
                    >
                        <Plus size={20} className="inline mr-2" /> Ajouter ce critère
                    </button>
                </div>

                {/* Liste existante */}
                <div className="space-y-3">
                    {criteria.map((crit, idx) => (
                        <div key={crit.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-slate-300 transition group">
                            <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                                <div>
                                    <div className="font-bold text-slate-800">{crit.label}</div>
                                    <div className="text-xs text-slate-400 font-medium">
                                        {crit.uiMode === 'BINARY' ? 'Oui / Non' : `Choix multiples (${crit.config.options?.length})`}
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleDeleteCriterion(crit.id)}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                    {criteria.length === 0 && (
                        <div className="text-center p-8 text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            Aucun critère défini pour le moment.
                        </div>
                    )}
                </div>
            </div>

            {/* ZONE DROITE : APERÇU ÉLÈVE */}
            <div className="flex-1 bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-4 opacity-50">
                    <Eye size={120} className="text-white/5" />
                </div>
                
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2 relative z-10">
                    <Eye size={20} className="text-emerald-400"/>
                    Aperçu Interface Élève
                </h3>

                <div className="space-y-6 relative z-10">
                    {criteria.map(crit => (
                        <div key={crit.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                            <div className="font-bold text-lg mb-4">{crit.label}</div>
                            
                            {/* Rendu Binaire */}
                            {crit.uiMode === 'BINARY' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <button className="py-4 bg-emerald-500/20 border border-emerald-500 text-emerald-4