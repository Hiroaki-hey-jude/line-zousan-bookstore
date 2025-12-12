# Line Zousan Bookstore

This is a starter template for a Next.js 14 project with TypeScript and Tailwind CSS configured. You can start editing the page by modifying `src/app/page.tsx`.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load Inter, a custom Google Font.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Admin tools

The project ships with a lightweight admin area for internal shipment management.

- Set an admin token with the `ADMIN_ACCESS_TOKEN` environment variable (defaults to `letmein` for local use). Set a long, random `ADMIN_SESSION_PASSWORD` (32+ characters) to encrypt and sign the admin session cookie.
- Start the dev server and open `/admin/login`, then enter the same token. A short-lived, httpOnly, encrypted admin session cookie is issued without storing the raw token.
- Sign in to the store as a normal user so that API requests include your session token.
- Access `/admin/shipments` to view recent orders, edit Stripe-webhook-created shipments, or add additional shipments. You can update carrier, tracking number, status, and shipped/delivered timestamps from the forms on each order card.
