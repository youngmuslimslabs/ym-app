## YM App

Young Muslim's proprietary application that serves to create a database of organization leadership, track meaningful metrics in the field of tarbiyah, PDP, Study circle, and overall organizational operations. By consolidating this information, the application streamlines leadership management and strengthens overall organizational effectiveness.

<br> 

## Tech Stack

### Frontend
- **Next.js 15.5.3** - React framework with App Router
- **React 19.1.0**
- **TypeScript 5**
- **Tailwind CSS 3.4.17** - Utility-first CSS framework (pinned to v3)

### Backend & Database
- **Supabase** - Backend-as-a-Service with PostgreSQL
  - Authentication
  - Real-time database
  - Storage

### Development Tools
- **ESLint 9** - Code linting
- **PostCSS 8** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

<br>

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.




todos:
- update oauth client ids in google cloud console once ready to go live
- add a "Add a Before User Created" auth hook, to ensure supabase never creates non @youngmuslims.com user accounts