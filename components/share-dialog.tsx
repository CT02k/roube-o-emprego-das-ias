"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Share2Icon, ShuffleIcon } from "lucide-react";
import NextImage from "next/image";
import { useEffect, useMemo, useState } from "react";
import { SharePayload } from "@/lib/types";

const CAPTIONS = [
  "Eu nao preciso de IAs, olha isso:",
  "A solução pras IAs ladronas de empregos:",
  "Quando o humano responde melhor que o bot:",
  "Sem modelo, sem GPU, sem desculpa:",
  "Chamaram uma IA? Veio um humano raiz:",
];

const WATERMARK = "roube-o-emprego-das-ias.cfd";
const CTA_TEXT = "Ajude a roubar os empregos da IA:";
const MODEL_NAME = "CLT-5.3-Mini";
const LAST_SHARE_CAPTION_KEY = "share-last-caption-index";
const SHARE_TEXT = `IAs vão roubar nossos empregos?

A gente resolveu roubar de volta.

Conheça o CLT-5.3-mini — respostas feitas por humanos, em tempo real.

Sem IA.
Sem escala.
Só humanos.

🔁 Junte-se a revolução! #roubeoempregodasias
https://roube-o-emprego-das-ias.cfd/`;

const pickDifferentCaption = (blockedIndex: number) => {
  if (CAPTIONS.length <= 1) {
    return 0;
  }

  let next = Math.floor(Math.random() * CAPTIONS.length);
  if (next === blockedIndex) {
    next = (next + 1) % CAPTIONS.length;
  }
  return next;
};

const clampText = (value: string, max = 260) =>
  value.length > max ? `${value.slice(0, max - 3)}...` : value;

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const r = 16;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
) {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    const width = ctx.measureText(test).width;
    if (width > maxWidth && current) {
      lines.push(current);
      current = word;
      if (lines.length >= maxLines - 1) {
        break;
      }
    } else {
      current = test;
    }
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  lines.forEach((line, idx) => {
    ctx.fillText(line, x, y + idx * lineHeight);
  });
}

type ShareDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payload: SharePayload | null;
  loading: boolean;
  error: string | null;
  nativeShareEnabled: boolean;
};

export function ShareDialog({
  open,
  onOpenChange,
  payload,
  loading,
  error,
  nativeShareEnabled,
}: ShareDialogProps) {
  const [captionIndex, setCaptionIndex] = useState(0);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareErrorMessage, setShareErrorMessage] = useState<string | null>(null);

  const caption = CAPTIONS[captionIndex];

  useEffect(() => {
    if (!open) {
      return;
    }

    const raw = window.localStorage.getItem(LAST_SHARE_CAPTION_KEY);
    const lastUsed = raw ? Number(raw) : -1;
    setCaptionIndex(pickDifferentCaption(Number.isNaN(lastUsed) ? -1 : lastUsed));
  }, [open]);

  const sourceKey = useMemo(
    () =>
      payload
        ? `${payload.promptText}|${payload.responseType}|${payload.responseText}|${payload.responseImageDataUrl}|${caption}`
        : caption,
    [payload, caption]
  );

  useEffect(() => {
    if (!payload) {
      setImageDataUrl(null);
      return;
    }

    let active = true;
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 900;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setImageDataUrl(null);
      return;
    }

    ctx.fillStyle = "#171717";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#f5f5f5";
    ctx.font = "bold 46px 'Space Grotesk', sans-serif";
    wrapText(ctx, caption, 70, 96, 1060, 56, 2);

    ctx.fillStyle = "#404040";
    drawRoundedRect(ctx, 70, 124, 250, 48);
    ctx.fill();
    ctx.fillStyle = "#e5e5e5";
    ctx.font = "600 22px 'IBM Plex Mono', monospace";
    ctx.fillText(MODEL_NAME, 88, 157);

    const isImageResponse = payload.responseType === "image";
    const promptY = 200;
    const promptH = isImageResponse ? 140 : 180;
    const responseY = isImageResponse ? 370 : 430;
    const responseH = isImageResponse ? 390 : 180;
    const boxX = 70;
    const boxW = 1060;

    ctx.fillStyle = "#262626";
    drawRoundedRect(ctx, boxX, promptY, boxW, promptH);
    ctx.fill();

    ctx.fillStyle = "#101010";
    drawRoundedRect(ctx, boxX, responseY, boxW, responseH);
    ctx.fill();

    ctx.fillStyle = "#a3a3a3";
    ctx.font = "600 24px 'IBM Plex Mono', monospace";
    ctx.fillText("PERGUNTA", boxX + 28, promptY + 42);
    ctx.fillText("RESPOSTA DA IH (Inteligência Humana)", boxX + 28, responseY + 42);

    ctx.fillStyle = "#f5f5f5";
    ctx.font = "500 32px 'Space Grotesk', sans-serif";
    wrapText(ctx, clampText(payload.promptText, 220), boxX + 28, promptY + 88, boxW - 56, 36, 2);

    if (!isImageResponse) {
      wrapText(
        ctx,
        clampText(payload.responseText ?? "Sem texto", 220),
        boxX + 28,
        responseY + 95,
        boxW - 56,
        40,
        2
      );
      if (active) {
        setImageDataUrl(canvas.toDataURL("image/png"));
      }
      return;
    }

    const imageData = payload.responseImageDataUrl;
    if (!imageData) {
      wrapText(ctx, "Resposta em imagem indisponivel.", boxX + 28, responseY + 95, boxW - 56, 40, 2);
      if (active) {
        setImageDataUrl(canvas.toDataURL("image/png"));
      }
      return;
    }

    const img = new Image();
    img.onload = () => {
      if (!active) {
        return;
      }
      const maxW = boxW - 56;
      const maxH = responseH - 80;
      const ratio = Math.min(maxW / img.width, maxH / img.height);
      const drawW = img.width * ratio;
      const drawH = img.height * ratio;
      const drawX = boxX + (boxW - drawW) / 2;
      const drawY = responseY + 56 + (maxH - drawH) / 2;
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      setImageDataUrl(canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
      if (!active) {
        return;
      }
      wrapText(ctx, "Erro ao carregar desenho.", boxX + 28, responseY + 95, boxW - 56, 40, 2);
      setImageDataUrl(canvas.toDataURL("image/png"));
    };
    img.src = imageData;

    ctx.fillStyle = "#737373";
    ctx.font = "600 20px 'IBM Plex Mono', monospace";
    ctx.fillText(WATERMARK, 760, 840);

    ctx.fillStyle = "#262626";
    drawRoundedRect(ctx, 70, 785, 1060, 72);
    ctx.fill();
    ctx.fillStyle = "#d4d4d4";
    ctx.font = "600 26px 'Space Grotesk', sans-serif";
    ctx.fillText(CTA_TEXT, 98, 830);
    ctx.fillStyle = "#fafafa";
    ctx.font = "700 26px 'IBM Plex Mono', monospace";
    ctx.fillText(WATERMARK, 585, 830);

    return () => {
      active = false;
    };
  }, [sourceKey, payload, caption]);

  const onRandomCaption = () => {
    setCaptionIndex((index) => pickDifferentCaption(index));
  };

  const createShareFile = async () => {
    if (!imageDataUrl) {
      return null;
    }

    const blob = await (await fetch(imageDataUrl)).blob();
    return new File([blob], "roube-o-emprego-das-ias.png", {
      type: "image/png",
    });
  };

  const saveShareUsage = () => {
    window.localStorage.setItem(LAST_SHARE_CAPTION_KEY, String(captionIndex));
  };

  const onNativeShare = async () => {
    if (!imageDataUrl || !nativeShareEnabled) {
      return;
    }
    setShareBusy(true);
    setShareErrorMessage(null);
    try {
      if (!navigator.share) {
        setShareErrorMessage("Compartilhamento nativo indisponivel neste dispositivo.");
        return;
      }

      const file = await createShareFile();
      if (!file) {
        return;
      }

      if (navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({
          files: [file],
          text: SHARE_TEXT,
          title: "Roube o emprego das IAs",
        });
        saveShareUsage();
        return;
      }

      setShareErrorMessage("Seu navegador nao aceita compartilhar arquivos de imagem.");
    } finally {
      setShareBusy(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-3xl border-border bg-card">
        <DialogHeader>
          <DialogTitle>Compartilhar</DialogTitle>
          <DialogDescription>
            Espalhe a palavra. Menos hype de IA, mais trabalho humano.
          </DialogDescription>
        </DialogHeader>

        {loading && <p className="text-sm text-muted-foreground">Carregando ultima conversa respondida...</p>}
        {error && <p className="text-destructive text-sm">{error}</p>}
        {shareErrorMessage && <p className="text-destructive text-sm">{shareErrorMessage}</p>}
        {!nativeShareEnabled && (
          <p className="text-muted-foreground text-sm">
            Compartilhamento nativo desativado neste ambiente.
          </p>
        )}

        {imageDataUrl && (
          <div className="overflow-hidden rounded-sm border border-border bg-background p-2">
            <NextImage
              alt="Preview da imagem para compartilhar"
              className="h-auto w-full"
              height={900}
              src={imageDataUrl}
              unoptimized
              width={1200}
            />
          </div>
        )}

        <DialogFooter>
          <Button disabled={!payload || loading} onClick={onRandomCaption} type="button" variant="outline">
            <ShuffleIcon />
            Gerar outra legenda
          </Button>
          <Button
            disabled={!nativeShareEnabled || !imageDataUrl || loading || shareBusy}
            onClick={() => void onNativeShare()}
            type="button"
          >
            <Share2Icon />
            Compartilhar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
