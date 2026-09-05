"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import {
  Bike,
  Car,
  Truck,
  Footprints,
  MapPin,
  Navigation,
  Activity,
  Leaf,
  Compass,
  Search,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";

type Coordinate = [
  number,
  number
];

type LocationResult = {
  id: string;
  label: string;
  lat: number;
  lon: number;
  source?: string;
  category?: string;
};

type TransportCategory =
  | "motor"
  | "mobil"
  | "kendaraan-besar"
  | "jalan-kaki";

type TransportType =
  | "motor-bensin"
  | "motor-diesel"
  | "motor-electric"
  | "mobil-bensin"
  | "mobil-diesel"
  | "mobil-hybrid"
  | "mobil-electric"
  | "truk-diesel"
  | "truk-electric"
  | "bus-diesel"
  | "bus-electric"
  | "jalan-kaki";

type RouteResult = {
  distanceKm: number;
  durationMinutes: number;
  geometry: Coordinate[];
};

type PointTarget =
  | "origin"
  | "destination";

/* =========================================================
   MAP
   ========================================================= */

const ImpactMap = dynamic(
  () =>
    import(
      "@/components/impact-map"
    ),
  {
    ssr: false,

    loading: () => (
      <div className="flex h-[520px] items-center justify-center rounded-3xl border border-white/[0.08] bg-[#07130f]">
        <div className="flex flex-col items-center">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/10 border-t-emerald-300" />

          <p className="mt-4 text-xs text-white/25">
            Loading GIS map...
          </p>
        </div>
      </div>
    ),
  }
);

/* =========================================================
   TRANSPORT DATA
   ========================================================= */

const transportCategories: {
  id: TransportCategory;
  label: string;
  icon: typeof Bike;
  description: string;
}[] = [
  {
    id: "motor",
    label: "Motor",
    icon: Bike,
    description:
      "Sepeda motor dan kendaraan roda dua.",
  },

  {
    id: "mobil",
    label: "Mobil",
    icon: Car,
    description:
      "Kendaraan penumpang pribadi.",
  },

  {
    id: "kendaraan-besar",
    label: "Kendaraan besar",
    icon: Truck,
    description:
      "Truk dan van angkutan barang.",
  },

  {
    id: "jalan-kaki",
    label: "Jalan kaki",
    icon: Footprints,
    description:
      "Perjalanan tanpa kendaraan bermotor (zero emission).",
  },
];

const transportDetails: Record<
  TransportCategory,
  {
    id: TransportType;
    label: string;
    description: string;
    emissionFactorKgPerKm: number;
    routeSupported: boolean;
  }[]
> = {
  motor: [
    {
      id: "motor-bensin",
      label: "Motor bensin",
      description:
        "Sepeda motor dengan bahan bakar bensin.",
      emissionFactorKgPerKm:
        0.103,
      routeSupported: true,
    },

    {
      id: "motor-diesel",
      label: "Motor diesel",
      description:
        "Kendaraan roda dua berbahan bakar diesel.",
      emissionFactorKgPerKm:
        0.115,
      routeSupported: true,
    },

    {
      id: "motor-electric",
      label: "Motor electric",
      description:
        "Sepeda motor listrik.",
      emissionFactorKgPerKm:
        0.04,
      routeSupported: true,
    },
  ],

  mobil: [
    {
      id: "mobil-bensin",
      label: "Mobil bensin",
      description:
        "Mobil penumpang dengan mesin bensin.",
      emissionFactorKgPerKm:
        0.192,
      routeSupported: true,
    },

    {
      id: "mobil-diesel",
      label: "Mobil diesel",
      description:
        "Mobil penumpang dengan mesin diesel.",
      emissionFactorKgPerKm:
        0.171,
      routeSupported: true,
    },

    {
      id: "mobil-hybrid",
      label: "Mobil hybrid",
      description:
        "Mobil hybrid seperti sistem hybrid Toyota atau Honda.",
      emissionFactorKgPerKm:
        0.12,
      routeSupported: true,
    },

    {
      id: "mobil-electric",
      label: "Mobil electric",
      description:
        "Mobil listrik penuh.",
      emissionFactorKgPerKm:
        0.05,
      routeSupported: true,
    },
  ],

  "kendaraan-besar": [
    {
      id: "truk-diesel",
      label: "Truk diesel",
      description:
        "Truk berbahan bakar diesel.",
      emissionFactorKgPerKm:
        0.65,
      routeSupported: true,
    },

    {
      id: "truk-electric",
      label: "Truk electric",
      description:
        "Truk listrik.",
      emissionFactorKgPerKm:
        0.2,
      routeSupported: true,
    },

    {
      id: "bus-diesel",
      label: "Bus diesel",
      description:
        "Bus berbahan bakar diesel.",
      emissionFactorKgPerKm:
        0.8,
      routeSupported: true,
    },

    {
      id: "bus-electric",
      label: "Bus electric",
      description:
        "Bus listrik.",
      emissionFactorKgPerKm:
        0.25,
      routeSupported: true,
    },
  ],

  "jalan-kaki": [
    {
      id: "jalan-kaki",
      label: "Jalan kaki",
      description:
        "Perjalanan tanpa kendaraan bermotor.",
      emissionFactorKgPerKm:
        0,
      routeSupported: true,
    },
  ],
};

/* =========================================================
   MAIN PAGE
   ========================================================= */

export default function ImpactPage() {
  const { locale, t } = useLanguage();

  function getCategoryLabel(id: TransportCategory) {
    switch (id) {
      case "motor": return t.impact.transport.motor;
      case "mobil": return t.impact.transport.mobil;
      case "kendaraan-besar": return t.impact.transport.kendaraanBesar;
      case "jalan-kaki": return t.impact.transport.jalanKaki;
      default: return id;
    }
  }

  function getCategoryDescription(id: TransportCategory) {
    switch (id) {
      case "motor": return t.impact.transport.motorDesc;
      case "mobil": return t.impact.transport.mobilDesc;
      case "kendaraan-besar": return t.impact.transport.kendaraanBesarDesc;
      case "jalan-kaki": return t.impact.transport.jalanKakiDesc;
      default: return "";
    }
  }

  function getDetailLabel(id: TransportType) {
    switch (id) {
      case "motor-bensin": return t.impact.transport.motorBensin;
      case "motor-diesel": return t.impact.transport.motorDiesel;
      case "motor-electric": return t.impact.transport.motorElectric;
      case "mobil-bensin": return t.impact.transport.mobilBensin;
      case "mobil-diesel": return t.impact.transport.mobilDiesel;
      case "mobil-hybrid": return t.impact.transport.mobilHybrid;
      case "mobil-electric": return t.impact.transport.mobilElectric;
      case "truk-diesel": return t.impact.transport.trukDiesel;
      case "truk-electric": return t.impact.transport.trukElectric;
      case "bus-diesel": return t.impact.transport.busDiesel;
      case "bus-electric": return t.impact.transport.busElectric;
      case "jalan-kaki": return t.impact.transport.jalanKakiDetail;
      default: return id;
    }
  }

  function getDetailDescription(id: TransportType) {
    switch (id) {
      case "motor-bensin": return t.impact.transport.motorBensinDesc;
      case "motor-diesel": return t.impact.transport.motorDieselDesc;
      case "motor-electric": return t.impact.transport.motorElectricDesc;
      case "mobil-bensin": return t.impact.transport.mobilBensinDesc;
      case "mobil-diesel": return t.impact.transport.mobilDieselDesc;
      case "mobil-hybrid": return t.impact.transport.mobilHybridDesc;
      case "mobil-electric": return t.impact.transport.mobilElectricDesc;
      case "truk-diesel": return t.impact.transport.trukDieselDesc;
      case "truk-electric": return t.impact.transport.trukElectricDesc;
      case "bus-diesel": return t.impact.transport.busDieselDesc;
      case "bus-electric": return t.impact.transport.busElectricDesc;
      case "jalan-kaki": return t.impact.transport.jalanKakiDetailDesc;
      default: return "";
    }
  }

  const [origin, setOrigin] =
    useState<LocationResult | null>(
      null
    );

  const [
    destination,
    setDestination,
  ] =
    useState<LocationResult | null>(
      null
    );

  const [
    originQuery,
    setOriginQuery,
  ] = useState("");

  const [
    destinationQuery,
    setDestinationQuery,
  ] = useState("");

  const [
    originSuggestions,
    setOriginSuggestions,
  ] = useState<LocationResult[]>(
    []
  );

  const [
    destinationSuggestions,
    setDestinationSuggestions,
  ] = useState<LocationResult[]>(
    []
  );

  const [
    activeTarget,
    setActiveTarget,
  ] =
    useState<PointTarget>(
      "origin"
    );

  const [
    transportCategory,
    setTransportCategory,
  ] =
    useState<TransportCategory>(
      "motor"
    );

  const [
    transport,
    setTransport,
  ] =
    useState<TransportType>(
      "motor-bensin"
    );

  const [
    route,
    setRoute,
  ] =
    useState<RouteResult | null>(
      null
    );

  const [
    loadingSearch,
    setLoadingSearch,
  ] =
    useState<PointTarget | null>(
      null
    );

  const [
    loadingRoute,
    setLoadingRoute,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    showOriginSuggestions,
    setShowOriginSuggestions,
  ] = useState(false);

  const [
    showDestinationSuggestions,
    setShowDestinationSuggestions,
  ] =
    useState(false);

  const [
    noOriginResults,
    setNoOriginResults,
  ] =
    useState(false);

  const [
    noDestinationResults,
    setNoDestinationResults,
  ] =
    useState(false);

  const originSearchRequest = useRef(0);
  const destinationSearchRequest = useRef(0);

  const [
    transportOpen,
    setTransportOpen,
  ] =
    useState(true);

  /* =======================================================
     SELECTED TRANSPORT
     ======================================================= */

  const selectedTransport =
    useMemo(() => {
      const options =
        transportDetails[
          transportCategory
        ];

      return (
        options.find(
          (item) =>
            item.id ===
            transport
        ) ??
        options[0]
      );
    }, [
      transport,
      transportCategory,
    ]);

  /* =======================================================
     EMISSION
     ======================================================= */

  const estimatedKg =
    route
      ? route.distanceKm *
        selectedTransport.emissionFactorKgPerKm
      : 0;

  const estimatedGram =
    estimatedKg * 1000;

  /* =======================================================
     SEARCH FUNCTION
     ======================================================= */

  async function searchLocations(
    target: PointTarget,
    query: string
  ) {
    const normalizedQuery = query.trim();

    if (normalizedQuery.length < 3) {
      return;
    }

    const requestId =
      target === "origin"
        ? ++originSearchRequest.current
        : ++destinationSearchRequest.current;

    setLoadingSearch(target);
    setError("");

    if (target === "origin") {
      setNoOriginResults(false);
      setShowOriginSuggestions(true);
    } else {
      setNoDestinationResults(false);
      setShowDestinationSuggestions(true);
    }

    try {
      const response = await fetch(
        `/api/impact?action=search&q=${encodeURIComponent(
          normalizedQuery
        )}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      const stillCurrent =
        target === "origin"
          ? requestId === originSearchRequest.current
          : requestId === destinationSearchRequest.current;

      if (!stillCurrent) {
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ??
            "Pencarian lokasi gagal."
        );
      }

      const results: LocationResult[] =
        Array.isArray(data?.results)
          ? data.results
          : [];

      if (target === "origin") {
        setOriginSuggestions(results);
        setShowOriginSuggestions(true);
        setNoOriginResults(results.length === 0);
      } else {
        setDestinationSuggestions(results);
        setShowDestinationSuggestions(true);
        setNoDestinationResults(results.length === 0);
      }
    } catch (searchError) {
      const stillCurrent =
        target === "origin"
          ? requestId === originSearchRequest.current
          : requestId === destinationSearchRequest.current;

      if (!stillCurrent) {
        return;
      }

      console.error(
        "LOCATION SEARCH ERROR:",
        searchError
      );

      setError(
        searchError instanceof Error
          ? searchError.message
          : "Pencarian lokasi gagal."
      );

      if (target === "origin") {
        setOriginSuggestions([]);
        setNoOriginResults(true);
        setShowOriginSuggestions(true);
      } else {
        setDestinationSuggestions([]);
        setNoDestinationResults(true);
        setShowDestinationSuggestions(true);
      }
    } finally {
      const stillCurrent =
        target === "origin"
          ? requestId === originSearchRequest.current
          : requestId === destinationSearchRequest.current;

      if (stillCurrent) {
        setLoadingSearch((current) =>
          current === target ? null : current
        );
      }
    }
  }

  /* =======================================================
     SEARCH ORIGIN
     ======================================================= */

  useEffect(() => {
    const query =
      originQuery.trim();

    const timer = window.setTimeout(() => {
      if (query.length < 3 || origin) {
        if (query.length < 3) {
          setOriginSuggestions([]);
          setNoOriginResults(false);
        }
        return;
      }
      void searchLocations("origin", query);
    }, 450);

    return () => window.clearTimeout(timer);
  }, [originQuery, origin]);

  /* =======================================================
     SEARCH DESTINATION
     ======================================================= */

  useEffect(() => {
    const query =
      destinationQuery.trim();

    const timer = window.setTimeout(() => {
      if (query.length < 3 || destination) {
        if (query.length < 3) {
          setDestinationSuggestions([]);
          setNoDestinationResults(false);
        }
        return;
      }
      void searchLocations("destination", query);
    }, 450);

    return () => window.clearTimeout(timer);
  }, [destinationQuery, destination]);

  /* =======================================================
     SELECT LOCATION
     ======================================================= */

  function selectLocation(
    target: PointTarget,
    location: LocationResult
  ) {
    setError("");

    if (
      target ===
      "origin"
    ) {
      setOrigin(
        location
      );

      setOriginQuery(
        location.label
      );

      setOriginSuggestions(
        []
      );

      setShowOriginSuggestions(
        false
      );

      setNoOriginResults(
        false
      );

      setActiveTarget(
        "destination"
      );

      return;
    }

    setDestination(
      location
    );

    setDestinationQuery(
      location.label
    );

    setDestinationSuggestions(
      []
    );

    setShowDestinationSuggestions(
      false
    );

    setNoDestinationResults(
      false
    );
  }

  /* =======================================================
     MAP PICK
     ======================================================= */

  async function handleMapPick(
    coordinate: Coordinate
  ) {
    setError("");

    const target =
      activeTarget;

    try {
      const response =
        await fetch(
          `/api/impact?action=reverse&lat=${coordinate[0]}&lon=${coordinate[1]}`,
          {
            method:
              "GET",

            cache:
              "no-store",
          }
        );

      const data =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          data?.error ??
            "Lokasi tidak dapat dikenali."
        );
      }

      const result:
        LocationResult = {
        id:
          data?.result
            ?.id ??
          `${coordinate[0]}-${coordinate[1]}`,

        label:
          data?.result
            ?.label ??
          `${coordinate[0].toFixed(
            5
          )}, ${coordinate[1].toFixed(
            5
          )}`,

        lat:
          coordinate[0],

        lon:
          coordinate[1],
      };

      selectLocation(
        target,
        result
      );
    } catch (
      reverseError
    ) {
      console.error(
        "MAP REVERSE ERROR:",
        reverseError
      );

      const fallback:
        LocationResult = {
        id: `${coordinate[0]}-${coordinate[1]}`,

        label: `Titik peta ${coordinate[0].toFixed(
          5
        )}, ${coordinate[1].toFixed(
          5
        )}`,

        lat:
          coordinate[0],

        lon:
          coordinate[1],
      };

      selectLocation(
        target,
        fallback
      );
    }
  }

  /* =======================================================
     INPUT ORIGIN
     ======================================================= */

  function handleOriginInput(
    value: string
  ) {
    setOrigin(
      null
    );

    setOriginQuery(
      value
    );

    setOriginSuggestions(
      []
    );

    setNoOriginResults(
      false
    );

    setShowOriginSuggestions(
      value.trim()
        .length >= 3
    );

    setRoute(
      null
    );

    setError("");

    setActiveTarget(
      "origin"
    );
  }

  /* =======================================================
     INPUT DESTINATION
     ======================================================= */

  function handleDestinationInput(
    value: string
  ) {
    setDestination(
      null
    );

    setDestinationQuery(
      value
    );

    setDestinationSuggestions(
      []
    );

    setNoDestinationResults(
      false
    );

    setShowDestinationSuggestions(
      value.trim()
        .length >= 3
    );

    setRoute(
      null
    );

    setError("");

    setActiveTarget(
      "destination"
    );
  }

  /* =======================================================
     TRANSPORT CATEGORY
     ======================================================= */

  function handleCategorySelect(
    category: TransportCategory
  ) {
    setTransportCategory(
      category
    );

    const firstOption =
      transportDetails[
        category
      ][0];

    setTransport(
      firstOption.id
    );

    setRoute(
      null
    );

    setError("");
  }

  /* =======================================================
     ROUTE
     ======================================================= */

  async function calculateRoute(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!origin) {
      setError(
        "Pilih titik awal terlebih dahulu."
      );

      setActiveTarget(
        "origin"
      );

      return;
    }

    if (!destination) {
      setError(
        "Pilih titik tujuan terlebih dahulu."
      );

      setActiveTarget(
        "destination"
      );

      return;
    }

    if (
      !selectedTransport
        .routeSupported
    ) {
      setError(
        "Jenis transportasi ini belum memiliki routing jaringan khusus. Pilih transportasi jalan untuk menghitung rute saat ini."
      );

      return;
    }

    setLoadingRoute(
      true
    );

    setRoute(
      null
    );

    try {
      const response =
        await fetch(
          "/api/impact",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                action:
                  "route",

                origin: [
                  origin.lon,
                  origin.lat,
                ],

                destination: [
                  destination.lon,
                  destination.lat,
                ],

                transport,
              }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          data?.error ??
            (locale === "en" ? "Failed to calculate route." : "Rute gagal dihitung.")
        );
      }

      setRoute({
        distanceKm:
          Number(
            data.distanceKm
          ) || 0,

        durationMinutes:
          Number(
            data.durationMinutes
          ) || 0,

        geometry:
          Array.isArray(
            data.geometry
          )
            ? data.geometry
            : [],
      });
    } catch (
      routeError
    ) {
      console.error(
        "ROUTE CALCULATION ERROR:",
        routeError
      );

      setError(
        routeError instanceof
          Error
          ? routeError.message
          : (locale === "en" ? "Failed to calculate route." : "Rute gagal dihitung.")
      );
    } finally {
      setLoadingRoute(
        false
      );
    }
  }

  /* =======================================================
     CLEAR POINT
     ======================================================= */

  function clearPoint(
    target: PointTarget
  ) {
    setError("");

    setRoute(
      null
    );

    if (
      target ===
      "origin"
    ) {
      setOrigin(
        null
      );

      setOriginQuery(
        ""
      );

      setOriginSuggestions(
        []
      );

      setNoOriginResults(
        false
      );

      setActiveTarget(
        "origin"
      );

      return;
    }

    setDestination(
      null
    );

    setDestinationQuery(
      ""
    );

    setDestinationSuggestions(
      []
    );

    setNoDestinationResults(
      false
    );

    setActiveTarget(
      "destination"
    );
  }

  /* =======================================================
     FORMAT
     ======================================================= */

  function formatNumber(
    value:
      | number
      | null
      | undefined,

    maximumFractionDigits = 2
  ) {
    if (
      value === null ||
      value ===
        undefined ||
      !Number.isFinite(
        value
      )
    ) {
      return "—";
    }

    return new Intl.NumberFormat(
      locale === "en" ? "en-US" : "id-ID",
      {
        maximumFractionDigits,
      }
    ).format(
      value
    );
  }

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#092328] text-white">

      {/* BACKGROUND */}

      <div
        className="pointer-events-none absolute left-[-18%] top-[-18%] h-[720px] w-[1000px] rotate-[18deg] blur-[105px]"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(30,170,103,0.025) 22%, rgba(30,170,103,0.06) 42%, rgba(25,150,92,0.035) 68%, transparent 100%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-12">

        {/* BACK */}

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs text-white/40 transition hover:text-emerald-200"
        >
          {locale === "en" ? "← Back to Dashboard" : "← Kembali ke Dashboard"}
        </Link>

        {/* HEADER */}

        <div className="mt-8 max-w-3xl">

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            <Activity className="h-3.5 w-3.5" />
            <span>ARVENA IMPACT</span>
          </div>

          <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-5xl">
            {locale === "en" ? "Route & Emissions" : "Rute & Emisi"}
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/45">
            {locale === "en"
              ? "Set origin and destination points, choose transportation mode, and let ARVENA compute optimal routing and estimated environmental impact."
              : "Tentukan titik awal dan titik tujuan, pilih moda transportasi, lalu biarkan ARVENA menghitung rute dan estimasi dampaknya."}
          </p>

        </div>

        {/* ROUTE CONTROL */}

        <form
          onSubmit={
            calculateRoute
          }
          className="mt-9 overflow-visible rounded-3xl border border-white/[0.08] bg-white/[0.018] p-5 sm:p-7"
        >

          <div className="grid gap-5 lg:grid-cols-2">

            {/* TITIK AWAL */}

            <LocationInput
              label={t.impact.origin}
              locale={locale}
              value={
                originQuery
              }
              placeholder={
                locale === "en"
                  ? "Search origin, e.g. Warehouse, Faculty of Engineering, Jl. Pahlawan..."
                  : "Cari Kos Pak Frans, UNDIP, KFC Tirtoagung..."
              }
              active={
                activeTarget ===
                "origin"
              }
              loading={
                loadingSearch ===
                "origin"
              }
              selected={
                Boolean(
                  origin
                )
              }
              suggestions={
                originSuggestions
              }
              showSuggestions={
                showOriginSuggestions
              }
              noResults={
                noOriginResults
              }
              onFocus={() =>
                setActiveTarget(
                  "origin"
                )
              }
              onChange={
                handleOriginInput
              }
              onSelect={(
                item
              ) =>
                selectLocation(
                  "origin",
                  item
                )
              }
              onClear={() =>
                clearPoint(
                  "origin"
                )
              }
            />

            {/* TITIK TUJUAN */}

            <LocationInput
              label={t.impact.destination}
              locale={locale}
              value={
                destinationQuery
              }
              placeholder={
                locale === "en"
                  ? "Search destination, e.g. Central Recycling Hub, Tembalang..."
                  : "Cari Burjo Idaman, KFC, Tembalang..."
              }
              active={
                activeTarget ===
                "destination"
              }
              loading={
                loadingSearch ===
                "destination"
              }
              selected={
                Boolean(
                  destination
                )
              }
              suggestions={
                destinationSuggestions
              }
              showSuggestions={
                showDestinationSuggestions
              }
              noResults={
                noDestinationResults
              }
              onFocus={() =>
                setActiveTarget(
                  "destination"
                )
              }
              onChange={
                handleDestinationInput
              }
              onSelect={(
                item
              ) =>
                selectLocation(
                  "destination",
                  item
                )
              }
              onClear={() =>
                clearPoint(
                  "destination"
                )
              }
            />

          </div>

          {/* SELECTED */}

          <div className="mt-5 grid gap-3 md:grid-cols-2">

            <SelectedLocation
              label={t.impact.originSelected}
              locale={locale}
              location={
                origin
              }
              active={
                activeTarget ===
                "origin"
              }
              onClick={() =>
                setActiveTarget(
                  "origin"
                )
              }
            />

            <SelectedLocation
              label={t.impact.destinationSelected}
              locale={locale}
              location={
                destination
              }
              active={
                activeTarget ===
                "destination"
              }
              onClick={() =>
                setActiveTarget(
                  "destination"
                )
              }
            />

          </div>

          {/* TRANSPORT */}

          <div className="mt-7">

            <div className="mb-3 flex items-end justify-between gap-4">

              <div>

                <p className="text-xs font-medium text-white/60">
                  {t.impact.chooseTransport}
                </p>

                <p className="mt-1 text-[10px] leading-5 text-white/40">
                  {locale === "en"
                    ? "Choose category first, then select vehicle type."
                    : "Pilih kategori terlebih dahulu, lalu tentukan jenis kendaraan."}
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setTransportOpen(
                    (
                      current
                    ) =>
                      !current
                  )
                }
                className="text-[10px] text-white/40 transition hover:text-emerald-200"
              >
                {transportOpen
                  ? (locale === "en" ? "Hide" : "Sembunyikan")
                  : (locale === "en" ? "Show" : "Tampilkan")}
              </button>

            </div>

            {transportOpen && (
              <>

                {/* CATEGORY - PREDOMINANTLY WHITE / OFF-WHITE CARDS WITH DARK TEXT */}

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                  {transportCategories.map(
                    (
                      category
                    ) => {
                      const selected =
                        transportCategory ===
                        category.id;
                      const Icon = category.icon;

                      return (
                        <button
                          key={
                            category.id
                          }
                          type="button"
                          onClick={() =>
                            handleCategorySelect(
                              category.id
                            )
                          }
                          className={`rounded-2xl border p-4 text-left transition-all ${
                            selected
                              ? "bg-white text-slate-900 border-2 border-emerald-600 ring-2 ring-emerald-500/20 shadow-md"
                              : "bg-white/95 hover:bg-white text-slate-800 border-slate-200/90 shadow-sm hover:border-slate-300"
                          }`}
                        >

                          <div className="flex items-center justify-between">

                            <div
                              className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                                selected
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                  : "border-slate-200 bg-slate-100 text-slate-600"
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                            </div>

                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                selected
                                  ? "bg-emerald-600 shadow-[0_0_8px_rgba(5,150,105,0.4)]"
                                  : "bg-slate-300"
                              }`}
                            />

                          </div>

                          <p
                            className={`mt-3 text-sm font-semibold ${
                              selected
                                ? "text-slate-950"
                                : "text-slate-800"
                            }`}
                          >
                            {
                              getCategoryLabel(category.id)
                            }
                          </p>

                          <p
                            className={`mt-1 text-[11px] leading-relaxed ${
                              selected
                                ? "text-slate-600 font-medium"
                                : "text-slate-500"
                            }`}
                          >
                            {
                              getCategoryDescription(category.id)
                            }
                          </p>

                        </button>
                      );
                    }
                  )}

                </div>

                {/* DETAIL */}

                <div className="mt-4 rounded-2xl border border-white/[0.09] bg-[#071d21]/70 p-4">

                  <div className="mb-3 flex items-center justify-between">

                    <div>

                      <p className="text-[9px] uppercase tracking-[0.16em] text-white/35">
                        {locale === "en" ? "Vehicle type" : "Jenis kendaraan"}
                      </p>

                      <p className="mt-1 text-xs font-semibold text-emerald-300">
                        {getCategoryLabel(transportCategory)}
                      </p>

                    </div>

                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">

                    {transportDetails[
                      transportCategory
                    ].map(
                      (
                        option
                      ) => {
                        const selected =
                          transport ===
                          option.id;

                        return (
                          <button
                            key={
                              option.id
                            }
                            type="button"
                            onClick={() => {
                              setTransport(
                                option.id
                              );

                              setRoute(
                                null
                              );

                              setError(
                                ""
                              );
                            }}
                            className={`rounded-xl border px-3 py-3 text-left transition ${
                              selected
                                ? "border-emerald-400/60 bg-emerald-950/40 ring-1 ring-emerald-400/30"
                                : "border-white/[0.08] bg-white/[0.025] hover:border-white/[0.16] hover:bg-white/[0.05]"
                            }`}
                          >

                            <div className="flex items-center justify-between gap-2">

                              <p
                                className={`text-xs font-medium ${
                                  selected
                                    ? "text-emerald-200 font-semibold"
                                    : "text-white/70"
                                }`}
                              >
                                {getDetailLabel(option.id)}
                              </p>

                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  selected
                                    ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]"
                                    : "bg-white/20"
                                }`}
                              />

                            </div>

                            <p
                              className={`mt-1 text-[9px] leading-4 ${
                                selected
                                  ? "text-emerald-100/70"
                                  : "text-white/35"
                              }`}
                            >
                              {getDetailDescription(option.id)}
                            </p>

                          </button>
                        );
                      }
                    )}

                  </div>

                </div>

              </>
            )}

          </div>

          {/* ACTION */}

          <div className="mt-6 flex flex-col gap-3 border-t border-white/[0.06] pt-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-[10px] text-white/25">
                {locale === "en"
                  ? "Select points directly from search or click on the map."
                  : "Pilih titik langsung dari pencarian atau klik peta."}
              </p>

              <p className="mt-1 text-[9px] text-white/15">
                {locale === "en"
                  ? "Non-road modes will connect to multimodal routing in the next phase."
                  : "Transportasi non-jalan akan kita sambungkan ke routing engine multimoda pada tahap berikutnya."}
              </p>

            </div>

            <button
              type="submit"
              disabled={
                loadingRoute ||
                !origin ||
                !destination ||
                !selectedTransport
                  .routeSupported
              }
              className="rounded-2xl bg-[#2A835F] border border-[#12544F] px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#349e73] disabled:cursor-not-allowed disabled:opacity-35"
            >
              {loadingRoute
                ? locale === "en" ? "Calculating..." : "Menghitung..."
                : selectedTransport.routeSupported
                ? locale === "en" ? "Calculate Route" : "Hitung Rute & Emisi"
                : locale === "en" ? "Routing Soon" : "Segera Hadir"}
            </button>

          </div>

        </form>

        {/* ERROR */}

        {error && (
          <div className="mt-4 rounded-2xl border border-red-300/10 bg-red-300/[0.035] px-4 py-3">

            <p className="text-xs leading-5 text-red-200/70">
              {error}
            </p>

          </div>
        )}

        {/* MAP */}

        <section className="mt-7">

          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <p className="text-[9px] uppercase tracking-[0.2em] text-white/20">
                Interactive GIS
              </p>

              <h2 className="mt-1 text-lg font-medium text-white/75">
                {locale === "en" ? "Select point on map" : "Pilih titik pada peta"}
              </h2>

            </div>

            <p className="text-[10px] text-white/20">
              {locale === "en"
                ? `Click map to place ${activeTarget === "origin" ? "origin point" : "destination point"}.`
                : `Klik peta untuk menaruh ${activeTarget === "origin" ? "titik awal" : "titik tujuan"}.`}
            </p>

          </div>

          <ImpactMap
            origin={
              origin
                ? [
                    origin.lat,
                    origin.lon,
                  ]
                : null
            }

            destination={
              destination
                ? [
                    destination.lat,
                    destination.lon,
                  ]
                : null
            }

            route={
              route?.geometry ??
              []
            }

            originLabel={
              origin?.label ??
              (locale === "en" ? "Origin" : "Titik Awal")
            }

            destinationLabel={
              destination?.label ??
              (locale === "en" ? "Destination" : "Titik Tujuan")
            }

            activeTarget={
              activeTarget
            }

            onMapPick={
              handleMapPick
            }

            onOriginDrag={
              handleMapPick
            }

            onDestinationDrag={
              handleMapPick
            }
          />

        </section>

        {/* RESULTS */}

        <section className="mt-6 grid gap-4 md:grid-cols-3">

          <ResultCard
            label={t.impact.distanceLabel || "Distance"}
            value={
              route
                ? formatNumber(
                    route.distanceKm
                  )
                : "—"
            }
            suffix="km"
            description={t.impact.distanceDesc || "Distance based on the road network route."}
          />

          <ResultCard
            label={t.impact.travelTimeLabel || "Travel time"}
            value={
              route
                ? formatNumber(
                    route.durationMinutes,
                    1
                  )
                : "—"
            }
            suffix="min"
            description={t.impact.travelTimeDesc || "Estimated travel time from the routing engine."}
          />

          <ResultCard
            label={t.impact.estimatedCO2Label || "Estimated CO₂"}
            value={
              route
                ? formatNumber(
                    estimatedGram,
                    1
                  )
                : "—"
            }
            suffix="g"
            description={`${t.impact.estimatedCO2Desc || "Estimated based on"} ${getDetailLabel(selectedTransport.id).toLowerCase()}.`}
            green
          />

        </section>

        {/* SUMMARY */}

        <section className="mt-6 rounded-3xl border border-white/[0.08] bg-white/[0.018] p-6">

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

            <div className="max-w-2xl">

              <p className="text-[9px] uppercase tracking-[0.18em] text-white/20">
                {t.impact.currentRouteLabel || "Current route"}
              </p>

              <h2 className="mt-2 text-xl font-medium text-white/80">
                {origin &&
                destination
                  ? `${origin.label} → ${destination.label}`
                  : (t.impact.noRouteSelected || "Belum ada rute yang dipilih")}
              </h2>

              <p className="mt-3 text-xs leading-6 text-white/35">

                {origin &&
                destination
                  ? `${t.impact.using || "Menggunakan"} ${getDetailLabel(selectedTransport.id)}. ${getDetailDescription(selectedTransport.id)}`
                  : (t.impact.selectPointsHint || "Pilih titik awal dan titik tujuan untuk melihat ringkasan rute.")}

              </p>

            </div>

            {route && (
              <div className="rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.025] px-5 py-4 lg:min-w-[230px]">

                <p className="text-[9px] uppercase tracking-[0.16em] text-emerald-300/55">
                  {t.impact.routeStatusLabel || "Route status"}
                </p>

                <p className="mt-2 text-sm font-medium text-emerald-200">
                  {t.impact.routeCalculated || "Route calculated"}
                </p>

                <p className="mt-1 text-[10px] text-white/35">
                  {t.impact.fastestRoute || "Fastest available road route"}
                </p>

              </div>
            )}

          </div>

        </section>

        {/* COMPACT PROFESSIONAL DISCLAIMER */}

        <div className="mt-4 max-w-3xl space-y-1.5 text-[10px] leading-relaxed text-white/25">

          <p>
            {t.impact.locationDisclaimer || "Location search uses Geoapify with OpenStreetMap data. Road routing uses OpenRouteService."}
          </p>

          <p>
            {t.impact.emissionDisclaimer || "Emission factors are based on the current prototype configuration and are provided for estimation purposes."}
          </p>

        </div>

      </div>
    </main>
  );
}

/* =========================================================
   LOCATION INPUT
   ========================================================= */

function LocationInput({
  label,
  value,
  placeholder,
  active,
  loading,
  selected,
  suggestions,
  showSuggestions,
  noResults,
  locale = "id",
  onFocus,
  onChange,
  onSelect,
  onClear,
}: {
  label: string;
  value: string;
  placeholder: string;
  active: boolean;
  loading: boolean;
  selected: boolean;
  suggestions: LocationResult[];
  showSuggestions: boolean;
  noResults: boolean;
  locale?: string;
  onFocus: () => void;
  onChange: (
    value: string
  ) => void;
  onSelect: (
    item: LocationResult
  ) => void;
  onClear: () => void;
}) {
  return (
    <div className="relative">

      <div className="mb-2 flex items-center justify-between gap-3">

        <label className="text-xs font-medium text-white/60">
          {label}
        </label>

        <button
          type="button"
          onClick={
            onFocus
          }
          className={`text-[10px] transition ${
            active
              ? "text-emerald-200"
              : "text-white/25 hover:text-white/50"
          }`}
        >
          {locale === "en" ? "Select on map" : "Pilih di peta"}
        </button>

      </div>

      <div
        className={`relative rounded-2xl border ${
          active
            ? "border-emerald-300/25 bg-emerald-300/[0.018]"
            : "border-white/[0.08] bg-white/[0.035]"
        }`}
      >

        <input
          type="text"
          value={value}
          onChange={(
            event
          ) =>
            onChange(
              event.target
                .value
            )
          }
          onFocus={
            onFocus
          }
          placeholder={
            placeholder
          }
          className="w-full rounded-2xl bg-transparent px-4 py-4 pr-14 text-sm text-white outline-none placeholder:text-white/20"
        />

        {/* LOADING SPINNER
            Absolute sehingga TIDAK mengubah tinggi layout. */}

        {loading && (
          <div className="pointer-events-none absolute right-4 top-1/2 flex -translate-y-1/2 items-center">

            <div className="h-4 w-4 animate-spin rounded-full border border-white/10 border-t-emerald-300" />

          </div>
        )}

        {!loading &&
          selected && (
            <button
              type="button"
              onClick={
                onClear
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-lg leading-none text-white/25 transition hover:text-white"
            >
              ×
            </button>
          )}

      </div>

      {/* RESERVED STATUS AREA
          Tinggi selalu tetap sehingga halaman tidak loncat. */}

      <div className="h-5">

        {loading && (
          <p className="pt-2 text-[10px] text-emerald-200/55">
            {locale === "en" ? "Searching location..." : "Mencari lokasi..."}
          </p>
        )}

        {!loading &&
          noResults &&
          value.trim()
            .length >=
            3 && (
            <p className="pt-2 text-[10px] text-white/40">
              {locale === "en"
                ? "Location not found. Try another place name, street, or area."
                : "Lokasi belum ditemukan. Coba nama tempat, jalan, atau area lain."}
            </p>
          )}

      </div>

      {showSuggestions &&
        suggestions.length >
          0 && (
          <SuggestionList
            items={
              suggestions
            }
            onSelect={
              onSelect
            }
          />
        )}

    </div>
  );
}

/* =========================================================
   SUGGESTION LIST
   ========================================================= */

function SuggestionList({
  items,
  onSelect,
}: {
  items: LocationResult[];
  onSelect: (
    item: LocationResult
  ) => void;
}) {
  return (
    <div className="absolute left-0 right-0 top-[72px] z-50 overflow-hidden rounded-2xl border border-white/10 bg-[#092328] shadow-[0_25px_70px_rgba(0,0,0,0.55)] backdrop-blur">

      {items.map(
        (
          item
        ) => (
          <button
            key={
              item.id
            }
            type="button"
            onClick={() =>
              onSelect(
                item
              )
            }
            className="block w-full border-b border-white/[0.05] px-4 py-3 text-left transition last:border-b-0 hover:bg-emerald-300/[0.06]"
          >

            <p className="text-xs font-medium leading-5 text-white/75">
              {
                item.label
              }
            </p>

            <p className="mt-1 text-[9px] text-white/20">
              {item.lat.toFixed(
                5
              )}
              ,{" "}
              {item.lon.toFixed(
                5
              )}
            </p>

          </button>
        )
      )}

    </div>
  );
}

/* =========================================================
   SELECTED LOCATION
   ========================================================= */

function SelectedLocation({
  label,
  location,
  active,
  locale = "id",
  onClick,
}: {
  label: string;
  location:
    | LocationResult
    | null;
  active: boolean;
  locale?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`rounded-2xl border p-4 text-left transition ${
        active
          ? "border-emerald-300/15 bg-emerald-300/[0.025]"
          : "border-white/[0.07] bg-white/[0.012]"
      }`}
    >

      <p className="text-[9px] uppercase tracking-[0.16em] text-white/30">
        {label}
      </p>

      <p className="mt-2 text-xs leading-5 text-white/70">
        {location
          ? location.label
          : (locale === "en" ? "Not selected" : "Belum dipilih")}
      </p>

    </button>
  );
}

/* =========================================================
   RESULT CARD
   ========================================================= */

function ResultCard({
  label,
  value,
  suffix,
  description,
  green = false,
}: {
  label: string;
  value: string;
  suffix: string;
  description: string;
  green?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border p-6 ${
        green
          ? "border-emerald-300/10 bg-emerald-300/[0.025]"
          : "border-white/[0.08] bg-white/[0.018]"
      }`}
    >

      <p
        className={`text-[9px] uppercase tracking-[0.18em] ${
          green
            ? "text-emerald-300/55"
            : "text-white/20"
        }`}
      >
        {label}
      </p>

      <p
        className={`mt-3 text-3xl font-semibold ${
          green
            ? "text-emerald-200"
            : "text-white"
        }`}
      >

        {value}

        <span className="ml-1 text-sm font-normal text-white/30">
          {suffix}
        </span>

      </p>

      <p className="mt-2 text-xs leading-5 text-white/25">
        {description}
      </p>

    </div>
  );
}