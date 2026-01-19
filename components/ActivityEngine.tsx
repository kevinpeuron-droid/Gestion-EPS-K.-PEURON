import React from 'react';
import { AppModuleType, Student, Observation } from '../types';
import { ChronoPlijadour } from './ChronoPlijadour';
import { OrientationMinguen } from './OrientationMinguen';
import { AlertCircle } from 'lucide-react';

interface Props {
  engineType: AppModuleType;
  students: Student[];
  onSaveObservation: (obs: Omit<Observation, 'id' | 'timestamp'>) => void;
}

/**
 * ACTIVITY ENGINE (Router)
 * 
 * Ce composant agit comme un "Switch" géant.
 * Il reçoit le type de moteur demandé par le Kernel et charge le composant React correspondant.
 * 
 * Avantages :
 * - Isolation totale du code : Plijadour ne sait rien de Minguen.
 * - Performance : On ne charge que ce qui est nécessaire.
 * - Scalabilité : Pour ajouter "Escalade", il suffit d'ajouter un case ici.
 */
export const ActivityEngine: React.FC<Props> = ({ engineType, students, onSaveObservation }) => {
  
  switch (engineType) {
    case 'PLIJADOUR':
      return (
        <ChronoPlijadour 
          students={students}
          onSaveObservation={onSaveObservation}
        />
      );

    case 'MINGUEN':
      return (
        <OrientationMinguen 
          students={students}
          onSaveObservation={onSaveObservation}
        />
      );

    case 'CUSTOM_HTML':
      // Placeholder pour future injection de code HTML brut
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <div className="text-4xl mb-4">🧩</div>
            <h2 className="text-xl font-bold">Module HTML Personnalisé</h2>
            <p>Ce module n'est pas encore implémenté.</p>
        </div>
      );

    case 'STANDARD':
    default:
      // Pour le mode standard, le moteur ne rend rien ici.
      // C'est le CAModule qui gère l'affichage des onglets classiques.
      return (
          <div className="flex flex-col items-center justify-center h-full text-red-400">
              <AlertCircle size={48} className="mb-4" />
              <p>Erreur de configuration moteur.</p>
          </div>
      );
  }
};
