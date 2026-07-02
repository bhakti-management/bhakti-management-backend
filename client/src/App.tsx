import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Sidebar } from './components/Sidebar';
import { Overview } from './pages/Overview';
import { JobsManager } from './pages/JobsManager';
import { CandidatesManager } from './pages/CandidatesManager';
import { EnquiriesManager } from './pages/EnquiriesManager';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm font-medium">Checking authorization...</p>
      </div>
    );
  }

  // Not Logged In
  if (!user) {
    return <Login />;
  }

  // Logged In Layout
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-row">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        {activeTab === 'overview' && <Overview onNavigate={setActiveTab} />}
        {activeTab === 'jobs' && <JobsManager />}
        {activeTab === 'candidates' && <CandidatesManager />}
        {activeTab === 'enquiries' && <EnquiriesManager />}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
