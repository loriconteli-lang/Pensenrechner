export type RoleType = 'KLP' | 'FLP' | 'SHP';

export type WorkField = 'Unterricht und Klasse' | 'Lernende und Schulpartner' | 'Schule' | 'Lehrperson' | 'Alle';

export type Municipality = 'Glarus' | 'Glarus Nord' | 'Glarus Süd';

export interface GlobalSettings {
  annualHours: number;
  baseLessons: {
    [key in RoleType]: number;
  };
}

export interface SpecialFunction {
  id: string;
  name: string;
  reliefLessons: number;
  hours: number;
  workField: WorkField;
  allowedRoles: RoleType | 'Alle';
  isStandard?: boolean; 
}

export interface TeacherData {
  municipality: Municipality;
  lastName: string;
  firstName: string;
  role: RoleType;
  teachingLessons: number;
  activeSpecialFunctions: string[]; // IDs of selected functions
  manualCorrections: Record<string, number>; // Key: Category Name, Value: +/- Hours
  remarks: string;
}

export interface DistributionCategory {
  name: string;
  hours: number;
  color: string;
  correction?: number; // Includes special functions + manual
  manualCorrectionOnly?: number; // For display purposes separate from functional hours
}