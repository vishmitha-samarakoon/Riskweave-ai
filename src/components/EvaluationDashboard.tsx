// RiskWeave AI - Quality Checks & Evaluation Center Component
// Conforms strictly to Section 37: 
// 1. Case Readiness Gates
// 2. System Operational Checks
// 3. AI Evaluation Benchmarks

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Cpu, 
  Clock, 
  HelpCircle,
  FileText,
  Activity,
  Layers,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Server,
  Lock,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { EvalRunSummary } from '../../server/services/evaluationService';
import { CaseReadinessResult, SystemChecksReport } from '../../shared/types';
import { AppUserRole } from './Navigation';

interface EvaluationDashboardProps {
  evaluationRuns: EvalRunSummary[];
  onTriggerRun: (suiteName: 'SMOKE_12' | 'VALIDATION_60' | 'SEALED_TEST_60') => Promise<void>;
  currentRole?: AppUserRole;
  selectedCaseId?: string;
  allCaseIds?: string[];
  onSelectCase?: (caseId: string) => void;
}

export const EvaluationDashboard: React.FC<EvaluationDashboardProps> = ({
  evaluationRuns,
  onTriggerRun,
  currentRole = 'SUPER_ADMIN',
  selectedCaseId = 'RW-001',
  allCaseIds = ['RW-001', 'RW-002', 'RW-003', 'RW-004', 'RW-005'],
  onSelectCase
}) => {
  const [activeTab, setActiveTab] = useState<'CASE_READINESS' | 'SYSTEM_HEALTH' | 'AI_BENCHMARKS'>('CASE_READINESS');
  const [selectedCase, setSelectedCase] = useState<string>(selectedCaseId);
  const [readinessData, setReadinessData] = useState<CaseReadinessResult | null>(null);
  const [isLoadingReadiness, setIsLoadingReadiness] = useState<boolean>(false);
  
  const [systemChecks, setSystemChecks] = useState<SystemChecksReport | null>(null);
  const [isLoadingSystemChecks, setIsLoadingSystemChecks] = useState<boolean>(false);

  const [selectedRunIndex, setSelectedRunIndex] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  useEffect(() => {
    fetchCaseReadiness(selectedCase);
  }, [selectedCase]);

  useEffect(() => {
    if (activeTab === 'SYSTEM_HEALTH' && !systemChecks) {
      fetchSystemChecks();
    }
  }, [activeTab]);

  const fetchCaseReadiness = async (caseId: string) => {
    setIsLoadingReadiness(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/readiness`);
      if (res.ok) {
        const data = await res.json();
        setReadinessData(data);
      }
    } catch (err) {
      console.error('Failed to fetch case readiness:', err);
    } finally {
      setIsLoadingReadiness(false);
    }
  };

  const fetchSystemChecks = async () => {
    setIsLoadingSystemChecks(true);
    try {
      const res = await fetch('/api/quality/system-checks');
      if (res.ok) {
        const data = await res.json();
        setSystemChecks(data);
      }
    } catch (err) {
      console.error('Failed to run system checks:', err);
    } finally {
      setIsLoadingSystemChecks(false);
    }
  };

  const handleRunSuite = async (suite: 'SMOKE_12' | 'VALIDATION_60' | 'SEALED_TEST_60') => {
    if (currentRole !== 'SUPER_ADMIN') {
      alert('Access Denied: Only Super Admin may trigger global benchmark evaluation runs.');
      return;
    }
    setIsRunning(true);
    try {
      await onTriggerRun(suite);
      setSelectedRunIndex(0);
    } catch (err) {
      console.error('Benchmark suite execution failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const activeRun = evaluationRuns[selectedRunIndex] || evaluationRuns[0];

  return (
    <div className="space-y-6">
      {/* Tab Switcher Header */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-teal-700 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Operational Quality & Evaluation Center</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">Quality Checks & Gate Enforcement</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Deterministic case readiness gates, operational system checks, and frozen AI benchmark evaluations.
          </p>
        </div>

        {/* 3 Distinct Functions Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('CASE_READINESS')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'CASE_READINESS' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-teal-600" />
            <span>Case Readiness Gates</span>
          </button>

          <button
            onClick={() => setActiveTab('SYSTEM_HEALTH')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'SYSTEM_HEALTH' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-indigo-600" />
            <span>System Operational Checks</span>
          </button>

          <button
            onClick={() => setActiveTab('AI_BENCHMARKS')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'AI_BENCHMARKS' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-purple-600" />
            <span>AI Benchmark Center</span>
          </button>
        </div>
      </div>

      {/* --- FUNCTION A: CASE READINESS GATES --- */}
      {activeTab === 'CASE_READINESS' && (
        <div className="space-y-4">
          {/* Case Selector and Status Summary */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-700">Target Case:</span>
              <select
                value={selectedCase}
                onChange={(e) => {
                  setSelectedCase(e.target.value);
                  if (onSelectCase) onSelectCase(e.target.value);
                }}
                className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
              >
                {allCaseIds.map(id => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>

              <button
                onClick={() => fetchCaseReadiness(selectedCase)}
                disabled={isLoadingReadiness}
                className="text-xs px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 transition-colors"
                title="Refresh case gates"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingReadiness ? 'animate-spin' : ''}`} />
                <span>Recheck Gates</span>
              </button>
            </div>

            {readinessData && (
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                  readinessData.canFinalizeDecision 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                  readinessData.canSubmitProposal
                    ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                    'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {readinessData.canFinalizeDecision ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  <span>{readinessData.stage.replace(/_/g, ' ')}</span>
                </span>
              </div>
            )}
          </div>

          {/* Checklist Table */}
          {readinessData ? (
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
              <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Readiness Gate Checklist ({readinessData.checks.length} Quality Invariants)
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  Snapshot: {readinessData.snapshotId}
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {readinessData.checks.map(item => (
                  <div key={item.checkId} className="p-4 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                          item.status === 'PASSED' ? 'bg-emerald-100 text-emerald-800' :
                          item.status === 'BLOCKED' ? 'bg-rose-100 text-rose-800' :
                          item.status === 'STALE' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {item.status}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{item.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({item.checkId})</span>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed">
                        {item.plainLanguageReason}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-1">
                        <div>
                          <span className="font-semibold text-slate-600">Observed:</span> {item.observedCondition}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-600">Expected:</span> {item.expectedCondition}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right space-y-1">
                      <span className={`inline-block text-[10px] px-2 py-0.5 rounded font-medium ${
                        item.severity === 'CRITICAL_BLOCKER' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        item.severity === 'WARNING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-slate-50 text-slate-600 border border-slate-200'
                      }`}>
                        {item.severity.replace(/_/g, ' ')}
                      </span>
                      <div className="text-[10px] text-slate-400">
                        {item.responsibleActionOrRole}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <span>{readinessData.summaryMessage}</span>
                <span className="text-slate-400 font-mono text-[10px]">
                  Checked: {new Date(readinessData.checkedAt).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg border border-slate-200 text-center text-slate-500">
              {isLoadingReadiness ? 'Evaluating case readiness gates...' : 'No readiness data available.'}
            </div>
          )}
        </div>
      )}

      {/* --- FUNCTION B: SYSTEM OPERATIONAL CHECKS --- */}
      {activeTab === 'SYSTEM_HEALTH' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Environment & Service Readiness Verification</h3>
              <p className="text-xs text-slate-500">
                Live verification of API reachability, tenant isolation, storage intake gates, AI engine, and outbox.
              </p>
            </div>
            <button
              onClick={fetchSystemChecks}
              disabled={isLoadingSystemChecks}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSystemChecks ? 'animate-spin' : ''}`} />
              <span>Run System Checks</span>
            </button>
          </div>

          {systemChecks ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {systemChecks.checks.map(check => (
                <div key={check.checkId} className="bg-white p-4 rounded-lg border border-slate-200 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      {check.status === 'PASSED' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
                      <span>{check.service.replace(/_/g, ' ')}</span>
                    </span>
                    <span className="text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {check.latencyMs}ms
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {check.details}
                  </p>

                  <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-100 flex items-center justify-between">
                    <span>{check.checkId}</span>
                    <span>Status: {check.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg border border-slate-200 text-center text-slate-500">
              {isLoadingSystemChecks ? 'Running operational health checks...' : 'Click "Run System Checks" to verify environment.'}
            </div>
          )}
        </div>
      )}

      {/* --- FUNCTION C: AI EVALUATION BENCHMARKS --- */}
      {activeTab === 'AI_BENCHMARKS' && (
        <div className="space-y-6">
          {/* Suite Run Controls */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Empirical Benchmark Suites (Frozen Synthetic Fixtures)</h3>
              <p className="text-xs text-slate-500">
                Evaluation across deterministic policy gates and bounded Gemini reviewer outputs.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleRunSuite('SMOKE_12')}
                disabled={isRunning}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition-colors flex items-center gap-1"
              >
                <Play className="w-3 h-3 text-slate-600" />
                <span>Run 12-Case Smoke</span>
              </button>

              <button
                type="button"
                onClick={() => handleRunSuite('VALIDATION_60')}
                disabled={isRunning}
                className="px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded border border-teal-300 transition-colors flex items-center gap-1"
              >
                <Play className="w-3 h-3 text-teal-600" />
                <span>Run 60-Case Validation</span>
              </button>

              <button
                type="button"
                onClick={() => handleRunSuite('SEALED_TEST_60')}
                disabled={isRunning}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded shadow-xs transition-colors flex items-center gap-1"
              >
                <Play className="w-3 h-3 text-teal-400" />
                <span>Run 60-Case Sealed Test</span>
              </button>
            </div>
          </div>

          {activeRun ? (
            <>
              {/* Target Metric KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {activeRun.metrics.map(metric => (
                  <div key={metric.metricId} className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-1">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate" title={metric.name}>
                      {metric.name}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold font-mono text-slate-900">
                        {metric.value}{metric.unit}
                      </span>
                      {metric.target !== undefined && (
                        <span className="text-[11px] text-slate-400">
                          (Target: {metric.target}{metric.unit})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{metric.sampleNumerator ?? metric.numerator}/{metric.sampleDenominator ?? metric.denominator} cases</span>
                      <span className={(metric.status === 'PASSED' || metric.targetMet) ? 'text-teal-700 font-semibold' : 'text-amber-700 font-semibold'}>
                        {metric.status || (metric.targetMet ? 'PASSED' : 'TARGET NOT MET')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Three-Way Baseline Comparison Table */}
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
                <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-teal-700" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Three-Way Architecture Baseline Comparison ({activeRun.suiteName})
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    Executed: {new Date(activeRun.executedAt).toLocaleTimeString()}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                        <th className="p-3">Architecture Configuration</th>
                        <th className="p-3">Agreement Rate</th>
                        <th className="p-3">Unsafe Clear Rate</th>
                        <th className="p-3">Citation Precision</th>
                        <th className="p-3">Latency (p50/p95)</th>
                        <th className="p-3">Estimated Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {activeRun.baselines.map((baseline, idx) => {
                        const displayName = baseline.displayName || baseline.name || baseline.baselineName;
                        const agreement = baseline.agreementRate !== undefined ? baseline.agreementRate : (baseline.actionSetAgreement ? baseline.actionSetAgreement / 100 : 0);
                        const cost = baseline.costPer100Cases || (baseline.tokensPerCase === 0 ? '$0.00 (Local)' : `$${((baseline.tokensPerCase * 0.0000005 + baseline.callsPerCase * 0.0005) * 100).toFixed(3)}`);
                        return (
                          <tr key={displayName} className={idx === 2 ? 'bg-teal-50/50 font-medium' : ''}>
                            <td className="p-3">
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                {idx === 2 && <ShieldCheck className="w-4 h-4 text-teal-700" />}
                                <span>{displayName}</span>
                              </div>
                              <div className="text-[11px] text-slate-500">{baseline.description || (idx === 0 ? 'Rule-based compliance engine only' : idx === 1 ? 'Single LLM evaluation call' : 'Multi-stage verified investigative reasoning pipeline')}</div>
                            </td>
                            <td className="p-3 font-mono">{(agreement * 100).toFixed(1)}%</td>
                            <td className="p-3 font-mono">
                              <span className={baseline.unsafeClearRate === 0 ? 'text-teal-700 font-bold' : 'text-amber-700'}>
                                {(baseline.unsafeClearRate * 100).toFixed(1)}%
                              </span>
                            </td>
                            <td className="p-3 font-mono">{(baseline.citationPrecision * 100).toFixed(1)}%</td>
                            <td className="p-3 font-mono">{baseline.latencyP50Ms}ms / {baseline.latencyP95Ms}ms</td>
                            <td className="p-3 font-mono text-slate-600">{cost}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Observed Failures / Discrepancy Breakdown */}
              {activeRun.failures.length > 0 && (
                <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Observed Case Failures / Exceptions ({activeRun.failures.length} Cases)
                  </h4>
                  <div className="space-y-2">
                    {activeRun.failures.map(fail => (
                      <div key={fail.caseId} className="p-3 bg-slate-50 rounded border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-slate-900">{fail.caseId}</span>
                          <span className="text-slate-500 font-mono">
                            Expected: <strong className="text-teal-700">{fail.expectedAction}</strong> | Actual: <strong className="text-amber-700">{fail.actualAction}</strong>
                          </span>
                        </div>
                        <p className="text-slate-700">{fail.reason}</p>
                        <p className="text-[11px] text-slate-500 italic">Adjudication: {fail.adjudicatedNote}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white p-8 rounded-lg border border-slate-200 text-center space-y-3">
              <p className="text-xs text-slate-500">No benchmark evaluations recorded yet.</p>
              <button
                onClick={() => handleRunSuite('SMOKE_12')}
                disabled={isRunning}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors inline-flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Run Smoke Evaluation Now</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
