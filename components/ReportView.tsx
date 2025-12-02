
import React from 'react';
import { GlobalSettings, SpecialFunction, TeacherData } from '../types';
import { calculatePensum } from '../utils/calculations';

interface ReportViewProps {
  settings: GlobalSettings;
  teacherData: TeacherData;
  specialFunctions: SpecialFunction[];
  onClose: () => void;
}

export const ReportView: React.FC<ReportViewProps> = ({
  settings,
  teacherData,
  specialFunctions,
  onClose,
}) => {
  const { distribution, totalHours, pensumPercentage } = calculatePensum(teacherData, settings, specialFunctions);
  const today = new Date().toLocaleDateString('de-CH');
  
  const CURRENT_YEAR = 2026;
  const age = CURRENT_YEAR - teacherData.birthYear;

  const activeFunctions = specialFunctions.filter(sf => teacherData.activeSpecialFunctions.includes(sf.id));

  // --- Lesson Calculation for Display ---
  const inputTeachingLessons = teacherData.teachingLessons;
  
  // 1. Age Relief
  let ageReliefLessons = 0;
  if (age >= 60) ageReliefLessons = 3;
  else if (age >= 55) ageReliefLessons = 1;
  
  // 2. Additional Lessons (Special Functions defined as Lektionen)
  const additionalLessonItems: { name: string; value: number }[] = [];
  
  activeFunctions.forEach(sf => {
      if (sf.id === 'sf-age') return; 
      if (sf.inputUnit === 'Lektionen') {
          const config = teacherData.functionConfig[sf.id];
          const hours = config ? config.hours : (sf.reliefLessons * 60);
          const lessons = hours / 60;
          if (lessons > 0) {
              additionalLessonItems.push({ name: sf.name, value: lessons });
          }
      }
  });

  teacherData.customFunctions.forEach(cf => {
      if (cf.unit === 'Lektionen' && cf.value > 0) {
          additionalLessonItems.push({ name: cf.name, value: cf.value });
      }
  });

  const totalAdditionalLessons = additionalLessonItems.reduce((acc, item) => acc + item.value, 0);
  // Total listed on dashboard often includes relief as 'part of the load', but here we break it down
  // The 'Effective' teaching is Input - Relief.
  const effectiveTeachingLessons = inputTeachingLessons - ageReliefLessons;
  const grandTotalLessons = effectiveTeachingLessons + ageReliefLessons + totalAdditionalLessons;

  return (
    <div className="fixed inset-0 z-[100] bg-gray-800/90 overflow-y-auto print:bg-white print:fixed print:inset-0 print:z-[auto] print:overflow-visible flex justify-center">
      
      {/* Print Toolbar */}
      <div className="fixed top-0 w-full bg-white border-b border-gray-200 p-4 shadow-md flex justify-between items-center print:hidden z-50">
        <h2 className="font-bold text-gray-800">Vorschau Personalblatt</h2>
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-medium transition-colors"
          >
            Schliessen
          </button>
          <button 
            onClick={() => window.print()}
            className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded font-medium transition-colors flex items-center gap-2"
          >
            Drucken
          </button>
        </div>
      </div>

      {/* A4 Page Container */}
      <div 
        className="bg-white my-20 print:my-0 shadow-2xl print:shadow-none relative text-gray-900 font-inter box-border"
        style={{ width: '210mm', minHeight: '297mm', padding: '15mm 20mm' }}
      >
        
        {/* Header */}
        <div className="border-b-4 border-red-600 pb-4 mb-6 flex justify-between items-end">
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Kanton Glarus</div>
            <h1 className="text-3xl font-bold text-gray-900 leading-none">Pensumsvereinbarung</h1>
            <p className="text-gray-600 font-medium mt-1">Schuljahr 2026/27</p>
          </div>
          <div className="text-right">
             <div className="inline-block bg-gray-100 px-2 py-1 rounded text-sm font-semibold text-gray-800 mb-1">
               {teacherData.municipality}
             </div>
             <p className="text-xs text-gray-500">{today}</p>
          </div>
        </div>

        {/* Person & Metrics */}
        <div className="flex gap-6 mb-8">
          {/* Person Info */}
          <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200">
             <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div className="text-gray-500">Name / Vorname:</div>
                <div className="font-bold">{teacherData.lastName} {teacherData.firstName}</div>
                
                <div className="text-gray-500">Funktion:</div>
                <div className="font-bold">
                   {teacherData.role === 'KLP' ? 'Klassenlehrperson' : 
                    teacherData.role === 'FLP' ? 'Fachlehrperson' : 
                    teacherData.role === 'SHP' ? 'Schul. Heilpädagogik' : 'DaZ'}
                </div>

                <div className="text-gray-500">Jahrgang:</div>
                <div className="font-bold">{teacherData.birthYear} ({age} Jahre)</div>
             </div>
          </div>

          {/* KPI */}
          <div className="w-1/3 flex flex-col gap-2">
             <div className="flex-1 bg-red-50 border border-red-100 rounded-lg flex flex-col justify-center items-center p-2">
                <span className="text-xs text-red-600 uppercase font-semibold">Pensum</span>
                <span className="text-3xl font-bold text-red-700">{pensumPercentage.toFixed(2)}%</span>
             </div>
             <div className="flex-1 bg-white border border-gray-200 rounded-lg flex flex-col justify-center items-center p-2">
                <span className="text-xs text-gray-500 uppercase">Jahresarbeitszeit</span>
                <span className="text-xl font-bold text-gray-800">{Math.round(totalHours)} h</span>
             </div>
          </div>
        </div>

        {/* Lektionen Breakdown */}
        <div className="mb-8">
           <h3 className="text-xs font-bold uppercase text-gray-500 border-b border-gray-200 pb-1 mb-3">Zusammensetzung Lektionen (WL)</h3>
           
           <table className="w-full text-sm">
             <tbody className="divide-y divide-gray-100">
                <tr>
                   <td className="py-2 text-gray-700">Vereinbarte Lektionen (Soll)</td>
                   <td className="py-2 text-right font-medium">{inputTeachingLessons} WL</td>
                </tr>
                {ageReliefLessons > 0 && (
                  <tr>
                    <td className="py-2 text-gray-600 pl-4 border-l-2 border-red-200 bg-red-50/20">
                      - davon Altersentlastung (wird bei Unterricht abgezogen)
                    </td>
                    <td className="py-2 text-right text-red-600">- {ageReliefLessons} WL</td>
                  </tr>
                )}
                <tr>
                   <td className="py-2 text-gray-900 font-semibold pl-4">
                     = Effektiver Unterricht
                   </td>
                   <td className="py-2 text-right font-bold border-t border-gray-300">
                     {effectiveTeachingLessons} WL
                   </td>
                </tr>
                
                {/* Spacer */}
                <tr className="h-2"></tr>

                {/* Additional Functions */}
                {additionalLessonItems.map((item, i) => (
                  <tr key={i}>
                    <td className="py-2 text-gray-600">+ {item.name}</td>
                    <td className="py-2 text-right">{item.value.toFixed(1)} WL</td>
                  </tr>
                ))}
                 {ageReliefLessons > 0 && (
                  <tr>
                    <td className="py-2 text-gray-600">+ Altersentlastung (Gutschrift Lehrperson)</td>
                    <td className="py-2 text-right">{ageReliefLessons} WL</td>
                  </tr>
                )}

                <tr className="bg-gray-50 border-t-2 border-gray-200">
                   <td className="py-3 px-2 font-bold text-gray-900">Total anrechenbare Lektionen</td>
                   <td className="py-3 px-2 text-right font-bold text-gray-900">
                      {(grandTotalLessons).toFixed(1)} WL
                   </td>
                </tr>
             </tbody>
           </table>
        </div>

        {/* Hours Table */}
        <div className="mb-8">
           <h3 className="text-xs font-bold uppercase text-gray-500 border-b border-gray-200 pb-1 mb-3">Arbeitszeit-Verteilung (Stunden)</h3>
           <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left py-2 px-3 font-semibold text-gray-700 text-xs uppercase">Arbeitsfeld</th>
                <th className="text-right py-2 px-3 font-semibold text-gray-700 text-xs uppercase">Basis</th>
                <th className="text-right py-2 px-3 font-semibold text-gray-700 text-xs uppercase">Zusatz / Korr.</th>
                <th className="text-right py-2 px-3 font-semibold text-gray-900 text-xs uppercase bg-gray-200">Total</th>
              </tr>
            </thead>
            <tbody>
              {distribution.map((cat) => {
                 const correction = cat.correction || 0;
                 // Base reconstruction logic:
                 // Note: 'hours' in distribution already includes correction. 
                 // So Base = Total - Correction.
                 const base = cat.hours - correction;
                 
                 return (
                  <tr key={cat.name} className="border-b border-gray-100">
                    <td className="py-2 px-3 text-gray-800">{cat.name}</td>
                    <td className="py-2 px-3 text-right text-gray-500">
                      {Math.round(base)}
                    </td>
                    <td className="py-2 px-3 text-right text-gray-600">
                      {correction !== 0 ? (correction > 0 ? `+${Math.round(correction)}` : Math.round(correction)) : '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-gray-900 bg-gray-50">
                      {Math.round(cat.hours)}
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t-2 border-gray-800">
                <td className="py-3 px-3 font-bold">Total</td>
                <td className="py-3 px-3"></td>
                <td className="py-3 px-3"></td>
                <td className="py-3 px-3 text-right font-bold bg-gray-100">{Math.round(totalHours)} h</td>
              </tr>
            </tbody>
           </table>
        </div>

        {/* Signatures */}
        <div className="absolute bottom-[20mm] left-[20mm] right-[20mm]">
          <div className="grid grid-cols-2 gap-12">
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400 mb-8">Ort, Datum</p>
              <div className="h-px bg-gray-300"></div>
            </div>
            
            <div className="mt-8">
               <p className="text-[10px] uppercase font-bold text-gray-400 mb-8">Unterschrift Lehrperson</p>
               <div className="h-px bg-gray-800"></div>
               <p className="text-xs mt-1 text-gray-600">{teacherData.firstName} {teacherData.lastName}</p>
            </div>
             
             <div className="col-start-2">
               <p className="text-[10px] uppercase font-bold text-gray-400 mb-8">Unterschrift Schulleitung</p>
               <div className="h-px bg-gray-800"></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
