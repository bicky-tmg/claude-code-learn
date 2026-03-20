import { test, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const { mockCookieSet, mockCookieGet } = vi.hoisted(() => ({
  mockCookieSet: vi.fn(),
  mockCookieGet: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    set: mockCookieSet,
    get: mockCookieGet,
    delete: vi.fn(),
  }),
}));

import { createSession, getSession } from "@/lib/auth";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

beforeEach(() => {
  vi.clearAllMocks();
});

test("createSession sets an httpOnly cookie named auth-token", async () => {
  await createSession("user-123", "test@example.com");

  expect(mockCookieSet).toHaveBeenCalledOnce();
  const [name, , options] = mockCookieSet.mock.calls[0];
  expect(name).toBe("auth-token");
  expect(options.httpOnly).toBe(true);
});

test("createSession embeds userId and email in the JWT payload", async () => {
  await createSession("user-123", "test@example.com");

  const [, token] = mockCookieSet.mock.calls[0];
  const { payload } = await jwtVerify(token, JWT_SECRET);
  expect(payload.userId).toBe("user-123");
  expect(payload.email).toBe("test@example.com");
});

test("createSession sets cookie expiry to ~7 days from now", async () => {
  const before = Date.now();
  await createSession("user-123", "test@example.com");
  const after = Date.now();

  const [, , options] = mockCookieSet.mock.calls[0];
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  expect(options.expires.getTime()).toBeGreaterThanOrEqual(before + sevenDays - 1000);
  expect(options.expires.getTime()).toBeLessThanOrEqual(after + sevenDays + 1000);
});

test("createSession sets secure: false outside production", async () => {
  await createSession("user-123", "test@example.com");

  const [, , options] = mockCookieSet.mock.calls[0];
  expect(options.secure).toBe(false);
});

test("createSession sets cookie sameSite to lax and path to /", async () => {
  await createSession("user-123", "test@example.com");

  const [, , options] = mockCookieSet.mock.calls[0];
  expect(options.sameSite).toBe("lax");
  expect(options.path).toBe("/");
});

// --- getSession ---

async function makeToken(payload: object, expirationTime = "7d") {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expirationTime)
    .setIssuedAt()
    .sign(JWT_SECRET);
}

test("getSession returns null when no cookie is present", async () => {
  mockCookieGet.mockReturnValue(undefined);

  const session = await getSession();
  expect(session).toBeNull();
});

test("getSession returns the session payload for a valid token", async () => {
  const token = await makeToken({ userId: "user-123", email: "test@example.com" });
  mockCookieGet.mockReturnValue({ value: token });

  const session = await getSession();
  expect(session?.userId).toBe("user-123");
  expect(session?.email).toBe("test@example.com");
});

test("getSession returns null for a malformed token", async () => {
  mockCookieGet.mockReturnValue({ value: "not.a.valid.jwt" });

  const session = await getSession();
  expect(session).toBeNull();
});

test("getSession returns null for an expired token", async () => {
  const token = await makeToken(
    { userId: "user-123", email: "test@example.com" },
    "1s"
  );
  await new Promise((resolve) => setTimeout(resolve, 1100));
  mockCookieGet.mockReturnValue({ value: token });

  const session = await getSession();
  expect(session).toBeNull();
});
