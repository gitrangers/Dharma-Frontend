import { NextResponse } from "next/server";

import { strapiCreateFormEntry, strapiUpdateFormScore } from "@/lib/server/strapiForms";

/**
 * Fan corner registration — Strapi `POST /api/forms`
 * (Content-Type: `form` / API ID `forms` with fields firstName, lastName, email, score).
 */
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

/**
 * Fan corner score — Strapi `PUT /api/forms/:id` with `{ data: { score } }`.
 */
export async function PATCH(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const b = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const id =
    typeof b._id === "string" ? b._id.trim()
    : typeof b.id === "string" ? b.id.trim()
    : b.id != null ? String(b.id).trim()
    : "";
  const score = typeof b.score === "string" ? b.score.trim() : String(b.score ?? "");
  if (!id || score === "") {
    return NextResponse.json({ ok: false, error: "Missing id or score" }, { status: 400 });
  }

  const result = await strapiUpdateFormScore(id, score);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, raw: result.raw },
      { status: result.status },
    );
  }
  return NextResponse.json({ ok: true, raw: result.raw });
}
