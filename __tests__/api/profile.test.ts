/**
 * API tests for /api/profile
 * Uses mocked GenLayer and Supabase clients.
 */
import { createProfileSchema } from "@/lib/validation";

describe("createProfileSchema", () => {
  it("accepts valid input", () => {
    const input = {
      full_name: "Alice Smith",
      email_hash: "a".repeat(64),
      country: "United States",
      occupation: "Engineer",
      monthly_income_usd: 5000,
      loan_purpose: "Business expansion funding",
      wallet: "0x" + "a".repeat(40),
    };
    const result = createProfileSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects short full_name", () => {
    const input = {
      full_name: "A",
      email_hash: "a".repeat(64),
      country: "US",
      occupation: "Engineer",
      monthly_income_usd: 5000,
      loan_purpose: "Valid purpose text",
      wallet: "0x" + "a".repeat(40),
    };
    const result = createProfileSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid wallet address", () => {
    const input = {
      full_name: "Alice Smith",
      email_hash: "a".repeat(64),
      country: "US",
      occupation: "Engineer",
      monthly_income_usd: 5000,
      loan_purpose: "Valid purpose text",
      wallet: "not-a-wallet",
    };
    const result = createProfileSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.wallet).toBeDefined();
    }
  });

  it("rejects wrong email_hash length", () => {
    const input = {
      full_name: "Alice Smith",
      email_hash: "tooshort",
      country: "US",
      occupation: "Engineer",
      monthly_income_usd: 5000,
      loan_purpose: "Valid purpose text",
      wallet: "0x" + "a".repeat(40),
    };
    const result = createProfileSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});
