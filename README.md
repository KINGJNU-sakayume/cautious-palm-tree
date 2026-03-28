# 업적 라이브러리 (Achievement Library)

A personal achievement tracking PWA built with React and backed by Supabase.

## Tech Stack

- **Frontend**: React 18, React Router 6, Tailwind CSS
- **Build**: Vite 6 + vite-plugin-pwa
- **Database**: Supabase (PostgreSQL)

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Create Supabase tables
Run the following SQL in your Supabase project's **SQL Editor**:

```sql
CREATE TABLE IF NOT EXISTS categories (
  id        TEXT PRIMARY KEY,
  name      TEXT NOT NULL,
  parent_id TEXT REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS records (
  id                       TEXT PRIMARY KEY,
  category_id              TEXT REFERENCES categories(id) ON DELETE SET NULL,
  date                     DATE NOT NULL,
  value                    NUMERIC,
  unit                     TEXT,
  memo                     TEXT,
  photo_url                TEXT,
  tags                     JSONB NOT NULL DEFAULT '[]',
  unlocked_achievement_ids JSONB NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS achievements (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  description  TEXT,
  category_id  TEXT REFERENCES categories(id) ON DELETE SET NULL,
  tier         TEXT NOT NULL,
  type         TEXT NOT NULL,
  condition    JSONB NOT NULL DEFAULT '{}',
  rarity       NUMERIC,
  is_hidden    BOOLEAN NOT NULL DEFAULT FALSE,
  is_earned    BOOLEAN NOT NULL DEFAULT FALSE,
  earned_at    DATE,
  progress     NUMERIC NOT NULL DEFAULT 0,
  soft_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

ALTER TABLE categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE records      ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_categories"   ON categories   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_records"      ON records      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_achievements" ON achievements FOR ALL USING (true) WITH CHECK (true);
```

### 3. Configure environment variables
Create `.env.local` in the project root:

```
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

Find these values in your Supabase project under **Settings → API**.

### 4. Run the app
```bash
npm run dev
```

On first load the app automatically seeds the database with default categories, records, and achievements.

## Architecture

```
src/
├── context/AppContext.jsx       # Central state (useReducer + Supabase sync)
├── lib/
│   ├── supabase.js              # Supabase client singleton
│   ├── db.js                    # Async CRUD data access layer
│   └── seed.js                  # First-run seeder
├── data/                        # Static seed data (categories, records, achievements)
├── utils/
│   └── achievementEvaluator.js  # In-memory achievement unlock logic
├── pages/                       # Dashboard, RecordHub, AchievementManagement, Showcase
└── components/                  # UI components
```

Data flows **optimistically**: every mutation dispatches to local React state immediately, then persists to Supabase asynchronously. If Supabase is unreachable the app falls back to static seed data (read-only).
