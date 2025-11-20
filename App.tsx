import React, { useState } from 'react';
import { LayoutGrid, Settings as SettingsIcon, Save, FileText } from 'lucide-react';
import { PlannerView } from './components/PlannerView';
import { SettingsView } from './components/SettingsView';
import { ReportView } from './components/ReportView';
import { DEFAULT_SETTINGS, INITIAL_SPECIAL_FUNCTIONS, INITIAL_TEACHER_DATA } from './constants';
import { GlobalSettings, SpecialFunction, TeacherData } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'planner' | 'settings'>('planner');
  const [showReport, setShowReport] = useState(false);
  
  const [settings, setSettings] = useState<GlobalSettings>(DEFAULT_SETTINGS);
  const [specialFunctions, setSpecialFunctions] = useState<SpecialFunction[]>(INITIAL_SPECIAL_FUNCTIONS);
  const [teacherData, setTeacherData] = useState<TeacherData>(INITIAL_TEACHER_DATA);

  const handleSave = () => {
    alert("Daten wurden gespeichert (Simulation).");
  };

  const handleReport = () => {
    setShowReport(true);
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      
      {/* Report Overlay */}
      {showReport && (
        <ReportView 
          settings={settings} 
          teacherData={teacherData} 
          specialFunctions={specialFunctions}
          onClose={() => setShowReport(false)}
        />
      )}

      {/* Header (Hidden when printing) */}
      <header className="bg-[#b91c1c] text-white shadow-md sticky top-0 z-50 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-1.5 rounded-md">
              <LayoutGrid size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Planer</h1>
              <p className="text-[10px] text-red-100 uppercase tracking-wide font-medium">Gespeicherter Entwurf</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={handleSave}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-red-800 hover:bg-red-900 rounded text-sm font-medium transition-colors"
            >
              <Save size={16} />
              Speichern
            </button>

            <button 
              onClick={handleReport}
              className="flex items-center gap-2 px-4 py-2 bg-white text-red-700 hover:bg-red-50 rounded text-sm font-medium transition-colors shadow-sm"
            >
              <FileText size={16} />
              <span className="hidden sm:inline">Bericht erstellen</span>
            </button>

            <div className="h-8 w-px bg-red-800 mx-1"></div>

            <button 
              onClick={() => setActiveTab(activeTab === 'planner' ? 'settings' : 'planner')}
              className={`p-2 rounded hover:bg-red-800 transition-colors ${activeTab === 'settings' ? 'bg-red-900' : ''}`}
              title="Einstellungen"
            >
              <SettingsIcon size={20} />
            </button>
          </div>

        </div>
      </header>

      {/* Main Content (Hidden when printing if report is closed - but ReportView handles full screen takeover) */}
      <main className="pb-12 print:hidden">
        {activeTab === 'planner' ? (
          <PlannerView 
            settings={settings} 
            teacherData={teacherData}
            specialFunctions={specialFunctions}
            onUpdateTeacherData={setTeacherData}
          />
        ) : (
          <SettingsView 
            settings={settings} 
            onUpdateSettings={setSettings}
            specialFunctions={specialFunctions}
            onUpdateSpecialFunctions={setSpecialFunctions}
          />
        )}
      </main>

    </div>
  );
};

export default App;