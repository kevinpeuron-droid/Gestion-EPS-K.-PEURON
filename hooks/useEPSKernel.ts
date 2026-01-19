import { useState, useMemo } from 'react';
import { ActivityCategory, ModuleTab } from '../types';

// --- CONFIGURATION STATIQUE (Données Immuables) ---
export const CA_DEFINITIONS: ActivityCategory[] = [
  { 
    id: 'CA1', 
    label: 'Performance', 
    shortLabel: 'Perf', 
    iconName: 'Timer', 
    color: 'text-cyan-500', 
    bgColor: 'bg-cyan-500', 
    activities: ['Demi-fond', 'Natation', 'Vitesse', 'Musculation'] 
  },
  { 
    id: 'CA2', 
    label: 'Adaptation', 
    shortLabel: 'Nature', 
    iconName: 'Compass', 
    color: 'text-emerald-500', 
    bgColor: 'bg-emerald-500', 
    activities: ['Course Orientation', 'Escalade', 'Savoir Nager'] 
  },
  { 
    id: 'CA3', 
    label: 'Artistique', 
    shortLabel: 'Arts', 
    iconName: 'Music', 
    color: 'text-fuchsia-500', 
    bgColor: 'bg-fuchsia-500', 
    activities: ['Danse', 'Acrosport', 'Cirque'] 
  },
  { 
    id: 'CA4', 
    label: 'Opposition', 
    shortLabel: 'Duel', 
    iconName: 'Swords', 
    color: 'text-orange-500', 
    bgColor: 'bg-orange-500', 
    activities: ['Badminton', 'Tennis de Table', 'Volley-ball', 'Boxe'] 
  },
  { 
    id: 'CA5', 
    label: 'Entretien', 
    shortLabel: 'Forme', 
    iconName: 'HeartPulse', 
    color: 'text-rose-500', 
    bgColor: 'bg-rose-500', 
    activities: ['Step', 'Yoga', 'Course en Durée'] 
  }
];

export const useEPSKernel = () => {
  // --- STATE ---
  // Persistance basique dans le localStorage pour le confort (F5)
  const [currentActivity, setCurrentActivity] = useState<string>(() => localStorage.getItem('eps_activity') || 'Demi-fond');
  const [activeTab, setActiveTab] = useState<ModuleTab>('DATA');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // --- COMPUTED ---
  const currentCA = useMemo(() => {
    return CA_DEFINITIONS.find(ca => ca.activities.includes(currentActivity)) || CA_DEFINITIONS[0];
  }, [currentActivity]);

  // --- ACTIONS ---
  const selectActivity = (activity: string) => {
    setCurrentActivity(activity);
    localStorage.setItem('eps_activity', activity);
    setActiveTab('DATA'); // Reset on activity change
  };

  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);

  return {
    caDefinitions: CA_DEFINITIONS,
    currentActivity,
    currentCA,
    activeTab,
    setTab: setActiveTab,
    selectActivity,
    isSidebarCollapsed,
    toggleSidebar
  };
};