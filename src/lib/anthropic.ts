import Anthropic from "@anthropic-ai/sdk";

// Single shared client — reused across all agents.
// Only imported server-side (API routes / agents).
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
