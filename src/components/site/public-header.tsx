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
        "sticky top-4 z-20 w-full max-w-full overflow-x-hidden rounded-sm border border-border bg-card/95 px-4 py-3 shadow-sm backdrop-blur",
        className,
      )}
    >
      <div className="flex flex-col gap-4">
        {/* <div className="flex min-w-0 flex-wrap items-center gap-2 text-muted-foreground text-xs">
          <Link
            className="font-medium text-foreground transition-colors hover:text-primary"
            href="/"
          >
            Roube o emprego das IAs
          </Link>
          <span className="text-border">/</span>
          <span className="truncate">{currentPage}</span>
        </div> */}

        <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <h1 className="font-semibold text-base sm:text-lg">{title}</h1>
            {description ? (
              <p className="text-muted-foreground text-xs sm:text-sm">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex min-w-0 w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center xl:w-auto xl:justify-end">
              {actions}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
