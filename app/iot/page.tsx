"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/context";
import {
  Radio,
  Activity,
  Cpu,
  MapPin,
  Clock,
  Sparkles,
  RefreshCw,
  Send,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Scale,
  Trash2,
} from "lucide-react";

type Device = {
  id: string;
  device_code: string;
  name: string;
  type: string;
  location_name: string;
  city: string;
  district: string;
  province: string;
  status: "online" | "offline" | "maintenance";
  last_ping: string;
};

type Telemetry = {
  id: string;
  device_id: string;
  material_type: string;
  quantity: number;
  unit: string;
  sensor_status: string;
  quality_score: number | null;
  recorded_at: string;
  iot_devices?: Device;
};

export default function IoTNetworkPage() {
  const { t } = useLanguage();
  const supabase = useMemo(() => createClient(), []);

  const [devices, setDevices] = useState<Device[]>([]);
  const [telemetryList, setTelemetryList] = useState<Telemetry[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  // Simulation Form
  const [simDevice, setSimDevice] = useState("");
  const [simMaterial, setSimMaterial] = useState("Organic / Ampas Kopi");
  const [simQuantity, setSimQuantity] = useState("12.5");
  const [simUnit, setSimUnit] = useState("kg");
  const [simQuality, setSimQuality] = useState("96.5");

  async function loadIoTData() {
    const { data: devData } = await supabase.from("iot_devices").select("*").order("device_code");
    const { data: telData } = await supabase
      .from("iot_telemetry")
      .select("*, iot_devices(name, device_code, type, city, location_name)")
      .order("recorded_at", { ascending: false })
      .limit(30);

    const devList = (devData as Device[]) || [];
    setDevices(devList);
    setTelemetryList((telData as unknown as Telemetry[]) || []);

    if (devList.length > 0 && !simDevice) {
      setSimDevice(devList[0].id);
    }

    setLoading(false);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadIoTData();
    }, 0);
    return () => clearTimeout(timer);
  }, [supabase]);

  async function handleSimulateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!simDevice) return;

    setSimulating(true);

    try {
      const res = await fetch("/api/iot/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_id: simDevice,
          material_type: simMaterial,
          quantity: Number(simQuantity) || 1,
          unit: simUnit,
          quality_score: Number(simQuality) || 95,
          sensor_status: "normal",
          raw_payload: { simulated: true, timestamp: new Date().toISOString() },
        }),
      });

      if (res.ok) {
        await loadIoTData();
      } else {
        const json = await res.json();
        alert(json.error || "Simulation failed");
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to send telemetry event");
    }

    setSimulating(false);
  }

  return (
    <main className="min-h-screen bg-[#092328] px-4 py-8 sm:px-6 sm:py-12 text-white">
      <div className="mx-auto max-w-7xl">
        {/* =====================================================
            HEADER
        ===================================================== */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-white/[0.07] pb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
              <Radio className="h-3.5 w-3.5 animate-pulse" />
              <span>MUNICIPAL SENSOR NETWORK</span>
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-white">
              {t.iot.title}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
              {t.iot.subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={loadIoTData}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 text-sm font-semibold text-white/80 hover:border-emerald-400/30 hover:text-white transition"
          >
            <RefreshCw className={`h-4 w-4 text-emerald-400 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Feed</span>
          </button>
        </div>

        {/* =====================================================
            ARCHITECTURE NOTICE BANNER
        ===================================================== */}
        <div className="mt-8 rounded-3xl border border-blue-400/20 bg-blue-400/[0.04] p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-400/10 text-blue-300">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Production IoT Architecture Foundation</h3>
              <p className="mt-1 text-xs leading-6 text-white/60">
                {t.iot.simulationNotice} ARVENA provides standardized MQTT/HTTP REST telemetry ingestion boundaries for smart weighing scales, compost temperature probes, and smart recycling bins.
              </p>
            </div>
          </div>
        </div>

        {/* =====================================================
            ONLINE HARDWARE NODES
        ===================================================== */}
        <div className="mt-10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-400" />
            <span>Active IoT Hardware Nodes ({devices.length})</span>
          </h2>

          <div className="mt-5 grid gap-6 md:grid-cols-2">
            {devices.map((dev) => (
              <div
                key={dev.id}
                className="flex flex-col justify-between rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-6"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-emerald-400 font-bold tracking-wider">
                      {dev.device_code}
                    </span>

                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span>{dev.status.toUpperCase()}</span>
                    </span>
                  </div>

                  <h3 className="mt-3 text-base font-bold text-white">{dev.name}</h3>

                  <div className="mt-2 flex items-center gap-1.5 text-xs text-white/40">
                    <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>{dev.location_name}, {dev.city}</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/[0.07] flex items-center justify-between text-xs text-white/40">
                  <span>Type: <strong className="text-white capitalize">{dev.type.replace("_", " ")}</strong></span>
                  <span>Last Signal: {dev.last_ping ? new Date(dev.last_ping).toLocaleTimeString() : "Recent"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* =====================================================
            LIVE TELEMETRY STREAM & SIMULATOR
        ===================================================== */}
        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {/* Live Feed Stream (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Radio className="h-5 w-5 text-emerald-400" />
              <span>{t.iot.liveStream}</span>
            </h2>

            <div className="rounded-3xl border border-white/10 bg-[#071711] p-6 max-h-[520px] overflow-y-auto space-y-3">
              {telemetryList.length === 0 ? (
                <div className="p-8 text-center text-xs text-white/40">No telemetry packets received yet.</div>
              ) : (
                telemetryList.map((tel) => (
                  <div
                    key={tel.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/5 bg-white/[0.015] p-4 hover:border-emerald-400/20 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-white">{tel.material_type}</span>
                        <span className="font-bold text-xs text-emerald-400">+{tel.quantity} {tel.unit}</span>
                      </div>
                      <p className="text-[11px] text-white/40 mt-1">
                        Node: {tel.iot_devices?.name || "Smart Node"} • {tel.iot_devices?.location_name}
                      </p>
                    </div>

                    <div className="text-right sm:text-right">
                      {tel.quality_score && (
                        <span className="rounded-full bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 block mb-1">
                          Quality {tel.quality_score}%
                        </span>
                      )}
                      <span className="text-[10px] text-white/30">{new Date(tel.recorded_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Telemetry Simulator Form (1 Col) */}
          <div>
            <div className="rounded-3xl border border-emerald-400/20 bg-gradient-to-b from-emerald-400/[0.05] to-white/[0.01] p-6">
              <div className="flex items-center gap-2 text-emerald-400">
                <Sliders className="h-4 w-4" />
                <h3 className="text-sm font-bold text-white">{t.iot.simulateData}</h3>
              </div>

              <p className="mt-1 text-xs text-white/50">
                Send a test telemetry event into the pipeline.
              </p>

              <form onSubmit={handleSimulateSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-white/70">Target IoT Node</label>
                  <select
                    value={simDevice}
                    onChange={(e) => setSimDevice(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0b1d17] p-2.5 text-xs text-white outline-none focus:border-emerald-400"
                  >
                    {devices.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.device_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-white/70">Material Ingest Type</label>
                  <select
                    value={simMaterial}
                    onChange={(e) => setSimMaterial(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0b1d17] p-2.5 text-xs text-white outline-none focus:border-emerald-400"
                  >
                    <option value="Organic / Ampas Kopi">Organic / Ampas Kopi</option>
                    <option value="Plastic / Botol HDPE">Plastic / Botol HDPE</option>
                    <option value="Paper / Kardus Corrugated">Paper / Kardus Corrugated</option>
                    <option value="Metal / Kaleng Aluminium">Metal / Kaleng Aluminium</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-white/70">Quantity</label>
                    <input
                      type="number"
                      step="0.1"
                      value={simQuantity}
                      onChange={(e) => setSimQuantity(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#0b1d17] p-2.5 text-xs text-white outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-white/70">Unit</label>
                    <input
                      type="text"
                      value={simUnit}
                      onChange={(e) => setSimUnit(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#0b1d17] p-2.5 text-xs text-white outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-white/70">Quality / Purity (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={simQuality}
                    onChange={(e) => setSimQuality(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0b1d17] p-2.5 text-xs text-white outline-none focus:border-emerald-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={simulating}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-400 border border-emerald-300/40 py-3 text-xs font-bold text-[#092328] hover:bg-emerald-300 transition shadow-[0_0_20px_rgba(52,211,153,0.3)] disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{simulating ? "Transmitting..." : "Send Telemetry Packet"}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
