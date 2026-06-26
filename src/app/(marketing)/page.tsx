import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  ChevronRight,
  CirclePlay,
  Radar,
  Search,
  SlidersHorizontal,
  Tags,
  TriangleAlert,
  UsersRound,
} from "lucide-react";

import { BrandMark } from "@/components/product/brand-mark";
import { GoogleSignInButton } from "@/components/product/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const reviewItems = [
  {
    title: "Large transaction",
    detail: "Rs 18,400 flagged for review",
    icon: TriangleAlert,
    tone: "warning",
  },
  {
    title: "Uncategorized import",
    detail: "12 records need category cleanup",
    icon: Tags,
    tone: "primary",
  },
  {
    title: "Frequent recipient",
    detail: "Metro Card appeared 7 times",
    icon: UsersRound,
    tone: "primary",
  },
  {
    title: "Category shift",
    detail: "Food spend is 24% above average",
    icon: BarChart3,
    tone: "primary",
  },
];

const workflowSteps = [
  {
    title: "Track",
    detail: "Import SMS payments and automatically extract data.",
    icon: Radar,
  },
  {
    title: "Review",
    detail: "AI surfaces what needs attention in one queue.",
    icon: Search,
  },
  {
    title: "Control",
    detail: "Fix categories, set rules, and keep your ledger clean.",
    icon: SlidersHorizontal,
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#020705] text-foreground">
      <section className="relative isolate flex min-h-screen overflow-hidden px-5 py-6 sm:px-8">
        <HeroBackground />

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl flex-col">
          <MarketingTopNav />

          <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12 lg:py-8">
            <div className="landing-reveal max-w-2xl">
              <p className="text-xs font-semibold uppercase leading-none tracking-[0.28em] text-primary">
                Smart expense tracker
              </p>
              <h1 className="mt-6 max-w-2xl text-5xl font-bold leading-[1.02] text-foreground sm:text-6xl xl:text-7xl">
                Track your spending. Let AI handle the cleanup.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-secondary-foreground/80 sm:text-lg">
                TrackCrow turns SMS payments into an organized expense ledger,
                suggests categories, finds duplicate recipients, and creates
                rules that automate recurring transaction cleanup.
              </p>

              <HeroActions className="mt-9" />
            </div>

            <ReviewQueue className="landing-reveal [animation-delay:140ms]" />
          </div>

          <WorkflowBar className="landing-reveal [animation-delay:240ms]" />
        </div>
      </section>
    </main>
  );
}

function MarketingTopNav() {
  return (
    <header className="flex items-center justify-between gap-4">
      <Link
        href="/"
        className="inline-flex w-fit items-center rounded-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="TrackCrow home"
      >
        <BrandMark
          size="compact"
          markClassName="h-10 w-10 rounded-[12px] border-primary/25 shadow-[0_0_20px_rgba(59,211,129,0.22)]"
          textClassName="text-xs font-semibold tracking-[0.3em]"
        />
      </Link>
      <nav aria-label="Primary" className="flex items-center gap-2 sm:gap-4">
        <GoogleSignInButton
          size="sm"
          className="rounded-[8px] px-3 py-2 text-sm font-semibold text-secondary-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Sign in
        </GoogleSignInButton>
        <Button
          asChild
          size="sm"
          className="min-h-10 rounded-[8px] bg-primary px-4 text-sm shadow-[0_0_22px_rgba(74,222,128,0.2)] hover:bg-primary/95"
        >
          <Link href="/dashboard">
            Open dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </nav>
    </header>
  );
}

function HeroActions({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-4", className)}>
      <Button
        asChild
        className="min-h-12 min-w-[210px] rounded-[8px] bg-primary px-6 text-sm shadow-[0_0_24px_rgba(74,222,128,0.18)] hover:bg-primary/95"
      >
        <Link href="/dashboard">
          Open dashboard
          <ArrowRight className="h-5 w-5" />
        </Link>
      </Button>
      <Button
        asChild
        variant="secondary"
        className="min-h-12 min-w-[210px] rounded-[8px] border-primary/40 bg-[#07120e]/72 px-6 text-sm text-secondary-foreground/80 backdrop-blur-md hover:border-primary/70 hover:bg-[#0b1a13]"
      >
        <Link href="/login">
          <CirclePlay className="h-5 w-5 text-primary" />
          See how it works
        </Link>
      </Button>
    </div>
  );
}

function ReviewQueue({ className }: { className?: string }) {
  return (
    <section
      aria-label="Review queue"
      className={cn("relative mx-auto w-full max-w-[560px] lg:mr-0", className)}
    >
      <div className="absolute -left-10 -top-12 h-12 w-12 rounded-full bg-[#4a3c08]/55 blur-[1px] shadow-[0_0_28px_rgba(242,184,75,0.18)]" />
      <div className="relative rounded-[16px] border border-primary/30 bg-[#06110d]/78 p-5 shadow-[0_0_56px_rgba(20,150,80,0.14),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl sm:p-6">
        <div className="absolute right-6 top-6 grid h-11 w-11 place-items-center rounded-[8px] border border-primary/20 bg-primary/8 text-primary shadow-[0_0_18px_rgba(74,222,128,0.12)]">
          <BarChart3 className="h-5 w-5" />
        </div>

        <div className="pr-14">
          <h2 className="text-2xl font-bold leading-tight text-foreground">
            Review queue
          </h2>
          <p className="mt-2 flex flex-wrap items-baseline gap-3 text-base text-secondary-foreground/70">
            <span className="text-4xl font-bold leading-none text-primary">
              256
            </span>
            items need attention
          </p>
        </div>

        <div className="mt-6 space-y-3">
          {reviewItems.map((item) => (
            <ReviewQueueRow key={item.title} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ReviewQueueRow({ item }: { item: (typeof reviewItems)[number] }) {
  const isWarning = item.tone === "warning";

  return (
    <article className="group grid min-h-[74px] grid-cols-[auto_1fr_auto] items-center gap-4 rounded-[8px] border border-white/13 bg-black/20 px-3 py-3 transition-colors hover:border-primary/34 hover:bg-primary/5 sm:px-4">
      <span
        className={cn(
          "grid h-12 w-12 place-items-center rounded-[8px] border",
          isWarning
            ? "border-accent/12 bg-accent/10 text-[#f5c339]"
            : "border-primary/10 bg-primary/9 text-primary"
        )}
      >
        <item.icon className="h-6 w-6" />
      </span>
      <div className="min-w-0">
        <h3 className="truncate text-sm font-semibold text-foreground sm:text-base">
          {item.title}
        </h3>
        <p className="mt-1 truncate text-sm leading-5 text-secondary-foreground/75">
          {item.detail}
        </p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-secondary-foreground/70 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
    </article>
  );
}

function WorkflowBar({ className }: { className?: string }) {
  return (
    <section
      aria-label="Review workflow"
      className={cn(
        "mx-auto grid w-full max-w-3xl gap-5 pb-1 sm:grid-cols-3 sm:gap-0",
        className
      )}
    >
      {workflowSteps.map((step, index) => (
        <div
          key={step.title}
          className={cn(
            "flex items-center justify-center gap-3 px-4 text-left",
            index > 0 && "sm:border-l sm:border-white/20"
          )}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-primary/20 bg-primary/10 text-primary">
            <step.icon className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-foreground">{step.title}</h2>
            <p className="mt-1 text-xs leading-5 text-secondary-foreground/75">
              {step.detail}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}

function HeroBackground() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_18%,rgba(50,169,98,0.18),transparent_33%),radial-gradient(circle_at_5%_92%,rgba(69,211,129,0.13),transparent_28%),linear-gradient(105deg,#010403_0%,#07120e_43%,#020604_100%)]" />
      <div className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(104,211,145,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(104,211,145,0.08)_1px,transparent_1px)] [background-size:72px_72px]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(1,5,3,0.92)_0%,rgba(1,5,3,0.52)_43%,rgba(1,5,3,0.78)_100%)]" />

      <div className="absolute left-[36%] top-[2%] hidden h-[260px] w-[58%] opacity-50 lg:block">
        <div className="absolute left-[13%] top-[21%] h-[125px] w-[58%] origin-left -skew-y-[14deg] bg-[#103323]/55 [clip-path:polygon(0_72%,62%_0,100%_48%,20%_100%)]" />
        <div className="absolute left-[38%] top-[8%] h-[94px] w-[36%] bg-[#1a5739]/44 [clip-path:polygon(0_0,100%_70%,11%_100%)]" />
        <div className="absolute left-[56%] top-[30%] h-[150px] w-[42%] bg-[#1b6b43]/47 [clip-path:polygon(0_16%,62%_0,100%_72%,16%_100%)]" />
        <div className="absolute left-[5%] top-[55%] h-[56px] w-[54%] bg-[#071711]/75 [clip-path:polygon(0_100%,100%_0,86%_100%)]" />
        <div className="absolute left-[52%] top-[55%] h-[64px] w-[40%] bg-[#113a28]/70 [clip-path:polygon(0_100%,100%_0,82%_100%)]" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-[linear-gradient(180deg,transparent,#020705_82%)]" />
    </div>
  );
}
