import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Clock, 
  Languages, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Edit3, 
  Trash2, 
  Search, 
  Filter, 
  ChevronRight,
  ArrowRight,
  Layers,
  Sparkles,
  BarChart3,
  UserCheck,
  RefreshCw,
  Check,
  X
} from 'lucide-react';
import { 
  Investigator, 
  InvestigatorStatus, 
  WorkShift, 
  DualApprovalRequest, 
  ProposedAction 
} from '../../shared/types';
import { ACTION_DEFINITIONS } from '../../shared/copy/dictionary';

interface SuperAdminWorkforceViewProps {
  investigators: Investigator[];
  onRefresh: () => Promise<void>;
  onSelectCase?: (caseId: string) => void;
}

const DEPARTMENTS = [
  'Retail Banking Fraud',
  'Special Investigations Unit (SIU)',
  'Identity & Biometrics',
  'Digital Onboarding Risk',
  'Card & Payments Fraud',
  'Fraud Operations Leadership'
];

const QUEUES = [
  'High Priority Retail',
  'Shared Device Rings',
  'Synthetic Identity',
  'Rapid Onboarding',
  'Credit Cards & Velocity',
  'Supervisor Sign-off & Complex Escalations'
];

const AVAILABLE_LANGUAGES = [
  'English', 'Spanish', 'Mandarin', 'Hindi', 'French', 'Russian', 'German', 'Portuguese', 'Korean', 'Arabic'
];

export const SuperAdminWorkforceView: React.FC<SuperAdminWorkforceViewProps> = ({
  investigators,
  onRefresh,
  onSelectCase
}) => {
  const [activeTab, setActiveTab] = useState<'WORKFORCE' | 'DUAL_APPROVAL' | 'SHIFT_COVERAGE'>('WORKFORCE');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('ALL');
  const [filterShift, setFilterShift] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Dual Approvals State
  const [dualApprovalRequests, setDualApprovalRequests] = useState<DualApprovalRequest[]>([]);
  const [isLoadingApprovals, setIsLoadingApprovals] = useState(false);
  const [resolvingRequestId, setResolvingRequestId] = useState<string | null>(null);
  const [supervisorNotes, setSupervisorNotes] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingInvestigator, setEditingInvestigator] = useState<Investigator | null>(null);
  const [deletingInvestigator, setDeletingInvestigator] = useState<Investigator | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<string>('');

  // Form State for Add / Edit
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    role: string;
    specialization: string;
    department: string;
    shift: WorkShift;
    languages: string[];
    maxCapacity: number;
    queue: string;
    avatarColor: string;
    supervisorName: string;
    dualApprovalEnforced: boolean;
  }>({
    name: '',
    email: '',
    role: 'Fraud Investigator',
    specialization: 'General Retail Fraud',
    department: 'Retail Banking Fraud',
    shift: 'MORNING',
    languages: ['English'],
    maxCapacity: 5,
    queue: 'High Priority Retail',
    avatarColor: 'indigo',
    supervisorName: 'Sarah Chen (Super Admin)',
    dualApprovalEnforced: true
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchDualApprovals();
  }, []);

  const fetchDualApprovals = async () => {
    setIsLoadingApprovals(true);
    try {
      const res = await fetch('/api/dual-approvals');
      const data = await res.json();
      setDualApprovalRequests(data.requests || []);
    } catch (err) {
      console.error('Failed to load dual approvals:', err);
    } finally {
      setIsLoadingApprovals(false);
    }
  };

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      email: '',
      role: 'Fraud Investigator',
      specialization: 'General Retail Fraud',
      department: 'Retail Banking Fraud',
      shift: 'MORNING',
      languages: ['English'],
      maxCapacity: 5,
      queue: 'High Priority Retail',
      avatarColor: 'teal',
      supervisorName: 'Sarah Chen (Super Admin)',
      dualApprovalEnforced: true
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (inv: Investigator) => {
    setEditingInvestigator(inv);
    setFormData({
      name: inv.name,
      email: inv.email,
      role: inv.role,
      specialization: inv.specialization || '',
      department: inv.department || 'Retail Banking Fraud',
      shift: inv.shift || 'MORNING',
      languages: inv.languages || ['English'],
      maxCapacity: inv.maxCapacity,
      queue: inv.queue || 'High Priority Retail',
      avatarColor: inv.avatarColor || 'indigo',
      supervisorName: inv.supervisorName || 'Sarah Chen (Super Admin)',
      dualApprovalEnforced: inv.dualApprovalEnforced ?? true
    });
    setFormError(null);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setFormError('Name and email are required.');
      return;
    }
    setIsSaving(true);
    setFormError(null);
    try {
      const res = await fetch('/api/investigators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create investigator');
      }
      await onRefresh();
      setIsAddModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Error creating investigator');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvestigator) return;
    if (!formData.name.trim() || !formData.email.trim()) {
      setFormError('Name and email are required.');
      return;
    }
    setIsSaving(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/investigators/${editingInvestigator.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update investigator');
      }
      await onRefresh();
      setEditingInvestigator(null);
    } catch (err: any) {
      setFormError(err.message || 'Error updating investigator');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingInvestigator) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/investigators/${deletingInvestigator.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reassignToId: reassignTargetId })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete investigator');
      }
      await onRefresh();
      setDeletingInvestigator(null);
      setReassignTargetId('');
    } catch (err: any) {
      alert(err.message || 'Error deleting investigator');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (id: string, newStatus: InvestigatorStatus) => {
    try {
      await fetch(`/api/investigators/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      await onRefresh();
    } catch (err) {
      console.error('Failed to change status:', err);
    }
  };

  const handleResolveDualApproval = async (requestId: string, decision: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch(`/api/dual-approvals/${requestId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          supervisorId: 'sup-901',
          supervisorNotes: supervisorNotes.trim() || (decision === 'APPROVED' ? 'Approved by Super Admin' : 'Returned for additional evidence')
        })
      });
      if (res.ok) {
        await fetchDualApprovals();
        await onRefresh();
        setResolvingRequestId(null);
        setSupervisorNotes('');
      }
    } catch (err) {
      console.error('Failed to resolve dual approval:', err);
    }
  };

  // Filtered list
  const filteredInvestigators = investigators.filter(inv => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = 
        inv.name.toLowerCase().includes(q) || 
        inv.email.toLowerCase().includes(q) || 
        inv.role.toLowerCase().includes(q) ||
        (inv.department && inv.department.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (filterDepartment !== 'ALL' && inv.department !== filterDepartment) return false;
    if (filterShift !== 'ALL' && inv.shift !== filterShift) return false;
    if (filterStatus !== 'ALL' && inv.status !== filterStatus) return false;
    return true;
  });

  // Workforce aggregate statistics
  const totalCapacity = investigators.reduce((sum, i) => sum + i.maxCapacity, 0);
  const totalCurrentWorkload = investigators.reduce((sum, i) => sum + i.currentWorkload, 0);
  const activeCount = investigators.filter(i => i.status === 'AVAILABLE').length;
  const pendingApprovalsCount = dualApprovalRequests.filter(r => r.status === 'PENDING_SUPERVISOR').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Stat Cards */}
      <div className="bg-slate-900 text-white p-6 rounded-xl shadow-sm border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                SUPER ADMIN
              </span>
              <h1 className="text-xl font-bold tracking-tight text-white">Workforce Management & Governance</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Oversee investigator capacity, shift rotations, dual-approval controls, and departmental case distribution.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenAddModal}
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Investigator</span>
            </button>
            <button
              onClick={async () => {
                await onRefresh();
                await fetchDualApprovals();
              }}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
              title="Refresh workforce roster"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
          <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700/60">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Total Investigators</div>
            <div className="text-2xl font-bold text-white mt-1">{investigators.length}</div>
            <div className="text-xs text-teal-400 mt-1 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" />
              <span>{activeCount} on active duty</span>
            </div>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700/60">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Team Workload / Capacity</div>
            <div className="text-2xl font-bold text-white mt-1">
              {totalCurrentWorkload} <span className="text-sm font-normal text-slate-400">/ {totalCapacity}</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {totalCapacity > 0 ? Math.round((totalCurrentWorkload / totalCapacity) * 100) : 0}% team utilization
            </div>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700/60">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Pending Dual Approvals</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">{pendingApprovalsCount}</div>
            <div className="text-xs text-slate-400 mt-1">
              Supervisor sign-off queue
            </div>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700/60">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Shift Coverage</div>
            <div className="text-2xl font-bold text-white mt-1">4 Shifts</div>
            <div className="text-xs text-emerald-400 mt-1">
              Morning, Evening, Night & Weekend
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('WORKFORCE')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'WORKFORCE'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Investigator Roster ({investigators.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('DUAL_APPROVAL')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'DUAL_APPROVAL'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Dual Approval Sign-off Queue</span>
          {pendingApprovalsCount > 0 && (
            <span className="px-1.5 py-0.5 text-[11px] rounded-full bg-amber-500 text-white font-bold">
              {pendingApprovalsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('SHIFT_COVERAGE')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'SHIFT_COVERAGE'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Shift Rotations & Language Coverage</span>
        </button>
      </div>

      {/* TAB 1: WORKFORCE ROSTER */}
      {activeTab === 'WORKFORCE' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, department or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-0 focus:outline-hidden text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Department Filter */}
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="border border-slate-200 rounded px-2.5 py-1.5 bg-slate-50 text-slate-700 font-medium"
              >
                <option value="ALL">All Departments</option>
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              {/* Shift Filter */}
              <select
                value={filterShift}
                onChange={(e) => setFilterShift(e.target.value)}
                className="border border-slate-200 rounded px-2.5 py-1.5 bg-slate-50 text-slate-700 font-medium"
              >
                <option value="ALL">All Shifts</option>
                <option value="MORNING">Morning Shift</option>
                <option value="EVENING">Evening Shift</option>
                <option value="NIGHT">Night Shift</option>
                <option value="WEEKEND">Weekend Flex</option>
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-slate-200 rounded px-2.5 py-1.5 bg-slate-50 text-slate-700 font-medium"
              >
                <option value="ALL">All Statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="BUSY">Busy</option>
                <option value="AWAY">Away</option>
                <option value="OFFLINE">Offline</option>
              </select>
            </div>
          </div>

          {/* Investigators Table */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Investigator</th>
                  <th className="py-3 px-4">Department & Queue</th>
                  <th className="py-3 px-4">Shift</th>
                  <th className="py-3 px-4">Languages</th>
                  <th className="py-3 px-4">Capacity Load</th>
                  <th className="py-3 px-4">Dual Approval</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvestigators.map(inv => {
                  const capacityPercent = Math.round((inv.currentWorkload / inv.maxCapacity) * 100);
                  const isOver = inv.currentWorkload > inv.maxCapacity;
                  const isAt = inv.currentWorkload === inv.maxCapacity;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs ${
                            inv.avatarColor === 'teal' ? 'bg-teal-600' :
                            inv.avatarColor === 'blue' ? 'bg-blue-600' :
                            inv.avatarColor === 'indigo' ? 'bg-indigo-600' :
                            inv.avatarColor === 'emerald' ? 'bg-emerald-600' :
                            inv.avatarColor === 'purple' ? 'bg-purple-600' :
                            'bg-amber-600'
                          }`}>
                            {inv.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{inv.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{inv.email}</div>
                            <div className="text-[11px] text-slate-600 italic">{inv.role}</div>
                          </div>
                        </div>
                      </td>

                      {/* Department & Queue */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{inv.department || 'Retail Banking'}</div>
                        <div className="text-[11px] text-teal-700 font-medium">{inv.queue || 'High Priority Retail'}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[180px]">{inv.specialization}</div>
                      </td>

                      {/* Shift */}
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          inv.shift === 'MORNING' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          inv.shift === 'EVENING' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                          inv.shift === 'NIGHT' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                          'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {inv.shift || 'MORNING'}
                        </span>
                      </td>

                      {/* Languages */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[140px]">
                          {(inv.languages || ['English']).map(lang => (
                            <span key={lang} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                              {lang}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Capacity Load */}
                      <td className="py-3 px-4">
                        <div className="w-28 space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="font-semibold text-slate-800">{inv.currentWorkload} / {inv.maxCapacity}</span>
                            <span className={`text-[10px] font-bold ${isOver ? 'text-rose-600' : isAt ? 'text-amber-600' : 'text-slate-500'}`}>
                              {capacityPercent}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                isOver ? 'bg-rose-500' : isAt ? 'bg-amber-500' : 'bg-teal-500'
                              }`}
                              style={{ width: `${Math.min(capacityPercent, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Dual Approval Badge */}
                      <td className="py-3 px-4">
                        {inv.dualApprovalEnforced ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-purple-50 text-purple-700 border border-purple-200 font-semibold" title="Dispositions must be co-approved by Supervisor">
                            <ShieldCheck className="w-3 h-3" />
                            Enforced
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-600 border border-slate-200">
                            Autonomous
                          </span>
                        )}
                      </td>

                      {/* Duty Status */}
                      <td className="py-3 px-4">
                        <select
                          value={inv.status}
                          onChange={(e) => handleToggleStatus(inv.id, e.target.value as InvestigatorStatus)}
                          className={`text-xs font-semibold rounded px-2 py-1 border transition-colors ${
                            inv.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                            inv.status === 'BUSY' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                            inv.status === 'AWAY' ? 'bg-slate-100 text-slate-700 border-slate-300' :
                            'bg-slate-200 text-slate-600 border-slate-400'
                          }`}
                        >
                          <option value="AVAILABLE">Available</option>
                          <option value="BUSY">Busy</option>
                          <option value="AWAY">Away</option>
                          <option value="OFFLINE">Offline</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(inv)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded transition-colors"
                            title="Edit investigator attributes"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingInvestigator(inv)}
                            className="p-1.5 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded transition-colors"
                            title="Deactivate / remove investigator"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: DUAL APPROVAL SIGN-OFF QUEUE */}
      {activeTab === 'DUAL_APPROVAL' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-900 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Dual-Approval Protocol (Policy Governance P07 / SOX)</div>
              <p className="mt-0.5 text-amber-800">
                Investigators with enforced dual-approval cannot unilaterally close or clear high-exposure cases. The Super Admin or designated Fraud Supervisor must review the proposed action, evidentiary justification, and sign off.
              </p>
            </div>
          </div>

          {dualApprovalRequests.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-lg border border-slate-200 text-slate-500 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <div className="font-bold text-slate-800 text-sm">Dual Approval Queue is Clear</div>
              <p className="mt-1">No cases currently awaiting supervisor sign-off.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dualApprovalRequests.map(req => {
                const actionLabel = ACTION_DEFINITIONS[req.proposedDisposition]?.label || req.proposedDisposition;
                const isPending = req.status === 'PENDING_SUPERVISOR';

                return (
                  <div key={req.requestId} className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-900 text-sm">{req.caseId}</span>
                        <span className="text-xs text-slate-600 font-semibold">{req.applicantName}</span>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          isPending ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}>
                          {req.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500">
                        Submitted: {new Date(req.submittedAt).toLocaleString()}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-2 bg-slate-50 p-3.5 rounded border border-slate-100">
                        <div>
                          <span className="text-slate-400 font-semibold uppercase text-[10px]">Investigator</span>
                          <div className="font-bold text-slate-900">{req.investigatorName}</div>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold uppercase text-[10px]">Proposed Action</span>
                          <div className="font-bold text-teal-800 text-sm">{actionLabel}</div>
                          <div className="text-slate-500 font-mono text-[11px]">{req.reasonCode}</div>
                        </div>
                      </div>

                      <div className="space-y-1 bg-slate-50 p-3.5 rounded border border-slate-100">
                        <span className="text-slate-400 font-semibold uppercase text-[10px]">Investigator Rationale</span>
                        <p className="text-slate-700 leading-relaxed italic">{req.rationale}</p>
                      </div>
                    </div>

                    {/* Supervisor Review Form / Outcome */}
                    {isPending ? (
                      <div className="bg-teal-50/60 p-4 rounded-lg border border-teal-200 space-y-3">
                        <div className="text-xs font-bold text-teal-900">Supervisor Decision & Co-Signature</div>
                        <input
                          type="text"
                          placeholder="Optional supervisor notes or feedback..."
                          value={resolvingRequestId === req.requestId ? supervisorNotes : ''}
                          onChange={(e) => {
                            setResolvingRequestId(req.requestId);
                            setSupervisorNotes(e.target.value);
                          }}
                          className="w-full text-xs bg-white border border-slate-200 rounded px-3 py-2 text-slate-800"
                        />
                        <div className="flex items-center justify-between pt-1">
                          {onSelectCase && (
                            <button
                              onClick={() => onSelectCase(req.caseId)}
                              className="text-xs text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1"
                            >
                              <span>Examine case details</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <div className="flex items-center gap-2 ml-auto">
                            <button
                              onClick={() => handleResolveDualApproval(req.requestId, 'REJECTED')}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject / Send Back</span>
                            </button>
                            <button
                              onClick={() => handleResolveDualApproval(req.requestId, 'APPROVED')}
                              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors shadow-xs"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve & Finalize Case</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded border border-slate-200 flex items-center justify-between">
                        <div>
                          <strong>Reviewed by:</strong> {req.supervisorName} at {req.reviewedAt ? new Date(req.reviewedAt).toLocaleString() : ''}
                          {req.supervisorNotes && <div className="mt-0.5 text-slate-500">Note: {req.supervisorNotes}</div>}
                        </div>
                        {onSelectCase && (
                          <button
                            onClick={() => onSelectCase(req.caseId)}
                            className="text-teal-700 hover:text-teal-900 font-semibold"
                          >
                            View Case
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SHIFT ROTATIONS & COVERAGE */}
      {activeTab === 'SHIFT_COVERAGE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Shift Blocks */}
          {(['MORNING', 'EVENING', 'NIGHT', 'WEEKEND'] as WorkShift[]).map(shiftKey => {
            const shiftInvestigators = investigators.filter(i => (i.shift || 'MORNING') === shiftKey);
            const shiftLoad = shiftInvestigators.reduce((s, i) => s + i.currentWorkload, 0);
            const shiftCap = shiftInvestigators.reduce((s, i) => s + i.maxCapacity, 0);

            return (
              <div key={shiftKey} className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-600" />
                    <h3 className="font-bold text-slate-900 text-sm">
                      {shiftKey === 'MORNING' ? 'Morning Shift (08:00 - 16:00)' :
                       shiftKey === 'EVENING' ? 'Evening Shift (16:00 - 00:00)' :
                       shiftKey === 'NIGHT' ? 'Night Shift (00:00 - 08:00)' :
                       'Weekend Flex Rotation'}
                    </h3>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {shiftInvestigators.length} assigned
                  </span>
                </div>

                <div className="text-xs text-slate-500 flex justify-between border-b border-slate-100 pb-2">
                  <span>Capacity Load: <strong>{shiftLoad} / {shiftCap}</strong></span>
                  <span>{shiftCap > 0 ? Math.round((shiftLoad / shiftCap) * 100) : 0}% Active</span>
                </div>

                <div className="space-y-2">
                  {shiftInvestigators.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between text-xs p-2 rounded bg-slate-50 border border-slate-100">
                      <div>
                        <div className="font-semibold text-slate-800">{inv.name}</div>
                        <div className="text-[11px] text-slate-500">{inv.department} • {inv.languages?.join(', ')}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inv.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD INVESTIGATOR MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-600" />
                <span>Add New Investigator</span>
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded border border-rose-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveAdd} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5"
                    placeholder="e.g. Alex Morgan"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Internal Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5"
                    placeholder="a.morgan@bank.internal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 bg-white"
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Assigned Queue</label>
                  <select
                    value={formData.queue}
                    onChange={(e) => setFormData({ ...formData, queue: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 bg-white"
                  >
                    {QUEUES.map(q => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Shift</label>
                  <select
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value as WorkShift })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 bg-white"
                  >
                    <option value="MORNING">Morning</option>
                    <option value="EVENING">Evening</option>
                    <option value="NIGHT">Night</option>
                    <option value="WEEKEND">Weekend</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Max Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={formData.maxCapacity}
                    onChange={(e) => setFormData({ ...formData, maxCapacity: parseInt(e.target.value, 10) || 5 })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Avatar Color</label>
                  <select
                    value={formData.avatarColor}
                    onChange={(e) => setFormData({ ...formData, avatarColor: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 bg-white"
                  >
                    <option value="teal">Teal</option>
                    <option value="blue">Blue</option>
                    <option value="indigo">Indigo</option>
                    <option value="emerald">Emerald</option>
                    <option value="purple">Purple</option>
                    <option value="amber">Amber</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Specialization Focus</label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5"
                  placeholder="e.g. Synthetic Identity & Document Anomaly Detection"
                />
              </div>

              {/* Languages */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Languages Spoken</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {AVAILABLE_LANGUAGES.map(lang => {
                    const isSelected = formData.languages.includes(lang);
                    return (
                      <button
                        type="button"
                        key={lang}
                        onClick={() => {
                          if (isSelected) {
                            if (formData.languages.length > 1) {
                              setFormData({ ...formData, languages: formData.languages.filter(l => l !== lang) });
                            }
                          } else {
                            setFormData({ ...formData, languages: [...formData.languages, lang] });
                          }
                        }}
                        className={`px-2 py-1 rounded text-[11px] font-semibold border transition-colors ${
                          isSelected ? 'bg-teal-600 text-white border-teal-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {lang}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dual Approval Checkbox */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="dualApproval"
                  checked={formData.dualApprovalEnforced}
                  onChange={(e) => setFormData({ ...formData, dualApprovalEnforced: e.target.checked })}
                  className="rounded border-slate-300 text-teal-600"
                />
                <label htmlFor="dualApproval" className="text-slate-800 font-medium">
                  Enforce Supervisor Dual-Approval on Clear & Close dispositions
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-teal-600 text-white rounded font-semibold hover:bg-teal-500 disabled:opacity-50"
                >
                  {isSaving ? 'Creating...' : 'Create Investigator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT INVESTIGATOR MODAL */}
      {editingInvestigator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-teal-600" />
                <span>Edit Investigator: {editingInvestigator.name}</span>
              </h3>
              <button 
                onClick={() => setEditingInvestigator(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded border border-rose-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 bg-white"
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Assigned Queue</label>
                  <select
                    value={formData.queue}
                    onChange={(e) => setFormData({ ...formData, queue: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 bg-white"
                  >
                    {QUEUES.map(q => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Shift</label>
                  <select
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value as WorkShift })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 bg-white"
                  >
                    <option value="MORNING">Morning</option>
                    <option value="EVENING">Evening</option>
                    <option value="NIGHT">Night</option>
                    <option value="WEEKEND">Weekend</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Max Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={formData.maxCapacity}
                    onChange={(e) => setFormData({ ...formData, maxCapacity: parseInt(e.target.value, 10) || 5 })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Supervisor</label>
                  <input
                    type="text"
                    value={formData.supervisorName}
                    onChange={(e) => setFormData({ ...formData, supervisorName: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5"
                  />
                </div>
              </div>

              {/* Dual Approval Checkbox */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="dualApprovalEdit"
                  checked={formData.dualApprovalEnforced}
                  onChange={(e) => setFormData({ ...formData, dualApprovalEnforced: e.target.checked })}
                  className="rounded border-slate-300 text-teal-600"
                />
                <label htmlFor="dualApprovalEdit" className="text-slate-800 font-medium">
                  Enforce Supervisor Dual-Approval
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingInvestigator(null)}
                  className="px-4 py-2 border border-slate-300 rounded font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-teal-600 text-white rounded font-semibold hover:bg-teal-500 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE / DEACTIVATE MODAL */}
      {deletingInvestigator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">Deactivate Investigator</h3>
            </div>

            <p className="text-slate-600">
              Are you sure you want to deactivate <strong>{deletingInvestigator.name}</strong> ({deletingInvestigator.id})?
            </p>

            {deletingInvestigator.currentWorkload > 0 && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded space-y-2">
                <div className="font-semibold text-amber-900">
                  This investigator has {deletingInvestigator.currentWorkload} active case(s) assigned.
                </div>
                <label className="block text-slate-700 font-medium">
                  Reallocate active cases to:
                </label>
                <select
                  value={reassignTargetId}
                  onChange={(e) => setReassignTargetId(e.target.value)}
                  className="w-full border border-slate-300 rounded p-1.5 bg-white text-xs"
                >
                  <option value="">Return to Unassigned Queue</option>
                  {investigators
                    .filter(i => i.id !== deletingInvestigator.id && i.status === 'AVAILABLE')
                    .map(i => (
                      <option key={i.id} value={i.id}>
                        {i.name} (Load: {i.currentWorkload}/{i.maxCapacity})
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setDeletingInvestigator(null)}
                className="px-4 py-2 border border-slate-300 rounded font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSaving}
                className="px-4 py-2 bg-rose-600 text-white rounded font-semibold hover:bg-rose-500 disabled:opacity-50"
              >
                {isSaving ? 'Processing...' : 'Confirm Deactivation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
