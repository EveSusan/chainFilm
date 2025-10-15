import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const token = process.env.PINATA_JWT;
    if (!token) {
      return NextResponse.json({ error: "Missing PINATA_JWT in environment" }, { status: 500 });
    }

    const incoming = await request.formData();
    const file = incoming.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const form = new FormData();
    form.append("file", file, file.name);

    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });

    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json({ error: `Pinata error: ${res.status} ${txt}` }, { status: 502 });
    }

    const data = await res.json();
    // Pinata returns { IpfsHash, PinSize, Timestamp }
    return NextResponse.json({ cid: data.IpfsHash, raw: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "upload failed" }, { status: 500 });
  }
}






