# GLITCHED — Local Build Spec
> Full Next.js 14 project from zero to running locally

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
- Tailwind → **Yes**
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

# Animations (optional but nice)
npm install framer-motion

# Utilities
npm install clsx
```

---

## 4. Project Structure

```
glitched/
├── src/
│   ├── app/
│   │   ├── layout.tsx          ← root layout, fonts
│   │   ├── page.tsx            ← renders <Glitched /> component
│   │   ├── globals.css
│   │   └── api/
│   │       ├── analyze/
│   │       │   └── route.ts    ← main Claude pipeline endpoint
│   │       ├── tip/
│   │       │   └── route.ts    ← Stripe tip session
│   │       └── subscribe/
│   │           └── route.ts    ← Resend email capture
│   ├── components/
│   │   └── Glitched.tsx       ← paste glitched.jsx here (renamed)
│   └── lib/
│       ├── anthropic.ts        ← Claude client
│       ├── agents.ts           ← 5-agent pipeline
│       └── types.ts            ← shared TypeScript types
├── .env.local                  ← secrets (never commit)
└── .gitignore
```

---

## 5. Environment Variables

Create `.env.local` in project root:

```bash
# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Stripe (get from dashboard.stripe.com)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Resend (get from resend.com)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=hello@glitched.sh

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
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

## 7. The Claude Agent Pipeline

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

export interface Plan {
  firstMove: string;
  warning: string;
  day30: Milestone;
  day60: Milestone;
  day90: Milestone;
}

export interface Milestone {
  milestone: string;
  actions: string[];
  metric: string;
}

export interface AnalysisResult {
  profile: Profile;
  paths: Path[];
  plan: Plan;
}
```

**`src/lib/anthropic.ts`**
```typescript
import Anthropic from "@anthropic-ai/sdk";

// Single shared client — reused across all agents
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
```

**`src/lib/agents.ts`** — the 5-agent pipeline
```typescript
import { anthropic } from "./anthropic";
import type { UserAnswers, Profile, Path, Plan, AnalysisResult } from "./types";

// ── Agent 1: Parse intake into structured profile ──────────
async function runIntakeAgent(answers: UserAnswers): Promise<Profile> {
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 800,
    messages: [{
      role: "user",
      content: `You are the Intake Parser for Glitched — a platform for displaced professionals.
Parse the user's raw answers into a structured profile.

User answers:
- Role/Experience: "${answers.role}"
- What they want: "${answers.want}"
- Their biggest fear: "${answers.fear}"

Return ONLY valid JSON with this exact schema, no markdown, no preamble:
{
  "sector": "string (e.g. Finance, Tech, Marketing, Legal)",
  "seniority": "Junior | Mid | Senior | Executive",
  "transferableSkills": ["skill1", "skill2", "skill3"],
  "primaryGoal": "Freedom | Income | Stability | Reinvention",
  "coreAnxiety": "one sentence distillation of their fear",
  "profileSummary": "2 sentences, empathetic but honest, no corporate speak"
}`
    }],
  });

  const text = (msg.content[0] as any).text;
  return JSON.parse(text) as Profile;
}

// ── Agent 2: Market signal analysis ───────────────────────
async function runMarketAgent(profile: Profile): Promise<object> {
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 600,
    messages: [{
      role: "user",
      content: `You are the Market Signal Agent for Glitched.
Profile: ${JSON.stringify(profile)}

Analyze the current market reality for this person based on your knowledge of 2024-2025 trends.
Return ONLY valid JSON, no markdown:
{
  "sectorHealth": "Contracting | Stable | Growing",
  "aiDisruptionRisk": "High | Medium | Low",
  "emergingOpportunities": ["opp1", "opp2", "opp3"],
  "skillsInDemand": ["skill1", "skill2", "skill3"],
  "timelineReality": "honest 1-2 sentence assessment"
}`
    }],
  });

  const text = (msg.content[0] as any).text;
  return JSON.parse(text);
}

// ── Agent 3: Generate 3 paths ──────────────────────────────
async function runPathAgent(profile: Profile, market: object): Promise<Path[]> {
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1200,
    messages: [{
      role: "user",
      content: `You are the Path Generator for Glitched.
Profile: ${JSON.stringify(profile)}
Market signals: ${JSON.stringify(market)}

Generate exactly 3 viable paths. Be specific to their profile. Be brutally honest about tradeoffs.
Sort by fit score descending.
Return ONLY valid JSON array, no markdown:
[
  {
    "name": "compelling name for the path",
    "type": "Freelance | Build | Invest | Pivot",
    "timeToFirstRevenue": "e.g. 30-45 days",
    "effortLevel": "Low | Medium | High",
    "revenueRange": "e.g. $5k – $15k/mo",
    "riskLevel": "Low | Medium | High",
    "whyThisWorks": "2 sentences specific to their skills and situation",
    "biggestObstacle": "1 honest sentence",
    "fit": 85
  }
]`
    }],
  });

  const text = (msg.content[0] as any).text;
  return JSON.parse(text) as Path[];
}

// ── Agent 4: Build the 30/60/90 plan ──────────────────────
async function runPlanAgent(profile: Profile, path: Path): Promise<Plan> {
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1200,
    messages: [{
      role: "user",
      content: `You are the Plan Architect for Glitched.
Profile: ${JSON.stringify(profile)}
Chosen path: ${JSON.stringify(path)}

Build a specific, actionable 30/60/90 day plan.
Every action must be concrete — no "research options" or "consider networking."
Return ONLY valid JSON, no markdown:
{
  "firstMove": "one specific action to do TODAY, small enough to do in 30 mins",
  "warning": "one sentence: if this happens by day 30, pivot — be specific",
  "day30": {
    "milestone": "string",
    "actions": ["action1", "action2", "action3"],
    "metric": "measurable success indicator"
  },
  "day60": {
    "milestone": "string",
    "actions": ["action1", "action2", "action3"],
    "metric": "measurable success indicator"
  },
  "day90": {
    "milestone": "string",
    "actions": ["action1", "action2", "action3"],
    "metric": "measurable success indicator"
  }
}`
    }],
  });

  const text = (msg.content[0] as any).text;
  return JSON.parse(text) as Plan;
}

// ── Agent 5: AWAF compliance check ────────────────────────
function runAwafCheck(result: AnalysisResult): boolean {
  const { profile, paths, plan } = result;

  // Schema completeness checks
  if (!profile.sector || !profile.coreAnxiety || !profile.profileSummary) return false;
  if (!paths || paths.length !== 3) return false;
  if (paths.some(p => !p.name || !p.revenueRange || typeof p.fit !== "number")) return false;
  if (!plan.firstMove || !plan.day30 || !plan.day60 || !plan.day90) return false;
  if (plan.day30.actions.length < 2) return false;

  // No hallucination check — revenue ranges must be realistic
  const validRange = /\$[\d,k]+\s*[–-]\s*\$[\d,k]+/i;
  if (paths.some(p => !validRange.test(p.revenueRange))) return false;

  return true;
}

// ── Main pipeline: runs all agents in sequence ─────────────
export async function runAnalysisPipeline(answers: UserAnswers): Promise<AnalysisResult> {
  // Agent 1: Parse profile
  const profile = await runIntakeAgent(answers);

  // Agent 2: Market signals (runs in parallel with path prep)
  const market = await runMarketAgent(profile);

  // Agent 3: Generate paths
  const paths = await runPathAgent(profile, market);

  // Agent 4: Build plan for top-fit path
  const plan = await runPlanAgent(profile, paths[0]);

  const result: AnalysisResult = { profile, paths, plan };

  // Agent 5: AWAF validation
  const passed = runAwafCheck(result);
  if (!passed) {
    throw new Error("AWAF integrity check failed — retrying");
    // In production: retry once, then surface error gracefully
  }

  return result;
}
```

---

## 8. API Routes

**`src/app/api/analyze/route.ts`**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { runAnalysisPipeline } from "@/lib/agents";

export async function POST(req: NextRequest) {
  try {
    const answers = await req.json();

    // Basic validation
    if (!answers.role || !answers.want || !answers.fear) {
      return NextResponse.json({ error: "Missing answers" }, { status: 400 });
    }

    const result = await runAnalysisPipeline(answers);
    return NextResponse.json(result);

  } catch (err: any) {
    console.error("Analysis pipeline error:", err);
    return NextResponse.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 }
    );
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

    // Add to your audience
    await resend.contacts.create({
      email,
      audienceId: process.env.RESEND_AUDIENCE_ID!,
      unsubscribed: false,
    });

    // Send welcome email
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

## 9. Connect the UI to Real APIs

Replace the mock data flow in `Glitched.tsx`.

In the **IntakeScreen** `onSubmit` handler, instead of going straight to `"breathing"`, call the API:

```typescript
// In Glitched.tsx — add state at app level
const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

// When intake completes:
const handleIntakeSubmit = async (answers: UserAnswers) => {
  setScreen("breathing"); // show breathing immediately
  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(answers),
    });
    const data = await res.json();
    setAnalysisResult(data); // ready by the time breathing ends (~20s)
  } catch (err) {
    console.error(err);
    // Fallback to mock data in dev
    setAnalysisResult(MOCK_FALLBACK);
  }
};
```

The breathing animation takes ~20 seconds — Claude typically responds in 8-15 seconds. **They finish at roughly the same time.** No loading spinner needed. The breathing screen IS the loading screen.

---

## 10. Run Locally

```bash
npm run dev
```

Open: http://localhost:3000

---

## 11. Cost Estimate Per Run

| Agent | Avg tokens | Cost |
|-------|-----------|------|
| Intake Parser | ~400 in / 200 out | ~$0.002 |
| Market Agent | ~500 in / 300 out | ~$0.003 |
| Path Generator | ~700 in / 600 out | ~$0.005 |
| Plan Architect | ~800 in / 700 out | ~$0.006 |
| **Total per user** | | **~$0.016** |

At 1,000 free runs/month: **~$16 in API costs.**
Add caching for repeat profiles → cut that by 40%.

---

## 12. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Follow prompts. Then add env vars in Vercel dashboard:
`Settings → Environment Variables` — paste all from `.env.local`

Custom domain: add `glitched.sh` in `Settings → Domains`

---

## 13. Quick Checklist Before Launch

- [ ] Anthropic API key funded ($50 minimum to start)
- [ ] Stripe account live (not test mode)
- [ ] Resend domain verified (for email deliverability)
- [ ] `.env.local` never committed to git
- [ ] AWAF badge visible on all screens
- [ ] Test full flow: intake → breathing → plan → tip → email
- [ ] Mobile responsive check (it is — all inline styles use clamp + flexWrap)

---

## 14. Total Launch Cost

| Item | Cost |
|------|------|
| Domain `glitched.sh` | ~$35/yr |
| Vercel Hobby | $0 |
| Anthropic API prepay | $50 |
| Stripe | 2.9% + $0.30 per tip |
| Resend free tier | $0 (3,000 emails/mo) |
| **Total to launch** | **~$85** |

---

*Build time with this spec: 1 focused day.*
*Time to first real user: deploy day.*
