export const createTablesSql: string[] = [
  `CREATE TABLE IF NOT EXISTS pet_profile (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    model_name TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS pet_state (
    pet_id TEXT PRIMARY KEY NOT NULL,
    level INTEGER NOT NULL,
    xp INTEGER NOT NULL,
    stage TEXT NOT NULL,
    bubble_text TEXT NOT NULL,
    last_tick_at INTEGER NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS pet_stats (
    pet_id TEXT PRIMARY KEY NOT NULL,
    hunger INTEGER NOT NULL,
    curiosity INTEGER NOT NULL,
    energy INTEGER NOT NULL,
    hygiene INTEGER NOT NULL,
    mood INTEGER NOT NULL,
    knowledge INTEGER NOT NULL,
    trust INTEGER NOT NULL,
    boredom INTEGER NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS memory_items (
    id TEXT PRIMARY KEY NOT NULL,
    pet_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    approved INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS journal_entries (
    id TEXT PRIMARY KEY NOT NULL,
    pet_id TEXT NOT NULL,
    entry_type TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );`,
];

