import { relations } from "drizzle-orm";
import { integer, pgTable, timestamp, decimal, varchar, index, pgEnum } from "drizzle-orm/pg-core";
import { player } from "./auth.js";

export const gameStatusEnum = pgEnum('game_status', ['Available', 'Pending', 'Not Available']);

const timestamps = {
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull(),
}

// Genres table - A genre can belong to multiple games, a game can belong to multiple genres
export const genres = pgTable('genres', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: varchar('name', { length: 50 }).notNull().unique(),
});

// Games table - Each game has title, description, price, genre, release date, cover image
export const games = pgTable('games', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  developerName: varchar('developer_name', { length: 100 }).notNull(),
  genreId: integer('genre_id').notNull().references(() => genres.id, { onDelete: 'restrict' }),
  title: varchar('title', { length: 100 }).notNull(),
  description: varchar('description', { length: 150 }).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  status: gameStatusEnum('status').default('Available').notNull(),
  ...timestamps
},
(table) => ({
  genreIdIdx: index('games_genre_id_idx').on(table.genreId),
})
);

export const transactions = pgTable('transactions', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  gameId: integer('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  playerId: integer('player_id').notNull().references(() => player.id, { onDelete: 'cascade' }),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  transactionDate: timestamp('transaction_date').defaultNow().notNull(),
},
(table) => ({
  gameIdIdx: index('transactions_game_id_idx').on(table.gameId),
  playerIdIdx: index('transactions_player_id_idx').on(table.playerId),
})
);

export const genreRelations = relations(genres, ({ many }) => ({
  games: many(games),
}));

export const gameRelations = relations(games, ({ one, many }) => ({
  genre: one(genres, {
    fields: [games.genreId],
    references: [genres.id],
  }),
  transactions: many(transactions),
}));

export const transactionRelations = relations(transactions, ({ one }) => ({
  games: one(games, {
    fields: [transactions.gameId],
    references: [games.id],
  })
}));

export type Genre = typeof genres.$inferSelect;
export type NewGenre = typeof genres.$inferInsert;

export type Game = typeof games.$inferSelect
export type NewGame = typeof games.$inferInsert;

export type Transaction = typeof transactions.$inferSelect
export type NewTransaction = typeof transactions.$inferInsert;