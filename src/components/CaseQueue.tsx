// RiskWeave AI - Cases Home Component with Workload-Aware Auto-Assignment
import React, { useState } from 'react';
import { 
  Search, 
  ArrowRight, 
  SlidersHorizontal, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  UserCheck,
  Users,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Plus,
  ShieldAlert,
  ChevronDown,
  Info,
  Check,
  X,
  BarChart3
} from 'lucide-react';
import { 
  CaseRecord, 
  Investigator, 
  InvestigatorStatus, 
  AutoAssignmentResult 
} from '../../shared/types';
import { STATUS_WORKFLOW_LABELS } from '../../shared/copy/dictionary';
import { InvestigatorProgressBar } from './InvestigatorProgressBar';

interface CaseQueueProps {
  cases: CaseRecord[];
  selectedCaseId?: string;
  onSelectCase: (caseId: string) => void;
  investigators?: Investigator[];
  onAutoAssign?: (options?: { 
    priorityThreshold?: 'HIGH' | 'CRITICAL'; 
    rebalanceAll?: boolean; 
    onlyUnassigned?: boolean; 
  }) => Promise<AutoAssignmentResult | undefined>;
  onAssignCase?: (caseId: string, investigatorId: string) => Promise<boolean>;
  onUpdateInvestigatorStatus?: (id: string, status: InvestigatorStatus) => Promise<boolean>;
  onSimulateIncomingAlert?: () => Promise<void>;
  onOpenCapacityDashboard?: () => void;
}

export const CaseQueue: React.FC<CaseQueueProps> = ({
  cases,
  selectedCaseId,
  onSelectCase,
  investigators = [],
  onAutoAssign,
  onAssignCase,
  onUpdateInvestigatorStatus,
  onSimulateIncomingAlert,
  onOpenCapacityDashboard
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [quickFilter, setQuickFilter] = useState<'ALL' | 'UNASSIGNED' | 'NEEDS_ATTENTION' | 'WAITING' | 'DECIDED'>('ALL');
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  
  // Specialist filter states under "More filters"
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL');

  // Workload strip & Modal states
  const [showWorkloadPanel, setShowWorkloadPanel] = useState(true);
  const [isAutoAssignModalOpen, setIsAutoAssignModalOpen] = useState(false);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const [priorityThreshold, setPriorityThreshold] = useState<'HIGH' | 'CRITICAL'>('HIGH');
  const [rebalanceAll, setRebalanceAll] = useState(false);
  const [lastAssignmentResult, setLastAssignmentResult] = useState<AutoAssignmentResult | null>(null);
  const [activeDropdownCaseId, setActiveDropdownCaseId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Friendly human-readable observation translations for alerts
  const formatObservation = (codes: string[], summaryNote?: string): string => {
    if (summaryNote) return summaryNote;
    if (codes.includes('ALERT_DEVICE_LINKED')) {
      return 'Device used in more than one application';
    }
    if (codes.includes('ALERT_DOB_MISMATCH')) {
      return 'Date of birth differs from state bureau record';
    }
    if (codes.includes('ALERT_RESIDENCE_CONFLICT')) {
      return 'Address on record conflicts with DMV register';
    }
    if (codes.includes('ALERT_DOCUMENT_AGING') || codes.includes('ALERT_POLICY_TRANSITION_CHECK')) {
      return 'Identity verification record is aging';
    }
    if (codes.includes('ALERT_SYNTHETIC_IDENTITY_LINK') || codes.includes('ALERT_WATCHLIST_MATCH')) {
      return 'Identity record matches confirmed prior adverse alert';
    }
    if (codes.includes('ALERT_SHARED_DEVICE_CLUSTER')) {
      return 'Application received from shared network / dwelling';
    }
    return codes[0]?.replace(/ALERT_/g, '').replace(/_/g, ' ').toLowerCase() || 'Account opening review';
  };

  // Workflow instruction for the "Next step" column
  const getWorkflowNextStep = (c: CaseRecord): string => {
    if (c.status === 'DECIDED') return 'Decision recorded';
    if (c.status === 'REOPENED') return 'Re-examine updated facts';
    if (c.isStale) return 'Review newly added evidence';
    if (c.lastAssessedAction === 'REQUEST_MORE_EVIDENCE') return 'Check missing details';
    if (c.lastAssessedAction === 'ENHANCED_VERIFICATION') return 'Route for stepped-up check';
    if (c.lastAssessedAction === 'ESCALATE') return 'Refer for specialist review';
    if (c.lastAssessedAction === 'CLEAR') return 'Ready for alert closure';
    return 'Review evidence';
  };

  const isCaseUnassigned = (c: CaseRecord): boolean => {
    return !c.assigneeId || c.assigneeId.trim() === '' || c.assigneeName === 'Unassigned';
  };

  const isHighPriority = (c: CaseRecord): boolean => {
    return c.initialPriority === 'CRITICAL' || c.initialPriority === 'HIGH';
  };

  // High priority cases that need assignment
  const unassignedHighPriorityCases = cases.filter(c => 
    isCaseUnassigned(c) && isHighPriority(c) && c.status !== 'DECIDED'
  );

  const filteredCases = cases.filter(c => {
    const matchesSearch = 
      c.caseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.applicationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.assigneeName && c.assigneeName.toLowerCase().includes(searchTerm.toLowerCase()));

    let matchesQuick = true;
    if (quickFilter === 'UNASSIGNED') {
      matchesQuick = isCaseUnassigned(c);
    } else if (quickFilter === 'NEEDS_ATTENTION') {
      matchesQuick = c.status === 'IN_REVIEW' || c.status === 'REOPENED' || c.status === 'NEW';
    } else if (quickFilter === 'WAITING') {
      matchesQuick = c.lastAssessedAction === 'REQUEST_MORE_EVIDENCE' && c.status !== 'DECIDED';
    } else if (quickFilter === 'DECIDED') {
      matchesQuick = c.status === 'DECIDED';
    }

    const matchesPriority = priorityFilter === 'ALL' || c.initialPriority === priorityFilter;
    const matchesRisk = riskFilter === 'ALL' || c.currentRiskTier === riskFilter;
    
    let matchesAssignee = true;
    if (assigneeFilter === 'UNASSIGNED') {
      matchesAssignee = isCaseUnassigned(c);
    } else if (assigneeFilter !== 'ALL') {
      matchesAssignee = c.assigneeId === assigneeFilter;
    }

    return matchesSearch && matchesQuick && matchesPriority && matchesRisk && matchesAssignee;
  });

  const openCasesCount = cases.filter(c => c.status !== 'DECIDED').length;
  const unassignedCount = cases.filter(c => isCaseUnassigned(c) && c.status !== 'DECIDED').length;
  const completedCount = cases.filter(c => c.status === 'DECIDED').length;

  // Execute Auto Assignment
  const runAutoAssignment = async () => {
    if (!onAutoAssign) return;
    setIsAutoAssigning(true);
    try {
      const res = await onAutoAssign({
        priorityThreshold,
        rebalanceAll,
        onlyUnassigned: !rebalanceAll
      });
      if (res) {
        setLastAssignmentResult(res);
      }
    } finally {
      setIsAutoAssigning(false);
    }
  };

  // Simulate Incoming Case
  const handleSimulate = async () => {
    if (!onSimulateIncomingAlert) return;
    setIsSimulating(true);
    try {
      await onSimulateIncomingAlert();
    } finally {
      setIsSimulating(false);
    }
  };

  // Single Case Manual Assignment
  const handleDirectAssign = async (caseId: string, investigatorId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAssignCase) {
      await onAssignCase(caseId, investigatorId);
    }
    setActiveDropdownCaseId(null);
  };

  // Avatar helper
  const getInitials = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getCapacityColor = (current: number, max: number): { text: string; bg: string; border: string; bar: string } => {
    const ratio = current / max;
    if (ratio >= 1) return { text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', bar: 'bg-rose-500' };
    if (ratio >= 0.75) return { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', bar: 'bg-amber-500' };
    return { text: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200', bar: 'bg-teal-600' };
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Fraud Alerts Queue</span>
            {unassignedHighPriorityCases.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                {unassignedHighPriorityCases.length} urgent unassigned
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Account opening and linked-account alerts with automated workload-balancing routing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Simulate incoming alert button */}
          <button
            onClick={handleSimulate}
            disabled={isSimulating}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
            title="Simulate a new incoming high-priority fraud alert arriving at the intake gateway"
          >
            <Plus className="w-3.5 h-3.5 text-teal-600" />
            <span>{isSimulating ? 'Simulating...' : 'Simulate incoming alert'}</span>
          </button>

          {/* Auto-Assign CTA Button */}
          <button
            onClick={() => setIsAutoAssignModalOpen(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-700 rounded-md hover:bg-teal-800 transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Auto-assign high priority</span>
            {unassignedHighPriorityCases.length > 0 && (
              <span className="bg-teal-900/60 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {unassignedHighPriorityCases.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Urgent Unassigned Notification Banner */}
      {unassignedHighPriorityCases.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-rose-50 border border-amber-200 rounded-lg p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 bg-amber-100 rounded-md text-amber-800 shrink-0 mt-0.5">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                <span>{unassignedHighPriorityCases.length} high-priority alerts waiting for investigator allocation</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Incoming alerts: {unassignedHighPriorityCases.map(c => `${c.caseId} (${c.initialPriority})`).join(', ')}.
                Auto-assignment will assign these to the available specialists with the lightest caseload.
              </p>
            </div>
          </div>
          <button
            onClick={runAutoAssignment}
            disabled={isAutoAssigning}
            className="shrink-0 px-3 py-1.5 text-xs font-semibold bg-amber-700 text-white hover:bg-amber-800 rounded-md shadow-2xs flex items-center gap-1.5 disabled:opacity-50 transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>{isAutoAssigning ? 'Allocating...' : 'Auto-assign now'}</span>
          </button>
        </div>
      )}

      {/* Investigator Workload & Capacity Section */}
      {investigators.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Investigator Workload & Capacity
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                ({investigators.filter(i => i.status === 'AVAILABLE').length} available on duty)
              </span>
            </div>

            <div className="flex items-center gap-3">
              {onOpenCapacityDashboard && (
                <button
                  onClick={onOpenCapacityDashboard}
                  className="px-2.5 py-1 text-xs font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100/80 border border-teal-200 rounded flex items-center gap-1.5 transition-colors shadow-2xs"
                  title="Open full interactive D3 stacked capacity dashboard"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Team Capacity Dashboard</span>
                </button>
              )}

              <button
                onClick={() => setShowWorkloadPanel(!showWorkloadPanel)}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1"
              >
                <span>{showWorkloadPanel ? 'Collapse' : 'Expand roster'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showWorkloadPanel ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {showWorkloadPanel && (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {investigators.map(inv => {
                const color = getCapacityColor(inv.currentWorkload, inv.maxCapacity);
                const isAvailable = inv.status === 'AVAILABLE';
                const isSelectedInFilter = assigneeFilter === inv.id;

                return (
                  <div 
                    key={inv.id}
                    className={`p-3 rounded-md border transition-all text-xs flex flex-col justify-between ${
                      isSelectedInFilter 
                        ? 'border-teal-600 ring-1 ring-teal-600 bg-teal-50/30' 
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      {/* Top Row: Initials & Status Toggle */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] ${
                            inv.avatarColor === 'teal' ? 'bg-teal-100 text-teal-800' :
                            inv.avatarColor === 'blue' ? 'bg-blue-100 text-blue-800' :
                            inv.avatarColor === 'indigo' ? 'bg-indigo-100 text-indigo-800' :
                            inv.avatarColor === 'emerald' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {getInitials(inv.name)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 leading-tight truncate max-w-[100px]">
                              {inv.name}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate max-w-[100px]">
                              {inv.role.split('(')[0]}
                            </div>
                          </div>
                        </div>

                        {/* Read-Only Status Chip (Section 33: Personal availability is self-owned) */}
                        <span 
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                            inv.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            inv.status === 'BUSY' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                          title="Declared personal availability (Self-owned only)"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            inv.status === 'AVAILABLE' ? 'bg-emerald-500' :
                            inv.status === 'BUSY' ? 'bg-amber-500' : 'bg-slate-400'
                          }`} />
                          <span className="capitalize">{inv.status.toLowerCase()}</span>
                        </span>
                      </div>

                      {/* Specialization tag */}
                      <p className="text-[10px] text-slate-500 mb-2.5 line-clamp-1" title={inv.specialization}>
                        {inv.specialization}
                      </p>
                    </div>

                    <div>
                      {/* Workload Progress Bar Component */}
                      <div className="pt-2 border-t border-slate-100">
                        <InvestigatorProgressBar
                          currentWorkload={inv.currentWorkload}
                          maxCapacity={inv.maxCapacity}
                          size="md"
                          showLabel={true}
                          showStatusBadge={true}
                          showPercentage={true}
                        />
                      </div>

                      {/* Filter by this investigator */}
                      <button
                        onClick={() => setAssigneeFilter(assigneeFilter === inv.id ? 'ALL' : inv.id)}
                        className={`w-full mt-2 pt-1 text-[10px] font-medium text-center border-t border-slate-100 transition-colors ${
                          isSelectedInFilter ? 'text-teal-700 font-bold' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {isSelectedInFilter ? 'Showing cases (clear)' : 'Filter by cases'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Primary Search & Quick Filters */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search Field */}
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search case, applicant, or assignee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-600 focus:outline-hidden"
            />
          </div>

          {/* Quick Status Buttons */}
          <div className="flex items-center gap-1 w-full sm:w-auto bg-slate-100 p-1 rounded-md text-xs font-medium overflow-x-auto">
            <button
              onClick={() => setQuickFilter('ALL')}
              className={`px-3 py-1 rounded transition-colors whitespace-nowrap ${
                quickFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All cases ({cases.length})
            </button>
            <button
              onClick={() => setQuickFilter('UNASSIGNED')}
              className={`px-3 py-1 rounded transition-colors whitespace-nowrap flex items-center gap-1 ${
                quickFilter === 'UNASSIGNED' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Unassigned</span>
              {unassignedCount > 0 && (
                <span className="bg-amber-200 text-amber-900 px-1 rounded-full text-[10px] font-mono">
                  {unassignedCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setQuickFilter('NEEDS_ATTENTION')}
              className={`px-3 py-1 rounded transition-colors whitespace-nowrap ${
                quickFilter === 'NEEDS_ATTENTION' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Needs attention ({openCasesCount})
            </button>
            <button
              onClick={() => setQuickFilter('DECIDED')}
              className={`px-3 py-1 rounded transition-colors whitespace-nowrap ${
                quickFilter === 'DECIDED' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Decided ({completedCount})
            </button>
          </div>
        </div>

        {/* More Filters Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <button
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            className="text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{showMoreFilters ? 'Hide filters' : 'More filters'}</span>
            {(priorityFilter !== 'ALL' || riskFilter !== 'ALL' || assigneeFilter !== 'ALL') && (
              <span className="w-2 h-2 rounded-full bg-teal-600 ml-1" />
            )}
          </button>

          {(priorityFilter !== 'ALL' || riskFilter !== 'ALL' || assigneeFilter !== 'ALL') && (
            <button
              onClick={() => {
                setPriorityFilter('ALL');
                setRiskFilter('ALL');
                setAssigneeFilter('ALL');
              }}
              className="text-teal-700 hover:underline font-medium"
            >
              Reset all filters
            </button>
          )}
        </div>

        {/* Expanded Filters Drawer */}
        {showMoreFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs border-t border-slate-100">
            <div>
              <label className="block text-slate-500 font-medium mb-1">Incoming Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full p-1.5 border border-slate-300 rounded bg-white"
              >
                <option value="ALL">All Priorities</option>
                <option value="CRITICAL">Critical Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-medium mb-1">Assigned Investigator</label>
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="w-full p-1.5 border border-slate-300 rounded bg-white"
              >
                <option value="ALL">All Assignees</option>
                <option value="UNASSIGNED">Unassigned Only</option>
                {investigators.map(i => (
                  <option key={i.id} value={i.id}>{i.name} ({i.currentWorkload}/{i.maxCapacity})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-medium mb-1">Assessed Concern Tier</label>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="w-full p-1.5 border border-slate-300 rounded bg-white"
              >
                <option value="ALL">All Tiers</option>
                <option value="HIGH">Material Concern</option>
                <option value="REVIEW">Review Needed</option>
                <option value="LOW">Low Concern</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Case List (Desktop Table / Mobile Cards) */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4 w-36">Case</th>
                <th className="py-3 px-4">Why it needs review</th>
                <th className="py-3 px-4 w-44">Assignee & Workload</th>
                <th className="py-3 px-4 w-28">Status</th>
                <th className="py-3 px-4 w-40">Next step</th>
                <th className="py-3 px-4 w-28 text-right">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                    {cases.length === 0 ? 'No cases in this workspace.' : 'No cases match your active filters.'}
                  </td>
                </tr>
              ) : (
                filteredCases.map(c => {
                  const isSelected = c.caseId === selectedCaseId;
                  const isUrgent = c.initialPriority === 'CRITICAL';
                  const isHigh = c.initialPriority === 'HIGH';
                  const unassigned = isCaseUnassigned(c);
                  const assignedInv = investigators.find(i => i.id === c.assigneeId);

                  return (
                    <tr
                      key={c.caseId}
                      onClick={() => onSelectCase(c.caseId)}
                      className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                        isSelected ? 'bg-teal-50/50' : ''
                      }`}
                    >
                      {/* Column 1: Case ID & Priority */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {isUrgent ? (
                            <span 
                              className="px-1.5 py-0.2 rounded font-mono font-bold text-[10px] bg-red-100 text-red-800 border border-red-200 shrink-0" 
                              title="Critical priority alert"
                            >
                              CRITICAL
                            </span>
                          ) : isHigh ? (
                            <span 
                              className="px-1.5 py-0.2 rounded font-mono font-semibold text-[10px] bg-amber-100 text-amber-800 border border-amber-200 shrink-0" 
                              title="High priority alert"
                            >
                              HIGH
                            </span>
                          ) : null}
                          <span className="font-mono font-bold text-slate-900">{c.caseId}</span>
                        </div>
                        <div className="text-slate-600 text-[11px] mt-0.5">{c.applicantName}</div>
                      </td>

                      {/* Column 2: Why it needs review (Plain Observation) */}
                      <td className="py-3 px-4 text-slate-700">
                        <div className="font-medium text-slate-900">
                          {formatObservation(c.alertReasonCodes, c.summaryNote)}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                          {c.product} · App {c.applicationId}
                        </div>
                      </td>

                      {/* Column 3: Assignee & Workload (Interactive Dropdown) */}
                      <td className="py-3 px-4 relative" onClick={(e) => e.stopPropagation()}>
                        {unassigned ? (
                          <div className="relative inline-block">
                            <button
                              onClick={() => setActiveDropdownCaseId(activeDropdownCaseId === c.caseId ? null : c.caseId)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors"
                              title="Click to manually assign or select an investigator"
                            >
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>Unassigned</span>
                              <ChevronDown className="w-3 h-3 opacity-60" />
                            </button>

                            {/* Dropdown for Assignment */}
                            {activeDropdownCaseId === c.caseId && (
                              <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-md shadow-lg z-20 py-1 text-xs">
                                <div className="px-3 py-1 font-semibold text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100">
                                  Assign to Investigator
                                </div>
                                {investigators.map(inv => {
                                  const isAvailable = inv.status === 'AVAILABLE';
                                  return (
                                    <button
                                      key={inv.id}
                                      onClick={(e) => handleDirectAssign(c.caseId, inv.id, e)}
                                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center justify-between transition-colors"
                                    >
                                      <div>
                                        <div className="font-medium text-slate-800">{inv.name}</div>
                                        <div className="text-[10px] text-slate-400">{inv.role.split('(')[0]}</div>
                                      </div>
                                      <div className="text-right">
                                        <span className={`text-[10px] font-mono font-semibold ${
                                          inv.currentWorkload >= inv.maxCapacity ? 'text-rose-600' : 'text-slate-600'
                                        }`}>
                                          {inv.currentWorkload}/{inv.maxCapacity}
                                        </span>
                                        {!isAvailable && (
                                          <div className="text-[9px] text-amber-600">({inv.status.toLowerCase()})</div>
                                        )}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="relative inline-block">
                            <button
                              onClick={() => setActiveDropdownCaseId(activeDropdownCaseId === c.caseId ? null : c.caseId)}
                              className="flex items-center gap-1.5 text-left py-0.5 px-1.5 rounded hover:bg-slate-100 transition-colors group"
                              title="Click to reassign to another desk investigator"
                            >
                              <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                                {getInitials(c.assigneeName || 'Reviewer')}
                              </div>
                              <div>
                                <div className="font-medium text-slate-800 leading-tight">
                                  {c.assigneeName?.split(' ')[0]} {c.assigneeName?.split(' ')[1] || ''}
                                </div>
                                {assignedInv && (
                                  <div className="text-[10px] text-slate-500 font-mono">
                                    Load: {assignedInv.currentWorkload}/{assignedInv.maxCapacity}
                                  </div>
                                )}
                              </div>
                              <ChevronDown className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                            </button>

                            {/* Dropdown for Reassignment */}
                            {activeDropdownCaseId === c.caseId && (
                              <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-md shadow-lg z-20 py-1 text-xs">
                                <div className="px-3 py-1 font-semibold text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100">
                                  Reassign Investigator
                                </div>
                                {investigators.map(inv => (
                                  <button
                                    key={inv.id}
                                    onClick={(e) => handleDirectAssign(c.caseId, inv.id, e)}
                                    className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center justify-between transition-colors ${
                                      inv.id === c.assigneeId ? 'bg-teal-50/60 font-semibold' : ''
                                    }`}
                                  >
                                    <div>
                                      <div className="text-slate-800">{inv.name}</div>
                                      <div className="text-[10px] text-slate-400">{inv.role.split('(')[0]}</div>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-500">
                                      {inv.currentWorkload}/{inv.maxCapacity}
                                    </span>
                                  </button>
                                ))}
                                <div className="border-t border-slate-100 mt-1 pt-1">
                                  <button
                                    onClick={(e) => handleDirectAssign(c.caseId, '', e)}
                                    className="w-full text-left px-3 py-1 text-[11px] text-rose-600 hover:bg-rose-50"
                                  >
                                    Unassign case
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Column 4: Status */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 font-medium ${
                          c.status === 'DECIDED' ? 'text-emerald-700' :
                          c.status === 'REOPENED' ? 'text-purple-700' :
                          c.status === 'NEW' ? 'text-amber-700 font-semibold' :
                          'text-slate-700'
                        }`}>
                          {c.status === 'DECIDED' && <CheckCircle2 className="w-3.5 h-3.5" />}
                          <span>{STATUS_WORKFLOW_LABELS[c.status] || c.status}</span>
                        </span>
                      </td>

                      {/* Column 5: Next step (Workflow instruction) */}
                      <td className="py-3 px-4 font-medium text-slate-900">
                        <div className="flex items-center justify-between">
                          <span>{getWorkflowNextStep(c)}</span>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                        </div>
                      </td>

                      {/* Column 6: Last updated */}
                      <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-500">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Compact Cards View */}
        <div className="block md:hidden divide-y divide-slate-200">
          {filteredCases.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs">
              No cases match your active filters.
            </div>
          ) : (
            filteredCases.map(c => {
              const unassigned = isCaseUnassigned(c);
              const isUrgent = c.initialPriority === 'CRITICAL';

              return (
                <div 
                  key={c.caseId}
                  onClick={() => onSelectCase(c.caseId)}
                  className="p-4 space-y-2 hover:bg-slate-50 active:bg-slate-100 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {isUrgent && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-100 text-red-800">
                          CRITICAL
                        </span>
                      )}
                      <span className="font-mono font-bold text-slate-900">{c.caseId}</span>
                    </div>
                    <span className="text-xs text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="font-semibold text-slate-900 text-sm">
                    {c.applicantName}
                  </div>

                  <p className="text-xs text-slate-600">
                    {formatObservation(c.alertReasonCodes, c.summaryNote)}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                    <div>
                      {unassigned ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          Unassigned
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[11px]">
                          Assignee: <strong className="text-slate-800">{c.assigneeName}</strong>
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => onSelectCase(c.caseId)}
                      className="text-teal-700 font-semibold inline-flex items-center gap-1"
                    >
                      <span>Open case</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Auto-Assignment Modal */}
      {isAutoAssignModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-teal-100 text-teal-800 rounded-md">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Auto-Assign High-Priority Fraud Cases
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Workload-balancing algorithm based on real-time desk capacity
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAutoAssignModalOpen(false);
                  setLastAssignmentResult(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              {!lastAssignmentResult ? (
                <>
                  {/* Explanation Card */}
                  <div className="p-3 bg-slate-50 rounded-md border border-slate-200 space-y-1.5">
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-teal-700" />
                      <span>How Workload-Based Assignment Works:</span>
                    </div>
                    <ul className="text-slate-600 space-y-1 list-disc pl-4 text-[11px]">
                      <li>
                        <strong>Identifies high-priority intake:</strong> Orders candidate cases by severity (Critical first, then High).
                      </li>
                      <li>
                        <strong>Checks availability & capacity caps:</strong> Only routes to investigators on <em>Available</em> duty status who have not exceeded their max capacity (3-5 cases).
                      </li>
                      <li>
                        <strong>Least-loaded allocation:</strong> Routes each case to the investigator currently holding the lowest active workload to prevent bottlenecking.
                      </li>
                      <li>
                        <strong>Audit & notification logging:</strong> Cryptographically chains a <span className="font-mono">CASE_ASSIGNED</span> audit event and creates an in-app assignment notification.
                      </li>
                    </ul>
                  </div>

                  {/* Candidate Cases Preview */}
                  <div>
                    <div className="font-semibold text-slate-900 mb-1.5 flex items-center justify-between">
                      <span>Candidate High-Priority Cases ({unassignedHighPriorityCases.length} eligible)</span>
                    </div>
                    {unassignedHighPriorityCases.length === 0 ? (
                      <div className="p-3 bg-emerald-50 text-emerald-800 rounded border border-emerald-200 text-center font-medium">
                        All incoming high-priority cases are currently assigned.
                      </div>
                    ) : (
                      <div className="border border-slate-200 rounded divide-y divide-slate-100 max-h-36 overflow-y-auto">
                        {unassignedHighPriorityCases.map(c => (
                          <div key={c.caseId} className="p-2 flex items-center justify-between bg-white text-[11px]">
                            <div className="flex items-center gap-2">
                              <span className={`px-1 py-0.2 rounded font-mono font-bold text-[9px] ${
                                c.initialPriority === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {c.initialPriority}
                              </span>
                              <span className="font-mono font-bold text-slate-800">{c.caseId}</span>
                              <span className="text-slate-600 truncate max-w-[140px]">{c.applicantName}</span>
                            </div>
                            <span className="text-slate-400 font-mono text-[10px]">{c.product}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Available Investigators Pool */}
                  <div>
                    <div className="font-semibold text-slate-900 mb-1.5">
                      Available Investigator Capacity
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {investigators.map(inv => {
                        const isAvailable = inv.status === 'AVAILABLE';
                        return (
                          <div 
                            key={inv.id}
                            className={`p-2.5 rounded border flex flex-col justify-between gap-1.5 text-[11px] ${
                              isAvailable ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-150 opacity-60'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="font-semibold text-slate-800 truncate max-w-[130px]">{inv.name}</div>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                                isAvailable ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'
                              }`}>
                                {inv.status}
                              </span>
                            </div>
                            <InvestigatorProgressBar
                              currentWorkload={inv.currentWorkload}
                              maxCapacity={inv.maxCapacity}
                              size="sm"
                              showStatusBadge={false}
                              showPercentage={false}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Options */}
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <label className="font-medium text-slate-700">Priority Scope:</label>
                      <select
                        value={priorityThreshold}
                        onChange={(e) => setPriorityThreshold(e.target.value as 'HIGH' | 'CRITICAL')}
                        className="p-1 border border-slate-300 rounded text-xs bg-white"
                      >
                        <option value="HIGH">Critical & High Priority (Recommended)</option>
                        <option value="CRITICAL">Critical Priority Only</option>
                      </select>
                    </div>

                    <label className="flex items-center gap-2 text-slate-700 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={rebalanceAll}
                        onChange={(e) => setRebalanceAll(e.target.checked)}
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span>Rebalance all open high-priority cases across active team</span>
                    </label>
                  </div>
                </>
              ) : (
                /* Results Card */
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-900 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-xs">
                        Auto-Assignment Successful
                      </div>
                      <p className="text-[11px] mt-0.5">
                        {lastAssignmentResult.assignedCount} cases allocated to available investigators based on workload.
                        {lastAssignmentResult.unassignedRemaining > 0 && ` (${lastAssignmentResult.unassignedRemaining} remain unassigned due to capacity caps).`}
                      </p>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <tr>
                          <th className="p-2">Case</th>
                          <th className="p-2">Assigned Investigator</th>
                          <th className="p-2">Shift Load</th>
                          <th className="p-2">Rationale</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {lastAssignmentResult.assignments.map(a => (
                          <tr key={a.caseId} className="bg-white">
                            <td className="p-2 font-mono font-bold text-slate-900">
                              {a.caseId}
                              <div className="text-[10px] text-slate-500 font-normal font-sans">{a.applicantName}</div>
                            </td>
                            <td className="p-2 font-medium text-slate-800">
                              {a.investigatorName}
                            </td>
                            <td className="p-2 font-mono text-slate-600">
                              {a.previousWorkload} → <strong className="text-teal-700">{a.newWorkload}</strong>
                            </td>
                            <td className="p-2 text-[10px] text-slate-500 max-w-[150px] truncate" title={a.reason}>
                              {a.reason}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              {!lastAssignmentResult ? (
                <>
                  <button
                    onClick={() => setIsAutoAssignModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={runAutoAssignment}
                    disabled={isAutoAssigning || (unassignedHighPriorityCases.length === 0 && !rebalanceAll)}
                    className="px-4 py-1.5 text-xs font-semibold bg-teal-700 text-white hover:bg-teal-800 rounded-md shadow-2xs disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isAutoAssigning ? 'Running Auto-Assign...' : 'Run Auto-Assignment'}</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setIsAutoAssignModalOpen(false);
                    setLastAssignmentResult(null);
                  }}
                  className="px-4 py-1.5 text-xs font-semibold bg-teal-700 text-white hover:bg-teal-800 rounded-md shadow-2xs"
                >
                  Done & View Queue
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
