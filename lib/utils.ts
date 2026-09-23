import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

/** YYYY-MM-DD in the user's local timezone (toISOString() would use UTC and shift the day at night). */
export function localISODate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Adds days to a local date and returns YYYY-MM-DD. */
export function addDaysISO(offsetDays: number, base: Date = new Date()): string {
  const d = new Date(base);
  d.setDate(d.getDate() + offsetDays);
  return localISODate(d);
}

/** HH:MM for the current local time. */
export function localHHMM(d: Date = new Date()): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Parses a YYYY-MM-DD string as a local date (noon, so DST/timezone never shifts the day). */
export function parseISODate(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

/** "USFQ — Tumbaco" → "Tumbaco". Falls back to the full name. */
export function routeShortName(nombre: string | undefined | null): string {
  if (!nombre) return "";
  const parts = nombre.split("—");
  return (parts[1] ?? parts[0]).trim();
}

/** Occupancy percentage, safe against zero capacity. */
export function occupancyPct(reservados: number, capacidad: number): number {
  if (!capacidad) return 0;
  return Math.min(100, Math.round((reservados / capacidad) * 100));
}

export function initials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export function slugify(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}
