"use client";

import { AppMode } from "@/lib/types";
import { create } from "zustand";

type UIState = {
  mode: AppMode;
  selectedPromptId: string | null;
  textDraft: string;
  imageDraftDataUrl: string | null;
  setMode: (mode: AppMode) => void;
  setSelectedPromptId: (id: string | null) => void;
  setTextDraft: (value: string) => void;
  setImageDraftDataUrl: (value: string | null) => void;
  clearDraft: () => void;
};

export const useUIStore = create<UIState>((set) => ({
  mode: "requester",
  selectedPromptId: null,
  textDraft: "",
  imageDraftDataUrl: null,
  setMode: (mode) => set({ mode }),
  setSelectedPromptId: (selectedPromptId) => set({ selectedPromptId }),
  setTextDraft: (textDraft) => set({ textDraft }),
  setImageDraftDataUrl: (imageDraftDataUrl) => set({ imageDraftDataUrl }),
  clearDraft: () => set({ textDraft: "", imageDraftDataUrl: null }),
}));
