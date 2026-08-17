import {
  ArrowRight,
  BrainCircuit,
  Building2,
  Leaf,
  MapPinned,
  Recycle,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Recycle,
    title: "Circular Exchange",
    description:
      "Temukan, tawarkan, dan manfaatkan kembali sumber daya yang masih bernilai.",
  },
  {
    icon: BrainCircuit,
    title: "AI Intelligence",
    description:
      "Dapatkan rekomendasi cerdas berdasarkan kebutuhan, lokasi, dan potensi dampak.",
  },
  {
    icon: MapPinned,
    title: "Smart City Map",
    description:
      "Jelajahi resource, komunitas, UMKM, dan fasilitas berkelanjutan dalam satu peta.",
  },
  {
    icon: Leaf,
    title: "Impact Tracking",
    description:
      "Ukur kontribusi nyata terhadap lingkungan dan ekonomi secara transparan.",
  },
];

const stats = [
  ["12.8K", "kg resource recovered"],
  ["3.7K", "kg CO₂e estimated avoided"],
  ["1.2K+", "community actions"],
  ["94%", "average smart match"],
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#07130f] text-white">
      {/* NAVBAR */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400 text-[#07130f]">
            <Leaf size={22} strokeWidth={2.5} />
          </div>

          <div>
            <div className="text-lg font-bold tracking-tight">NEXORA</div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-emerald-300/60">
              Smart Urban Intelligence
            </div>
          </div>
        </div>

        <div className="hidden items-center gap-8 text-sm text-white/60 md:flex">
          <a href="#ecosystem" className="transition hover:text-white">
            Ecosystem
          </a>
          <a href="#features" className="transition hover:text-white">
            Features
          </a>
          <a href="#impact" className="transition hover:text-white">
            Impact
          </a>
        </div>

        <button className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium transition hover:bg-white/10">
          Explore NEXORA
        </button>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute left-1/2 top-10 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />

        <div className="relative mx-auto grid max-w-7xl gap-16 px-6 pb-24 pt-20 lg:grid-cols-2 lg:items-center lg:px-8 lg:pb-32">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-4 py-2 text-xs font-medium text-emerald-300">
              <Sparkles size={14} />
              Adaptive innovation for future-ready cities
            </div>

            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Turning urban
              <span className="block text-emerald-300">
                resources into impact.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-white/55">
              NEXORA connects people, communities, and businesses through
              intelligent resource exchange, spatial intelligence, and
              measurable sustainability impact.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <button className="group flex items-center gap-2 rounded-full bg-emerald-300 px-6 py-3.5 font-semibold text-[#07130f] transition hover:bg-emerald-200">
                Explore ecosystem
                <ArrowRight
                  size={18}
                  className="transition group-hover:translate-x-1"
                />
              </button>

              <button className="rounded-full border border-white/10 bg-white/5 px-6 py-3.5 font-medium text-white transition hover:bg-white/10">
                See how it works
              </button>
            </div>

            <div className="mt-10 flex flex-wrap gap-6 text-xs text-white/40">
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-emerald-300" />
                Privacy-aware
              </div>

              <div className="flex items-center gap-2">
                <Zap size={15} className="text-emerald-300" />
                AI-powered
              </div>

              <div className="flex items-center gap-2">
                <Users size={15} className="text-emerald-300" />
                Community-driven
              </div>
            </div>
          </div>

          {/* HERO VISUAL */}
          <div className="relative mx-auto w-full max-w-xl">
            <div className="relative aspect-square overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 shadow-2xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(52,211,153,0.12),transparent_55%)]" />

              <div className="relative h-full overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0b1b15]">
                {/* simulated map */}
                <div className="absolute inset-0 opacity-30">
                  <div className="absolute left-[15%] top-[20%] h-px w-[70%] rotate-12 bg-emerald-300/30" />
                  <div className="absolute left-[10%] top-[45%] h-px w-[80%] -rotate-6 bg-emerald-300/20" />
                  <div className="absolute left-[20%] top-[70%] h-px w-[65%] rotate-3 bg-emerald-300/20" />
                  <div className="absolute left-[35%] top-[5%] h-[90%] w-px rotate-[20deg] bg-emerald-300/20" />
                  <div className="absolute left-[60%] top-[0%] h-[100%] w-px rotate-[70deg] bg-emerald-300/20" />
                </div>

                {/* map nodes */}
                <div className="absolute left-[25%] top-[30%]">
                  <div className="h-4 w-4 rounded-full bg-emerald-300 shadow-[0_0_25px_rgba(110,231,183,0.8)]" />
                </div>

                <div className="absolute left-[65%] top-[25%]">
                  <div className="h-4 w-4 rounded-full bg-blue-300 shadow-[0_0_25px_rgba(147,197,253,0.8)]" />
                </div>

                <div className="absolute left-[55%] top-[65%]">
                  <div className="h-4 w-4 rounded-full bg-amber-300 shadow-[0_0_25px_rgba(252,211,77,0.8)]" />
                </div>

                <div className="absolute left-[20%] top-[70%]">
                  <div className="h-4 w-4 rounded-full bg-purple-300 shadow-[0_0_25px_rgba(216,180,254,0.8)]" />
                </div>

                {/* floating card */}
                <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/10 bg-[#10251d]/90 p-5 backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-white/40">
                        Smart recommendation
                      </div>
                      <div className="mt-1 font-semibold">
                        Cardboard → Local Packaging
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-emerald-300">
                        94%
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-white/30">
                        Match
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[94%] rounded-full bg-emerald-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section id="impact" className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 px-6 py-10 lg:grid-cols-4 lg:px-8">
          {stats.map(([value, label]) => (
            <div
              key={label}
              className="border-white/10 px-5 py-5 first:border-l-0 lg:border-l"
            >
              <div className="text-3xl font-semibold tracking-tight">
                {value}
              </div>
              <div className="mt-1 text-xs text-white/40">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-28 lg:px-8">
        <div className="max-w-2xl">
          <div className="text-sm font-medium text-emerald-300">
            ONE CONNECTED ECOSYSTEM
          </div>

          <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            Intelligence that connects the city.
          </h2>

          <p className="mt-5 text-white/50">
            Bukan sekadar dashboard. NEXORA menghubungkan resource,
            masyarakat, UMKM, lokasi, dan impact dalam satu ecosystem.
          </p>
        </div>

        <div
          id="ecosystem"
          className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="group rounded-3xl border border-white/10 bg-white/[0.03] p-7 transition duration-300 hover:-translate-y-1 hover:border-emerald-300/20 hover:bg-white/[0.05]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-300/10 text-emerald-300">
                  <Icon size={22} />
                </div>

                <h3 className="mt-6 text-lg font-semibold">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-white/40">
                  {feature.description}
                </p>

                <div className="mt-6 flex items-center gap-2 text-xs font-medium text-emerald-300 opacity-0 transition group-hover:opacity-100">
                  Explore feature
                  <ArrowRight size={14} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-emerald-300/10 bg-emerald-300/[0.05] p-10 text-center sm:p-16">
          <Building2
            className="mx-auto text-emerald-300"
            size={30}
          />

          <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            The city already has the resources.
            <span className="block text-emerald-300">
              NEXORA connects them.
            </span>
          </h2>

          <button className="mt-8 rounded-full bg-emerald-300 px-7 py-3.5 font-semibold text-[#07130f] transition hover:bg-emerald-200">
            Enter NEXORA
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-xs text-white/30 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div>© 2026 NEXORA. Smart. Sustainable. Inclusive.</div>

          <div className="flex gap-5">
            <span>AI</span>
            <span>GIS</span>
            <span>IoT</span>
            <span>Blockchain</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

