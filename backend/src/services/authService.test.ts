import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";
import {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
} from "./authService";

describe("authService", () => {
  it("hashes a password and verifies the correct one", async () => {
    const hash = await hashPassword("s3cret-pass");
    expect(hash).not.toBe("s3cret-pass");
    expect(await comparePassword("s3cret-pass", hash)).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const hash = await hashPassword("s3cret-pass");
    expect(await comparePassword("wrong-pass", hash)).toBe(false);
  });

  it("round-trips a token", () => {
    const token = generateToken("user123");
    expect(verifyToken(token)).toEqual({ userId: "user123", iat: expect.any(Number), exp: expect.any(Number) });
  });

  it("rejects a tampered token", () => {
    const token = generateToken("user123") + "tampered";
    expect(verifyToken(token)).toBeNull();
  });

  it("rejects garbage", () => {
    expect(verifyToken("not-a-token")).toBeNull();
  });

  it("rejects a token signed with a different secret", () => {
    const token = jwt.sign({ userId: "user123" }, "some-other-secret");
    expect(verifyToken(token)).toBeNull();
  });
});
