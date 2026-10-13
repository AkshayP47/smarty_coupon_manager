import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import api from "./services/api";
import App from "./App";

vi.mock("./services/api", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const getMock = () => api.get as unknown as Mock;
const postMock = () => api.post as unknown as Mock;

const user = { id: "1", name: "Ann", email: "ann@example.com" };
const profileRes = { data: { data: { user } } };
const dashboardRes = {
  data: {
    data: {
      totalCoupons: 2,
      activeCoupons: 1,
      expiredCoupons: 1,
      expiringSoon: 0,
      recentCoupons: [],
    },
  },
};

const go = (path: string) => window.history.pushState({}, "", path);

beforeEach(() => {
  getMock().mockReset();
  postMock().mockReset();
  go("/");
});

describe("App routing + auth", () => {
  it("redirects unauthenticated users to login", () => {
    go("/coupons");
    render(<App />);
    expect(screen.getByRole("heading", { name: "Login" })).toBeInTheDocument();
  });

  it("shows the dashboard when a token and profile exist", async () => {
    localStorage.setItem("token", "tok");
    getMock().mockImplementation((url: string) =>
      Promise.resolve(url === "/auth/profile" ? profileRes : dashboardRes)
    );
    go("/");
    render(<App />);
    await screen.findByText("Welcome, Ann");
    expect(screen.getByText("Total Coupons")).toBeInTheDocument();
    expect(screen.getByText("No coupons yet.")).toBeInTheDocument();
  });

  it("logs in through the form, stores the token, and lands on the dashboard", async () => {
    const userAct = userEvent.setup();
    postMock().mockImplementation((_url: string) =>
      Promise.resolve({ data: { data: { token: "tok2", user } } })
    );
    getMock().mockImplementation((url: string) =>
      Promise.resolve(url === "/auth/profile" ? profileRes : dashboardRes)
    );
    go("/login");
    const { container } = render(<App />);
    await userAct.type(container.querySelector('input[type="email"]') as HTMLInputElement, "ann@example.com");
    await userAct.type(container.querySelector('input[type="password"]') as HTMLInputElement, "password1");
    await userAct.click(screen.getByRole("button", { name: "Login" }));
    await screen.findByText("Welcome, Ann");
    expect(localStorage.getItem("token")).toBe("tok2");
    expect(postMock()).toHaveBeenCalledWith("/auth/login", {
      email: "ann@example.com",
      password: "password1",
    });
  });

  it("shows an error on failed login", async () => {
    const userAct = userEvent.setup();
    postMock().mockRejectedValue(new Error("401"));
    go("/login");
    const { container } = render(<App />);
    await userAct.type(container.querySelector('input[type="email"]') as HTMLInputElement, "ann@example.com");
    await userAct.type(container.querySelector('input[type="password"]') as HTMLInputElement, "wrong");
    await userAct.click(screen.getByRole("button", { name: "Login" }));
    await screen.findByText("Login failed");
  });

  it("shows a dashboard error when stats fail to load", async () => {
    localStorage.setItem("token", "tok");
    getMock().mockImplementation((url: string) =>
      url === "/auth/profile" ? Promise.resolve(profileRes) : Promise.reject(new Error("500"))
    );
    go("/");
    render(<App />);
    await screen.findByText("Failed to load dashboard");
  });
});
