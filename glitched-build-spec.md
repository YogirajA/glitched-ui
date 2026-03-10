# GLITCHED — Local Build Spec
> Full Next.js 14 project from zero to running locally

---

## Feature Status

| Feature | Status |
|---------|--------|
| Landing → Intake → Breathing → Plan flow | ✅ Done |
| 5-agent Claude pipeline (`@glitched/agents`) | ✅ Done |
| Dual theme system (Dark / Light / Nexus) | ✅ Done |
| Cloudflare Turnstile bot protection | ✅ Done |
| Rate limiting (sliding window, per IP) | ✅ Done |
| Query result cache (SHA-256 keyed, LRU/TTL) | ✅ Done |
| Tip jar (Stripe one-time payment) | ✅ Done |
| Email capture + welcome email (Resend) | ✅ Done |
| Print my 30/60/90 plan | ✅ Done |
| Keep my plan active (30-day refresh subscription) | 🔜 Coming soon |
| Feature request / feedback | 🔜 Coming soon |

---

## 1. Prerequisites

```bash
node --version   # needs 18.17+
npm --version    # needs 9+
```

If not installed: https://nodejs.org (download LTS)

---

## 2. Scaffold the Project

```bash
npx create-next-app@latest glitched \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd glitched
```

When prompted:
- TypeScript → **Yes**
- Tailwind → **Yes** (installed but not used — UI uses inline styles only)
- App Router → **Yes**
- src/ directory → **Yes**

---

## 3. Install Dependencies

```bash
# Core
npm install @anthropic-ai/sdk

# Email
npm install resend

# Payments
npm install stripe @stripe/stripe-js
```

> Note: No framer-motion or CSS modules. All animation is CSS keyframes via `<style>` tags.
> Cloudflare Turnstile is loaded via CDN script tag — no npm package needed.

---

## 4. Project Structure

```
glitched/
├── src/
│   ├── app/
│   │   ├── layout.tsx              ← root layout, fonts
│   │   ├── page.tsx                ← renders <Glitched />
│   │   ├── globals.css
│   │   └── api/
│   │       ├── analyze/
│   │       │   └── route.ts        ← rate limit → CAPTCHA → cache → pipeline
│   │       ├── tip/
│   │       │   └── route.ts        ← Stripe tip session
│   │       └── subscribe/
│   │           └── route.ts        ← Resend email capture
│   ├── components/
│   │   └── Glitched.tsx            ← full UI, theme system, all 4 screens
│   └── lib/
│       ├── types.ts                ← shared TypeScript types
│       ├── queryCache.ts           ← in-memory TTL + LRU cache
│       └── rateLimit.ts            ← sliding-window IP rate limiter
├── .env.local                      ← secrets (never commit)
└── .gitignore
```

> `src/lib/agents.ts` and `src/lib/anthropic.ts` are part of the private
> `@glitched/agents` npm package. The analyze route imports from that package
> at runtime (or forwards to an external API service — see Section 8).

---

## 5. Environment Variables

Create `.env.local` in project root:

```bash
# Agent pipeline secret (used when AGENTS_API_URL is set)
AGENTS_API_SECRET=thisissecret

# Cloudflare Turnstile (bot/DDoS protection on /api/analyze)
# Create a site at dash.cloudflare.com → Security → Turnstile
# Add localhost + your production domain to allowed domains
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAA...   # public — safe for client
TURNSTILE_SECRET_KEY=0x4AAAAAAA...              # server only — never NEXT_PUBLIC_

# Stripe (get from dashboard.stripe.com)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Resend (get from resend.com)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=hello@glitched.sh
RESEND_AUDIENCE_ID=...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Rate limiting (server-side, per IP, sliding window)
RATE_LIMIT_MAX=5         # max requests per window (default: 5)
RATE_LIMIT_WINDOW_S=3600 # window size in seconds (default: 3600 = 1 hour)

# Query result cache (in-memory, per instance)
CACHE_TTL_HOURS=24       # how long to cache a result (default: 24)
CACHE_MAX_ENTRIES=500    # max cached queries before LRU eviction (default: 500)

# ── API MODE — controls where the analysis pipeline runs ──────────────────
# Option 1 (default): Run pipeline via @glitched/agents local package.
#   Install with: npm install ../glitched-agents
#   Leave AGENTS_API_URL and NEXT_PUBLIC_USE_MOCK unset.

# Option 2: Forward to an external private API service.
# AGENTS_API_URL=https://api.glitched.sh

# Option 3: Use mock data (dev/testing — no API calls made).
# NEXT_PUBLIC_USE_MOCK=true
```

> ⚠️ Add `.env.local` to `.gitignore` — it's there by default with create-next-app

---

## 6. Wire the Component

**`src/app/page.tsx`**
```tsx
import Glitched from "@/components/Glitched";

export default function Home() {
  return <Glitched />;
}
```

**`src/app/layout.tsx`** — add Google Fonts
```tsx
import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "Glitched — Your Exit Protocol",
  description: "You didn't fail. The system did. Three questions. A real plan.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

---

## 7. Shared Types

**`src/lib/types.ts`**
```typescript
export interface UserAnswers {
  role: string;
  want: string;
  fear: string;
}

export interface Profile {
  sector: string;
  seniority: string;
  transferableSkills: string[];
  primaryGoal: string;
  coreAnxiety: string;
  profileSummary: string;
}

export interface Path {
  name: string;
  type: string;
  timeToFirstRevenue: string;
  effortLevel: "Low" | "Medium" | "High";
  revenueRange: string;
  riskLevel: "Low" | "Medium" | "High";
  whyThisWorks: string;
  biggestObstacle: string;
  fit: number;
}

export interface Milestone {
  milestone: string;
  actions: string[];
  metric: string;
}

export interface Plan {
  firstMove: string;
  warning: string;
  day30: Milestone;
  day60: Milestone;
  day90: Milestone;
}

export interface HappinessAdvantage {
  attribution: string;
  glassHalfFull: {
    headline: string;
    wins: string[];
  };
  fallingUp: string;
  dailyPractice: {
    day30: string;
    day60: string;
    day90: string;
  };
  tetrisEffect: {
    prompt: string;
    example: string;
  };
}

export interface AnalysisResult {
  profile: Profile;
  paths: Path[];
  plan: Plan;
  happinessAdvantage: HappinessAdvantage;
}
```

---

## 8. Rate Limiting & Caching

These two files are zero-infrastructure — pure in-memory, no Redis, no Upstash.

> **Known tradeoff**: state resets on cold starts and is not shared across
> concurrent Vercel instances. Acceptable for a serverless deploy.

**`src/lib/rateLimit.ts`**
```typescript
type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

function getEnvInt(key: string, fallback: number): number {
  const val = process.env[key];
  if (!val) return fallback;
  const n = parseInt(val, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const ipTimestamps = new Map<string, number[]>();

export function checkRateLimit(ip: string): RateLimitResult {
  const max      = getEnvInt('RATE_LIMIT_MAX', 5);
  const windowS  = getEnvInt('RATE_LIMIT_WINDOW_S', 3600);

  const nowS = Math.floor(Date.now() / 1000);
  const windowStart = nowS - windowS;

  const existing = ipTimestamps.get(ip) ?? [];
  const inWindow = existing.filter(ts => ts > windowStart);

  if (inWindow.length >= max) {
    const oldest = Math.min(...inWindow);
    return {
      allowed: false,
      retryAfterSeconds: Math.max(oldest + windowS - nowS, 1),
    };
  }

  inWindow.push(nowS);
  ipTimestamps.set(ip, inWindow);

  // Cleanup IPs with no timestamps in the current window
  for (const [storedIp, timestamps] of ipTimestamps) {
    if (timestamps.every(ts => ts <= windowStart)) ipTimestamps.delete(storedIp);
  }

  return { allowed: true };
}

export function extractIp(req: { headers: { get(name: string): string | null } }): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}
```

**`src/lib/queryCache.ts`**
```typescript
import { createHash } from 'crypto';
import type { UserAnswers, AnalysisResult } from '@/lib/types';

interface CacheEntry<T> {
  value: T;
  expiresAt: number; // Unix ms
}

class TtlCache<T> {
  private readonly store = new Map<string, CacheEntry<T>>();
  private readonly ttlMs: number;
  private readonly maxSize: number;

  constructor(ttlMs: number, maxSize: number) {
    this.ttlMs = ttlMs;
    this.maxSize = maxSize;
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: T): void {
    if (this.store.size >= this.maxSize && !this.store.has(key)) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) this.store.delete(oldestKey);
    }
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }
}

function getEnvInt(key: string, fallback: number): number {
  const val = process.env[key];
  if (!val) return fallback;
  const n = parseInt(val, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const analysisCache = new TtlCache<AnalysisResult>(
  getEnvInt('CACHE_TTL_HOURS', 24) * 60 * 60 * 1000,
  getEnvInt('CACHE_MAX_ENTRIES', 500)
);

export function buildCacheKey(answers: UserAnswers): string {
  const normalized = [answers.role, answers.want, answers.fear]
    .map(s => s.trim().toLowerCase())
    .join('|');
  return createHash('sha256').update(normalized).digest('hex');
}
```

---

## 9. API Routes

**`src/app/api/analyze/route.ts`**

Request pipeline order: **Rate Limit → CAPTCHA → Content Cache → Agent Pipeline → Cache Store**

```typescript
import { NextRequest, NextResponse } from "next/server";
import type { UserAnswers, AnalysisResult } from "@/lib/types";
import { analysisCache, buildCacheKey } from "@/lib/queryCache";
import { checkRateLimit, extractIp } from "@/lib/rateLimit";

export const maxDuration = 60; // seconds — allow up to 60s for the multi-agent pipeline

async function verifyCaptcha(token: string): Promise<boolean> {
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret: process.env.TURNSTILE_SECRET_KEY,
      response: token,
    }),
  });
  const data = (await res.json()) as { success: boolean };
  return data.success;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limit (before any expensive work)
    const ip = extractIp(req);
    const rateLimitResult = checkRateLimit(ip);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many requests", retryAfter: rateLimitResult.retryAfterSeconds },
        { status: 429, headers: { "Retry-After": String(rateLimitResult.retryAfterSeconds) } }
      );
    }

    const body = (await req.json()) as Partial<UserAnswers> & { captchaToken?: string };
    const { captchaToken, ...answers } = body;

    // 2. CAPTCHA (before cache — bots shouldn't probe the cache for free)
    if (!captchaToken || !(await verifyCaptcha(captchaToken))) {
      return NextResponse.json({ error: "CAPTCHA verification failed." }, { status: 403 });
    }

    if (!answers.role || !answers.want || !answers.fear) {
      return NextResponse.json({ error: "Missing answers" }, { status: 400 });
    }

    const validAnswers: UserAnswers = {
      role: answers.role,
      want: answers.want,
      fear: answers.fear,
    };

    // 3. Content cache
    const cacheKey = buildCacheKey(validAnswers);
    const cached = analysisCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
    }

    // 4a. Mode: Forward to external private API (AGENTS_API_URL set)
    const agentsApiUrl = process.env.AGENTS_API_URL;
    if (agentsApiUrl) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 55_000);
      let upstream: Response;
      try {
        upstream = await fetch(`${agentsApiUrl}/analyze`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(process.env.AGENTS_API_SECRET
              ? { "x-api-key": process.env.AGENTS_API_SECRET }
              : {}),
          },
          body: JSON.stringify(validAnswers),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }

      if (!upstream.ok) throw new Error(`Upstream API error: ${upstream.status}`);
      const result = (await upstream.json()) as AnalysisResult;
      analysisCache.set(cacheKey, result);
      return NextResponse.json(result, { headers: { "X-Cache": "MISS" } });
    }

    // 4b. Mode: Local @glitched/agents package
    try {
      // eslint-disable-next-line no-new-func
      const agents = (await new Function('return import("@glitched/agents")')()) as {
        runAnalysisPipeline: (a: UserAnswers) => Promise<AnalysisResult>;
      };
      const result = await agents.runAnalysisPipeline(validAnswers);
      analysisCache.set(cacheKey, result);
      return NextResponse.json(result, { headers: { "X-Cache": "MISS" } });
    } catch (importErr: unknown) {
      const isModuleNotFound =
        importErr instanceof Error &&
        (importErr.message.includes("Cannot find module") ||
          importErr.message.includes("Cannot find package") ||
          ("code" in importErr && (importErr as NodeJS.ErrnoException).code === "MODULE_NOT_FOUND"));

      if (!isModuleNotFound) throw importErr;

      return NextResponse.json(
        { error: "Agent pipeline not configured. Set AGENTS_API_URL or install @glitched/agents." },
        { status: 503 }
      );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[analyze]", message);
    return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 500 });
  }
}
```

**`src/app/api/subscribe/route.ts`**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    await resend.contacts.create({
      email,
      audienceId: process.env.RESEND_AUDIENCE_ID!,
      unsubscribed: false,
    });

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
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

  } catch (err) {
    console.error("Subscribe error:", err);
    return NextResponse.json({ error: "Subscribe failed" }, { status: 500 });
  }
}
```

**`src/app/api/tip/route.ts`**
```typescript
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { amount } = await req.json(); // amount in cents e.g. 1000 = $10

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: "Support Glitched",
            description: "Keeps the plans honest and the tool free.",
          },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}?tipped=true`,
      cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}?tipped=false`,
    });

    return NextResponse.json({ url: session.url });

  } catch (err) {
    console.error("Stripe error:", err);
    return NextResponse.json({ error: "Payment failed" }, { status: 500 });
  }
}
```

---

## 10. The Agent Pipeline (Private Package)

The 5-agent Claude pipeline lives in the private `@glitched/agents` npm package
(separate repo). The pipeline is:

```
IntakeAgent → MarketAgent → PathAgent → PlanAgent → AWAFCheck
```

To use locally, install the package from its directory:
```bash
npm install ../glitched-agents
```

Or set `AGENTS_API_URL` to point to a deployed instance of the private API.

For development/testing without the package, set `NEXT_PUBLIC_USE_MOCK=true` —
the breathing screen still plays, and mock data is returned client-side.

Agent rules (enforced in the private package):
- Model is always `claude-sonnet-4-20250514` — never change this
- All agents return strict JSON only — no markdown, no preamble
- AWAFCheck validates schema completeness before any result renders
- Agent prompts are core IP — never log to console in production

---

## 11. Connect the UI to Real APIs

`Glitched.tsx` handles three modes automatically via env vars. The intake submit
flow sends `captchaToken` alongside answers:

```typescript
// In Glitched component — key state
const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
const [isSubmitting, setIsSubmitting] = useState(false);

// handleIntakeSubmit — called when user completes 3 questions
const handleIntakeSubmit = async (answers: UserAnswers, captchaToken: string) => {
  if (isSubmitting) return;           // guard against double-submit
  setIsSubmitting(true);
  navigateTo("breathing");            // show breathing immediately
  setBreathingDone(false);

  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...answers, captchaToken }),
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data = await res.json();
    setAnalysisResult(data);          // ready by the time breathing ends (~20s)
  } catch {
    navigateTo("error");
  } finally {
    setIsSubmitting(false);
  }
};

// handleStartOver — called from plan screen "← Start over" button
const handleStartOver = () => {
  setAnalysisResult(null);
  setBreathingDone(false);
  setIsSubmitting(false);
  navigateTo("landing");              // smooth 280ms fade, no page refresh
};
```

The breathing animation takes ~20 seconds — Claude typically responds in 8-15 seconds.
**They finish at roughly the same time.** No loading spinner needed.
The breathing screen IS the loading screen.

---

## 12. Run Locally

```bash
npm run dev
```

Open: http://localhost:3000

---

## 13. Cost Estimate Per Run

| Agent | Avg tokens | Cost |
|-------|-----------|------|
| Intake Parser | ~400 in / 200 out | ~$0.002 |
| Market Agent | ~500 in / 300 out | ~$0.003 |
| Path Generator | ~700 in / 600 out | ~$0.005 |
| Plan Architect | ~800 in / 700 out | ~$0.006 |
| **Total per user** | | **~$0.016** |

At 1,000 free runs/month: **~$16 in API costs.**
Content cache (24h TTL, SHA-256 keyed on inputs) eliminates repeat costs.
Rate limiter (5 req/IP/hr) blocks flooding before it reaches the pipeline.

---

## 14. Deploy to Railway

1. Push repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
3. Select the `glitched-ui` repo
4. Railway auto-detects Next.js and builds it

**Add env vars:**
Railway dashboard → your service → Variables → add all from `.env.local`

**Note your Railway URL** (e.g. `your-app.up.railway.app`) — you'll need it for DNS.

---

## 14a. Custom Domain — DNSimple + Railway

**Step 1 — Add DNS records in DNSimple:**

| Type | Name | Content |
|------|------|---------|
| ALIAS | *(empty)* | `your-app.up.railway.app` |
| CNAME | `www` | `your-app.up.railway.app` |

**Step 2 — Add both domains in Railway:**

Service → Settings → Networking → Custom Domain → add:
- `glitched.sh`
- `www.glitched.sh`

Railway auto-provisions SSL for both.

**Step 3 — www redirect (already in `next.config.ts`):**

`www.glitched.sh` 301-redirects to `glitched.sh` via Next.js. DNS alone can't
do this cleanly — the redirect lives in the app so the canonical is enforced at
the HTTP level with the correct status code for SEO.

Result:
- `https://glitched.sh` — canonical ✅
- `https://www.glitched.sh` → 301 → `https://glitched.sh` ✅
- SSL on both ✅

---

## 15. Print My 30/60/90 Plan

The plan screen includes a **"⎙ Print my plan"** button in the footer.

**Behavior:**
- Clicking the button switches to the Plan tab (if the user is on Paths), waits 80ms for the DOM to settle, then calls `window.print()`
- Implemented via `data-testid="print-btn"` in `PlanScreen` footer

**Print CSS** (`@media print` in `GlobalStyle`):

Elements hidden during print:
- All screens except `[data-testid="plan-screen"]`
- `[data-testid="theme-toggle"]` — not relevant on paper
- `[data-testid="start-over-btn"]` — not relevant on paper
- `[data-testid="tip-jar"]` — no payments on paper
- `[data-testid="email-input"]`, `[data-testid="email-submit"]`, `[data-testid="email-success"]`
- `[data-testid="print-btn"]` itself
- `[data-print-hide="true"]` — tabs nav, sticky path banner (used in Glitched.tsx to mark elements that are screen-only)

Print styles:
- `body` forced to white background, dark text, 12pt
- `[data-testid="path-card"]` gets `break-inside: avoid` and a 1px `#ccc` border
- All animations and transitions disabled

**`data-print-hide="true"` usage in `Glitched.tsx`:**
```tsx
// Tabs nav — redundant on paper
<div data-print-hide="true" style={{ display: "flex", ... }}>

// Sticky "active path" banner + "change path" button — interactive, not for print
<div data-print-hide="true" style={{ position: "sticky", ... }}>
```

---

## 15a. Quick Checklist Before Launch

- [ ] Anthropic API key funded ($50 minimum to start)
- [ ] Stripe account live (not test mode)
- [ ] Resend domain verified (for email deliverability)
- [ ] Cloudflare Turnstile site created with localhost + production domain allowed
- [ ] `.env.local` never committed to git
- [ ] All env vars added to Railway dashboard
- [ ] Test full flow: intake → breathing → plan → tip → email
- [ ] Test "← Start over" returns to landing with smooth fade
- [ ] Test rate limit: 6th submission from same IP returns 429
- [ ] Test cache: same answers twice → second call returns `X-Cache: HIT` in network tab
- [ ] Mobile responsive check (all inline styles use clamp + flexWrap)

---

*Build time with this spec: 1 focused day.*
*Time to first real user: deploy day.*
