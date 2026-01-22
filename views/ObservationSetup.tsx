import React from 'react';
import { useEPSKernel } from '../hooks/useEPSKernel';
import { ExternalLink, Eye, AlertTriangle, Settings2 } from 'lucide-react';

interface Props {
  kernel: ReturnType<typeof useEPSKernel>;
}

export const ObservationSetup: React.FC<Props> = ({ kernel }) => {
  const { currentActivityConfig } = kernel;
  const link = currentActivityConfig.observationLink;

  const handleOpen = () => {
    if(link) {
        window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="h-full w-full flex flex-col p-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Settings2 size={28} className="text-emerald-600" />
                    Grille d'Observation
                </h2>
                <p className="text-slate-500">Support d'évaluation et de recueil de données.</p>
            </div>
            {link && (
                <button 
                    onClick={handleOpen}
                    className="group flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all duration-200 hover:bg-emerald-700 hover:scale-105 active:scale-95"
                    title="Ouvrir la grille dans un nouvel onglet"
                >
                    <ExternalLink size={18} className="transition-transform group-hover:rotate-45" /> 
                    <span>Ouvrir la grille</span>
                </button>
            )}
        </div>

        {/* CONTENU PRINCIPAL */}
        <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
            {link ? (
                <iframe 
                    src={link} 
                    className="w-full h-full"
                    title="Fiche Observation"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                />
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
                        <Eye size={48} className="text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-700 mb-2">Aucune grille configurée</h3>
                    <p className="text-slate-500 max-w-md mx-auto mb-8">
                        L'outil d'observation interne a été remplacé par vos liens personnalisés (Google Sheets, Forms, PDF...).
                        Veuillez configurer l'URL dans l'administration.
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