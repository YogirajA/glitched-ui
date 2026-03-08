import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email?: string };
    const email = body.email;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 503 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Add to audience
    if (process.env.RESEND_AUDIENCE_ID) {
      await resend.contacts.create({
        email,
        audienceId: process.env.RESEND_AUDIENCE_ID,
        unsubscribed: false,
      });
    }

    // Send welcome email
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "hello@glitched.sh",
      to: email,
      subject: "You're in the system. Here's what happens next.",
      html: `
        <p>Your plan is live.</p>
        <p>In 30 days we'll refresh your 30/60/90 based on what's shifted in your sector.
        No action needed from you — we'll reach out when it's ready.</p>
        <p>In the meantime: do the first move. The small one. Tonight.</p>
        <p>— Glitched</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[subscribe]", message);
    return NextResponse.json({ error: "Subscribe failed" }, { status: 500 });
  }
}
