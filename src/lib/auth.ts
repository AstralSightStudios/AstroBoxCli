import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { createHash, createPrivateKey, generateKeyPairSync, sign } from "node:crypto";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";

import { AstroBoxApiError, requestAstroBoxPublic } from "./api";

const REQUESTED_SCOPES = [
  "device.read",
  "device.control",
  "resource.read",
  "resource.control",
  "resource.install",
  "queue.read",
  "queue.control",
  "provider.read",
  "provider.control",
];

const PAIRING_TIMEOUT_MS = 5 * 60 * 1000;
const POLL_INTERVAL_MS = 1000;

type StoredCredentials = {
  version: 1;
  clientName: string;
  publicKey: string;
  privateKeyPkcs8: string;
  fingerprint: string;
  token?: string;
  expiresAt?: string;
  clientId?: string;
  scopes?: string[];
  deviceAllowlist?: string[];
};

type PairingCreated = {
  pairingId: string;
  state: string;
  expiresAt: string;
};

type PairingStatus = {
  state: string;
  scopes?: string[];
  deviceAllowlist?: string[];
  expiresAt?: string;
};

type ChallengeResponse = {
  challengeId: string;
  signingPayload: string;
  expiresAt: string;
};

type SessionResponse = {
  token: string;
  tokenType: string;
  expiresAt: string;
  clientId: string;
  scopes: string[];
  deviceAllowlist: string[];
};

let credentials: StoredCredentials | undefined;
let sessionPromise: Promise<string> | undefined;

function credentialsPath(): string {
  const configuredPath = process.env.ASTROBOX_CLI_CONFIG;
  if (configuredPath) {
    return resolve(configuredPath);
  }

  const configHome = process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config");
  return join(configHome, "astrobox-cli", "credentials.json");
}

function saveCredentials(): void {
  if (!credentials) return;

  const path = credentialsPath();
  const directory = dirname(path);
  mkdirSync(directory, { recursive: true, mode: 0o700 });

  const temporaryPath = `${path}.tmp-${process.pid}`;
  writeFileSync(temporaryPath, `${JSON.stringify(credentials, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  chmodSync(temporaryPath, 0o600);
  renameSync(temporaryPath, path);
  chmodSync(path, 0o600);
}

function fingerprintForPublicKey(publicKey: string): string {
  return createHash("sha256")
    .update(Buffer.from(publicKey, "base64url"))
    .digest("hex");
}

function createCredentials(): StoredCredentials {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const publicJwk = publicKey.export({ format: "jwk" }) as { x?: string };
  if (!publicJwk.x) {
    throw new Error("Could not export the AstroBox CLI public key");
  }

  return {
    version: 1,
    clientName: process.env.ASTROBOX_CLI_CLIENT_NAME ?? "astrobox-cli",
    publicKey: publicJwk.x,
    privateKeyPkcs8: privateKey
      .export({ format: "der", type: "pkcs8" })
      .toString("base64"),
    fingerprint: fingerprintForPublicKey(publicJwk.x),
  };
}

function loadCredentials(): StoredCredentials {
  if (credentials) return credentials;

  const path = credentialsPath();
  if (!existsSync(path)) {
    credentials = createCredentials();
    saveCredentials();
    return credentials;
  }

  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as Partial<StoredCredentials>;
    if (
      parsed.version !== 1 ||
      typeof parsed.clientName !== "string" ||
      typeof parsed.publicKey !== "string" ||
      typeof parsed.privateKeyPkcs8 !== "string"
    ) {
      throw new Error("invalid credential fields");
    }

    credentials = {
      version: 1,
      clientName: parsed.clientName,
      publicKey: parsed.publicKey,
      privateKeyPkcs8: parsed.privateKeyPkcs8,
      fingerprint:
        typeof parsed.fingerprint === "string" && parsed.fingerprint
          ? parsed.fingerprint
          : fingerprintForPublicKey(parsed.publicKey),
      token: parsed.token,
      expiresAt: parsed.expiresAt,
      clientId: parsed.clientId,
      scopes: parsed.scopes,
      deviceAllowlist: parsed.deviceAllowlist,
    };
    return credentials;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not read AstroBox CLI credentials at ${path}: ${message}`);
  }
}

function clearSession(): void {
  const current = loadCredentials();
  delete current.token;
  delete current.expiresAt;
  delete current.clientId;
  delete current.scopes;
  delete current.deviceAllowlist;
  saveCredentials();
}

export function invalidateSession(): void {
  clearSession();
}

function sessionIsUsable(current: StoredCredentials): boolean {
  if (!current.token) return false;
  if (!current.expiresAt) return true;

  const expiresAt = Date.parse(current.expiresAt);
  return Number.isFinite(expiresAt) && expiresAt > Date.now() + 5000;
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}

async function createPairing(current: StoredCredentials): Promise<PairingCreated> {
  return requestAstroBoxPublic<PairingCreated>("/v2/auth/pairing-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientName: current.clientName,
      publicKey: current.publicKey,
      requestedScopes: REQUESTED_SCOPES,
      deviceAllowlist: [],
    }),
  });
}

async function waitForPairing(current: StoredCredentials): Promise<void> {
  const pairing = await createPairing(current);
  console.error(
    `AstroBox CLI pairing requested (${pairing.pairingId}). Approve it in AstroBox to continue.`,
  );

  const expiresAt = Date.parse(pairing.expiresAt);
  const deadline = Math.min(
    Date.now() + PAIRING_TIMEOUT_MS,
    Number.isFinite(expiresAt) ? expiresAt : Date.now() + PAIRING_TIMEOUT_MS,
  );

  while (Date.now() < deadline) {
    const status = await requestAstroBoxPublic<PairingStatus>(
      `/v2/auth/pairing-requests/${encodeURIComponent(pairing.pairingId)}`,
    );
    if (status.state === "granted") return;
    if (status.state === "denied") {
      throw new Error("AstroBox CLI pairing was denied");
    }
    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error("Timed out waiting for AstroBox CLI pairing approval");
}

async function createSession(current: StoredCredentials): Promise<string> {
  let challenge: ChallengeResponse;
  try {
    challenge = await requestAstroBoxPublic<ChallengeResponse>("/v2/auth/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fingerprint: current.fingerprint }),
    });
  } catch (error) {
    if (!(error instanceof AstroBoxApiError) || error.code !== "client_not_paired") {
      throw error;
    }
    await waitForPairing(current);
    challenge = await requestAstroBoxPublic<ChallengeResponse>("/v2/auth/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fingerprint: current.fingerprint }),
    });
  }

  const privateKey = createPrivateKey({
    key: Buffer.from(current.privateKeyPkcs8, "base64"),
    format: "der",
    type: "pkcs8",
  });
  const signingPayload = Buffer.from(challenge.signingPayload, "base64url");
  const signature = sign(null, signingPayload, privateKey).toString("base64url");

  const session = await requestAstroBoxPublic<SessionResponse>("/v2/auth/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      challengeId: challenge.challengeId,
      signature,
    }),
  });

  current.token = session.token;
  current.expiresAt = session.expiresAt;
  current.clientId = session.clientId;
  current.scopes = session.scopes;
  current.deviceAllowlist = session.deviceAllowlist;
  saveCredentials();
  return session.token;
}

async function authenticate(force: boolean): Promise<string> {
  const current = loadCredentials();
  if (force) clearSession();
  if (!force && sessionIsUsable(current)) return current.token as string;
  return createSession(current);
}

export function getSessionToken(force = false): Promise<string> {
  if (!sessionPromise) {
    sessionPromise = authenticate(force).finally(() => {
      sessionPromise = undefined;
    });
  }
  return sessionPromise;
}

export function getCredentialsFilePath(): string {
  return credentialsPath();
}
