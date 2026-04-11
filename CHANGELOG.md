# Changelog

All notable changes to Atelier (formerly Orbit) are documented here.

## [1.5.0] — 2026-04-11

### Changed
- **Rebranded from Orbit to Atelier** — all UI text, metadata, localStorage keys, edge function prompts, and SEO tags updated.
- Added in-app **API Documentation** page (`/api-docs`) documenting all edge function endpoints.
- Added **CHANGELOG.md** with full version history.

---

## [1.4.0] — 2026-04-10

### Added
- **Smart Collections** — rule-based auto-curation using tags, moods, styles, and date ranges with one-click sync.
- **Public Artist Portfolio** — shareable `/portfolio/:userId` page rendering public collections with profile bio.
- **Portfolio Settings** — display name, bio, and portfolio toggle in Settings page.
- Database: `is_smart`, `smart_rules` (JSONB), `is_public` columns on `collections` table.
- Database: `profiles` table with auto-creation trigger on user signup.

---

## [1.3.0] — 2026-04-09

### Added
- **Dashboard Analytics** — upload frequency area chart, mood/style distribution (pie + bar), and collection size progress bars using Recharts.
- **Advanced Gallery Filtering** — collapsible filter sidebar with multi-select moods, styles, date ranges (7d–1y), and analysis status filters.
- **Ask the Archive AI Chat** — streaming SSE chat interface at `/ask` powered by Gemini 3 Flash via Lovable AI Gateway. Builds full archive context (artworks, codex, stories, collections) per request.
- Edge function: `ask-archive` with CORS, streaming, rate-limit handling, and credit-exhaustion responses.
- Sidebar: "Ask Archive" navigation entry with Sparkles icon.

---

## [1.2.0] — 2026-04-08

### Added
- **Route-based code splitting** — all pages lazy-loaded with `React.lazy` + `Suspense` fallback spinner.
- **Performance optimizations** — image lazy loading, parallel data fetching, reduced initial bundle size.

---

## [1.1.0] — 2026-04-07

### Added
- **Codex system** — knowledge base with entries (characters, worlds, concepts, techniques), AI summaries, and artwork linking via relationship graphs.
- **Stories & Scenes** — narrative builder with drag-to-reorder scenes, artwork/codex attachments, and inline editing.
- **Timeline view** — chronological visualization of all creative activity.
- **Mindmap view** — force-directed relationship graph across the archive.
- **Favorites system** — star artworks for quick access with dedicated `/favorites` page.
- **Bulk operations toolbar** — multi-select with batch add-to-collection and batch delete.
- **Command palette** — `Cmd+K` global search across artworks, codex, stories, and collections.
- **Shared collections** — public share links at `/share/collection/:id`.
- **Export system** — CSV and JSON export of archive data.
- **Theme toggle** — light/dark mode with system preference detection.

---

## [1.0.0] — 2026-04-06

### Added
- **Core archive system** — artwork upload with drag-and-drop, title editing, and image storage via Supabase Storage.
- **AI-powered artwork analysis** — automated mood detection, style classification, color palette extraction, and composition analysis via `analyze-artwork` edge function.
- **Gallery** — searchable, filterable grid with category badges and tag pills.
- **Collections** — manual curation boards with color coding, pinning, and cover images.
- **Art detail view** — full artwork page with analysis results, tags, categories, and collection membership.
- **Authentication** — email/password signup and login with protected routes.
- **RSS feed** — public RSS endpoint via `rss-feed` edge function.
- **About page** — system manifesto with animated feature showcase.
- **Settings page** — theme toggle and account management.
- Database schema: `artworks`, `artwork_analysis`, `artwork_tags`, `artwork_categories`, `collections`, `collection_artworks`, `codex_entries`, `codex_artwork_links`, `stories`, `story_scenes`.
- Row-Level Security policies on all tables.
