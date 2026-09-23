"use client";

import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import type { AssignmentStatus, BusStatus, ReservationStatus, RouteStatus, UserStatus } from "@/lib/types";
import type { ReactNode } from "react";

type Variant = "default" | "success" | "warning" | "error" | "info" | "neutral";

const ROUTE: Record<RouteStatus, Variant> = { activa: "success", suspendida: "warning", inactiva: "neutral" };
const BUS: Record<BusStatus, Variant> = { activo: "success", mantenimiento: "warning", inactivo: "error" };
const ASSIGNMENT: Record<AssignmentStatus, Variant> = { programada: "info", en_curso: "success", completada: "default", cancelada: "error" };
const RESERVATION: Record<ReservationStatus, Variant> = { confirmada: "success", en_espera: "warning", usada: "info", cancelada: "default", no_show: "error" };
const USER: Record<UserStatus, Variant> = { activo: "success", pendiente: "warning", suspendido: "error" };

type Props =
  | { kind: "route"; value: RouteStatus; icon?: ReactNode; className?: string }
  | { kind: "bus"; value: BusStatus; icon?: ReactNode; className?: string }
  | { kind: "assignment"; value: AssignmentStatus; icon?: ReactNode; className?: string }
  | { kind: "reservation"; value: ReservationStatus; icon?: ReactNode; className?: string }
  | { kind: "user"; value: UserStatus; icon?: ReactNode; className?: string };

/** Translated, colour-coded status badge; the same state reads the same on every screen. */
export function StatusBadge(props: Props) {
  const { t } = useI18n();
  let variant: Variant = "default";
  let label: string = props.value;
  switch (props.kind) {
    case "route": variant = ROUTE[props.value]; label = t.status.route[props.value]; break;
    case "bus": variant = BUS[props.value]; label = t.status.bus[props.value]; break;
    case "assignment": variant = ASSIGNMENT[props.value]; label = t.status.assignment[props.value]; break;
    case "reservation": variant = RESERVATION[props.value]; label = t.status.reservation[props.value]; break;
    case "user": variant = USER[props.value]; label = t.status.user[props.value]; break;
  }
  return (
    <Badge variant={variant} className={props.className}>
      {props.icon}
      {label ?? props.value}
    </Badge>
  );
}
