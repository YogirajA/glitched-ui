import { vi } from "vitest";

// Mock all external services — never call real APIs in test runs
vi.mock("@/lib/anthropic", () => ({
  anthropic: {
    messages: {
      create: vi.fn(),
    },
  },
}));

vi.mock("stripe", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({ url: "https://stripe.example.com/pay" }),
        },
      },
    })),
  };
});

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    contacts: { create: vi.fn().mockResolvedValue({ id: "mock-contact" }) },
    emails: { send: vi.fn().mockResolvedValue({ id: "mock-email" }) },
  })),
}));
