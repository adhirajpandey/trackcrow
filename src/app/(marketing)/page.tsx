import type { ComponentType } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Banknote,
  BarChart3,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  LockKeyhole,
  MessageSquareText,
  PieChart,
  ReceiptText,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { BrandMark } from "@/components/product/brand-mark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type WorkflowStep = {
  number: string;
  label: string;
  title: string;
  detail: string;
  icon: ComponentType<{ className?: string }>;
  surface: string;
  note: string;
};

const workflowSteps: WorkflowStep[] = [
  {
    number: "01",
    label: "Track",
    title: "A payment ping lands.",
    detail: "SMS, UPI, card and bank alerts come together in one clean view.",
    icon: MessageSquareText,
    surface: "bg-[var(--paper-mint)]",
    note: "No copy-paste circus.",
  },
  {
    number: "02",
    label: "Review",
    title: "The unsure bits line up.",
    detail: "₹2,140 to BESCOM looks like Utilities. TrackCrow asks; you make the call.",
    icon: ClipboardCheck,
    surface: "bg-[var(--paper-yellow)]",
    note: "Your money. Your call.",
  },
  {
    number: "03",
    label: "Control",
    title: "Repeats sort themselves.",
    detail: "Approve a rule once. The next ₹299 Jio recharge knows where to go.",
    icon: SlidersHorizontal,
    surface: "bg-[var(--paper-lilac)]",
    note: "Only after you say yes.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <HeroSection />
      <WorkflowSection />
      <InsightsSection />
      <ControlSection />
    </main>
  );
}

function HeroSection() {
  return (
    <section className="relative isolate px-4 pb-16 pt-4 sm:px-6 sm:pt-5 lg:min-h-screen lg:px-8 lg:pb-20">
      <HeroDecorations />
      <div className="relative z-10 mx-auto max-w-[1440px]">
        <MarketingTopNav />

        <div className="grid items-center gap-12 pb-3 pt-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12 lg:pt-14 xl:gap-16">
          <div className="landing-reveal max-w-[620px]">
            <p className="font-hand -rotate-2 text-xl leading-none text-destructive sm:text-2xl">
              Your payments are already talking.
            </p>
            <h1 className="mt-5 max-w-[12ch] text-[clamp(3.15rem,5vw,5.75rem)] font-extrabold leading-[0.9] tracking-[-0.06em]">
              Payments come in. TrackCrow sorts them out.
            </h1>
            <p className="mt-7 max-w-[39rem] text-base font-medium leading-7 text-secondary-foreground sm:text-lg sm:leading-8">
              TrackCrow automatically detects payments from SMS, UPI, card and
              bank alerts. AI suggests the category, you approve the rule, and
              repeat spends get sorted—without tagging them one by one.
            </p>

            <HeroActions />

            <div className="mt-7 grid gap-3 border-t-2 border-dashed border-border/50 pt-5 text-sm font-bold sm:grid-cols-2">
              <TrustPoint icon={LockKeyhole}>Private by default</TrustPoint>
              <TrustPoint icon={CheckCircle2}>Nothing changes without you</TrustPoint>
            </div>
          </div>

          <PaymentTransformation />
        </div>
      </div>
    </section>
  );
}

function MarketingTopNav() {
  return (
    <header className="relative flex min-h-[72px] items-center justify-between gap-3 rounded-[10px] border-2 border-border bg-card px-3 py-2.5 shadow-[3px_4px_0_var(--foreground)] sm:px-4 lg:px-5">
      <Link
        href="/"
        aria-label="TrackCrow home"
        className="flex min-w-0 items-center gap-3 rounded-[8px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <BrandMark
          size="compact"
          showText={false}
          markClassName="h-11 w-11 rounded-[12px] border shadow-none"
        />
        <span className="min-w-0">
          <span className="block truncate text-base font-black uppercase leading-none tracking-[0.08em]">
            TrackCrow
          </span>
          <span className="mt-1.5 hidden truncate text-[0.78rem] font-semibold leading-tight text-secondary-foreground sm:block">
            Spending, made clear.
          </span>
        </span>
      </Link>

      <p className="absolute left-1/2 hidden -translate-x-1/2 whitespace-nowrap text-xs font-extrabold uppercase tracking-[0.14em] text-[#238658] md:block">
        Track <span aria-hidden="true">·</span> Review <span aria-hidden="true">·</span> Control
      </p>

      <nav aria-label="Primary" className="shrink-0">
        <Button asChild className="min-h-13 rounded-[7px] px-4 text-sm sm:px-6">
          <Link href="/dashboard">
            <span className="hidden sm:inline">Start tracking free</span>
            <span className="sm:hidden">Start free</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </nav>
    </header>
  );
}

function HeroActions() {
  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <Button asChild className="min-h-13 rounded-[7px] px-6 text-sm sm:min-w-[200px]">
        <Link href="/dashboard">
          Start tracking free
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
      <Button
        asChild
        variant="secondary"
        className="min-h-13 rounded-[7px] bg-card px-6 text-sm sm:min-w-[174px]"
      >
        <Link href="#workflow">
          See it in action
          <ArrowDown className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

function TrustPoint({
  icon: Icon,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  children: string;
}) {
  return (
    <span className="flex items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-[7px] border-2 border-border bg-[var(--paper-mint)]">
        <Icon className="h-4 w-4" />
      </span>
      {children}
    </span>
  );
}

function PaymentTransformation() {
  return (
    <section
      aria-label="An example payment moving from alert to sorted spending"
      className="landing-reveal relative mx-auto w-full max-w-[720px] [animation-delay:120ms]"
    >
      <p className="font-hand absolute -right-1 -top-8 rotate-2 text-lg text-destructive sm:right-8 sm:text-xl">
        one ping. zero guesswork.
      </p>
      <div className="relative rounded-[12px] border-2 border-border bg-[#fffaf0] p-3 shadow-[8px_9px_0_var(--foreground)] sm:p-5">
        <div aria-hidden="true" className="absolute -top-3 left-[17%] h-6 w-20 -rotate-3 border border-border/30 bg-[#f1e1ad]/80" />
        <div aria-hidden="true" className="absolute -top-3 right-[14%] h-6 w-20 rotate-2 border border-border/30 bg-[#f1e1ad]/80" />

        <div className="flex items-center justify-between gap-4 border-b-2 border-dashed border-border/50 pb-3">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-secondary-foreground">Live example</p>
            <p className="mt-1 text-sm font-extrabold">A fuel payment finds its place</p>
          </div>
          <span className="rounded-[999px] border-2 border-border bg-primary px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em]">
            TrackCrow at work
          </span>
        </div>

        <div className="relative mt-4 grid gap-3 sm:grid-cols-2">
          <article className="payment-stage payment-stage-1 relative -rotate-1 rounded-[9px] border-2 border-border bg-card p-4 shadow-[3px_4px_0_var(--foreground)] sm:col-span-2 sm:mx-8">
            <span className="absolute -left-2 -top-2 grid h-7 w-7 place-items-center rounded-full border-2 border-border bg-destructive text-xs font-extrabold text-white">1</span>
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[8px] border-2 border-border bg-[var(--paper-mint)]">
                <MessageSquareText className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-secondary-foreground">Bank alert · now</p>
                <p className="mt-1 text-lg font-extrabold leading-tight">₹2,850 paid to IndianOil via UPI.</p>
              </div>
            </div>
          </article>

          <article className="payment-stage payment-stage-2 rounded-[9px] border-2 border-border bg-[#dcecfb] p-4 shadow-[3px_4px_0_var(--foreground)]">
            <StageLabel number="2" label="Found" />
            <p className="mt-5 text-xl font-extrabold tabular-nums">₹2,850 <span className="text-sm text-secondary-foreground">· IndianOil</span></p>
            <p className="mt-2 text-sm font-bold text-secondary-foreground">Today, 8:42 PM</p>
          </article>

          <article className="payment-stage payment-stage-3 rotate-[0.8deg] rounded-[9px] border-2 border-border bg-[var(--paper-yellow)] p-4 shadow-[3px_4px_0_var(--foreground)]">
            <StageLabel number="3" label="Review" />
            <p className="mt-5 text-xl font-extrabold">Transport · Fuel?</p>
            <div className="mt-3 flex gap-2">
              <span className="inline-flex min-h-9 items-center gap-1 rounded-[6px] border-2 border-border bg-card px-3 text-xs font-extrabold"><Check className="h-3.5 w-3.5" /> Looks right</span>
              <span className="inline-flex min-h-9 items-center rounded-[6px] border-2 border-border px-3 text-xs font-extrabold">Change</span>
            </div>
          </article>

          <article className="payment-stage payment-stage-4 -rotate-[0.5deg] rounded-[9px] border-2 border-border bg-[var(--paper-mint)] p-4 shadow-[3px_4px_0_var(--foreground)]">
            <StageLabel number="4" label="Control" />
            <p className="mt-5 text-lg font-extrabold leading-tight">Use Fuel for this merchant next time?</p>
            <p className="mt-2 text-sm font-bold text-[#238658]">Rule waits for your yes.</p>
          </article>

          <article className="payment-stage payment-stage-5 rounded-[9px] border-2 border-border bg-[var(--paper-blush)] p-4 shadow-[3px_4px_0_var(--foreground)]">
            <StageLabel number="5" label="Sorted" />
            <div className="mt-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-secondary-foreground">Transport this month</p>
                <p className="mt-1 text-2xl font-extrabold tabular-nums">₹6,420</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-[#238658]" />
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function StageLabel({ number, label }: { number: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.14em]">
      <span className="grid h-6 w-6 place-items-center rounded-full border-2 border-border bg-card">{number}</span>
      {label}
    </div>
  );
}

function WorkflowSection() {
  return (
    <section id="workflow" className="border-y-2 border-border bg-card px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          note="The whole routine, minus the faff."
          label="How it works"
          title="From payment ping to sorted spend."
          description="TrackCrow does the reading. You keep the final say. The boring repeats get easier from there."
        />

        <div className="relative mt-10 grid gap-6 lg:grid-cols-3">
          <div aria-hidden="true" className="absolute left-[15%] right-[15%] top-12 hidden border-t-2 border-dashed border-border/50 lg:block" />
          {workflowSteps.map((step) => (
            <WorkflowCard key={step.label} step={step} />
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkflowCard({ step }: { step: WorkflowStep }) {
  const Icon = step.icon;
  return (
    <article className={cn("paper-lift relative flex min-h-[320px] flex-col rounded-[10px] border-2 border-border p-6 shadow-[5px_6px_0_var(--foreground)]", step.surface)}>
      <div className="flex items-center justify-between gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-[8px] border-2 border-border bg-card">
          <Icon className="h-6 w-6" />
        </span>
        <span className="text-5xl font-extrabold leading-none tracking-[-0.08em] text-foreground/15">{step.number}</span>
      </div>
      <p className="mt-7 text-xs font-extrabold uppercase tracking-[0.16em]">{step.label}</p>
      <h3 className="mt-3 text-3xl font-extrabold leading-[1.02] tracking-[-0.04em]">{step.title}</h3>
      <p className="mt-4 max-w-sm text-base font-medium leading-7 text-secondary-foreground">{step.detail}</p>
      <p className="font-hand mt-auto pt-7 text-lg text-destructive">{step.note}</p>
    </article>
  );
}

function InsightsSection() {
  const spendingBars = [42, 68, 51, 86, 57, 73, 62];

  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          note="Numbers that actually answer something."
          label="Insights & analytics"
          title="Spot the change before it becomes a pattern."
          description="See where your money went, compare this month with the last, and catch category or recipient changes worth a closer look."
        />

        <article className="mt-10 overflow-hidden rounded-[10px] border-2 border-border bg-card shadow-[6px_7px_0_var(--foreground)]">
          <div className="flex flex-col gap-4 border-b-2 border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-[8px] border-2 border-border bg-[var(--paper-mint)]">
                <BarChart3 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-secondary-foreground">
                  Spending overview
                </p>
                <p className="mt-1 text-sm font-extrabold">This month · Jul 1–15</p>
              </div>
            </div>
            <div className="flex w-fit rounded-[7px] border-2 border-border bg-background p-1 text-xs font-extrabold">
              <span className="rounded-[5px] bg-primary px-3 py-1.5">30D</span>
              <span className="px-3 py-1.5 text-secondary-foreground">90D</span>
              <span className="px-3 py-1.5 text-secondary-foreground">1Y</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1.25fr_0.75fr]">
            <div className="border-b-2 border-border p-5 sm:p-6 lg:border-b-0 lg:border-r-2">
              <div className="grid gap-3 sm:grid-cols-2">
                <InsightMetric
                  label="Total spent"
                  value="₹48,620"
                  note="12% lower than last month"
                  surface="bg-[var(--paper-mint)]"
                />
                <InsightMetric
                  label="Daily average"
                  value="₹3,241"
                  note="Across 42 detected payments"
                  surface="bg-[#dcecfb]"
                />
              </div>

              <div className="mt-5 rounded-[9px] border-2 border-border bg-[#fffaf0] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold">Spending trend</p>
                    <p className="mt-1 text-xs font-semibold text-secondary-foreground">The last seven days</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#238658]">
                    <TrendingUp className="h-4 w-4" /> Updated today
                  </span>
                </div>
                <div
                  aria-label="Illustrative seven-day spending bar chart"
                  className="mt-6 flex h-36 items-end gap-2 border-b-2 border-l-2 border-border/55 px-3 pt-3 sm:gap-4 sm:px-5"
                >
                  {spendingBars.map((height, index) => (
                    <div key={height + index} className="flex h-full flex-1 items-end">
                      <span
                        className={cn(
                          "block w-full rounded-t-[5px] border-2 border-b-0 border-border",
                          index === 3 ? "bg-[var(--paper-yellow)]" : "bg-primary"
                        )}
                        style={{ height: `${height}%` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex justify-between px-3 text-[10px] font-bold text-secondary-foreground sm:px-5">
                  <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-5 sm:p-6">
              <article className="rounded-[9px] border-2 border-border bg-[var(--paper-yellow)] p-5 shadow-[3px_4px_0_var(--foreground)]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.16em]">AI insight</p>
                  <Sparkles className="h-5 w-5" />
                </div>
                <p className="mt-5 text-2xl font-extrabold leading-tight tracking-[-0.035em]">
                  Transport spend is up ₹2,300.
                </p>
                <p className="mt-3 text-sm font-semibold leading-6 text-secondary-foreground">
                  Fuel payments were higher than your usual fortnightly range.
                </p>
              </article>

              <article className="rounded-[9px] border-2 border-border bg-[var(--paper-lilac)] p-5">
                <div className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  <p className="text-sm font-extrabold">Top categories</p>
                </div>
                <div className="mt-5 space-y-4">
                  <CategoryShare label="Household" value="31%" width="31%" color="bg-primary" />
                  <CategoryShare label="Transport" value="24%" width="24%" color="bg-info" />
                  <CategoryShare label="Food & dining" value="18%" width="18%" color="bg-accent" />
                </div>
              </article>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

function InsightMetric({
  label,
  value,
  note,
  surface,
}: {
  label: string;
  value: string;
  note: string;
  surface: string;
}) {
  return (
    <div className={cn("rounded-[9px] border-2 border-border p-4", surface)}>
      <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-secondary-foreground">{label}</p>
      <p className="mt-3 text-3xl font-extrabold tracking-[-0.04em] tabular-nums">{value}</p>
      <p className="mt-2 text-xs font-bold text-secondary-foreground">{note}</p>
    </div>
  );
}

function CategoryShare({
  label,
  value,
  width,
  color,
}: {
  label: string;
  value: string;
  width: string;
  color: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4 text-xs font-bold">
        <span>{label}</span>
        <span className="tabular-nums">{value}</span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full border border-border bg-card">
        <span className={cn("block h-full border-r border-border", color)} style={{ width }} />
      </div>
    </div>
  );
}

function ControlSection() {
  return (
    <section id="privacy" className="bg-[#e5f6ed] px-4 pb-0 pt-16 sm:px-6 sm:pb-7 lg:px-8 lg:pt-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="font-hand -rotate-2 text-xl text-destructive">No mysterious black box.</p>
            <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.16em] text-[#238658]">Built around your approval</p>
            <h2 className="mt-4 max-w-[13ch] text-5xl font-extrabold leading-[0.92] tracking-[-0.055em] sm:text-6xl">
              AI suggests. You stay in charge.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <ControlPoint icon={Eye} title="Nothing hidden">See what TrackCrow found and why it needs a look.</ControlPoint>
            <ControlPoint icon={CheckCircle2} title="Nothing assumed">Suggestions wait for your approval before they stick.</ControlPoint>
            <ControlPoint icon={LockKeyhole} title="Private by default">Your spending is a private workspace, not a social feed.</ControlPoint>
          </div>
        </div>

        <div className="relative mt-16 overflow-hidden rounded-[10px] border-2 border-border bg-[var(--paper-yellow)] px-5 py-10 shadow-[7px_8px_0_var(--foreground)] sm:px-8 sm:py-12 lg:px-12">
          <div aria-hidden="true" className="absolute bottom-0 left-0 top-0 w-3 [background:radial-gradient(circle_at_0_12px,var(--background)_7px,transparent_8px)] [background-size:12px_24px]" />
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em]">Ready when you are</p>
              <h2 className="mt-4 max-w-[16ch] text-4xl font-extrabold leading-[0.94] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
                Your spending is already happening. Make it make sense.
              </h2>
            </div>
            <div className="lg:min-w-[230px]">
              <Button asChild className="min-h-13 w-full rounded-[7px] bg-primary px-6 text-sm">
                <Link href="/dashboard">
                  Start tracking free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <p className="mt-3 text-center text-xs font-bold">Start with the alerts you already get.</p>
            </div>
          </div>
        </div>

        <footer className="mt-10 border-t-2 border-border/70 py-4 text-center sm:relative sm:grid sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4 sm:py-6">
          <div className="flex items-center justify-between gap-3 sm:contents">
            <div className="sm:justify-self-start">
              <BrandMark size="compact" markClassName="h-9 w-9 rounded-[9px]" textClassName="text-[10px]" />
            </div>
            <p className="text-xs font-semibold text-secondary-foreground">
              © 2026 TrackCrow
            </p>
          </div>
          <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.12em] text-[#238658] sm:absolute sm:left-1/2 sm:top-1/2 sm:mt-0 sm:-translate-x-1/2 sm:-translate-y-1/2">
            Track <span aria-hidden="true">·</span> Review <span aria-hidden="true">·</span> Control
          </p>
        </footer>
      </div>
    </section>
  );
}

function ControlPoint({
  icon: Icon,
  title,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  children: string;
}) {
  return (
    <article className="rounded-[9px] border-2 border-border bg-card p-4 shadow-[3px_4px_0_var(--foreground)]">
      <Icon className="h-5 w-5" />
      <h3 className="mt-5 text-base font-extrabold">{title}</h3>
      <p className="mt-2 text-sm font-medium leading-6 text-secondary-foreground">{children}</p>
    </article>
  );
}

function SectionHeading({
  note,
  label,
  title,
  description,
}: {
  note: string;
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
      <div>
        <p className="font-hand -rotate-1 text-xl text-destructive">{note}</p>
        <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.16em] text-[#238658]">{label}</p>
        <h2 className="mt-4 max-w-[14ch] text-4xl font-extrabold leading-[0.94] tracking-[-0.05em] sm:text-5xl lg:text-6xl">{title}</h2>
      </div>
      <p className="max-w-[36rem] text-base font-medium leading-7 text-secondary-foreground lg:justify-self-end lg:text-lg lg:leading-8">{description}</p>
    </div>
  );
}

function HeroDecorations() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-16 top-48 h-36 w-36 rotate-12 rounded-[24px] border-2 border-border/10 bg-[var(--paper-blush)] opacity-70" />
      <div className="absolute -right-16 top-32 h-48 w-48 -rotate-12 rounded-full border-2 border-border/10 bg-[var(--paper-mint)] opacity-70" />
      <ReceiptText className="absolute bottom-12 left-[44%] hidden h-16 w-16 -rotate-12 text-border/10 lg:block" />
      <Banknote className="absolute right-[4%] top-[58%] hidden h-14 w-14 rotate-12 text-border/10 xl:block" />
      <Sparkles className="absolute left-[4%] top-[17%] h-8 w-8 -rotate-12 text-destructive/35" />
    </div>
  );
}
