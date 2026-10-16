// RiskWeave AI - Simplified Application Workstation Shell
import React, { useState, useEffect } from 'react';
import { Navigation, TopLevelView } from './components/Navigation';
import { CaseQueue } from './components/CaseQueue';
import { FocusedCaseView } from './components/FocusedCaseView';
import { ConnectionsModal } from './components/ConnectionsModal';
import { SourceDrawerModal } from './components/SourceDrawerModal';
import { CounterfactualLab } from './components/CounterfactualLab';
import { PolicyReplayView } from './components/PolicyReplayView';
import { EvaluationDashboard } from './components/EvaluationDashboard';
import { AuditTrailView } from './components/AuditTrailView';
import { ImportModal } from './components/ImportModal';
import { DemoTourModal } from './components/DemoTourModal';
import { ReviewPacketModal } from './components/ReviewPacketModal';
import { TeamCapacityDashboard } from './components/TeamCapacityDashboard';
import { SuperAdminWorkforceView } from './components/SuperAdminWorkforceView';
import { CustomerPortalView } from './components/CustomerPortalView';
import { InboxView } from './components/InboxView';
import { AppUserRole } from './components/Navigation';
import { 
  CaseRecord, 
  Entity, 
  Evidence, 
  Relationship, 
  DerivedFact, 
  Assessment, 
  HumanDecision, 
  EvidenceRequest, 
  ExecutionMode,
  NextCheck,
  ProposedAction,
  AuditEvent,
  Investigator,
  InvestigatorStatus,
  AutoAssignmentResult
} from '../shared/types';
import { BoundedGraph } from '../shared/graph/graphEngine';
import { EvalRunSummary } from '../server/services/evaluationService';
import { ArrowLeft, FileCheck2, Info, X, Shield, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import { AVAILABLE_POLICIES } from '../shared/policy/policies';

export function App() {
  const [currentRole, setCurrentRole] = useState<AppUserRole>('SUPER_ADMIN');
  const [currentUserId, setCurrentUserId] = useState<string>('sup-901');
  const [availabilityStatus, setAvailabilityStatus] = useState<InvestigatorStatus>('AVAILABLE');
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(3);
  const [showHowItWorks, setShowHowItWorks] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<TopLevelView>('WORKFORCE');
  const [executionMode, setExecutionMode] = useState<ExecutionMode>('LOCAL_FIXTURE');
  const [selectedCaseId, setSelectedCaseId] = useState<string>('RW-001');
  
  // State: whether the user is reviewing a specific case or viewing the queue
  const [isReviewingCase, setIsReviewingCase] = useState<boolean>(false);

  // In-case secondary views: 'FOCUSED_REVIEW' | 'COUNTERFACTUAL' | 'POLICY_REPLAY' | 'AUDIT'
  const [caseContextView, setCaseContextView] = useState<'FOCUSED_REVIEW' | 'COUNTERFACTUAL' | 'POLICY_REPLAY' | 'AUDIT'>('FOCUSED_REVIEW');

  // Server Data State
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [caseRecord, setCaseRecord] = useState<CaseRecord | null>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [derivedFacts, setDerivedFacts] = useState<DerivedFact[]>([]);
  const [latestAssessment, setLatestAssessment] = useState<Assessment | undefined>(undefined);
  const [decisions, setDecisions] = useState<HumanDecision[]>([]);
  const [evidenceRequests, setEvidenceRequests] = useState<EvidenceRequest[]>([]);
  const [graph, setGraph] = useState<BoundedGraph | null>(null);
  const [auditTrail, setAuditTrail] = useState<AuditEvent[]>([]);
  const [auditVerification, setAuditVerification] = useState<any>({ valid: true, totalEvents: 0 });
  const [evaluations, setEvaluations] = useState<EvalRunSummary[]>([]);
  const [isLiveAvailable, setIsLiveAvailable] = useState<boolean>(false);
  const [investigators, setInvestigators] = useState<Investigator[]>([]);

  // Modals & Drawers
  const [isConnectionsModalOpen, setIsConnectionsModalOpen] = useState<boolean>(false);
  const [inspectingEvidence, setInspectingEvidence] = useState<Evidence | null>(null);
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [isReviewPacketOpen, setIsReviewPacketOpen] = useState<boolean>(false);
  const [reviewPacketHtml, setReviewPacketHtml] = useState<string>('');

  const [isInvestigating, setIsInvestigating] = useState<boolean>(false);

  // Initial Load
  useEffect(() => {
    fetchHealth();
    fetchCases();
    fetchEvaluations();
    fetchInvestigators();
  }, []);

  // When selectedCaseId changes, refresh context
  useEffect(() => {
    if (selectedCaseId) {
      fetchCaseDetails(selectedCaseId);
      fetchCaseGraph(selectedCaseId);
      fetchCaseAudit(selectedCaseId);
    }
  }, [selectedCaseId]);

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setIsLiveAvailable(data.geminiLiveAvailable);
    } catch (err) {
      console.warn('Health check fetch failed:', err);
    }
  };

  const fetchInvestigators = async () => {
    try {
      const res = await fetch('/api/investigators');
      const data = await res.json();
      setInvestigators(data.investigators || []);
    } catch (err) {
      console.error('Failed to load investigators:', err);
    }
  };

  useEffect(() => {
    fetchMyAvailability(currentUserId);
    fetchUnreadNotifications(currentUserId);
  }, [currentUserId]);

  const fetchMyAvailability = async (userId: string) => {
    try {
      const res = await fetch('/api/me/availability', {
        headers: { 'x-user-id': userId }
      });
      if (res.ok) {
        const data = await res.json();
        setAvailabilityStatus(data.status || 'AVAILABLE');
      }
    } catch (err) {
      console.warn('Failed to fetch availability:', err);
    }
  };

  const fetchUnreadNotifications = async (userId: string) => {
    try {
      const res = await fetch('/api/notifications?filter=UNREAD', {
        headers: { 'x-user-id': userId }
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadNotificationsCount(data.unreadCount ?? data.notifications?.length ?? 0);
      }
    } catch (err) {
      console.warn('Failed to fetch unread notifications count:', err);
    }
  };

  const handleUpdateSelfAvailability = async (status: InvestigatorStatus, returnAt?: string) => {
    try {
      const res = await fetch('/api/me/availability', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUserId,
          'x-user-role': currentRole
        },
        body: JSON.stringify({ status, returnAt })
      });
      if (res.ok) {
        setAvailabilityStatus(status);
        await fetchInvestigators();
      }
    } catch (err) {
      console.error('Failed to update own availability:', err);
    }
  };

  const handleSelectUserSession = (userId: string, role: AppUserRole) => {
    setCurrentUserId(userId);
    setCurrentRole(role);
    if (role === 'SUPER_ADMIN') {
      setCurrentView('WORKFORCE');
      setIsReviewingCase(false);
    } else if (role === 'CUSTOMER_PORTAL') {
      setCurrentView('CUSTOMER_PORTAL');
    } else {
      setCurrentView('CASES');
    }
  };

  const handleAutoAssign = async (options?: { priorityThreshold?: 'HIGH' | 'CRITICAL'; rebalanceAll?: boolean; onlyUnassigned?: boolean }) => {
    try {
      const res = await fetch('/api/cases/auto-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options || {})
      });
      const data = await res.json();
      await fetchCases();
      await fetchInvestigators();
      if (selectedCaseId) {
        await fetchCaseDetails(selectedCaseId);
        await fetchCaseAudit(selectedCaseId);
      }
      return data as AutoAssignmentResult;
    } catch (err) {
      console.error('Failed to execute auto-assign:', err);
      return undefined;
    }
  };

  const handleAssignCase = async (caseId: string, investigatorId: string) => {
    try {
      const res = await fetch(`/api/cases/${caseId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ investigatorId })
      });
      if (res.ok) {
        await fetchCases();
        await fetchInvestigators();
        if (selectedCaseId === caseId) {
          await fetchCaseDetails(caseId);
          await fetchCaseAudit(caseId);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to assign case:', err);
      return false;
    }
  };

  const handleUpdateInvestigatorStatus = async (id: string, status: InvestigatorStatus) => {
    try {
      const res = await fetch(`/api/investigators/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        await fetchInvestigators();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to update investigator status:', err);
      return false;
    }
  };

  const handleSimulateIncomingAlert = async () => {
    try {
      const res = await fetch('/api/cases/simulate-incoming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        await fetchCases();
        await fetchInvestigators();
      }
    } catch (err) {
      console.error('Failed to simulate incoming alert:', err);
    }
  };

  const fetchCases = async () => {
    try {
      const res = await fetch('/api/cases');
      const data = await res.json();
      setCases(data.cases || []);
    } catch (err) {
      console.error('Failed to load cases:', err);
    }
  };

  const fetchEvaluations = async () => {
    try {
      const res = await fetch('/api/evaluations');
      const data = await res.json();
      setEvaluations(data.evaluations || []);
    } catch (err) {
      console.error('Failed to load evaluations:', err);
    }
  };

  const fetchCaseDetails = async (caseId: string) => {
    try {
      const res = await fetch(`/api/cases/${caseId}`);
      if (!res.ok) return;
      const data = await res.json();
      setCaseRecord(data.caseRecord);
      setEntities(data.entities || []);
      setEvidenceList(data.evidence || []);
      setRelationships(data.relationships || []);
      setDerivedFacts(data.derivedFacts || []);
      setLatestAssessment(data.latestAssessment);
      setDecisions(data.decisions || []);
      setEvidenceRequests(data.evidenceRequests || []);
    } catch (err) {
      console.error('Failed to load case details:', err);
    }
  };

  const fetchCaseGraph = async (caseId: string) => {
    try {
      const res = await fetch(`/api/cases/${caseId}/graph`);
      if (!res.ok) return;
      const data = await res.json();
      setGraph(data);
    } catch (err) {
      console.error('Failed to load graph:', err);
    }
  };

  const fetchCaseAudit = async (caseId: string) => {
    try {
      const res = await fetch(`/api/cases/${caseId}/audit`);
      if (!res.ok) return;
      const data = await res.json();
      setAuditTrail(data.events || []);
      setAuditVerification(data.chainVerification || { valid: true, totalEvents: 0 });
    } catch (err) {
      console.error('Failed to load audit trail:', err);
    }
  };

  // Run Investigation Action
  const handleRunInvestigation = async () => {
    if (!selectedCaseId) return;
    setIsInvestigating(true);
    try {
      const res = await fetch(`/api/cases/${selectedCaseId}/investigations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: executionMode, policyVersion: '2026.07' })
      });
      const data = await res.json();
      if (data.publishedAssessment) {
        setLatestAssessment(data.publishedAssessment);
      }
      fetchCases();
      fetchCaseDetails(selectedCaseId);
      fetchCaseAudit(selectedCaseId);
    } catch (err) {
      console.error('Investigation failed:', err);
    } finally {
      setIsInvestigating(false);
    }
  };

  // Human Decision Submission
  const handleSubmitDecision = async (decisionData: any) => {
    if (!selectedCaseId || !caseRecord) return;
    const res = await fetch(`/api/cases/${selectedCaseId}/decisions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...decisionData,
        snapshotId: caseRecord.currentSnapshotId
      })
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to record decision');
    }
    fetchCaseDetails(selectedCaseId);
    fetchCaseAudit(selectedCaseId);
    fetchCases();
  };

  // Supervisor Reopen
  const handleSupervisorReopen = async (reason: string) => {
    if (!selectedCaseId) return;
    const res = await fetch(`/api/cases/${selectedCaseId}/reopen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to reopen case');
    }
    fetchCaseDetails(selectedCaseId);
    fetchCaseAudit(selectedCaseId);
    fetchCases();
  };

  // Request Next Best Check
  const handleRequestCheck = async (check: NextCheck) => {
    if (!selectedCaseId) return;
    await fetch(`/api/cases/${selectedCaseId}/evidence-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        checkType: check.checkType,
        title: check.title,
        reason: check.reason,
        requiredFacts: check.resolvesRequirementIds
      })
    });
    fetchCaseDetails(selectedCaseId);
    fetchCaseAudit(selectedCaseId);
  };

  // Simulate Fulfill Evidence Request
  const handleFulfillRequest = async (requestId: string) => {
    if (!selectedCaseId) return;
    await fetch(`/api/evidence-requests/${requestId}/fulfill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId: selectedCaseId })
    });
    fetchCaseDetails(selectedCaseId);
    fetchCaseAudit(selectedCaseId);
    fetchCases();
  };

  // Counterfactual Experiment Action
  const handleRunExperiment = async (mutationType: any, targetId?: string) => {
    const res = await fetch(`/api/cases/${selectedCaseId}/experiments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mutationType, targetId, mode: executionMode })
    });
    if (!res.ok) throw new Error('Experiment failed');
    fetchCaseAudit(selectedCaseId);
    return await res.json();
  };

  // Policy Replay Action
  const handleRunPolicyReplay = async (policyV1Id: string, policyV2Id: string) => {
    const res = await fetch(`/api/cases/${selectedCaseId}/policy-replays`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ policyV1Id, policyV2Id, mode: executionMode })
    });
    if (!res.ok) throw new Error('Replay failed');
    fetchCaseAudit(selectedCaseId);
    return await res.json();
  };

  // Trigger Evaluation Benchmark Suite
  const handleTriggerEvalSuite = async (suiteName: any) => {
    const res = await fetch('/api/evaluations/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suiteName })
    });
    if (res.ok) {
      fetchEvaluations();
    }
  };

  // Download Review Packet (JSON)
  const handleDownloadPacket = () => {
    window.location.href = `/api/cases/${selectedCaseId}/export?format=json`;
  };

  // View HTML Review Packet Modal
  const handleViewHtmlPacket = async () => {
    try {
      const res = await fetch(`/api/cases/${selectedCaseId}/export?format=html`);
      const html = await res.text();
      setReviewPacketHtml(html);
      setIsReviewPacketOpen(true);
    } catch (err) {
      console.error('Failed to load HTML review packet:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Universal Top Navigation Shell */}
      <Navigation
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'CASES') {
            setCurrentView('CASES');
          } else if (view === 'IMPORT') {
            setIsImportOpen(true);
          } else {
            setCurrentView(view);
          }
        }}
        currentRole={currentRole}
        currentUserId={currentUserId}
        onSelectUserSession={handleSelectUserSession}
        availabilityStatus={availabilityStatus}
        onUpdateAvailability={handleUpdateSelfAvailability}
        unreadNotificationsCount={unreadNotificationsCount}
        executionMode={executionMode}
        onModeChange={setExecutionMode}
        onOpenTour={() => setIsTourOpen(true)}
        onToggleHowItWorks={() => setShowHowItWorks(prev => !prev)}
        isLiveAvailable={isLiveAvailable}
        selectedCaseId={selectedCaseId}
        isReviewingCase={isReviewingCase}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Dismissible How RiskWeave Works Overview */}
        {showHowItWorks && (
          <div className="mb-6 bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-md relative">
            <button
              onClick={() => setShowHowItWorks(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-teal-400" />
              <h2 className="text-base font-bold tracking-tight">How RiskWeave Works</h2>
              <span className="text-[11px] bg-teal-900/60 text-teal-300 border border-teal-500/40 px-2 py-0.5 rounded font-mono">
                Three Integrated Experiences
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700/60">
                <div className="font-bold text-purple-300 mb-1 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> 1. Super Admin Hub
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Oversee team capacity across all investigators, manage investigator lifecycles (invite, suspend, reallocate cases), trigger workload rebalancing, and audit security policies.
                </p>
              </div>
              <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700/60">
                <div className="font-bold text-teal-300 mb-1 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" /> 2. Investigator Workstation
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Review tamper-evident evidence ledgers, evaluate AI hypothesis recommendations against authoritative policies P01–P08, record accountable decisions, and review applicant submissions.
                </p>
              </div>
              <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700/60">
                <div className="font-bold text-emerald-300 mb-1 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> 3. Secure Customer Portal
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Applicants review pending requests, submit structured corroborating documents, receive clear correction guidance, and communicate directly with assigned fraud teams.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 0: INBOX (In-App Notification Center) */}
        {currentView === 'INBOX' && (
          <InboxView
            currentUserId={currentUserId}
            onNavigateToCase={(caseId) => {
              setSelectedCaseId(caseId);
              setIsReviewingCase(true);
              setCurrentRole('INVESTIGATOR');
              setCurrentView('CASES');
              setCaseContextView('FOCUSED_REVIEW');
            }}
            onNavigateBack={() => {
              if (currentRole === 'SUPER_ADMIN') setCurrentView('WORKFORCE');
              else setCurrentView('CASES');
            }}
            onNotificationCountChange={(count) => setUnreadNotificationsCount(count)}
          />
        )}
        
        {/* VIEW 1: CASES (Home List vs Focused Case Review) */}
        {currentView === 'CASES' && (
          !isReviewingCase ? (
            /* Everyday Cases List */
            <CaseQueue
              cases={cases}
              selectedCaseId={selectedCaseId}
              onSelectCase={(id) => {
                setSelectedCaseId(id);
                setIsReviewingCase(true);
                setCaseContextView('FOCUSED_REVIEW');
              }}
              investigators={investigators}
              onAutoAssign={handleAutoAssign}
              onAssignCase={handleAssignCase}
              onUpdateInvestigatorStatus={handleUpdateInvestigatorStatus}
              onSimulateIncomingAlert={handleSimulateIncomingAlert}
              onOpenCapacityDashboard={() => {
                setIsReviewingCase(false);
                setCurrentView('CAPACITY');
              }}
            />
          ) : caseRecord ? (
            /* Contextual Case Workstation */
            caseContextView === 'FOCUSED_REVIEW' ? (
              <FocusedCaseView
                caseRecord={caseRecord}
                evidenceList={evidenceList}
                relationships={relationships}
                latestAssessment={latestAssessment}
                decisions={decisions}
                evidenceRequests={evidenceRequests}
                executionMode={executionMode}
                isInvestigating={isInvestigating}
                onBackToCases={() => setIsReviewingCase(false)}
                onRunInvestigation={handleRunInvestigation}
                onSelectEvidence={(evId) => {
                  const ev = evidenceList.find(e => e.evidenceId === evId);
                  if (ev) setInspectingEvidence(ev);
                }}
                onSubmitDecision={handleSubmitDecision}
                onSupervisorReopen={handleSupervisorReopen}
                onRequestCheck={handleRequestCheck}
                onFulfillRequest={handleFulfillRequest}
                onOpenConnections={() => setIsConnectionsModalOpen(true)}
                onOpenCounterfactual={() => setCaseContextView('COUNTERFACTUAL')}
                onOpenPolicyReplay={() => setCaseContextView('POLICY_REPLAY')}
                onOpenCaseHistory={() => setCaseContextView('AUDIT')}
                onOpenCustomerPortal={() => {
                  setCurrentRole('CUSTOMER_PORTAL');
                  setCurrentView('CUSTOMER_PORTAL');
                }}
              />
            ) : caseContextView === 'COUNTERFACTUAL' ? (
              <div className="space-y-4">
                <button
                  onClick={() => setCaseContextView('FOCUSED_REVIEW')}
                  className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to case {selectedCaseId}</span>
                </button>
                <CounterfactualLab
                  caseRecord={caseRecord}
                  evidenceList={evidenceList}
                  relationships={relationships}
                  latestAssessment={latestAssessment}
                  executionMode={executionMode}
                  onRunExperiment={handleRunExperiment}
                />
              </div>
            ) : caseContextView === 'POLICY_REPLAY' ? (
              <div className="space-y-4">
                <button
                  onClick={() => setCaseContextView('FOCUSED_REVIEW')}
                  className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to case {selectedCaseId}</span>
                </button>
                <PolicyReplayView
                  caseRecord={caseRecord}
                  evidenceList={evidenceList}
                  executionMode={executionMode}
                  onRunReplay={handleRunPolicyReplay}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={() => setCaseContextView('FOCUSED_REVIEW')}
                  className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to case {selectedCaseId}</span>
                </button>
                <AuditTrailView
                  caseId={caseRecord.caseId}
                  auditTrail={auditTrail}
                  verificationResult={auditVerification}
                  onDownloadPacket={handleDownloadPacket}
                  onViewHtmlPacket={handleViewHtmlPacket}
                  onVerifyChain={() => fetchCaseAudit(selectedCaseId)}
                />
              </div>
            )
          ) : null
        )}

        {/* VIEW: TEAM CAPACITY DASHBOARD (D3 Stacked Bar Chart & Workload Balancer) */}
        {currentView === 'CAPACITY' && (
          <TeamCapacityDashboard
            investigators={investigators}
            cases={cases}
            onSelectCase={(id) => {
              setSelectedCaseId(id);
              setIsReviewingCase(true);
              setCurrentView('CASES');
              setCaseContextView('FOCUSED_REVIEW');
            }}
            onAutoAssign={handleAutoAssign}
            onAssignCase={async (caseId, invId) => {
              await handleAssignCase(caseId, invId);
            }}
            onUpdateInvestigatorStatus={handleUpdateInvestigatorStatus}
            onNavigateToCases={() => {
              setIsReviewingCase(false);
              setCurrentView('CASES');
            }}
            onRefresh={async () => {
              await fetchCases();
              await fetchInvestigators();
            }}
          />
        )}

        {/* VIEW 2: QUALITY CHECKS (Evaluation under Tools) */}
        {currentView === 'QUALITY_CHECKS' && (
          <div className="space-y-4">
            <button
              onClick={() => setCurrentView('CASES')}
              className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to cases</span>
            </button>
            <EvaluationDashboard
              evaluationRuns={evaluations}
              onTriggerRun={handleTriggerEvalSuite}
            />
          </div>
        )}

        {/* VIEW 3: SYSTEM POLICIES (Under Tools) */}
        {currentView === 'POLICIES' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <button
                onClick={() => setCurrentView('CASES')}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to cases</span>
              </button>
              <span className="text-xs text-slate-500 font-mono">RW-DEMO v2026.07 (Active)</span>
            </div>

            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Internal Policy Rules Pack (RW-DEMO)</h2>
              <p className="text-xs text-slate-600">
                Authoritative rules governing automated alert closure, required stepped-up verification, and escalation.
              </p>

              <div className="divide-y divide-slate-200 text-xs">
                {AVAILABLE_POLICIES['2026.07'].clauses.map(clause => (
                  <div key={clause.clauseId} className="py-3.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900">{clause.clauseId}: {clause.title}</span>
                      <span className="text-[11px] text-slate-500 font-mono">{clause.sourceLocator}</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{clause.text}</p>
                    <div className="text-[11px] text-teal-800 font-medium">
                      Allowed Dispositions: {clause.actionConstraints.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: SUPER ADMIN WORKFORCE & GOVERNANCE VIEW */}
        {currentView === 'WORKFORCE' && (
          <SuperAdminWorkforceView
            investigators={investigators}
            onRefresh={async () => {
              await fetchInvestigators();
              await fetchCases();
            }}
            onSelectCase={(id) => {
              setSelectedCaseId(id);
              setIsReviewingCase(true);
              setCurrentRole('INVESTIGATOR');
              setCurrentView('CASES');
              setCaseContextView('FOCUSED_REVIEW');
            }}
          />
        )}

        {/* VIEW 5: SECURE CUSTOMER PORTAL VIEW */}
        {currentView === 'CUSTOMER_PORTAL' && (
          <CustomerPortalView
            caseId={selectedCaseId}
            allCaseIds={cases.map(c => c.caseId)}
            onSelectCase={(id) => {
              setSelectedCaseId(id);
            }}
            onExitPortal={() => {
              setCurrentRole('INVESTIGATOR');
              setCurrentView('CASES');
            }}
          />
        )}
      </main>

      {/* Global Slide-Over Source Drawer */}
      <SourceDrawerModal
        evidence={inspectingEvidence}
        onClose={() => setInspectingEvidence(null)}
      />

      {/* Global Connections (Graph & Table) Modal */}
      <ConnectionsModal
        isOpen={isConnectionsModalOpen}
        onClose={() => setIsConnectionsModalOpen(false)}
        graph={graph}
        caseId={selectedCaseId}
      />

      {/* Global Batch Evidence Ingestion Modal */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        caseId={selectedCaseId}
        onCommitSuccess={() => {
          fetchCaseDetails(selectedCaseId);
          fetchCases();
        }}
      />

      {/* 3-Minute Guided Walkthrough Guide */}
      <DemoTourModal
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onSelectCase={(id) => {
          setSelectedCaseId(id);
          setIsReviewingCase(true);
          setCaseContextView('FOCUSED_REVIEW');
        }}
        onNavigateTab={() => {
          setCurrentView('CASES');
          setIsReviewingCase(true);
        }}
      />

      {/* Print-Ready HTML Review Packet Viewer Modal */}
      <ReviewPacketModal
        isOpen={isReviewPacketOpen}
        onClose={() => setIsReviewPacketOpen(false)}
        htmlContent={reviewPacketHtml}
        caseId={selectedCaseId}
      />
    </div>
  );
}

export default App;
