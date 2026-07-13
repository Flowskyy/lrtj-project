# LRT Jakarta - Prototype Portal Transportasi Umum (Proyek PKL)

Proyek ini adalah **prototype portal web layanan transportasi umum LRT Jakarta** (situs informasi untuk penumpang dan pengguna layanan LRT Jakarta). Aplikasi ini dikembangkan khusus sebagai bahan demonstrasi dan laporan selama masa **Praktek Kerja Lapangan (PKL)**.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Auth:** next-auth@beta
- **Database:** Prisma + PostgreSQL (Supabase)
- **File Upload:** uploadthing
- **Styling:** Tailwind CSS v4
- **Font:** Plus Jakarta Sans

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

- **`/`** - Landing page with a sticky navbar, search bar, and a perfectly aligned carousel hero banner
- **`/login`** - Login page with LRT station background and a glassmorphic floating "Kembali" back button
- **`/dashboard`** - Protected dashboard showing welcome message (requires authentication)

## Features

- ✅ Authentication with next-auth (Credentials provider)
- ✅ Protected routes
- ✅ Responsive design with Tailwind CSS (v4)
- ✅ Custom color palette (LRT Jakarta brand colors)
- ✅ Plus Jakarta Sans font
- ✅ Carousel hero banner with LRT images
- ✅ Sticky Navbar with a perfectly aligned Carousel directly below it (no gap/overlap)
- ✅ Glassmorphic floating "Kembali" (Back) button on the login page
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
