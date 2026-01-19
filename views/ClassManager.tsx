import React, { useState } from 'react';
import { useEPSKernel } from '../hooks/useEPSKernel';
import { parseStudentCSV } from '../utils/csvParser';
import { analyzeOrientationCSV, StudentAnalysis } from '../utils/analysis';
import { Upload, Users, FileSpreadsheet, Activity, Table, Download } from 'lucide-react';

interface Props {
  kernel: ReturnType<typeof useEPSKernel>;
}

export const ClassManager: React.FC<Props> = ({ kernel }) => {
  const [analysisResults, setAnalysisResults] = useState<StudentAnalysis[]>([]);

  // Import Élèves (Classique)
  const handleStudentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          const students = parseStudentCSV(evt.target.result as string);
          kernel.importStudents(students);
          alert(`${students.length} élèves importés avec succès.`);
        }
      };
      reader.readAsText(file);
    }
  };

  // Import Analyse (Spécial Orientation)
  const handleAnalysisUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          const results = analyzeOrientationCSV(evt.target.result as string);
          setAnalysisResults(results);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-bold text-slate-800">Gestion des Classes</h2>
      </div>

      {/* ZONE 1 : Importation Elèves */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
            <Users className="text-indigo-600" size={20}/> 
            Création de Liste (Base Élèves)
        </h3>
        <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1 text-sm text-slate-500">
                Importez votre fichier CSV standard (ENT) pour peupler la base de données.
                <br/>Format attendu : <code>NOM, PRENOM, SEXE, GROUPE</code>
            </div>
            <label className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-bold border border-indigo-200 hover:bg-indigo-100 transition cursor-pointer flex items-center gap-2">
                <Upload size={18} />
                Importer Liste Élèves
                <input type="file" accept=".csv" className="hidden" onChange={handleStudentUpload} />
            </label>
        </div>
      </div>

      {/* ZONE 2 : Laboratoire d'Analyse (NOUVEAU) */}
      <div className="bg-slate-900 rounded-xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-6">
            <div>
                <h3 className="text-xl font-bold flex items-center gap-2 mb-2">
                    <Activity className="text-emerald-400" /> 
                    Laboratoire d'Analyse : Course d'Orientation
                </h3>
                <p className="text-slate-300 text-sm max-w-xl">
                    Importez les données brutes de "Chrono EPS Pro" (ou format compatible). 
                    Le système applique automatiquement les filtres AFLP : Profils (Expert/Prudent), Maîtrise (D1-D4) et Conseils.
                </p>
            </div>
            <label className="bg-emerald-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-emerald-600 transition cursor-pointer flex items-center gap-2 transform hover:scale-105">
                <FileSpreadsheet size={20} />
                Analyser CSV Orientation
                <input type="file" accept=".csv" className="hidden" onChange={handleAnalysisUpload} />
            </label>
        </div>

        {analysisResults.length > 0 && (
            <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-slate-700 text-slate-300 uppercase text-xs tracking-wider">
                                <th className="p-4">Nom de l'élève</th>
                                <th className="p-4">Maîtrise</th>
                                <th className="p-4">Profil Stratégique</th>
                                <th className="p-4">Fiabilité</th>
                                <th className="p-4">Conseil Régulation</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {analysisResults.map((row) => (
                                <tr key={row.id} className="hover:bg-slate-700/50 transition">
                                    <td className="p-4 font-bold text-white">{row.name}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded font-bold text-xs ${
                                            row.mastery === 'D4' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' :
                                            row.mastery === 'D3' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' :
                                            row.mastery === 'D2' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' :
                                            'bg-red-500/20 text-red-400 border border-red-500/50'
                                        }`}>
                                            {row.mastery}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-300">{row.profile}</td>
                                    <td className="p-4 font-mono text-slate-400">{row.reliabilityIndex}</td>
                                    <td className="p-4 text-indigo-300 italic">"{row.advice}"</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
      </div>

      {/* Class Lists Preview (Existant) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kernel.availableGroups.map(group => {
            const count = kernel.students.filter(s => s.group === group).length;
            return (
                <div key={group} className={`p-6 rounded-xl border transition ${kernel.currentSession.group === group ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : 'bg-white border-slate-200 hover:border-indigo-300'}`}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-white rounded-lg shadow-sm text-indigo-600 border border-slate-100">
                            <Users size={24} />
                        </div>
                        {kernel.currentSession.group === group && (
                            <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded-full">Actif</span>
                        )}
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-1">{group}</h3>
                    <p className="text-slate-500 mb-4">{count} élèves inscrits</p>
                    <button 
                        onClick={() => kernel.updateSession({ group })}
                        className="w-full py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 hover:text-indigo-700 transition"
                    >
                        Gérer ce groupe
                    </button>
                </div>
            )
        })}
      </div>
    </div>
  );
};