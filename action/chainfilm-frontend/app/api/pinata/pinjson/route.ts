import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const token = process.env.PINATA_JWT;
    if (!token) {
      return NextResponse.json({ error: "Missing PINATA_JWT in environment" }, { status: 500 });
    }

    const body = await request.json();
    const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json({ error: `Pinata error: ${res.status} ${txt}` }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json({ cid: data.IpfsHash, raw: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "pin json failed" }, { status: 500 });
  }
}






