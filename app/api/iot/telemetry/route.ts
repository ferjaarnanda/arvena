import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data: devices } = await supabase.from("iot_devices").select("*");
  const { data: telemetry } = await supabase
    .from("iot_telemetry")
    .select("*, iot_devices(name, device_code, type, city, location_name)")
    .order("recorded_at", { ascending: false })
    .limit(50);

  return NextResponse.json({
    devices: devices || [],
    telemetry: telemetry || [],
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { device_id, material_type, quantity, unit, sensor_status, quality_score, raw_payload } = body;

    if (!device_id || !material_type || !quantity || !unit) {
      return NextResponse.json({ error: "Missing required telemetry fields" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("iot_telemetry")
      .insert({
        device_id,
        material_type,
        quantity: Number(quantity),
        unit,
        sensor_status: sensor_status || "normal",
        quality_score: quality_score ? Number(quality_score) : 95.0,
        raw_payload: raw_payload || {},
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update last ping on device
    await supabase
      .from("iot_devices")
      .update({ last_ping: new Date().toISOString() })
      .eq("id", device_id);

    return NextResponse.json({ success: true, telemetry: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid telemetry payload";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
