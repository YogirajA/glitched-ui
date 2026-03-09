import type { AnalysisResult } from "./types";

/**
 * Mock result used in two scenarios:
 *   1. NEXT_PUBLIC_USE_MOCK=true (dev without API key)
 *   2. ?mock=plan URL param (E2E tests that skip the intake flow)
 */
export const MOCK_RESULT: AnalysisResult = {
  profile: {
    sector: "Finance",
    seniority: "Senior",
    transferableSkills: [
      "Financial Modeling",
      "Data Analysis",
      "Stakeholder Management",
    ],
    primaryGoal: "Freedom",
    coreAnxiety:
      "Being irrelevant in a world that no longer needs what I spent 15 years mastering.",
    profileSummary:
      "Your skills didn't become worthless. The packaging did.",
  },
  paths: [
    {
      name: "The Fractional CFO",
      type: "Freelance",
      timeToFirstRevenue: "30–45 days",
      effortLevel: "Medium",
      revenueRange: "$8k – $20k/mo",
      riskLevel: "Low",
      fit: 94,
      whyThisWorks:
        "Small companies need your exact skills but can't afford full-time. Your 15 years is the product.",
      biggestObstacle:
        "Landing the first client. After that it's referrals.",
    },
    {
      name: "The AI Finance Translator",
      type: "Build",
      timeToFirstRevenue: "60–90 days",
      effortLevel: "High",
      revenueRange: "$3k – $15k/mo",
      riskLevel: "Medium",
      fit: 81,
      whyThisWorks:
        "Finance teams need someone who speaks both the numbers and the AI tools. You're rare right now.",
      biggestObstacle:
        "Building distribution. The skill exists — the audience doesn't know you yet.",
    },
    {
      name: "The Systematic Trader",
      type: "Invest",
      timeToFirstRevenue: "90–180 days",
      effortLevel: "High",
      revenueRange: "$2k – $10k/mo",
      riskLevel: "High",
      fit: 67,
      whyThisWorks:
        "Your modeling skills translate directly to systematic strategy. Most traders can't build models.",
      biggestObstacle:
        "Capital requirements and the gap between theory and living the volatility.",
    },
  ],
  plan: {
    firstMove:
      "Write one post tonight: 'After 15 years in finance, here's what AI actually can't replace.' Publish it.",
    warning:
      "If no discovery calls by day 30, the messaging isn't landing. Rewrite the offer, not the platform.",
    day30: {
      milestone: "First paying client or LOI signed",
      actions: [
        "Message 20 former colleagues about fractional CFO availability — personal, not broadcast",
        "Set up a one-page site with your offer. Done beats perfect.",
        "Join 2 communities where founders vent about financial chaos",
      ],
      metric: "3 discovery calls booked",
    },
    day60: {
      milestone: "First invoice sent",
      actions: [
        "Deliver month one of real value to your first client",
        "Ask for one specific referral — not 'anyone you know,' but name the type",
        "Document your process so it doesn't only live in your head",
      ],
      metric: "One client paying, one in pipeline",
    },
    day90: {
      milestone: "Predictable $8k/month baseline",
      actions: [
        "Raise rates for new clients — scarcity is now real",
        "Decide: stay fractional or build a product layer on top",
        "Fire the client that's 80% of your stress for 20% of income",
      ],
      metric: "Three retainer clients. Calendar yours to control.",
    },
  },
  happinessAdvantage: {
    attribution: "Shawn Achor, The Happiness Advantage",
    glassHalfFull: {
      headline: "You have more than you think.",
      wins: [
        "15 years of real-world financial pattern recognition no AI can replicate",
        "A network of people who already trust your judgment",
        "The crisis forced a pivot you would have delayed another decade",
      ],
    },
    fallingUp:
      "The layoff didn't end your career. It ended the version of your career that was slowly ending you. The skills are intact. The ceiling is gone.",
    dailyPractice: {
      day30: "Each morning, write one thing you learned the previous day about running your own business. Not goals — observations.",
      day60: "At end of each week, write two sentences: what worked, what you'd change. Keep it ruthlessly short.",
      day90: "Monthly: read back your day-30 and day-60 notes. The pattern of what you keep noticing is the signal.",
    },
    tetrisEffect: {
      prompt: "For the next 7 days, notice every time a founder or small business owner complains about their finances.",
      example: "A founder vents on Twitter about cash flow — that's a fractional CFO lead, not noise.",
    },
  },
};
