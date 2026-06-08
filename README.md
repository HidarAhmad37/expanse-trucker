# SpendWise - Personal Expense Tracker

A beautiful, full-featured expense tracking web app built with **Vue 3**, **TypeScript**, **Tailwind CSS**, and **Supabase**. Never wonder where your salary went again.

![SpendWise](https://img.shields.io/badge/Vue-3-green) ![Supabase](https://img.shields.io/badge/Supabase-Backend-green)

## Features

- **Dashboard** — Balance overview, spending charts, budget progress, and smart money insights
- **Transactions** — Add, edit, delete income and expenses with categories
- **Budgets** — Set monthly spending limits per category with visual progress bars
- **Reports** — Yearly overview with monthly breakdown and top spending categories
- **Smart Insights** — Warnings when you're spending too fast ("money will run out in X days")
- **Multi-currency** — USD, EUR, GBP, INR, PKR, AED, and more
- **Authentication** — Secure sign up / login via Supabase Auth
- **Responsive** — Works on desktop and mobile

## Quick Start

### 1. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Go to **Settings → API** and copy your Project URL and anon key

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Run the app

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173), create an account, and start tracking!

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vue 3, TypeScript, Vite |
| Styling | Tailwind CSS v4 |
| State | Pinia |
| Routing | Vue Router |
| Charts | Chart.js + vue-chartjs |
| Icons | Lucide Vue |
| Backend | Supabase (Auth, PostgreSQL, RLS) |

## Project Structure

```
src/
├── components/
│   ├── dashboard/     # Charts, balance card, insights
│   ├── layout/        # Sidebar, app shell
│   ├── transactions/  # Forms and lists
│   └── ui/            # Modal, empty states
├── stores/            # Pinia stores (auth, transactions, budgets)
├── views/             # Page components
├── lib/               # Supabase client
├── types/             # TypeScript interfaces
└── utils/             # Formatting helpers
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## License

MIT
