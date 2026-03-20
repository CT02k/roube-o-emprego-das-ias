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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/client-api";
import type { CreateReportInput, ReportReason, ReportTargetType } from "@/lib/types";
import { FlagIcon } from "lucide-react";
import { useState } from "react";

type ReportButtonProps = {
  sessionId: string;
  targetType: ReportTargetType;
  targetId: string;
  compact?: boolean;
  iconOnly?: boolean;
  className?: string;
};

const reasonOptions: Array<{ value: ReportReason; label: string }> = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Assédio" },
  { value: "hateful", label: "Ódio / discriminação" },
  { value: "sexual", label: "Conteúdo sexual" },
  { value: "violence", label: "Violência / apologia" },
  { value: "other", label: "Outro" },
];

export function ReportButton({
  sessionId,
  targetType,
  targetId,
  compact = false,
  iconOnly = false,
  className,
}: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("spam");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    try {
      const payload: CreateReportInput = {
        targetType,
        targetId,
        reason,
        details: details.trim() || undefined,
      };
      await api.createReport(sessionId, payload);
      setSubmitted(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao enviar denúncia.");
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    setOpen(false);
    setTimeout(() => {
      setReason("spam");
      setDetails("");
      setSubmitted(false);
      setError(null);
    }, 150);
  };

  return (
    <>
      <Button
        className={className}
        onClick={() => setOpen(true)}
        size={compact ? "sm" : "default"}
        type="button"
        variant="ghost"
      >
        <FlagIcon className="size-4" />
        {iconOnly ? <span className="sr-only">Denunciar</span> : "Denunciar"}
      </Button>
      <Dialog onOpenChange={(nextOpen) => (nextOpen ? setOpen(true) : close())} open={open}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Denunciar conteúdo</DialogTitle>
            <DialogDescription>
              Isso envia o item para a fila de revisão do admin.
            </DialogDescription>
          </DialogHeader>

          {submitted ? (
            <>
              <p className="text-sm">Denúncia enviada para revisão.</p>
              <DialogFooter>
                <Button onClick={close} type="button">
                  Fechar
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-sm font-medium">Motivo</p>
                <Select onValueChange={(value) => setReason(value as ReportReason)} value={reason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {reasonOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Detalhes</p>
                <Textarea
                  onChange={(event) => setDetails(event.target.value)}
                  placeholder="Opcional. Explique rapidamente o problema."
                  value={details}
                />
              </div>

              {error ? <p className="text-destructive text-sm">{error}</p> : null}

              <DialogFooter>
                <Button onClick={close} type="button" variant="outline">
                  Cancelar
                </Button>
                <Button disabled={busy} onClick={() => void submit()} type="button">
                  {busy ? "Enviando..." : "Enviar denúncia"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
