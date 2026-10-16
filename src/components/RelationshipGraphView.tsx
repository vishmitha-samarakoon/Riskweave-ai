// RiskWeave AI - Relationship Graph & Accessible Table Alternative Component
import React, { useState } from 'react';
import { 
  Network, 
  Table, 
  Smartphone, 
  User, 
  CreditCard, 
  FileText, 
  AlertOctagon, 
  Filter,
  CheckCircle2,
  HelpCircle,
  Search
} from 'lucide-react';
import { BoundedGraph, GraphNode, GraphEdge } from '../../shared/graph/graphEngine';
import { EntityType } from '../../shared/types';

interface RelationshipGraphViewProps {
  graph: BoundedGraph;
  onSelectNode?: (nodeId: string) => void;
}

export const RelationshipGraphView: React.FC<RelationshipGraphViewProps> = ({
  graph,
  onSelectNode
}) => {
  const [viewMode, setViewMode] = useState<'VISUAL' | 'ACCESSIBLE_TABLE'>('VISUAL');
  const [selectedNodeId, setSelectedNodeId] = useState<string>(graph.rootEntityId);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const filteredNodes = graph.nodes.filter(n => {
    if (typeFilter === 'ALL') return true;
    return n.type === typeFilter;
  });

  const getNodeIcon = (type: EntityType) => {
    switch (type) {
      case 'PERSON': return <User className="w-4 h-4 text-blue-600" />;
      case 'DEVICE': return <Smartphone className="w-4 h-4 text-teal-600" />;
      case 'ACCOUNT': return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case 'PRIOR_CASE': return <AlertOctagon className="w-4 h-4 text-red-600" />;
      default: return <FileText className="w-4 h-4 text-slate-600" />;
    }
  };

  // Node positions in canvas layout
  const getNodePosition = (index: number, total: number) => {
    if (index === 0) return { x: 300, y: 180 }; // Center root
    const radius = 130;
    const angle = ((index - 1) / Math.max(1, total - 1)) * 2 * Math.PI;
    return {
      x: 300 + radius * Math.cos(angle),
      y: 180 + radius * Math.sin(angle)
    };
  };

  const nodeMap = new Map<string, { x: number; y: number }>();
  filteredNodes.forEach((node, idx) => {
    nodeMap.set(node.id, getNodePosition(idx, filteredNodes.length));
  });

  return (
    <div className="space-y-4">
      {/* View Switcher and Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="flex items-center text-xs bg-slate-100 rounded p-0.5 border border-slate-200">
            <button
              onClick={() => setViewMode('VISUAL')}
              className={`px-3 py-1 rounded transition-colors flex items-center gap-1 ${
                viewMode === 'VISUAL' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Interactive Graph</span>
            </button>
            <button
              onClick={() => setViewMode('ACCESSIBLE_TABLE')}
              className={`px-3 py-1 rounded transition-colors flex items-center gap-1 ${
                viewMode === 'ACCESSIBLE_TABLE' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Accessible Table</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 hidden sm:inline-block">
            {graph.truncated && <span className="text-amber-600 font-medium">· Bounded 2-hop radius</span>}
            {graph.cycleDetected && <span className="text-slate-500 ml-1">· Closed loop checked</span>}
          </div>
        </div>

        {/* Entity Type Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Filter Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-slate-300 rounded px-2 py-1 text-xs bg-white text-slate-700"
          >
            <option value="ALL">All Entities ({graph.nodes.length})</option>
            <option value="PERSON">People</option>
            <option value="DEVICE">Devices</option>
            <option value="ACCOUNT">Accounts</option>
            <option value="PRIOR_CASE">Prior Cases</option>
          </select>
        </div>
      </div>

      {viewMode === 'VISUAL' ? (
        <div className="bg-slate-900 rounded-lg p-4 relative overflow-hidden border border-slate-800 select-none">
          {/* Canvas SVG Graph */}
          <svg className="w-full h-96" viewBox="0 0 600 360">
            {/* Draw Edges */}
            {graph.edges.map(edge => {
              const src = nodeMap.get(edge.source);
              const tgt = nodeMap.get(edge.target);
              if (!src || !tgt) return null;
              const isCandidate = edge.isCandidate;

              return (
                <g key={edge.id}>
                  <line
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke={isCandidate ? '#f59e0b' : '#38bdf8'}
                    strokeWidth={isCandidate ? 1.5 : 2}
                    strokeDasharray={isCandidate ? '4 3' : 'none'}
                    opacity={0.8}
                  />
                  {/* Midpoint Label */}
                  <text
                    x={(src.x + tgt.x) / 2}
                    y={(src.y + tgt.y) / 2 - 4}
                    fill="#94a3b8"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {edge.relationType.replace(/_/g, ' ')}
                  </text>
                </g>
              );
            })}

            {/* Draw Nodes */}
            {filteredNodes.map(node => {
              const pos = nodeMap.get(node.id);
              if (!pos) return null;
              const isSelected = selectedNodeId === node.id;
              const isRoot = node.id === graph.rootEntityId;

              return (
                <g 
                  key={node.id} 
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={() => {
                    setSelectedNodeId(node.id);
                    onSelectNode?.(node.id);
                  }}
                  className="cursor-pointer"
                >
                  <circle
                    r={isRoot ? 22 : 18}
                    fill={node.type === 'PRIOR_CASE' ? '#450a0a' : isRoot ? '#0f766e' : '#1e293b'}
                    stroke={isSelected ? '#2dd4bf' : node.type === 'PRIOR_CASE' ? '#ef4444' : '#475569'}
                    strokeWidth={isSelected ? 3 : 1.5}
                  />
                  <text
                    y={32}
                    fill="#f8fafc"
                    fontSize="10"
                    fontWeight={isSelected ? 'bold' : 'normal'}
                    textAnchor="middle"
                  >
                    {node.label}
                  </text>
                  <text
                    y={43}
                    fill="#94a3b8"
                    fontSize="8"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {node.type} {node.matchState === 'CANDIDATE_MATCH' ? '(Candidate)' : ''}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Graph Legend */}
          <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-xs border border-slate-800 rounded px-3 py-2 text-[11px] text-slate-300 flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-sky-400 inline-block" />
              <span>Observed Link</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-b border-dashed border-amber-400 inline-block" />
              <span>Candidate Match</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
              <span>Prior Adverse Case</span>
            </div>
          </div>
        </div>
      ) : (
        /* Accessible Table Alternative */
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 p-3 bg-slate-50 border-b border-slate-200">
              Graph Entities ({filteredNodes.length} Nodes)
            </h4>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="py-2 px-3">Entity ID</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Label</th>
                  <th className="py-2 px-3">Match State</th>
                  <th className="py-2 px-3">Hop Distance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredNodes.map(node => (
                  <tr key={node.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono font-medium">{node.id}</td>
                    <td className="py-2 px-3">{node.type}</td>
                    <td className="py-2 px-3 text-slate-800 font-medium">{node.label}</td>
                    <td className="py-2 px-3 font-mono">{node.matchState}</td>
                    <td className="py-2 px-3 font-mono">{node.hopDistance} hop(s)</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 p-3 bg-slate-50 border-b border-slate-200">
              Graph Relationships ({graph.edges.length} Edges)
            </h4>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="py-2 px-3">Edge ID</th>
                  <th className="py-2 px-3">Source Entity</th>
                  <th className="py-2 px-3">Relation Type</th>
                  <th className="py-2 px-3">Target Entity</th>
                  <th className="py-2 px-3">Link State</th>
                  <th className="py-2 px-3">Supporting Evidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {graph.edges.map(edge => (
                  <tr key={edge.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono">{edge.id}</td>
                    <td className="py-2 px-3 font-mono text-slate-700">{edge.source}</td>
                    <td className="py-2 px-3 font-medium text-slate-900">{edge.relationType}</td>
                    <td className="py-2 px-3 font-mono text-slate-700">{edge.target}</td>
                    <td className="py-2 px-3 font-mono">
                      {edge.isCandidate ? <span className="text-amber-700">CANDIDATE</span> : <span className="text-emerald-700">OBSERVED</span>}
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-500">{edge.evidenceIds.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
