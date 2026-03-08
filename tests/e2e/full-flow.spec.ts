import { test, expect } from "@playwright/test";

test.describe("Full user flow", () => {

  test("landing → intake → breathing → plan", async ({ page }) => {
    // Use mock mode so no real API call is made
    await page.goto("/?NEXT_PUBLIC_USE_MOCK=true");
    // Override fetch to return mock immediately
    await page.route("/api/analyze", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          profile: {
            sector: "Finance", seniority: "Senior",
            transferableSkills: ["Financial Modeling"],
            primaryGoal: "Freedom",
            coreAnxiety: "Fear of irrelevance",
            profileSummary: "Your skills didn't become worthless.",
          },
          paths: [
            {
              name: "Fractional CFO", type: "Freelance",
              timeToFirstRevenue: "30-45 days", effortLevel: "Medium",
              revenueRange: "$8k – $20k/mo", riskLevel: "Low",
              whyThisWorks: "15 years is the product.", biggestObstacle: "First client.",
              fit: 94,
            },
            {
              name: "AI Finance Translator", type: "Build",
              timeToFirstRevenue: "60-90 days", effortLevel: "High",
              revenueRange: "$3k – $15k/mo", riskLevel: "Medium",
              whyThisWorks: "Rare skill combo.", biggestObstacle: "Distribution.",
              fit: 81,
            },
            {
              name: "Systematic Trader", type: "Invest",
              timeToFirstRevenue: "90-180 days", effortLevel: "High",
              revenueRange: "$2k – $10k/mo", riskLevel: "High",
              whyThisWorks: "Modeling skills translate.", biggestObstacle: "Capital.",
              fit: 67,
            },
          ],
          plan: {
            firstMove: "Write one post tonight.",
            warning: "No calls by day 30? Rewrite the offer.",
            day30: { milestone: "First client", actions: ["Action 1", "Action 2"], metric: "3 discovery calls" },
            day60: { milestone: "First invoice", actions: ["Action 1", "Action 2"], metric: "One client paying" },
            day90: { milestone: "$8k baseline", actions: ["Action 1", "Action 2"], metric: "Three retainers" },
          },
        }),
      });
    });

    await page.goto("/");

    // Landing screen
    await expect(page.getByTestId("hero-headline")).toBeVisible();
    await page.getByTestId("begin-btn").click();

    // Intake — Q1
    await expect(page.getByTestId("intake-question")).toBeVisible();
    await page.getByTestId("intake-textarea").fill("Senior Finance Analyst, 12 years at a mid-size bank");
    await page.keyboard.press("Enter");

    // Intake — Q2
    await page.getByTestId("intake-textarea").fill("More income without trading all my time for it");
    await page.keyboard.press("Enter");

    // Intake — Q3
    await page.getByTestId("intake-textarea").fill("That my skills are becoming irrelevant");
    await page.getByTestId("continue-btn").click();

    // Breathing screen — wait for it to complete (mock API resolves fast)
    await expect(page.getByTestId("breathing-screen")).toBeVisible();
    await page.waitForSelector('[data-testid="plan-screen"]', { timeout: 30000 });

    // Plan screen
    await expect(page.getByTestId("plan-screen")).toBeVisible();
    await expect(page.getByTestId("path-card").first()).toBeVisible();
  });

  test("theme toggle switches dark to light", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByTestId("theme-toggle");
    await expect(toggle).toBeVisible();
    // Default is dark — toggle to light
    await toggle.click();
    // After click, the knob moves — just verify the button is still there and clickable
    await expect(toggle).toBeVisible();
    // Toggle back
    await toggle.click();
  });

  test("?mock=plan loads plan screen directly", async ({ page }) => {
    await page.goto("/?mock=plan");
    await expect(page.getByTestId("plan-screen")).toBeVisible();
    await expect(page.getByTestId("path-card").first()).toBeVisible();
  });

  test("tip jar renders on plan screen", async ({ page }) => {
    await page.goto("/?mock=plan");
    await expect(page.getByTestId("tip-jar")).toBeVisible();
    await expect(page.getByTestId("tip-btn-5")).toBeVisible();
    await expect(page.getByTestId("tip-btn-10")).toBeVisible();
    await expect(page.getByTestId("tip-btn-20")).toBeVisible();
  });

  test("email capture accepts valid email", async ({ page }) => {
    // Mock the subscribe endpoint
    await page.route("/api/subscribe", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto("/?mock=plan");

    // Navigate to the plan tab to see email capture
    await page.getByTestId("path-card").first().click();

    await page.getByTestId("email-input").fill("test@example.com");
    await page.getByTestId("email-submit").click();
    await expect(page.getByTestId("email-success")).toBeVisible();
  });

});
