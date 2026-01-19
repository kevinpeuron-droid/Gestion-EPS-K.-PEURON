import React, { useState } from 'react';
import { useEPSKernel } from '../hooks/useEPSKernel';
import { Criterion, UIMode } from '../types';
import { Plus, Trash2, Edit3, Target, Settings, Book, RefreshCcw, X } from 'lucide-react';

interface Props {
  kernel: ReturnType<typeof useEPSKernel>;
}

export const ObservationSetup: React.FC<Props> = ({ kernel }) => {
  const [newLabel, setNewLabel] = useState('');
  const [newUIMode, setNewUIMode] = useState<UIMode>('BINARY');
  const [customOptions, setCustomOptions] = useState<{label: string, value: string, color: string}[]>([]);
  const [optLabel, setOptLabel] = useState('');
  const [optColor, setOptColor] = useState('bg-slate-100 text-slate-700');

  // PROTECTION
  const criteria = kernel.criteria || [];

  const addCustomOption = () => {
    if(!optLabel) return;
    const val = optLabel.toUpperCase().substring(0, 3) + '_' + Math.floor(Math.random()*1000);
    setCustomOptions([...customOptions, { label: optLabel, value: val, color: optColor }]);
    setOptLabel('');
  };

  const handleAdd = () => {
    if (!newLabel) return;
    
    let config: any = { isBlocking: false };

    if (newUIMode === 'MULTI_CHOICE') {
        config.options = customOptions.length > 0 ? customOptions : [{label: 'A', value: 'A'}, {label: 'B', value: 'B'}];
    } else if (newUIMode === 'SCALE_GRADIENT') {
        config.min = 1; config.max = 4;
    } else if (newUIMode === 'CHRONO') {
        config.unit = 'ms';
    }

    const newCrit: Criterion = {
        id: newLabel.toUpperCase().replace(/\s+/g, '_') + '_' + Date.now(),
        label: newLabel,
        type: 'COMPLEX', 
        uiMode: newUIMode,
        config
    };

    kernel.updateCriteria([...criteria, newCrit]);
    setNewLabel('');
    setCustomOptions([]);
  };

  const handleRemove = (id: string) => {
    kernel.updateCriteria(criteria.filter(c => c.id !== id));
  };

  const loadPreset = () => {
      if(confirm(`Charger les critères par défaut pour ${kernel.currentSession.ca} ?`)) {
        kernel.applyCAPreset(kernel.currentSession.ca);
      }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-fade-in">
       <div className="flex justify-between items-center">
         <h2 className="text-2xl font-bold text-slate-800">Configuration Pédagogique</h2>
         <button onClick={loadPreset} className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg hover:bg-white border hover:border-indigo-500">
             <RefreshCcw size={18} /> Bibliothèque {kernel.currentSession.ca}
         </button>
       </div>

       {/* Editor */}
       <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 space-y-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Edit3 size={18}/> Nouvel Observable</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <input 
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Titre (ex: Qualité de frappe)"
                    className="p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <select 
                    value={newUIMode}
                    onChange={(e) => setNewUIMode(e.target.value as UIMode)}
                    className="p-3 border rounded-lg bg-white"
                >
                    <option value="BINARY">Oui / Non</option>
                    <option value="MULTI_CHOICE">Multi-Choix</option>
                    <option value="STEPPER">Compteur</option>
                    <option value="CHRONO">Chronomètre</option>
                    <option value="SCALE_GRADIENT">Note 1-4</option>
                </select>
                <button onClick={handleAdd} disabled={!newLabel} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50">
                    <Plus size={20} className="inline mr-2" /> Ajouter
                </button>
            </div>

            {newUIMode === 'MULTI_CHOICE' && (
                <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                    <div className="flex gap-2">
                        <input value={optLabel} onChange={(e) => setOptLabel(e.target.value)} placeholder="Option..." className="p-2 rounded border text-sm" />
                        <button onClick={addCustomOption} className="bg-slate-200 p-2 rounded"><Plus size={18}/></button>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {customOptions.map((opt, idx) => (
                            <span key={idx} className="text-xs px-2 py-1 rounded border bg-white flex items-center gap-1">
                                {opt.label} <button onClick={() => setCustomOptions(customOptions.filter((_, i) => i !== idx))}><X size={12}/></button>
                            </span>
                        ))}
                    </div>
                </div>
            )}
       </div>

       {/* List */}
       <div className="space-y-4">
         <h3 className="text-lg font-bold text-slate-800"><Target size={18} className="inline mr-2"/> Critères Actifs ({criteria.length})</h3>
         {criteria.length === 0 && <div className="p-8 text-center border-2 border-dashed rounded-xl bg-slate-50 text-slate-400">Aucun critère.</div>}
         
         <div className="grid gap-3">
             {criteria.map(crit => (
                 <div key={crit.id} className="flex justify-between items-center p-4 bg-white border rounded-xl shadow-sm">
                     <div className="flex items-center gap-4">
                         <div className="bg-slate-100 px-3 py-1 rounded text-xs font-bold">{crit.uiMode}</div>
                         <span className="font-bold text-slate-800">{crit.label}</span>
                     </div>
                     <button onClick={() => handleRemove(crit.id)} className="text-slate-300 hover:text-red-600"><Trash2 size={18}/></button>
                 </div>
             ))}
         </div>
       </div>
    </div>
  );
};