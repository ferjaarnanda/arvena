import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      "https://wilayah.id/api/provinces.json",
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Gagal mengambil data provinsi",
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("PROVINCES API ERROR:", error);

    return NextResponse.json(
      {
        error: "Gagal mengambil data provinsi",
      },
      { status: 500 }
    );
  }
}