import { createHash } from "node:crypto";

import type { DailyCardStorageScope } from "./storage";

export function deriveDailyCardUserScope(userId: string): DailyCardStorageScope {
  const digest = createHash("sha256").update(userId, "utf8").digest("hex");
  return `user:${digest}`;
}
