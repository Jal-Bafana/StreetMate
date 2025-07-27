# StreetMate Market

> A modern marketplace MVP for street food vendors and sellers, built for hackathons and rapid deployment.

---

## 🔗 Live Demo

[Click here to try StreetMate Market](https://streetmate.vercel.app)

---

## Features

- Vendor and seller authentication (Supabase Auth)
- Vendor dashboard: manage inventory, view orders, track revenue
- Seller dashboard: browse products, place orders, track spending
- Real-time order management and status updates
- Shopping cart with local storage
- Responsive UI with sidebar navigation
- Modern design using shadcn-ui and Tailwind CSS

## Tech Stack

- **Frontend:** React, TypeScript, Vite
- **UI:** shadcn-ui, Tailwind CSS
- **Backend:** Supabase (Database, Auth)

## Project Structure

```
├── src/
│   ├── components/         # Reusable UI components
│   ├── contexts/           # React context (Auth, etc.)
│   ├── hooks/              # Custom React hooks
│   ├── integrations/       # Supabase client/types
│   ├── lib/                # Utility functions
│   ├── pages/              # App pages (Dashboard, Orders, etc.)
│   └── App.tsx             # Main app entry
├── public/                 # Static assets
├── supabase/               # Supabase config & migrations
├── tailwind.config.ts      # Tailwind CSS config
├── vite.config.ts          # Vite config
└── README.md
```

## Getting Started

1. **Clone the repo:**
   ```sh
   git clone <your-repo-url>
   cd streetmate-market
   ```
2. **Install dependencies:**
   ```sh
   npm install
   # or
   bun install
   ```
3. **Set up environment:**
   - Create a `.env` file with your Supabase credentials:
     ```env
     VITE_SUPABASE_URL=your-supabase-url
     VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
     ```
4. **Run the app locally:**
   ```sh
   npm run dev
   # or
   bun run dev
   ```
5. **Open in browser:**
   Visit [http://localhost:5173](http://localhost:5173)

## Deployment

- Deploy on [Vercel](https://vercel.com/) or [Netlify](https://www.netlify.com/) for instant hosting.
- Set environment variables in your deployment dashboard.
- Supabase must be accessible from your deployed frontend.

## Database Schema (Supabase)

- `products`: id, name, price, vendor_id, ...
- `orders`: id, status, seller_id, vendor_id, ...
- `order_items`: id, order_id, product_id, quantity, ...
- `profiles`: id, name, user_type, ...
- `categories`: id, name

## Credits

- Built with [shadcn/ui](https://ui.shadcn.com/), [Supabase](https://supabase.com/), [Vite](https://vitejs.dev/), and [Tailwind CSS](https://tailwindcss.com/).

---
