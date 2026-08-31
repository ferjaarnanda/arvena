import { NextResponse } from "next/server";

type Params = {
  params: Promise<{
    cityCode: string;
  }>;
};

type Region = {
  code: string;
  name: string;
};

export async function GET(
  _request: Request,
  { params }: Params
) {
  try {
    const { cityCode } =
      await params;

    // ==========================================
    // VALIDASI CITY / REGENCY CODE
    // ==========================================

    if (!cityCode) {
      return NextResponse.json(
        {
          error:
            "Kode kabupaten/kota wajib diisi.",
        },
        {
          status: 400,
        }
      );
    }

    console.log(
      "🔥 DISTRICTS API DIPANGGIL:",
      cityCode
    );

    // ==========================================
    // REQUEST KE WILAYAH.ID
    // ==========================================
    //
    // Contoh:
    //
    // https://wilayah.id/api/districts/64.01.json
    //
    // Response:
    //
    // {
    //   "data": [
    //     {
    //       "code": "64.01.01",
    //       "name": "..."
    //     }
    //   ]
    // }
    //
    // ==========================================

    const apiUrl =
      `https://wilayah.id/api/districts/${encodeURIComponent(
        cityCode
      )}.json`;

    console.log(
      "🌐 DISTRICTS API URL:",
      apiUrl
    );

    const response = await fetch(
      apiUrl,
      {
        cache: "no-store",
      }
    );

    // ==========================================
    // CEK RESPONSE API
    // ==========================================

    if (!response.ok) {
      console.error(
        "❌ WILAYAH.ID DISTRICTS ERROR:",
        response.status,
        response.statusText
      );

      return NextResponse.json(
        {
          error:
            "Gagal mengambil data kecamatan.",
        },
        {
          status: response.status,
        }
      );
    }

    // ==========================================
    // PARSE JSON
    // ==========================================

    const result =
      await response.json();

    console.log(
      "📦 RAW DISTRICTS DATA:",
      result
    );

    // ==========================================
    // VALIDASI RESPONSE
    // ==========================================

    if (
      !result ||
      !Array.isArray(result.data)
    ) {
      console.error(
        "❌ FORMAT DISTRICTS TIDAK VALID:",
        result
      );

      return NextResponse.json(
        {
          error:
            "Format data kecamatan tidak valid.",
        },
        {
          status: 500,
        }
      );
    }

    // ==========================================
    // FORMAT DATA
    // ==========================================

    const data: Region[] =
      result.data
        .map(
          (item: {
            code?: string;
            name?: string;
          }) => ({
            code:
              item.code ?? "",
            name:
              item.name ?? "",
          })
        )
        .filter(
          (item: Region) =>
            item.code &&
            item.name
        )
        .sort(
          (
            a: Region,
            b: Region
          ) =>
            a.name.localeCompare(
              b.name,
              "id",
              {
                sensitivity:
                  "base",
              }
            )
        );

    // ==========================================
    // LOG
    // ==========================================

    console.log(
      "✅ DISTRICTS BERHASIL:",
      data.length
    );

    // ==========================================
    // RETURN DATA KE FRONTEND
    // ==========================================

    return NextResponse.json(
      {
        data,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "❌ DISTRICTS API ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Gagal mengambil data kecamatan.",
      },
      {
        status: 500,
      }
    );
  }
}