import { NextResponse } from "next/server";

/* =========================================================
   TYPES
   ========================================================= */

type Coordinate = [number, number];

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

type SearchResult = {
  id: string;
  label: string;
  lat: number;
  lon: number;
  source?: string;
  category?: string;
};

type GeoapifyFeature = {
  type?: string;

  properties?: {
    place_id?: string;
    placeId?: string;

    name?: string;
    formatted?: string;

    address_line1?: string;
    address_line2?: string;

    street?: string;
    housenumber?: string;

    city?: string;
    state?: string;
    country?: string;

    lon?: number | string;
    lat?: number | string;

    category?: string;

    categories?: string[];

    datasource?: {
      sourcename?: string;
    };

    rank?: {
      importance?: number;
      popularity?: number;
      confidence?: number;
    };
  };

  geometry?: {
    type?: string;
    coordinates?: unknown;
  };
};

type GeoapifyResponse = {
  type?: string;
  features?: GeoapifyFeature[];
};

type NominatimResult = {
  osm_type?: string;
  osm_id?: string | number;

  display_name?: string;

  lat?: string | number;
  lon?: string | number;

  type?: string;
  category?: string;

  name?: string;

  address?: {
    road?: string;
    house_number?: string;

    city?: string;
    town?: string;
    village?: string;

    suburb?: string;
    neighbourhood?: string;

    state?: string;
    country?: string;
  };
};

type RouteResponse = {
  distanceKm: number;
  durationMinutes: number;
  geometry: Coordinate[];
};

/* =========================================================
   CONSTANTS
   ========================================================= */

/*
 * Default bias kita arahkan ke area Tembalang / UNDIP.
 *
 * Ini sangat membantu ketika user mengetik:
 *
 * KFC
 * Burjo Idaman
 * Kos Pak Frans
 * restoran
 * kampus
 *
 * tanpa menuliskan "Semarang".
 */

const DEFAULT_SEARCH_LON = 110.4401071;
const DEFAULT_SEARCH_LAT = -7.0483698;

const DEFAULT_SEARCH_RADIUS = 7000;

/* =========================================================
   API KEYS
   ========================================================= */

function getGeoapifyApiKey(): string {
  const apiKey =
    process.env.GEOAPIFY_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GEOAPIFY_API_KEY belum tersedia di .env.local."
    );
  }

  return apiKey;
}

/* =========================================================
   TEXT NORMALIZATION
   ========================================================= */

function normalizeText(
  value: string
): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /[^a-z0-9\s]/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

function tokenize(
  value: string
): string[] {
  return normalizeText(
    value
  )
    .split(/\s+/)
    .filter(
      (
        word: string
      ) =>
        word.length > 0
    );
}

function containsAllWords(
  text: string,
  query: string
): boolean {
  const normalizedText =
    normalizeText(text);

  const words =
    tokenize(query);

  if (
    words.length === 0
  ) {
    return false;
  }

  return words.every(
    (
      word: string
    ) =>
      normalizedText.includes(
        word
      )
  );
}

/* =========================================================
   TRANSPORT
   ========================================================= */

function getRouteProfile(
  transport: TransportType
): string {
  if (
    transport ===
    "jalan-kaki"
  ) {
    return "foot-walking";
  }

  if (
    transport ===
      "truk-diesel" ||
    transport ===
      "truk-electric" ||
    transport ===
      "bus-diesel" ||
    transport ===
      "bus-electric"
  ) {
    return "driving-hgv";
  }

  return "driving-car";
}

function getRouteOptions(
  transport: TransportType
):
  | {
      avoid_features: string[];
    }
  | undefined {
  if (
    transport.startsWith(
      "motor-"
    )
  ) {
    return {
      avoid_features: [
        "tollways",
      ],
    };
  }

  return undefined;
}

function isRoadTransport(
  transport: TransportType
): boolean {
  return (
    transport ===
      "jalan-kaki" ||
    transport.startsWith(
      "motor-"
    ) ||
    transport.startsWith(
      "mobil-"
    ) ||
    transport.startsWith(
      "truk-"
    ) ||
    transport.startsWith(
      "bus-"
    )
  );
}

/* =========================================================
   GEOAPIFY HELPERS
   ========================================================= */

function getGeoapifyCoordinates(
  feature: GeoapifyFeature
): {
  lat: number;
  lon: number;
} | null {
  const properties =
    feature?.properties;

  let lon =
    Number(
      properties?.lon
    );

  let lat =
    Number(
      properties?.lat
    );

  /*
   * Kalau properties tidak memiliki
   * koordinat, ambil dari geometry.
   *
   * GeoJSON:
   * [longitude, latitude]
   */

  if (
    !Number.isFinite(
      lat
    ) ||
    !Number.isFinite(
      lon
    )
  ) {
    const coordinates =
      feature
        ?.geometry
        ?.coordinates;

    if (
      Array.isArray(
        coordinates
      ) &&
      coordinates.length >=
        2
    ) {
      lon =
        Number(
          coordinates[0]
        );

      lat =
        Number(
          coordinates[1]
        );
    }
  }

  if (
    !Number.isFinite(
      lat
    ) ||
    !Number.isFinite(
      lon
    )
  ) {
    return null;
  }

  return {
    lat,
    lon,
  };
}

function buildGeoapifyLabel(
  feature: GeoapifyFeature
): string {
  const properties =
    feature?.properties;

  /*
   * formatted biasanya merupakan
   * label paling lengkap.
   */

  if (
    typeof properties
      ?.formatted ===
      "string" &&
    properties.formatted.trim()
      .length > 0
  ) {
    return properties.formatted.trim();
  }

  const name =
    String(
      properties?.name ??
        ""
    ).trim();

  const addressLine1 =
    String(
      properties
        ?.address_line1 ??
        ""
    ).trim();

  const addressLine2 =
    String(
      properties
        ?.address_line2 ??
        ""
    ).trim();

  const parts = [
    name,
    addressLine1,
    addressLine2,
  ].filter(
    (
      value: string
    ) =>
      value.length > 0
  );

  if (
    parts.length > 0
  ) {
    return parts.join(
      ", "
    );
  }

  return "Lokasi tidak dikenal";
}

/* =========================================================
   GEOAPIFY GEOCODING
   ========================================================= */

async function searchGeoapifyGeocoding(
  query: string
): Promise<SearchResult[]> {
  const apiKey =
    getGeoapifyApiKey();

  const url =
    new URL(
      "https://api.geoapify.com/v1/geocode/search"
    );

  url.searchParams.set(
    "text",
    query
  );

  url.searchParams.set(
    "format",
    "json"
  );

  url.searchParams.set(
    "limit",
    "8"
  );

  url.searchParams.set(
    "filter",
    "countrycode:id"
  );

  /*
   * Prioritaskan Semarang.
   *
   * Geoapify mendukung bias proximity
   * untuk memprioritaskan hasil dekat
   * titik tertentu.
   */

  url.searchParams.set(
    "bias",
    `proximity:${DEFAULT_SEARCH_LON},${DEFAULT_SEARCH_LAT}`
  );

  url.searchParams.set(
    "lang",
    "id"
  );

  url.searchParams.set(
    "apiKey",
    apiKey
  );

  const response =
    await fetch(
      url.toString(),
      {
        method: "GET",

        headers: {
          Accept:
            "application/json",
        },

        cache:
          "no-store",
      }
    );

  if (
    !response.ok
  ) {
    const errorText =
      await response.text();

    console.error(
      "GEOAPIFY GEOCODING ERROR:",
      response.status,
      errorText
    );

    throw new Error(
      "Geoapify geocoding gagal."
    );
  }

  const data =
    (await response.json()) as GeoapifyResponse;

  const features =
    Array.isArray(
      data?.features
    )
      ? data.features
      : [];

  return features
    .map(
      (
        feature: GeoapifyFeature
      ): SearchResult | null => {
        const coordinates =
          getGeoapifyCoordinates(
            feature
          );

        if (
          !coordinates
        ) {
          return null;
        }

        const properties =
          feature?.properties;

        const category =
          String(
            properties?.category ??
              properties
                ?.categories?.[0] ??
              "geocoding"
          );

        const id =
          String(
            properties
              ?.place_id ??
              `${coordinates.lat}-${coordinates.lon}`
          );

        return {
          id,

          label:
            buildGeoapifyLabel(
              feature
            ),

          lat:
            coordinates.lat,

          lon:
            coordinates.lon,

          source:
            "geoapify-geocoding",

          category,
        };
      }
    )
    .filter(
      (
        item:
          | SearchResult
          | null
      ): item is SearchResult =>
        item !== null
    );
}

/* =========================================================
   GEOAPIFY NAME SEARCH
   ========================================================= */

/*
 * Ini bukan Places API langsung.
 *
 * Kita menggunakan parameter "name"
 * pada Geocoding API.
 *
 * Ini berguna untuk POI yang mempunyai
 * nama resmi di data OpenStreetMap.
 */

async function searchGeoapifyByName(
  query: string
): Promise<SearchResult[]> {
  const apiKey =
    getGeoapifyApiKey();

  const variants = [
    {
      name: query,
      city: "Semarang",
      country: "Indonesia",
    },

    {
      name: query,
      state: "Jawa Tengah",
      country: "Indonesia",
    },

    {
      name: query,
      country: "Indonesia",
    },
  ];

  const allResults: SearchResult[] =
    [];

  for (
    const variant of variants
  ) {
    try {
      const url =
        new URL(
          "https://api.geoapify.com/v1/geocode/search"
        );

      url.searchParams.set(
        "name",
        variant.name
      );

      if (
        variant.city
      ) {
        url.searchParams.set(
          "city",
          variant.city
        );
      }

      if (
        variant.state
      ) {
        url.searchParams.set(
          "state",
          variant.state
        );
      }

      url.searchParams.set(
        "country",
        variant.country
      );

      url.searchParams.set(
        "format",
        "json"
      );

      url.searchParams.set(
        "limit",
        "8"
      );

      url.searchParams.set(
        "filter",
        "countrycode:id"
      );

      url.searchParams.set(
        "bias",
        `proximity:${DEFAULT_SEARCH_LON},${DEFAULT_SEARCH_LAT}`
      );

      url.searchParams.set(
        "lang",
        "id"
      );

      url.searchParams.set(
        "apiKey",
        apiKey
      );

      const response =
        await fetch(
          url.toString(),
          {
            method: "GET",

            headers: {
              Accept:
                "application/json",
            },

            cache:
              "no-store",
          }
        );

      if (
        !response.ok
      ) {
        continue;
      }

      const data =
        (await response.json()) as GeoapifyResponse;

      const features =
        Array.isArray(
          data?.features
        )
          ? data.features
          : [];

      const results =
        features
          .map(
            (
              feature: GeoapifyFeature
            ): SearchResult | null => {
              const coordinates =
                getGeoapifyCoordinates(
                  feature
                );

              if (
                !coordinates
              ) {
                return null;
              }

              const properties =
                feature?.properties;

              const category =
                String(
                  properties
                    ?.category ??
                    properties
                      ?.categories?.[0] ??
                    "poi"
                );

              return {
                id:
                  String(
                    properties
                      ?.place_id ??
                      `${coordinates.lat}-${coordinates.lon}`
                  ),

                label:
                  buildGeoapifyLabel(
                    feature
                  ),

                lat:
                  coordinates.lat,

                lon:
                  coordinates.lon,

                source:
                  "geoapify-name",

                category,
              };
            }
          )
          .filter(
            (
              item:
                | SearchResult
                | null
            ): item is SearchResult =>
              item !== null
          );

      allResults.push(
        ...results
      );
    } catch (
      error
    ) {
      console.error(
        "GEOAPIFY NAME SEARCH ERROR:",
        error
      );
    }
  }

  return allResults;
}

/* =========================================================
   GEOAPIFY PLACES
   ========================================================= */

/*
 * Places API membutuhkan area pencarian.
 *
 * Jadi pipeline kita:
 *
 * query
 *   ↓
 * cari seed coordinate
 *   ↓
 * Places API di sekitar seed
 *   ↓
 * fuzzy matching nama
 *
 * Ini membuat query seperti:
 *
 * "KFC Tirto Agung"
 * "Kos Pak Frans"
 * "Burjo Idaman"
 *
 * bisa mendapatkan POI yang dekat
 * dengan area yang dimaksud.
 */

async function searchGeoapifyPlacesAround(
  centerLat: number,
  centerLon: number,
  query: string
): Promise<SearchResult[]> {
  const apiKey =
    getGeoapifyApiKey();

  /*
   * Kategori dibuat cukup luas.
   *
   * Jangan hanya "restaurant",
   * karena Kos Pak Frans adalah
   * accommodation.
   *
   * Jangan hanya accommodation,
   * karena KFC/Burjo adalah catering.
   */

  const categories =
    [
      "accommodation",
      "catering",
      "commercial",
      "tourism",
      "education",
      "building",
    ].join(",");

  const url =
    new URL(
      "https://api.geoapify.com/v2/places"
    );

  url.searchParams.set(
    "categories",
    categories
  );

  url.searchParams.set(
    "filter",
    `circle:${centerLon},${centerLat},${DEFAULT_SEARCH_RADIUS}`
  );

  url.searchParams.set(
    "bias",
    `proximity:${centerLon},${centerLat}`
  );

  url.searchParams.set(
    "limit",
    "100"
  );

  url.searchParams.set(
    "lang",
    "id"
  );

  url.searchParams.set(
    "apiKey",
    apiKey
  );

  try {
    const response =
      await fetch(
        url.toString(),
        {
          method: "GET",

          headers: {
            Accept:
              "application/json",
          },

          cache:
            "no-store",
        }
      );

    if (
      !response.ok
    ) {
      const errorText =
        await response.text();

      console.error(
        "GEOAPIFY PLACES ERROR:",
        response.status,
        errorText
      );

      return [];
    }

    const data =
      (await response.json()) as GeoapifyResponse;

    const features =
      Array.isArray(
        data?.features
      )
        ? data.features
        : [];

    return features
      .map(
        (
          feature: GeoapifyFeature
        ): SearchResult | null => {
          const coordinates =
            getGeoapifyCoordinates(
              feature
            );

          if (
            !coordinates
          ) {
            return null;
          }

          const properties =
            feature?.properties;

          const name =
            String(
              properties?.name ??
                ""
            ).trim();

          const formatted =
            String(
              properties
                ?.formatted ??
                ""
            ).trim();

          const label =
            name.length > 0
              ? (
                  formatted
                    .length > 0
                    ? formatted
                    : name
                )
              : buildGeoapifyLabel(
                  feature
                );

          const categoriesList =
            Array.isArray(
              properties
                ?.categories
            )
              ? properties.categories
              : [];

          const category =
            String(
              properties?.category ??
                categoriesList[0] ??
                "poi"
            );

          const id =
            String(
              properties
                ?.place_id ??
                `${coordinates.lat}-${coordinates.lon}`
            );

          return {
            id,

            label,

            lat:
              coordinates.lat,

            lon:
              coordinates.lon,

            source:
              "geoapify-places",

            category,
          };
        }
      )
      .filter(
        (
          item:
            | SearchResult
            | null
        ): item is SearchResult =>
          item !== null
      );
  } catch (
    error
  ) {
    console.error(
      "GEOAPIFY PLACES REQUEST ERROR:",
      error
    );

    return [];
  }
}

/* =========================================================
   NOMINATIM SEARCH
   ========================================================= */

async function searchPlacesNominatim(
  query: string
): Promise<SearchResult[]> {
  const url =
    new URL(
      "https://nominatim.openstreetmap.org/search"
    );

  url.searchParams.set(
    "q",
    `${query}, Semarang, Indonesia`
  );

  url.searchParams.set(
    "format",
    "jsonv2"
  );

  url.searchParams.set(
    "addressdetails",
    "1"
  );

  url.searchParams.set(
    "limit",
    "8"
  );

  url.searchParams.set(
    "countrycodes",
    "id"
  );

  const response =
    await fetch(
      url.toString(),
      {
        method: "GET",

        headers: {
          Accept:
            "application/json",

          "User-Agent":
            "ARVENA-Impact-Prototype/1.0",
        },

        cache:
          "no-store",
      }
    );

  if (
    !response.ok
  ) {
    const errorText =
      await response.text();

    console.error(
      "NOMINATIM ERROR:",
      errorText
    );

    return [];
  }

  const data =
    await response.json();

  if (
    !Array.isArray(
      data
    )
  ) {
    return [];
  }

  const results =
    data as NominatimResult[];

  return results
    .map(
      (
        item: NominatimResult
      ): SearchResult | null => {
        const lat =
          Number(
            item?.lat
          );

        const lon =
          Number(
            item?.lon
          );

        if (
          !Number.isFinite(
            lat
          ) ||
          !Number.isFinite(
            lon
          )
        ) {
          return null;
        }

        const name =
          String(
            item?.name ??
              ""
          ).trim();

        const label =
          String(
            item?.display_name ??
              name ??
              "Lokasi tidak dikenal"
          );

        return {
          id:
            `${String(
              item?.osm_type ??
                "nominatim"
            )}-${String(
              item?.osm_id ??
                `${lat}-${lon}`
            )}`,

          label,

          lat,

          lon,

          source:
            "nominatim",

          category:
            String(
              item?.category ??
                item?.type ??
                "poi"
            ),
        };
      }
    )
    .filter(
      (
        item:
          | SearchResult
          | null
      ): item is SearchResult =>
        item !== null
    );
}

/* =========================================================
   DISTANCE
   ========================================================= */

function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const earthRadiusKm =
    6371;

  const dLat =
    (
      (lat2 -
        lat1) *
      Math.PI
    ) /
    180;

  const dLon =
    (
      (lon2 -
        lon1) *
      Math.PI
    ) /
    180;

  const a =
    Math.sin(
      dLat / 2
    ) **
      2 +
    Math.cos(
      (lat1 *
        Math.PI) /
        180
    ) *
      Math.cos(
        (lat2 *
          Math.PI) /
          180
      ) *
      Math.sin(
        dLon / 2
      ) **
        2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(
        1 - a
      )
    );

  return (
    earthRadiusKm *
    c
  );
}

/* =========================================================
   SEARCH SCORE
   ========================================================= */

function scoreSearchResult(
  result: SearchResult,
  query: string
): number {
  const label =
    normalizeText(
      result.label
    );

  const normalizedQuery =
    normalizeText(
      query
    );

  const queryWords =
    tokenize(
      query
    );

  let score = 0;

  /* -------------------------------------------------------
     EXACT
     ------------------------------------------------------- */

  if (
    label ===
    normalizedQuery
  ) {
    score += 5000;
  }

  /* -------------------------------------------------------
     QUERY INCLUDED
     ------------------------------------------------------- */

  if (
    label.includes(
      normalizedQuery
    )
  ) {
    score += 2500;
  }

  /* -------------------------------------------------------
     ALL WORDS
     ------------------------------------------------------- */

  if (
    containsAllWords(
      label,
      query
    )
  ) {
    score += 1800;
  }

  /* -------------------------------------------------------
     WORD MATCH
     ------------------------------------------------------- */

  for (
    const word of queryWords
  ) {
    if (
      label.includes(
        word
      )
    ) {
      score += 300;
    }

    if (
      label.startsWith(
        word
      )
    ) {
      score += 100;
    }
  }

  /* -------------------------------------------------------
     IMPORTANT POI KEYWORDS
     ------------------------------------------------------- */

  const queryNormalized =
    normalizedQuery;

  const category =
    normalizeText(
      result.category ??
        ""
    );

  const source =
    normalizeText(
      result.source ??
        ""
    );

  /*
   * Kalau user mencari kos,
   * prioritaskan accommodation.
   */

  if (
    queryNormalized.includes(
      "kos"
    ) ||
    queryNormalized.includes(
      "kost"
    )
  ) {
    if (
      category.includes(
        "accommodation"
      ) ||
      category.includes(
        "hostel"
      ) ||
      category.includes(
        "guest"
      ) ||
      category.includes(
        "apartment"
      )
    ) {
      score += 1500;
    }
  }

  /*
   * Kalau user mencari KFC,
   * restoran/catering diprioritaskan.
   */

  if (
    queryNormalized.includes(
      "kfc"
    ) ||
    queryNormalized.includes(
      "burjo"
    ) ||
    queryNormalized.includes(
      "restoran"
    ) ||
    queryNormalized.includes(
      "warung"
    ) ||
    queryNormalized.includes(
      "cafe"
    )
  ) {
    if (
      category.includes(
        "catering"
      ) ||
      category.includes(
        "restaurant"
      ) ||
      category.includes(
        "fast_food"
      ) ||
      category.includes(
        "cafe"
      )
    ) {
      score += 1500;
    }
  }

  /*
   * Geoapify Places diprioritaskan
   * dibanding hasil fallback.
   */

  if (
    source ===
    "geoapify-places"
  ) {
    score += 500;
  }

  if (
    source ===
    "geoapify-name"
  ) {
    score += 400;
  }

  if (
    source ===
    "geoapify-geocoding"
  ) {
    score += 300;
  }

  /*
   * Kedekatan dengan Tembalang.
   */

  const distance =
    calculateDistanceKm(
      DEFAULT_SEARCH_LAT,
      DEFAULT_SEARCH_LON,
      result.lat,
      result.lon
    );

  if (
    distance <= 2
  ) {
    score += 500;
  } else if (
    distance <= 5
  ) {
    score += 300;
  } else if (
    distance <= 10
  ) {
    score += 100;
  }

  return score;
}

/* =========================================================
   DEDUPLICATION
   ========================================================= */

function deduplicateResults(
  results: SearchResult[]
): SearchResult[] {
  const unique =
    new Map<
      string,
      SearchResult
    >();

  for (
    const item of results
  ) {
    const normalizedLabel =
      normalizeText(
        item.label
      );

    const key =
      [
        normalizedLabel,

        item.lat.toFixed(
          5
        ),

        item.lon.toFixed(
          5
        ),
      ].join(
        "|"
      );

    if (
      !unique.has(
        key
      )
    ) {
      unique.set(
        key,
        item
      );
    }
  }

  return Array.from(
    unique.values()
  );
}

/* =========================================================
   SEED SEARCH
   ========================================================= */

/*
 * Untuk Places API kita butuh
 * koordinat pusat pencarian.
 *
 * Kita mencoba:
 *
 * 1. Geoapify name
 * 2. Geoapify geocoding
 * 3. Nominatim
 * 4. fallback Tembalang
 */

async function findSearchSeed(
  query: string
): Promise<{
  lat: number;
  lon: number;
}> {
  try {
    const nameResults =
      await searchGeoapifyByName(
        query
      );

    if (
      nameResults.length > 0
    ) {
      const best =
        nameResults.sort(
          (
            a: SearchResult,
            b: SearchResult
          ) =>
            scoreSearchResult(
              b,
              query
            ) -
            scoreSearchResult(
              a,
              query
            )
        )[0];

      if (
        best
      ) {
        return {
          lat:
            best.lat,

          lon:
            best.lon,
        };
      }
    }
  } catch (
    error
  ) {
    console.error(
      "SEED NAME SEARCH ERROR:",
      error
    );
  }

  try {
    const geocodeResults =
      await searchGeoapifyGeocoding(
        query
      );

    if (
      geocodeResults.length >
      0
    ) {
      const best =
        geocodeResults.sort(
          (
            a: SearchResult,
            b: SearchResult
          ) =>
            scoreSearchResult(
              b,
              query
            ) -
            scoreSearchResult(
              a,
              query
            )
        )[0];

      if (
        best
      ) {
        return {
          lat:
            best.lat,

          lon:
            best.lon,
        };
      }
    }
  } catch (
    error
  ) {
    console.error(
      "SEED GEOAPIFY SEARCH ERROR:",
      error
    );
  }

  try {
    const nominatimResults =
      await searchPlacesNominatim(
        query
      );

    if (
      nominatimResults.length >
      0
    ) {
      const best =
        nominatimResults.sort(
          (
            a: SearchResult,
            b: SearchResult
          ) =>
            scoreSearchResult(
              b,
              query
            ) -
            scoreSearchResult(
              a,
              query
            )
        )[0];

      if (
        best
      ) {
        return {
          lat:
            best.lat,

          lon:
            best.lon,
        };
      }
    }
  } catch (
    error
  ) {
    console.error(
      "SEED NOMINATIM SEARCH ERROR:",
      error
    );
  }

  /*
   * Jangan pernah membuat search
   * gagal hanya karena seed tidak ditemukan.
   *
   * Kita tetap cari POI di area default
   * Tembalang.
   */

  return {
    lat:
      DEFAULT_SEARCH_LAT,

    lon:
      DEFAULT_SEARCH_LON,
  };
}

/* =========================================================
   COMBINED SEARCH
   ========================================================= */

async function searchPlaces(
  query: string
): Promise<SearchResult[]> {
  /*
   * Jalankan dua sumber utama
   * terlebih dahulu.
   */

  const [
    geoNameResult,
    geoCodeResult,
  ] =
    await Promise.allSettled([
      searchGeoapifyByName(
        query
      ),

      searchGeoapifyGeocoding(
        query
      ),
    ]);

  const geoNameResults: SearchResult[] =
    geoNameResult.status ===
    "fulfilled"
      ? geoNameResult.value
      : [];

  const geoCodeResults: SearchResult[] =
    geoCodeResult.status ===
    "fulfilled"
      ? geoCodeResult.value
      : [];

  if (
    geoNameResult.status ===
    "rejected"
  ) {
    console.error(
      "GEOAPIFY NAME SEARCH FAILED:",
      geoNameResult.reason
    );
  }

  if (
    geoCodeResult.status ===
    "rejected"
  ) {
    console.error(
      "GEOAPIFY GEOCODING FAILED:",
      geoCodeResult.reason
    );
  }

  /*
   * Cari seed.
   *
   * Kalau query berupa:
   *
   * "KFC Tirto Agung"
   *
   * seed idealnya sekitar Tirto Agung.
   *
   * Kalau query:
   *
   * "Kos Pak Frans"
   *
   * seed idealnya dekat Kos Pak Frans
   * jika geocoder mengenal namanya.
   */

  const seed =
    await findSearchSeed(
      query
    );

  /*
   * Setelah punya seed,
   * cari POI di sekitar seed.
   */

  const placesResults =
    await searchGeoapifyPlacesAround(
      seed.lat,
      seed.lon,
      query
    );

  /*
   * Nominatim kita jadikan fallback.
   */

  let nominatimResults:
    SearchResult[] = [];

  /*
   * Tidak perlu selalu memanggil Nominatim
   * jika Geoapify sudah memberikan banyak
   * hasil yang relevan.
   */

  const preliminary =
    deduplicateResults([
      ...geoNameResults,
      ...geoCodeResults,
      ...placesResults,
    ]);

  const preliminaryRelevant =
    preliminary.filter(
      (
        item: SearchResult
      ) =>
        scoreSearchResult(
          item,
          query
        ) > 500
    );

  if (
    preliminaryRelevant.length <
    3
  ) {
    try {
      nominatimResults =
        await searchPlacesNominatim(
          query
        );
    } catch (
      error
    ) {
      console.error(
        "NOMINATIM FALLBACK ERROR:",
        error
      );
    }
  }

  /*
   * Gabungkan semuanya.
   */

  const combined =
    deduplicateResults([
      ...geoNameResults,
      ...geoCodeResults,
      ...placesResults,
      ...nominatimResults,
    ]);

  /*
   * Ranking akhir.
   */

  const ranked =
    combined
      .map(
        (
          item: SearchResult
        ) => ({
          item,

          score:
            scoreSearchResult(
              item,
              query
            ),
        })
      )
      .sort(
        (
          a: {
            item: SearchResult;
            score: number;
          },
          b: {
            item: SearchResult;
            score: number;
          }
        ) =>
          b.score -
          a.score
      )
      .map(
        (
          entry: {
            item: SearchResult;
            score: number;
          }
        ) =>
          entry.item
      );

  /*
   * Hanya kembalikan hasil yang
   * masuk akal.
   *
   * Jangan memaksa hasil random
   * hanya supaya array tidak kosong.
   */

  const relevant =
    ranked.filter(
      (
        item: SearchResult
      ) =>
        scoreSearchResult(
          item,
          query
        ) >= 100
    );

  return relevant
    .slice(
      0,
      8
    );
}

/* =========================================================
   GEOAPIFY REVERSE
   ========================================================= */

async function reverseGeocodeGeoapify(
  lat: number,
  lon: number
): Promise<SearchResult | null> {
  try {
    const apiKey =
      getGeoapifyApiKey();

    const url =
      new URL(
        "https://api.geoapify.com/v1/geocode/reverse"
      );

    url.searchParams.set(
      "lat",
      String(lat)
    );

    url.searchParams.set(
      "lon",
      String(lon)
    );

    url.searchParams.set(
      "format",
      "json"
    );

    url.searchParams.set(
      "limit",
      "1"
    );

    url.searchParams.set(
      "lang",
      "id"
    );

    url.searchParams.set(
      "apiKey",
      apiKey
    );

    const response =
      await fetch(
        url.toString(),
        {
          method: "GET",

          headers: {
            Accept:
              "application/json",
          },

          cache:
            "no-store",
        }
      );

    if (
      !response.ok
    ) {
      return null;
    }

    const data =
      (await response.json()) as GeoapifyResponse;

    const feature =
      Array.isArray(
        data?.features
      )
        ? data.features[0]
        : null;

    if (
      !feature
    ) {
      return null;
    }

    return {
      id:
        String(
          feature
            ?.properties
            ?.place_id ??
            `${lat}-${lon}`
        ),

      label:
        buildGeoapifyLabel(
          feature
        ),

      lat,

      lon,

      source:
        "geoapify-reverse",

      category:
        String(
          feature
            ?.properties
            ?.category ??
            "location"
        ),
    };
  } catch (
    error
  ) {
    console.error(
      "GEOAPIFY REVERSE ERROR:",
      error
    );

    return null;
  }
}

/* =========================================================
   REVERSE GEOCODING FALLBACK
   ========================================================= */

async function reverseGeocode(
  lat: number,
  lon: number
): Promise<SearchResult> {
  /*
   * Geoapify dulu.
   */

  const geoapifyResult =
    await reverseGeocodeGeoapify(
      lat,
      lon
    );

  if (
    geoapifyResult
  ) {
    return geoapifyResult;
  }

  /*
   * Nominatim fallback.
   */

  try {
    const url =
      new URL(
        "https://nominatim.openstreetmap.org/reverse"
      );

    url.searchParams.set(
      "lat",
      String(lat)
    );

    url.searchParams.set(
      "lon",
      String(lon)
    );

    url.searchParams.set(
      "format",
      "jsonv2"
    );

    url.searchParams.set(
      "zoom",
      "18"
    );

    const response =
      await fetch(
        url.toString(),
        {
          method: "GET",

          headers: {
            Accept:
              "application/json",

            "User-Agent":
              "ARVENA-Impact-Prototype/1.0",
          },

          cache:
            "no-store",
        }
      );

    if (
      response.ok
    ) {
      const data =
        (await response.json()) as NominatimResult;

      return {
        id:
          `${String(
            data?.osm_type ??
              "nominatim"
          )}-${String(
            data?.osm_id ??
              `${lat}-${lon}`
          )}`,

        label:
          String(
            data?.display_name ??
              `${lat.toFixed(
                5
              )}, ${lon.toFixed(
                5
              )}`
          ),

        lat,

        lon,

        source:
          "nominatim-reverse",

        category:
          String(
            data?.type ??
              "location"
          ),
      };
    }
  } catch (
    error
  ) {
    console.error(
      "NOMINATIM REVERSE ERROR:",
      error
    );
  }

  return {
    id:
      `${lat}-${lon}`,

    label:
      `${lat.toFixed(
        5
      )}, ${lon.toFixed(
        5
      )}`,

    lat,

    lon,

    source:
      "coordinate",

    category:
      "location",
  };
}

/* =========================================================
   ROUTING
   ========================================================= */

/*
 * Geoapify Routing API dipakai sebagai engine routing utama.
 *
 * Kenapa:
 * - Tidak semua kendaraan cocok dipaksa memakai profile ORS yang sama.
 * - Geoapify punya mode khusus untuk:
 *     motorcycle
 *     scooter
 *     drive
 *     truck
 *     bus
 *     walk
 * - Route dihitung berdasarkan jaringan jalan yang sesuai mode kendaraan.
 *
 * Catatan:
 * Kendaraan listrik / hybrid tetap menggunakan jaringan jalan yang
 * sama dengan kendaraan fisiknya:
 *   motor-electric -> motorcycle
 *   mobil-electric -> drive
 *   mobil-hybrid   -> drive
 *   truk-electric  -> truck
 *   bus-electric   -> bus
 *
 * Perbedaan bahan bakar tidak mengubah geometri jalan.
 */

type GeoapifyRouteFeature = {
  type?: string;

  properties?: {
    distance?: number;
    time?: number;
    mode?: string;
  };

  geometry?: {
    type?: string;
    coordinates?: unknown;
  };
};

type GeoapifyRouteResponse = {
  type?: string;

  features?: GeoapifyRouteFeature[];
};

function getGeoapifyRoutingMode(
  transport: TransportType
):
  | "motorcycle"
  | "scooter"
  | "drive"
  | "truck"
  | "bus"
  | "walk"
  | null {
  switch (transport) {
    case "motor-bensin":
    case "motor-diesel":
    case "motor-electric":
      return "motorcycle";

    case "mobil-bensin":
    case "mobil-diesel":
    case "mobil-hybrid":
    case "mobil-electric":
      return "drive";

    case "truk-diesel":
    case "truk-electric":
      return "truck";

    case "bus-diesel":
    case "bus-electric":
      return "bus";

    case "jalan-kaki":
      return "walk";

    /*
     * Geoapify Routing API bukan engine untuk
     * penerbangan, kereta antarkota, kapal, atau speedboat.
     *
     * Untuk jenis tersebut frontend sebaiknya tidak mengaktifkan
     * tombol routing jalan.
     */
    case "kereta-diesel":
    case "kereta-electric":
    case "pesawat-domestik":
    case "pesawat-internasional":
    case "ferry":
    case "speedboat":
    case "kapal-diesel":
    case "kapal-electric":
      return null;

    default:
      return null;
  }
}

function flattenGeoapifyRouteCoordinates(
  coordinates: unknown
): unknown[][] {
  if (
    !Array.isArray(
      coordinates
    )
  ) {
    return [];
  }

  /*
   * LineString:
   *
   * [
   *   [lon, lat],
   *   [lon, lat]
   * ]
   */
  if (
    coordinates.length > 0 &&
    Array.isArray(
      coordinates[0]
    ) &&
    coordinates[0].length >= 2 &&
    typeof coordinates[0][0] ===
      "number"
  ) {
    return coordinates as unknown[][];
  }

  /*
   * MultiLineString:
   *
   * [
   *   [
   *     [lon, lat],
   *     [lon, lat]
   *   ],
   *   [
   *     [lon, lat],
   *     [lon, lat]
   *   ]
   * ]
   */
  const flattened: unknown[][] =
    [];

  for (
    const part of coordinates
  ) {
    if (
      !Array.isArray(
        part
      )
    ) {
      continue;
    }

    for (
      const coordinate of part
    ) {
      if (
        Array.isArray(
          coordinate
        )
      ) {
        flattened.push(
          coordinate
        );
      }
    }
  }

  return flattened;
}

function buildRouteGeometry(
  coordinates: unknown
): Coordinate[] {
  const flattened =
    flattenGeoapifyRouteCoordinates(
      coordinates
    );

  return flattened
    .map(
      (
        coordinate: unknown[]
      ): Coordinate | null => {
        if (
          coordinate.length <
          2
        ) {
          return null;
        }

        /*
         * Geoapify:
         * [longitude, latitude]
         *
         * Frontend map:
         * [latitude, longitude]
         */
        const lon =
          Number(
            coordinate[0]
          );

        const lat =
          Number(
            coordinate[1]
          );

        if (
          !Number.isFinite(
            lat
          ) ||
          !Number.isFinite(
            lon
          )
        ) {
          return null;
        }

        return [
          lat,
          lon,
        ];
      }
    )
    .filter(
      (
        point:
          | Coordinate
          | null
      ): point is Coordinate =>
        point !== null
    );
}

async function calculateRoute(
  origin: Coordinate,
  destination: Coordinate,
  transport: TransportType
): Promise<RouteResponse> {
  const mode =
    getGeoapifyRoutingMode(
      transport
    );

  if (
    !mode
  ) {
    throw new Error(
      "Routing jalan belum tersedia untuk jenis transportasi ini. Pilih motor, mobil, truk, bus, atau jalan kaki."
    );
  }

  const apiKey =
    getGeoapifyApiKey();

  /*
   * Geoapify Routing API menerima:
   *
   * waypoints=lat,lon|lat,lon
   *
   * Sedangkan request dari frontend kita simpan sebagai:
   *
   * [longitude, latitude]
   */
  const originLon =
    origin[0];

  const originLat =
    origin[1];

  const destinationLon =
    destination[0];

  const destinationLat =
    destination[1];

  const url =
    new URL(
      "https://api.geoapify.com/v1/routing"
    );

  url.searchParams.set(
    "waypoints",
    `${originLat},${originLon}|${destinationLat},${destinationLon}`
  );

  url.searchParams.set(
    "mode",
    mode
  );

  /*
   * "balanced" adalah route optimization resmi
   * Geoapify. Untuk kendaraan bermotor kita juga
   * memakai free-flow traffic agar estimasi waktunya
   * merepresentasikan kondisi tanpa kemacetan real-time.
   */
  url.searchParams.set(
    "type",
    "balanced"
  );

  url.searchParams.set(
    "traffic",
    "free_flow"
  );

  url.searchParams.set(
    "units",
    "metric"
  );

  url.searchParams.set(
    "format",
    "geojson"
  );

  url.searchParams.set(
    "apiKey",
    apiKey
  );

  /*
   * Motor tidak perlu dipaksa menghindari toll.
   *
   * Kita biarkan router memilih jalur tercepat
   * yang memang legal untuk mode motorcycle.
   */

  console.log(
    "[ARVENA ROUTING]",
    {
      transport,
      mode,
      origin,
      destination,
    }
  );

  const response =
    await fetch(
      url.toString(),
      {
        method:
          "GET",

        headers: {
          Accept:
            "application/json",
        },

        cache:
          "no-store",
      }
    );

  if (
    !response.ok
  ) {
    const errorText =
      await response.text();

    console.error(
      "GEOAPIFY ROUTING ERROR:",
      {
        status:
          response.status,
        statusText:
          response.statusText,
        body:
          errorText,
        transport,
        mode,
      }
    );

    throw new Error(
      `Routing engine gagal menghitung rute (${response.status}).`
    );
  }

  const data =
    (await response.json()) as GeoapifyRouteResponse;

  const features =
    Array.isArray(
      data?.features
    )
      ? data.features
      : [];

  const feature =
    features[0];

  if (
    !feature
  ) {
    throw new Error(
      "Rute tidak ditemukan untuk kedua titik tersebut."
    );
  }

  const distanceMeters =
    Number(
      feature
        ?.properties
        ?.distance
    );

  const durationSeconds =
    Number(
      feature
        ?.properties
        ?.time
    );

  const geometry =
    buildRouteGeometry(
      feature
        ?.geometry
        ?.coordinates
    );

  if (
    !Number.isFinite(
      distanceMeters
    ) ||
    !Number.isFinite(
      durationSeconds
    )
  ) {
    console.error(
      "INVALID GEOAPIFY ROUTE SUMMARY:",
      feature
    );

    throw new Error(
      "Data jarak atau waktu dari routing engine tidak lengkap."
    );
  }

  if (
    geometry.length <
    2
  ) {
    console.error(
      "INVALID GEOAPIFY ROUTE GEOMETRY:",
      feature
        ?.geometry
    );

    throw new Error(
      "Geometry rute tidak valid."
    );
  }

  return {
    distanceKm:
      distanceMeters /
      1000,

    durationMinutes:
      durationSeconds /
      60,

    geometry,
  };
}

/* =========================================================
   GET
   ========================================================= */

export async function GET(
  request: Request
) {
  try {
    const url =
      new URL(
        request.url
      );

    const action =
      url.searchParams.get(
        "action"
      );

    /* =====================================================
       SEARCH
       ===================================================== */

    if (
      action ===
      "search"
    ) {
      const query =
        url.searchParams
          .get("q")
          ?.trim() ??
        "";

      /*
       * Jangan request kalau terlalu pendek.
       */

      if (
        query.length <
        3
      ) {
        return NextResponse.json({
          results: [],
        });
      }

      console.log(
        "[ARVENA SEARCH]",
        query
      );

      const results =
        await searchPlaces(
          query
        );

      console.log(
        "[ARVENA SEARCH RESULTS]",
        results
      );

      return NextResponse.json({
        results,
      });
    }

    /* =====================================================
       REVERSE
       ===================================================== */

    if (
      action ===
      "reverse"
    ) {
      const lat =
        Number(
          url.searchParams.get(
            "lat"
          )
        );

      const lon =
        Number(
          url.searchParams.get(
            "lon"
          )
        );

      if (
        !Number.isFinite(
          lat
        ) ||
        !Number.isFinite(
          lon
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Koordinat tidak valid.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        lat < -90 ||
        lat > 90 ||
        lon < -180 ||
        lon > 180
      ) {
        return NextResponse.json(
          {
            error:
              "Koordinat berada di luar rentang yang valid.",
          },
          {
            status: 400,
          }
        );
      }

      const result =
        await reverseGeocode(
          lat,
          lon
        );

      return NextResponse.json({
        result,
      });
    }

    return NextResponse.json(
      {
        error:
          "Action tidak dikenali.",
      },
      {
        status: 400,
      }
    );
  } catch (
    error
  ) {
    console.error(
      "IMPACT GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "GIS service error.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   POST
   ========================================================= */

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const action =
      body?.action;

    if (
      action !==
      "route"
    ) {
      return NextResponse.json(
        {
          error:
            "Action routing tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    const origin =
      body?.origin;

    const destination =
      body?.destination;

    const transport =
      body?.transport as
        | TransportType
        | undefined;

    /* =====================================================
       VALIDASI TITIK
       ===================================================== */

    if (
      !Array.isArray(
        origin
      ) ||
      origin.length !==
        2 ||
      !Array.isArray(
        destination
      ) ||
      destination.length !==
        2
    ) {
      return NextResponse.json(
        {
          error:
            "Titik awal dan titik tujuan harus berupa koordinat yang valid.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       VALIDASI TRANSPORT
       ===================================================== */

    const validTransports:
      TransportType[] =
      [
        "motor-bensin",
        "motor-diesel",
        "motor-electric",

        "mobil-bensin",
        "mobil-diesel",
        "mobil-hybrid",
        "mobil-electric",

        "truk-diesel",
        "truk-electric",

        "bus-diesel",
        "bus-electric",

        "kereta-diesel",
        "kereta-electric",

        "pesawat-domestik",
        "pesawat-internasional",

        "ferry",
        "speedboat",

        "kapal-diesel",
        "kapal-electric",

        "jalan-kaki",
      ];

    if (
      !transport ||
      !validTransports.includes(
        transport
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Jenis transportasi tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       CONVERT COORDINATES
       ===================================================== */

    const originCoordinate:
      Coordinate =
      [
        Number(
          origin[0]
        ),

        Number(
          origin[1]
        ),
      ];

    const destinationCoordinate:
      Coordinate =
      [
        Number(
          destination[0]
        ),

        Number(
          destination[1]
        ),
      ];

    /* =====================================================
       VALIDATE FINITE
       ===================================================== */

    const invalidCoordinate =
      [
        ...originCoordinate,
        ...destinationCoordinate,
      ].some(
        (
          value: number
        ) =>
          !Number.isFinite(
            value
          )
      );

    if (
      invalidCoordinate
    ) {
      return NextResponse.json(
        {
          error:
            "Ada koordinat yang tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       VALIDATE RANGE
       ===================================================== */

    /*
     * ORS request:
     *
     * [longitude, latitude]
     */

    const coordinatePairs:
      Coordinate[] =
      [
        originCoordinate,
        destinationCoordinate,
      ];

    for (
      const coordinate of coordinatePairs
    ) {
      const lon =
        coordinate[0];

      const lat =
        coordinate[1];

      if (
        lon < -180 ||
        lon > 180 ||
        lat < -90 ||
        lat > 90
      ) {
        return NextResponse.json(
          {
            error:
              "Nilai latitude atau longitude berada di luar rentang yang valid.",
          },
          {
            status: 400,
          }
        );
      }
    }

    /* =====================================================
       CALCULATE ROUTE
       ===================================================== */

    const result =
      await calculateRoute(
        originCoordinate,
        destinationCoordinate,
        transport
      );

    return NextResponse.json(
      result
    );
  } catch (
    error
  ) {
    console.error(
      "IMPACT POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal menghitung rute.",
      },
      {
        status: 500,
      }
    );
  }
}