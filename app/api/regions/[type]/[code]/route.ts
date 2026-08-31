import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    type: string;
    code: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const { type, code } = await params;

    const allowedTypes = [
      "regencies",
      "districts",
      "villages",
    ];

    if (!allowedTypes.includes(type)) {
      return NextResponse.json(
        {
          error: "Tipe wilayah tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    if (!code || !code.trim()) {
      return NextResponse.json(
        {
          error: "Kode wilayah tidak ditemukan.",
        },
        {
          status: 400,
        }
      );
    }

    const cleanCode = code.trim();

    const url =
      `https://wilayah.id/api/${type}/${encodeURIComponent(
        cleanCode
      )}.json`;

    console.log("🌍 REGION API:", url);

    const response = await fetch(url, {
      cache: "no-store",
    });

    const text = await response.text();

    if (!response.ok) {
      console.error(
        "❌ WILAYAH.ID ERROR:",
        response.status,
        text
      );

      return NextResponse.json(
        {
          error:
            `Data ${type} untuk kode ${cleanCode} tidak ditemukan.`,
        },
        {
          status: response.status,
        }
      );
    }

    let result: unknown;

    try {
      result = JSON.parse(text);
    } catch {
      console.error(
        "❌ RESPONSE BUKAN JSON:",
        text
      );

      return NextResponse.json(
        {
          error:
            "Response data wilayah tidak valid.",
        },
        {
          status: 502,
        }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error(
      "❌ REGION API ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Gagal mengambil data wilayah.",
      },
      {
        status: 500,
      }
    );
  }
}