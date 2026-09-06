import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type CirraLocale = "default" | "id" | "en";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ResourceRow = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  custom_category: string | null;
  quantity: number | string | null;
  unit: string | null;
  city: string | null;
  price: number | string | null;
  negotiation_percent: number | string | null;
  status: string | null;
};

/* =========================================================
   CIRRA LANGUAGE
========================================================= */

function normalizeLocale(value: unknown): CirraLocale {
  if (value === "en") {
    return "en";
  }

  if (value === "id") {
    return "id";
  }

  // default = MIX
  // MIX untuk CIRRA tetap menggunakan Bahasa Indonesia.
  return "default";
}

function isEnglishLocale(locale: CirraLocale): boolean {
  return locale === "en";
}

/* =========================================================
   SYSTEM PROMPT
========================================================= */

function buildCirraSystemPrompt(
  locale: CirraLocale
): string {
  const languageInstruction =
    isEnglishLocale(locale)
      ? `
LANGUAGE:
Answer entirely in English.

Do not mix Indonesian into the answer unless the user explicitly asks you to translate something.
`
      : `
LANGUAGE:
Answer entirely in Indonesian.

The ARVENA MIX mode still uses Indonesian for CIRRA.
Do not switch to English merely because the user uses a few English words.
`;

  return `
Kamu adalah Cirra, AI assistant milik ARVENA.

ARVENA adalah connected city ecosystem yang menghubungkan circular resources,
community, environmental intelligence, GIS, impact, dan aktivitas kota.

IDENTITAS:
Kamu bernama Cirra.
Jangan memperkenalkan diri di setiap pesan.
Jika percakapan sudah berjalan, langsung jawab pertanyaan user.
Jangan mengatakan "Saya CIRRA" kecuali user memang menanyakan siapa kamu.

${languageInstruction}

GAYA:
Natural.
Ringkas.
Jelas.
Langsung ke inti.
Boleh menjelaskan dengan beberapa paragraf jika memang diperlukan.
Jangan terdengar seperti template.
Jangan mengulang pertanyaan user.

FORMAT:
Jangan gunakan Markdown.
Jangan gunakan **.
Jangan gunakan __.
Jangan gunakan ###.
Jangan gunakan horizontal rule.
Jangan gunakan bullet dengan * atau -.
Jangan membuat tabel.
Jangan menampilkan URL.
Jangan menampilkan path seperti /resources/....

RESOURCE DATA:
Jika DATA RESOURCE ARVENA diberikan, anggap data tersebut sebagai sumber fakta utama.
Jangan mengarang resource.
Jangan mengarang jumlah.
Jangan mengarang harga.
Jangan mengarang lokasi.
Jangan mengarang status.

RESOURCE SEARCH:
Jika user sedang mencari resource, fokus pada resource yang benar-benar tersedia di database.

Jawaban resource idealnya menjelaskan:
resource yang paling relevan,
jumlah/stok,
lokasi,
harga jika tersedia,
dan apakah stok tersebut sesuai dengan kebutuhan user.

UI ARVENA otomatis menampilkan resource cards di bawah jawaban.
Karena itu jangan menyalin seluruh detail resource ke dalam jawaban.

Jika ada beberapa resource yang bersama-sama dapat memenuhi kebutuhan user,
jelaskan bahwa kebutuhan tersebut dapat dipenuhi dari beberapa resource.

Contoh:
User meminta 30 kg ampas kopi.
Resource A memiliki 12 kg.
Resource B memiliki 10 kg.
Resource C memiliki 15 kg.

Jangan mengatakan satu seller memiliki 30 kg.
Katakan bahwa kebutuhan 30 kg dapat dipenuhi dengan menggabungkan beberapa resource,
misalnya 12 kg + 10 kg + 8 kg dari resource yang tersedia.

Jika stok satu resource sudah cukup,
jelaskan bahwa stoknya mencukupi.

Jika resource ditemukan tetapi stok total tidak mencukupi,
katakan jumlah yang tersedia dan kekurangannya.
Jangan mengarang tambahan stok.

Jika resource tidak ditemukan:
katakan bahwa data resource yang cocok belum ditemukan di ARVENA saat ini.
Jangan mengatakan "tidak ada" secara mutlak jika pencarian hanya berdasarkan kecocokan teks.

Jika DATA RESOURCE ARVENA kosong:
jangan membuat resource fiktif.

HARGA:
Gunakan harga dari database jika tersedia.
Jangan mengubah harga menjadi harga per kg/per unit yang berbeda dari data.
Jika harga 0, jangan menyimpulkan secara otomatis bahwa resource gratis kecuali konteks/data memang mendukungnya.

NEGOSIASI:
Jika negotiation_percent tersedia, boleh disebutkan secara singkat.
Jangan menjadikan persentase negosiasi sebagai harga final.

LOKASI:
Jika user menyebut kota tertentu, prioritaskan resource dari kota tersebut.
Jika user tidak menyebut kota, jangan mengarang lokasi user.

TYPO DAN ISTILAH:
Pahami typo umum, singkatan, bahasa percakapan, dan variasi penyebutan material.
Contoh:
"ampas kpi" dapat berarti "ampas kopi".
"mnyk jelantah" dapat berarti "minyak jelantah".
"smrg" dapat berarti "Semarang".

Jangan mengarang fakta hanya karena sebuah kata terlihat mirip.

KONTEKS PERCAKAPAN:
Gunakan conversation history untuk memahami konteks.
Jika user sebelumnya mengatakan "yang tadi", "yang pertama", "berapa harganya", atau pertanyaan lanjutan lainnya,
gunakan konteks percakapan sebelumnya.

Jika user hanya menyapa atau berbicara umum,
jawab secara natural dan jangan memaksakan pencarian resource.

`;
}

/* =========================================================
   NORMALIZE CHAT MESSAGES
========================================================= */

function normalizeMessages(
  value: unknown
): ChatMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is ChatMessage => {
      if (
        typeof item !== "object" ||
        item === null
      ) {
        return false;
      }

      const message =
        item as Record<string, unknown>;

      return (
        (message.role === "user" ||
          message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0
      );
    }
  );
}

/* =========================================================
   NORMALIZE SEARCH TEXT
========================================================= */

function normalizeSearchText(
  value: string
): string {
  let text = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /[^\p{L}\p{N}\s]/gu,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();

  const replacements: Record<
    string,
    string
  > = {
    // typo / abbreviation
    mnyk: "minyak",
    minyakk: "minyak",
    jelntah: "jelantah",
    jelanta: "jelantah",
    jelant: "jelantah",

    smrg: "semarang",
    smrang: "semarang",
    smg: "semarang",

    jogja: "yogyakarta",
    yogya: "yogyakarta",

    solo: "surakarta",

    jkt: "jakarta",
    bdg: "bandung",
    sby: "surabaya",
    mlg: "malang",

    organik: "organic",
    organiknya: "organic",

    plasik: "plastic",
    plastk: "plastic",

    kertasan: "paper",
    kardusan: "paper",

    kaleng: "metal",
    besi: "metal",
    seng: "metal",
    aluminium: "metal",
    alumunium: "metal",

    elektronik: "electronic",
    elektronika: "electronic",

    tekstil: "textile",
    kain: "textile",

    makanan: "food",
  };

  for (
    const [
      from,
      to,
    ] of Object.entries(
      replacements
    )
  ) {
    const expression =
      new RegExp(
        `\\b${escapeRegExp(from)}\\b`,
        "g"
      );

    text =
      text.replace(
        expression,
        to
      );
  }

  // Variasi material percakapan
  text = text
    .replace(
      /\bampas\s+kpi\b/g,
      "ampas kopi"
    )
    .replace(
      /\bampas\s+coffe\b/g,
      "ampas kopi"
    )
    .replace(
      /\bkopi\s+ampas\b/g,
      "ampas kopi"
    )
    .replace(
      /\bminyak\s+goreng\s+bekas\b/g,
      "minyak jelantah"
    )
    .replace(
      /\bminyak\s+bekas\b/g,
      "minyak jelantah"
    )
    .replace(
      /\bbotol\s+plastik\b/g,
      "botol plastik"
    );

  return text;
}

function escapeRegExp(
  value: string
): string {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

/* =========================================================
   TOKENIZE
========================================================= */

function tokenize(
  value: string
): string[] {
  const stopWords = new Set([
    "saya",
    "aku",
    "kamu",
    "anda",
    "yang",
    "dan",
    "atau",
    "di",
    "ke",
    "dari",
    "untuk",
    "dengan",
    "ini",
    "itu",
    "ada",
    "apa",
    "berapa",
    "apakah",
    "tolong",
    "dong",
    "donk",
    "ndak",
    "gak",
    "ga",
    "tidak",
    "mau",
    "ingin",
    "butuh",
    "cari",
    "carikan",
    "mencari",
    "jual",
    "jualan",
    "beli",
    "membeli",
    "punya",
  ]);

  return normalizeSearchText(value)
    .split(" ")
    .filter(
      (token) =>
        token.length >= 2 &&
        !stopWords.has(token)
    );
}

/* =========================================================
   INFER CITY
========================================================= */

function inferCity(
  text: string
): string | null {
  const normalized =
    normalizeSearchText(text);

  const cities = [
    "semarang",
    "yogyakarta",
    "surakarta",
    "jakarta",
    "bandung",
    "surabaya",
    "malang",
    "medan",
    "makassar",
    "denpasar",
    "palembang",
    "bekasi",
    "depok",
    "tangerang",
    "bogor",
  ];

  for (
    const city of cities
  ) {
    if (
      normalized.includes(city)
    ) {
      return city;
    }
  }

  return null;
}

/* =========================================================
   INFER CATEGORY
========================================================= */

function inferCategory(
  text: string
): string | null {
  const normalized =
    normalizeSearchText(text);

  if (
    normalized.includes(
      "minyak jelantah"
    ) ||
    normalized.includes(
      "ampas kopi"
    ) ||
    normalized.includes(
      "kulit pisang"
    ) ||
    normalized.includes(
      "sisa makanan"
    ) ||
    normalized.includes(
      "organik"
    )
  ) {
    return "organic";
  }

  if (
    normalized.includes(
      "plastic"
    ) ||
    normalized.includes(
      "plastik"
    ) ||
    normalized.includes(
      "botol"
    )
  ) {
    return "plastic";
  }

  if (
    normalized.includes(
      "paper"
    ) ||
    normalized.includes(
      "kardus"
    ) ||
    normalized.includes(
      "kertas"
    )
  ) {
    return "paper";
  }

  if (
    normalized.includes(
      "metal"
    ) ||
    normalized.includes(
      "besi"
    ) ||
    normalized.includes(
      "seng"
    ) ||
    normalized.includes(
      "aluminium"
    ) ||
    normalized.includes(
      "kaleng"
    )
  ) {
    return "metal";
  }

  if (
    normalized.includes(
      "electronic"
    ) ||
    normalized.includes(
      "elektronik"
    ) ||
    normalized.includes(
      "ewaste"
    )
  ) {
    return "electronic";
  }

  if (
    normalized.includes(
      "textile"
    ) ||
    normalized.includes(
      "tekstil"
    ) ||
    normalized.includes(
      "kain"
    )
  ) {
    return "textile";
  }

  if (
    normalized.includes(
      "food"
    ) ||
    normalized.includes(
      "makanan"
    )
  ) {
    return "food";
  }

  return null;
}

/* =========================================================
   MATERIAL ALIASES
========================================================= */

function getMaterialAliases(
  text: string
): string[] {
  const normalized =
    normalizeSearchText(text);

  const aliases: Record<
    string,
    string[]
  > = {
    "ampas kopi": [
      "ampas kopi",
      "coffee grounds",
      "coffee ground",
      "kopi",
    ],

    "minyak jelantah": [
      "minyak jelantah",
      "minyak bekas",
      "minyak goreng bekas",
      "used cooking oil",
      "jelantah",
    ],

    "kulit pisang": [
      "kulit pisang",
      "banana peel",
      "banana peels",
    ],

    "botol plastik": [
      "botol plastik",
      "plastic bottle",
      "plastic bottles",
    ],

    plastik: [
      "plastik",
      "plastic",
    ],

    kardus: [
      "kardus",
      "cardboard",
    ],

    kertas: [
      "kertas",
      "paper",
    ],

    besi: [
      "besi",
      "iron",
      "steel",
    ],

    aluminium: [
      "aluminium",
      "aluminum",
    ],

    elektronik: [
      "elektronik",
      "electronic",
      "e waste",
      "ewaste",
    ],

    tekstil: [
      "tekstil",
      "textile",
      "kain",
      "fabric",
    ],

    "sisa makanan": [
      "sisa makanan",
      "food waste",
      "leftover food",
    ],
  };

  return Object.entries(
    aliases
  )
    .filter(
      ([, values]) =>
        values.some(
          (value) =>
            normalized.includes(
              value
            )
        )
    )
    .flatMap(
      ([, values]) =>
        values
    );
}

/* =========================================================
   RESOURCE SEARCH INTENT
========================================================= */

function isResourceSearchIntent(
  text: string
): boolean {
  const normalized =
    normalizeSearchText(text);

  const materialTerms =
    getMaterialAliases(text);

  if (
    materialTerms.length > 0
  ) {
    return true;
  }

  const resourceSignals = [
    "resource",
    "cari",
    "mencari",
    "carikan",
    "butuh",
    "ingin",
    "mau",
    "membeli",
    "mendapatkan",
    "mengambil",
    "jual",
    "jualan",
    "tersedia",
    "stok",
    "ampas",
    "minyak",
    "jelantah",
    "plastik",
    "botol",
    "kardus",
    "kertas",
    "seng",
    "besi",
    "aluminium",
    "elektronik",
    "tekstil",
    "kain",
  ];

  return resourceSignals.some(
    (signal) =>
      normalized.includes(
        signal
      )
  );
}

/* =========================================================
   SCORE RESOURCE
========================================================= */

function scoreResource(
  resource: ResourceRow,
  userText: string
): number {
  const queryTokens =
    tokenize(userText);

  const title =
    normalizeSearchText(
      resource.title ?? ""
    );

  const customCategory =
    normalizeSearchText(
      resource.custom_category ?? ""
    );

  const description =
    normalizeSearchText(
      resource.description ?? ""
    );

  const category =
    normalizeSearchText(
      resource.category ?? ""
    );

  const city =
    normalizeSearchText(
      resource.city ?? ""
    );

  let score = 0;

  /* -------------------------------------------------------
     TOKEN MATCH
  ------------------------------------------------------- */

  for (
    const token of queryTokens
  ) {
    if (
      title.includes(token)
    ) {
      score += 18;
    }

    if (
      customCategory.includes(token)
    ) {
      score += 18;
    }

    if (
      description.includes(token)
    ) {
      score += 6;
    }

    if (
      category.includes(token)
    ) {
      score += 8;
    }

    if (
      city.includes(token)
    ) {
      score += 10;
    }
  }

  /* -------------------------------------------------------
     EXACT MATERIAL MATCH
  ------------------------------------------------------- */

  const materialTerms =
    getMaterialAliases(
      userText
    );

  for (
    const term of materialTerms
  ) {
    const normalizedTerm =
      normalizeSearchText(
        term
      );

    if (
      title.includes(
        normalizedTerm
      )
    ) {
      score += 45;
    }

    if (
      customCategory.includes(
        normalizedTerm
      )
    ) {
      score += 45;
    }

    if (
      description.includes(
        normalizedTerm
      )
    ) {
      score += 20;
    }

    /*
     * Special handling:
     * "kopi" sendiri tidak boleh membuat
     * semua resource kopi menjadi relevan.
     */
    if (
      normalizedTerm === "kopi" &&
      (
        title.includes(
          "ampas kopi"
        ) ||
        customCategory.includes(
          "ampas kopi"
        )
      )
    ) {
      score += 30;
    }
  }

  /* -------------------------------------------------------
     CITY MATCH
  ------------------------------------------------------- */

  const cityQuery =
    inferCity(userText);

  if (
    cityQuery &&
    city.includes(cityQuery)
  ) {
    score += 40;
  }

  /* -------------------------------------------------------
     CATEGORY MATCH
  ------------------------------------------------------- */

  const categoryQuery =
    inferCategory(userText);

  if (
    categoryQuery &&
    category === categoryQuery
  ) {
    score += 22;
  }

  /* -------------------------------------------------------
     AVAILABLE STATUS
  ------------------------------------------------------- */

  if (
    resource.status ===
    "available"
  ) {
    score += 10;
  }

  /* -------------------------------------------------------
     POSITIVE STOCK
  ------------------------------------------------------- */

  const quantity =
    Number(resource.quantity);

  if (
    Number.isFinite(quantity) &&
    quantity > 0
  ) {
    score += 5;
  }

  return score;
}

/* =========================================================
   SEARCH ARVENA RESOURCES
========================================================= */

async function searchArvenaResources(
  userText: string
): Promise<ResourceRow[]> {
  const supabase =
    await createClient();

  const {
    data,
    error,
  } =
    await supabase
      .from("resources")
      .select(
        `
        id,
        title,
        description,
        category,
        custom_category,
        quantity,
        unit,
        city,
        price,
        negotiation_percent,
        status
        `
      )
      .eq(
        "status",
        "available"
      )
      .limit(100);

  if (error) {
    console.error(
      "ARVENA RESOURCE SEARCH ERROR:",
      error
    );

    return [];
  }

  const resources =
    (data as ResourceRow[]) ??
    [];

  if (
    resources.length === 0
  ) {
    return [];
  }

  const scored =
    resources
      .map(
        (resource) => ({
          resource,
          score:
            scoreResource(
              resource,
              userText
            ),
        })
      )
      .filter(
        (item) =>
          item.score >= 10
      )
      .sort(
        (a, b) =>
          b.score - a.score
      );

  const cityQuery =
    inferCity(userText);

  /*
   * Kalau user menyebut kota,
   * resource dari kota tersebut diprioritaskan.
   */
  if (cityQuery) {
    const cityMatches =
      scored.filter(
        (item) =>
          normalizeSearchText(
            item.resource.city ??
              ""
          ).includes(
            cityQuery
          )
      );

    if (
      cityMatches.length > 0
    ) {
      return cityMatches
        .slice(0, 4)
        .map(
          (item) =>
            item.resource
        );
    }
  }

  return scored
    .slice(0, 4)
    .map(
      (item) =>
        item.resource
    );
}

/* =========================================================
   FORMAT NUMBER
========================================================= */

function formatNumber(
  value:
    | number
    | string
    | null
    | undefined
): string {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "0";
  }

  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {
    return "0";
  }

  return new Intl.NumberFormat(
    "id-ID",
    {
      maximumFractionDigits: 2,
    }
  ).format(number);
}

/* =========================================================
   FORMAT CURRENCY
========================================================= */

function formatCurrency(
  value:
    | number
    | string
    | null
    | undefined
): string {
  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {
    return "0";
  }

  return new Intl.NumberFormat(
    "id-ID",
    {
      maximumFractionDigits: 2,
    }
  ).format(number);
}

/* =========================================================
   BUILD RESOURCE CONTEXT
========================================================= */

function buildResourceContext(
  resources: ResourceRow[]
): string {
  if (
    resources.length === 0
  ) {
    return `
DATA RESOURCE ARVENA:
Tidak ada resource available yang lolos pencocokan pencarian saat ini.

ATURAN:
Jangan mengarang resource.
Jangan menyebut nama seller fiktif.
Jangan membuat stok atau harga fiktif.
`;
  }

  return `
DATA RESOURCE ARVENA:

${resources
  .map(
    (resource, index) => {
      const quantity =
        Number(resource.quantity);

      const price =
        Number(resource.price);

      return `
Resource ${index + 1}
ID: ${resource.id}
Judul: ${resource.title}
Deskripsi: ${resource.description ?? "Tidak tersedia"}
Kategori: ${resource.category ?? "Tidak tersedia"}
Kategori custom: ${resource.custom_category ?? "Tidak tersedia"}
Jumlah: ${
        Number.isFinite(quantity)
          ? formatNumber(quantity)
          : "0"
      } ${resource.unit ?? ""}
Kota: ${resource.city ?? "Tidak tersedia"}
Harga: ${
        Number.isFinite(price)
          ? `Rp${formatCurrency(price)}`
          : "Tidak tersedia"
      } per ${resource.unit ?? "unit"}
Negosiasi: ${
        resource.negotiation_percent ??
        0
      }%
Status: ${resource.status ?? "Tidak tersedia"}
`;
    }
  )
  .join("\n")}

INSTRUKSI:
Gunakan hanya data di atas.
Jangan mengubah angka.
Jangan mengarang informasi yang tidak tersedia.
`;
}

/* =========================================================
   DETECT QUERY QUANTITY
========================================================= */

function extractRequestedQuantity(
  text: string
): number | null {
  const normalized =
    normalizeSearchText(text);

  /*
   * Menangkap:
   * 10 kg
   * 10kg
   * 30 kilogram
   * 30 kg
   */

  const match =
    normalized.match(
      /(\d+(?:[.,]\d+)?)\s*(kg|kilogram|g|gram|ton|liter|l|pcs|buah|unit)\b/i
    );

  if (!match) {
    return null;
  }

  const value =
    Number(
      match[1].replace(
        ",",
        "."
      )
    );

  if (
    !Number.isFinite(value)
  ) {
    return null;
  }

  const unit =
    match[2].toLowerCase();

  if (
    unit === "g" ||
    unit === "gram"
  ) {
    return value / 1000;
  }

  if (
    unit === "ton"
  ) {
    return value * 1000;
  }

  return value;
}

/* =========================================================
   BUILD RESOURCE SUMMARY
========================================================= */

function buildResourceSummary(
  resources: ResourceRow[],
  userText: string,
  locale: CirraLocale
): string {
  if (
    resources.length === 0
  ) {
    return isEnglishLocale(
      locale
    )
      ? "I couldn't find a matching resource in ARVENA right now. I can keep searching if you provide a material name or location."
      : "Saya belum menemukan resource yang cocok di ARVENA saat ini. Kalau kamu menyebutkan material atau lokasi yang diinginkan, saya bisa bantu mencarinya.";
  }

  const requestedQuantity =
    extractRequestedQuantity(
      userText
    );

  const quantities =
    resources
      .map(
        (resource) =>
          Number(resource.quantity)
      )
      .filter(
        (quantity) =>
          Number.isFinite(
            quantity
          ) &&
          quantity > 0
      );

  const totalAvailable =
    quantities.reduce(
      (
        total,
        quantity
      ) =>
        total + quantity,
      0
    );

  const top =
    resources[0];

  if (
    isEnglishLocale(locale)
  ) {
    let message =
      `I found ${resources.length} relevant resource${resources.length > 1 ? "s" : ""} in ARVENA. `;

    message += `The closest match is "${top.title}"`;

    if (top.city) {
      message += ` in ${top.city}`;
    }

    if (
      top.quantity !==
        null &&
      top.quantity !==
        undefined
    ) {
      message += ` with ${formatNumber(top.quantity)} ${top.unit ?? "unit"} available`;
    }

    if (
      top.price !==
        null &&
      top.price !==
        undefined &&
      Number(top.price) > 0
    ) {
      message += ` at Rp${formatCurrency(top.price)} per ${top.unit ?? "unit"}`;
    }

    message += ".";

    if (
      requestedQuantity !==
        null &&
      totalAvailable <
        requestedQuantity &&
      resources.length > 1
    ) {
      message += ` The matching resources currently total about ${formatNumber(totalAvailable)} ${top.unit ?? "unit"}, so they do not fully cover your requested ${formatNumber(requestedQuantity)} ${top.unit ?? "unit"}.`;
    } else if (
      requestedQuantity !==
        null &&
      totalAvailable >=
        requestedQuantity &&
      resources.length > 1
    ) {
      message += ` Your requested ${formatNumber(requestedQuantity)} ${top.unit ?? "unit"} can be covered by combining available resources.`;
    } else if (
      requestedQuantity !==
        null &&
      Number(top.quantity) >=
        requestedQuantity
    ) {
      message += ` The available stock is enough for your requested ${formatNumber(requestedQuantity)} ${top.unit ?? "unit"}.`;
    }

    return message;
  }

  let message =
    `Saya menemukan ${resources.length} resource yang relevan di ARVENA. `;

  message += `Pilihan yang paling sesuai adalah "${top.title}"`;

  if (top.city) {
    message += ` di ${top.city}`;
  }

  if (
    top.quantity !==
      null &&
    top.quantity !==
      undefined
  ) {
    message += ` dengan stok ${formatNumber(top.quantity)} ${top.unit ?? "unit"}`;
  }

  if (
    top.price !==
      null &&
    top.price !==
      undefined &&
    Number(top.price) > 0
  ) {
    message += ` dengan harga Rp${formatCurrency(top.price)} per ${top.unit ?? "unit"}`;
  }

  message += ".";

  if (
    requestedQuantity !==
      null &&
    totalAvailable <
      requestedQuantity &&
    resources.length > 1
  ) {
    message += ` Jika digabung, resource yang ditemukan saat ini menyediakan sekitar ${formatNumber(totalAvailable)} ${top.unit ?? "unit"}, jadi belum mencukupi kebutuhan ${formatNumber(requestedQuantity)} ${top.unit ?? "unit"}.`;
  } else if (
    requestedQuantity !==
      null &&
    totalAvailable >=
      requestedQuantity &&
    resources.length > 1
  ) {
    message += ` Kebutuhan ${formatNumber(requestedQuantity)} ${top.unit ?? "unit"} dapat dipenuhi dengan menggabungkan beberapa resource yang tersedia.`;
  } else if (
    requestedQuantity !==
      null &&
    Number(top.quantity) >=
      requestedQuantity
  ) {
    message += ` Stoknya mencukupi kebutuhan ${formatNumber(requestedQuantity)} ${top.unit ?? "unit"}.`;
  }

  return message;
}

/* =========================================================
   CLEAN CIRRA OUTPUT
========================================================= */

function cleanCirraOutput(
  value: string
): string {
  return value
    .replace(
      /\*\*([\s\S]*?)\*\*/g,
      "$1"
    )
    .replace(
      /__([\s\S]*?)__/g,
      "$1"
    )
    .replace(
      /^#{1,6}\s*/gm,
      ""
    )
    .replace(
      /^\s*---+\s*$/gm,
      ""
    )
    .replace(
      /^\s*[-*]\s+/gm,
      ""
    )
    .replace(
      /\/resources\/[a-zA-Z0-9-]+/g,
      ""
    )
    .replace(
      /https?:\/\/[^\s]+/gi,
      ""
    )
    .replace(
      /\n{3,}/g,
      "\n\n"
    )
    .trim();
}

/* =========================================================
   FALLBACK
========================================================= */

function generateCirraFallback(
  query: string,
  matchedResources: ResourceRow[],
  locale: CirraLocale
): string {
  const clean =
    normalizeSearchText(query);

  /*
   * RESOURCE
   */

  if (
    isResourceSearchIntent(
      query
    )
  ) {
    return buildResourceSummary(
      matchedResources,
      query,
      locale
    );
  }

  /*
   * CLASSIFICATION
   */

  if (
    clean.includes(
      "klasifikasi"
    ) ||
    clean.includes(
      "classify"
    ) ||
    clean.includes(
      "material"
    ) ||
    clean.includes(
      "jenis"
    ) ||
    clean.includes(
      "daur ulang"
    ) ||
    clean.includes(
      "recycle"
    )
  ) {
    if (
      isEnglishLocale(
        locale
      )
    ) {
      return "I can help identify and classify a circular material based on its characteristics, composition, and potential reuse.";
    }

    return "Saya bisa membantu mengidentifikasi dan mengklasifikasikan material berdasarkan karakteristik, komposisi, serta potensi pemanfaatan kembalinya.";
  }

  /*
   * PRICE
   */

  if (
    clean.includes(
      "harga"
    ) ||
    clean.includes(
      "price"
    ) ||
    clean.includes(
      "biaya"
    ) ||
    clean.includes(
      "pasar"
    )
  ) {
    if (
      isEnglishLocale(
        locale
      )
    ) {
      return "I can help estimate a secondary-resource price using the available ARVENA data, including material type, quantity, condition, and location.";
    }

    return "Saya bisa membantu memperkirakan harga resource sekunder berdasarkan data ARVENA, jenis material, jumlah, kondisi, dan lokasi.";
  }

  /*
   * IMPACT
   */

  if (
    clean.includes(
      "emisi"
    ) ||
    clean.includes(
      "impact"
    ) ||
    clean.includes(
      "dampak"
    ) ||
    clean.includes(
      "co2"
    ) ||
    clean.includes(
      "hitung"
    )
  ) {
    if (
      isEnglishLocale(
        locale
      )
    ) {
      return "I can help estimate environmental impact and transport emissions for circular activities. For route-based calculations, the Impact feature provides the more detailed result.";
    }

    return "Saya bisa membantu memperkirakan dampak lingkungan dan emisi transportasi dari aktivitas sirkular. Untuk perhitungan berbasis rute, fitur Impact ARVENA menyediakan hasil yang lebih detail.";
  }

  /*
   * COMMUNITY
   */

  if (
    clean.includes(
      "komunitas"
    ) ||
    clean.includes(
      "community"
    ) ||
    clean.includes(
      "kegiatan"
    ) ||
    clean.includes(
      "event"
    ) ||
    clean.includes(
      "workshop"
    )
  ) {
    if (
      isEnglishLocale(
        locale
      )
    ) {
      return "You can explore active communities and circular activities through ARVENA Community and Events.";
    }

    return "Kamu bisa menjelajahi komunitas aktif dan kegiatan ekonomi sirkular melalui fitur Community dan Events ARVENA.";
  }

  /*
   * GREETING / GENERAL
   */

  if (
    isEnglishLocale(
      locale
    )
  ) {
    return "How can I help you with ARVENA today?";
  }

  return "Ada yang ingin kamu cari atau tanyakan di ARVENA?";
}

/* =========================================================
   GROQ
========================================================= */

async function generateWithGroq(
  apiKey: string,
  messages: Array<{
    role:
      | "system"
      | "user"
      | "assistant";
    content: string;
  }>
): Promise<string> {
  const groq =
    new Groq({
      apiKey,
    });

  try {
    const completion =
      await groq.chat.completions.create(
        {
          model:
            "llama-3.3-70b-versatile",
          messages,
          temperature: 0.2,
          max_completion_tokens: 600,
          stream: false,
        }
      );

    return (
      completion
        .choices[0]
        ?.message
        ?.content
        ?.trim() ?? ""
    );
  } catch (primaryError) {
    console.error(
      "CIRRA GROQ PRIMARY ERROR:",
      primaryError
    );
  }

  try {
    const fallbackCompletion =
      await groq.chat.completions.create(
        {
          model:
            "llama-3.1-8b-instant",
          messages,
          temperature: 0.2,
          max_completion_tokens: 600,
          stream: false,
        }
      );

    return (
      fallbackCompletion
        .choices[0]
        ?.message
        ?.content
        ?.trim() ?? ""
    );
  } catch (secondaryError) {
    console.error(
      "CIRRA GROQ FALLBACK ERROR:",
      secondaryError
    );

    return "";
  }
}

/* =========================================================
   POST /api/cirra
========================================================= */

export async function POST(
  request: Request
) {
  try {
    const apiKey =
      process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            "GROQ_API_KEY belum ditemukan.",
        },
        {
          status: 500,
        }
      );
    }

    const body =
      await request.json();

    const locale =
      normalizeLocale(
        body?.locale
      );

    let messages =
      normalizeMessages(
        body?.messages
      );

    const directMessage =
      typeof body?.message ===
      "string"
        ? body.message.trim()
        : "";

    if (
      messages.length === 0 &&
      directMessage
    ) {
      messages = [
        {
          role: "user",
          content:
            directMessage,
        },
      ];
    }

    if (
      messages.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Pesan Cirra tidak boleh kosong.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Batasi history.
     */

    const recentMessages =
      messages.slice(-12);

    const latestUserMessage =
      [...recentMessages]
        .reverse()
        .find(
          (message) =>
            message.role ===
            "user"
        );

    const userText =
      latestUserMessage
        ?.content?.trim() ??
      "";

    if (!userText) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Pesan user tidak ditemukan.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       RESOURCE SEARCH
    ===================================================== */

    let matchedResources:
      ResourceRow[] = [];

    const resourceIntent =
      isResourceSearchIntent(
        userText
      );

    if (resourceIntent) {
      matchedResources =
        await searchArvenaResources(
          userText
        );
    }

    /* =====================================================
       RESOURCE CONTEXT
    ===================================================== */

    const resourceContext =
      buildResourceContext(
        matchedResources
      );

    /* =====================================================
       GROQ MESSAGES
    ===================================================== */

    const groqMessages: Array<{
      role:
        | "system"
        | "user"
        | "assistant";
      content: string;
    }> = [
      {
        role: "system",
        content:
          buildCirraSystemPrompt(
            locale
          ),
      },
      {
        role: "system",
        content:
          resourceContext,
      },
    ];

    for (
      const chatMessage of recentMessages
    ) {
      groqMessages.push({
        role:
          chatMessage.role,
        content:
          chatMessage.content,
      });
    }

    /* =====================================================
       GROQ
    ===================================================== */

    let rawOutput = "";

    rawOutput =
      await generateWithGroq(
        apiKey,
        groqMessages
      );

    /* =====================================================
       FALLBACK
    ===================================================== */

    if (!rawOutput) {
      rawOutput =
        generateCirraFallback(
          userText,
          matchedResources,
          locale
        );
    }

    /* =====================================================
       CLEAN
    ===================================================== */

    const cleanedOutput =
      cleanCirraOutput(
        rawOutput
      );

    /* =====================================================
       FINAL RESPONSE
    ===================================================== */

    return NextResponse.json({
      success: true,
      message:
        cleanedOutput ||
        generateCirraFallback(
          userText,
          matchedResources,
          locale
        ),
      resources:
        matchedResources.map(
          (resource) => ({
            id: resource.id,
            title:
              resource.title,
            description:
              resource.description,
            category:
              resource.category,
            custom_category:
              resource.custom_category,
            quantity:
              resource.quantity,
            unit:
              resource.unit,
            city:
              resource.city,
            price:
              resource.price,
            negotiation_percent:
              resource.negotiation_percent,
            status:
              resource.status,
          })
        ),
    });
  } catch (error) {
    console.error(
      "CIRRA API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Cirra sedang mengalami gangguan. Silakan coba lagi.",
        resources: [],
      },
      {
        status: 500,
      }
    );
  }
}
