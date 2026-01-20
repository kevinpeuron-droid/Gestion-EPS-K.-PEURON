import React from 'react';
import { EngineId } from '../types';
import { Timer, Compass, Construction } from 'lucide-react';

interface Props {
  engineId: EngineId;
  activityName: string;
}

// Composant Placeholder pour Plijadour
const PlijadourApp = ({ activityName }: { activityName: string }) => (
  <div className="h-full flex flex-col items-center justify-center bg-cyan-950 text-cyan-400 p-8 rounded-[2rem] border border-cyan-800 shadow-inner relative overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-500 to-blue-600"></div>
    <div className="z-10 text-center space-y-6 animate-enter">
      <div className="w-24 h-24 bg-cyan-900/50 rounded-full flex items-center justify-center mx-auto border border-cyan-700 shadow-[0_0_40px_rgba(34,211,238,0.2)]">
        <Timer size={48} className="text-cyan-300" />
      </div>
      <div>
        <h2 className="text-4xl font-black text-white tracking-tight mb-2">CHRONO PLIJADOUR</h2>
        <p className="text-cyan-400/80 font-mono text-sm uppercase tracking-widest">Module Natation & Vitesse</p>
      </div>
      <div className="bg-black/30 p-6 rounded-xl border border-cyan-900/50 backdrop-blur-sm max-w-md">
        <p className="text-sm text-cyan-200">
          L'application spécifique pour <span className="font-bold text-white">{activityName}</span> est chargée. 
          Interface de chronométrage multi-lignes prête.
        </p>
      </div>
      <button className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-cyan-950 font-bold rounded-lg transition shadow-lg shadow-cyan-500/20">
        Lancer la Session
      </button>
    </div>
    {/* Grid Background */}
    <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
  </div>
);

// Composant Placeholder pour Minguen
const MinguenApp = ({ activityName }: { activityName: string }) => (
  <div className="h-full flex flex-col items-center justify-center bg-emerald-950 text-emerald-400 p-8 rounded-[2rem] border border-emerald-800 shadow-inner relative overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 to-green-600"></div>
    <div className="z-10 text-center space-y-6 animate-enter">
       <div className="w-24 h-24 bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto border border-emerald-700 shadow-[0_0_40px_rgba(52,211,153,0.2)]">
        <Compass size={48} className="text-emerald-300" />
      </div>
      <div>
        <h2 className="text-4xl font-black text-white tracking-tight mb-2">MINGUEN ORIENTATION</h2>
        <p className="text-emerald-400/80 font-mono text-sm uppercase tracking-widest">Suivi Balises & CO</p>
      </div>
      <div className="bg-black/30 p-6 rounded-xl border border-emerald-900/50 backdrop-blur-sm max-w-md">
        <p className="text-sm text-emerald-200">
          Le module de cartographie pour <span className="font-bold text-white">{activityName}</span> est actif.
          Importez votre fichier de balises pour commencer.
        </p>
      </div>
      <button className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold rounded-lg transition shadow-lg shadow-emerald-500/20">
        Charger Carte
      </button>
    </div>
    {/* Topo Lines Background Effect */}
    <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
       <filter id="displacement"><feTurbulence type="turbulence" baseFrequency="0.01" numOctaves="3" result="turbulence"/><feDisplacementMap in2="turbulence" in="SourceGraphic" scale="50" xChannelSelector="R" yChannelSelector="G"/></filter>
       <circle cx="20%" cy="20%" r="200" stroke="white" strokeWidth="2" fill="none" filter="url(#displacement)" />
       <circle cx="80%" cy="80%" r="300" stroke="white" strokeWidth="2" fill="none" filter="url(#displacement)" />
    </svg>
  </div>
);

export const ExternalAppLoader: React.FC<Props> = ({ engineId, activityName }) => {
  switch (engineId) {
    case 'CHRONO_PLIJADOUR':
      return <PlijadourApp activityName={activityName} />;
    case 'MINGUEN':
      return <MinguenApp activityName={activityName} />;
    default:
      return (
        <div className="h-full flex flex-col items-center justify-center text-slate-400">
          <Construction size={48} className="mb-4 opacity-50"/>
          <p>Application non trouvée ou standard.</p>
        </div>
      );
  }
};
