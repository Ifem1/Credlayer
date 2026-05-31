/**
 * Contract logic unit tests — tests pure Python-equivalent logic
 * mirrored in TypeScript for CI.
 */

// Mirror the credit-tier calculation from credlayer.py
function calculateCreditTier(score: number): string {
  if (score >= 90) return "Institutional";
  if (score >= 75) return "Platinum";
  if (score >= 60) return "Gold";
  if (score >= 40) return "Silver";
  if (score >= 20) return "Bronze";
  return "Unverified";
}

// Mirror _calculate_interest_rate
function calculateInterestRate(creditScore: number, riskLevel: string): number {
  const baseRates: Record<string, number> = { LOW: 5.0, MEDIUM: 9.0, HIGH: 15.0, CRITICAL: 25.0 };
  const base = baseRates[riskLevel] ?? 15.0;
  const adjustment = Math.max(0, (750 - creditScore) * 0.02);
  return Math.round((base + adjustment) * 100) / 100;
}

// Mirror _calculate_collateral_ratio
function calculateCollateralRatio(creditScore: number, riskLevel: string): number {
  const ratios: Record<string, number> = { LOW: 20, MEDIUM: 40, HIGH: 70, CRITICAL: 100 };
  let base = ratios[riskLevel] ?? 50;
  if (creditScore > 750) base = Math.max(0, base - 10);
  else if (creditScore < 500) base = Math.min(100, base + 20);
  return base;
}

// Mirror _calculate_reputation_score
function calculateReputationScore(cp: {
  identity_score: number;
  repayment_score: number;
  wallet_trust_score: number;
  income_score: number;
  governance_score: number;
}): number {
  return Math.floor(
    cp.identity_score * 0.25 +
    cp.repayment_score * 0.35 +
    cp.wallet_trust_score * 0.2 +
    cp.income_score * 0.15 +
    cp.governance_score * 0.05
  );
}

describe("Credit Tier Calculation", () => {
  it("returns Unverified for score 0", () => expect(calculateCreditTier(0)).toBe("Unverified"));
  it("returns Bronze for score 20", () => expect(calculateCreditTier(20)).toBe("Bronze"));
  it("returns Silver for score 40", () => expect(calculateCreditTier(40)).toBe("Silver"));
  it("returns Gold for score 60", () => expect(calculateCreditTier(60)).toBe("Gold"));
  it("returns Platinum for score 75", () => expect(calculateCreditTier(75)).toBe("Platinum"));
  it("returns Institutional for score 90", () => expect(calculateCreditTier(90)).toBe("Institutional"));
  it("returns Institutional for score 100", () => expect(calculateCreditTier(100)).toBe("Institutional"));
});

describe("Interest Rate Calculation", () => {
  it("LOW risk with score 750 yields base 5%", () => {
    expect(calculateInterestRate(750, "LOW")).toBe(5.0);
  });

  it("HIGH risk with score 500 yields elevated rate", () => {
    const rate = calculateInterestRate(500, "HIGH");
    expect(rate).toBeGreaterThan(15.0);
  });

  it("CRITICAL risk yields highest rate", () => {
    const rate = calculateInterestRate(400, "CRITICAL");
    expect(rate).toBeGreaterThan(25.0);
  });

  it("rate does not go below base for excellent scores", () => {
    const rate = calculateInterestRate(850, "LOW");
    expect(rate).toBe(5.0); // adjustment is max(0, ...) so no negative
  });
});

describe("Collateral Ratio Calculation", () => {
  it("LOW risk with high score reduces ratio", () => {
    const ratio = calculateCollateralRatio(800, "LOW");
    expect(ratio).toBe(10); // 20 - 10 = 10
  });

  it("HIGH risk with low score increases ratio", () => {
    const ratio = calculateCollateralRatio(400, "HIGH");
    expect(ratio).toBe(90); // 70 + 20 = 90
  });

  it("caps at 100%", () => {
    const ratio = calculateCollateralRatio(200, "CRITICAL");
    expect(ratio).toBeLessThanOrEqual(100);
  });
});

describe("Reputation Score Calculation", () => {
  it("computes weighted score correctly", () => {
    const score = calculateReputationScore({
      identity_score: 100,
      repayment_score: 100,
      wallet_trust_score: 100,
      income_score: 100,
      governance_score: 100,
    });
    expect(score).toBe(100);
  });

  it("returns 0 for all-zero inputs", () => {
    const score = calculateReputationScore({
      identity_score: 0,
      repayment_score: 0,
      wallet_trust_score: 0,
      income_score: 0,
      governance_score: 0,
    });
    expect(score).toBe(0);
  });

  it("applies correct weights", () => {
    // Only repayment_score = 100, rest 0
    // Expected: 100 * 0.35 = 35
    const score = calculateReputationScore({
      identity_score: 0,
      repayment_score: 100,
      wallet_trust_score: 0,
      income_score: 0,
      governance_score: 0,
    });
    expect(score).toBe(35);
  });
});
