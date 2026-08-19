# Design Tokens for Dashboard Layout

This document captures the glassmorphism design tokens established in the codebase for use in the future Dashboard layout task.

## Brand Colors

- **Primary Red (LRT Jakarta):** `#E5262C` (CSS variable: `--lrt-red`)
- **Gold:** `#BD8226` (CSS variable: `--lrt-gold`)
- **Charcoal:** `#333333` (CSS variable: `--lrt-charcoal`)
- **Grey:** `#E5E9E8` (CSS variable: `--lrt-grey`)

## Glassmorphism Design Tokens

### Background Effects
- **Glass background:** `rgba(255, 255, 255, 0.72)` - translucent white background
- **Backdrop blur:** `blur(16px)` - restrained blur effect for depth
- **Card background:** `oklch(1 0 0)` / `rgba(255, 255, 255, 0.90)` with `backdrop-blur-md`

### Border & Subtle Effects
- **Standard border:** `oklch(0.922 0 0)` (subtle gray)
- **Translucent borders:** `rgba(229, 38, 44, 0.1)` for active states
- **Card borders:** `border-gray-200/80` (80% opacity gray)
- **Hover backgrounds:** `bg-gray-50/50` (50% opacity light gray)

### Active State Styling
- **Active menu background:** `rgba(229, 38, 44, 0.1)` (10% red opacity)
- **Active menu text:** `#E5262C` (brand red)
- **Active icon background:** `#E5262C` with white text

### Spacing & Sizing
- **Border radius:** `0.625rem` (CSS variable: `--radius`)
- **Radius variations:**
  - `--radius-sm: calc(var(--radius) * 0.6)`
  - `--radius-md: calc(var(--radius) * 0.8)`
  - `--radius-lg: var(--radius)`
  - `--radius-xl: calc(var(--radius) * 1.4)`
  - `--radius-2xl: calc(var(--radius) * 1.8)`

### Table Styling (GlassTable Component)
- **Header:** `text-gray-600 font-semibold text-[11px] uppercase tracking-wider`
- **Row borders:** `border-gray-200/60` (60% opacity)
- **Row hover:** `hover:bg-gray-50/50` (50% opacity)
- **Cell padding:** `px-2 py-1.5`
- **Cell text size:** `text-[11px]`

### Card Styling
- **Background:** `bg-white/90 backdrop-blur-md`
- **Border:** `border border-gray-200/80`
- **Shadow:** `shadow-sm`
- **Rounded corners:** `rounded-lg`

## Usage Guidelines

1. **Never use solid red blocks** for backgrounds - red is only for accents (active states, primary buttons, badges)
2. **Always use translucent backgrounds** with backdrop blur for depth
3. **Maintain subtle borders** with reduced opacity (60-80%)
4. **Use the established radius tokens** for consistent rounded corners
5. **Apply hover states** with reduced opacity backgrounds (50% opacity)

## Component References

- **GlassTable:** `components/GlassTable.tsx` - table with glassmorphism styling
- **Card:** `components/ui/card.tsx` - standard card component
- **Global styles:** `app/globals.css` - all design tokens defined here
