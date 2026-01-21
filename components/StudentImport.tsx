import React, { useState } from 'react';
import { Student } from '../types';
import { 
  UploadCloud, Table, CheckCircle, AlertTriangle, ArrowRight, 
  FileSpreadsheet, GraduationCap, Scissors, RefreshCcw, Edit2, Save, Settings 
} from 'lucide-react';

interface Props {
  onImport: (students: Student[]) => void;
}

const CLASS_LEVELS = [
  '6ème', '5ème', '4ème', '3ème', 
  '2nde', '1ère', 'Terminale', 
  'CAP 1', 'CAP 2'
];

export const StudentImport: React.FC<Props> = ({ onImport }) => {
  // Navigation Steps: 0=Config, 1=Upload, 2=Mapping, 3=Preview
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  
  // Data State
  const [defaultGroup, setDefaultGroup] = useState<string>('2NDE 1');
  const [csvContent, setCsvContent] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  
  // Logic State
  const [isSplitMode, setIsSplitMode] = useState(false); // Mode "Nom Prénom" fusionnés
  
  // Mapping State
  const [mapping, setMapping] = useState({
    fullName: -1, // Used only if isSplitMode is true
    lastName: -1,
    firstName: -1,
    gender: -1,
    group: -1 // Optional if defaultGroup is set
  });

  // Preview State (Editable)
  const [previewData, setPreviewData] = useState<Student[]>([]);

  // --- STEP 0: CONFIGURATION ---
  const handleConfigSubmit = () => {
    if (defaultGroup.trim()) setStep(1);
  };

  // --- STEP 1: READ FILE ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const firstLine = text.split('\n')[0];
      const separator = firstLine.includes(';') ? ';' : ',';
      const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
      const data = lines.map(line => line.split(separator).map(cell => cell.trim()));

      if (data.length > 0) {
        setHeaders(data[0]);
        setCsvContent(data.slice(1));
        
        // Auto-detect mapping
        const newMapping = { ...mapping };
        let foundSplit = false;

        data[0].forEach((h, idx) => {
            const lowerH = h.toLowerCase();
            // Detect merged column
            if ((lowerH.includes('nom') && lowerH.includes('prénom')) || lowerH.includes('élève') || lowerH.includes('identite')) {
                newMapping.fullName = idx;
                foundSplit = true;
            }
            if (lowerH.includes('nom') && !lowerH.includes('prénom')) newMapping.lastName = idx;
            if (lowerH.includes('prénom') || lowerH.includes('prenom')) newMapping.firstName = idx;
            if (lowerH.includes('sexe') || lowerH.includes('genre') || lowerH.includes('civilite')) newMapping.gender = idx;
            if (lowerH.includes('classe') || lowerH.includes('groupe')) newMapping.group = idx;
        });

        if (foundSplit) setIsSplitMode(true);
        setMapping(newMapping);
        setStep(2);
      }
    };
    reader.readAsText(file);
  };

  // --- HELPERS ---
  const normalizeGender = (val: string): 'M' | 'F' => {
      if(!val) return 'M';
      const v = val.toLowerCase();
      if (v.startsWith('f') || v.includes('fille') || v.includes('w') || v === 'mme') return 'F';
      return 'M';
  };

  const smartSplitName = (fullName: string): { last: string, first: string } => {
      // Cas 1 : Séparateur virgule (DUPONT, Jean)
      if (fullName.includes(',')) {
          const [a, b] = fullName.split(',');
          return { last: a.trim().toUpperCase(), first: b.trim() };
      }
      
      // Cas 2 : Espaces (DUPONT Jean)
      // Heuristique simple : Le premier mot est le nom (souvent en MAJ dans les fichiers admin)
      // Ou on coupe au premier espace.
      const parts = fullName.trim().split(/\s+/);
      if (parts.length === 1) return { last: parts[0].toUpperCase(), first: '' };
      
      const last = parts[0].toUpperCase();
      const first = parts.slice(1).join(' '); // Tout le reste est le prénom
      return { last, first };
  };

  // --- STEP 2: GENERATE PREVIEW ---
  const generatePreview = () => {
    // Validation
    if (isSplitMode && mapping.fullName === -1) {
        alert("Veuillez sélectionner la colonne contenant 'Nom Prénom'.");
        return;
    }
    if (!isSplitMode && (mapping.lastName === -1 || mapping.firstName === -1)) {
        alert("Veuillez mapper les colonnes Nom et Prénom.");
        return;
    }

    const students: Student[] = csvContent.map((row) => {
        let lastName = 'INCONNU';
        let firstName = 'Inconnu';
        
        // Logic Name
        if (isSplitMode) {
            const rawName = row[mapping.fullName] || '';
            const split = smartSplitName(rawName);
            lastName = split.last;
            firstName = split.first;
        } else {
            lastName = row[mapping.lastName]?.toUpperCase() || 'INCONNU';
            firstName = row[mapping.firstName] || 'Inconnu';
        }

        // Logic Group (Priorité : Colonne CSV > Valeur par défaut)
        let group = defaultGroup;
        if (mapping.group !== -1 && row[mapping.group]) {
            group = row[mapping.group];
        }

        return {
            id: crypto.randomUUID(),
            lastName,
            firstName,
            gender: mapping.gender !== -1 ? normalizeGender(row[mapping.gender]) : 'M',
            group: group.toUpperCase()
        };
    }).filter(s => s.lastName !== 'INCONNU' && s.lastName !== '');

    setPreviewData(students);
    setStep(3);
  };

  // --- STEP 3: EDIT & FINALIZE ---
  const updatePreviewStudent = (id: string, field: keyof Student, value: string) => {
      setPreviewData(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const finalizeImport = () => {
      onImport(previewData);
      // Reset complet
      setStep(0);
      setCsvContent([]);
      setPreviewData([]);
      setIsSplitMode(false);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 animate-enter">
        
        {/* PROGRESS BAR */}
        <div className="flex items-center justify-center gap-2 mb-8">
            {[0, 1, 2, 3].map(s => (
                <div key={s} className={`flex items-center ${s < 3 ? 'w-full max-w-[80px]' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        {s === 0 ? <Settings size={14}/> : s}
                    </div>
                    {s < 3 && <div className={`h-1 flex-1 mx-2 rounded ${step > s ? 'bg-indigo-600' : 'bg-slate-100'}`} />}
                </div>
            ))}
        </div>

        {/* --- STEP 0: PRE-CONFIG --- */}
        {step === 0 && (
            <div className="text-center space-y-8 py-6 max-w-lg mx-auto">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <GraduationCap size={40} />
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-slate-800">Configuration de la Classe</h3>
                    <p className="text-slate-500 mt-2">
                        Pour simplifier l'import, définissez le niveau ou la classe par défaut.
                        Cette valeur sera appliquée si le fichier ne contient pas de colonne "Classe".
                    </p>
                </div>
                
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-left space-y-4">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nom de la Classe / Groupe</label>
                    <div className="flex gap-2">
                        <input 
                           value={defaultGroup}
                           onChange={(e) => setDefaultGroup(e.target.value)}
                           className="flex-1 p-3 border-2 border-slate-200 rounded-xl font-bold text-slate-800 focus:border-indigo-500 outline-none"
                           placeholder="Ex: 2NDE 1"
                        />
                        <select 
                            onChange={(e) => setDefaultGroup(e.target.value)}
                            className="w-32 p-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-600 outline-none"
                        >
                            <option value="">Rapide...</option>
                            {CLASS_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>
                </div>

                <button 
                    onClick={handleConfigSubmit}
                    disabled={!defaultGroup}
                    className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 hover:scale-[1.02] transition disabled:opacity-50 disabled:scale-100"
                >
                    Continuer vers l'Upload <ArrowRight className="inline ml-2" size={18}/>
                </button>
            </div>
        )}

        {/* --- STEP 1: UPLOAD --- */}
        {step === 1 && (
            <div className="text-center space-y-6 py-10">
                <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UploadCloud size={40} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">Importer le fichier CSV</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                    Classe cible : <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{defaultGroup}</span>
                </p>
                <label className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 cursor-pointer shadow-lg shadow-indigo-200 hover:scale-105 transition">
                    <FileSpreadsheet size={20} />
                    Choisir un fichier
                    <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                </label>
                <button onClick={() => setStep(0)} className="block mx-auto text-sm text-slate-400 hover:text-slate-600 underline">Changer la classe</button>
            </div>
        )}

        {/* --- STEP 2: MAPPING --- */}
        {step === 2 && (
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isSplitMode ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-slate-400 border'}`}>
                            <Scissors size={20} />
                        </div>
                        <div>
                            <div className="font-bold text-slate-800">Mode Découpage Automatique</div>
                            <div className="text-xs text-slate-500">Pour les fichiers avec une colonne "NOM Prénom" unique.</div>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={isSplitMode} onChange={(e) => setIsSplitMode(e.target.checked)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        <span className="ml-3 text-sm font-medium text-slate-600">{isSplitMode ? 'Activé' : 'Désactivé'}</span>
                    </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* NOM / PRENOM */}
                    {isSplitMode ? (
                         <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-bold text-indigo-600 uppercase flex items-center gap-2"><Scissors size={14}/> Colonne fusionnée (Nom Prénom)</label>
                            <select 
                                value={mapping.fullName}
                                onChange={(e) => setMapping(prev => ({...prev, fullName: parseInt(e.target.value)}))}
                                className={`w-full p-3 rounded-lg border-2 outline-none font-bold ${mapping.fullName === -1 ? 'border-red-300 bg-red-50 text-red-700' : 'border-emerald-300 bg-emerald-50 text-emerald-700'}`}
                            >
                                <option value={-1}>-- Sélectionner la colonne --</option>
                                {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                            </select>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Champ NOM</label>
                                <select 
                                    value={mapping.lastName}
                                    onChange={(e) => setMapping(prev => ({...prev, lastName: parseInt(e.target.value)}))}
                                    className={`w-full p-3 rounded-lg border-2 outline-none font-bold ${mapping.lastName === -1 ? 'border-red-300 bg-red-50 text-red-700' : 'border-emerald-300 bg-emerald-50 text-emerald-700'}`}
                                >
                                    <option value={-1}>-- Sélectionner --</option>
                                    {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Champ PRÉNOM</label>
                                <select 
                                    value={mapping.firstName}
                                    onChange={(e) => setMapping(prev => ({...prev, firstName: parseInt(e.target.value)}))}
                                    className={`w-full p-3 rounded-lg border-2 outline-none font-bold ${mapping.firstName === -1 ? 'border-red-300 bg-red-50 text-red-700' : 'border-emerald-300 bg-emerald-50 text-emerald-700'}`}
                                >
                                    <option value={-1}>-- Sélectionner --</option>
                                    {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                                </select>
                            </div>
                        </>
                    )}

                    {/* SEXE */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Champ SEXE (Optionnel)</label>
                        <select 
                            value={mapping.gender}
                            onChange={(e) => setMapping(prev => ({...prev, gender: parseInt(e.target.value)}))}
                            className="w-full p-3 rounded-lg border border-slate-300 outline-none font-medium bg-white"
                        >
                            <option value={-1}>-- Par défaut (M) --</option>
                            {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                        </select>
                    </div>

                    {/* CLASSE */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Champ CLASSE (Optionnel)</label>
                        <select 
                            value={mapping.group}
                            onChange={(e) => setMapping(prev => ({...prev, group: parseInt(e.target.value)}))}
                            className="w-full p-3 rounded-lg border border-slate-300 outline-none font-medium bg-white"
                        >
                            <option value={-1}>Utiliser "{defaultGroup}"</option>
                            {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
                    <button onClick={() => setStep(1)} className="text-slate-500 hover:text-slate-800 font-medium">Retour</button>
                    <button 
                        onClick={generatePreview}
                        className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 hover:scale-105 transition"
                    >
                        Prévisualiser <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        )}

        {/* --- STEP 3: PREVIEW & EDIT --- */}
        {step === 3 && (
            <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <CheckCircle className="text-emerald-500"/> Vérification des données
                        </h3>
                        <p className="text-slate-500 text-sm mt-1">
                            Vous pouvez modifier directement les cases ci-dessous pour corriger le découpage.
                        </p>
                    </div>
                    <button onClick={() => setStep(2)} className="text-sm text-slate-500 hover:text-indigo-600 bg-slate-50 px-3 py-2 rounded-lg border">Modifier Mapping</button>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-inner overflow-hidden max-h-[450px] overflow-y-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 text-slate-500 font-bold uppercase sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-4 w-1/3">Nom <Edit2 size={12} className="inline opacity-50 ml-1"/></th>
                                <th className="p-4 w-1/3">Prénom <Edit2 size={12} className="inline opacity-50 ml-1"/></th>
                                <th className="p-4 w-24">Sexe</th>
                                <th className="p-4">Classe</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {previewData.map((s) => (
                                <tr key={s.id} className="hover:bg-slate-50 transition group">
                                    <td className="p-2">
                                        <input 
                                            value={s.lastName} 
                                            onChange={(e) => updatePreviewStudent(s.id, 'lastName', e.target.value)}
                                            className="w-full bg-transparent font-bold text-slate-800 p-2 rounded hover:bg-white focus:bg-white focus:ring-2 ring-indigo-200 outline-none uppercase"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input 
                                            value={s.firstName} 
                                            onChange={(e) => updatePreviewStudent(s.id, 'firstName', e.target.value)}
                                            className="w-full bg-transparent font-medium text-slate-700 p-2 rounded hover:bg-white focus:bg-white focus:ring-2 ring-indigo-200 outline-none"
                                        />
                                    </td>
                                    <td className="p-4">
                                        <button 
                                            onClick={() => updatePreviewStudent(s.id, 'gender', s.gender === 'M' ? 'F' : 'M')}
                                            className={`px-2 py-1 rounded text-xs font-bold cursor-pointer hover:opacity-80 ${s.gender === 'M' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}
                                        >
                                            {s.gender}
                                        </button>
                                    </td>
                                    <td className="p-4 font-mono text-slate-500 text-xs">
                                        {s.group}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex items-center gap-4 bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-800 text-sm">
                    <AlertTriangle size={24} className="shrink-0" />
                    <p>
                        <strong>Attention :</strong> Vérifiez bien le découpage Nom/Prénom. 
                        Les élèves existants (même nom+prénom+classe) seront mis à jour, les autres seront ajoutés.
                    </p>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                    <button 
                         onClick={() => setStep(0)}
                         className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition"
                    >
                        Annuler
                    </button>
                    <button 
                        onClick={finalizeImport}
                        className="flex items-center gap-2 px-8 py-4 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-200 hover:scale-105 transition"
                    >
                        <Save size={20} />
                        Importer {previewData.length} élèves
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};