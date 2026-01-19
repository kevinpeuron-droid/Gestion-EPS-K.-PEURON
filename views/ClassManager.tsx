import React from 'react';
import { useEPSKernel } from '../hooks/useEPSKernel';
import { parseStudentCSV } from '../utils/csvParser';
import { Upload, Users, FileSpreadsheet } from 'lucide-react';

interface Props {
  kernel: ReturnType<typeof useEPSKernel>;
}

export const ClassManager: React.FC<Props> = ({ kernel }) => {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-bold text-slate-800">Gestion des Classes</h2>
      </div>

      {/* Import Section */}
      <div className="bg-indigo-600 rounded-xl p-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><FileSpreadsheet /> Importer une liste d'élèves</h3>
            <p className="text-indigo-100 max-w-lg">
                Utilisez un fichier CSV avec les colonnes : NOM, PRENOM, SEXE, GROUPE. 
                Les élèves seront automatiquement ajoutés à la base de données.
            </p>
        </div>
        <label className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-bold shadow-sm hover:bg-indigo-50 transition cursor-pointer flex items-center gap-2">
            <Upload size={20} />
            Sélectionner un fichier CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
        </label>
      </div>

      {/* Class Lists Preview */}
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