import { NextResponse } from "next/server";

const STRAPI_SUBSCRIBES_URL = (() => {
  const base =
    process.env.STRAPI_URL ||
    process.env.NEXT_PUBLIC_STRAPI_URL ||
    "https://dharmacms2.tinglabs.in";
  return `${base.replace(/\/$/, "")}/api/subscribes`;
})();

function strapiToken() {
  return (
    process.env.STRAPI_API_TOKEN ||
    process.env.STRAPI_AUTH_TOKEN ||
    process.env.STRAPI_TOKEN ||
    ""
  );
}

/**
 * Saves subscriber email to Strapi `POST /api/subscribes`.
 * Returns a normalised `{ value, data }` shape the frontend already expects.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ value: false, data: "Invalid JSON" }, { status: 400 });
  }

  const email =
    body &&
    typeof body === "object" &&
    "email" in body &&
    typeof (body as { email: unknown }).email === "string"
      ? (body as { email: string }).email.trim()
      : "";

  if (!email) {
    return NextResponse.json({ value: false, data: "Email required" }, { status: 400 });
  }

  const token = strapiToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(STRAPI_SUBSCRIBES_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ data: { email } }),
    });

    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;

    // Strapi unique-constraint violation → treat as "already subscribed"
    if (
      !res.ok &&
      (res.status === 400 || res.status === 422) &&
      json?.error
    ) {
      const errMsg = String(
        (json.error as Record<string, unknown>)?.message ?? ""
      ).toLowerCase();
      if (errMsg.includes("unique") || errMsg.includes("already")) {
        return NextResponse.json(
          { value: false, data: { message: "already exist" } },
          { status: 200 }
        );
      }
      return NextResponse.json({ value: false, data: errMsg }, { status: 200 });
    }

    if (!res.ok) {
      console.error("[subscribe] Strapi error", res.status, json);
      return NextResponse.json({ value: false, data: "Upstream error" }, { status: 502 });
    }

    // Success
    return NextResponse.json({ value: true }, { status: 200 });
  } catch (e) {
    console.error("[subscribe proxy]", e);
    return NextResponse.json({ value: false, data: "Network error" }, { status: 502 });
  }
}
