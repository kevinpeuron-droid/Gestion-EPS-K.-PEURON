import { useState, useMemo } from 'react';
import { ActivityCategory, CAType, ModuleTab } from '../types';

// Configuration statique des CA (Architecture de données)
export const CA_DEFINITIONS: ActivityCategory[] = [
  { id: 'CA1', label: 'CA1 : Performance', shortLabel: 'Perf.', iconName: 'Timer', color: 'text-blue-600', bgColor: 'bg-blue-50', activities: ['Demi-fond', 'Natation', 'Vitesse'] },
  { id: 'CA2', label: 'CA2 : Adaptation', shortLabel: 'Nature', iconName: 'Compass', color: 'text-emerald-600', bgColor: 'bg-emerald-50', activities: ['Course Orientation', 'Escalade'] },
  { id: 'CA3', label: 'CA3 : Artistique', shortLabel: 'Arts', iconName: 'Music', color: 'text-purple-600', bgColor: 'bg-purple-50', activities: ['Danse', 'Acrosport'] },
  { id: 'CA4', label: 'CA4 : Opposition', shortLabel: 'Duel', iconName: 'Swords', color: 'text-red-600', bgColor: 'bg-red-50', activities: ['Badminton', 'Basket-ball', 'Volley'] },
  { id: 'CA5', label: 'CA5 : Entretien', shortLabel: 'Forme', iconName: 'HeartPulse', color: 'text-orange-600', bgColor: 'bg-orange-50', activities: ['Musculation', 'Step'] }
];

export const useEPSKernel = () => {
  // 1. État de Navigation (Persistant au rechargement simple)
  const [currentActivity, setCurrentActivity] = useState<string>(() => localStorage.getItem('eps_last_activity') || 'Demi-fond');
  const [activeTab, setActiveTab] = useState<ModuleTab>('DATA');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // 2. Déduction automatique du CA
  const currentCA = useMemo(() => {
    const found = CA_DEFINITIONS.find(ca => ca.activities.includes(currentActivity));
    return found || CA_DEFINITIONS[0];
  }, [currentActivity]);

  // 3. Actions
  const selectActivity = (activity: string) => {
    setCurrentActivity(activity);
    localStorage.setItem('eps_last_activity', activity);
    // On peut imaginer reset l'onglet ou garder le même
    setActiveTab('DATA'); 
  };

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  return {
    // State
    currentActivity,
    currentCA,
    activeTab,
    isSidebarCollapsed,
    caDefinitions: CA_DEFINITIONS,

    // Setters
    setActiveTab,
    selectActivity,
    toggleSidebar
  };
};