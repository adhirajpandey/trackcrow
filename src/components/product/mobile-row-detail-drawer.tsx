"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

export function MobileRowDetailDrawer({
  open,
  onOpenChange,
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  headerAction,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  headerAction?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="md:hidden">
        <DrawerHeader className={cn(headerAction && "grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3")}>
          <div className="min-w-0">
            <DrawerTitle className="overflow-wrap-anywhere break-words">{title}</DrawerTitle>
            {description ? <DrawerDescription>{description}</DrawerDescription> : null}
          </div>
          {headerAction ? <div className="shrink-0 pt-0.5">{headerAction}</div> : null}
        </DrawerHeader>
        <div className="max-w-full overflow-y-auto px-5 pb-1">{children}</div>
        <DrawerFooter>
          <Button asChild className="w-full">
            <Link href={primaryHref}>{primaryLabel}</Link>
          </Button>
          {secondaryHref && secondaryLabel ? (
            <Button asChild variant="secondary" className="w-full">
              <Link href={secondaryHref}>{secondaryLabel}</Link>
            </Button>
          ) : null}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
