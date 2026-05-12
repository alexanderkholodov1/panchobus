import { NextRequest, NextResponse } from "next/server";

// POST /api/gps — insert bus location
// In demo mode (no Supabase env vars), returns 200 silently.
// In production (Supabase), inserts into bus_locations table.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id_asignacion, latitud, longitud, velocidad, precision } = body;

    if (!id_asignacion || latitud == null || longitud == null) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      // Production: persist to Supabase bus_locations table
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { error } = await supabase.from("bus_locations").insert({
        id_asignacion: Number(id_asignacion),
        latitud,
        longitud,
        velocidad: velocidad ?? null,
        precision: precision ?? null,
        timestamp: new Date().toISOString(),
      });

      if (error) {
        console.error("[GPS API] Supabase error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
    // Demo mode: silently accept (frontend stores in state)
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[GPS API] Error:", err?.message);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
