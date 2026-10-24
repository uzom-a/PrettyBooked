# PrettyBooked

A booking app for beauty and style services at Grambling State University. Students find a braider, nail tech, lash tech or seamstress on campus and book a time with them.

Live site: https://pretty-booked.vercel.app

## What it does
- Students browse stylists by category and see their services, prices, photos and reviews.
- Students book an appointment, and the stylist confirms, cancels or marks it completed.
- Students and stylists message each other.
- Students leave a review after a completed appointment.
- Both sides get notifications when a booking changes.
- New stylists are approved automatically when they create their profile.

## Built with
React, Vite and Tailwind CSS on the front end. Supabase for sign-in, the database and photo storage. Hosted on Vercel.

## Run it on your computer
1. Copy `.env.example` to `.env` and fill in your Supabase project URL and anon key (Supabase dashboard, Project Settings, API).
2. Install and start:
   ```bash
   npm install
   npm run dev
   ```

## Database
Run the files in `supabase/migrations` in order (001 to 006) in the Supabase SQL Editor.

## Tests
The tests in `e2e` open the site in a real browser, on a desktop screen and a phone screen, and click through it like a visitor would. They need the same `.env` file as above.
```bash
npx playwright install chromium
npm run test:e2e
```
