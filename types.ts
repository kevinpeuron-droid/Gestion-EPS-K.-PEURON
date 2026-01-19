// --- NAVIGATION TYPES ---

export type ModuleTab = 'DATA' | 'CONFIG' | 'SESSION';

export type CAType = 'CA1' | 'CA2' | 'CA3' | 'CA4' | 'CA5';

export interface ActivityCategory {
  id: CAType;
  label: string;
  shortLabel: string;
  iconName: string;
  color: string;
  bgColor: string;
  activities: string[];
}

export type ViewState = 'DASHBOARD' | 'CLASSES' | 'SESSION_PLANNER' | 'STUDENT_MODE' | 'TEACHER_MOBILE';

// --- DATA TYPES ---

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  group: string;
  gender: 'M' | 'F';
}

export interface StudentStats {
  weightedAverage: number;
  totalObservations: number;
  reliabilityIndex: number;
  criteriaStats: Record<string, { attempts: number; success: number; rate: number }>;
  // Optional properties for potential compatibility with Dashboard usage
  stats?: Record<string, any>;
  reliability?: number;
}

// --- OBSERVATION & CRITERIA ---

export type UIMode = 'BINARY' | 'MULTI_CHOICE' | 'STEPPER' | 'CHRONO' | 'SCALE_GRADIENT' | 'RATING' | 'TIMER_HOLD' | 'HEATMAP_ZONE';

export interface CriterionConfig {
  isBlocking?: boolean;
  options?: { label: string; value: string; color?: string }[];
  min?: number;
  max?: number;
  unit?: string;
  [key: string]: any;
}

export interface Criterion {
  id: string;
  label: string;
  type: string;
  uiMode: UIMode;
  config: CriterionConfig;
}

export interface Observation {
  id?: string;
  timestamp?: number;
  sessionId: string;
  studentId: string;
  authorRole: 'ELEVE' | 'PROF';
  
  // Flexible fields to support both Student and Teacher views
  variableName?: string;
  criteriaId?: string;
  value?: any;
  isSuccess?: boolean;
  type?: string;
}

// --- SESSION ---

export interface SessionSequence {
  id: string;
  title: string;
  durationMin: number;
  type: 'ECHAUFFEMENT' | 'CORPS' | 'CALME';
}

export interface Session {
  id: string;
  activity: string;
  group: string;
  ca: string;
  date?: string;
  timeline: SessionSequence[];
  variables?: { simplify: string; complexify: string };
  safetyAlert?: string;
  materials?: string;
  showSessionToStudents: boolean;
  showObservationToStudents: boolean;
}

// --- KERNEL ---

export interface KernelState {
  currentActivity: string;
  currentCA: CAType;
  activeTab: ModuleTab;
  isSidebarCollapsed: boolean;
}
