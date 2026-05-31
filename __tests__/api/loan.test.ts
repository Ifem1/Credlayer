import { loanRequestSchema, repayLoanSchema } from "@/lib/validation";

describe("loanRequestSchema", () => {
  const validLoan = {
    amount_usd: 2000,
    duration_days: 90,
    loan_type: "PERSONAL" as const,
    purpose: "Funding for home renovation project",
    collateral_amount: 500,
    wallet_age_days: 365,
    total_transactions: 100,
    avg_balance_usd: 3000,
    github_contributions: 50,
    dao_votes: 5,
    income_documents_hash: "hashvalue",
    wallet: "0x" + "a".repeat(40),
  };

  it("accepts valid loan request", () => {
    expect(loanRequestSchema.safeParse(validLoan).success).toBe(true);
  });

  it("rejects invalid loan type", () => {
    const result = loanRequestSchema.safeParse({ ...validLoan, loan_type: "INVALID" });
    expect(result.success).toBe(false);
  });

  it("rejects amount below minimum", () => {
    const result = loanRequestSchema.safeParse({ ...validLoan, amount_usd: 50 });
    expect(result.success).toBe(false);
  });

  it("rejects duration below minimum", () => {
    const result = loanRequestSchema.safeParse({ ...validLoan, duration_days: 3 });
    expect(result.success).toBe(false);
  });

  it("accepts all valid loan types", () => {
    const types = ["PERSONAL", "BUSINESS", "CREATOR", "FREELANCER", "DAO_CONTRIBUTOR", "REPUTATION_BACKED"];
    types.forEach((t) => {
      const result = loanRequestSchema.safeParse({ ...validLoan, loan_type: t });
      expect(result.success).toBe(true);
    });
  });
});

describe("repayLoanSchema", () => {
  it("accepts valid repay request", () => {
    const input = {
      loan_id: "loan_1_0xabcd",
      amount_usd: 500,
      wallet: "0x" + "a".repeat(40),
    };
    expect(repayLoanSchema.safeParse(input).success).toBe(true);
  });

  it("rejects amount below 1", () => {
    const input = {
      loan_id: "loan_1_0xabcd",
      amount_usd: 0,
      wallet: "0x" + "a".repeat(40),
    };
    expect(repayLoanSchema.safeParse(input).success).toBe(false);
  });
});
