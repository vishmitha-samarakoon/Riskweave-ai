import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowLeft, 
  RefreshCw, 
  UserCheck, 
  ShieldAlert, 
  Sparkles, 
  Layers, 
  ChevronRight, 
  ExternalLink,
  ArrowRightLeft,
  Activity,
  UserX
} from 'lucide-react';
import { 
  CaseRecord, 
  Investigator, 
  InvestigatorStatus, 
  AutoAssignmentResult 
} from '../../shared/types';
import { InvestigatorProgressBar } from './InvestigatorProgressBar';

export interface TeamCapacityDashboardProps {
  investigators: Investigator[];
  cases: CaseRecord[];
  onSelectCase: (caseId: string) => void;
  onAutoAssign: (options?: { priorityThreshold?: 'HIGH' | 'CRITICAL'; rebalanceAll?: boolean; onlyUnassigned?: boolean }) => Promise<AutoAssignmentResult | undefined>;
  onAssignCase: (caseId: string, investigatorId: string) => Promise<any>;
  onUpdateInvestigatorStatus?: (investigatorId: string, status: InvestigatorStatus) => Promise<any> | void;
  onNavigateToCases: () => void;
  onRefresh?: () => Promise<void>;
}

type StackDimension = 'PRIORITY' | 'STATUS';
type FilterStatus = 'ALL' | 'OVER_AT_CAPACITY' | 'AVAILABLE';

interface InvestigatorChartDatum {
  id: string;
  name: string;
  role: string;
  specialization: string;
  status: InvestigatorStatus;
  maxCapacity: number;
  currentWorkload: number;
  isOverCapacity: boolean;
  isAtCapacity: boolean;
  utilizationRate: number;
  // Priority breakdown
  critical: number;
  high: number;
  medium: number;
  low: number;
  // Status breakdown
  newCases: number;
  inReview: number;
  waitingInfo: number;
  specialist: number;
  escalated: number;
  // Raw cases
  cases: CaseRecord[];
}

interface TooltipData {
  x: number;
  y: number;
  investigatorName: string;
  role: string;
  category: string;
  count: number;
  totalWorkload: number;
  maxCapacity: number;
  isOverCapacity: boolean;
  isAtCapacity: boolean;
  cases: CaseRecord[];
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#ef4444', // red-500
  high: '#f97316',     // orange-500
  medium: '#eab308',   // amber-500
  low: '#10b981'       // emerald-500
};

const PRIORITY_LABELS: Record<string, string> = {
  critical: 'Critical Priority',
  high: 'High Priority',
  medium: 'Medium Priority',
  low: 'Low Priority'
};

const STATUS_COLORS: Record<string, string> = {
  newCases: '#6366f1',     // indigo-500
  inReview: '#0d9488',     // teal-600
  waitingInfo: '#f59e0b',  // amber-500
  specialist: '#8b5cf6',   // purple-500
  escalated: '#dc2626'     // red-600
};

const STATUS_LABELS: Record<string, string> = {
  newCases: 'New Intake',
  inReview: 'Active Investigation',
  waitingInfo: 'Awaiting Info / Verification',
  specialist: 'Specialist / Supervisor',
  escalated: 'Escalated'
};

export const TeamCapacityDashboard: React.FC<TeamCapacityDashboardProps> = ({
  investigators,
  cases,
  onSelectCase,
  onAutoAssign,
  onAssignCase,
  onUpdateInvestigatorStatus,
  onNavigateToCases,
  onRefresh
}) => {
  const [dimension, setDimension] = useState<StackDimension>('PRIORITY');
  const [filter, setFilter] = useState<FilterStatus>('ALL');
  const [selectedInvestigatorId, setSelectedInvestigatorId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [reassignModalCase, setReassignModalCase] = useState<CaseRecord | null>(null);
  const [targetInvestigatorId, setTargetInvestigatorId] = useState<string>('');

  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Compute active cases (excluding DECIDED and CLOSED cases)
  const activeCases = useMemo(() => {
    return cases.filter(c => c.status !== 'DECIDED' && c.status !== 'CLOSED');
  }, [cases]);

  // Aggregate data per investigator
  const chartData: InvestigatorChartDatum[] = useMemo(() => {
    return investigators.map(inv => {
      const assignedActiveCases = activeCases.filter(c => c.assigneeId === inv.id);
      const workload = assignedActiveCases.length;
      const isOver = workload > inv.maxCapacity;
      const isAt = workload === inv.maxCapacity;
      const utilization = inv.maxCapacity > 0 ? (workload / inv.maxCapacity) * 100 : 0;

      // Priority counts
      const critical = assignedActiveCases.filter(c => c.initialPriority === 'CRITICAL').length;
      const high = assignedActiveCases.filter(c => c.initialPriority === 'HIGH').length;
      const medium = assignedActiveCases.filter(c => c.initialPriority === 'MEDIUM').length;
      const low = assignedActiveCases.filter(c => c.initialPriority === 'LOW').length;

      // Status counts
      const newCases = assignedActiveCases.filter(c => c.status === 'NEW').length;
      const inReview = assignedActiveCases.filter(c => c.status === 'IN_REVIEW').length;
      const waitingInfo = assignedActiveCases.filter(c => 
        c.status === 'WAITING_FOR_INFORMATION' || c.status === 'ADDITIONAL_VERIFICATION'
      ).length;
      const specialist = assignedActiveCases.filter(c => 
        c.status === 'AWAITING_SPECIALIST' || c.status === 'SUPERVISOR_REVIEW'
      ).length;
      const escalated = assignedActiveCases.filter(c => c.status === 'ESCALATED').length;

      return {
        id: inv.id,
        name: inv.name,
        role: inv.role,
        specialization: inv.specialization,
        status: inv.status,
        maxCapacity: inv.maxCapacity,
        currentWorkload: workload,
        isOverCapacity: isOver,
        isAtCapacity: isAt,
        utilizationRate: utilization,
        critical,
        high,
        medium,
        low,
        newCases,
        inReview,
        waitingInfo,
        specialist,
        escalated,
        cases: assignedActiveCases
      };
    });
  }, [investigators, activeCases]);

  // Filtered list for display
  const filteredData = useMemo(() => {
    if (filter === 'OVER_AT_CAPACITY') {
      return chartData.filter(d => d.isOverCapacity || d.isAtCapacity);
    }
    if (filter === 'AVAILABLE') {
      return chartData.filter(d => d.status === 'AVAILABLE' && !d.isOverCapacity && !d.isAtCapacity);
    }
    return chartData;
  }, [chartData, filter]);

  // Overall metrics
  const totalCapacity = useMemo(() => {
    return investigators.reduce((acc, inv) => acc + inv.maxCapacity, 0);
  }, [investigators]);

  const totalAssignedWorkload = useMemo(() => {
    return chartData.reduce((acc, d) => acc + d.currentWorkload, 0);
  }, [chartData]);

  const overCapacityInvestigators = useMemo(() => {
    return chartData.filter(d => d.isOverCapacity);
  }, [chartData]);

  const atCapacityInvestigators = useMemo(() => {
    return chartData.filter(d => d.isAtCapacity);
  }, [chartData]);

  const availableHeadroom = useMemo(() => {
    return chartData
      .filter(d => d.status === 'AVAILABLE' && d.currentWorkload < d.maxCapacity)
      .reduce((acc, d) => acc + (d.maxCapacity - d.currentWorkload), 0);
  }, [chartData]);

  const unassignedCases = useMemo(() => {
    return activeCases.filter(c => !c.assigneeId || c.assigneeId === '');
  }, [activeCases]);

  // D3 Chart Rendering
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const containerWidth = containerRef.current.clientWidth || 800;
    const height = 400;
    const margin = { top: 60, right: 30, bottom: 85, left: 50 };
    const width = containerWidth - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg
      .attr('width', containerWidth)
      .attr('height', height)
      .attr('viewBox', `0 0 ${containerWidth} ${height}`);

    // Create defs for patterns (e.g., striped pattern for over-capacity indication)
    const defs = svg.append('defs');
    const pattern = defs.append('pattern')
      .attr('id', 'over-capacity-stripe')
      .attr('width', 8)
      .attr('height', 8)
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('patternTransform', 'rotate(45)');
    
    pattern.append('rect')
      .attr('width', 4)
      .attr('height', 8)
      .attr('fill', '#ef4444');
    pattern.append('rect')
      .attr('x', 4)
      .attr('width', 4)
      .attr('height', 8)
      .attr('fill', '#b91c1c');

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Determine keys & color scale based on selected dimension
    const keys = dimension === 'PRIORITY'
      ? ['low', 'medium', 'high', 'critical']
      : ['newCases', 'inReview', 'waitingInfo', 'specialist', 'escalated'];

    const colorMap = dimension === 'PRIORITY' ? PRIORITY_COLORS : STATUS_COLORS;

    // Stack generator
    const stack = d3.stack<InvestigatorChartDatum>()
      .keys(keys)
      .value((d, key) => (d as any)[key] || 0);

    const series = stack(filteredData);

    // Compute max Y domain (max of workloads and maxCapacities + cushion)
    const maxVal = d3.max(filteredData, d => Math.max(d.currentWorkload, d.maxCapacity)) || 5;
    const yMax = Math.max(maxVal + 2, 6);

    // Scales
    const x = d3.scaleBand()
      .domain(filteredData.map(d => d.id))
      .range([0, width])
      .padding(0.35);

    const y = d3.scaleLinear()
      .domain([0, yMax])
      .nice()
      .range([innerHeight, 0]);

    // Grid lines for readability
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3.axisLeft(y)
          .ticks(5)
          .tickSize(-width)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', '#f1f5f9')
      .attr('stroke-width', 1);

    g.select('.grid .domain').remove();

    // Render Stacked Bars
    const layer = g.selectAll('.layer')
      .data(series)
      .enter()
      .append('g')
      .attr('class', 'layer')
      .attr('fill', d => colorMap[d.key]);

    layer.selectAll('rect')
      .data(d => d)
      .enter()
      .append('rect')
      .attr('x', d => x(d.data.id) || 0)
      .attr('y', d => y(d[1]))
      .attr('height', d => Math.max(0, y(d[0]) - y(d[1])))
      .attr('width', x.bandwidth())
      .attr('rx', 2)
      .attr('class', 'transition-all duration-200 cursor-pointer hover:opacity-90')
      .on('mouseenter', function(event, d) {
        const key = (d3.select(this.parentNode as any).datum() as any).key;
        const datum = d.data;
        const segmentCases = datum.cases.filter(c => {
          if (dimension === 'PRIORITY') {
            return c.initialPriority.toLowerCase() === key;
          } else {
            if (key === 'newCases') return c.status === 'NEW';
            if (key === 'inReview') return c.status === 'IN_REVIEW';
            if (key === 'waitingInfo') return c.status === 'WAITING_FOR_INFORMATION' || c.status === 'ADDITIONAL_VERIFICATION';
            if (key === 'specialist') return c.status === 'AWAITING_SPECIALIST' || c.status === 'SUPERVISOR_REVIEW';
            if (key === 'escalated') return c.status === 'ESCALATED';
            return false;
          }
        });

        const [mouseX, mouseY] = d3.pointer(event, containerRef.current);
        const label = dimension === 'PRIORITY' ? PRIORITY_LABELS[key] : STATUS_LABELS[key];

        setTooltip({
          x: mouseX,
          y: mouseY,
          investigatorName: datum.name,
          role: datum.role,
          category: label,
          count: d[1] - d[0],
          totalWorkload: datum.currentWorkload,
          maxCapacity: datum.maxCapacity,
          isOverCapacity: datum.isOverCapacity,
          isAtCapacity: datum.isAtCapacity,
          cases: segmentCases
        });
      })
      .on('mousemove', function(event) {
        const [mouseX, mouseY] = d3.pointer(event, containerRef.current);
        setTooltip(prev => prev ? { ...prev, x: mouseX, y: mouseY } : null);
      })
      .on('mouseleave', function() {
        setTooltip(null);
      })
      .on('click', function(event, d) {
        setSelectedInvestigatorId(d.data.id === selectedInvestigatorId ? null : d.data.id);
      });

    // Render Investigator Capacity Markers & Over-Capacity Indicators
    filteredData.forEach(d => {
      const barX = x(d.id);
      if (barX === undefined) return;
      const barW = x.bandwidth();
      const capY = y(d.maxCapacity);
      const topY = y(d.currentWorkload);

      // 1. Max Capacity Target Line across the individual bar
      const capMarkerGroup = g.append('g').attr('class', 'capacity-marker');

      capMarkerGroup.append('line')
        .attr('x1', barX - 4)
        .attr('x2', barX + barW + 4)
        .attr('y1', capY)
        .attr('y2', capY)
        .attr('stroke', d.isOverCapacity ? '#ef4444' : d.isAtCapacity ? '#f59e0b' : '#64748b')
        .attr('stroke-width', 2.5)
        .attr('stroke-dasharray', '4,3');

      // Max capacity numeric tag right beside the line
      capMarkerGroup.append('text')
        .attr('x', barX + barW + 6)
        .attr('y', capY + 3)
        .attr('font-size', '10px')
        .attr('font-weight', '600')
        .attr('fill', d.isOverCapacity ? '#ef4444' : d.isAtCapacity ? '#d97706' : '#64748b')
        .text(`Cap: ${d.maxCapacity}`);

      // 2. Over-Capacity visual indicator callout
      if (d.isOverCapacity) {
        const overCount = d.currentWorkload - d.maxCapacity;

        // Overlay a striped alert cap on the portion that exceeds capacity
        g.append('rect')
          .attr('x', barX)
          .attr('y', topY)
          .attr('width', barW)
          .attr('height', capY - topY)
          .attr('fill', 'none')
          .attr('stroke', '#ef4444')
          .attr('stroke-width', 2)
          .attr('rx', 2);

        // Alert Badge on top of the bar
        const badgeY = topY - 24;
        const badge = g.append('g')
          .attr('class', 'over-capacity-badge cursor-pointer')
          .on('click', () => setSelectedInvestigatorId(d.id));

        // Background pill
        badge.append('rect')
          .attr('x', barX + barW / 2 - 42)
          .attr('y', badgeY)
          .attr('width', 84)
          .attr('height', 18)
          .attr('rx', 4)
          .attr('fill', '#fee2e2')
          .attr('stroke', '#ef4444')
          .attr('stroke-width', 1);

        badge.append('text')
          .attr('x', barX + barW / 2)
          .attr('y', badgeY + 12)
          .attr('text-anchor', 'middle')
          .attr('font-size', '9px')
          .attr('font-weight', '700')
          .attr('fill', '#b91c1c')
          .text(`⚠️ +${overCount} OVER MAX`);
      } else if (d.isAtCapacity) {
        // At Capacity Badge
        const badgeY = topY - 22;
        const badge = g.append('g')
          .attr('class', 'at-capacity-badge cursor-pointer')
          .on('click', () => setSelectedInvestigatorId(d.id));

        badge.append('rect')
          .attr('x', barX + barW / 2 - 36)
          .attr('y', badgeY)
          .attr('width', 72)
          .attr('height', 17)
          .attr('rx', 4)
          .attr('fill', '#fef3c7')
          .attr('stroke', '#f59e0b')
          .attr('stroke-width', 1);

        badge.append('text')
          .attr('x', barX + barW / 2)
          .attr('y', badgeY + 11)
          .attr('text-anchor', 'middle')
          .attr('font-size', '9px')
          .attr('font-weight', '700')
          .attr('fill', '#92400e')
          .text(`AT CAPACITY`);
      } else {
        // Under capacity: subtle load indicator
        const slotsLeft = d.maxCapacity - d.currentWorkload;
        g.append('text')
          .attr('x', barX + barW / 2)
          .attr('y', topY - 8)
          .attr('text-anchor', 'middle')
          .attr('font-size', '10px')
          .attr('font-weight', '500')
          .attr('fill', '#64748b')
          .text(`${slotsLeft} left`);
      }
    });

    // Render X Axis with custom formatted labels (name + workload / capacity)
    const xAxis = g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).tickSize(0));

    xAxis.select('.domain').attr('stroke', '#cbd5e1');

    // Customize X axis tick labels
    xAxis.selectAll('.tick text').remove(); // Clear standard text

    xAxis.selectAll('.tick')
      .each(function(d) {
        const tick = d3.select(this);
        const datum = filteredData.find(item => item.id === d);
        if (!datum) return;

        const isSelected = selectedInvestigatorId === datum.id;

        // Container group for click
        const tickGroup = tick.append('g')
          .attr('class', 'cursor-pointer')
          .on('click', () => {
            setSelectedInvestigatorId(datum.id === selectedInvestigatorId ? null : datum.id);
          });

        // Background highlight if selected
        if (isSelected) {
          tickGroup.append('rect')
            .attr('x', -40)
            .attr('y', 6)
            .attr('width', 80)
            .attr('height', 44)
            .attr('rx', 4)
            .attr('fill', '#ccfbf1')
            .attr('stroke', '#0d9488');
        }

        // Status indicator dot
        const dotColor = datum.status === 'AVAILABLE' ? '#10b981' : datum.status === 'BUSY' ? '#f59e0b' : '#94a3b8';
        tickGroup.append('circle')
          .attr('cx', -30)
          .attr('cy', 16)
          .attr('r', 3)
          .attr('fill', dotColor);

        // Investigator First/Last name
        tickGroup.append('text')
          .attr('x', 0)
          .attr('y', 19)
          .attr('text-anchor', 'middle')
          .attr('font-size', '11px')
          .attr('font-weight', isSelected ? '700' : '600')
          .attr('fill', isSelected ? '#0f766e' : '#1e293b')
          .text(datum.name.split(' ')[0] + ' ' + (datum.name.split(' ')[1]?.[0] || '') + '.');

        // Workload / Capacity ratio sublabel
        const ratioColor = datum.isOverCapacity ? '#dc2626' : datum.isAtCapacity ? '#d97706' : '#64748b';
        tickGroup.append('text')
          .attr('x', 0)
          .attr('y', 34)
          .attr('text-anchor', 'middle')
          .attr('font-size', '10px')
          .attr('font-weight', datum.isOverCapacity || datum.isAtCapacity ? '700' : '500')
          .attr('font-family', 'monospace')
          .attr('fill', ratioColor)
          .text(`${datum.currentWorkload} / ${datum.maxCapacity} cases`);

        // Duty status
        tickGroup.append('text')
          .attr('x', 0)
          .attr('y', 46)
          .attr('text-anchor', 'middle')
          .attr('font-size', '8.5px')
          .attr('font-weight', '500')
          .attr('fill', '#94a3b8')
          .text(datum.status);
      });

    // Render Y Axis
    const yAxis = g.append('g')
      .call(d3.axisLeft(y).ticks(yMax <= 8 ? yMax : 6).tickFormat(d => `${d}`));

    yAxis.select('.domain').attr('stroke', '#cbd5e1');
    yAxis.selectAll('.tick line').attr('stroke', '#cbd5e1');
    yAxis.selectAll('.tick text')
      .attr('font-size', '11px')
      .attr('fill', '#64748b');

    // Y Axis Title
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -36)
      .attr('x', -innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('fill', '#64748b')
      .text('Active Cases Assigned');

  }, [filteredData, dimension, selectedInvestigatorId]);

  // Handle rebalance trigger
  const handleAutoRebalance = async () => {
    setIsRebalancing(true);
    try {
      await onAutoAssign({ rebalanceAll: true });
      if (onRefresh) await onRefresh();
    } finally {
      setIsRebalancing(false);
    }
  };

  // Handle reassignment modal submit
  const handleConfirmReassign = async () => {
    if (!reassignModalCase || !targetInvestigatorId) return;
    try {
      await onAssignCase(reassignModalCase.caseId, targetInvestigatorId);
      setReassignModalCase(null);
      setTargetInvestigatorId('');
      if (onRefresh) await onRefresh();
    } catch (err) {
      console.error('Reassignment failed:', err);
    }
  };

  // Selected investigator record
  const selectedInvestigator = useMemo(() => {
    if (!selectedInvestigatorId) return null;
    return chartData.find(d => d.id === selectedInvestigatorId) || null;
  }, [chartData, selectedInvestigatorId]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header & Context Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToCases}
              className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to cases</span>
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-teal-800">Operational Capacity</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Team Capacity & Caseload Distribution
            </h1>
            {overCapacityInvestigators.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800 border border-red-200 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                {overCapacityInvestigators.length} Over Capacity
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600">
            Real-time D3 stacked workload visualization across specialist fraud desks with load limits and queue rebalancing.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {onRefresh && (
            <button
              onClick={() => onRefresh()}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors"
              title="Refresh Team Capacity"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleAutoRebalance}
            disabled={isRebalancing}
            className="px-3.5 py-2 text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white rounded-md shadow-xs flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isRebalancing ? 'Rebalancing...' : 'Auto-Rebalance Queue'}</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Strip (Zero-pill discipline) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Utilization */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Team Utilization
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {totalCapacity > 0 ? Math.round((totalAssignedWorkload / totalCapacity) * 100) : 0}%
            </span>
            <span className="text-xs text-slate-500 font-mono">
              ({totalAssignedWorkload}/{totalCapacity} cases)
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                totalAssignedWorkload > totalCapacity ? 'bg-red-500' :
                totalAssignedWorkload >= totalCapacity * 0.85 ? 'bg-amber-500' : 'bg-teal-600'
              }`}
              style={{ width: `${Math.min(100, totalCapacity > 0 ? (totalAssignedWorkload / totalCapacity) * 100 : 0)}%` }}
            />
          </div>
        </div>

        {/* Over Capacity Desks */}
        <div className={`p-4 rounded-lg border shadow-2xs transition-colors ${
          overCapacityInvestigators.length > 0 ? 'bg-red-50/50 border-red-200' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Over Capacity
            </span>
            {overCapacityInvestigators.length > 0 ? (
              <AlertTriangle className="w-4 h-4 text-red-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            )}
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-900">
            {overCapacityInvestigators.length}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {overCapacityInvestigators.length > 0 
              ? `${overCapacityInvestigators.map(i => i.name.split(' ')[0]).join(', ')} exceeded max limit`
              : 'All specialists within limits'}
          </div>
        </div>

        {/* At Capacity Desks */}
        <div className={`p-4 rounded-lg border shadow-2xs transition-colors ${
          atCapacityInvestigators.length > 0 ? 'bg-amber-50/40 border-amber-200' : 'bg-white border-slate-200'
        }`}>
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            At Max Capacity
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-900">
            {atCapacityInvestigators.length}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {atCapacityInvestigators.length > 0
              ? `${atCapacityInvestigators.length} investigator(s) at 100% capacity`
              : 'None at exact maximum'}
          </div>
        </div>

        {/* Available Headroom */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Available Headroom
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-teal-700">
            +{availableHeadroom}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Open slots on active duty desks
          </div>
        </div>

        {/* Unassigned Alerts in Intake */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Unassigned Queue
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-900">
            {unassignedCases.length}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {unassignedCases.filter(c => c.initialPriority === 'CRITICAL' || c.initialPriority === 'HIGH').length} urgent pending assignment
          </div>
        </div>
      </div>

      {/* Main Chart Workspace Container */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-5 space-y-4">
        {/* Controls Bar: Dimension Toggle + Filter Selector + Legend */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          
          {/* Interactive Stack Mode Selector (Segmented buttons) */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-md shrink-0">
            <span className="text-[11px] font-semibold text-slate-500 px-2 uppercase tracking-wide">
              Stack by:
            </span>
            <button
              onClick={() => setDimension('PRIORITY')}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                dimension === 'PRIORITY'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Case Priority (Severity)
            </button>
            <button
              onClick={() => setDimension('STATUS')}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                dimension === 'STATUS'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Workflow Stage
            </button>
          </div>

          {/* Filter segment */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">Filter:</span>
            <div className="flex items-center gap-1 text-xs">
              <button
                onClick={() => setFilter('ALL')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  filter === 'ALL' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                All Desks ({chartData.length})
              </button>
              <button
                onClick={() => setFilter('OVER_AT_CAPACITY')}
                className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
                  filter === 'OVER_AT_CAPACITY' 
                    ? 'bg-red-700 text-white font-semibold' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>At / Over Capacity</span>
                <span className="font-mono text-[11px]">
                  ({chartData.filter(d => d.isOverCapacity || d.isAtCapacity).length})
                </span>
              </button>
              <button
                onClick={() => setFilter('AVAILABLE')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  filter === 'AVAILABLE' ? 'bg-teal-700 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Available Headroom ({chartData.filter(d => d.status === 'AVAILABLE' && !d.isOverCapacity && !d.isAtCapacity).length})
              </button>
            </div>
          </div>
        </div>

        {/* Legend & Guide */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs py-1">
          {/* Stacking Legend */}
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
              {dimension === 'PRIORITY' ? 'Priority Stack:' : 'Workflow Stack:'}
            </span>
            {dimension === 'PRIORITY' ? (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs" style={{ backgroundColor: PRIORITY_COLORS.critical }} />
                  <span className="text-slate-700">Critical</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs" style={{ backgroundColor: PRIORITY_COLORS.high }} />
                  <span className="text-slate-700">High</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs" style={{ backgroundColor: PRIORITY_COLORS.medium }} />
                  <span className="text-slate-700">Medium</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs" style={{ backgroundColor: PRIORITY_COLORS.low }} />
                  <span className="text-slate-700">Low</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs" style={{ backgroundColor: STATUS_COLORS.newCases }} />
                  <span className="text-slate-700">New Intake</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs" style={{ backgroundColor: STATUS_COLORS.inReview }} />
                  <span className="text-slate-700">In Review</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs" style={{ backgroundColor: STATUS_COLORS.waitingInfo }} />
                  <span className="text-slate-700">Waiting Info</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs" style={{ backgroundColor: STATUS_COLORS.specialist }} />
                  <span className="text-slate-700">Specialist / Supervisor</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs" style={{ backgroundColor: STATUS_COLORS.escalated }} />
                  <span className="text-slate-700">Escalated</span>
                </div>
              </>
            )}
          </div>

          {/* Capacity Threshold Markers Legend */}
          <div className="flex items-center gap-4 text-[11px] text-slate-500 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 border-t-2 border-dashed border-slate-600 inline-block" />
              <span>Dashed line = Investigator Max Capacity</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 bg-red-100 border border-red-500 rounded-2xs" />
              <span className="text-red-700 font-semibold">Red Border / Top Badge = Over Capacity</span>
            </div>
          </div>
        </div>

        {/* D3 SVG Container with Relative Floating Tooltip */}
        <div ref={containerRef} className="relative w-full overflow-x-auto min-h-[400px]">
          <svg ref={svgRef} className="w-full select-none" />

          {/* D3 Dynamic Tooltip */}
          {tooltip && (
            <div
              className="absolute z-30 pointer-events-none bg-slate-900 text-white rounded-lg p-3 shadow-xl text-xs max-w-xs transition-opacity duration-150"
              style={{
                left: `${Math.min(tooltip.x + 15, (containerRef.current?.clientWidth || 600) - 220)}px`,
                top: `${Math.max(10, tooltip.y - 40)}px`
              }}
            >
              <div className="font-bold text-white flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5 mb-1.5">
                <span>{tooltip.investigatorName}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                  tooltip.isOverCapacity ? 'bg-red-900 text-red-200' :
                  tooltip.isAtCapacity ? 'bg-amber-900 text-amber-200' :
                  'bg-teal-900 text-teal-200'
                }`}>
                  {tooltip.totalWorkload} / {tooltip.maxCapacity}
                </span>
              </div>
              <div className="text-[11px] text-slate-300 mb-1">{tooltip.role}</div>
              <div className="text-[11px] flex items-center justify-between gap-4 py-1 border-t border-slate-800">
                <span className="text-slate-400">{tooltip.category}:</span>
                <span className="font-bold font-mono text-teal-300">{tooltip.count} cases</span>
              </div>
              {tooltip.cases.length > 0 && (
                <div className="mt-1 pt-1 border-t border-slate-800 text-[10px] text-slate-400 space-y-0.5">
                  <div className="font-semibold text-slate-300">Matching Cases:</div>
                  {tooltip.cases.slice(0, 3).map(c => (
                    <div key={c.caseId} className="flex justify-between font-mono">
                      <span>{c.caseId}</span>
                      <span className="truncate max-w-[100px] text-slate-400">{c.applicantName}</span>
                    </div>
                  ))}
                  {tooltip.cases.length > 3 && (
                    <div className="italic text-slate-500">+{tooltip.cases.length - 3} more cases</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="text-center text-[11px] text-slate-400 italic">
          Tip: Click any bar or column header to inspect active cases or reassign workload directly.
        </div>
      </div>

      {/* Selected Investigator Inspector or Team Roster Breakdown */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {selectedInvestigator 
                ? `Caseload Drilldown: ${selectedInvestigator.name}`
                : 'Investigator Capacity & Workload Roster'}
            </h2>
            {selectedInvestigator && (
              <button
                onClick={() => setSelectedInvestigatorId(null)}
                className="text-xs text-teal-700 hover:underline font-medium ml-2"
              >
                (View all investigators)
              </button>
            )}
          </div>
          
          <span className="text-xs text-slate-500 font-mono">
            {investigators.filter(i => i.status === 'AVAILABLE').length} on-duty · {overCapacityInvestigators.length} over limit
          </span>
        </div>

        {/* Investigator Cards Grid */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(selectedInvestigator ? [selectedInvestigator] : chartData).map(inv => {
            return (
              <div
                key={inv.id}
                className={`rounded-lg border p-4 flex flex-col justify-between transition-all ${
                  inv.isOverCapacity
                    ? 'border-red-300 bg-red-50/20 ring-1 ring-red-300'
                    : inv.isAtCapacity
                    ? 'border-amber-300 bg-amber-50/20 ring-1 ring-amber-300'
                    : selectedInvestigatorId === inv.id
                    ? 'border-teal-500 bg-teal-50/20 ring-1 ring-teal-500'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="space-y-3">
                  {/* Card Header: Name + Duty Status Selector */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{inv.name}</span>
                        {inv.isOverCapacity && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                            OVER CAPACITY
                          </span>
                        )}
                        {inv.isAtCapacity && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            AT CAPACITY
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">{inv.role}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{inv.specialization}</div>
                    </div>

                    {/* Declared Availability status badge (Section 33: Self-owned only) */}
                    <span 
                      className={`text-[10px] font-semibold px-2 py-1 rounded border inline-flex items-center gap-1.5 ${
                        inv.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        inv.status === 'BUSY' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        inv.status === 'AWAY' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                        'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                      title="Declared personal availability (Self-owned only)"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        inv.status === 'AVAILABLE' ? 'bg-emerald-500' :
                        inv.status === 'BUSY' ? 'bg-amber-500' :
                        inv.status === 'AWAY' ? 'bg-orange-500' : 'bg-slate-400'
                      }`} />
                      <span className="capitalize">{inv.status.toLowerCase()}</span>
                    </span>
                  </div>

                  {/* Visual Progress Bar Component */}
                  <div className="pt-2 border-t border-slate-100">
                    <InvestigatorProgressBar
                      currentWorkload={inv.currentWorkload}
                      maxCapacity={inv.maxCapacity}
                      size="md"
                      showStatusBadge={false}
                    />
                  </div>

                  {/* Active Cases Summary or List */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>Assigned Active Cases ({inv.cases.length}):</span>
                    </div>

                    {inv.cases.length === 0 ? (
                      <div className="text-xs text-slate-400 italic py-2">
                        No active cases currently assigned. Available for assignment.
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {inv.cases.map(c => (
                          <div 
                            key={c.caseId}
                            className="p-2 rounded bg-slate-50 border border-slate-200/80 hover:bg-slate-100/70 text-xs flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${
                                  c.initialPriority === 'CRITICAL' ? 'bg-red-500' :
                                  c.initialPriority === 'HIGH' ? 'bg-orange-500' :
                                  c.initialPriority === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
                                }`} />
                                <span className="font-mono font-bold text-slate-900 truncate">
                                  {c.caseId}
                                </span>
                                <span className="text-[11px] text-slate-500 truncate">
                                  · {c.applicantName}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                                {c.product} · {c.status}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => {
                                  setReassignModalCase(c);
                                  setTargetInvestigatorId(
                                    investigators.find(i => i.id !== inv.id && i.status === 'AVAILABLE')?.id || ''
                                  );
                                }}
                                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-white rounded border border-transparent hover:border-slate-200 transition-colors"
                                title="Reassign to another specialist"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => onSelectCase(c.caseId)}
                                className="p-1 text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded transition-colors"
                                title="Open case in review workstation"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 font-mono">
                    {inv.isOverCapacity ? `Exceeds limit by ${inv.currentWorkload - inv.maxCapacity}` :
                     inv.isAtCapacity ? 'Operating at max ceiling' :
                     `${inv.maxCapacity - inv.currentWorkload} case capacity open`}
                  </span>

                  <button
                    onClick={() => setSelectedInvestigatorId(inv.id === selectedInvestigatorId ? null : inv.id)}
                    className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1"
                  >
                    <span>{selectedInvestigatorId === inv.id ? 'Collapse' : 'Focus'}</span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${selectedInvestigatorId === inv.id ? 'rotate-90' : ''}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Manual Reassignment Modal */}
      {reassignModalCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-teal-700" />
                <h3 className="text-sm font-bold text-slate-900">Reassign Active Case</h3>
              </div>
              <button
                onClick={() => setReassignModalCase(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
                <div className="font-mono font-bold text-slate-900">{reassignModalCase.caseId}</div>
                <div>Applicant: <span className="font-medium text-slate-800">{reassignModalCase.applicantName}</span></div>
                <div>Priority: <span className="font-bold text-slate-900">{reassignModalCase.initialPriority}</span></div>
                <div>Current Assignee: <span className="font-medium text-slate-800">{reassignModalCase.assigneeName || 'Unassigned'}</span></div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Destination Specialist Desk:
                </label>
                <select
                  value={targetInvestigatorId}
                  onChange={(e) => setTargetInvestigatorId(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-slate-300 bg-white focus:ring-1 focus:ring-teal-600 focus:outline-hidden"
                >
                  <option value="">-- Choose Investigator --</option>
                  {investigators.map(inv => {
                    const isOver = inv.currentWorkload >= inv.maxCapacity;
                    return (
                      <option 
                        key={inv.id} 
                        value={inv.id}
                        disabled={inv.id === reassignModalCase.assigneeId}
                      >
                        {inv.name} ({inv.currentWorkload}/{inv.maxCapacity} cases) - {inv.status} {isOver ? '[FULL]' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setReassignModalCase(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReassign}
                disabled={!targetInvestigatorId || targetInvestigatorId === reassignModalCase.assigneeId}
                className="px-3.5 py-1.5 text-xs font-semibold bg-teal-700 text-white rounded hover:bg-teal-800 disabled:opacity-50"
              >
                Confirm Reassignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
