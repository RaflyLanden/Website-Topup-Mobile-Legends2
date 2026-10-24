import { NextResponse } from "next/server";
import { getRepository } from "@/lib/server/repository";

export async function GET() {
  try {
    return NextResponse.json({ categories: await getRepository().listCategories() });
  } catch {
    return NextResponse.json({ error: "Kategori belum tersedia." }, { status: 503 });
  }
}
