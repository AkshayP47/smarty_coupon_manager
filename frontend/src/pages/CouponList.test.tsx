import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import api from "../services/api";
import CouponList from "./CouponList";
import type { Coupon } from "../types";

vi.mock("../services/api", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const getMock = () => api.get as unknown as Mock;
const postMock = () => api.post as unknown as Mock;

const coupon = (over: Partial<Coupon> = {}): Coupon => ({
  _id: "1",
  userId: "u",
  title: "Amazon 20% Off",
  code: "SAVE20",
  description: "d",
  category: "Electronics",
  store: "Amazon",
  discountType: "percentage",
  discountValue: 20,
  minimumPurchase: null,
  maximumDiscount: null,
  validFrom: null,
  expiryDate: null,
  usageLimit: null,
  remainingUses: null,
  termsAndConditions: null,
  source: null,
  createdAt: "",
  updatedAt: "",
  ...over,
});

const pizza = coupon({
  _id: "2",
  title: "Pizza Friday",
  code: "PIZZA5",
  store: "Dominos",
  category: "Food",
  discountType: "fixed",
  discountValue: 5,
});

const renderList = () =>
  render(
    <MemoryRouter>
      <CouponList />
    </MemoryRouter>
  );

beforeEach(() => {
  getMock().mockReset();
  postMock().mockReset();
});

describe("CouponList", () => {
  it("renders coupons from the API", async () => {
    getMock().mockResolvedValue({ data: { data: { coupons: [coupon(), pizza] } } });
    renderList();
    await screen.findByText("SAVE20");
    expect(screen.getByText("PIZZA5")).toBeInTheDocument();
  });

  it("shows an empty state when there are no coupons", async () => {
    getMock().mockResolvedValue({ data: { data: { coupons: [] } } });
    renderList();
    await screen.findByText("No coupons found.");
  });

  it("sends the search term as a query param", async () => {
    const userAct = userEvent.setup();
    getMock().mockImplementation((_url: string, config?: { params?: Record<string, string> }) =>
      Promise.resolve({
        data: { data: { coupons: config?.params?.search ? [pizza] : [coupon(), pizza] } },
      })
    );
    renderList();
    await screen.findByText("SAVE20");
    await userAct.type(screen.getByPlaceholderText("Search..."), "pizza");
    await userAct.click(screen.getByRole("button", { name: "Search" }));
    expect(getMock()).toHaveBeenCalledWith("/coupons", {
      params: expect.objectContaining({ search: "pizza" }),
    });
    await screen.findByText("PIZZA5");
  });

  it("sends status and discount-type filters", async () => {
    getMock().mockResolvedValue({ data: { data: { coupons: [] } } });
    renderList();
    await screen.findByText("No coupons found.");
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "active" } });
    fireEvent.change(selects[1], { target: { value: "fixed" } });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    expect(getMock()).toHaveBeenCalledWith("/coupons", {
      params: expect.objectContaining({ status: "active", discountType: "fixed" }),
    });
  });

  it("runs semantic search when semantic mode is selected", async () => {
    const userAct = userEvent.setup();
    getMock().mockResolvedValue({ data: { data: { coupons: [coupon()] } } });
    postMock().mockResolvedValue({ data: { data: { coupons: [pizza], method: "gemini-embeddings" } } });
    renderList();
    await screen.findByText("SAVE20");
    fireEvent.change(screen.getByLabelText("AI search mode"), { target: { value: "semantic" } });
    await userAct.type(screen.getByPlaceholderText(/plain English/i), "cheap pizza");
    await userAct.click(screen.getByRole("button", { name: "AI Search" }));
    expect(postMock()).toHaveBeenCalledWith("/ai/semantic-search", { query: "cheap pizza", limit: 20 });
    await screen.findByText("Ranked by: gemini-embeddings");
  });

  it("runs AI search and shows the ranking method", async () => {
    const userAct = userEvent.setup();
    getMock().mockResolvedValue({ data: { data: { coupons: [coupon()] } } });
    postMock().mockResolvedValue({ data: { data: { coupons: [pizza], method: "gemini" } } });
    renderList();
    await screen.findByText("SAVE20");
    await userAct.type(screen.getByPlaceholderText(/plain English/i), "cheap pizza");
    await userAct.click(screen.getByRole("button", { name: "AI Search" }));
    expect(postMock()).toHaveBeenCalledWith("/ai/search", { query: "cheap pizza", limit: 20 });
    await screen.findByText("Ranked by: gemini");
    expect(screen.getByText("PIZZA5")).toBeInTheDocument();
  });
});
