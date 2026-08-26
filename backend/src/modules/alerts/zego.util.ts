import { createCipheriv, randomBytes } from "crypto";

type TokenPayload = {
  app_id: number;
  user_id: string;
  nonce: number;
  ctime: number;
  expire: number;
  payload: string;
};

export function generateZegoToken04(
  appId: number,
  userId: string,
  serverSecret: string,
  effectiveTimeInSeconds = 3600,
  payload = "",
): string {
  if (!appId || !userId || serverSecret.length !== 32) {
    throw new Error("Invalid ZEGOCLOUD credentials");
  }

  const now = Math.floor(Date.now() / 1000);
  const token: TokenPayload = {
    app_id: appId,
    user_id: userId,
    nonce: randomBytes(8).readUInt32BE(0),
    ctime: now,
    expire: now + effectiveTimeInSeconds,
    payload,
  };

  const plainText = JSON.stringify(token);
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", Buffer.from(serverSecret), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);

  const bytes = Buffer.concat([
    Buffer.from([0, 16]),
    iv,
    Buffer.from([0, encrypted.length >> 8, encrypted.length & 0xff]),
    encrypted,
  ]);

  return `04${bytes.toString("base64")}`;
}
