# OURSELL - Modern Multi-Store Retail POS Ecosystem

Oursell is a high-performance, offline-capable, multi-store retail Point of Sale (POS) and backoffice ERP ecosystem built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Multi-Store & Outlets Architecture**: Multi-tenant store routing (`/shop/[storeSlug]/pos`, `/shop/[storeSlug]/admin`).
- **Interactive POS Register & Self-Checkout Kiosk**: Fast barcode scanning, dual payment processing (Cash & Card), discount calculation, receipt generation.
- **Backoffice Suite**: Comprehensive modules for Inventory, Analytics, Expenses, Staff management, Purchasing, CRM, and Barcode generation.
- **DevCore Administrative Platform**: Superadmin portal for global store provisioning, subscriptions, platform permissions, activity logs, and account oversight.
- **Offline Resiliency & Cloud Sync**: Local IndexedDB / Dexie.js persistence with automated background Supabase sync.
- **Role-Based Access Control & Plan Gating**: Dynamic feature permissions across Starter, Growth, and Enterprise plans.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Lucide Icons
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security)
- **Local Persistence**: IndexedDB (Dexie)
- **State Management**: Zustand
