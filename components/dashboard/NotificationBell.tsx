"use client";
import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Notification } from "@/types";

interface Props {
  wallet: string;
}

export function NotificationBell({ wallet }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!wallet) return;
    fetch(`/api/notifications/${wallet}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setNotifications(d.data); });
  }, [wallet]);

  const unread = notifications.filter((n) => !n.read).length;

  async function markRead(id: string) {
    await fetch(`/api/notifications/${wallet}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-slate-800 transition-colors"
      >
        <Bell className="h-5 w-5 text-slate-300" />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-slate-800 bg-slate-900 shadow-xl z-50">
          <div className="p-3 border-b border-slate-800 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-200">Notifications</p>
            {unread > 0 && <span className="text-xs text-blue-400">{unread} unread</span>}
          </div>
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm">No notifications</div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.read && markRead(n.id)}
                className={`p-3 border-b border-slate-800/50 cursor-pointer hover:bg-slate-800/50 transition-colors ${!n.read ? "bg-blue-500/5" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-slate-200">{n.title}</p>
                  {!n.read && <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />}
                </div>
                <p className="text-xs text-slate-400 mt-1">{n.message}</p>
                <p className="text-xs text-slate-600 mt-1">{formatDate(n.created_at)}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
