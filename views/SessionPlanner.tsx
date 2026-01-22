import React from 'react';
import { useEPSKernel } from '../hooks/useEPSKernel';
import { ExternalLink, FileText, AlertTriangle, BookOpenCheck } from 'lucide-react';

interface Props {
  kernel: ReturnType<typeof useEPSKernel>;
}

export const SessionPlanner: React.FC<Props> = ({ kernel }) => {
  const { currentActivityConfig } = kernel;
  const link = currentActivityConfig.sessionLink;

  const handleOpen = () => {
    if(link) {
        // Ouverture sécurisée
        window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="h-full w-full flex flex-col p-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <BookOpenCheck size={28} className="text-indigo-600" />
                    Fiche de Séance
                </h2>
                <p className="text-slate-500">Document de référence pour l'enseignant.</p>
            </div>
            {link && (
                <button 
                    onClick={handleOpen}
                    className="group flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all duration-200 hover:bg-indigo-700 hover:scale-105 active:scale-95"
                    title="Ouvrir le document dans un nouvel onglet"
                >
                    <ExternalLink size={18} className="transition-transform group-hover:rotate-45" /> 
                    <span>Ouvrir la fiche</span>
                </button>
            )}
        </div>

        {/* CONTENU PRINCIPAL */}
        <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative group">
            {link ? (
                <>
                    <iframe 
                        src={link} 
                        className="w-full h-full"
                        title="Fiche Séance"
                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                    />
                    {/* Overlay indicatif si l'iframe bloque (rare mais possible) */}
                    <div className="absolute top-4 right-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur">
                        Affichage externe
                    </div>
                </>
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
                        <FileText size={48} className="text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-700 mb-2">Aucune fiche configurée</h3>
                    <p className="text-slate-500 max-w-md mx-auto mb-8">
                        Vous n'avez pas associé de document (PDF, Google Doc, etc.) à cette activité.
                        Rendez-vous dans les paramètres d'administration pour ajouter un lien.
                    </p>
                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-lg text-sm font-medium border border-amber-200">
                        <AlertTriangle size={16} />
                        Administration &gt; Gérer les activités &gt; Modifier
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};