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
import { cn } from "@/lib/utils";
import { EraserIcon, PaintbrushIcon } from "lucide-react";
import { PointerEvent, useEffect, useRef, useState } from "react";

type DrawingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (dataUrl: string) => void;
};

const COLORS = ["#f8fafc", "#f97316", "#22d3ee", "#34d399", "#f43f5e", "#facc15"];
const SIZES = [2, 4, 7, 12];

export function DrawingDialog({ open, onOpenChange, onSubmit }: DrawingDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(4);

  const startBackground = "#101624";

  useEffect(() => {
    if (!open) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    ctx.fillStyle = startBackground;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [open]);

  const drawLine = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    ctx.strokeStyle = color;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = size;
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const getPoint = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { x: 0, y: 0 };
    }
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    ctx.fillStyle = startBackground;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
  };

  const submitDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    onSubmit(canvas.toDataURL("image/png"));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl border-border bg-card">
        <DialogHeader>
          <DialogTitle>Gerar imagem sem IA</DialogTitle>
          <DialogDescription>
            Pincel humano no controle. Sem diffusion, sem prompt engineering.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap items-center gap-2">
          {COLORS.map((option) => (
            <button
              aria-label={`Cor ${option}`}
              className={cn(
                "size-8 rounded-full border transition",
                color === option ? "scale-105 border-foreground" : "border-border"
              )}
              key={option}
              onClick={() => setColor(option)}
              style={{ backgroundColor: option }}
              type="button"
            />
          ))}
          <div className="mx-2 h-8 w-px bg-border" />
          {SIZES.map((option) => (
            <Button
              key={option}
              onClick={() => setSize(option)}
              size="sm"
              type="button"
              variant={size === option ? "default" : "outline"}
            >
              <PaintbrushIcon />
              {option}px
            </Button>
          ))}
          <Button onClick={clearCanvas} size="sm" type="button" variant="ghost">
            <EraserIcon />
            Limpar
          </Button>
        </div>
        <div className="overflow-hidden rounded-sm border border-border bg-black">
          <canvas
            className="h-auto w-full touch-none"
            height={720}
            onPointerDown={(event) => {
              const { x, y } = getPoint(event);
              const ctx = canvasRef.current?.getContext("2d");
              if (!ctx) {
                return;
              }
              activePointerIdRef.current = event.pointerId;
              isDrawingRef.current = true;
              event.currentTarget.setPointerCapture(event.pointerId);
              ctx.beginPath();
              ctx.moveTo(x, y);
            }}
            onPointerMove={(event) => {
              if (!isDrawingRef.current || activePointerIdRef.current !== event.pointerId) {
                return;
              }
              const { x, y } = getPoint(event);
              drawLine(x, y);
            }}
            onPointerUp={(event) => {
              if (activePointerIdRef.current === event.pointerId) {
                isDrawingRef.current = false;
                activePointerIdRef.current = null;
                event.currentTarget.releasePointerCapture(event.pointerId);
              }
            }}
            onPointerCancel={(event) => {
              if (activePointerIdRef.current === event.pointerId) {
                isDrawingRef.current = false;
                activePointerIdRef.current = null;
                event.currentTarget.releasePointerCapture(event.pointerId);
              }
            }}
            ref={canvasRef}
            width={1280}
          />
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
            Cancelar
          </Button>
          <Button onClick={submitDrawing} type="button">
            Enviar desenho
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
