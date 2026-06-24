import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const schema = z.object({
  email: z.string().trim().email(),
  source: z.string().trim().max(120).optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "Lead capture isn't configured yet." },
      { status: 503 },
    );
  }

  const { error } = await supabase.from("leads").insert({
    email: parsed.data.email,
    source: parsed.data.source ?? null,
  });

  // Ignore duplicate emails (unique constraint) — treat as success.
  if (error && error.code !== "23505") {
    console.error("leads insert error:", error);
    return NextResponse.json({ error: "Could not save your email." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
