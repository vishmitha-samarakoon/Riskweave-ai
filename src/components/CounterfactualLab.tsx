// RiskWeave AI - Counterfactual Sensitivity Lab Component
import React, { useState } from 'react';
import { 
  GitCompare, 
  Play, 
  RotateCcw, 
  AlertTriangle, 
  ArrowRight, 
  Sparkles, 
  Layers, 
  Info,
  CheckCircle2
} from 'lucide-react';
import { 
  CaseRecord, 
  Evidence, 
  Relationship, 
  Assessment, 
  CounterfactualExperiment, 
  ExecutionMode 
} from '../../shared/types';

interface CounterfactualLabProps {
  caseRecord: CaseRecord;
  evidenceList: Evidence[];
  relationships: Relationship[];
  latestAssessment?: Assessment;
  executionMode: ExecutionMode;
  onRunExperiment: (mutationType: CounterfactualExperiment['mutationType'], targetId?: string) => Promise<CounterfactualExperiment>;
}

export const CounterfactualLab: React.FC<CounterfactualLabProps> = ({
  caseRecord,
  evidenceList,
  relationships,
  latestAssessment,
  executionMode,
  onRunExperiment
}) => {
  const [selectedMutation, setSelectedMutation] = useState<CounterfactualExperiment['mutationType']>('EXCLUDE_OBSERVATION');
  const [selectedTargetId, setSelectedTargetId] = useState<string>(evidenceList[0]?.evidenceId || '');
  const [currentExperiment, setCurrentExperiment] = useState<CounterfactualExperiment | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async () => {
    setIsRunning(true);
    setError(null);
    try {
      const exp = await onRunExperiment(selectedMutation, selectedTargetId);
      setCurrentExperiment(exp);
    } catch (err: any) {
      setError(err.message || 'Experiment execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Experiment Header & Scientific Disclaimer */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-teal-700">Sensitivity Analysis</div>
            <h2 className="text-xl font-bold text-slate-900">Counterfactual Experimentation Lab</h2>
          </div>
          <div className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded border border-slate-200">
            Case: {caseRecord.caseId} (Rev {caseRecord.revision})
          </div>
        </div>

        <div className="p-3 bg-amber-50 rounded-md border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Product Principle:</strong> RiskWeave tests <em>"What changes this recommendation?"</em> through controlled evidence perturbations. This measures model and policy sensitivity under explicit input changes, not mathematical causal proof.
          </div>
        </div>
      </div>

      {/* Experiment Configuration Panel */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          1. Select Permitted Evidence Mutation
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => {
              setSelectedMutation('EXCLUDE_OBSERVATION');
              setSelectedTargetId(evidenceList[0]?.evidenceId || '');
            }}
            className={`p-3 rounded-lg border text-left transition-colors ${
              selectedMutation === 'EXCLUDE_OBSERVATION'
                ? 'bg-teal-50 border-teal-600 shadow-xs'
                : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="font-semibold text-xs text-slate-900">Exclude One Observation</div>
            <div className="text-[11px] text-slate-500 mt-1">Removes a single evidence record and invalidates dependent facts.</div>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedMutation('EXCLUDE_INDEPENDENT_SOURCE_GROUP');
              setSelectedTargetId(evidenceList[0]?.independenceGroup || '');
            }}
            className={`p-3 rounded-lg border text-left transition-colors ${
              selectedMutation === 'EXCLUDE_INDEPENDENT_SOURCE_GROUP'
                ? 'bg-teal-50 border-teal-600 shadow-xs'
                : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="font-semibold text-xs text-slate-900">Exclude Source Group</div>
            <div className="text-[11px] text-slate-500 mt-1">Removes all observations sharing an independenceGroup.</div>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedMutation('ADD_HOUSEHOLD_SHARING_EXPLANATION');
              setSelectedTargetId('');
            }}
            className={`p-3 rounded-lg border text-left transition-colors ${
              selectedMutation === 'ADD_HOUSEHOLD_SHARING_EXPLANATION'
                ? 'bg-teal-50 border-teal-600 shadow-xs'
                : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="font-semibold text-xs text-slate-900">Add Household Context</div>
            <div className="text-[11px] text-slate-500 mt-1">Injects hypothetical verified co-resident explanation.</div>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedMutation('SUPERSEDE_WITH_HYPOTHETICAL_VERIFIED');
              setSelectedTargetId(evidenceList[0]?.evidenceId || '');
            }}
            className={`p-3 rounded-lg border text-left transition-colors ${
              selectedMutation === 'SUPERSEDE_WITH_HYPOTHETICAL_VERIFIED'
                ? 'bg-teal-50 border-teal-600 shadow-xs'
                : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="font-semibold text-xs text-slate-900">Hypothetical Document Renewal</div>
            <div className="text-[11px] text-slate-500 mt-1">Replaces stale record with fresh verified document.</div>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedMutation('REJECT_CANDIDATE_ENTITY_MATCH');
              setSelectedTargetId(relationships[0]?.edgeId || '');
            }}
            className={`p-3 rounded-lg border text-left transition-colors ${
              selectedMutation === 'REJECT_CANDIDATE_ENTITY_MATCH'
                ? 'bg-teal-50 border-teal-600 shadow-xs'
                : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="font-semibold text-xs text-slate-900">Reject Candidate Match</div>
            <div className="text-[11px] text-slate-500 mt-1">Breaks fuzzy candidate entity link in relationship graph.</div>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedMutation('UNCHANGED_CONTROL');
              setSelectedTargetId('');
            }}
            className={`p-3 rounded-lg border text-left transition-colors ${
              selectedMutation === 'UNCHANGED_CONTROL'
                ? 'bg-teal-50 border-teal-600 shadow-xs'
                : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="font-semibold text-xs text-slate-900">Unchanged-Input Control</div>
            <div className="text-[11px] text-slate-500 mt-1">Reruns identical frozen input to measure stochastic variance.</div>
          </button>
        </div>

        {/* Target Selector */}
        {selectedMutation === 'EXCLUDE_OBSERVATION' || selectedMutation === 'SUPERSEDE_WITH_HYPOTHETICAL_VERIFIED' ? (
          <div className="text-xs space-y-1">
            <label className="font-medium text-slate-700">Select Target Evidence Item:</label>
            <select
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded bg-white font-mono text-xs"
            >
              {evidenceList.map(e => (
                <option key={e.evidenceId} value={e.evidenceId}>
                  {e.evidenceId} - {e.evidenceType} ({e.verificationStatus}, {e.sourceLocator})
                </option>
              ))}
            </select>
          </div>
        ) : selectedMutation === 'EXCLUDE_INDEPENDENT_SOURCE_GROUP' ? (
          <div className="text-xs space-y-1">
            <label className="font-medium text-slate-700">Select Target Independence Group:</label>
            <select
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded bg-white font-mono text-xs"
            >
              {Array.from(new Set(evidenceList.map(e => e.independenceGroup))).map(grp => (
                <option key={grp} value={grp}>
                  {grp} ({evidenceList.filter(e => e.independenceGroup === grp).length} records)
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleExecute}
          disabled={isRunning}
          className="w-full sm:w-auto px-5 py-2.5 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white font-semibold text-xs rounded-md shadow-xs transition-colors flex items-center justify-center gap-2"
        >
          <Play className="w-3.5 h-3.5" />
          <span>{isRunning ? 'Rerunning Pipeline on Cloned Envelope...' : 'Execute Sensitivity Experiment'}</span>
        </button>
      </div>

      {/* Side-by-Side Experiment Results */}
      {currentExperiment && (
        <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <div className="text-xs font-semibold text-teal-700 uppercase tracking-wider">Experiment Completed</div>
              <h3 className="text-base font-bold text-slate-900">{currentExperiment.description}</h3>
            </div>
            <span className="font-mono text-xs text-slate-500">{currentExperiment.experimentId}</span>
          </div>

          {/* Transitive DAG Invalidation Notification */}
          <div className="bg-slate-50 p-3 rounded-md border border-slate-200 text-xs space-y-1">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-teal-600" />
              <span>Transitive Dependency DAG Invalidation</span>
            </div>
            <div className="text-[11px] text-slate-600">
              Invalidated Graph Edges: {currentExperiment.transitiveInvalidatedEdgeIds.length > 0 ? currentExperiment.transitiveInvalidatedEdgeIds.join(', ') : 'None'}
              {' · '}
              Invalidated Derived Facts: {currentExperiment.transitiveInvalidatedFactIds.length > 0 ? currentExperiment.transitiveInvalidatedFactIds.join(', ') : 'None'}
            </div>
          </div>

          {/* Side-by-Side Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original Snapshot Result */}
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Original Case Envelope
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl font-black font-mono text-slate-900">
                  {currentExperiment.originalAssessment.proposedAction}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-white border border-slate-300">
                  Risk: {currentExperiment.originalAssessment.riskTier}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-white border border-slate-300">
                  Sufficiency: {currentExperiment.originalAssessment.evidenceSufficiency}
                </span>
              </div>
              <p className="text-xs text-slate-700">
                {currentExperiment.originalAssessment.summary}
              </p>
            </div>

            {/* Mutated Snapshot Result */}
            <div className="p-4 rounded-lg border border-teal-200 bg-teal-50/40 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Mutated Case Envelope</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xl font-black font-mono ${
                  currentExperiment.mutatedAssessment?.proposedAction !== currentExperiment.originalAssessment.proposedAction
                    ? 'text-teal-900 underline'
                    : 'text-slate-900'
                }`}>
                  {currentExperiment.mutatedAssessment?.proposedAction}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-white border border-teal-200">
                  Risk: {currentExperiment.mutatedAssessment?.riskTier}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-white border border-teal-200">
                  Sufficiency: {currentExperiment.mutatedAssessment?.evidenceSufficiency}
                </span>
              </div>
              <p className="text-xs text-slate-800">
                {currentExperiment.mutatedAssessment?.summary}
              </p>
            </div>
          </div>

          {/* Delta Summary */}
          <div className="p-3 bg-white rounded border border-slate-200 text-xs flex items-center justify-between">
            <span className="font-semibold text-slate-800">
              Recommendation Sensitivity Outcome:
            </span>
            <span className={`font-mono font-bold ${
              currentExperiment.mutatedAssessment?.proposedAction !== currentExperiment.originalAssessment.proposedAction
                ? 'text-teal-700'
                : 'text-slate-600'
            }`}>
              {currentExperiment.mutatedAssessment?.proposedAction !== currentExperiment.originalAssessment.proposedAction
                ? 'DISPOSITION CHANGED (Sensitivity Confirmed)'
                : 'DISPOSITION INVARIANT (Recommendation Resilient)'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
