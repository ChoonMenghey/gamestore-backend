import { relations } from "drizzle-orm";
import { integer, pgTable, timestamp, serial, decimal, varchar } from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
}
// Users table - Users can register and log in, own games, write reviews, wishlist games, place orders
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  ...timestamps,
});

// Developers table - Developers can publish multiple games
export const developers = pgTable('developers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: varchar('description', { length: 255 }).notNull(),
  ...timestamps,
});

// Genres table - A genre can belong to multiple games, a game can belong to multiple genres
export const genres = pgTable('genres', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: varchar('name', { length: 50 }).notNull().unique(),
});

// Games table - Each game has title, description, price, genre, release date, cover image
export const games = pgTable('games', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  genreId: integer('genre_id').notNull().references(() => genres.id, { onDelete: 'restrict' }),
  title: varchar('title', { length: 100 }).notNull(),
  description: varchar('description', { length: 150 }).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  ...timestamps
});

export const genreRelations = relations(genres, ({ many }) => ({
  games: many(games),
}));

export type Genre = typeof genres.$inferSelect;
export type NewGenre = typeof genres.$inferInsert;

export type Game = typeof games.$inferSelect
export type NewGame = typeof games.$inferInsert;
