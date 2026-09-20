import { createHmac, randomBytes, scrypt, timingSafeEqual } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import {
  VALID_ACCOUNT_TYPES,
  type AccountType,
  type SessionUser,
} from "@/lib/auth-types";
import { ensureSchema, isDbConfigured, isUniqueViolation, query } from "@/lib/db";

const USERS_FILE = path.join(tmpdir(), "soukline", "users.json");
const SECRET_FILE = path.join(tmpdir(), "soukline", ".secret");
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

export const SESSION_COOKIE = "soukdz_session";

const useDb = isDbConfigured();

export function sessionCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

export function isSecureRequest(forwardedProto: string | null, url: string): boolean {
  if (forwardedProto) {
    return forwardedProto.split(",")[0].trim().toLowerCase() === "https";
  }
  return url.startsWith("https");
}

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

interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  account_type: string;
  lang: string;
  created_at: Date;
  hash: string;
  failed_attempts: number;
  locked_until: Date | null;
}

let usersCache: StoredUser[] | null = null;
let seedPromise: Promise<void> | null = null;

function getSecret(): string {
  const fromEnv = process.env.SESSION_SECRET;
  if (fromEnv && fromEnv.length >= 32) return fromEnv;

  try {
    mkdirSync(path.dirname(SECRET_FILE), { recursive: true });
    try {
      const existing = readFileSync(SECRET_FILE, "utf8").trim();
      if (existing.length >= 32) return existing;
    } catch {
      // no persisted secret yet
    }
    const generated = randomBytes(48).toString("hex");
    writeFileSync(SECRET_FILE, generated, { mode: 0o600 });
    console.warn(
      `[auth] SESSION_SECRET not configured - generated a per-host secret at ${SECRET_FILE}. ` +
        "Set SESSION_SECRET (>= 32 chars) in your environment for stable multi-instance sessions."
    );
    return generated;
  } catch {
    throw new Error("SESSION_SECRET is not configured. Add it to .env.local");
  }
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

function isValidAccountType(role: unknown): role is AccountType {
  return typeof role === "string" && (VALID_ACCOUNT_TYPES as readonly string[]).includes(role);
}

function rowToStored(row: UserRow): StoredUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    accountType: isValidAccountType(row.account_type) ? row.account_type : "user",
    lang: row.lang === "ar" ? "ar" : "fr",
    createdAt: row.created_at.toISOString(),
    hash: row.hash,
    failedAttempts: row.failed_attempts,
    lockedUntil: row.locked_until ? row.locked_until.toISOString() : undefined,
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

const DEFAULT_ACCOUNTS: Array<{
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

async function seedAccounts(): Promise<StoredUser[]> {
  const users: StoredUser[] = [];
  for (const acc of DEFAULT_ACCOUNTS) {
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

async function seedDbAccounts(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    await ensureSchema();
    for (const acc of DEFAULT_ACCOUNTS) {
      const rows = await query<UserRow>("SELECT * FROM app_users WHERE email = $1", [acc.email]);
      if (rows.length > 0) continue;
      const id = randomBytes(16).toString("hex");
      const hash = await hashPassword(acc.password);
      await query(
        `INSERT INTO app_users (id, name, email, phone, account_type, lang, created_at, hash, failed_attempts, locked_until)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, NULL)
         ON CONFLICT (email) DO NOTHING`,
        [id, acc.name, acc.email, acc.phone, acc.accountType, "fr", new Date().toISOString(), hash]
      );
    }
  })();
  return seedPromise;
}

async function findStoredByEmail(email: string): Promise<StoredUser | null> {
  const normalized = email.toLowerCase();
  if (useDb) {
    await seedDbAccounts();
    const rows = await query<UserRow>("SELECT * FROM app_users WHERE email = $1", [normalized]);
    return rows.length > 0 ? rowToStored(rows[0]) : null;
  }
  const users = await ensureStore();
  return users.find((u) => u.email === normalized) ?? null;
}

async function findStoredById(id: string): Promise<StoredUser | null> {
  if (useDb) {
    await seedDbAccounts();
    const rows = await query<UserRow>("SELECT * FROM app_users WHERE id = $1", [id]);
    return rows.length > 0 ? rowToStored(rows[0]) : null;
  }
  const users = await ensureStore();
  return users.find((u) => u.id === id) ?? null;
}

export async function findUserByEmail(email: string): Promise<SessionUser | null> {
  const user = await findStoredByEmail(email);
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
  const email = input.email.toLowerCase();
  const hash = await hashPassword(input.password);
  const user: StoredUser = {
    id: randomBytes(16).toString("hex"),
    name: input.name,
    email,
    phone: input.phone,
    accountType: isValidAccountType(input.accountType) ? input.accountType : "user",
    lang: input.lang === "ar" ? "ar" : "fr",
    createdAt: new Date().toISOString(),
    hash,
  };

  if (useDb) {
    await seedDbAccounts();
    try {
      await query(
        `INSERT INTO app_users (id, name, email, phone, account_type, lang, created_at, hash, failed_attempts, locked_until)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, NULL)`,
        [user.id, user.name, email, user.phone, user.accountType, user.lang, user.createdAt, hash]
      );
    } catch (err) {
      if (isUniqueViolation(err)) throw new AuthError("EMAIL_EXISTS");
      throw err;
    }
    return toPublicUser(user);
  }

  const users = await ensureStore();
  if (users.some((u) => u.email === email)) {
    throw new AuthError("EMAIL_EXISTS");
  }
  users.push(user);
  await writeStore();
  return toPublicUser(user);
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<SessionUser | null> {
  const stored = await findStoredByEmail(email);
  if (!stored) return null;

  if (stored.lockedUntil && Date.now() < new Date(stored.lockedUntil).getTime()) {
    throw new AuthError("ACCOUNT_LOCKED");
  }

  const ok = await verifyPassword(password, stored.hash);
  if (!ok) {
    const attempts = (stored.failedAttempts ?? 0) + 1;
    const lockedUntil =
      attempts >= MAX_FAILED_ATTEMPTS
        ? new Date(Date.now() + LOCK_DURATION_MS).toISOString()
        : null;
    if (useDb) {
      await query(
        "UPDATE app_users SET failed_attempts = $1, locked_until = $2 WHERE email = $3",
        [attempts, lockedUntil, stored.email]
      );
    } else {
      stored.failedAttempts = attempts;
      if (lockedUntil) stored.lockedUntil = lockedUntil;
      await writeStore();
    }
    throw new AuthError("INVALID_CREDENTIALS");
  }

  if (useDb) {
    await query(
      "UPDATE app_users SET failed_attempts = 0, locked_until = NULL WHERE email = $1",
      [stored.email]
    );
  } else {
    delete stored.failedAttempts;
    delete stored.lockedUntil;
    await writeStore();
  }
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
  try {
    const [payloadPart, signature] = token.split(".");
    if (!payloadPart || !signature) return null;
    const provided = Buffer.from(signature, "utf8");
    const expected = Buffer.from(sign(payloadPart), "utf8");
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      return null;
    }
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
  const user = await findStoredById(session.uid);
  return user ? toPublicUser(user) : null;
}

export async function getUserFromRequest(request: Request): Promise<SessionUser | null> {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = cookieHeader
    .split(";")
    .find((c) => c.trim().startsWith(`${SESSION_COOKIE}=`))
    ?.split("=")
    .slice(1)
    .join("=");
  return getUserFromSessionToken(token ? decodeURIComponent(token.trim()) : null);
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