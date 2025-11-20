import { GlobalSettings, SpecialFunction, TeacherData } from './types';

export const DEFAULT_SETTINGS: GlobalSettings = {
  annualHours: 1890,
  baseLessons: {
    KLP: 26, // 26 Lektionen + 120h KV = 100%
    FLP: 28, // 28 Lektionen = 100%
    SHP: 28, // 28 Lektionen = 100%
  },
};

// Standard distribution percentages according to PDF model (Page 23)
// Used to distribute the calculated annual hours into categories
export const DISTRIBUTION_SHARES = {
  'Unterricht und Klasse': 0.82,
  'Lernende und Schulpartner': 0.07,
  'Schule': 0.07,
  'Lehrperson': 0.04,
};

export const INITIAL_SPECIAL_FUNCTIONS: SpecialFunction[] = [
  {
    id: 'sf-klp',
    name: 'Klassenverantwortung (Standard)',
    reliefLessons: 0,
    hours: 120,
    workField: 'Unterricht und Klasse',
    allowedRoles: 'KLP',
    isStandard: true,
  },
  {
    id: 'sf-shp',
    name: 'Koordination & Absprachen (SHP)',
    reliefLessons: 0,
    hours: 0, // Often integrated or handled via lower factor? Keeping 0 and relying on base lessons unless specified otherwise
    workField: 'Unterricht und Klasse',
    allowedRoles: 'SHP',
    isStandard: true,
  },
  {
    id: 'sf-flp',
    name: 'Absprachen Fachlehrperson',
    reliefLessons: 0,
    hours: 0,
    workField: 'Unterricht und Klasse',
    allowedRoles: 'FLP',
    isStandard: true,
  },
  {
    id: 'sf-picts',
    name: 'IT-Support / PICTS',
    reliefLessons: 1,
    hours: 63, // Approx 1890/30
    workField: 'Schule',
    allowedRoles: 'Alle',
  },
  {
    id: 'sf-age',
    name: 'Altersentlastung (ab 60. Altersjahr)',
    reliefLessons: 2,
    hours: 0, // Reduces load, no extra hours added usually, but counts as work time
    workField: 'Lehrperson', 
    allowedRoles: 'Alle',
  },
  {
    id: 'sf-health',
    name: 'Gesundheitsförderung',
    reliefLessons: 0.5,
    hours: 32,
    workField: 'Schule',
    allowedRoles: 'Alle',
  },
  {
    id: 'sf-mentor',
    name: 'Mentor/in Berufseinstieg',
    reliefLessons: 0.5,
    hours: 30,
    workField: 'Lehrperson',
    allowedRoles: 'Alle',
  },
  {
    id: 'sf-bgm',
    name: 'Beauftragte/r Qualitätsmanagement',
    reliefLessons: 1,
    hours: 63,
    workField: 'Schule',
    allowedRoles: 'Alle',
  },
];

export const INITIAL_TEACHER_DATA: TeacherData = {
  municipality: 'Glarus',
  lastName: '',
  firstName: '',
  role: 'KLP',
  teachingLessons: 26,
  activeSpecialFunctions: ['sf-klp'],
  manualCorrections: {},
  remarks: '',
};