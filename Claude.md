# CLAUDE.md — glitched.sh

You are working on **glitched.sh** — a career pivot tool for displaced white-collar professionals.
Users answer 3 questions. A 5-agent Claude pipeline generates a personalized 30/60/90 plan.
Monetized via tip jar (Stripe) and monthly plan refresh subscription ($12/mo).

---

## Project Architecture

```
glitched/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Fonts: Playfair Display + DM Sans
│   │   ├── page.tsx                # Renders <Glitched />
│   │   ├── globals.css
│   │   └── api/
│   │       ├── analyze/route.ts    # 5-agent Claude pipeline (PRIVATE — no OSS)
│   │       ├── tip/route.ts        # Stripe checkout session
│   │       └── subscribe/route.ts  # Resend email capture
│   ├── components/
│   │   └── Glitched.tsx            # Full UI with dark/light theme system
│   └── lib/
│       ├── anthropic.ts            # Shared Anthropic client
│       ├── agents.ts               # Agent pipeline logic (PRIVATE)
│       └── types.ts                # Shared TypeScript types
├── tests/
│   ├── unit/                       # Vitest unit tests
│   └── e2e/                        # Playwright E2E tests
├── .claude/
│   └── commands/                   # Slash commands (see below)
├── CLAUDE.md                       # This file
├── .env.local                      # Never commit — secrets live here
└── playwright.config.ts
```

---

## Tech Stack

- **Framework**: Next.js 14+ App Router
- **Language**: TypeScript strict mode — `no any`, ever
- **Styling**: Inline styles only — no Tailwind, no CSS modules (theme system uses JS token objects)
- **Animation**: CSS keyframes via `<style>` tags injected in GlobalStyle component
- **AI**: Anthropic SDK — model always `claude-sonnet-4-20250514`
- **Payments**: Stripe (tip jar + future subscription)
- **Email**: Resend (welcome + 30-day drip)
- **Deploy**: Vercel

---

## Commands

```bash
npm run dev          # Start dev server at localhost:3000
npm run build        # Production build — run before every deploy
npm run lint         # ESLint — fix all warnings before committing
npm run test         # Vitest unit tests
npm run test:e2e     # Playwright E2E tests (needs dev server running)
npm run test:all     # Unit + E2E in sequence
```

---

## Theme System — CRITICAL

The entire UI uses a dual-theme token system. **Never hardcode colors.**

```typescript
// ALWAYS use theme tokens via useTheme() hook
const { t, isDark } = useTheme();

// CORRECT
color: t.text
background: t.bgCard
border: `1px solid ${t.border}`

// WRONG — hardcoded colors break dark/light mode
color: "#FDFAF4"
background: "rgba(245,237,214,0.04)"
```

Token reference lives in `Glitched.tsx` — `DARK` and `LIGHT` objects at top of file.
When adding new UI elements, add tokens to BOTH objects in parallel.

---

## Agent Pipeline — IMPORTANT

The 5 agents run sequentially. Each returns **strict JSON only** — no markdown, no preamble.

```
IntakeAgent → MarketAgent → PathAgent → PlanAgent → AWAFCheck
```

- **Never** change the model from `claude-sonnet-4-20250514`
- **Always** wrap agent calls in try/catch with graceful fallback to mock data
- **AWAFCheck** must pass before any result renders — it validates schema completeness
- Agent prompts in `agents.ts` are the core IP — treat as sensitive, never log to console in prod

The breathing screen (~20s) acts as the loading screen. Claude responds in 8-15s.
They finish simultaneously — no separate loading state needed.

---

## Coding Conventions

### TypeScript
```typescript
// Strict mode — no any, no non-null assertions without comment
// All API route handlers typed with NextRequest/NextResponse
// All agent return types defined in types.ts

// Component props always explicitly typed
interface Props {
  onSubmit: (answers: UserAnswers) => void;
}
```

### Components
- Functional components only — no class components
- All state via `useState` / `useReducer` — no external state library
- Animations via CSS keyframes, not JS intervals where possible
- Every screen is a standalone component: `LandingScreen`, `IntakeScreen`, `BreathingScreen`, `PlanScreen`

### API Routes
```typescript
// Always validate input before calling Claude
if (!answers.role || !answers.want || !answers.fear) {
  return NextResponse.json({ error: "Missing answers" }, { status: 400 });
}

// Always handle errors gracefully — never let Claude errors surface raw to users
try {
  const result = await runAnalysisPipeline(answers);
  return NextResponse.json(result);
} catch (err) {
  console.error("[analyze]", err);
  return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 500 });
}
```

### Commits
```
feat: add email capture to plan screen
fix: breathing orb scale on mobile Safari
test: add E2E for full intake → plan flow
chore: update Anthropic SDK to latest
```

---

## Testing Strategy

### Unit Tests (Vitest) — `tests/unit/`

Test logic, not rendering. Focus on:
- Agent prompt construction in `agents.ts`
- AWAF validation logic
- Type guards and data transformation utilities
- Theme token completeness (both DARK and LIGHT have same keys)

```typescript
// Example: AWAF check
import { describe, it, expect } from 'vitest';
import { runAwafCheck } from '@/lib/agents';

describe('AWAFCheck', () => {
  it('passes valid complete result', () => {
    expect(runAwafCheck(VALID_MOCK_RESULT)).toBe(true);
  });
  it('fails when paths array is not length 3', () => {
    expect(runAwafCheck({ ...VALID_MOCK_RESULT, paths: [] })).toBe(false);
  });
  it('fails when revenue range is missing', () => {
    const bad = { ...VALID_MOCK_RESULT };
    bad.paths[0].revenueRange = '';
    expect(runAwafCheck(bad)).toBe(false);
  });
});
```

### E2E Tests (Playwright) — `tests/e2e/`

Test full user flows against the running dev server.
Use `data-testid` attributes — never test by CSS class or text content that might change.

**Critical flows to always keep green:**

```typescript
// tests/e2e/full-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Full user flow', () => {

  test('landing → intake → breathing → plan', async ({ page }) => {
    await page.goto('/');

    // Landing screen
    await expect(page.getByTestId('hero-headline')).toBeVisible();
    await page.getByTestId('begin-btn').click();

    // Intake — Q1
    await expect(page.getByTestId('intake-question')).toBeVisible();
    await page.getByTestId('intake-textarea').fill('Senior Finance Analyst, 12 years at a mid-size bank');
    await page.keyboard.press('Enter');

    // Intake — Q2
    await page.getByTestId('intake-textarea').fill('More income without trading all my time for it');
    await page.keyboard.press('Enter');

    // Intake — Q3
    await page.getByTestId('intake-textarea').fill('That my skills are becoming irrelevant');
    await page.getByTestId('continue-btn').click();

    // Breathing screen — wait for it to complete (mock in test)
    await expect(page.getByTestId('breathing-screen')).toBeVisible();
    await page.waitForSelector('[data-testid="plan-screen"]', { timeout: 30000 });

    // Plan screen
    await expect(page.getByTestId('plan-screen')).toBeVisible();
    await expect(page.getByTestId('path-card').first()).toBeVisible();
  });

  test('theme toggle switches dark to light', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByTestId('theme-toggle');
    // Default is dark
    await expect(page.locator('div').first()).toHaveCSS('background-color', 'rgb(13, 27, 42)');
    await toggle.click();
    // Light mode background
    await expect(page.locator('div').first()).toHaveCSS('background-color', 'rgb(250, 246, 238)');
  });

  test('tip jar renders on plan screen', async ({ page }) => {
    // Navigate directly to plan (using mock state)
    await page.goto('/?mock=plan');
    await expect(page.getByTestId('tip-jar')).toBeVisible();
    await expect(page.getByTestId('tip-btn-10')).toBeVisible();
  });

  test('email capture accepts valid email', async ({ page }) => {
    await page.goto('/?mock=plan');
    await page.getByTestId('email-input').fill('test@example.com');
    await page.getByTestId('email-submit').click();
    await expect(page.getByTestId('email-success')).toBeVisible();
  });

});
```

### Adding `data-testid` attributes

When modifying UI components, add testids to all interactive and key display elements:

```tsx
// Buttons
<button data-testid="begin-btn" onClick={onBegin}>

// Screens
<div data-testid="landing-screen">
<div data-testid="intake-screen">
<div data-testid="breathing-screen">
<div data-testid="plan-screen">

// Key elements
<h1 data-testid="hero-headline">
<textarea data-testid="intake-textarea">
<button data-testid="continue-btn">
<button data-testid="theme-toggle">
<div data-testid="tip-jar">
<input data-testid="email-input">
```

---

## Playwright Config

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,        // Sequential — avoids port conflicts
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'mobile', use: { browserName: 'chromium', viewport: { width: 390, height: 844 } } },
  ],
});
```

---

## Vitest Config

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/unit/setup.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

---

## Environment Variables

```bash
# .env.local — never commit
ANTHROPIC_API_KEY=sk-ant-...
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=hello@glitched.sh
RESEND_AUDIENCE_ID=...
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cloudflare Turnstile — bot protection on /api/analyze
# dash.cloudflare.com → Security → Turnstile → create site
# Add localhost + production domain to the site's allowed domains list
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAA...   # safe for client
TURNSTILE_SECRET_KEY=0x4AAAAAAA...              # server only — never NEXT_PUBLIC_
```

In tests, mock all external services — never call real Anthropic/Stripe/Resend in test runs:
```typescript
// tests/unit/setup.ts
vi.mock('@/lib/anthropic', () => ({ anthropic: { messages: { create: vi.fn() } } }));
```

---

## What NOT To Do

- **Never** hardcode colors — always use `t.tokenName` from theme system
- **Never** use `any` in TypeScript
- **Never** log agent prompts to console in production
- **Never** call Claude API in test environment — mock it
- **Never** change the agent model away from `claude-sonnet-4-20250514`
- **Never** add `console.log` to production code — use structured logging or remove
- **Never** commit `.env.local`
- **Never** store Stripe or Anthropic keys in client-side code (`NEXT_PUBLIC_*`)
- **Never** OSS the `src/app/api/` directory — agent prompts are core IP

---

## Before Every Commit

```bash
npm run lint          # Zero warnings
npm run build         # Clean build — no TypeScript errors
npm run test          # All unit tests green
```

Before every deploy:
```bash
npm run test:e2e      # Full flow green on chromium + mobile
```

---

## Key Files Quick Reference

| File | What it does |
|------|-------------|
| `src/components/Glitched.tsx` | Entire UI — theme system, all 4 screens |
| `src/lib/agents.ts` | 5-agent Claude pipeline — core IP |
| `src/lib/types.ts` | Shared TypeScript types |
| `src/app/api/analyze/route.ts` | Main API — calls agent pipeline |
| `src/app/api/tip/route.ts` | Stripe checkout session |
| `src/app/api/subscribe/route.ts` | Resend email capture |
| `tests/e2e/full-flow.spec.ts` | Critical path E2E tests |
| `tests/unit/agents.test.ts` | Agent logic unit tests |
| `.env.local` | Secrets — never commit |

---

*glitched.sh — built for the displaced. By someone who's been there.*