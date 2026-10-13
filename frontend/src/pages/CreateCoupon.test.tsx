import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import api from "../services/api";
import CreateCoupon from "./CreateCoupon";

vi.mock("../services/api", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const postMock = () => api.post as unknown as Mock;

const renderForm = () =>
  render(
    <MemoryRouter>
      <CreateCoupon />
    </MemoryRouter>
  );

const fileInput = (container: HTMLElement) =>
  container.querySelector('input[type="file"]') as HTMLInputElement;

beforeEach(() => {
  postMock().mockReset();
});

describe("CreateCoupon screenshot prefill", () => {
  it("prefills the form from an extracted draft", async () => {
    postMock().mockResolvedValue({
      data: {
        data: {
          coupon: {
            title: "Extracted Title",
            code: "EX10",
            store: "Shop",
            category: "Food",
            discountType: "fixed",
            discountValue: 15,
            expiryDate: "2026-12-31",
          },
        },
      },
    });
    const { container } = renderForm();
    const file = new File(["fake-bytes"], "shot.png", { type: "image/png" });
    fireEvent.change(fileInput(container), { target: { files: [file] } });

    await screen.findByText("Form prefilled from screenshot — please review before saving.");
    expect(postMock()).toHaveBeenCalledWith(
      "/ai/extract",
      expect.objectContaining({ mimeType: "image/png" })
    );
    expect(screen.getByDisplayValue("Extracted Title")).toBeInTheDocument();
    expect(screen.getByDisplayValue("EX10")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2026-12-31")).toBeInTheDocument();
  });

  it("rejects non-image files without calling the API", async () => {
    const { container } = renderForm();
    const file = new File(["nope"], "notes.txt", { type: "text/plain" });
    fireEvent.change(fileInput(container), { target: { files: [file] } });
    await screen.findByText("Please choose an image file");
    await waitFor(() => expect(postMock()).not.toHaveBeenCalled());
  });

  it("shows an error when extraction fails", async () => {
    postMock().mockRejectedValue(new Error("502"));
    const { container } = renderForm();
    const file = new File(["fake-bytes"], "shot.png", { type: "image/png" });
    fireEvent.change(fileInput(container), { target: { files: [file] } });
    await screen.findByText("Failed to extract coupon from image");
  });
});
