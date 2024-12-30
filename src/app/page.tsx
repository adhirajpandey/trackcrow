import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Removed Header Section */}

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-black text-white py-20">
          <div className="container mx-auto text-center px-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
              Track Your Expenses with Precision
            </h1>
            <p className="text-xl mb-8">
              TrackCrow helps you manage your finances effortlessly.
            </p>
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-gray-200"
              >
                Get Started for Free
              </Button>
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-gray-100">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              Key Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard
                icon="📊"
                title="Expense Tracking"
                description="Easily log and categorize your expenses to get a clear picture of your spending habits."
              />
              <FeatureCard
                icon="📅"
                title="Budgeting"
                description="Set budgets for different categories and receive alerts when you're close to exceeding them."
              />
              <FeatureCard
                icon="📈"
                title="Insights"
                description="Get detailed reports and visualizations to understand your financial trends over time."
              />
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              How It Works
            </h2>
            <div className="flex flex-col md:flex-row justify-center items-center space-y-8 md:space-y-0 md:space-x-8">
              <StepCard
                number={1}
                title="Sign Up"
                description="Create your free account in seconds."
              />
              <StepCard
                number={2}
                title="Add Transactions"
                description="Log your expenses and income easily."
              />
              <StepCard
                number={3}
                title="Gain Insights"
                description="View reports and optimize your spending."
              />
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20 bg-gray-100">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              What Our Users Say
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <TestimonialCard
                quote="TrackCrow has completely changed how I manage my finances. Maza aagya use karke."
                author="Ankit K."
              />
              <TestimonialCard
                quote="The insights I get from TrackCrow have helped me save hundreds of dollars each month."
                author="Mike T."
              />
              <TestimonialCard
                quote="I love how I can set budgets and get notifications. It keeps me accountable."
                author="Emily R."
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-black text-white py-20">
          <div className="container mx-auto text-center px-4">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Ready to Take Control of Your Finances?
            </h2>
            <p className="text-xl mb-8">
              Join thousands of users who have improved their financial health
              with TrackCrow.
            </p>
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-gray-200"
              >
                Sign Up Now
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-black text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <span className="text-lg font-semibold">TrackCrow</span>
            </div>
            <nav>
              <ul className="flex space-x-4">
                <li>
                  <Link href="#" className="hover:text-gray-300">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-gray-300">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-gray-300">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
          <div className="mt-4 text-center text-sm">
            © {new Date().getFullYear()} TrackCrow. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-gray-100 p-6 rounded-lg text-center">
      <div className="inline-block bg-black text-white rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold mb-4">
        {number}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function TestimonialCard({ quote, author }: { quote: string; author: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <p className="text-gray-600 mb-4">&quot;{quote}&quot;</p>
      <p className="font-semibold">- {author}</p>
    </div>
  );
}
