import React, { useState } from 'react';
import { Student } from '../types';
import { UploadCloud, Table, CheckCircle, AlertTriangle, ArrowRight, FileSpreadsheet, RefreshCcw } from 'lucide-react';

interface Props {
  onImport: (students: Student[]) => void;
}

export const StudentImport: React.FC<Props> = ({ onImport }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [csvContent, setCsvContent] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  
  // Mapping State: which CSV column index maps to which Student field
  const [mapping, setMapping] = useState({
    lastName: -1,
    firstName: -1,
    gender: -1,
    group: -1
  });

  const [previewData, setPreviewData] = useState<Student[]>([]);

  // STEP 1: READ FILE
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      // Detect separator (comma or semicolon)
      const firstLine = text.split('\n')[0];
      const separator = firstLine.includes(';') ? ';' : ',';

      // Parse CSV
      const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
      const data = lines.map(line => line.split(separator).map(cell => cell.trim()));

      if (data.length > 0) {
        setHeaders(data[0]);
        setCsvContent(data.slice(1)); // Remove header row from content
        
        // Auto-detect mapping
        const newMapping = { ...mapping };
        data[0].forEach((h, idx) => {
            const lowerH = h.toLowerCase();
            if (lowerH.includes('nom')) newMapping.lastName = idx;
            if (lowerH.includes('prénom') || lowerH.includes('prenom')) newMapping.firstName = idx;
            if (lowerH.includes('sexe') || lowerH.includes('genre')) newMapping.gender = idx;
            if (lowerH.includes('classe') || lowerH.includes('groupe') || lowerH.includes('division')) newMapping.group = idx;
        });
        setMapping(newMapping);
        setStep(2);
      }
    };
    reader.readAsText(file);
  };

  // HELPER: NORMALIZERS
  const normalizeGender = (val: string): 'M' | 'F' => {
      const v = val.toLowerCase();
      if (v.startsWith('f') || v.includes('fille') || v.includes('w')) return 'F';
      return 'M'; // Default to Male
  };

  const normalizeGroup = (val: string): string => {
      let v = val.toUpperCase().replace(/\s/g, ''); // Remove spaces
      
      // Standardize Levels
      if (v.startsWith('6')) return v.replace('EME', 'ème').replace('6', '6ème ');
      if (v.startsWith('5')) return v.replace('EME', 'ème').replace('5', '5ème ');
      if (v.startsWith('4')) return v.replace('EME', 'ème').replace('4', '4ème ');
      if (v.startsWith('3')) return v.replace('EME', 'ème').replace('3', '3ème ');
      if (v.startsWith('2')) return v.replace('NDE', 'nde').replace('2', '2nde ');
      if (v.startsWith('1')) return v.replace('ERE', 'ère').replace('1', '1ère ');
      if (v.startsWith('T')) return v.replace('ERM', 'erm').replace('T', 'Term ');

      return val; // Return original if pattern not matched, but maybe filtered later
  };

  // STEP 2: GENERATE PREVIEW
  const generatePreview = () => {
    if (mapping.lastName === -1 || mapping.firstName === -1 || mapping.group === -1) {
        alert("Veuillez mapper au moins le Nom, le Prénom et la Classe.");
        return;
    }

    const students: Student[] = csvContent.map((row) => ({
        id: crypto.randomUUID(),
        lastName: row[mapping.lastName]?.toUpperCase() || 'INCONNU',
        firstName: row[mapping.firstName] || 'Inconnu',
        gender: mapping.gender !== -1 ? normalizeGender(row[mapping.gender]) : 'M',
        group: normalizeGroup(row[mapping.group] || 'SANS_GROUPE')
    })).filter(s => s.lastName !== 'INCONNU'); // Basic filter

    setPreviewData(students);
    setStep(3);
  };

  // STEP 3: FINALIZE
  const finalizeImport = () => {
      onImport(previewData);
      setStep(1);
      setCsvContent([]);
      setPreviewData([]);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 animate-enter">
        
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-8">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-colors ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>1</div>
            <div className="w-12 h-1 bg-slate-100 rounded">
                <div className={`h-full bg-indigo-600 transition-all ${step >= 2 ? 'w-full' : 'w-0'}`}></div>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-colors ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>2</div>
            <div className="w-12 h-1 bg-slate-100 rounded">
                <div className={`h-full bg-indigo-600 transition-all ${step >= 3 ? 'w-full' : 'w-0'}`}></div>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-colors ${step >= 3 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>3</div>
        </div>

        {/* STEP 1: UPLOAD */}
        {step === 1 && (
            <div className="text-center space-y-6 py-10">
                <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UploadCloud size={40} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">Importer un fichier CSV</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                    Téléchargez votre liste d'élèves (Format ENT, Pronote, Excel exporté en CSV).
                    Le fichier doit contenir au moins : Nom, Prénom et Classe.
                </p>
                <label className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 cursor-pointer shadow-lg shadow-indigo-200 hover:scale-105 transition">
                    <FileSpreadsheet size={20} />
                    Choisir un fichier
                    <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                </label>
            </div>
        )}

        {/* STEP 2: MAPPING */}
        {step === 2 && (
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Table className="text-indigo-500"/> Correspondance des colonnes
                    </h3>
                    <button onClick={() => setStep(1)} className="text-sm text-slate-500 hover:text-indigo-600">Recommencer</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    {/* NOM */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Champ NOM (Requis)</label>
                        <select 
                            value={mapping.lastName}
                            onChange={(e) => setMapping(prev => ({...prev, lastName: parseInt(e.target.value)}))}
                            className={`w-full p-3 rounded-lg border-2 outline-none font-bold ${mapping.lastName === -1 ? 'border-red-300 bg-red-50 text-red-700' : 'border-emerald-300 bg-emerald-50 text-emerald-700'}`}
                        >
                            <option value={-1}>-- Sélectionner la colonne --</option>
                            {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                        </select>
                    </div>

                    {/* PRENOM */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Champ PRÉNOM (Requis)</label>
                        <select 
                            value={mapping.firstName}
                            onChange={(e) => setMapping(prev => ({...prev, firstName: parseInt(e.target.value)}))}
                            className={`w-full p-3 rounded-lg border-2 outline-none font-bold ${mapping.firstName === -1 ? 'border-red-300 bg-red-50 text-red-700' : 'border-emerald-300 bg-emerald-50 text-emerald-700'}`}
                        >
                            <option value={-1}>-- Sélectionner la colonne --</option>
                            {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                        </select>
                    </div>

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
                        <label className="text-xs font-bold text-slate-500 uppercase">Champ CLASSE/GROUPE (Requis)</label>
                        <select 
                            value={mapping.group}
                            onChange={(e) => setMapping(prev => ({...prev, group: parseInt(e.target.value)}))}
                            className={`w-full p-3 rounded-lg border-2 outline-none font-bold ${mapping.group === -1 ? 'border-red-300 bg-red-50 text-red-700' : 'border-emerald-300 bg-emerald-50 text-emerald-700'}`}
                        >
                            <option value={-1}>-- Sélectionner la colonne --</option>
                            {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button 
                        onClick={generatePreview}
                        className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 hover:scale-105 transition"
                    >
                        Prévisualiser <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        )}

        {/* STEP 3: PREVIEW */}
        {step === 3 && (
            <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <CheckCircle className="text-emerald-500"/> Vérification ({previewData.length} élèves)
                    </h3>
                    <button onClick={() => setStep(2)} className="text-sm text-slate-500 hover:text-indigo-600">Modifier Mapping</button>
                </div>

                <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden max-h-[400px] overflow-y-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 text-slate-500 font-bold uppercase sticky top-0">
                            <tr>
                                <th className="p-4">Nom</th>
                                <th className="p-4">Prénom</th>
                                <th className="p-4">Sexe</th>
                                <th className="p-4">Classe</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {previewData.slice(0, 10).map((s, idx) => (
                                <tr key={idx}>
                                    <td className="p-4 font-bold">{s.lastName}</td>
                                    <td className="p-4">{s.firstName}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${s.gender === 'M' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                                            {s.gender}
                                        </span>
                                    </td>
                                    <td className="p-4 font-mono text-slate-600">{s.group}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {previewData.length > 10 && (
                        <div className="p-4 text-center text-slate-500 italic border-t border-slate-200">
                            ... et {previewData.length - 10} autres élèves.
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4 bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-800 text-sm">
                    <AlertTriangle size={24} className="shrink-0" />
                    <p>
                        <strong>Attention :</strong> L'importation fusionnera ces élèves avec la base existante.
                        Les élèves ayant le même Nom + Prénom + Classe seront mis à jour, les autres seront ajoutés.
                    </p>
                </div>

                <div className="flex justify-end gap-4">
                    <button 
                         onClick={() => setStep(1)}
                         className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition"
                    >
                        Annuler
                    </button>
                    <button 
                        onClick={finalizeImport}
                        className="flex items-center gap-2 px-8 py-4 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-200 hover:scale-105 transition"
                    >
                        <CheckCircle size={20} />
                        Confirmer l'Importation
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};
