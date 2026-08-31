import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      provinceCode: string;
    }>;
  }
) {
  try {
    const { provinceCode } = await context.params;

    if (!provinceCode) {
      return NextResponse.json(
        { error: "Province code tidak ditemukan." },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://wilayah.id/api/regencies/${provinceCode}.json`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Gagal mengambil data kabupaten/kota.",
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error(
      "REGIONS REGENCIES API ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Gagal mengambil data kabupaten/kota.",
      },
      { status: 500 }
    );
  }
}