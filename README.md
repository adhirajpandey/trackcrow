# TrackCrow

**TrackCrow** is a modern, AI-powered expense tracking application built with Next.js 16. It redefines personal finance management by leveraging AI to automate transaction logging, categorize expenses, and provide actionable insights—all through a beautiful, responsive interface.

[Check Screenshots](#screenshots)

## 🚀 Features

- **🤖 AI-Powered Analysis**: Uses Google's Gemini AI to parse natural language and complex SMS transaction data.
- **📱 SMS Integration**: Automatically extracts and categorizes transactions from SMS notifications, making manual entry a thing of the past.
- **💬 Crow Bot**: An intelligent conversational assistant that helps you add transactions, checks your budget, and answers financial queries.
- **📊 Smart Dashboard**: Visual analytics powered by Recharts, offering deep insights into spending habits, category breakdowns, and monthly trends.
- **🏷️ Custom Categories**: Flexible category and subcategory management system tailored to your unique financial life.
- **🔐 Secure Authentication**: seamless login via Google OAuth using NextAuth.js.
- **🌑 Dark Mode First**: A sleek, modern UI built with Tailwind CSS and Radix UI primitives.

## 🛠️ Tech Stack

### Core
- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Library**: [React 19](https://react.dev/)

### UI & Styling
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Components**: [Radix UI](https://www.radix-ui.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Animations**: [Tailwindcss Animate](https://github.com/jamiebuilds/tailwindcss-animate)

### Backend & Data
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **AI SDK**: [Vercel AI SDK](https://sdk.vercel.ai/) & [Google Generative AI](https://ai.google.dev/)
- **Validation**: [Zod](https://zod.dev/)

### Tools & DevOps
- **Package Manager**: [pnpm](https://pnpm.io/)
- **Linting**: ESLint, Prettier

## 📦 Getting Started

Follow these steps to set up the project locally.

### Prerequisites
- Node.js (v18+ recommended)
- pnpm (`npm install -g pnpm`)
- PostgreSQL database

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/trackcrow.git
   cd trackcrow
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up Environment Variables**
   Create a `.env` file in the root directory and add the following:

   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/trackcrow"

   # Auth (Google)
   GOOGLE_CLIENT_ID="your_google_client_id"
   GOOGLE_CLIENT_SECRET="your_google_client_secret"
   NEXTAUTH_SECRET="your_nextauth_secret"
   NEXTAUTH_URL="http://localhost:3000"

   # AI (Google Gemini)
   GOOGLE_GENERATIVE_AI_API_KEY="your_gemini_api_key"
   ```

4. **Initialize the Database**
   ```bash
   pnpm dlx prisma generate
   pnpm dlx prisma migrate dev --name init
   ```

5. **Run the Development Server**
   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Screenshots


### Dashboard
<img width="1899" height="893" alt="Screenshot 2026-02-01 033542" src="https://github.com/user-attachments/assets/4f4b3665-79dd-4417-ba2a-d2e09a262364" />


## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

