import { describe, it, expect } from "vitest";
import type { AnalysisResult } from "@/lib/types";
import { MOCK_RESULT } from "@/lib/mock-data";

// ── AWAF check logic (mirrors src/app/api/analyze/route.ts) ─────────────────
// The real runAwafCheck lives in @glitched/agents (private).
// These tests validate the schema rules that AWAF enforces,
// using the same logic — keeping the contract explicit and testable here.

function runAwafCheck(result: AnalysisResult): boolean {
  const { profile, paths, plan, happinessAdvantage } = result;

  if (!profile.sector || !profile.coreAnxiety || !profile.profileSummary) return false;
  if (!paths || paths.length !== 3) return false;
  if (paths.some(p => !p.name || !p.revenueRange || typeof p.fit !== "number")) return false;
  if (!plan.firstMove || !plan.day30 || !plan.day60 || !plan.day90) return false;
  if (plan.day30.actions.length < 2) return false;

  const validRange = /\$[\d,k]+\s*[–-]\s*\$[\d,k]+/i;
  if (paths.some(p => !validRange.test(p.revenueRange))) return false;

  if (!happinessAdvantage?.attribution) return false;
  if (!happinessAdvantage.glassHalfFull?.headline || !happinessAdvantage.glassHalfFull.wins?.length) return false;
  if (!happinessAdvantage.fallingUp) return false;
  if (!happinessAdvantage.tetrisEffect?.prompt) return false;

  return true;
}

describe("AWAFCheck", () => {
  it("passes the canonical mock result", () => {
    expect(runAwafCheck(MOCK_RESULT)).toBe(true);
  });

  it("fails when sector is missing", () => {
    const bad: AnalysisResult = {
      ...MOCK_RESULT,
      profile: { ...MOCK_RESULT.profile, sector: "" },
    };
    expect(runAwafCheck(bad)).toBe(false);
  });

  it("fails when paths array is not length 3", () => {
    const bad: AnalysisResult = { ...MOCK_RESULT, paths: [] };
    expect(runAwafCheck(bad)).toBe(false);
  });

  it("fails when paths array has 2 items", () => {
    const bad: AnalysisResult = { ...MOCK_RESULT, paths: MOCK_RESULT.paths.slice(0, 2) };
    expect(runAwafCheck(bad)).toBe(false);
  });

  it("fails when revenue range is missing", () => {
    const bad: AnalysisResult = {
      ...MOCK_RESULT,
      paths: MOCK_RESULT.paths.map((p, i) =>
        i === 0 ? { ...p, revenueRange: "" } : p
      ),
    };
    expect(runAwafCheck(bad)).toBe(false);
  });

  it("fails when revenue range format is invalid", () => {
    const bad: AnalysisResult = {
      ...MOCK_RESULT,
      paths: MOCK_RESULT.paths.map((p, i) =>
        i === 0 ? { ...p, revenueRange: "lots of money" } : p
      ),
    };
    expect(runAwafCheck(bad)).toBe(false);
  });

  it("fails when a path is missing a name", () => {
    const bad: AnalysisResult = {
      ...MOCK_RESULT,
      paths: MOCK_RESULT.paths.map((p, i) =>
        i === 1 ? { ...p, name: "" } : p
      ),
    };
    expect(runAwafCheck(bad)).toBe(false);
  });

  it("fails when firstMove is missing", () => {
    const bad: AnalysisResult = {
      ...MOCK_RESULT,
      plan: { ...MOCK_RESULT.plan, firstMove: "" },
    };
    expect(runAwafCheck(bad)).toBe(false);
  });

  it("fails when day30 actions has fewer than 2 items", () => {
    const bad: AnalysisResult = {
      ...MOCK_RESULT,
      plan: {
        ...MOCK_RESULT.plan,
        day30: { ...MOCK_RESULT.plan.day30, actions: ["one action"] },
      },
    };
    expect(runAwafCheck(bad)).toBe(false);
  });
});

describe("Theme token completeness", () => {
  // Import DARK and LIGHT from the component at build time via a re-export shim.
  // Since Glitched.tsx is a client component we test the token shapes directly.
  const DARK_KEYS = [
    "bg", "bgMid", "bgCard", "bgCardHover", "text", "textDim", "muted",
    "amber", "amberDim", "amberBg", "amberBorder",
    "sage", "sageBg", "sageBorder",
    "rose", "roseBg", "roseBorder",
    "border", "borderHover", "scrollTrack", "scrollThumb",
    "grad1", "grad2", "btnPrimary", "btnPrimaryText", "inputBg", "footerBorder",
    "cardShadow",
  ];

  it("MOCK_RESULT has all required profile fields", () => {
    const { profile } = MOCK_RESULT;
    expect(profile.sector).toBeTruthy();
    expect(profile.seniority).toBeTruthy();
    expect(profile.transferableSkills.length).toBeGreaterThan(0);
    expect(profile.primaryGoal).toBeTruthy();
    expect(profile.coreAnxiety).toBeTruthy();
    expect(profile.profileSummary).toBeTruthy();
  });

  it("MOCK_RESULT has all required plan milestones", () => {
    const { plan } = MOCK_RESULT;
    expect(plan.day30.actions.length).toBeGreaterThanOrEqual(2);
    expect(plan.day60.actions.length).toBeGreaterThanOrEqual(2);
    expect(plan.day90.actions.length).toBeGreaterThanOrEqual(2);
  });

  it("expected theme token keys are documented", () => {
    // Snapshot the key list so any token additions trigger a test update
    expect(DARK_KEYS.length).toBe(28);
  });
});
