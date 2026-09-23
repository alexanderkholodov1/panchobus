import type { Asignacion } from "@/lib/types";

/**
 * Chooses the trip a route staff member should see: the one in progress today,
 * otherwise the next scheduled one (today first, then upcoming days), otherwise
 * the last trip they completed today.
 */
export function pickDriverTrip(asgs: Asignacion[], today: string): { trip: Asignacion | null; isToday: boolean } {
  const sorted = [...asgs]
    .filter((a) => a.estado !== "cancelada")
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora_salida.localeCompare(b.hora_salida));
  const todays = sorted.filter((a) => a.fecha === today);
  const inProgress = todays.find((a) => a.estado === "en_curso");
  if (inProgress) return { trip: inProgress, isToday: true };
  const nextToday = todays.find((a) => a.estado === "programada");
  if (nextToday) return { trip: nextToday, isToday: true };
  const upcoming = sorted.find((a) => a.fecha > today && a.estado === "programada");
  if (upcoming) return { trip: upcoming, isToday: false };
  const lastToday = todays[todays.length - 1];
  if (lastToday) return { trip: lastToday, isToday: true };
  return { trip: null, isToday: false };
}

/** A trip can still be booked if it is scheduled and has not left yet. */
export function isBookable(a: Asignacion, today: string, now: string): boolean {
  if (a.estado !== "programada") return false;
  if (a.fecha < today) return false;
  if (a.fecha === today && a.hora_salida <= now) return false;
  return true;
}
