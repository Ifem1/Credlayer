import { depositSchema, withdrawSchema } from "@/lib/validation";

describe("depositSchema", () => {
  const wallet = "0x" + "a".repeat(40);

  it("accepts valid deposit", () => {
    const result = depositSchema.safeParse({ pool_id: "pool_1", amount_usd: 1000, wallet });
    expect(result.success).toBe(true);
  });

  it("rejects zero amount", () => {
    const result = depositSchema.safeParse({ pool_id: "pool_1", amount_usd: 0, wallet });
    expect(result.success).toBe(false);
  });

  it("rejects missing pool_id", () => {
    const result = depositSchema.safeParse({ pool_id: "", amount_usd: 100, wallet });
    expect(result.success).toBe(false);
  });
});

describe("withdrawSchema", () => {
  const wallet = "0x" + "a".repeat(40);

  it("accepts valid withdrawal", () => {
    const result = withdrawSchema.safeParse({ pool_id: "pool_1", amount_usd: 500, wallet });
    expect(result.success).toBe(true);
  });

  it("rejects negative amount", () => {
    const result = withdrawSchema.safeParse({ pool_id: "pool_1", amount_usd: -10, wallet });
    expect(result.success).toBe(false);
  });
});
