import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import api from "../services/api";
import Dashboard from "./Dashboard";

vi.mock("../services/api", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const getMock = () => api.get as unknown as Mock;
const postMock = () => api.post as unknown as Mock;

const stats = {
  totalCoupons: 1,
  activeCoupons: 1,
  expiredCoupons: 0,
  expiringSoon: 1,
  recentCoupons: [],
};

beforeEach(() => {
  getMock().mockReset();
  postMock().mockReset();
  getMock().mockResolvedValue({ data: { data: stats } });
});

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );

describe("Dashboard ask", () => {
  it("asks a question and shows the grounded answer with citations", async () => {
    const userAct = userEvent.setup();
    postMock().mockResolvedValue({
      data: {
        data: {
          answer: "PIZZA5 saves you $5 on pizza.",
          coupons: [{ _id: "9", title: "Pizza Friday", code: "PIZZA5" }],
          model: "gemini-1.5-flash",
        },
      },
    });
    renderDashboard();
    await screen.findByText("Total Coupons");
    await userAct.type(screen.getByPlaceholderText(/expire this week/i), "any pizza deals?");
    await userAct.click(screen.getByRole("button", { name: "Ask" }));
    expect(postMock()).toHaveBeenCalledWith("/ai/ask", { question: "any pizza deals?", limit: 5 });
    await screen.findByText("PIZZA5 saves you $5 on pizza.");
    expect(screen.getByText("Pizza Friday (PIZZA5)")).toBeInTheDocument();
  });

  it("shows an error when answering fails", async () => {
    const userAct = userEvent.setup();
    postMock().mockRejectedValue(new Error("502"));
    renderDashboard();
    await screen.findByText("Total Coupons");
    await userAct.type(screen.getByPlaceholderText(/expire this week/i), "any deals?");
    await userAct.click(screen.getByRole("button", { name: "Ask" }));
    await screen.findByText("Could not answer that question");
  });
});
