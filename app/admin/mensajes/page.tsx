"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { db } from "@/lib/db";
import { useSession } from "@/components/providers/demo-session";
import { useI18n } from "@/lib/i18n";
import { toast } from "@/components/ui/toaster";
import type { Mensaje, Ruta, Usuario } from "@/lib/types";
import { Send, MessageSquare, X } from "lucide-react";

type Target = "all" | "route" | "user";
const EMPTY = { target: "route" as Target, destinatario_id: "", destinatario_ruta: "", asunto: "", cuerpo: "" };

export default function AdminMensajesPage() {
  const { user } = useSession();
  const { t, localized, fmtDateTime } = useI18n();
  const M = t.admin.messages;
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [sending, setSending] = useState(false);

  const load = () => Promise.all([db.getMensajes(), db.getUsuarios(), db.getRutas()])
    .then(([m, u, r]) => { setMensajes([...m].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))); setUsuarios(u); setRutas(r); });

  useEffect(() => { load(); }, []);

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const send = async () => {
    if (!user) return;
    if (!form.asunto.trim() || !form.cuerpo.trim()) return toast({ title: M.errRequired, variant: "error" });
    if ((form.target === "route" && !form.destinatario_ruta) || (form.target === "user" && !form.destinatario_id)) {
      return toast({ title: M.errRecipient, variant: "error" });
    }
    setSending(true);
    await db.createMensaje({
      remitente_id: user.id_usuario,
      destinatario_id: form.target === "user" ? form.destinatario_id : null,
      destinatario_ruta: form.target === "route" ? Number(form.destinatario_ruta) : null,
      asunto: form.asunto.trim(),
      cuerpo: form.cuerpo.trim(),
      leido: false,
    });
    toast({ title: M.toastSent, variant: "success" });
    setSending(false);
    setShowForm(false);
    setForm(EMPTY);
    load();
  };

  const getUser = (id?: string | null) => usuarios.find((u) => u.id_usuario === id);
  const getRuta = (id?: number | null) => rutas.find((r) => r.id_ruta === id);

  return (
    <AppShell role="admin">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted mb-1">{M.kicker}</p>
            <h1 className="font-display text-3xl">{M.title}</h1>
          </div>
          <Button onClick={() => setShowForm(true)}><Send className="w-4 h-4" />{M.new}</Button>
        </div>

        {showForm && (
          <Card>
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl">{M.new}</h2>
                <button type="button" onClick={() => setShowForm(false)} aria-label={t.common.close} className="p-1 hover:bg-surface-2 rounded-lg"><X className="w-4 h-4" /></button>
              </div>
              <fieldset>
                <legend className="text-sm font-medium mb-1.5">{M.recipientType}</legend>
                <div className="flex flex-wrap gap-2">
                  {([["route", M.toRoute], ["user", M.toUser], ["all", M.toAll]] as const).map(([val, label]) => (
                    <button key={val} type="button" aria-pressed={form.target === val} onClick={() => setForm((f) => ({ ...f, target: val }))}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-colors ${form.target === val ? "border-primary bg-primary text-white" : "border-border hover:border-primary/40"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>
              {form.target === "route" && (
                <div>
                  <Label htmlFor="ruta">{M.pickRoute}</Label>
                  <Select id="ruta" value={form.destinatario_ruta} onChange={set("destinatario_ruta")}>
                    <option value="">{M.pickRoute}…</option>
                    {rutas.map((r) => <option key={r.id_ruta} value={r.id_ruta}>{r.codigo} · {r.nombre}</option>)}
                  </Select>
                </div>
              )}
              {form.target === "user" && (
                <div>
                  <Label htmlFor="dest">{M.pickUser}</Label>
                  <Select id="dest" value={form.destinatario_id} onChange={set("destinatario_id")}>
                    <option value="">{M.pickUser}…</option>
                    {usuarios.filter((u) => u.rol === "chofer" && u.estado === "activo").map((u) => (
                      <option key={u.id_usuario} value={u.id_usuario}>{u.nombre}</option>
                    ))}
                  </Select>
                </div>
              )}
              <div>
                <Label htmlFor="asunto">{M.subject}</Label>
                <Input id="asunto" value={form.asunto} onChange={set("asunto")} maxLength={80} />
              </div>
              <div>
                <Label htmlFor="cuerpo">{M.body}</Label>
                <textarea id="cuerpo" rows={4} value={form.cuerpo} onChange={set("cuerpo")} maxLength={600}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowForm(false)}>{t.common.cancel}</Button>
                <Button loading={sending} onClick={send}><Send className="w-4 h-4" />{M.send}</Button>
              </div>
            </CardBody>
          </Card>
        )}

        <div className="space-y-3">
          {mensajes.length === 0 && (
            <Card><CardBody className="text-center py-10 text-muted">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>{M.empty}</p>
            </CardBody></Card>
          )}
          {mensajes.map((m) => {
            const remitente = getUser(m.remitente_id);
            const dest = getUser(m.destinatario_id);
            const ruta = getRuta(m.destinatario_ruta);
            return (
              <Card key={m.id_mensaje}>
                <CardBody>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0" aria-hidden>
                      {remitente?.nombre.charAt(0) ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium text-sm">{remitente?.nombre ?? M.system}</span>
                        <span className="text-xs text-muted" aria-hidden>→</span>
                        {dest && <Badge variant="info">{dest.nombre}</Badge>}
                        {ruta && <Badge variant="info" style={{ borderColor: ruta.color_hex, color: ruta.color_hex }}>{M.routeBadge(ruta.codigo)}</Badge>}
                        {!dest && !ruta && <Badge>{M.everyone}</Badge>}
                        <span className="text-xs text-muted ml-auto">{fmtDateTime(m.created_at)}</span>
                      </div>
                      <p className="font-medium text-sm">{localized(m, "asunto")}</p>
                      <p className="text-sm text-muted mt-1 line-clamp-3">{localized(m, "cuerpo")}</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
