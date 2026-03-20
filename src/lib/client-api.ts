"use client";

import { historyClient } from "@/lib/api/history-client";
import { adminClient } from "@/lib/api/admin-client";
import { promptsClient } from "@/lib/api/prompts-client";
import { reportClient } from "@/lib/api/report-client";
import { shareClient } from "@/lib/api/share-client";

export const api = {
  ...historyClient,
  ...promptsClient,
  ...adminClient,
  ...reportClient,
  ...shareClient,
};
