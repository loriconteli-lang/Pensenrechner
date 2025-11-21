import { TeacherData, GlobalSettings, SpecialFunction, DistributionCategory } from '../types';
import { DISTRIBUTION_SHARES } from '../constants';

export interface CalculatedData {
  distribution: DistributionCategory[];
  totalHours: number;
  pensumPercentage: number;
  baseHoursByField: Record<string, number>;
}

export const calculatePensum = (
  teacherData: TeacherData,
  settings: GlobalSettings,
  specialFunctions: SpecialFunction[]
): CalculatedData => {
  
  // 1. Determine Lesson Factor based on Role
  let hoursPerLesson = 0;
  
  if (teacherData.role === 'KLP') {
    // KLP base factor calculation (1890 - 120) / 26
    hoursPerLesson = (settings.annualHours - 120) / settings.baseLessons.KLP;
  } else {
    // Standard calculation for others
    hoursPerLesson = settings.annualHours / settings.baseLessons[teacherData.role];
  }

  const totalBaseHours = teacherData.teachingLessons * hoursPerLesson;

  // 2. Distribute Base Hours into Categories (82/7/7/4 split)
  const baseHoursByField: Record<string, number> = {
    'Unterricht und Klasse': totalBaseHours * DISTRIBUTION_SHARES['Unterricht und Klasse'],
    'Lernende und Schulpartner': totalBaseHours * DISTRIBUTION_SHARES['Lernende und Schulpartner'],
    'Schule': totalBaseHours * DISTRIBUTION_SHARES['Schule'],
    'Lehrperson': totalBaseHours * DISTRIBUTION_SHARES['Lehrperson'],
  };

  // 3. Initialize Distribution Buckets
  const distribution: DistributionCategory[] = [
    { name: 'Unterricht und Klasse', hours: baseHoursByField['Unterricht und Klasse'], color: 'bg-purple-600' },
    { name: 'Lernende und Schulpartner', hours: baseHoursByField['Lernende und Schulpartner'], color: 'bg-blue-500' },
    { name: 'Schule', hours: baseHoursByField['Schule'], color: 'bg-teal-500' },
    { name: 'Lehrperson', hours: baseHoursByField['Lehrperson'], color: 'bg-yellow-400' },
  ];

  // 4. Apply Special Functions
  teacherData.activeSpecialFunctions.forEach(sfId => {
    const func = specialFunctions.find(f => f.id === sfId);
    if (func) {
      const category = distribution.find(c => c.name === func.workField);
      
      // Use configured hours if available, otherwise default
      let hoursToAdd = func.hours;
      if (teacherData.functionConfig && teacherData.functionConfig[sfId]) {
         hoursToAdd = teacherData.functionConfig[sfId].hours;
      }

      if (category) {
        category.hours += hoursToAdd;
        category.correction = (category.correction || 0) + hoursToAdd;
      }
    }
  });

  // 5. Apply Manual Corrections
  distribution.forEach(category => {
    const manualCorrection = teacherData.manualCorrections[category.name] || 0;
    if (manualCorrection !== 0) {
      category.hours += manualCorrection;
      category.correction = (category.correction || 0) + manualCorrection;
      category.manualCorrectionOnly = manualCorrection;
    }
  });

  // 6. Totals
  const totalHours = distribution.reduce((acc, curr) => acc + curr.hours, 0);
  const pensumPercentage = (totalHours / settings.annualHours) * 100;

  return {
    distribution,
    totalHours,
    pensumPercentage,
    baseHoursByField
  };
};