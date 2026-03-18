type PromptEventType = "created" | "claimed" | "released" | "responded";

type PromptEvent = {
  type: PromptEventType;
  promptId: string;
  requesterSessionId?: string;
  claimedBySessionId?: string | null;
  createdAt: string;
};

type Listener = (event: PromptEvent) => void;

type RealtimeGlobal = {
  promptListeners?: Set<Listener>;
};

const realtimeGlobal = globalThis as unknown as RealtimeGlobal;

const listeners = realtimeGlobal.promptListeners ?? new Set<Listener>();
if (!realtimeGlobal.promptListeners) {
  realtimeGlobal.promptListeners = listeners;
}

export const subscribePromptEvents = (listener: Listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const publishPromptEvent = (event: PromptEvent) => {
  for (const listener of listeners) {
    listener(event);
  }
};
