import { NextRequest, NextResponse } from "next/server";
import type { UserAnswers, AnalysisResult } from "@/lib/types";
import { analysisCache, buildCacheKey } from "@/lib/queryCache";
import { checkRateLimit, extractIp } from "@/lib/rateLimit";

// Typed mirror of the upstream snake_case API schema.
interface RawMilestone { milestone: string; actions: string[]; success_indicator: string; }
interface RawPath {
  title: string; type: string; fit: number;
  revenue_range: string; time_to_first_dollar: string;
  why_this_works: string; biggest_obstacle: string;
  risk_level: string; effort_level: string;
}
interface RawApiResponse {
  profile: {
    sector: string; seniority: string; transferable_skills: string[];
    primary_goal: string; core_anxiety: string; profile_summary: string;
  };
  paths: RawPath[];
  plan: { first_move: string; warning: string; day30: RawMilestone; day60: RawMilestone; day90: RawMilestone; };
  happiness_advantage: {
    attribution: string;
    glass_half_full: { headline: string; wins: string[] };
    falling_up: string;
    daily_practice: { day30: string; day60: string; day90: string };
    tetris_effect: { prompt: string; example: string };
  };
}

// The external API returns snake_case; map to the camelCase types the UI expects.
function mapApiResponse(raw: RawApiResponse): AnalysisResult {
  return {
    profile: {
      sector:             raw.profile.sector,
      seniority:          raw.profile.seniority,
      transferableSkills: raw.profile.transferable_skills,
      primaryGoal:        raw.profile.primary_goal,
      coreAnxiety:        raw.profile.core_anxiety,
      profileSummary:     raw.profile.profile_summary,
    },
    paths: raw.paths.map(p => ({
      name:               p.title,
      type:               p.type,
      fit:                p.fit,
      revenueRange:       p.revenue_range,
      timeToFirstRevenue: p.time_to_first_dollar,
      whyThisWorks:       p.why_this_works,
      biggestObstacle:    p.biggest_obstacle,
      riskLevel:          p.risk_level as "Low" | "Medium" | "High",
      effortLevel:        p.effort_level as "Low" | "Medium" | "High",
    })),
    plan: {
      firstMove: raw.plan.first_move,
      warning:   raw.plan.warning,
      day30: { milestone: raw.plan.day30.milestone, actions: raw.plan.day30.actions, metric: raw.plan.day30.success_indicator },
      day60: { milestone: raw.plan.day60.milestone, actions: raw.plan.day60.actions, metric: raw.plan.day60.success_indicator },
      day90: { milestone: raw.plan.day90.milestone, actions: raw.plan.day90.actions, metric: raw.plan.day90.success_indicator },
    },
    happinessAdvantage: {
      attribution:   raw.happiness_advantage.attribution,
      glassHalfFull: {
        headline: raw.happiness_advantage.glass_half_full.headline,
        wins:     raw.happiness_advantage.glass_half_full.wins,
      },
      fallingUp:    raw.happiness_advantage.falling_up,
      dailyPractice: {
        day30: raw.happiness_advantage.daily_practice.day30,
        day60: raw.happiness_advantage.daily_practice.day60,
        day90: raw.happiness_advantage.daily_practice.day90,
      },
      tetrisEffect: {
        prompt:  raw.happiness_advantage.tetris_effect.prompt,
        example: raw.happiness_advantage.tetris_effect.example,
      },
    },
  };
}

/**
 * POST /api/analyze
 *
 * Three runtime modes (set via env vars):
 *
 * 1. AGENTS_API_URL set  → forward to external private API (separate repo/service)
 * 2. @glitched/agents installed → run pipeline locally (private npm package)
 * 3. Neither → 503 with clear message (prevents silent failures)
 *
 * NEXT_PUBLIC_USE_MOCK=true is handled entirely client-side in Glitched.tsx
 * and never reaches this route.
 */
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
    // ── Rate limit check (before any expensive work) ──────────
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

    if (!captchaToken || !(await verifyCaptcha(captchaToken))) {
      return NextResponse.json({ error: "CAPTCHA verification failed." }, { status: 403 });
    }

    if (!answers.role || !answers.want || !answers.fear) {
      return NextResponse.json({ error: "Missing answers" }, { status: 400 });
    }

    const MAX_FIELD = 600;
    const MIN_FIELD = 10;
    const fields = { role: answers.role, want: answers.want, fear: answers.fear } as const;
    for (const [key, val] of Object.entries(fields)) {
      const trimmed = val.trim();
      if (trimmed.length < MIN_FIELD) {
        return NextResponse.json({ error: `Answer too short: ${key}` }, { status: 400 });
      }
      if (trimmed.length > MAX_FIELD) {
        return NextResponse.json({ error: `Answer too long: ${key}` }, { status: 400 });
      }
    }

    // Detect all-identical answers (likely bot/junk submission)
    const trimmedRole = answers.role.trim();
    const trimmedWant = answers.want.trim();
    const trimmedFear = answers.fear.trim();
    if (trimmedRole === trimmedWant && trimmedWant === trimmedFear) {
      return NextResponse.json({ error: "Invalid answers" }, { status: 400 });
    }

    const validAnswers: UserAnswers = {
      role: trimmedRole,
      want: trimmedWant,
      fear: trimmedFear,
    };

    // ── Content cache check (after CAPTCHA, before pipeline) ──
    const cacheKey = buildCacheKey(validAnswers);
    const cached = analysisCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
    }

    // ── Mode 1: Forward to external private API ──────────────
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

      if (!upstream.ok) {
        throw new Error(`Upstream API error: ${upstream.status}`);
      }

      const result = mapApiResponse((await upstream.json()) as RawApiResponse);
      analysisCache.set(cacheKey, result);
      return NextResponse.json(result, { headers: { "X-Cache": "MISS" } });
    }

    // ── Mode 2: Local agents package (private npm) ───────────
    // The @glitched/agents package ships with the private backend repo.
    // Use eval to prevent Turbopack/Webpack from trying to statically bundle it.
    // When the package is installed (e.g. via npm install ../glitched-agents),
    // this resolves at runtime. When not installed, we fall through to the 503.
    try {
      // Dynamic import prevents Turbopack from statically analyzing @glitched/agents.
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
          importErr.message.includes("Failed to fetch dynamically imported module") ||
          ("code" in importErr && (importErr as NodeJS.ErrnoException).code === "MODULE_NOT_FOUND"));

      if (!isModuleNotFound) throw importErr;

      // Module not installed — neither mode is configured
      return NextResponse.json(
        {
          error:
            "Agent pipeline not configured. Set AGENTS_API_URL to point to " +
            "the private API service, or install @glitched/agents locally.",
        },
        { status: 503 }
      );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[analyze]", message);
    return NextResponse.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 }
    );
  }
}
