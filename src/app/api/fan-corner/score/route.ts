import { NextResponse } from "next/server";

import { strapiUpdateFormScore } from "@/lib/server/strapiForms";

/** @deprecated Prefer `PATCH /api/forms` with `{ _id, score }` — same Strapi update. */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const b = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const _id = typeof b._id === "string" ? b._id.trim() : "";
  const score = typeof b.score === "string" ? b.score.trim() : String(b.score ?? "");
  if (!_id || score === "") {
    return NextResponse.json({ ok: false, error: "Missing _id or score" }, { status: 400 });
  }

  const result = await strapiUpdateFormScore(_id, score);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, raw: result.raw },
      { status: result.status },
    );
  }
  return NextResponse.json({ ok: true, raw: result.raw });
}
