import { NextResponse } from "next/server";

import { strapiCreateFormEntry } from "@/lib/server/strapiForms";

/** @deprecated Prefer `POST /api/forms` — same Strapi `forms` collection. */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const b = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const firstName = typeof b.firstName === "string" ? b.firstName.trim() : "";
  const lastName = typeof b.lastName === "string" ? b.lastName.trim() : "";
  const email = typeof b.email === "string" ? b.email.trim() : "";
  if (!firstName || !lastName || !email) {
    return NextResponse.json({ ok: false, error: "Missing name or email" }, { status: 400 });
  }

  const result = await strapiCreateFormEntry({ firstName, lastName, email });
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, raw: result.raw },
      { status: result.status },
    );
  }
  return NextResponse.json({ ok: true, _id: result.id, id: result.id, raw: result.raw });
}
