"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { db } from "@/lib/db";
import { useSession } from "@/components/providers/demo-session";
import { useI18n } from "@/lib/i18n";
import { initials } from "@/lib/utils";
import type { Mensaje, Usuario } from "@/lib/types";
import { MessageSquare } from "lucide-react";

export default function ChoferMensajesPage() {
  const { user } = useSession();
  const { t, fmtDateTime, localized } = useI18n();
  const M = t.driver.messages;
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  // Unread state captured on load, so the highlight survives this visit after marking as read.
  const [unreadIds, setUnreadIds] = useState<Set<number>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([db.getMensajesDeUsuario(user.id_usuario), db.getUsuarios()]).then(([m, u]) => {
      const sorted = [...m].sort((a, b) => b.created_at.localeCompare(a.created_at));
      const unread = sorted.filter((x) => !x.leido).map((x) => x.id_mensaje);
      setMensajes(sorted);
      setUsuarios(u);
      setUnreadIds(new Set(unread));
      setLoaded(true);
      unread.forEach((id) => db.marcarMensajeLeido(id));
    });
  }, [user]);

  const senderName = (id?: string | null) =>
    id && id === user?.id_usuario ? M.you : usuarios.find((u) => u.id_usuario === id)?.nombre ?? M.admin;

  return (
    <AppShell role="chofer">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <p className="text-sm text-muted mb-1">{M.kicker}</p>
          <h1 className="font-display text-3xl">{M.title}</h1>
        </div>

        {loaded && mensajes.length === 0 ? (
          <div className="text-center py-16 text-muted">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">{M.empty}</p>
            <p className="text-sm mt-1">{M.emptyText}</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {mensajes.map((m) => {
              const name = senderName(m.remitente_id);
              const isUnread = unreadIds.has(m.id_mensaje);
              return (
                <li key={m.id_mensaje}>
                  <Card className={isUnread ? "border-primary/30 shadow-sm" : ""}>
                    <CardBody>
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0" aria-hidden>
                          {initials(name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-medium text-sm truncate">{name}</span>
                              {isUnread && (
                                <span className="text-[10px] uppercase tracking-wide font-semibold text-primary bg-primary/10 rounded-full px-2 py-0.5">
                                  {M.unread}
                                </span>
                              )}
                            </div>
                            <time dateTime={m.created_at} className="text-xs text-muted shrink-0">{fmtDateTime(m.created_at)}</time>
                          </div>
                          <p className="font-medium text-sm">{localized(m, "asunto")}</p>
                          <p className="text-sm text-muted mt-1 whitespace-pre-line">{localized(m, "cuerpo")}</p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
