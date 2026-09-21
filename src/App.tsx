import React, { useState, useEffect } from 'react';
import {
  INITIAL_CASE_OVERVIEW,
  INITIAL_EVIDENCE_FILES,
  INITIAL_ENTITIES,
  INITIAL_CORRELATIONS,
  INITIAL_PRIORITY_SIGNALS,
  INITIAL_FUND_FLOW_STEPS,
  INITIAL_TIMELINE_EVENTS,
} from './data/mockCaseData';
import {
  CaseOverviewData,
  EvidenceFile,
  ForensicEntity,
  CorrelationLink,
  FundFlowStep,
  TimelineEvent,
  PrioritySignal,
} from './types/forensic';

import { Sidebar, ScreenId } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { ArrowLeft, X } from 'lucide-react';
import { GlobalSearch } from './components/layout/GlobalSearch';
import { GoldenHourModal } from './components/goldenHour/GoldenHourModal';
import { TraceAssistDrawer } from './components/assistant/TraceAssistDrawer';
import { EntityDetailDrawer } from './components/inspector/EntityDetailDrawer';
import { WhyConnectedModal } from './components/inspector/WhyConnectedModal';
import { LineageModal } from './components/common/LineageModal';

import { CaseOverview } from './components/screens/CaseOverview';
import { EvidenceIntake } from './components/screens/EvidenceIntake';
import { TransactionRelationshipGraph } from './components/screens/TransactionRelationshipGraph';
import { TimelineView } from './components/screens/TimelineView';
import { EntityRegistry } from './components/screens/EntityRegistry';
import { RiskSignalsView } from './components/screens/RiskSignalsView';
import { EvidenceIntegrity } from './components/screens/EvidenceIntegrity';
import { InvestigationBrief } from './components/screens/InvestigationBrief';
import { SettingsView } from './components/screens/SettingsView';
import { LoginModal } from './components/auth/LoginModal';
import { ForensicApiClient } from './services/api';
import { ForensicExtractor, ParseResult } from './engine/extractor';

export function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('overview');
  const [backendOnline, setBackendOnline] = useState<boolean>(false);

  // Authentication & Session State (Default: pops up login with ID avnish & password agrawal)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<string>('avnish');

  // Case State
  const [caseOverview, setCaseOverview] = useState<CaseOverviewData>(INITIAL_CASE_OVERVIEW);
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>(INITIAL_EVIDENCE_FILES);
  const [entities, setEntities] = useState<ForensicEntity[]>(INITIAL_ENTITIES);
  const [correlations, setCorrelations] = useState<CorrelationLink[]>(INITIAL_CORRELATIONS);
  const [prioritySignals, setPrioritySignals] = useState<PrioritySignal[]>(INITIAL_PRIORITY_SIGNALS);
  const [fundFlowSteps, setFundFlowSteps] = useState<FundFlowStep[]>(INITIAL_FUND_FLOW_STEPS);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(INITIAL_TIMELINE_EVENTS);

  // Inspector & Modals State
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [whyConnectedPair, setWhyConnectedPair] = useState<{ sourceId: string; targetId: string } | null>(null);
  const [selectedLineageLink, setSelectedLineageLink] = useState<CorrelationLink | null>(null);
  const [isGoldenHourOpen, setIsGoldenHourOpen] = useState(false);
  const [isTraceAssistOpen, setIsTraceAssistOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Poll backend health status
  useEffect(() => {
    const check = async () => {
      const health = await ForensicApiClient.checkHealth();
      setBackendOnline(Boolean(health));
    };
    check();
    const interval = setInterval(check, 3000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut Ctrl+K for search & Esc to minimize/return to overview
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        if (selectedEntityId) {
          setSelectedEntityId(null);
        } else if (whyConnectedPair) {
          setWhyConnectedPair(null);
        } else if (selectedLineageLink) {
          setSelectedLineageLink(null);
        } else if (currentScreen !== 'overview') {
          setCurrentScreen('overview');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEntityId, whyConnectedPair, selectedLineageLink, currentScreen]);

  // Handler for batch or single evidence ingestion & forensic calculation
  const handleBatchAddEvidence = (results: ParseResult[]) => {
    const calc = ForensicExtractor.calculateForensicUpdates(
      evidenceFiles,
      entities,
      timelineEvents,
      prioritySignals,
      fundFlowSteps,
      caseOverview.kpis,
      results,
      correlations
    );

    setEvidenceFiles(calc.updatedFiles);
    setEntities(calc.updatedEntities);
    setCorrelations(calc.updatedCorrelations);
    setTimelineEvents(calc.updatedTimeline);
    setPrioritySignals(calc.updatedSignals);
    setFundFlowSteps(calc.updatedFundSteps);
    setCaseOverview(prev => ({
      ...prev,
      kpis: calc.updatedKpis,
    }));
  };

  // Handler for adding uploaded evidence files
  const handleAddEvidence = (newFile: EvidenceFile) => {
    setEvidenceFiles(prev => [newFile, ...prev]);
    setCaseOverview(prev => ({
      ...prev,
      kpis: {
        ...prev.kpis,
        evidenceFiles: prev.kpis.evidenceFiles + 1,
      },
    }));
  };

  // Handler to reload synthetic demo state
  const handleResetDemo = async () => {
    await ForensicApiClient.resetCase();
    setCaseOverview(INITIAL_CASE_OVERVIEW);
    setEvidenceFiles(INITIAL_EVIDENCE_FILES);
    setEntities(INITIAL_ENTITIES);
    setCorrelations(INITIAL_CORRELATIONS);
    setPrioritySignals(INITIAL_PRIORITY_SIGNALS);
    setFundFlowSteps(INITIAL_FUND_FLOW_STEPS);
    setTimelineEvents(INITIAL_TIMELINE_EVENTS);
    setSelectedEntityId(null);
    setWhyConnectedPair(null);
    setSelectedLineageLink(null);
  };

  // Trigger connection explanation
  const handleExplainConnection = (sourceId: string, targetId: string) => {
    setWhyConnectedPair({ sourceId, targetId });
  };

  // Find currently selected entity object
  const selectedEntity = entities.find(e => e.id === selectedEntityId) || null;

  // Handler to update active case investigator
  const handleUpdateInvestigator = (newInvestigator: string) => {
    setCaseOverview(prev => ({
      ...prev,
      investigator: newInvestigator,
    }));
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F5F6FA] text-[#1A1A2E] font-sans antialiased">
      {/* Persistent Left Forensic Navigation */}
      <Sidebar
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
        caseId={caseOverview.caseId}
        caseStatus={caseOverview.status}
        currentUser={currentUser}
        isAuthenticated={isAuthenticated}
      />

      {/* Main Forensic Workstation Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Global Topbar */}
        <Topbar
          caseOverview={caseOverview}
          backendOnline={backendOnline}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenGoldenHour={() => setIsGoldenHourOpen(true)}
          onOpenTraceAssist={() => setIsTraceAssistOpen(true)}
          onResetDemo={handleResetDemo}
          onUpdateInvestigator={handleUpdateInvestigator}
          onNavigate={setCurrentScreen}
        />

        {/* Dynamic Subpage Return & Minimize Navigation Bar */}
        {currentScreen !== 'overview' && (
          <div className="h-9 bg-white border-b border-[#E2E8F0] px-4 flex items-center justify-between shrink-0 select-none text-xs z-10 shadow-xs">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setCurrentScreen('overview')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F5F6FA] hover:bg-[#EEF2FF] text-[#1E1B4B] border border-[#CBD5E1] font-semibold transition-all cursor-pointer text-xs hover:border-[#383278]"
                title="Return to Case Overview dashboard"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#ED1B24]" />
                <span>← Back to Case Overview</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentScreen('overview')}
                className="p-1 rounded-md text-[#64748B] hover:text-[#1E1B4B] hover:bg-[#F5F6FA] transition-all cursor-pointer"
                title="Close and return to Case Overview (Esc)"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Screen View with smooth fade animation */}
        <main className="flex-1 overflow-y-auto bg-[#F5F6FA]">
          {currentScreen === 'overview' && (
            <CaseOverview
              overview={caseOverview}
              prioritySignals={prioritySignals}
              fundFlowSteps={fundFlowSteps}
              entities={entities}
              onSelectEntity={setSelectedEntityId}
              onNavigateToNetwork={() => setCurrentScreen('network')}
              onNavigateToEvidence={() => setCurrentScreen('evidence')}
              onNavigateToTimeline={() => setCurrentScreen('timeline')}
              onNavigateToBrief={() => setCurrentScreen('brief')}
              onNavigateToEntities={() => setCurrentScreen('entities')}
              onNavigateToRisk={() => setCurrentScreen('risk')}
            />
          )}

          {currentScreen === 'evidence' && (
            <EvidenceIntake
              evidenceFiles={evidenceFiles}
              onAddEvidence={handleAddEvidence}
              onAddBatchEvidence={handleBatchAddEvidence}
              onResetDemo={handleResetDemo}
              onVerifyFile={() => setCurrentScreen('integrity')}
              onNavigate={setCurrentScreen}
              backendOnline={backendOnline}
            />
          )}

          {currentScreen === 'network' && (
            <TransactionRelationshipGraph
              entities={entities}
              correlations={correlations}
              fundFlowSteps={fundFlowSteps}
              selectedEntityId={selectedEntityId}
              onSelectEntity={setSelectedEntityId}
              onExplainConnection={handleExplainConnection}
            />
          )}

          {currentScreen === 'timeline' && (
            <TimelineView
              events={timelineEvents}
              onSelectEntity={setSelectedEntityId}
            />
          )}

          {currentScreen === 'entities' && (
            <EntityRegistry
              entities={entities}
              onSelectEntity={setSelectedEntityId}
            />
          )}

          {currentScreen === 'risk' && (
            <RiskSignalsView
              entities={entities}
              onSelectEntity={setSelectedEntityId}
            />
          )}

          {currentScreen === 'integrity' && (
            <EvidenceIntegrity
              evidenceFiles={evidenceFiles}
            />
          )}

          {currentScreen === 'brief' && (
            <InvestigationBrief
              caseOverview={caseOverview}
              evidenceFiles={evidenceFiles}
              entities={entities}
              correlations={correlations}
              fundFlowSteps={fundFlowSteps}
              timelineEvents={timelineEvents}
              onSelectEntity={setSelectedEntityId}
            />
          )}

          {currentScreen === 'settings' && (
            <SettingsView
              isAuthenticated={isAuthenticated}
              currentUser={currentUser}
              onOpenLogin={() => setIsLoginModalOpen(true)}
              onLogout={() => {
                setIsAuthenticated(false);
                setIsLoginModalOpen(true);
              }}
              onNavigate={setCurrentScreen}
            />
          )}
        </main>
      </div>

      {/* Slide-over Entity Detail Inspector with backdrop to minimize */}
      {selectedEntityId && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-30 transition-opacity animate-mac-fade cursor-pointer"
          onClick={() => setSelectedEntityId(null)}
          title="Click outside to minimize inspector"
        />
      )}
      <EntityDetailDrawer
        entity={selectedEntity}
        allEntities={entities}
        correlations={correlations}
        isOpen={Boolean(selectedEntityId)}
        onClose={() => setSelectedEntityId(null)}
        onSelectEntity={setSelectedEntityId}
        onExplainConnection={handleExplainConnection}
        onViewLineage={link => setSelectedLineageLink(link)}
      />

      {/* "Why Are These Connected?" Modal */}
      <WhyConnectedModal
        sourceId={whyConnectedPair?.sourceId || null}
        targetId={whyConnectedPair?.targetId || null}
        correlations={correlations}
        entities={entities}
        isOpen={Boolean(whyConnectedPair)}
        onClose={() => setWhyConnectedPair(null)}
        onViewLineage={link => setSelectedLineageLink(link)}
      />

      {/* "Evidence Lineage" Modal */}
      <LineageModal
        link={selectedLineageLink}
        sourceEntity={
          selectedLineageLink
            ? entities.find(e => e.id === selectedLineageLink.sourceEntityId)
            : undefined
        }
        targetEntity={
          selectedLineageLink
            ? entities.find(e => e.id === selectedLineageLink.targetEntityId)
            : undefined
        }
        isOpen={Boolean(selectedLineageLink)}
        onClose={() => setSelectedLineageLink(null)}
      />

      {/* "Golden Hour" Rapid Triage Modal */}
      <GoldenHourModal
        isOpen={isGoldenHourOpen}
        onClose={() => setIsGoldenHourOpen(false)}
        onNavigateToNetwork={() => setCurrentScreen('network')}
        onNavigateToTimeline={() => setCurrentScreen('timeline')}
        onSelectEntity={id => setSelectedEntityId(id)}
      />

      {/* "Trace Assist" Grounded Forensic AI Drawer */}
      <TraceAssistDrawer
        isOpen={isTraceAssistOpen}
        onClose={() => setIsTraceAssistOpen(false)}
        entities={entities}
        correlations={correlations}
        fundSteps={fundFlowSteps}
        onSelectEntity={id => setSelectedEntityId(id)}
      />

      {/* Global Search Modal */}
      <GlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        entities={entities}
        evidenceFiles={evidenceFiles}
        correlations={correlations}
        onSelectEntity={id => setSelectedEntityId(id)}
      />

      {/* Login & Forensic Authentication Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onLoginSuccess={(id) => {
          setIsAuthenticated(true);
          setCurrentUser(id);
          setIsLoginModalOpen(false);
          handleUpdateInvestigator('Inv. Avnish Agrawal');
        }}
        canDismiss={isAuthenticated}
        onDismiss={() => {
          if (isAuthenticated) {
            setIsLoginModalOpen(false);
          }
        }}
      />
    </div>
  );
}

export default App;
