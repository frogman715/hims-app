const MIN_SECRET_LENGTH = 32;
const MIN_CRYPTO_KEY_LENGTH = 32;
const MIN_SERVER_ACTIONS_KEY_LENGTH = 32;

const raw = {
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET?.trim(),
  NEXTAUTH_URL: process.env.NEXTAUTH_URL?.trim(),
  DATABASE_URL: process.env.DATABASE_URL?.trim(),
  HIMS_CRYPTO_KEY: process.env.HIMS_CRYPTO_KEY,
  NEXT_SERVER_ACTIONS_ENCRYPTION_KEY: process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY,
};

const issues: string[] = [];

const hasNextAuthSecret =
  typeof raw.NEXTAUTH_SECRET === "string" && raw.NEXTAUTH_SECRET.length >= MIN_SECRET_LENGTH;
if (!hasNextAuthSecret) {
  issues.push(`NEXTAUTH_SECRET must be set and at least ${MIN_SECRET_LENGTH} characters.`);
}

const hasDatabaseUrl = typeof raw.DATABASE_URL === "string" && raw.DATABASE_URL.length > 0;
if (!hasDatabaseUrl) {
  issues.push("DATABASE_URL must be set.");
}

const hasCryptoKey =
  typeof raw.HIMS_CRYPTO_KEY === "string" && raw.HIMS_CRYPTO_KEY.length >= MIN_CRYPTO_KEY_LENGTH;
if (!hasCryptoKey) {
  issues.push(`HIMS_CRYPTO_KEY must be set and at least ${MIN_CRYPTO_KEY_LENGTH} characters.`);
}

const hasServerActionsKey =
  typeof raw.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY === "string" && 
  raw.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY.length >= MIN_SERVER_ACTIONS_KEY_LENGTH;
if (!hasServerActionsKey && process.env.NODE_ENV === "production") {
  issues.push(`NEXT_SERVER_ACTIONS_ENCRYPTION_KEY must be set and at least ${MIN_SERVER_ACTIONS_KEY_LENGTH} characters in production.`);
}

if (issues.length > 0 && process.env.NODE_ENV !== "test") {
  console.error("[env] configuration issues detected", { issues });
}

export const env = Object.freeze({
  NEXTAUTH_SECRET: hasNextAuthSecret ? raw.NEXTAUTH_SECRET! : undefined,
  NEXTAUTH_URL: raw.NEXTAUTH_URL,
  DATABASE_URL: hasDatabaseUrl ? raw.DATABASE_URL! : undefined,
  HIMS_CRYPTO_KEY: hasCryptoKey ? raw.HIMS_CRYPTO_KEY! : undefined,
  NEXT_SERVER_ACTIONS_ENCRYPTION_KEY: hasServerActionsKey ? raw.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY! : undefined,
  hasNextAuthSecret,
  hasDatabaseUrl,
  hasCryptoKey,
  hasServerActionsKey,
  issues,
});

export type EnvState = typeof env;
export const envReady = env.issues.length === 0;