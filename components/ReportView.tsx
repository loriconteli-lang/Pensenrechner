
import React from 'react';
import { GlobalSettings, SpecialFunction, TeacherData } from '../types';
import { calculatePensum } from '../utils/calculations';
import { User } from 'lucide-react';

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
  
  // Reference Year for age calculation (should match logic in calculations)
  const CURRENT_YEAR = 2025;
  const age = CURRENT_YEAR - teacherData.birthYear;

  // Filter active special functions objects for listing
  const activeFunctions = specialFunctions.filter(sf => teacherData.activeSpecialFunctions.includes(sf.id));

  // --- Lesson Breakdown Logic ---
  const teachingLessons = teacherData.teachingLessons;
  const lessonItems: { name: string; value: number }[] = [];

  // 1. Age Relief
  let ageReliefLessons = 0;
  if (age >= 60) ageReliefLessons = 3;
  else if (age >= 55) ageReliefLessons = 1;
  
  if (ageReliefLessons > 0) {
    lessonItems.push({ name: `Altersentlastung (${age} Jahre)`, value: ageReliefLessons });
  }

  // 2. Special Functions (defined in Lessons)
  activeFunctions.forEach(sf => {
      if (sf.id === 'sf-age') return; // Handled above
      if (sf.inputUnit === 'Lektionen') {
          const config = teacherData.functionConfig[sf.id];
          // Convert stored hours back to lessons (hours / 60)
          const hours = config ? config.hours : (sf.reliefLessons * 60);
          const lessons = hours / 60;
          if (lessons > 0) {
              lessonItems.push({ name: sf.name, value: lessons });
          }
      }
  });

  // 3. Custom Functions (defined in Lessons)
  teacherData.customFunctions.forEach(cf => {
      if (cf.unit === 'Lektionen' && cf.value > 0) {
          lessonItems.push({ name: cf.name, value: cf.value });
      }
  });

  const totalAdditionalLessons = lessonItems.reduce((acc, item) => acc + item.value, 0);
  const totalLessons = teachingLessons + totalAdditionalLessons;


  return (
    <div className="fixed inset-0 z-[100] bg-gray-800/90 overflow-y-auto print:bg-white print:fixed print:inset-0 print:z-[auto] print:overflow-visible">
      
      {/* Print Toolbar (Hidden when printing) */}
      <div className="sticky top-0 w-full bg-white border-b border-gray-200 p-4 shadow-md flex justify-between items-center print:hidden">
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
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2-2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            Drucken
          </button>
        </div>
      </div>

      {/* A4 Page Container */}
      <div className="bg-white mx-auto my-8 w-[210mm] min-h-[297mm] p-[20mm] shadow-xl print:shadow-none print:m-0 print:w-full print:h-auto text-gray-900 font-inter relative">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b-4 border-red-600 pb-6 mb-8">
          <div className="flex items-center gap-4">
            {/* Logo removed as requested */}
            <div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Kanton Glarus</div>
              <h1 className="text-2xl font-bold text-gray-900">Pensumsvereinbarung</h1>
              <p className="text-gray-600 font-medium">Schuljahr 2025/26</p>
            </div>
          </div>
          <div className="text-right">
             <div className="bg-gray-100 px-3 py-1 rounded mb-2 inline-block font-semibold text-gray-700">
               {teacherData.municipality}
             </div>
             <p className="text-sm text-gray-500">{today}</p>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="text-xs text-gray-500 uppercase mb-1 flex items-center gap-1"><User size={12}/> Lehrperson</div>
            <div className="font-bold text-lg">{teacherData.lastName} {teacherData.firstName}</div>
            <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
               <span>{teacherData.role === 'KLP' ? 'Klassenlehrperson' : teacherData.role === 'FLP' ? 'Fachlehrperson' : 'Schul. Heilpädagogik'}</span>
               <span className="text-gray-300">|</span>
               <span>Jg. {teacherData.birthYear} ({age} Jahre)</span>
            </div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-center">
             <div className="text-xs text-red-600 uppercase mb-1 font-semibold">Pensum</div>
             <div className="text-3xl font-bold text-red-700">{pensumPercentage.toFixed(2)}%</div>
          </div>
           <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
             <div className="text-xs text-gray-500 uppercase mb-1">Total Lektionen</div>
             <div className="text-2xl font-bold text-gray-800">{totalLessons} <span className="text-sm font-normal text-gray-500">WL</span></div>
          </div>
        </div>

        {/* Lektionen-Übersicht (NEW SECTION) */}
        <div className="mb-10">
             <h3 className="text-sm font-bold uppercase text-gray-500 mb-3 border-b border-gray-200 pb-1">Lektionen-Übersicht</h3>
             <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between items-center mb-2 text-sm">
                    <span className="text-gray-700">Unterricht</span>
                    <span className="font-bold">{teachingLessons} WL</span>
                </div>
                {lessonItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center mb-2 text-sm">
                        <span className="text-gray-600">+ {item.name}</span>
                        <span className="font-medium">{item.value} WL</span>
                    </div>
                ))}
                <div className="border-t border-gray-300 mt-3 pt-2 flex justify-between items-center">
                    <span className="font-bold text-gray-900">Total Lektionen</span>
                    <span className="font-bold text-red-700">{totalLessons} WL</span>
                </div>
             </div>
        </div>

        {/* Detailed Calculation Table */}
        <div className="mb-10">
          <h3 className="text-sm font-bold uppercase text-gray-500 mb-3 border-b border-gray-200 pb-1">Detaillierung Arbeitszeit (Stunden)</h3>
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-2 px-3 font-semibold text-gray-700 border-b">Arbeitsfeld</th>
                <th className="text-right py-2 px-3 font-semibold text-gray-700 border-b">Basis (h)</th>
                <th className="text-right py-2 px-3 font-semibold text-gray-700 border-b">Zusatz (h)</th>
                <th className="text-right py-2 px-3 font-semibold text-gray-700 border-b w-24">Total (h)</th>
              </tr>
            </thead>
            <tbody>
              {distribution.map((cat) => {
                 // Calculate base hours by subtracting correction
                 const correction = cat.correction || 0;
                 const base = cat.hours - correction;
                 
                 return (
                  <tr key={cat.name} className="border-b border-gray-100">
                    <td className="py-3 px-3 text-gray-800">{cat.name}</td>
                    <td className="py-3 px-3 text-right text-gray-500">
                      {Math.round(base)}
                    </td>
                    <td className="py-3 px-3 text-right text-gray-500">
                      {correction !== 0 ? (correction > 0 ? `+${Math.round(correction)}` : Math.round(correction)) : '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-gray-900 bg-gray-50/50">
                      {Math.round(cat.hours)}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-gray-100 font-bold border-t-2 border-gray-400">
                <td className="py-3 px-3">Total Jahresarbeitszeit</td>
                <td className="py-3 px-3 text-right"></td>
                <td className="py-3 px-3 text-right"></td>
                <td className="py-3 px-3 text-right">{Math.round(totalHours)} h</td>
              </tr>
            </tbody>
          </table>
          <div className="mt-2 text-xs text-gray-400 text-right">
            Basis für 100% = {settings.annualHours} Stunden
          </div>
        </div>

        {/* Special Functions & Custom Tasks List */}
        <div className="mb-10">
           <h3 className="text-sm font-bold uppercase text-gray-500 mb-3 border-b border-gray-200 pb-1">Details Spezialfunktionen & Aufgaben</h3>
          {(activeFunctions.length > 0 || teacherData.customFunctions.length > 0) ? (
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              {/* Standard Functions */}
              {activeFunctions.map(sf => {
                 const config = teacherData.functionConfig && teacherData.functionConfig[sf.id];
                 
                 // Handle Age Relief hours calculation for display
                 let effectiveHours = 0;
                 if (sf.id === 'sf-age') {
                     let reliefLessons = 0;
                     if (age >= 60) reliefLessons = 3;
                     else if (age >= 55) reliefLessons = 1;
                     effectiveHours = reliefLessons * 60;
                 } else {
                     effectiveHours = config ? config.hours : sf.hours;
                 }
                 
                 const isSingleClass = config?.meta?.isSingleClass;

                 return (
                     <div key={sf.id} className="flex justify-between items-start py-2 border-b border-dotted border-gray-200 text-sm">
                        <div>
                          <span className="font-medium text-gray-800 block">
                              {sf.name}
                              {isSingleClass && <span className="ml-2 text-xs text-gray-500 italic">(Nur 1 Klasse)</span>}
                              {sf.id === 'sf-age' && <span className="ml-2 text-xs text-gray-500 italic">({age} Jahre)</span>}
                          </span>
                          <span className="text-xs text-gray-500">{sf.workField}</span>
                        </div>
                        <div className="text-right">
                           <span className="font-bold block">{Math.round(effectiveHours)} h</span>
                        </div>
                     </div>
                 );
              })}
              
              {/* Custom Functions */}
              {teacherData.customFunctions.map(cf => {
                 const effectiveHours = cf.unit === 'Lektionen' ? cf.value * 60 : cf.value;
                 return (
                     <div key={cf.id} className="flex justify-between items-start py-2 border-b border-dotted border-gray-200 text-sm">
                        <div>
                          <span className="font-medium text-gray-800 block">
                              {cf.name}
                          </span>
                          <span className="text-xs text-gray-500">{cf.workField}</span>
                        </div>
                        <div className="text-right">
                           <span className="font-bold block">{Math.round(effectiveHours)} h</span>
                        </div>
                     </div>
                 );
              })}
            </div>
          ) : (
            <p className="text-gray-500 italic text-sm py-2">Keine zusätzlichen Funktionen.</p>
          )}
        </div>

        {/* Remarks */}
        <div className="mb-12 border border-gray-200 rounded-lg p-5 bg-white">
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Bemerkungen & Vereinbarungen</h3>
            <p className="text-sm whitespace-pre-wrap min-h-[3em]">{teacherData.remarks || "—"}</p>
        </div>

        {/* Signatures Area */}
        <div className="mt-auto pt-10 border-t border-gray-300 break-inside-avoid">
          <div className="grid grid-cols-2 gap-16">
            <div>
              <p className="text-xs uppercase font-semibold text-gray-500 mb-8">Ort, Datum</p>
              <div className="h-px bg-gray-400"></div>
            </div>
            <div></div> 
            
            <div>
              <p className="text-xs uppercase font-semibold text-gray-500 mb-12">Unterschrift Lehrperson</p>
              <div className="h-px bg-gray-900"></div>
              <p className="text-sm mt-2">{teacherData.firstName} {teacherData.lastName}</p>
            </div>
            <div>
              <p className="text-xs uppercase font-semibold text-gray-500 mb-12">Unterschrift Schulleitung</p>
              <div className="h-px bg-gray-900"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
