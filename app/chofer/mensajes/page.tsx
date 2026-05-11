"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { useSession } from "@/components/providers/demo-session";
import type { Mensaje, Usuario } from "@/lib/types";
import { MessageSquare, Mail } from "lucide-react";

export default function ChoferMensajesPage() {
  const { user } = useSession();
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      db.getMensajesDeUsuario(user.id_usuario),
      db.getUsuarios()
    ]).then(([m, u]) => { setMensajes(m); setUsuarios(u); });
  }, [user]);

  const getUser = (id?: string | null) => usuarios.find((u) => u.id_usuario === id);

  return (
    <AppShell role="chofer">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <p className="text-sm text-muted mb-1">Comunicación</p>
          <h1 className="font-display text-3xl">Mensajes</h1>
        </div>

        {mensajes.length === 0 ? (
          <div className="text-center py-16 text-muted">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Sin mensajes</p>
            <p className="text-sm mt-1">Los mensajes de administración aparecerán aquí.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {mensajes.map((m) => {
              const remitente = getUser(m.remitente_id);
              const isUnread = !m.leido_at;
              return (
                <Card key={m.id_mensaje} className={`transition-all ${isUnread ? "border-primary/30 shadow-sm" : ""}`}>
                  <CardBody>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {remitente?.nombre.charAt(0) ?? "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{remitente?.nombre ?? "Administración"}</span>
                            {isUnread && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                          </div>
                          <span className="text-xs text-muted shrink-0">
                            {new Date(m.created_at).toLocaleString("es-EC", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="font-medium text-sm">{m.asunto}</p>
                        <p className="text-sm text-muted mt-1">{m.cuerpo}</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
