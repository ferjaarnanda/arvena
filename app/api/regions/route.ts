import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const type = searchParams.get("type");
    const code = searchParams.get("code");

    let url = "";

    // =====================================================
    // PROVINSI
    // /api/regions
    // /api/regions?type=provinces
    // =====================================================

    if (!type || type === "provinces") {
      url = "https://wilayah.id/api/provinces.json";
    }

    // =====================================================
    // KABUPATEN / KOTA
    // /api/regions?type=regencies&code=33
    // =====================================================

    else if (type === "regencies") {
      if (!code) {
        return NextResponse.json(
          {
            error: "Kode provinsi tidak ditemukan.",
          },
          {
            status: 400,
          }
        );
      }

      url = `https://wilayah.id/api/regencies/${encodeURIComponent(
        code
      )}.json`;
    }

    // =====================================================
    // KECAMATAN
    // /api/regions?type=districts&code=3374
    // =====================================================

    else if (type === "districts") {
      if (!code) {
        return NextResponse.json(
          {
            error: "Kode kabupaten/kota tidak ditemukan.",
          },
          {
            status: 400,
          }
        );
      }

      url = `https://wilayah.id/api/districts/${encodeURIComponent(
        code
      )}.json`;
    }

    // =====================================================
    // TYPE TIDAK VALID
    // =====================================================

    else {
      return NextResponse.json(
        {
          error: "Tipe wilayah tidak valid.",
        },
        {
          status: 400,
        }
      );
    }

    console.log("REGION REQUEST:", url);

    // =====================================================
    // REQUEST KE WILAYAH.ID
    // =====================================================

    const response = await fetch(url, {
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        "WILAYAH.ID ERROR:",
        response.status,
        errorText
      );

      return NextResponse.json(
        {
          error: `Wilayah.id error ${response.status}`,
        },
        {
          status: response.status,
        }
      );
    }

    const data = await response.json();

    console.log(
      "REGION RESPONSE:",
      data
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error(
      "REGIONS API ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Gagal mengambil data wilayah.",
      },
      {
        status: 500,
      }
    );
  }
}