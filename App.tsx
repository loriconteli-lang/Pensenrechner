
import React, { useState } from 'react';
import { LayoutGrid, Settings as SettingsIcon, Save, FileText, ChevronLeft, FolderOpen } from 'lucide-react';
import { PlannerView } from './components/PlannerView';
import { SettingsView } from './components/SettingsView';
import { ReportView } from './components/ReportView';
import { DashboardView } from './components/DashboardView';
import { calculatePensum } from './utils/calculations';
import { DEFAULT_SETTINGS, INITIAL_SPECIAL_FUNCTIONS, INITIAL_TEACHER_DATA, INITIAL_FOLDERS } from './constants';
import { GlobalSettings, SpecialFunction, TeacherData, SavedAgreement, Folder } from './types';

const App: React.FC = () => {
  // Navigation State
  const [view, setView] = useState<'dashboard' | 'planner' | 'settings'>('dashboard');
  const [showReport, setShowReport] = useState(false);
  
  // Data State
  const [settings, setSettings] = useState<GlobalSettings>(DEFAULT_SETTINGS);
  const [specialFunctions, setSpecialFunctions] = useState<SpecialFunction[]>(INITIAL_SPECIAL_FUNCTIONS);
  
  // Current Editing State
  const [teacherData, setTeacherData] = useState<TeacherData>(INITIAL_TEACHER_DATA);
  const [currentAgreementId, setCurrentAgreementId] = useState<string | null>(null);

  // Storage State (Simulated)
  const [folders, setFolders] = useState<Folder[]>(INITIAL_FOLDERS);
  const [agreements, setAgreements] = useState<SavedAgreement[]>([]);

  // --- Actions ---

  const handleCreateFolder = (name: string) => {
    const newFolder: Folder = { id: `f-${Date.now()}`, name };
    setFolders([...folders, newFolder]);
  };

  const handleDeleteFolder = (id: string) => {
    if (confirm('Möchten Sie diesen Ordner und alle darin enthaltenen Vereinbarungen löschen?')) {
      setFolders(folders.filter(f => f.id !== id));
      setAgreements(agreements.filter(a => a.folderId !== id));
    }
  };

  const handleMoveAgreement = (agreementId: string, targetFolderId: string) => {
    setAgreements(agreements.map(a => 
      a.id === agreementId ? { ...a, folderId: targetFolderId } : a
    ));
  };

  const handleDeleteAgreement = (id: string) => {
    if (confirm('Möchten Sie diese Vereinbarung wirklich löschen?')) {
      setAgreements(agreements.filter(a => a.id !== id));
    }
  };

  const handleLoadAgreement = (agreement: SavedAgreement) => {
    setTeacherData(agreement.data);
    setCurrentAgreementId(agreement.id);
    setView('planner');
  };

  const handleNewAgreement = () => {
    setTeacherData(INITIAL_TEACHER_DATA);
    setCurrentAgreementId(null);
    setView('planner');
  };

  const handleSave = () => {
    if (!teacherData.lastName) {
      alert('Bitte geben Sie mindestens einen Namen ein.');
      return;
    }

    // Determine folder (default to first one if not set or strictly prompt)
    // For simplicity, if it's new, ask for folder. If existing, keep folder.
    let targetFolderId = 'default';
    
    if (currentAgreementId) {
      const existing = agreements.find(a => a.id === currentAgreementId);
      if (existing) targetFolderId = existing.folderId;
    } else {
       // Check if 'default' exists, if not take the first available
       if (!folders.find(f => f.id === 'default') && folders.length > 0) {
         targetFolderId = folders[0].id;
       }
    }

    // Calculate Cache Values
    const calculated = calculatePensum(teacherData, settings, specialFunctions);
    
    // Calculate total lessons explicitly for cache
    const age = 2026 - teacherData.birthYear;
    let ageRelief = 0;
    if (age >= 60) ageRelief = 3;
    else if (age >= 55) ageRelief = 1;

    let additionalLessons = 0;
    if (ageRelief > 0) additionalLessons += ageRelief;
    
    // Add special functions in WL
    specialFunctions.filter(sf => teacherData.activeSpecialFunctions.includes(sf.id)).forEach(sf => {
       if (sf.id !== 'sf-age' && sf.inputUnit === 'Lektionen') {
          const config = teacherData.functionConfig[sf.id];
          const hours = config ? config.hours : (sf.reliefLessons * 60);
          additionalLessons += (hours / 60);
       }
    });
    // Add custom functions in WL
    teacherData.customFunctions.forEach(cf => {
      if (cf.unit === 'Lektionen') additionalLessons += cf.value;
    });

    const totalWL = teacherData.teachingLessons + additionalLessons;


    const newAgreement: SavedAgreement = {
      id: currentAgreementId || `a-${Date.now()}`,
      folderId: targetFolderId,
      lastModified: Date.now(),
      data: { ...teacherData },
      cachedPensumPercentage: calculated.pensumPercentage,
      cachedTotalHours: calculated.totalHours,
      cachedTotalLessons: totalWL
    };

    if (currentAgreementId) {
      setAgreements(agreements.map(a => a.id === currentAgreementId ? newAgreement : a));
    } else {
      setAgreements([...agreements, newAgreement]);
      setCurrentAgreementId(newAgreement.id);
    }
    
    alert('Gespeichert!');
  };

  const handleBackToDashboard = () => {
    setView('dashboard');
    setCurrentAgreementId(null);
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
            {view !== 'dashboard' ? (
               <button 
                 onClick={handleBackToDashboard}
                 className="bg-white/20 p-1.5 rounded-md hover:bg-white/30 transition-colors"
                 title="Zurück zum Dashboard"
               >
                 <ChevronLeft size={24} className="text-white" />
               </button>
            ) : (
               <div className="bg-white/20 p-1.5 rounded-md">
                 <LayoutGrid size={24} className="text-white" />
               </div>
            )}
            
            <div>
              <h1 className="text-lg font-bold leading-tight">
                {view === 'dashboard' ? 'Dashboard' : 'Planer'}
              </h1>
              <p className="text-[10px] text-red-100 uppercase tracking-wide font-medium">
                 {view === 'dashboard' ? 'GL Pensumsrechner 2.0' : (teacherData.lastName ? `${teacherData.lastName} ${teacherData.firstName}` : 'Neue Vereinbarung')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            
            {view === 'dashboard' ? (
               <button 
                 onClick={handleNewAgreement}
                 className="flex items-center gap-2 px-4 py-2 bg-white text-red-700 hover:bg-red-50 rounded text-sm font-medium transition-colors shadow-sm"
               >
                 <FileText size={16} />
                 Neue Vereinbarung
               </button>
            ) : (
              <>
                <button 
                  onClick={handleSave}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-red-800 hover:bg-red-900 rounded text-sm font-medium transition-colors"
                >
                  <Save size={16} />
                  Speichern
                </button>

                <button 
                  onClick={() => setShowReport(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-red-700 hover:bg-red-50 rounded text-sm font-medium transition-colors shadow-sm"
                >
                  <FileText size={16} />
                  <span className="hidden sm:inline">Bericht</span>
                </button>

                <div className="h-8 w-px bg-red-800 mx-1"></div>

                <button 
                  onClick={() => setView(view === 'planner' ? 'settings' : 'planner')}
                  className={`p-2 rounded hover:bg-red-800 transition-colors ${view === 'settings' ? 'bg-red-900' : ''}`}
                  title="Einstellungen"
                >
                  <SettingsIcon size={20} />
                </button>
              </>
            )}

          </div>

        </div>
      </header>

      {/* Main Content */}
      <main className="print:p-0">
        {view === 'dashboard' && (
          <DashboardView 
            folders={folders}
            agreements={agreements}
            onLoadAgreement={handleLoadAgreement}
            onDeleteAgreement={handleDeleteAgreement}
            onCreateFolder={handleCreateFolder}
            onDeleteFolder={handleDeleteFolder}
            onMoveAgreement={handleMoveAgreement}
          />
        )}
        
        {view === 'planner' && (
          <div className="pb-12">
            <PlannerView 
              settings={settings} 
              teacherData={teacherData}
              specialFunctions={specialFunctions}
              onUpdateTeacherData={setTeacherData}
            />
          </div>
        )}

        {view === 'settings' && (
           <div className="pb-12">
            <SettingsView 
              settings={settings} 
              onUpdateSettings={setSettings}
              specialFunctions={specialFunctions}
              onUpdateSpecialFunctions={setSpecialFunctions}
            />
          </div>
        )}
      </main>

    </div>
  );
};

export default App;
