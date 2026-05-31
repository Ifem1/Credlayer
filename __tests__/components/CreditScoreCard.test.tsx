import { render, screen } from "@testing-library/react";
import { CreditScoreCard } from "@/components/credit/CreditScoreCard";

describe("CreditScoreCard", () => {
  it("renders credit score", () => {
    render(<CreditScoreCard score={742} tier="Gold" />);
    expect(screen.getByText("742")).toBeInTheDocument();
  });

  it("renders tier label", () => {
    render(<CreditScoreCard score={600} tier="Silver" />);
    expect(screen.getByText("Silver")).toBeInTheDocument();
  });

  it("renders risk level when provided", () => {
    render(<CreditScoreCard score={700} tier="Gold" riskLevel="LOW" />);
    expect(screen.getByText("LOW")).toBeInTheDocument();
  });

  it("renders 'out of 850' label", () => {
    render(<CreditScoreCard score={500} tier="Bronze" />);
    expect(screen.getByText("out of 850")).toBeInTheDocument();
  });
});
