import { createHmac, randomBytes, scrypt, timingSafeEqual } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import {
  VALID_ACCOUNT_TYPES,
  type AccountType,
  type SessionUser,
} from "@/lib/auth-types";

const USERS_FILE = path.join(process.cwd(), "data", "users.json");
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

export class AuthError extends Error {
  constructor(public code: string, message?: string) {
    super(message ?? code);
    this.name = "AuthError";
  }
}

interface StoredUser extends SessionUser {
  hash: string;
  failedAttempts?: number;
  lockedUntil?: string;
}

interface SessionPayload {
  uid: string;
  role: AccountType;
  exp: number;
}

let usersCache: StoredUser[] | null = null;

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET is not configured. Add it to .env.local");
  }
  return secret;
}

function toPublicUser(user: StoredUser): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    accountType: user.accountType,
    lang: user.lang,
    createdAt: user.createdAt,
  };
}

async function ensureStore(): Promise<StoredUser[]> {
  if (usersCache) return usersCache;
  try {
    const raw = await readFile(USERS_FILE, "utf8");
    usersCache = JSON.parse(raw) as StoredUser[];
    return usersCache;
  } catch {
    usersCache = await seedAccounts();
    await writeStore();
    return usersCache;
  }
}

async function writeStore(): Promise<void> {
  if (!usersCache) return;
  await mkdir(path.dirname(USERS_FILE), { recursive: true });
  await writeFile(USERS_FILE, JSON.stringify(usersCache, null, 2), "utf8");
}

function scryptAsync(password: string, salt: Buffer, keylen: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [alg, saltHex, hashHex] = stored.split("$");
    if (alg !== "scrypt" || !saltHex || !hashHex) return false;
    const key = await scryptAsync(password, Buffer.from(saltHex, "hex"), 64);
    const expected = Buffer.from(hashHex, "hex");
    return key.length === expected.length && timingSafeEqual(key, expected);
  } catch {
    return false;
  }
}

async function seedAccounts(): Promise<StoredUser[]> {
  const accounts: Array<{
    email: string;
    password: string;
    name: string;
    phone: string;
    accountType: AccountType;
  }> = [
    { email: "admin@example.dz", password: "admin123", name: "Admin Soukline", phone: "", accountType: "admin" },
    { email: "merchant@example.dz", password: "merchant123", name: "Boutique El Baraka", phone: "0550123456", accountType: "merchant" },
    { email: "user@example.dz", password: "user123", name: "Ahmed Benali", phone: "0550987654", accountType: "user" },
  ];
  const users: StoredUser[] = [];
  for (const acc of accounts) {
    users.push({
      id: randomBytes(16).toString("hex"),
      name: acc.name,
      email: acc.email,
      phone: acc.phone,
      accountType: acc.accountType,
      lang: "fr",
      createdAt: new Date().toISOString(),
      hash: await hashPassword(acc.password),
    });
  }
  return users;
}

export async function findUserByEmail(email: string): Promise<SessionUser | null> {
  const users = await ensureStore();
  const user = users.find((u) => u.email === email.toLowerCase());
  return user ? toPublicUser(user) : null;
}

export async function createUser(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
  accountType: AccountType;
  lang: "fr" | "ar";
}): Promise<SessionUser> {
  const users = await ensureStore();
  const email = input.email.toLowerCase();
  if (users.some((u) => u.email === email)) {
    throw new AuthError("EMAIL_EXISTS");
  }
  const user: StoredUser = {
    id: randomBytes(16).toString("hex"),
    name: input.name,
    email,
    phone: input.phone,
    accountType: isValidAccountType(input.accountType) ? input.accountType : "user",
    lang: input.lang,
    createdAt: new Date().toISOString(),
    hash: await hashPassword(input.password),
  };
  users.push(user);
  await writeStore();
  return toPublicUser(user);
}

function isValidAccountType(role: unknown): role is AccountType {
  return typeof role === "string" && (VALID_ACCOUNT_TYPES as readonly string[]).includes(role);
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<SessionUser | null> {
  const users = await ensureStore();
  const stored = users.find((u) => u.email === email.toLowerCase());
  if (!stored) return null;

  if (stored.lockedUntil && Date.now() < new Date(stored.lockedUntil).getTime()) {
    throw new AuthError("ACCOUNT_LOCKED");
  }

  const ok = await verifyPassword(password, stored.hash);
  if (!ok) {
    stored.failedAttempts = (stored.failedAttempts ?? 0) + 1;
    if (stored.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      stored.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS).toISOString();
      stored.failedAttempts = 0;
    }
    await writeStore();
    throw new AuthError("INVALID_CREDENTIALS");
  }

  if (stored.failedAttempts) {
    delete stored.failedAttempts;
  }
  if (stored.lockedUntil) {
    delete stored.lockedUntil;
  }
  await writeStore();
  return toPublicUser(stored);
}

export function createSession(user: SessionUser): string {
  const payload: SessionPayload = {
    uid: user.id,
    role: user.accountType,
    exp: Date.now() + SESSION_TTL_SECONDS * 1000,
  };
  const payloadPart = toBase64Url(JSON.stringify(payload));
  const signature = sign(payloadPart);
  return `${payloadPart}.${signature}`;
}

export function verifySession(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const [payloadPart, signature] = token.split(".");
  if (!payloadPart || !signature) return null;
  if (!timingSafeEqual(Buffer.from(signature, "utf8"), Buffer.from(sign(payloadPart), "utf8"))) {
    return null;
  }
  try {
    const payload = JSON.parse(fromBase64Url(payloadPart)) as SessionPayload;
    if (
      !payload.uid ||
      !isValidAccountType(payload.role) ||
      typeof payload.exp !== "number" ||
      payload.exp < Date.now()
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function getUserFromSessionToken(token: string | undefined | null): Promise<SessionUser | null> {
  const session = verifySession(token);
  if (!session) return null;
  const users = await ensureStore();
  const user = users.find((u) => u.id === session.uid);
  return user ? toPublicUser(user) : null;
}

function sign(payloadPart: string): string {
  return createHmac("sha256", getSecret()).update(payloadPart).digest("base64url");
}

function toBase64Url(data: string): string {
  return Buffer.from(data, "utf8").toString("base64url");
}

function fromBase64Url(data: string): string {
  return Buffer.from(data, "base64url").toString("utf8");
}