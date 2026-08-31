"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import CirraPanel from "@/components/cirra-panel";

const navigation = [
  {
    label: "Explore",
    href: "/explore",
  },
  {
    label: "Exchange",
    href: "/exchange",
  },
  {
    label: "Impact",
    href: "/impact",
  },
  {
    label: "Community",
    href: "/community",
  },
];

export default function NexoraNavbar() {
  const pathname = usePathname();

  const [cirraOpen, setCirraOpen] =
    useState(false);

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [hoveredHref, setHoveredHref] =
    useState<string | null>(null);

  const activeHref =
    navigation.find(
      (item) =>
        pathname === item.href ||
        pathname.startsWith(
          `${item.href}/`
        )
    )?.href ?? null;

  const indicatorHref =
    hoveredHref ?? activeHref;

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[90] h-[68px] border-b border-emerald-300/[0.08] bg-[#040b08]/90 backdrop-blur-xl">

        {/* TOP / BOTTOM SUBTLE LINE */}

        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-300/20 to-transparent" />

        <div className="mx-auto flex h-full max-w-[1440px] items-center gap-6 px-4 sm:px-6 lg:px-8">

          {/* =====================================================
              ARVENA BRAND
          ===================================================== */}

          <Link
            href="/"
            className="group flex shrink-0 items-center"
            onClick={() =>
              setMobileOpen(false)
            }
          >
            <Image
              src="/arvena-lockup.png"
              alt="ARVENA Connected City Ecosystem"
              width={210}
              height={72}
              priority
              className="h-[34px] w-auto object-contain transition duration-300 group-hover:scale-[1.015]"
            />
          </Link>

          {/* =====================================================
              DESKTOP NAV
          ===================================================== */}

          <nav
            className="hidden h-full items-center gap-1 lg:flex"
            onMouseLeave={() =>
              setHoveredHref(null)
            }
          >
            {navigation.map(
              (item) => {
                const isActive =
                  activeHref ===
                  item.href;

                const isHovered =
                  hoveredHref ===
                  item.href;

                const showIndicator =
                  indicatorHref ===
                  item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onMouseEnter={() =>
                      setHoveredHref(
                        item.href
                      )
                    }
                    className={`group relative flex h-full items-center rounded-xl px-4 text-sm transition-colors duration-200 ${
                      isHovered ||
                      isActive
                        ? "text-emerald-200"
                        : "text-white/55 hover:text-white"
                    }`}
                  >
                    <span>
                      {item.label}
                    </span>

                    {/* =================================================
                        ACTIVE / HOVER INDICATOR

                        Hover:
                        indicator temporarily moves under
                        hovered menu.

                        Mouse leaves nav:
                        indicator returns to active page.
                    ================================================= */}

                    <span
                      className={`pointer-events-none absolute bottom-0 left-4 right-4 h-[2px] origin-center bg-gradient-to-r from-transparent via-emerald-300 to-transparent transition-all duration-300 ease-out ${
                        showIndicator
                          ? "scale-x-100 opacity-100"
                          : "scale-x-0 opacity-0"
                      }`}
                    />

                    {/* softer glow */}

                    <span
                      className={`pointer-events-none absolute bottom-0 left-8 right-8 h-[5px] bg-emerald-300/20 blur-[5px] transition-all duration-300 ${
                        showIndicator
                          ? "opacity-70"
                          : "opacity-0"
                      }`}
                    />
                  </Link>
                );
              }
            )}
          </nav>

          {/* =====================================================
              SPACER
          ===================================================== */}

          <div className="flex-1" />

          {/* =====================================================
              ASK CIRRA
          ===================================================== */}

          <button
            type="button"
            onClick={() =>
              setCirraOpen(true)
            }
            className="group relative hidden h-10 items-center gap-2 overflow-hidden rounded-full border border-emerald-300/25 bg-emerald-300/[0.025] px-4 text-sm font-medium text-white transition duration-300 hover:-translate-y-0.5 hover:border-emerald-200/45 hover:bg-emerald-300/[0.055] sm:flex"
          >
            <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full">
              <Image
                src="/cirra-logo.png"
                alt=""
                width={24}
                height={24}
                className="h-full w-full object-cover mix-blend-screen"
              />
            </span>

            <span>
              Ask Cirra
            </span>
          </button>

          {/* =====================================================
              PROFILE
          ===================================================== */}

          <Link
            href="/profile"
            aria-label="Open profile"
            className="hidden h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.02] text-white/55 transition hover:border-emerald-300/25 hover:bg-emerald-300/[0.035] hover:text-emerald-200 sm:flex"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-[18px] w-[18px]"
            >
              <circle
                cx="12"
                cy="8"
                r="3.5"
                stroke="currentColor"
                strokeWidth="1.6"
              />

              <path
                d="M5 20C5.8 16.8 8.1 15 12 15C15.9 15 18.2 16.8 19 20"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </Link>

          {/* =====================================================
              MOBILE BUTTON
          ===================================================== */}

          <button
            type="button"
            onClick={() =>
              setMobileOpen(
                (value) => !value
              )
            }
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] text-white/60 sm:hidden"
            aria-label="Toggle navigation"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
            >
              {mobileOpen ? (
                <path
                  d="M6 6L18 18M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M4 7H20M4 12H20M4 17H20"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>

        {/* =====================================================
            MOBILE NAV
        ===================================================== */}

        {mobileOpen && (
          <div className="border-b border-white/[0.07] bg-[#07100d]/95 px-4 py-4 backdrop-blur-xl sm:hidden">
            <nav className="space-y-1">

              {navigation.map(
                (item) => {
                  const isActive =
                    activeHref ===
                    item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        setMobileOpen(
                          false
                        );
                      }}
                      className={`block rounded-xl px-4 py-3 text-sm transition ${
                        isActive
                          ? "bg-emerald-300/[0.06] text-emerald-200"
                          : "text-white/55 hover:bg-white/[0.03] hover:text-white"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                }
              )}

              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  setCirraOpen(true);
                }}
                className="mt-2 flex w-full items-center gap-3 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.035] px-4 py-3 text-left text-sm text-emerald-200"
              >
                <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full">
                  <Image
                    src="/cirra-logo.png"
                    alt=""
                    width={28}
                    height={28}
                    className="h-full w-full object-cover mix-blend-screen"
                  />
                </span>

                Ask Cirra
              </button>

              <Link
                href="/profile"
                onClick={() =>
                  setMobileOpen(
                    false
                  )
                }
                className="block rounded-xl px-4 py-3 text-sm text-white/55"
              >
                Profile
              </Link>

            </nav>
          </div>
        )}
      </header>

      <CirraPanel
        open={cirraOpen}
        onClose={() =>
          setCirraOpen(false)
        }
      />
    </>
  );
}