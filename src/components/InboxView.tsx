// RiskWeave AI - In-App Notification Center (Inbox View)
// Conforms strictly to Sections 7 & 8 Requirements

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Archive, 
  RotateCcw, 
  ExternalLink, 
  ShieldAlert, 
  Users, 
  FileCheck2, 
  CheckCircle2, 
  Clock, 
  Filter,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { NotificationItem } from '../../shared/types';

interface InboxViewProps {
  currentUserId: string;
  onNavigateToCase: (caseId: string) => void;
  onNavigateBack: () => void;
  onNotificationCountChange?: (count: number) => void;
}

export const InboxView: React.FC<InboxViewProps> = ({
  currentUserId,
  onNavigateToCase,
  onNavigateBack,
  onNotificationCountChange
}) => {
  const [filter, setFilter] = useState<'UNREAD' | 'ALL' | 'ARCHIVED'>('UNREAD');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchNotifications();
  }, [currentUserId, filter]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/notifications?filter=${filter}`, {
        headers: { 'x-user-id': currentUserId }
      });
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      if (onNotificationCountChange) {
        onNotificationCountChange(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: { 'x-user-id': currentUserId }
      });
      await fetchNotifications();
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleArchive = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/archive`, {
        method: 'PATCH',
        headers: { 'x-user-id': currentUserId }
      });
      await fetchNotifications();
    } catch (err) {
      console.error('Failed to archive notification:', err);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ASSIGNMENT':
        return <Users className="w-4 h-4 text-teal-600" />;
      case 'EVIDENCE_ADDED':
        return <FileCheck2 className="w-4 h-4 text-indigo-600" />;
      case 'SUPERVISOR':
        return <ShieldAlert className="w-4 h-4 text-purple-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateBack}
            className="p-1.5 -ml-1 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
            title="Return to worklist"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">Inbox & Activity Updates</h1>
              {unreadCount > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Durable, server-persisted notifications from committed investigation events.
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
          <button
            onClick={() => setFilter('UNREAD')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filter === 'UNREAD' 
                ? 'bg-white text-slate-900 shadow-xs font-semibold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filter === 'ALL' 
                ? 'bg-white text-slate-900 shadow-xs font-semibold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Active
          </button>
          <button
            onClick={() => setFilter('ARCHIVED')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filter === 'ARCHIVED' 
                ? 'bg-white text-slate-900 shadow-xs font-semibold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Archived
          </button>
        </div>
      </div>

      {/* Notifications list */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
          <span>Loading durable notifications...</span>
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-16 text-center bg-white border border-slate-200 rounded-lg p-8">
          <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">
            {filter === 'UNREAD' ? 'You are all caught up!' : filter === 'ARCHIVED' ? 'No archived updates' : 'No notifications'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {filter === 'UNREAD' 
              ? 'There are no unread notifications requiring immediate attention.' 
              : 'Updates from case assignments, customer submissions, and supervisor reviews will appear here.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100 shadow-xs">
          {notifications.map(item => {
            const isRead = !!item.readAt;
            return (
              <div 
                key={item.notificationId}
                className={`p-4 transition-colors flex items-start gap-3.5 hover:bg-slate-50/80 ${
                  !isRead ? 'bg-teal-50/20' : ''
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                  {getCategoryIcon(item.category)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900">{item.title}</span>
                      {item.caseId && (
                        <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {item.caseId}
                        </span>
                      )}
                      {!isRead && (
                        <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0" title="Unread" />
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0">
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {item.message}
                  </p>

                  <div className="flex items-center gap-3 mt-3 pt-1 text-xs">
                    {item.caseId && (
                      <button
                        onClick={() => {
                          if (!isRead) handleMarkRead(item.notificationId);
                          onNavigateToCase(item.caseId);
                        }}
                        className="font-medium text-teal-700 hover:text-teal-900 flex items-center gap-1 text-xs"
                      >
                        <span>{item.actionLabel || 'Open case review'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}

                    {!isRead ? (
                      <button
                        onClick={() => handleMarkRead(item.notificationId)}
                        className="text-slate-500 hover:text-slate-800 flex items-center gap-1"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Mark read</span>
                      </button>
                    ) : null}

                    {filter !== 'ARCHIVED' && (
                      <button
                        onClick={() => handleArchive(item.notificationId)}
                        className="text-slate-400 hover:text-slate-700 flex items-center gap-1"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        <span>Archive</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
