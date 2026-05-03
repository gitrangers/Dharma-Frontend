import { NextResponse } from "next/server";
import { getApiBase } from "@/lib/api";

/**
 * Proxies to DharmaNode Sails `POST /api/subscribe/saveData` (same as Angular `NavigationService.subScribe`).
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ value: false, data: "Invalid JSON" }, { status: 400 });
  }
  const email =
    body && typeof body === "object" && "email" in body && typeof (body as { email: unknown }).email === "string" ?
      (body as { email: string }).email.trim()
    : "";
  if (!email) {
    return NextResponse.json({ value: false, data: "Email required" }, { status: 400 });
  }

  const base = getApiBase();
  const url = `${base}subscribe/saveData`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return NextResponse.json(json, { status: res.ok ? 200 : 502 });
  } catch (e) {
    console.error("[subscribe proxy]", e);
    return NextResponse.json({ value: false, data: "Upstream error" }, { status: 502 });
  }
}
