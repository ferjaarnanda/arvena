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
  | "kereta"
  | "pesawat"
  | "kapal"
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
  | "kereta-diesel"
  | "kereta-electric"
  | "pesawat-domestik"
  | "pesawat-internasional"
  | "ferry"
  | "speedboat"
  | "kapal-diesel"
  | "kapal-electric"
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
  icon: string;
  description: string;
}[] = [
  {
    id: "motor",
    label: "Motor",
    icon: "🏍",
    description:
      "Sepeda motor dan kendaraan roda dua.",
  },

  {
    id: "mobil",
    label: "Mobil",
    icon: "🚗",
    description:
      "Kendaraan penumpang pribadi.",
  },

  {
    id: "kendaraan-besar",
    label: "Kendaraan besar",
    icon: "🚛",
    description:
      "Truk dan bus.",
  },

  {
    id: "kereta",
    label: "Kereta",
    icon: "🚆",
    description:
      "Perjalanan menggunakan kereta api.",
  },

  {
    id: "pesawat",
    label: "Pesawat",
    icon: "✈️",
    description:
      "Perjalanan udara.",
  },

  {
    id: "kapal",
    label: "Kapal",
    icon: "🚢",
    description:
      "Ferry, speedboat, dan kapal lainnya.",
  },

  {
    id: "jalan-kaki",
    label: "Jalan kaki",
    icon: "🚶",
    description:
      "Perjalanan tanpa kendaraan bermotor.",
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

  kereta: [
    {
      id: "kereta-electric",
      label: "Kereta electric",
      description:
        "Kereta listrik.",
      emissionFactorKgPerKm:
        0.04,
      routeSupported: false,
    },

    {
      id: "kereta-diesel",
      label: "Kereta diesel",
      description:
        "Kereta dengan tenaga diesel.",
      emissionFactorKgPerKm:
        0.09,
      routeSupported: false,
    },
  ],

  pesawat: [
    {
      id: "pesawat-domestik",
      label: "Pesawat domestik",
      description:
        "Penerbangan dalam negeri.",
      emissionFactorKgPerKm:
        0.255,
      routeSupported: false,
    },

    {
      id: "pesawat-internasional",
      label: "Pesawat internasional",
      description:
        "Penerbangan internasional.",
      emissionFactorKgPerKm:
        0.195,
      routeSupported: false,
    },
  ],

  kapal: [
    {
      id: "ferry",
      label: "Ferry",
      description:
        "Kapal ferry untuk penyeberangan.",
      emissionFactorKgPerKm:
        0.18,
      routeSupported: false,
    },

    {
      id: "speedboat",
      label: "Speedboat",
      description:
        "Speedboat atau kapal cepat.",
      emissionFactorKgPerKm:
        0.25,
      routeSupported: false,
    },

    {
      id: "kapal-diesel",
      label: "Kapal diesel",
      description:
        "Kapal bermesin diesel.",
      emissionFactorKgPerKm:
        0.22,
      routeSupported: false,
    },

    {
      id: "kapal-electric",
      label: "Kapal electric",
      description:
        "Kapal listrik.",
      emissionFactorKgPerKm:
        0.08,
      routeSupported: false,
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
     SEARCH ORIGIN
     ======================================================= */

  useEffect(() => {
    const query =
      originQuery.trim();

    if (query.length < 3 || origin) {
      if (query.length < 3) {
        setOriginSuggestions([]);
        setNoOriginResults(false);
      }
      return;
    }

    const timer = window.setTimeout(() => {
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

    if (query.length < 3 || destination) {
      if (query.length < 3) {
        setDestinationSuggestions([]);
        setNoDestinationResults(false);
      }
      return;
    }

    const timer = window.setTimeout(() => {
      void searchLocations("destination", query);
    }, 450);

    return () => window.clearTimeout(timer);
  }, [destinationQuery, destination]);

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
            "Rute gagal dihitung."
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
          : "Rute gagal dihitung."
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
      "id-ID",
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
    <main className="relative min-h-screen overflow-hidden bg-[#06120e] text-white">

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
          className="inline-flex items-center gap-2 text-xs text-white/30 transition hover:text-emerald-200"
        >
          ← Back to Dashboard
        </Link>

        {/* HEADER */}

        <div className="mt-8 max-w-3xl">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center overflow-hidden">

              <Image
                src="/arvena-marks.png"
                alt="ARVENA"
                width={52}
                height={52}
                className="h-10 w-10 object-contain"
              />

            </div>

            <div>

              <p className="text-[9px] uppercase tracking-[0.22em] text-emerald-300/60">
                ARVENA IMPACT
              </p>

              <p className="mt-0.5 text-xs text-white/25">
                GIS & Environmental Intelligence
              </p>

            </div>

          </div>

          <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-5xl">
            Route & Emissions
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/35">
            Tentukan titik awal dan
            titik tujuan, pilih moda
            transportasi, lalu biarkan
            ARVENA menghitung rute dan
            estimasi dampaknya.
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
              label="Titik Awal"
              value={
                originQuery
              }
              placeholder="Cari Kos Pak Frans, UNDIP, KFC Tirtoagung..."
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
              label="Titik Tujuan"
              value={
                destinationQuery
              }
              placeholder="Cari Burjo Idaman, KFC, Tembalang..."
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
              label="Titik awal dipilih"
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
              label="Titik tujuan dipilih"
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
                  Moda transportasi
                </p>

                <p className="mt-1 text-[10px] leading-5 text-white/25">
                  Pilih kategori terlebih
                  dahulu, lalu tentukan
                  jenis kendaraan.
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
                className="text-[10px] text-white/30 transition hover:text-emerald-200"
              >
                {transportOpen
                  ? "Sembunyikan"
                  : "Tampilkan"}
              </button>

            </div>

            {transportOpen && (
              <>

                {/* CATEGORY */}

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                  {transportCategories.map(
                    (
                      category
                    ) => {
                      const selected =
                        transportCategory ===
                        category.id;

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
                              ? "border-emerald-300/25 bg-emerald-300/[0.05]"
                              : "border-white/[0.08] bg-white/[0.018] hover:border-white/[0.14] hover:bg-white/[0.03]"
                          }`}
                        >

                          <div className="flex items-center justify-between">

                            <span className="text-xl">
                              {
                                category.icon
                              }
                            </span>

                            <span
                              className={`h-2 w-2 rounded-full ${
                                selected
                                  ? "bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.65)]"
                                  : "bg-white/10"
                              }`}
                            />

                          </div>

                          <p
                            className={`mt-3 text-sm font-medium ${
                              selected
                                ? "text-emerald-200"
                                : "text-white/65"
                            }`}
                          >
                            {
                              category.label
                            }
                          </p>

                          <p className="mt-1 text-[10px] leading-5 text-white/25">
                            {
                              category.description
                            }
                          </p>

                        </button>
                      );
                    }
                  )}

                </div>

                {/* DETAIL */}

                <div className="mt-4 rounded-2xl border border-white/[0.07] bg-black/10 p-4">

                  <div className="mb-3 flex items-center justify-between">

                    <div>

                      <p className="text-[9px] uppercase tracking-[0.16em] text-white/20">
                        Jenis kendaraan
                      </p>

                      <p className="mt-1 text-xs text-white/40">
                        {
                          transportCategories.find(
                            (
                              item
                            ) =>
                              item.id ===
                              transportCategory
                          )?.label
                        }
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
                                ? "border-emerald-300/20 bg-emerald-300/[0.045]"
                                : "border-white/[0.06] bg-white/[0.012] hover:border-white/[0.12]"
                            }`}
                          >

                            <div className="flex items-center justify-between gap-2">

                              <p
                                className={`text-xs font-medium ${
                                  selected
                                    ? "text-emerald-200"
                                    : "text-white/55"
                                }`}
                              >
                                {
                                  option.label
                                }
                              </p>

                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  selected
                                    ? "bg-emerald-300"
                                    : "bg-white/10"
                                }`}
                              />

                            </div>

                            <p className="mt-1 text-[9px] leading-4 text-white/20">
                              {
                                option.description
                              }
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
                Pilih titik langsung dari
                pencarian atau klik peta.
              </p>

              <p className="mt-1 text-[9px] text-white/15">
                Transportasi non-jalan
                akan kita sambungkan ke
                routing engine multimoda
                pada tahap berikutnya.
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
              className="rounded-2xl bg-emerald-300 px-7 py-3.5 text-sm font-semibold text-[#06120e] transition hover:-translate-y-0.5 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-35"
            >
              {loadingRoute
                ? "Calculating..."
                : selectedTransport.routeSupported
                ? "Calculate Route"
                : "Routing Soon"}
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
                Pilih titik pada peta
              </h2>

            </div>

            <p className="text-[10px] text-white/20">
              Klik peta untuk menaruh{" "}
              {activeTarget ===
              "origin"
                ? "titik awal"
                : "titik tujuan"}.
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
              "Titik Awal"
            }

            destinationLabel={
              destination?.label ??
              "Titik Tujuan"
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
            label="Distance"
            value={
              route
                ? formatNumber(
                    route.distanceKm
                  )
                : "—"
            }
            suffix="km"
            description="Jarak berdasarkan rute jaringan jalan."
          />

          <ResultCard
            label="Travel time"
            value={
              route
                ? formatNumber(
                    route.durationMinutes,
                    1
                  )
                : "—"
            }
            suffix="min"
            description="Estimasi waktu perjalanan dari routing engine."
          />

          <ResultCard
            label="Estimated CO₂"
            value={
              route
                ? formatNumber(
                    estimatedGram,
                    1
                  )
                : "—"
            }
            suffix="g"
            description={`Estimasi berdasarkan ${selectedTransport.label.toLowerCase()}.`}
            green
          />

        </section>

        {/* SUMMARY */}

        <section className="mt-6 rounded-3xl border border-white/[0.08] bg-white/[0.018] p-6">

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

            <div className="max-w-2xl">

              <p className="text-[9px] uppercase tracking-[0.18em] text-white/20">
                Current route
              </p>

              <h2 className="mt-2 text-xl font-medium text-white/80">
                {origin &&
                destination
                  ? `${origin.label} → ${destination.label}`
                  : "Belum ada rute yang dipilih"}
              </h2>

              <p className="mt-3 text-xs leading-6 text-white/25">

                {origin &&
                destination
                  ? `Menggunakan ${selectedTransport.label}. ${selectedTransport.description}`
                  : "Pilih titik awal dan titik tujuan untuk melihat ringkasan rute."}

              </p>

            </div>

            {route && (
              <div className="rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.025] px-5 py-4 lg:min-w-[230px]">

                <p className="text-[9px] uppercase tracking-[0.16em] text-emerald-300/55">
                  Route status
                </p>

                <p className="mt-2 text-sm font-medium text-emerald-200">
                  Route calculated
                </p>

                <p className="mt-1 text-[10px] text-white/25">
                  Fastest available road route
                </p>

              </div>
            )}

          </div>

        </section>

        {/* NOTE */}

        <div className="mt-6 max-w-3xl text-[10px] leading-5 text-white/18">

          <p>
            Pencarian lokasi menggunakan
            Geoapify dengan data
            OpenStreetMap. Routing jalan
            menggunakan OpenRouteService.
          </p>

          <p className="mt-2">
            Faktor emisi pada prototype
            ini masih berupa nilai awal
            untuk pengembangan sistem.
            Sebelum digunakan sebagai
            hasil resmi kompetisi,
            faktor emisi akan kita
            standarkan berdasarkan sumber
            data yang terdokumentasi.
          </p>

          <p className="mt-2">
            Routing kereta, pesawat,
            ferry, speedboat, dan kapal
            akan menggunakan pendekatan
            multimoda tersendiri agar
            ARVENA tidak menganggap semua
            perjalanan sebagai jaringan
            jalan raya.
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
          Pilih di peta
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
            Mencari lokasi...
          </p>
        )}

        {!loading &&
          noResults &&
          value.trim()
            .length >=
            3 && (
            <p className="pt-2 text-[10px] text-white/25">
              Lokasi belum ditemukan.
              Coba nama tempat,
              jalan, atau area lain.
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
    <div className="absolute left-0 right-0 top-[72px] z-50 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#09130f] shadow-[0_25px_70px_rgba(0,0,0,0.55)]">

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
            className="block w-full border-b border-white/[0.05] px-4 py-3 text-left transition last:border-b-0 hover:bg-emerald-300/[0.04]"
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
  onClick,
}: {
  label: string;
  location:
    | LocationResult
    | null;
  active: boolean;
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

      <p className="text-[9px] uppercase tracking-[0.16em] text-white/20">
        {label}
      </p>

      <p className="mt-2 text-xs leading-5 text-white/55">
        {location
          ? location.label
          : "Belum dipilih"}
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