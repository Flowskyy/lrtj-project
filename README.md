# LRT Jakarta - Portal Peluang Bisnis

Portal peluang bisnis LRT Jakarta untuk Naming Right, Iklan, Retail, Vending Machine/ATM, Event & Aktivasi Offline.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Auth:** next-auth@beta
- **Database:** Prisma + PostgreSQL (Supabase)
- **File Upload:** uploadthing
- **Styling:** Tailwind CSS v4
- **Font:** Plus Jakarta Sans

## Getting Started

### Prerequisites

1. Copy `.env.example` to `.env` and fill in the required environment variables:
   ```bash
   cp .env.example .env
   ```

2. Configure your environment variables in `.env`:
   - `DATABASE_URL`: Your Supabase PostgreSQL connection string
   - `DIRECT_URL`: Direct connection string for Prisma migrations
   - `NEXTAUTH_SECRET`: Generate a random secret key
   - `NEXTAUTH_URL`: Your application URL (http://localhost:3000 for development)
   - `UPLOADTHING_TOKEN`: Your UploadThing API token

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

3. Run database migrations (if needed):
   ```bash
   npx prisma migrate dev
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
├── app/
│   ├── api/auth/[[...nextauth]]/    # NextAuth API routes
│   ├── api/uploadthing/              # UploadThing API routes
│   ├── dashboard/                   # Protected dashboard page
│   ├── login/                        # Login page
│   ├── globals.css                   # Global styles with Tailwind
│   ├── layout.tsx                    # Root layout with font configuration
│   └── page.tsx                      # Landing page
├── components/
│   ├── Carousel.tsx                  # Hero banner carousel
│   └── Navbar.tsx                    # Navigation bar
├── lib/
│   ├── auth.ts                       # NextAuth configuration
│   ├── prisma.ts                     # Prisma client instance
│   └── uploadthing.ts               # UploadThing router configuration
├── prisma/
│   ├── schema.prisma                 # Prisma schema
│   └── prisma.config.ts              # Prisma configuration
└── public/                           # Static assets
```

## Pages

- **`/`** - Landing page with navbar, search bar, and carousel hero banner
- **`/login`** - Login page with LRT station background
- **`/dashboard`** - Protected dashboard showing welcome message (requires authentication)

## Features

- ✅ Authentication with next-auth (Credentials provider)
- ✅ Protected routes
- ✅ Responsive design with Tailwind CSS
- ✅ Custom color palette (LRT Jakarta brand colors)
- ✅ Plus Jakarta Sans font
- ✅ Carousel hero banner with LRT images
- ✅ UploadThing configuration for future file uploads
- ✅ Prisma ORM with PostgreSQL

## Database Schema

Current Prisma model:
```prisma
model User {
  id        String   @id @default(cuid())
  name      String?
  email     String   @unique
  image     String?
  createdAt DateTime @default(now())
}
```

## Color Palette

- **Gold/Mustard:** `#BD8226` - Logo accent, highlights
- **Red:** `#E5262C` - Primary color (navbar, CTA buttons)
- **Dark Charcoal:** `#333333` - Text, dark elements
- **Light Grey:** `#E5E9E8` - Background sections, neutral elements

## Build for Production

```bash
npm run build
npm start
```

## Deploy on Vercel

The easiest way to deploy is using [Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Make sure to set all environment variables in your Vercel project settings.
