"use client";

import { ShareDialog } from "@/components/share-dialog";
import { Button } from "@/components/ui/button";
import type { SharePayload } from "@/lib/types";
import { Share2Icon } from "lucide-react";
import { useState } from "react";

const NATIVE_SHARE_ENABLED =
  process.env.NEXT_PUBLIC_NATIVE_SHARE_ENABLED === "true";

type HistoryShareButtonProps = {
  payload: SharePayload;
  variant?: "default" | "outline" | "secondary" | "ghost";
  className?: string;
};

export function HistoryShareButton({
  payload,
  variant = "outline",
  className,
}: HistoryShareButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        className={className}
        onClick={() => setOpen(true)}
        type="button"
        variant={variant}
      >
        <Share2Icon />
        Compartilhar
      </Button>
      <ShareDialog
        error={null}
        loading={false}
        nativeShareEnabled={NATIVE_SHARE_ENABLED}
        onOpenChange={setOpen}
        open={open}
        payload={payload}
      />
    </>
  );
}
