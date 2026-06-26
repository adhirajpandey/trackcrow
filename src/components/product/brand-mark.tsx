import Image from "next/image";

import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  size?: "compact" | "full";
  showText?: boolean;
};

const markSizeClasses = {
  compact: "h-10 w-10",
  full: "h-14 w-14",
};

const textSizeClasses = {
  compact: "text-[11px] tracking-[0.22em]",
  full: "text-xs tracking-[0.24em]",
};

export function BrandMark({
  className,
  markClassName,
  textClassName,
  size = "full",
  showText = true,
}: BrandMarkProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span
        className={cn(
          "relative shrink-0 overflow-hidden rounded-[14px] border border-primary/20 bg-[#07130f] shadow-[0_0_18px_rgba(104,211,145,0.16)]",
          markSizeClasses[size],
          markClassName
        )}
      >
        <Image
          src="/brand/trackcrow-logo.png"
          alt={showText ? "" : "TrackCrow"}
          fill
          sizes={size === "compact" ? "40px" : "56px"}
          className="object-cover"
          priority={size === "full"}
        />
      </span>
      {showText ? (
        <span
          className={cn(
            "font-semibold uppercase leading-none text-primary",
            textSizeClasses[size],
            textClassName
          )}
        >
          TrackCrow
        </span>
      ) : null}
    </div>
  );
}
