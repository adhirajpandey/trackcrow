import type { ComponentType } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Gauge,
  Lightbulb,
  LockKeyhole,
  MessageSquareText,
  Radar,
  ReceiptText,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  WalletCards,
  Zap,
} from "lucide-react";

import { BrandMark } from "@/components/product/brand-mark";
import { GoogleSignInButton } from "@/components/product/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tone = "primary" | "accent" | "info";

const trustNotes = [
  {
    label: "Private by default",
    icon: LockKeyhole,
  },
  {
    label: "You approve every AI suggestion",
    icon: CheckCircle2,
  },
  {
    label: "Built for SMS / UPI / bank payments",
    icon: ShieldCheck,
  },
];

const boardModules = [
  {
    label: "Insight",
    title: "Food spend is up 18% this month",
    detail: "TrackCrow spotted 9 more dining payments than usual.",
    meta: "AI insight",
    icon: Lightbulb,
    tone: "info" as const,
    rotate: "-rotate-1",
  },
  {
    label: "Review queue",
    title: "12 transactions need your approval",
    detail: "Amounts, merchants, and likely categories are ready to confirm.",
    meta: "Review first",
    icon: ClipboardCheck,
    tone: "accent" as const,
    rotate: "rotate-[1.5deg]",
  },
  {
    label: "Smart rule",
    title: "Auto-categorize Swiggy as Food & Dining",
    detail: "Apply the rule only after you approve the suggestion.",
    meta: "Rule draft",
    icon: SlidersHorizontal,
    tone: "primary" as const,
    rotate: "-rotate-[1.2deg]",
  },
  {
    label: "Large spend",
    title: "₹12,450 flight ticket detected",
    detail: "Large and unusual payments stay visible in your queue.",
    meta: "Needs glance",
    icon: Gauge,
    tone: "accent" as const,
    rotate: "rotate-1",
  },
];

const workflowSteps = [
  {
    title: "Import alerts",
    detail: "Securely connect your SMS inbox and payment alerts.",
    icon: MessageSquareText,
    tone: "primary" as const,
  },
  {
    title: "Review AI suggestions",
    detail: "TrackCrow detects merchants, amounts, and likely categories.",
    icon: Sparkles,
    tone: "info" as const,
  },
  {
    title: "Approve categories",
    detail: "You review every suggestion before it changes your ledger.",
    icon: ClipboardCheck,
    tone: "primary" as const,
  },
  {
    title: "Automate future transactions",
    detail: "Create rules so repeat payments land correctly next time.",
    icon: Zap,
    tone: "accent" as const,
  },
];

const features = [
  {
    title: "Track all payments in one place",
    detail: "SMS, UPI, cards, and bank transfers become one readable history.",
    icon: WalletCards,
    tone: "primary" as const,
  },
  {
    title: "Review what changed",
    detail: "See uncategorized, edited, and suggested transactions clearly.",
    icon: Search,
    tone: "info" as const,
  },
  {
    title: "Clean up missing categories",
    detail: "AI suggestions help you classify transactions in seconds.",
    icon: Sparkles,
    tone: "primary" as const,
  },
  {
    title: "Create rules for the future",
    detail: "Teach TrackCrow once and keep repeat merchants organized.",
    icon: SlidersHorizontal,
    tone: "primary" as const,
  },
  {
    title: "Spot large transactions",
    detail: "Get quick visibility into big spends and unusual activity.",
    icon: BarChart3,
    tone: "accent" as const,
  },
  {
    title: "Keep a readable spending trail",
    detail: "Search, filter, and export a clean transaction record.",
    icon: ReceiptText,
    tone: "info" as const,
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <HeroSection />
      <WorkflowSection />
      <FeaturesSection />
      <PrivacySection />
      <FinalCta />
    </main>
  );
}

function HeroSection() {
  return (
    <section className="relative isolate min-h-screen overflow-hidden px-5 pb-8 pt-5 sm:px-8">
      <HeroBackground />
      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-52px)] w-full max-w-7xl flex-col">
        <MarketingTopNav />

        <div className="grid flex-1 items-center gap-9 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10 lg:py-7 xl:gap-12">
          <div className="landing-reveal max-w-[40rem]">
            <p className="inline-flex min-h-8 items-center rounded-full border border-primary/25 bg-primary/8 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              AI-powered expense tracker
            </p>
            <h1 className="mt-5 max-w-[12ch] text-5xl font-semibold leading-[0.98] tracking-normal text-foreground sm:text-6xl lg:text-[4.35rem] xl:text-[5rem]">
              Turn every payment alert into spending clarity.
            </h1>
            <p className="mt-5 max-w-[37rem] text-base leading-7 text-secondary-foreground/95 sm:text-lg">
              TrackCrow reads SMS, UPI, card, and bank alerts, then builds a
              clean review queue with AI insights, suggested categories, and
              rules you approve.
            </p>

            <HeroActions className="mt-7" />
            <p className="mt-4 max-w-[34rem] text-sm font-medium leading-6 text-muted-foreground">
              Review first. Automate what repeats. Keep every transaction
              readable.
            </p>
            <TrustNotes />
          </div>

          <AIExpenseTrackerBoard className="landing-reveal [animation-delay:140ms]" />
        </div>
      </div>
    </section>
  );
}

function MarketingTopNav() {
  const navItems = [
    { href: "#features", label: "Features" },
    { href: "#workflow", label: "Workflow" },
    { href: "#privacy", label: "Privacy" },
  ];

  return (
    <header className="flex min-h-13 items-center justify-between gap-4">
      <Link
        href="/"
        className="inline-flex w-fit items-center rounded-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="TrackCrow home"
      >
        <BrandMark
          size="compact"
          markClassName="h-9 w-9 rounded-[11px] border-primary/25"
          textClassName="text-[11px] font-semibold tracking-[0.24em]"
        />
      </Link>

      <nav
        aria-label="Primary"
        className="flex items-center gap-1.5 sm:gap-2 lg:gap-3"
      >
        <div className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex min-h-10 items-center rounded-[8px] px-3 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-secondary/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <GoogleSignInButton
          size="sm"
          className="rounded-[8px] px-3 py-2 text-xs font-semibold text-secondary-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Sign in
        </GoogleSignInButton>
        <Button
          asChild
          size="sm"
          className="hidden min-h-9 rounded-[8px] bg-primary px-3 text-xs font-semibold hover:bg-primary/95 sm:inline-flex"
        >
          <Link href="/dashboard">Start tracking free</Link>
        </Button>
      </nav>
    </header>
  );
}

function HeroActions({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:flex-wrap", className)}>
      <Button
        asChild
        className="min-h-12 rounded-[8px] bg-primary px-6 text-sm shadow-[0_0_30px_rgba(104,211,145,0.22)] hover:bg-primary/95 sm:min-w-[194px]"
      >
        <Link href="/dashboard">
          Start tracking free
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
      <Link
        href="#workflow"
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[8px] border border-primary/24 bg-background/30 px-5 text-sm font-semibold text-secondary-foreground transition-colors hover:border-primary/45 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-w-[156px]"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full border border-primary/35 bg-primary/10 text-primary">
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
        See how it works
      </Link>
    </div>
  );
}

function TrustNotes() {
  return (
    <div className="mt-8 grid gap-3 text-xs font-medium text-secondary-foreground/90 sm:grid-cols-3 lg:max-w-[34rem]">
      {trustNotes.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] border border-primary/18 bg-primary/8 text-primary">
            <item.icon className="h-3.5 w-3.5" />
          </span>
          <span className="leading-5">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function AIExpenseTrackerBoard({ className }: { className?: string }) {
  return (
    <section
      aria-label="AI expense tracker preview"
      className={cn(
        "relative mx-auto w-full max-w-[690px] lg:justify-self-end",
        className
      )}
    >
      <div className="absolute -inset-5 rounded-[30px] bg-primary/10 blur-3xl" />
      <div className="absolute -right-3 -top-7 hidden text-5xl leading-none text-primary/85 drop-shadow-[0_0_18px_rgba(104,211,145,0.28)] sm:block">
        ••
      </div>
      <div className="relative rotate-[0.7deg] rounded-[24px] border-[3px] border-[#06110c] bg-[linear-gradient(180deg,rgba(19,32,25,0.98),rgba(6,15,11,0.98))] p-4 shadow-[12px_14px_0_rgba(0,0,0,0.56),0_0_0_1px_rgba(104,211,145,0.18),0_28px_76px_rgba(0,0,0,0.42)] sm:p-5">
        <div className="pointer-events-none absolute inset-0 rounded-[21px] opacity-[0.18] [background-image:radial-gradient(rgba(237,245,239,0.5)_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#06110c] bg-primary px-5 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-primary-foreground shadow-[0_8px_0_rgba(0,0,0,0.35)]">
          AI Expense Tracker
        </div>

        <div className="relative grid gap-3 pt-5">
          {boardModules.map((item) => (
            <BoardModule key={item.label} item={item} />
          ))}
        </div>

        <div className="relative mt-4 grid gap-3 border-t border-primary/18 pt-4 sm:grid-cols-3">
          <BoardStat label="Reviewed" value="84%" tone="primary" />
          <BoardStat label="Rules ready" value="7" tone="info" />
          <BoardStat label="Unclear spend" value="12" tone="accent" />
        </div>
      </div>
    </section>
  );
}

function BoardModule({
  item,
}: {
  item: {
    label: string;
    title: string;
    detail: string;
    meta: string;
    icon: ComponentType<{ className?: string }>;
    tone: Tone;
    rotate: string;
  };
}) {
  const Icon = item.icon;

  return (
    <article
      className={cn(
        "relative rounded-[15px] border-[3px] border-[#06110c] p-4 shadow-[6px_7px_0_rgba(0,0,0,0.38)] transition-transform hover:-translate-y-0.5 sm:p-5",
        item.rotate,
        item.tone === "primary" &&
          "bg-[linear-gradient(135deg,rgba(104,211,145,0.95),rgba(41,115,74,0.96))] text-primary-foreground",
        item.tone === "accent" &&
          "bg-[linear-gradient(135deg,rgba(242,184,75,0.98),rgba(123,83,25,0.98))] text-accent-foreground",
        item.tone === "info" &&
          "bg-[linear-gradient(135deg,rgba(121,168,216,0.98),rgba(37,82,118,0.98))] text-[#04111d]"
      )}
    >
      <span className="absolute left-1/2 top-0 h-5 w-20 -translate-x-1/2 -translate-y-1/2 rotate-[-2deg] border border-white/30 bg-white/45 shadow-[0_2px_8px_rgba(0,0,0,0.14)]" />
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] border-[2px] border-current/35 bg-white/18">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-[7px] border-[2px] border-current/45 bg-white/20 px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em]">
              {item.label}
            </span>
            <span className="text-[11px] font-bold opacity-75">{item.meta}</span>
          </div>
          <h2 className="mt-3 text-lg font-black leading-tight tracking-normal sm:text-xl">
            {item.title}
          </h2>
          <p className="mt-2 max-w-[34rem] text-sm font-semibold leading-6 opacity-78">
            {item.detail}
          </p>
        </div>
      </div>
    </article>
  );
}

function BoardStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: Tone;
}) {
  return (
    <div className="rounded-[12px] border border-border/60 bg-background/48 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <span
        className={cn(
          "mb-2 block h-1.5 w-10 rounded-full",
          tone === "primary" && "bg-primary",
          tone === "accent" && "bg-accent",
          tone === "info" && "bg-info"
        )}
      />
      <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold leading-none text-foreground">
        {value}
      </p>
    </div>
  );
}

function WorkflowSection() {
  return (
    <section
      id="workflow"
      className="border-y border-border/32 bg-muted/24 px-5 py-12 sm:px-8 lg:py-14"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Workflow"
          title="How TrackCrow works"
          description="From raw payment alerts to a clean, organized dashboard in four simple steps."
          align="center"
        />

        <div className="relative mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="absolute left-[10%] right-[10%] top-6 hidden h-px bg-primary/28 xl:block" />
          {workflowSteps.map((step, index) => (
            <article
              key={step.title}
              className="relative rounded-[12px] border border-border/60 bg-[linear-gradient(180deg,rgba(23,32,27,0.78),rgba(13,20,16,0.92))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
            >
              <span
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-[9px] border text-xs font-semibold tabular-nums",
                  toneClasses(step.tone, "soft")
                )}
              >
                {index + 1}
              </span>
              <step.icon className={cn("mt-5 h-5 w-5", toneClasses(step.tone))} />
              <h3 className="mt-3 text-base font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-secondary-foreground/90">
                {step.detail}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="px-5 py-12 sm:px-8 lg:py-14">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Features"
          title="Everything you need to stay on top of spending"
          description="Compact tools for importing, reviewing, correcting, and searching your transaction history."
        />

        <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="group rounded-[12px] border border-border/58 bg-card/38 p-4 transition-colors hover:border-primary/26 hover:bg-card/56"
            >
              <feature.icon
                className={cn("h-5 w-5", toneClasses(feature.tone))}
              />
              <h3 className="mt-3 text-base font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-secondary-foreground/90">
                {feature.detail}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function PrivacySection() {
  return (
    <section
      id="privacy"
      className="border-y border-border/32 bg-muted/22 px-5 py-10 sm:px-8"
    >
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.76fr_1fr] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Privacy
          </p>
          <h2 className="mt-3 max-w-[20ch] text-3xl font-semibold leading-tight text-foreground sm:text-[2.5rem]">
            Your spending stays reviewable, not mysterious.
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <PrivacyPoint
            icon={LockKeyhole}
            title="Private by default"
            detail="Financial data is treated like a workspace, not a feed."
          />
          <PrivacyPoint
            icon={ClipboardCheck}
            title="Approval-led AI"
            detail="Suggestions stay provisional until you approve them."
          />
          <PrivacyPoint
            icon={Gauge}
            title="Readable history"
            detail="Every transaction remains easy to search and correct."
          />
        </div>
      </div>
    </section>
  );
}

function PrivacyPoint({
  icon: Icon,
  title,
  detail,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  detail: string;
}) {
  return (
    <article className="rounded-[12px] border border-border/55 bg-card/34 p-4">
      <Icon className="h-5 w-5 text-primary" />
      <h3 className="mt-3 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-secondary-foreground/88">
        {detail}
      </p>
    </article>
  );
}

function FinalCta() {
  return (
    <section className="px-5 pb-6 pt-12 sm:px-8 lg:pt-14">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[18px] border border-primary/18 bg-[radial-gradient(circle_at_8%_50%,rgba(104,211,145,0.2),transparent_24%),linear-gradient(135deg,rgba(23,32,27,0.95),rgba(8,14,11,0.98))] p-6 shadow-[0_18px_54px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-7 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex items-start gap-4">
            <span className="hidden h-20 w-20 shrink-0 place-items-center rounded-full border border-primary/22 bg-primary/10 text-primary shadow-[0_0_34px_rgba(104,211,145,0.18)] sm:grid">
              <Radar className="h-9 w-9" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Review-ready ledger
              </p>
              <h2 className="mt-3 max-w-[22ch] text-3xl font-semibold leading-tight text-foreground sm:text-[2.8rem]">
                Turn scattered alerts into a spending system.
              </h2>
              <p className="mt-3 max-w-xl text-base leading-7 text-secondary-foreground/95">
                Start with the payments you already receive. TrackCrow keeps
                suggestions visible, rules intentional, and your history easy
                to understand.
              </p>
            </div>
          </div>
          <div className="grid gap-2 sm:min-w-[220px]">
            <Button
              asChild
              className="min-h-12 rounded-[8px] bg-primary px-6 text-sm hover:bg-primary/95"
            >
              <Link href="/dashboard">
                Start tracking free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <p className="text-center text-xs font-medium text-muted-foreground">
              Free to start - cancel anytime
            </p>
          </div>
        </div>
      </div>
      <footer className="mx-auto flex max-w-7xl flex-col gap-2 py-6 text-sm text-secondary-foreground sm:flex-row sm:items-center sm:justify-between">
        <BrandMark
          size="compact"
          markClassName="h-8 w-8 rounded-[10px]"
          textClassName="text-[10px] tracking-[0.2em]"
        />
        <p>AI expense tracking for the payment alerts you already have.</p>
      </footer>
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("mx-auto max-w-3xl", align === "center" && "text-center")}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-semibold leading-tight text-foreground sm:text-[2.45rem]">
        {title}
      </h2>
      <p className="mt-3 text-base leading-7 text-secondary-foreground/92">
        {description}
      </p>
    </div>
  );
}

function HeroBackground() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_18%,rgba(104,211,145,0.2),transparent_30%),radial-gradient(circle_at_10%_78%,rgba(121,168,216,0.1),transparent_28%),linear-gradient(115deg,#0f1411_0%,#0b130f_42%,#050907_100%)]" />
      <div className="absolute inset-0 opacity-[0.14] [background-image:linear-gradient(rgba(104,211,145,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(121,168,216,0.12)_1px,transparent_1px)] [background-size:58px_58px]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,20,17,0.96)_0%,rgba(15,20,17,0.52)_58%,rgba(15,20,17,0.88)_100%)]" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-[linear-gradient(180deg,transparent,var(--background)_90%)]" />
    </div>
  );
}

function toneClasses(tone: Tone, variant: "text" | "soft" = "text") {
  if (variant === "soft") {
    return cn(
      tone === "primary" && "border-primary/22 bg-primary/12 text-primary",
      tone === "accent" && "border-accent/24 bg-accent/10 text-accent",
      tone === "info" && "border-info/20 bg-info/10 text-info"
    );
  }

  return cn(
    tone === "primary" && "text-primary",
    tone === "accent" && "text-accent",
    tone === "info" && "text-info"
  );
}
