"use client";

import Image from "next/image";
import Link from "next/link";

const platformCards = [
  {
    number: "01",
    eyebrow: "Discover",
    title:
      "Find the resources your city can reuse.",
    description:
      "Explore materials, surplus resources, and circular opportunities available around your city.",
    href: "/explore",
  },
  {
    number: "02",
    eyebrow: "Exchange",
    title:
      "Turn unused resources into new value.",
    description:
      "Connect people who have resources with people who need them through a smarter exchange flow.",
    href: "/exchange",
  },
  {
    number: "03",
    eyebrow: "Impact",
    title:
      "See the environmental value behind every action.",
    description:
      "Understand material recovery, transport emissions, and environmental impact through connected data.",
    href: "/impact",
  },
  {
    number: "04",
    eyebrow: "City",
    title:
      "Understand your city through circular intelligence.",
    description:
      "Combine resource activity, location intelligence, community data, and future GIS capabilities in one ecosystem.",
    href: "/community",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#020705] text-white">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative isolate min-h-[760px] overflow-hidden">

        {/* ===================================================
            BASE
        =================================================== */}

        <div className="absolute inset-0 bg-[#020705]" />

        {/* ===================================================
            SOFT DIAGONAL GREEN LIGHT

            Bukan full-page glow.
            Cahaya padat mulai dari kiri atas,
            bergerak diagonal ke tengah,
            kemudian melebar dan melemah.
        =================================================== */}

        <div
          className="pointer-events-none absolute -left-[260px] -top-[220px] h-[900px] w-[1250px] rotate-[23deg]"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(72,220,145,0.025) 10%, rgba(65,215,140,0.07) 24%, rgba(62,210,136,0.12) 39%, rgba(58,200,130,0.08) 55%, rgba(42,170,108,0.045) 72%, transparent 100%)",
            filter: "blur(48px)",
          }}
        />

        {/* ===================================================
            SOFT CORE
        =================================================== */}

        <div
          className="pointer-events-none absolute -left-[170px] -top-[150px] h-[650px] w-[850px] rotate-[23deg]"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(110,245,174,0.035) 12%, rgba(91,238,165,0.085) 28%, rgba(78,225,150,0.13) 43%, rgba(62,205,132,0.09) 58%, rgba(48,180,114,0.045) 75%, transparent 100%)",
            filter: "blur(34px)",
          }}
        />

        {/* ===================================================
            AMBIENT LIGHT AROUND CENTER
        =================================================== */}

        <div
          className="pointer-events-none absolute left-[28%] top-[18%] h-[500px] w-[700px]"
          style={{
            background:
              "radial-gradient(ellipse, rgba(28,150,92,0.055) 0%, rgba(22,125,77,0.035) 36%, rgba(13,95,59,0.02) 58%, transparent 78%)",
            filter: "blur(65px)",
          }}
        />

        {/* ===================================================
            VERY SUBTLE GREEN ON RIGHT
            Hanya supaya page tidak mati total.
        =================================================== */}

        <div
          className="pointer-events-none absolute right-[-300px] top-[180px] h-[500px] w-[650px]"
          style={{
            background:
              "radial-gradient(ellipse, rgba(20,110,70,0.025) 0%, transparent 72%)",
            filter: "blur(75px)",
          }}
        />

        {/* ===================================================
            GRID
        =================================================== */}

        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.14) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage:
              "linear-gradient(to bottom, black 0%, black 55%, transparent 88%)",
          }}
        />

        {/* ===================================================
            CONTENT
        =================================================== */}

        <div className="relative mx-auto max-w-[1280px] px-5 pb-28 pt-24 sm:px-8 sm:pt-28 lg:px-10">

          <div className="mx-auto max-w-5xl text-center">

            {/* =================================================
                ARVENA LOCKUP
                SEKARANG PAKAI ASSET LANGSUNG
            ================================================= */}

            <div className="mx-auto flex justify-center">
              <Image
                src="/arvena-lockup.png"
                alt="ARVENA Connected City Ecosystem"
                width={900}
                height={320}
                priority
                className="h-auto w-[250px] object-contain sm:w-[310px] lg:w-[390px]"
              />
            </div>

            {/* =================================================
                BADGE
            ================================================= */}

            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-emerald-300/[0.09] bg-emerald-300/[0.025] px-3.5 py-1.5 text-[9px] font-medium uppercase tracking-[0.24em] text-emerald-200/55 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300/75 shadow-[0_0_10px_rgba(110,231,183,0.6)]" />

              Connected City Ecosystem
            </div>

            {/* =================================================
                HEADLINE
            ================================================= */}

            <h1 className="mx-auto mt-7 max-w-4xl text-4xl font-medium leading-[1.04] tracking-[-0.04em] text-white sm:text-5xl lg:text-7xl">
              A smarter city begins
              with the resources
              already around us.
            </h1>

            {/* =================================================
                DESCRIPTION
            ================================================= */}

            <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-white/35 sm:text-base">
              ARVENA connects circular resources,
              communities, environmental intelligence,
              and city data into one connected ecosystem.
            </p>

            {/* =================================================
                CTA
            ================================================= */}

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">

              <Link
                href="/explore"
                className="inline-flex h-12 items-center justify-center rounded-full bg-emerald-300 px-7 text-sm font-semibold text-[#06120e] transition hover:-translate-y-0.5 hover:bg-emerald-200"
              >
                Explore ARVENA
              </Link>

              <Link
                href="/resources/new"
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/[0.09] bg-white/[0.015] px-7 text-sm font-medium text-white/60 backdrop-blur-sm transition hover:border-emerald-300/15 hover:bg-emerald-300/[0.025] hover:text-white"
              >
                Add a Resource
              </Link>

            </div>
          </div>

          {/* =================================================
              FLOW CARDS
          ================================================= */}

          <div className="mt-20 grid gap-3 sm:grid-cols-4">

            {[
              "Resources",
              "Community",
              "Intelligence",
              "Impact",
            ].map(
              (item, index) => (
                <div
                  key={item}
                  className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-black/[0.12] p-5 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-300/15 hover:bg-emerald-300/[0.02]"
                >

                  <div className="flex items-center justify-between">

                    <span className="text-[9px] uppercase tracking-[0.2em] text-white/20">
                      {item}
                    </span>

                    <span className="text-[9px] text-emerald-300/35">
                      0{index + 1}
                    </span>

                  </div>

                  <div className="mt-7 h-px bg-gradient-to-r from-emerald-300/15 via-white/[0.06] to-transparent" />

                  <p className="mt-4 text-sm text-white/45">
                    Connected intelligence
                    for a more circular city.
                  </p>

                </div>
              )
            )}

          </div>
        </div>

        {/* ===================================================
            BOTTOM FADE
        =================================================== */}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#020705] via-[#020705]/45 to-transparent" />

      </section>

      {/* =====================================================
          PLATFORM SECTION
      ===================================================== */}

      <section className="relative border-t border-white/[0.06] bg-[#07130f]">

        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[260px]"
          style={{
            background:
              "radial-gradient(ellipse 60% 100% at 50% 0%, rgba(16,185,129,0.04) 0%, transparent 78%)",
          }}
        />

        <div className="relative mx-auto max-w-[1280px] px-5 py-24 sm:px-8 lg:px-10">

          <div className="max-w-2xl">

            <p className="text-[9px] uppercase tracking-[0.24em] text-emerald-300/55">
              One connected ecosystem
            </p>

            <h2 className="mt-4 text-3xl font-medium tracking-[-0.03em] text-white sm:text-4xl">
              Discover. Exchange.
              Understand. Impact.
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-7 text-white/30">
              Setiap bagian ARVENA dibangun untuk
              saling terhubung sehingga pengguna
              tidak perlu berpindah-pindah platform
              untuk memahami resource dan dampaknya.
            </p>

          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2">

            {platformCards.map(
              (card) => (
                <Link
                  key={card.number}
                  href={card.href}
                  className="group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.018] p-7 transition-all duration-500 hover:-translate-y-1 hover:border-emerald-300/15 hover:bg-white/[0.028]"
                >

                  <div
                    className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full blur-[60px]"
                    style={{
                      background:
                        "rgba(16,185,129,0.035)",
                    }}
                  />

                  <div className="relative">

                    <div className="flex items-center justify-between">

                      <span className="text-[9px] uppercase tracking-[0.2em] text-white/20">
                        {card.eyebrow}
                      </span>

                      <span className="text-2xl font-light text-emerald-300/30">
                        {card.number}
                      </span>

                    </div>

                    <h3 className="mt-12 max-w-md text-xl font-medium leading-7 text-white/80 sm:text-2xl">
                      {card.title}
                    </h3>

                    <p className="mt-4 max-w-lg text-sm leading-6 text-white/28">
                      {card.description}
                    </p>

                    <div className="mt-8 flex items-center gap-2 text-xs text-emerald-300/55 transition group-hover:text-emerald-200">
                      Explore

                      <span className="transition group-hover:translate-x-1">
                        →
                      </span>
                    </div>

                  </div>
                </Link>
              )
            )}

          </div>
        </div>
      </section>

      {/* =====================================================
          FUTURE INTELLIGENCE
      ===================================================== */}

      <section className="relative overflow-hidden border-t border-white/[0.06] bg-[#040b08]">

        <div
          className="pointer-events-none absolute left-[-15%] top-[-120px] h-[360px] w-[850px] rotate-[15deg] blur-[95px]"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(16,185,129,0.05) 30%, rgba(16,185,129,0.03) 58%, transparent 100%)",
          }}
        />

        <div className="relative mx-auto max-w-5xl px-5 py-28 text-center sm:px-8">

          <p className="text-[9px] uppercase tracking-[0.24em] text-emerald-300/55">
            The connected layer
          </p>

          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-medium tracking-[-0.03em] sm:text-5xl">
            From circular resources
            to connected city intelligence.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/28">
            ARVENA akan terus menghubungkan
            resource intelligence, GIS, impact analysis,
            community activity, dan Cirra menjadi
            satu pengalaman yang semakin pintar.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-2">

            {[
              "Circular Resources",
              "GIS",
              "Impact",
              "Emissions",
              "Community",
              "Cirra AI",
            ].map(
              (item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/[0.07] bg-white/[0.018] px-4 py-2 text-[10px] text-white/30"
                >
                  {item}
                </span>
              )
            )}

          </div>

        </div>
      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="border-t border-white/[0.06] bg-[#030705]">

        <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-5 py-8 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">

          <div className="flex items-center gap-3">

            <Image
              src="/arvena-marks.png"
              alt="ARVENA"
              width={34}
              height={34}
              className="h-8 w-8 object-contain"
            />

            <div>
              <p className="text-xs font-medium tracking-[0.16em] text-white/55">
                ARVENA
              </p>

              <p className="text-[9px] text-white/20">
                Connected City Ecosystem
              </p>
            </div>

          </div>

          <p className="text-[9px] text-white/20">
            Built for circular and connected cities.
          </p>

        </div>

      </footer>

    </main>
  );
}