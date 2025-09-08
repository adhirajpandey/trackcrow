import { Button } from "@/components/ui/button";
import { LandingActionButton } from "@/components/ui/landing-action-button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/10">
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-background via-background/95 to-muted/10 py-16 lg:py-20 overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-purple-500/5" />
          <div className="container mx-auto text-center px-4 relative z-10">
            <div className="max-w-4xl mx-auto">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
                🚀 Now with AI-powered expense tracking
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-8 bg-gradient-to-r from-foreground via-primary to-muted-foreground bg-clip-text text-transparent">
                Track Your Expenses with
                <span className="block bg-gradient-to-r from-primary to-gray-500 bg-clip-text text-transparent">
                  Precision
                </span>
              </h1>
              <p className="text-xl lg:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
                Your SMS receipts become smart insights. Crow Bot does the math.
                You stay in control.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                {/* Client-side button for Get Started/Open Dashboard */}
                <LandingActionButton />
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-border hover:bg-muted px-8 py-6 text-lg font-semibold rounded-xl transition-all duration-300 hover:border-primary/50"
                >
                  View Demo
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section
          id="how-it-works"
          className="py-20 bg-gradient-to-b from-muted/10 via-background/98 to-background relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
          <div className="container mx-auto px-4 relative">
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-primary text-sm font-medium mb-8">
                🚀 Simple Process
              </div>
              <h2 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Three Steps to Financial Freedom
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Transform your financial habits in minutes with our streamlined
                onboarding process
              </p>
            </div>
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                <StepCard
                  title="Connect & Sign Up"
                  description="Securely link your Google account and grant SMS permissions for seamless, automated expense tracking."
                  icon="🔗"
                  gradient="from-gray-200/10 to-indigo-500/10"
                />
                <StepCard
                  title="Automatic Tracking"
                  description="AI-powered detection and categorization of transactions from your SMS notifications in real-time."
                  icon="🤖"
                  gradient="from-emerald-500/10 to-green-500/10"
                />
                <StepCard
                  title="Insights & Control"
                  description="Access comprehensive analytics, set intelligent budgets, and receive personalized financial recommendations."
                  icon="💡"
                  gradient="from-purple-500/10 to-violet-500/10"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          id="features"
          className="py-20 bg-gradient-to-b from-background to-muted/20 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
          <div className="container mx-auto px-4 relative">
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-primary text-sm font-medium mb-8">
                ✨ Why TrackCrow is Different
              </div>
              <h2 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Track Smart, Save More
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Because manually tracking expenses is so 2010. Let AI do the
                heavy lifting while you focus on what matters.
              </p>
            </div>
            <div className="max-w-4xl mx-auto">
              <div className="space-y-8">
                <FeatureListItem
                  title="SMS Magic at Your Fingertips"
                  description="Your phone already knows about every transaction. We just make it smart. No more manual entry, no more forgotten purchases – just pure, automated expense tracking that actually works."
                  icon="📱"
                />
                <FeatureListItem
                  title="Meet Your Personal Finance Assistant"
                  description="Meet Crow Bot – your sassy AI sidekick. Add transactions, update budgets, and manage your money with simple commands. No more endless clicking. Just tell Crow what you need."
                  icon="🤖"
                />
                <FeatureListItem
                  title="Insights That Actually Matter"
                  description="Forget generic reports. Get personalized insights that tell you exactly where your money goes and how to make it work harder for you. No fluff, just facts."
                  icon="💡"
                />
                <FeatureListItem
                  title="Budget Like a Boss"
                  description="Set it and forget it. Our AI learns your spending habits and keeps you in check before you even think about overspending. Your future self will thank you."
                  icon="🎯"
                />
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative bg-gradient-to-br from-primary/5 via-background/95 to-muted/10 py-16">
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
          <div className="container mx-auto text-center px-4 relative">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl lg:text-5xl font-bold tracking-tight mb-6">
                Ready to Transform Your
                <span className="block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Financial Future?
                </span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join users who have taken control of their finances with
                TrackCrow. Start your journey to financial freedom today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <LandingActionButton />
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-border hover:bg-muted px-8 py-6 text-lg font-semibold rounded-xl transition-all duration-300 hover:border-primary/50"
                >
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gradient-to-t from-muted/20 via-muted/10 to-transparent border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <Image
                  src="/trackcrow.png"
                  alt="Trackcrow Logo"
                  width={32}
                  height={32}
                  className="h-8 w-auto"
                />
                <span className="text-xl font-bold">TrackCrow</span>
              </div>
              <p className="text-muted-foreground max-w-md">
                The smartest way to track your expenses and take control of your
                financial future.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Security
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Help Center
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Contact Us
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-foreground transition-colors"
                  >
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-muted-foreground">
            © 2025 TrackCrow. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureListItem({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="flex items-start space-x-6 p-6 rounded-2xl bg-card/30 backdrop-blur-sm border border-border/50 hover:bg-card/50 hover:border-primary/30 transition-all duration-300 group">
      <div className="flex-shrink-0">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 group-hover:scale-110 transition-all duration-300">
          <span className="text-2xl text-primary group-hover:scale-110 transition-transform duration-300">
            {icon}
          </span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-xl font-bold mb-3 text-card-foreground group-hover:text-primary transition-colors duration-300 leading-tight">
          {title}
        </h3>
        <p className="text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors duration-300">
          {description}
        </p>
      </div>
    </div>
  );
}

function StepCard({
  title,
  description,
  icon,
  gradient,
}: {
  title: string;
  description: string;
  icon: string;
  gradient: string;
}) {
  return (
    <Card
      className={`bg-card/50 backdrop-blur-sm border-border/50 text-center hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-3 group relative overflow-hidden`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
      />
      <CardContent className="p-8 relative z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6 group-hover:scale-110 transition-all duration-500">
          <span className="text-3xl text-primary group-hover:scale-110 transition-transform duration-300">
            {icon}
          </span>
        </div>
        <h3 className="text-2xl font-bold mb-4 text-card-foreground group-hover:text-primary transition-colors duration-300 leading-tight">
          {title}
        </h3>
        <p className="text-muted-foreground leading-relaxed text-lg group-hover:text-foreground/80 transition-colors duration-300">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
