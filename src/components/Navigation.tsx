// RiskWeave AI - Multi-Role Navigation Shell
// Conforms strictly to Section 2 (Role-Specific Destinations, Utility Menu, and Availability)

import React, { useState } from 'react';
import { 
  Layers, 
  Wrench, 
  HelpCircle, 
  ChevronDown, 
  BarChart3, 
  UploadCloud, 
  FileCheck2, 
  Cpu, 
  UserCheck,
  Users,
  Bell,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Info,
  User,
  ShieldAlert
} from 'lucide-react';
import { ExecutionMode, InvestigatorStatus } from '../../shared/types';
import { EXECUTION_MODE_LABELS } from '../../shared/copy/dictionary';

export type TopLevelView = 'CASES' | 'INBOX' | 'CAPACITY' | 'WORKFORCE' | 'CUSTOMER_PORTAL' | 'QUALITY_CHECKS' | 'IMPORT' | 'POLICIES';
export type AppUserRole = 'SUPER_ADMIN' | 'INVESTIGATOR' | 'ANALYST' | 'CUSTOMER_PORTAL';

interface NavigationProps {
  currentView: TopLevelView;
  onNavigate: (view: TopLevelView) => void;
  currentRole: AppUserRole;
  currentUserId: string;
  onSelectUserSession: (userId: string, role: AppUserRole) => void;
  availabilityStatus?: InvestigatorStatus;
  onUpdateAvailability?: (status: InvestigatorStatus, returnAt?: string) => Promise<void>;
  unreadNotificationsCount?: number;
  executionMode: ExecutionMode;
  onModeChange: (mode: ExecutionMode) => void;
  onOpenTour: () => void;
  onToggleHowItWorks: () => void;
  isLiveAvailable: boolean;
  selectedCaseId?: string;
  isReviewingCase?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onNavigate,
  currentRole,
  currentUserId,
  onSelectUserSession,
  availabilityStatus = 'AVAILABLE',
  onUpdateAvailability,
  unreadNotificationsCount = 0,
  executionMode,
  onModeChange,
  onOpenTour,
  onToggleHowItWorks,
  selectedCaseId,
  isReviewingCase
}) => {
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isSessionMenuOpen, setIsSessionMenuOpen] = useState(false);
  const [isAvailabilityMenuOpen, setIsAvailabilityMenuOpen] = useState(false);

  // Principals available for demo walkthrough
  const DEMO_PRINCIPALS = [
    {
      id: 'sup-901',
      name: 'Sarah Chen',
      title: 'Lead Fraud Supervisor & Super Admin',
      role: 'SUPER_ADMIN' as AppUserRole,
      badge: 'Super Admin',
      badgeClass: 'bg-purple-100 text-purple-800'
    },
    {
      id: 'analyst-101',
      name: 'Marcus Rivera',
      title: 'Senior Fraud Analyst (Desk A)',
      role: 'INVESTIGATOR' as AppUserRole,
      badge: 'Investigator',
      badgeClass: 'bg-teal-100 text-teal-800'
    },
    {
      id: 'analyst-102',
      name: 'Priya Patel',
      title: 'Fraud Specialist (Desk B)',
      role: 'INVESTIGATOR' as AppUserRole,
      badge: 'Investigator',
      badgeClass: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'cust-001',
      name: 'Elena Rostova',
      title: 'Applicant (APP-2026-8812 / RW-001)',
      role: 'CUSTOMER_PORTAL' as AppUserRole,
      badge: 'Customer',
      badgeClass: 'bg-emerald-100 text-emerald-800'
    },
    {
      id: 'cust-002',
      name: 'Marcus Vance',
      title: 'Applicant (APP-2026-9041 / RW-002)',
      role: 'CUSTOMER_PORTAL' as AppUserRole,
      badge: 'Customer',
      badgeClass: 'bg-emerald-100 text-emerald-800'
    }
  ];

  const currentPrincipal = DEMO_PRINCIPALS.find(p => p.id === currentUserId) || DEMO_PRINCIPALS[0];

  const handleAvailabilityChange = async (status: InvestigatorStatus) => {
    if (onUpdateAvailability) {
      await onUpdateAvailability(status);
    }
    setIsAvailabilityMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        
        {/* Zone 1: Wordmark & Identity Context */}
        <div className="flex items-center gap-4 shrink-0">
          <button 
            onClick={() => {
              if (currentRole === 'SUPER_ADMIN') onNavigate('WORKFORCE');
              else if (currentRole === 'CUSTOMER_PORTAL') onNavigate('CUSTOMER_PORTAL');
              else onNavigate('CASES');
            }}
            className="flex items-center gap-2.5 text-left focus:outline-hidden"
          >
            <div className="w-8 h-8 rounded bg-teal-600 flex items-center justify-center font-bold text-white text-sm shadow-xs">
              RW
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white hover:text-teal-200 transition-colors">
                RiskWeave
              </span>
              <span className="text-xs text-slate-400 ml-2 font-normal hidden md:inline-block">
                AI Fraud Engine
              </span>
            </div>
          </button>

          {/* Authenticated Identity Pill */}
          <div className="relative">
            <button
              onClick={() => setIsSessionMenuOpen(!isSessionMenuOpen)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                currentRole === 'SUPER_ADMIN' 
                  ? 'bg-purple-900/60 text-purple-200 border-purple-500/50 hover:bg-purple-800/60' :
                currentRole === 'CUSTOMER_PORTAL'
                  ? 'bg-emerald-900/60 text-emerald-200 border-emerald-500/50 hover:bg-emerald-800/60' :
                  'bg-teal-900/60 text-teal-200 border-teal-500/50 hover:bg-teal-800/60'
              }`}
              title="Switch authenticated demo session"
            >
              <span className="w-2 h-2 rounded-full animate-pulse bg-current" />
              <span>{currentPrincipal.name} ({currentPrincipal.badge})</span>
              <ChevronDown className="w-3 h-3 ml-0.5 opacity-70" />
            </button>

            {isSessionMenuOpen && (
              <div 
                className="absolute left-0 mt-2 w-72 rounded-lg shadow-xl bg-white text-slate-800 ring-1 ring-black/10 divide-y divide-slate-100 py-1.5 z-50 text-xs"
                onMouseLeave={() => setIsSessionMenuOpen(false)}
              >
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Authenticated Role Session
                </div>

                {DEMO_PRINCIPALS.map(principal => (
                  <button
                    key={principal.id}
                    onClick={() => {
                      onSelectUserSession(principal.id, principal.role);
                      if (principal.role === 'SUPER_ADMIN') onNavigate('WORKFORCE');
                      else if (principal.role === 'CUSTOMER_PORTAL') onNavigate('CUSTOMER_PORTAL');
                      else onNavigate('CASES');
                      setIsSessionMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-start gap-2.5 hover:bg-slate-50 transition-colors ${
                      currentUserId === principal.id ? 'bg-slate-50 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <div className="w-6 h-6 rounded bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                      {principal.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 truncate">{principal.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${principal.badgeClass}`}>
                          {principal.badge}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{principal.title}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Zone 2: Role-Specific Destinations (Section 2) */}
        <nav className="flex items-center gap-5 text-sm font-medium">
          {/* SUPER ADMIN NAVIGATION: Cases | Investigators | Inbox | Tools */}
          {currentRole === 'SUPER_ADMIN' && (
            <>
              <button
                onClick={() => onNavigate('CASES')}
                className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                  currentView === 'CASES' 
                    ? 'text-teal-400 font-semibold' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Cases</span>
              </button>

              <button
                onClick={() => onNavigate('WORKFORCE')}
                className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                  currentView === 'WORKFORCE' 
                    ? 'text-teal-400 font-semibold' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Investigators</span>
              </button>

              <button
                onClick={() => onNavigate('INBOX')}
                className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 relative ${
                  currentView === 'INBOX' 
                    ? 'text-teal-400 font-semibold' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span>Inbox</span>
                {unreadNotificationsCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-teal-400 absolute -top-0.5 -right-1" />
                )}
              </button>
            </>
          )}

          {/* INVESTIGATOR NAVIGATION: Cases | Inbox | Tools */}
          {(currentRole === 'INVESTIGATOR' || currentRole === 'ANALYST') && (
            <>
              <button
                onClick={() => onNavigate('CASES')}
                className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                  currentView === 'CASES' 
                    ? 'text-teal-400 font-semibold' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Cases</span>
                {isReviewingCase && selectedCaseId && (
                  <span className="text-xs text-slate-400 font-mono ml-1">
                    / {selectedCaseId}
                  </span>
                )}
              </button>

              <button
                onClick={() => onNavigate('INBOX')}
                className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 relative ${
                  currentView === 'INBOX' 
                    ? 'text-teal-400 font-semibold' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span>Inbox</span>
                {unreadNotificationsCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-teal-400 absolute -top-0.5 -right-1" />
                )}
              </button>
            </>
          )}

          {/* CUSTOMER NAVIGATION: My requests | Updates | Help */}
          {currentRole === 'CUSTOMER_PORTAL' && (
            <>
              <button
                onClick={() => onNavigate('CUSTOMER_PORTAL')}
                className="flex items-center gap-1.5 text-teal-400 font-semibold whitespace-nowrap shrink-0"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>My requests</span>
              </button>

              <button
                onClick={() => onNavigate('CUSTOMER_PORTAL')}
                className="flex items-center gap-1.5 text-slate-300 hover:text-white whitespace-nowrap shrink-0"
              >
                <span>Updates & Receipts</span>
              </button>

              <button
                onClick={onToggleHowItWorks}
                className="flex items-center gap-1.5 text-slate-300 hover:text-white whitespace-nowrap shrink-0"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Help & Privacy</span>
              </button>
            </>
          )}

          {/* TOOLS DROPDOWN: For internal staff only */}
          {currentRole !== 'CUSTOMER_PORTAL' && (
            <div className="relative">
              <button
                onClick={() => setIsToolsOpen(!isToolsOpen)}
                className={`flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
                  currentView === 'CAPACITY' || currentView === 'QUALITY_CHECKS' || currentView === 'IMPORT' || currentView === 'POLICIES'
                    ? 'text-teal-400 font-semibold' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Wrench className="w-4 h-4" />
                <span>Tools</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isToolsOpen ? 'rotate-180' : ''}`} />
              </button>

              {isToolsOpen && (
                <div 
                  className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white text-slate-800 ring-1 ring-black/5 divide-y divide-slate-100 py-1 z-50 text-xs"
                  onMouseLeave={() => setIsToolsOpen(false)}
                >
                  <button
                    onClick={() => {
                      onNavigate('CAPACITY');
                      setIsToolsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                  >
                    <BarChart3 className="w-4 h-4 text-teal-600" />
                    <div>
                      <div className="font-semibold">Team Capacity</div>
                      <div className="text-[10px] text-slate-500">D3 workload distribution & limits</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onNavigate('QUALITY_CHECKS');
                      setIsToolsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                  >
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <div>
                      <div className="font-semibold">Quality checks</div>
                      <div className="text-[10px] text-slate-500">Evaluation benchmarks & runs</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onNavigate('POLICIES');
                      setIsToolsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                  >
                    <FileCheck2 className="w-4 h-4 text-teal-600" />
                    <div>
                      <div className="font-semibold">Policy rules</div>
                      <div className="text-[10px] text-slate-500">Authoritative clauses P01 - P08</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onNavigate('IMPORT');
                      setIsToolsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                  >
                    <UploadCloud className="w-4 h-4 text-slate-600" />
                    <div>
                      <div className="font-semibold">Batch import</div>
                      <div className="text-[10px] text-slate-500">Validated JSON/CSV evidence</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Zone 3: Account Menu & Personal Availability (Section 25) */}
        <div className="flex items-center gap-3 shrink-0 text-xs">
          {/* Staff Personal Availability Control */}
          {currentRole !== 'CUSTOMER_PORTAL' && onUpdateAvailability && (
            <div className="relative">
              <button
                onClick={() => setIsAvailabilityMenuOpen(!isAvailabilityMenuOpen)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5 transition-colors text-slate-200"
                title="Manage personal declared availability"
              >
                <span className={`w-2 h-2 rounded-full ${
                  availabilityStatus === 'AVAILABLE' ? 'bg-emerald-400' :
                  availabilityStatus === 'BUSY' ? 'bg-amber-400' :
                  availabilityStatus === 'AWAY' ? 'bg-orange-400' : 'bg-slate-400'
                }`} />
                <span className="capitalize">{availabilityStatus.toLowerCase()}</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {isAvailabilityMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-48 rounded-lg shadow-xl bg-white text-slate-800 ring-1 ring-black/10 py-1 z-50 text-xs divide-y divide-slate-100"
                  onMouseLeave={() => setIsAvailabilityMenuOpen(false)}
                >
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    My Availability (Self-Owned)
                  </div>
                  {(['AVAILABLE', 'BUSY', 'AWAY', 'OFFLINE'] as InvestigatorStatus[]).map(st => (
                    <button
                      key={st}
                      onClick={() => handleAvailabilityChange(st)}
                      className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-50 transition-colors ${
                        availabilityStatus === st ? 'bg-teal-50 text-teal-900 font-semibold' : 'text-slate-700'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${
                        st === 'AVAILABLE' ? 'bg-emerald-500' :
                        st === 'BUSY' ? 'bg-amber-500' :
                        st === 'AWAY' ? 'bg-orange-500' : 'bg-slate-400'
                      }`} />
                      <span className="capitalize">{st.toLowerCase()}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Execution Mode */}
          <div className="flex items-center bg-slate-800 rounded border border-slate-700 p-0.5">
            <button
              onClick={() => onModeChange('LOCAL_FIXTURE')}
              className={`px-2 py-1 rounded transition-colors whitespace-nowrap ${
                executionMode === 'LOCAL_FIXTURE' 
                  ? 'bg-slate-700 text-teal-300 font-semibold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={EXECUTION_MODE_LABELS.LOCAL_FIXTURE.tooltip}
            >
              Demo mode
            </button>
            <button
              onClick={() => onModeChange('LIVE_GOOGLE')}
              className={`px-2 py-1 rounded transition-colors whitespace-nowrap flex items-center gap-1 ${
                executionMode === 'LIVE_GOOGLE' 
                  ? 'bg-teal-700 text-white font-semibold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={EXECUTION_MODE_LABELS.LIVE_GOOGLE.tooltip}
            >
              <Cpu className="w-3 h-3" />
              <span>Live AI</span>
            </button>
          </div>

          {/* How RiskWeave Works Toggle */}
          <button
            onClick={onToggleHowItWorks}
            className="px-2.5 py-1 text-slate-300 hover:text-white border border-slate-700 rounded hover:bg-slate-800 transition-colors flex items-center gap-1"
            title="How RiskWeave works"
          >
            <Info className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">How it works</span>
          </button>
        </div>
      </div>
    </header>
  );
};
