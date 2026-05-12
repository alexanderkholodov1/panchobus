"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { db } from "@/lib/db";
import { useSession } from "@/components/providers/demo-session";
import { toast } from "@/components/ui/toaster";
import type { Mensaje, Ruta, Usuario } from "@/lib/types";
import { Send, MessageSquare, X } from "lucide-react";

export default function AdminMensajesPage() {
  const { user } = useSession();
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ destinatario_id: "", destinatario_ruta: "", asunto: "", cuerpo: "" });
  const [sending, setSending] = useState(false);

  const load = () => Promise.all([db.getMensajes(), db.getUsuarios(), db.getRutas()])
    .then(([m,u,r]) => { setMensajes(m.sort((a,b)=>+new Date(b.created_at)-+new Date(a.created_at))); setUsuarios(u); setRutas(r); });

  useEffect(() => { load(); }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const send = async () => {
    if (!user) return;
    if (!form.asunto || !form.cuerpo) return toast({ title:"Completa asunto y cuerpo", variant:"error" });
    if (!form.destinatario_id && !form.destinatario_ruta) return toast({ title:"Elige destinatario o ruta", variant:"error" });
    setSending(true);
    await db.createMensaje({
      remitente_id: user.id_usuario,
      destinatario_id: form.destinatario_id || null,
      destinatario_ruta: form.destinatario_ruta ? Number(form.destinatario_ruta) : null,
      asunto: form.asunto,
      cuerpo: form.cuerpo
    });
    toast({ title:"Mensaje enviado", variant:"success" });
    setSending(false);
    setShowForm(false);
    setForm({ destinatario_id:"", destinatario_ruta:"", asunto:"", cuerpo:"" });
    load();
  };

  const getUser = (id?: string|null) => usuarios.find((u) => u.id_usuario === id);
  const getRuta = (id?: number|null) => rutas.find((r) => r.id_ruta === id);

  return (
    <AppShell role="admin">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted mb-1">Comunicación</p>
            <h1 className="font-display text-3xl">Mensajes</h1>
          </div>
          <Button onClick={() => setShowForm(true)}><Send className="w-4 h-4" />Nuevo mensaje</Button>
        </div>

        {showForm && (
          <Card>
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl">Nuevo mensaje</h2>
                <button onClick={() => setShowForm(false)} className="p-1 hover:bg-surface-2 rounded-lg"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="dest">Usuario específico</Label>
                  <Select id="dest" value={form.destinatario_id} onChange={set("destinatario_id")}>
                    <option value="">Seleccionar…</option>
                    {usuarios.filter((u)=>u.rol==="chofer").map((u) => (
                      <option key={u.id_usuario} value={u.id_usuario}>{u.nombre} (chofer)</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="ruta">O ruta completa</Label>
                  <Select id="ruta" value={form.destinatario_ruta} onChange={set("destinatario_ruta")}>
                    <option value="">Toda la plataforma</option>
                    {rutas.map((r) => <option key={r.id_ruta} value={r.id_ruta}>{r.codigo} · {r.nombre}</option>)}
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="asunto">Asunto</Label>
                <Input id="asunto" value={form.asunto} onChange={set("asunto")} />
              </div>
              <div>
                <Label htmlFor="cuerpo">Mensaje</Label>
                <textarea id="cuerpo" rows={4} value={form.cuerpo} onChange={set("cuerpo")}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button loading={sending} onClick={send}><Send className="w-4 h-4" />Enviar</Button>
              </div>
            </CardBody>
          </Card>
        )}

        <div className="space-y-3">
          {mensajes.length === 0 && (
            <Card><CardBody className="text-center py-10 text-muted">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>Sin mensajes aún.</p>
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
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {remitente?.nombre.charAt(0) ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium text-sm">{remitente?.nombre ?? "Sistema"}</span>
                        <span className="text-xs text-muted">→</span>
                        {dest && <Badge variant="info">{dest.nombre}</Badge>}
                        {ruta && <Badge variant="info" style={{ borderColor: ruta.color_hex, color: ruta.color_hex }}>{ruta.codigo} (ruta)</Badge>}
                        {!dest && !ruta && <Badge>Todos</Badge>}
                        <span className="text-xs text-muted ml-auto">
                          {new Date(m.created_at).toLocaleString("es-EC", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })}
                        </span>
                      </div>
                      <p className="font-medium text-sm">{m.asunto}</p>
                      <p className="text-sm text-muted mt-1 line-clamp-2">{m.cuerpo}</p>
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
