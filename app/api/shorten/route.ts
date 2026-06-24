import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { generateCode } from "@/lib/short-code";
import { absoluteUrl } from "@/lib/site";

const schema = z.object({
  url: z
    .string()
    .trim()
    .url("Please enter a valid URL.")
    .refine((u) => /^https?:\/\//i.test(u), "Only http and https links are supported."),
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
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please enter a valid URL." },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "The URL shortener isn't configured yet. Add your Supabase credentials to enable it." },
      { status: 503 },
    );
  }

  // Insert with retry on the (rare) short-code collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const { error } = await supabase
      .from("short_urls")
      .insert({ code, target_url: parsed.data.url });

    if (!error) {
      return NextResponse.json({ code, shortUrl: absoluteUrl(`/s/${code}`) });
    }
    // 23505 = unique_violation -> try a new code; otherwise fail.
    if (error.code !== "23505") {
      console.error("shorten insert error:", error);
      return NextResponse.json({ error: "Could not create a short link." }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Could not create a short link. Try again." }, { status: 500 });
}
