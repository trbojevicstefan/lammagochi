import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const petProfile = sqliteTable('pet_profile', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  modelName: text('model_name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const petState = sqliteTable('pet_state', {
  petId: text('pet_id').primaryKey(),
  level: integer('level').notNull(),
  xp: integer('xp').notNull(),
  stage: text('stage').notNull(),
  bubbleText: text('bubble_text').notNull(),
  lastTickAt: integer('last_tick_at', { mode: 'timestamp_ms' }).notNull(),
});

export const petStats = sqliteTable('pet_stats', {
  petId: text('pet_id').primaryKey(),
  hunger: integer('hunger').notNull(),
  curiosity: integer('curiosity').notNull(),
  energy: integer('energy').notNull(),
  hygiene: integer('hygiene').notNull(),
  mood: integer('mood').notNull(),
  knowledge: integer('knowledge').notNull(),
  trust: integer('trust').notNull(),
  boredom: integer('boredom').notNull(),
});

export const memoryItems = sqliteTable('memory_items', {
  id: text('id').primaryKey(),
  petId: text('pet_id').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  approved: integer('approved', { mode: 'boolean' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const journalEntries = sqliteTable('journal_entries', {
  id: text('id').primaryKey(),
  petId: text('pet_id').notNull(),
  entryType: text('entry_type').notNull(),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

