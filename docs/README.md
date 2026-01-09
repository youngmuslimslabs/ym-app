## YM App

Young Muslim's proprietary application that serves to create a database of organization leadership, track meaningful metrics in the field of tarbiyah, PDP, Study circle, and overall organizational operations. By consolidating this information, the application streamlines leadership management and strengthens overall organizational effectiveness.

<br> 

## Tech Stack

### Frontend
- **Next.js 15.5.3** - React framework with App Router
- **React 19.1.0**
- **React Context** - State management (used for onboarding flow)
- **TypeScript 5**
- **Tailwind CSS 3.4.17** - Utility-first CSS framework (pinned to v3)

### UI Components
- **shadcn/ui** - Accessible component primitives built on Radix UI
- **Radix UI** - Headless UI components (Select, Popover, Dialog, etc.)
- **Lucide React** - Icon library
- **cmdk** - Command menu component (for searchable comboboxes)
- **date-fns** - Date formatting utilities
- **react-day-picker** - Calendar/date picker component

### Backend & Database
- **Supabase** - Backend-as-a-Service with PostgreSQL
  - Authentication
  - Real-time database
  - Storage

### Development Tools
- **Bun** - Fast JavaScript runtime and package manager
- **ESLint 9** - Code linting
- **Vitest 4** - Unit testing framework
- **PostCSS 8** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

<br>

## Getting Started

### 1. Install Bun (if not already installed)

```bash
curl -fsSL https://bun.sh/install | bash
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Set Up Environment Variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

### 4. Run the Development Server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

<br>

## Testing

### Run Tests

```bash
# Run all tests once
bun test

# Run tests in watch mode (re-runs on file changes)
bun run test:watch
```

### Test Structure

Tests live alongside source files with `.test.ts` or `.spec.ts` suffix:

```
src/
  lib/
    utils.ts        # Source file
    utils.test.ts   # Test file
```

### Writing Tests

```typescript
import { describe, it, expect } from 'vitest'
import { myFunction } from './myModule'

describe('myFunction', () => {
  it('should do something', () => {
    expect(myFunction('input')).toBe('expected output')
  })
})
```

### CI/CD

Tests run automatically on:
- Every push to `main`
- Every pull request targeting `main`

The CI pipeline runs: **lint → test → build**. All must pass for PRs to be mergeable.

<br>

## Claude Code Setup (for contributors using Claude Code)

If you're using [Claude Code](https://docs.anthropic.com/en/docs/claude-code) for development, install the following MCP servers and plugins.

> **MCP vs Plugins:** MCP servers connect Claude to external services (like your database). Plugins add skills and tools (like documentation lookup). Some plugins include MCP servers.

| Name | Type | What it does | Install command |
|------|------|--------------|-----------------|
| **Supabase MCP** | MCP Server | Query our database tables, run SQL | `claude mcp add --scope project --transport http supabase "https://mcp.supabase.com/mcp?project_ref=todqvyzdvpnwuuonxwch&read_only=true&features=storage%2Cbranching%2Cfunctions%2Cdevelopment%2Cdebugging%2Cdocs%2Caccount%2Cdatabase"` |
| **context7** | Plugin | Look up docs for Next.js, React, Tailwind, etc. | `claude plugin install context7@claude-plugins-official` |
| **supabase** | Plugin | Search Supabase documentation | `claude plugin install supabase@claude-plugins-official` |
| **playwright** | Plugin + MCP | Browser automation for UI testing | `claude plugin install playwright@claude-plugins-official` |
| **frontend-design** | Plugin | UI/UX design assistance | `claude plugin install frontend-design@claude-plugins-official` |

After installing Supabase MCP, authenticate (run in a regular terminal, not IDE):
```bash
claude /mcp
# Select "supabase" → "Authenticate"
```

<br>

## Reference Documents

External documents that may be relevant for understanding the data model and organizational structure.

| Document | Description |
|----------|-------------|
| [Original ERD](https://docs.google.com/document/d/1OIHjd8OVqVa2TGD6bSNIp1BF0Jq3MNXzXVLOXvYpP3M/edit?tab=t.0) | Early entity-relationship diagram |
| [NN Database (Version A)](https://docs.google.com/spreadsheets/d/1Ihl0DEdeY850e_mUuHYN4MtlLgy80AGr1AkOEbznkIE/edit?gid=0#gid=0) | NeighborNet data spreadsheet |
| [NN Database (Version B)](https://docs.google.com/spreadsheets/d/1CbpRgFKZSN7s9HtOHBQuUra4bKQBnQocnziQ43srjHc/edit?gid=0#gid=0) | NeighborNet data spreadsheet (alternate version) |

> **Note:** It's unclear which NN database version is most current. Compare both when referencing member data.

<br>

---

todos:
- update oauth client ids in google cloud console once ready to go live
- add a "Add a Before User Created" auth hook, to ensure supabase never creates non @youngmuslims.com user accounts