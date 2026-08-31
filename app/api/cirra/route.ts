import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const CIRRA_SYSTEM_PROMPT = `
Kamu adalah Cirra, AI assistant milik ARVENA.

ARVENA adalah connected city ecosystem yang menghubungkan
circular resources, community, environmental intelligence,
GIS, impact, dan aktivitas kota.

IDENTITAS:
Kamu bernama Cirra.
Jangan memperkenalkan diri di setiap pesan.
Jika percakapan sudah berjalan, langsung jawab.

GAYA:
Gunakan bahasa Indonesia.
Natural.
Ringkas.
Langsung ke inti.
Jawab semua yang ditanyakan user.

FORMAT:
Jangan gunakan Markdown.
Jangan gunakan **.
Jangan gunakan __.
Jangan gunakan ###.
Jangan gunakan ---.
Jangan gunakan bullet dengan * atau -.
Jangan membuat tabel.

PENTING:
Jika DATA RESOURCE ARVENA diberikan, gunakan data tersebut.
Jangan mengarang resource.
Jangan mengarang jumlah, harga, kota, atau status.

RESOURCE SEARCH:
Jika resource yang cocok ditemukan di database,
jangan menuliskan seluruh daftar resource dalam jawaban.

Cukup jelaskan:
1. resource paling relevan
2. jumlah/stok
3. lokasi
4. harga jika tersedia
5. apakah sesuai kebutuhan user

UI ARVENA akan otomatis menampilkan resource cards
di bawah jawabanmu.

Jangan menuliskan:
"/resources/..."
atau URL resource.

Contoh:

User:
"Saya mau ampas kopi 10 kg."

Jawaban:
"Saya menemukan beberapa resource ampas kopi yang tersedia di ARVENA.

Pilihan paling sesuai adalah ampas kopi di Semarang dengan stok 18,36 kg dan harga Rp200.000 per kg. Stoknya mencukupi kebutuhan 10 kg.

Saya tampilkan resource yang tersedia di bawah jawaban ini."

JANGAN menyalin kembali semua resource satu per satu.

Jika resource sangat mahal dibanding pilihan lain,
boleh beri perbandingan singkat.

Jika resource tidak ditemukan:
katakan data yang cocok belum ditemukan di ARVENA.
Jangan langsung mengatakan tidak ada jika pencarian database
masih memungkinkan dilakukan dengan variasi nama material.

DATA RESOURCE ARVENA akan diberikan oleh backend.
`;

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ResourceRow = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  quantity: number | string | null;
  unit: string | null;
  city: string | null;
  price: number | string | null;
  negotiation_percent: number | string | null;
  status: string | null;
};

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
    mnyk: "minyak",
    minyak: "minyak",
    jelntah: "jelantah",
    jelanta: "jelantah",

    smrg: "semarang",
    smrang: "semarang",

    jogja: "yogyakarta",
    solo: "surakarta",

    organik: "organic",
    organiknya: "organic",

    plasik: "plastic",

    kertas: "paper",

    kaleng: "metal",
    besi: "metal",
    seng: "metal",
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
        `\\b${from}\\b`,
        "g"
      );

    text =
      text.replace(
        expression,
        to
      );
  }

  return text;
}

/* =========================================================
   TOKENIZE
========================================================= */

function tokenize(
  value: string
): string[] {
  return normalizeSearchText(
    value
  )
    .split(" ")
    .filter(
      (token) =>
        token.length >= 2
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
   INFER MATERIAL TERMS
========================================================= */

function inferMaterialTerms(
  text: string
): string[] {
  const normalized =
    normalizeSearchText(text);

  const terms = [
    "minyak jelantah",
    "ampas kopi",
    "kulit pisang",
    "botol plastik",
    "plastik",
    "kardus",
    "kertas",
    "seng",
    "besi",
    "aluminium",
    "elektronik",
    "tekstil",
    "kain",
    "sisa makanan",
  ];

  return terms.filter(
    (term) =>
      normalized.includes(term)
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

  const resourceSignals = [
    "resource",
    "cari",
    "mencari",
    "butuh",
    "ingin",
    "mau",
    "membeli",
    "mendapatkan",
    "mengambil",
    "minyak",
    "jelantah",
    "ampas",
    "kopi",
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

  for (
    const token of queryTokens
  ) {
    if (
      title.includes(token)
    ) {
      score += 10;
    }

    if (
      description.includes(
        token
      )
    ) {
      score += 4;
    }

    if (
      category.includes(token)
    ) {
      score += 6;
    }

    if (
      city.includes(token)
    ) {
      score += 8;
    }
  }

  const cityQuery =
    inferCity(userText);

  if (
    cityQuery &&
    city.includes(cityQuery)
  ) {
    score += 25;
  }

  const materialTerms =
    inferMaterialTerms(
      userText
    );

  for (
    const term of materialTerms
  ) {
    if (
      title.includes(term)
    ) {
      score += 40;
    }

    if (
      description.includes(
        term
      )
    ) {
      score += 15;
    }
  }

  const categoryQuery =
    inferCategory(userText);

  if (
    categoryQuery &&
    category === categoryQuery
  ) {
    score += 20;
  }

  if (
    resource.status ===
    "available"
  ) {
    score += 10;
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
          item.score > 0
      )
      .sort(
        (a, b) =>
          b.score - a.score
      );

  const cityQuery =
    inferCity(userText);

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
        .slice(0, 5)
        .map(
          (item) =>
            item.resource
        );
    }
  }

  return scored
    .slice(0, 5)
    .map(
      (item) =>
        item.resource
    );
}

/* =========================================================
   FORMAT CURRENCY
========================================================= */

function formatCurrency(
  value:
    | number
    | string
    | null
): string {
  const number =
    Number(value) || 0;

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
Tidak ditemukan resource available yang cocok.
`;
  }

  return `
DATA RESOURCE ARVENA:
${resources
  .map(
    (resource, index) => `
Resource ${index + 1}
ID: ${resource.id}
Judul: ${resource.title}
Kategori: ${resource.category ?? "Tidak tersedia"}
Jumlah: ${resource.quantity ?? 0} ${resource.unit ?? ""}
Kota: ${resource.city ?? "Tidak tersedia"}
Harga: Rp${formatCurrency(resource.price)} per ${resource.unit ?? "unit"}
Negosiasi: ${resource.negotiation_percent ?? 0}%
Status: ${resource.status ?? "Tidak tersedia"}
`
  )
  .join("\n")}
`;
}

/* =========================================================
   CLEAN CIRRA OUTPUT
========================================================= */

function cleanCirraOutput(
  value: string
): string {
  return value
    // Hapus bold markdown tanpa menggunakan regex flag "s"
    .replace(
      /\*\*([\s\S]*?)\*\*/g,
      "$1"
    )

    // Hapus underline markdown
    .replace(
      /__([\s\S]*?)__/g,
      "$1"
    )

    // Hapus heading markdown
    .replace(
      /^#{1,6}\s*/gm,
      ""
    )

    // Hapus horizontal rule
    .replace(
      /^\s*---+\s*$/gm,
      ""
    )

    // Hapus bullet markdown
    .replace(
      /^\s*[-*]\s+/gm,
      ""
    )

    // Hapus URL resource
    .replace(
      /\/resources\/[a-zA-Z0-9-]+/g,
      ""
    )

    // Rapikan newline
    .replace(
      /\n{3,}/g,
      "\n\n"
    )

    .trim();
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
            "GROQ_API_KEY belum ditemukan di .env.local.",
        },
        {
          status: 500,
        }
      );
    }

    const body =
      await request.json();

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

    // Batasi history agar request tidak terlalu besar
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

    /* =====================================================
       SEARCH RESOURCE
    ===================================================== */

    let matchedResources:
      ResourceRow[] = [];

    if (
      isResourceSearchIntent(
        userText
      )
    ) {
      matchedResources =
        await searchArvenaResources(
          userText
        );
    }

    const resourceContext =
      buildResourceContext(
        matchedResources
      );

    /* =====================================================
       GROQ CLIENT
    ===================================================== */

    const groq =
      new Groq({
        apiKey,
      });

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
          CIRRA_SYSTEM_PROMPT,
      },
      {
        role: "system",
        content:
          resourceContext,
      },
    ];

    /* =====================================================
       ADD CONVERSATION HISTORY
    ===================================================== */

    for (
      const message of recentMessages
    ) {
      groqMessages.push({
        role: message.role,
        content:
          message.content,
      });
    }

    /* =====================================================
       CALL GROQ
    ===================================================== */

    const completion =
      await groq.chat.completions.create(
        {
          model:
            "openai/gpt-oss-120b",

          messages:
            groqMessages,

          temperature: 0.2,

          max_completion_tokens:
            600,

          stream: false,
        }
      );

    const rawOutput =
      completion
        .choices[0]
        ?.message
        ?.content?.trim() ??
      "";

    if (!rawOutput) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cirra tidak menghasilkan jawaban.",
        },
        {
          status: 502,
        }
      );
    }

    /* =====================================================
       CLEAN RESPONSE
    ===================================================== */

    const cleanedOutput =
      cleanCirraOutput(
        rawOutput
      );

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json({
      success: true,

      message:
        cleanedOutput,

      resources:
        matchedResources.map(
          (resource) => ({
            id: resource.id,
            title: resource.title,
            description:
              resource.description,
            category:
              resource.category,
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

    let errorMessage =
      "Cirra sedang mengalami gangguan. Coba lagi sebentar.";

    if (
      error instanceof Error
    ) {
      const text =
        error.message.toLowerCase();

      if (
        text.includes("429") ||
        text.includes("rate limit")
      ) {
        errorMessage =
          "Batas request Cirra sedang tercapai. Coba lagi sebentar.";
      } else if (
        text.includes("401") ||
        text.includes("api key") ||
        text.includes(
          "authentication"
        )
      ) {
        errorMessage =
          "GROQ_API_KEY tidak valid. Periksa .env.local.";
      }

      console.error(
        "RAW CIRRA ERROR:",
        error.message
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          errorMessage,
      },
      {
        status: 500,
      }
    );
  }
}