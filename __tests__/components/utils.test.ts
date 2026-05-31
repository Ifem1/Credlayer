import {
  formatUSD,
  formatPercent,
  shortenAddress,
  creditScoreColor,
  tierColor,
  loanStatusColor,
  daysUntil,
  interestLabel,
} from "@/lib/utils";

describe("formatUSD", () => {
  it("formats positive amounts", () => {
    expect(formatUSD(1000)).toBe("$1,000");
    expect(formatUSD(1500000)).toBe("$1,500,000");
  });
  it("formats zero", () => {
    expect(formatUSD(0)).toBe("$0");
  });
});

describe("formatPercent", () => {
  it("formats percentage", () => {
    expect(formatPercent(8.5)).toBe("8.50%");
    expect(formatPercent(100)).toBe("100.00%");
  });
});

describe("shortenAddress", () => {
  it("shortens a 42-char address", () => {
    const addr = "0xabcdef1234567890abcdef1234567890abcdef12";
    const shortened = shortenAddress(addr);
    expect(shortened).toContain("0xabcd");
    expect(shortened).toContain("ef12");
    expect(shortened.length).toBeLessThan(addr.length);
  });

  it("returns short strings unchanged", () => {
    expect(shortenAddress("short")).toBe("short");
  });
});

describe("creditScoreColor", () => {
  it("returns emerald for excellent scores", () => {
    expect(creditScoreColor(780)).toContain("emerald");
  });
  it("returns red for poor scores", () => {
    expect(creditScoreColor(320)).toContain("red");
  });
});

describe("tierColor", () => {
  it("returns yellow for Gold", () => {
    expect(tierColor("Gold")).toContain("yellow");
  });
  it("returns fallback for unknown tier", () => {
    expect(tierColor("Unknown")).toContain("slate");
  });
});

describe("loanStatusColor", () => {
  it("returns blue for ACTIVE", () => {
    expect(loanStatusColor("ACTIVE")).toContain("blue");
  });
  it("returns red for DEFAULTED", () => {
    expect(loanStatusColor("DEFAULTED")).toContain("red");
  });
  it("returns emerald for APPROVED", () => {
    expect(loanStatusColor("APPROVED")).toContain("emerald");
  });
});

describe("daysUntil", () => {
  it("returns positive number for future date", () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    expect(daysUntil(future)).toBeGreaterThan(0);
  });
  it("returns negative number for past date", () => {
    const past = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    expect(daysUntil(past)).toBeLessThan(0);
  });
});

describe("interestLabel", () => {
  it("returns Excellent for low rates", () => {
    expect(interestLabel(5)).toBe("Excellent");
  });
  it("returns High for high rates", () => {
    expect(interestLabel(20)).toBe("High");
  });
});
