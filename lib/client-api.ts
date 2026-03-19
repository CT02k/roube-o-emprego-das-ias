"use client";

import { adminClient } from "@/lib/api/admin-client";
import { promptsClient } from "@/lib/api/prompts-client";
import { shareClient } from "@/lib/api/share-client";

export const api = {
  ...promptsClient,
  ...adminClient,
  ...shareClient,
};
