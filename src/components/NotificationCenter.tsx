import { Bell, Check, CheckCheck, Info, AlertTriangle, CircleCheck, CircleX, Trash2, Sparkles } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useNotifications, timeAgo, type AppNotification } from "@/lib/notifications";

const KIND_STYLE: Record<AppNotification["kind"], { icon: typeof Info; wrap: string }> = {
  info: { icon: Info, wrap: "bg-sky-50 text-sky-600" },
  success: { icon: CircleCheck, wrap: "bg-emerald-50 text-emerald-600" },
  warning: { icon: AlertTriangle, wrap: "bg-amber-50 text-amber-600" },
  error: { icon: CircleX, wrap: "bg-rose-50 text-rose-600" },
  action: { icon: Sparkles, wrap: "bg-indigo-50 text-indigo-600" },
};

export function NotificationCenter({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { notifications, unread, markRead, markAllRead, remove, clearAll } = useNotifications();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-slate-200 px-5 py-4 text-left">
          <SheetTitle className="flex items-center gap-2 text-slate-900">
            <Bell className="h-4 w-4" /> Notifications
            {unread > 0 && <Badge className="ml-1 bg-rose-500 hover:bg-rose-500">{unread} new</Badge>}
          </SheetTitle>
          <SheetDescription>
            Alerts stay here until you remove them. Nothing is cleared automatically.
          </SheetDescription>
        </SheetHeader>

        <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-2">
          <Button variant="ghost" size="sm" className="gap-1.5 text-slate-600" onClick={markAllRead} disabled={unread === 0}>
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto gap-1.5 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            onClick={clearAll}
            disabled={notifications.length === 0}
          >
            <Trash2 className="h-4 w-4" /> Clear all
          </Button>
        </div>

        <ScrollArea className="flex-1">
          {notifications.length === 0 ? (
            <div className="px-6 py-16 text-center text-slate-500">
              <Bell className="mx-auto mb-3 h-10 w-10 opacity-40" />
              <p className="text-sm font-medium text-slate-600">You're all caught up</p>
              <p className="mt-1 text-xs">Activity, reminders and alerts will appear here.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {notifications.map((n) => {
                const { icon: Icon, wrap } = KIND_STYLE[n.kind];
                return (
                  <li key={n.id} className={`flex gap-3 px-5 py-4 transition ${n.read ? "bg-white" : "bg-slate-50/80"}`}>
                    <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${wrap}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <p className="flex-1 text-sm font-semibold text-slate-900">{n.title}</p>
                        {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />}
                      </div>
                      {n.body && <p className="mt-0.5 text-sm text-slate-600">{n.body}</p>}
                      {n.hint && (
                        <p className="mt-2 rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-800">
                          Note: {n.hint}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                        <span>{timeAgo(n.createdAt)}</span>
                        {!n.read && (
                          <button onClick={() => markRead(n.id)} className="inline-flex items-center gap-1 font-medium text-slate-500 hover:text-slate-700">
                            <Check className="h-3 w-3" /> Mark read
                          </button>
                        )}
                        <button onClick={() => remove(n.id)} className="inline-flex items-center gap-1 font-medium text-slate-500 hover:text-rose-600">
                          <Trash2 className="h-3 w-3" /> Remove
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
