import React from 'react';
import { X, Bell, AlertTriangle, Flag, CheckCircle, Clock } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { formatDisplayDate } from '../../utils/financeRules';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const { notifications, markNotificationAsRead } = useSchool();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-sm bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Institutional Notifications
              </h3>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close notifications"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No active notifications.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    markNotificationAsRead(notif.id);
                    if (notif.targetTab) {
                      onNavigateTab(notif.targetTab);
                      onClose();
                    }
                  }}
                  className={`rounded-xl border p-3 cursor-pointer transition text-xs ${
                    notif.isRead
                      ? 'bg-white border-slate-200 opacity-75'
                      : 'bg-indigo-50/50 border-indigo-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {notif.type === 'OVERDUE' ? (
                      <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                    ) : notif.type === 'FLAG' ? (
                      <Flag className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    ) : (
                      <Clock className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 leading-tight">{notif.title}</p>
                      <p className="text-slate-600 text-[11px] mt-1">{notif.message}</p>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                        <span>{new Date(notif.timestamp).toLocaleDateString()}</span>
                        {!notif.isRead && (
                          <span className="font-bold text-indigo-600">Unread</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
