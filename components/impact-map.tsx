"use client";

import L from "leaflet";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import {
  useEffect,
  useMemo,
} from "react";

import "leaflet/dist/leaflet.css";

type Coordinate = [
  number,
  number
];

type PointTarget =
  | "origin"
  | "destination";

type ImpactMapProps = {
  origin: Coordinate | null;
  destination: Coordinate | null;
  route: Coordinate[];
  originLabel: string;
  destinationLabel: string;
  activeTarget: PointTarget;
  onMapPick: (
    coordinate: Coordinate
  ) => void;
  onOriginDrag: (
    coordinate: Coordinate
  ) => void;
  onDestinationDrag: (
    coordinate: Coordinate
  ) => void;
};

const originIcon =
  L.divIcon({
    className:
      "arvena-map-marker",
    html: `
      <div style="
        width: 20px;
        height: 20px;
        border-radius: 9999px;
        background: #34d399;
        border: 3px solid #092328;
        box-shadow:
          0 0 0 4px rgba(52,211,153,0.18),
          0 8px 24px rgba(0,0,0,0.35);
      "></div>
    `,
    iconSize: [
      20,
      20,
    ],
    iconAnchor: [
      10,
      10,
    ],
  });

const destinationIcon =
  L.divIcon({
    className:
      "arvena-map-marker",
    html: `
      <div style="
        width: 20px;
        height: 20px;
        border-radius: 9999px;
        background: #a7f3d0;
        border: 3px solid #06120e;
        box-shadow:
          0 0 0 4px rgba(167,243,208,0.16),
          0 8px 24px rgba(0,0,0,0.35);
      "></div>
    `,
    iconSize: [
      20,
      20,
    ],
    iconAnchor: [
      10,
      10,
    ],
  });

function MapClickHandler({
  onMapPick,
}: {
  activeTarget: PointTarget;
  onMapPick: (
    coordinate: Coordinate
  ) => void;
}) {
  useMapEvents({
    click(event) {
      onMapPick([
        event.latlng.lat,
        event.latlng.lng,
      ]);
    },
  });

  return null;
}

function FitRoute({
  origin,
  destination,
  route,
}: {
  origin: Coordinate | null;
  destination: Coordinate | null;
  route: Coordinate[];
}) {
  const map =
    useMapEvents({});

  useEffect(() => {
    if (
      route.length >= 2
    ) {
      const bounds =
        L.latLngBounds(
          route.map(
            (point) => [
              point[0],
              point[1],
            ] as [
              number,
              number
            ]
          )
        );

      map.fitBounds(
        bounds,
        {
          padding: [
            45,
            45,
          ],
          maxZoom: 16,
        }
      );

      return;
    }

    if (
      origin &&
      destination
    ) {
      const bounds =
        L.latLngBounds([
          origin,
          destination,
        ]);

      map.fitBounds(
        bounds,
        {
          padding: [
            60,
            60,
          ],
          maxZoom: 15,
        }
      );

      return;
    }

    if (origin) {
      map.setView(
        origin,
        15,
        {
          animate: true,
        }
      );

      return;
    }

    if (destination) {
      map.setView(
        destination,
        15,
        {
          animate: true,
        }
      );
    }
  }, [
    map,
    origin,
    destination,
    route,
  ]);

  return null;
}

export default function ImpactMap({
  origin,
  destination,
  route,
  originLabel,
  destinationLabel,
  activeTarget,
  onMapPick,
  onOriginDrag,
  onDestinationDrag,
}: ImpactMapProps) {
  const defaultCenter =
    useMemo<
      Coordinate
    >(
      () => [
        -6.9932,
        110.4203,
      ],
      []
    );

  return (
    <div className="relative isolate z-0 h-[520px] w-full overflow-hidden rounded-3xl border border-white/[0.08] bg-[#092328]">

      <MapContainer
        center={
          defaultCenter
        }
        zoom={12}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler
          activeTarget={
            activeTarget
          }
          onMapPick={
            onMapPick
          }
        />

        <FitRoute
          origin={origin}
          destination={
            destination
          }
          route={route}
        />

        {origin && (
          <Marker
            position={origin}
            icon={originIcon}
            draggable
            eventHandlers={{
              dragend: (
                event
              ) => {
                const marker =
                  event.target as L.Marker;

                const position =
                  marker.getLatLng();

                onOriginDrag([
                  position.lat,
                  position.lng,
                ]);
              },
            }}
          >
            <Popup>
              <div className="text-sm">
                <strong>
                  Origin
                </strong>
                <br />
                {originLabel}
              </div>
            </Popup>
          </Marker>
        )}

        {destination && (
          <Marker
            position={
              destination
            }
            icon={
              destinationIcon
            }
            draggable
            eventHandlers={{
              dragend: (
                event
              ) => {
                const marker =
                  event.target as L.Marker;

                const position =
                  marker.getLatLng();

                onDestinationDrag([
                  position.lat,
                  position.lng,
                ]);
              },
            }}
          >
            <Popup>
              <div className="text-sm">
                <strong>
                  Destination
                </strong>
                <br />
                {destinationLabel}
              </div>
            </Popup>
          </Marker>
        )}

        {route.length >=
          2 && (
          <Polyline
            positions={route}
            pathOptions={{
              color:
                "#34d399",
              weight: 5,
              opacity: 0.9,
              lineCap:
                "round",
              lineJoin:
                "round",
            }}
          />
        )}
      </MapContainer>

      {/* =====================================================
          MAP STATUS
      ===================================================== */}

      <div className="pointer-events-none absolute left-4 top-4 z-[500] rounded-xl border border-white/10 bg-[#092328]/85 px-3 py-2 backdrop-blur-md">

        <p className="text-[9px] uppercase tracking-[0.16em] text-emerald-300/65">
          {activeTarget ===
          "origin"
            ? "Selecting origin"
            : "Selecting destination"}
        </p>

        <p className="mt-1 text-[10px] text-white/35">
          Klik map untuk memilih titik
        </p>

      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 z-[500] rounded-xl border border-white/10 bg-[#092328]/85 px-3 py-2 text-[9px] text-white/30 backdrop-blur-md">
        © OpenStreetMap contributors
      </div>
    </div>
  );
}