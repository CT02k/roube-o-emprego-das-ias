import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactNode } from "react";

type PublicHeaderProps = {
  currentPage: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function PublicHeader({
  currentPage,
  title,
  description,
  actions,
  className,
}: PublicHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-4 z-20 rounded-sm border border-border bg-card/95 px-4 py-3 backdrop-blur",
        className,
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
          <Link
            className="font-medium text-foreground transition-colors hover:text-primary"
            href="/"
          >
            Roube o emprego das IAs
          </Link>
          <span className="text-border">/</span>
          <span>{currentPage}</span>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="font-semibold text-lg sm:text-xl">{title}</h1>
            {description ? (
              <p className="mt-1 text-muted-foreground text-sm">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex w-full flex-wrap items-center gap-2 xl:w-auto xl:justify-end">
              {actions}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
