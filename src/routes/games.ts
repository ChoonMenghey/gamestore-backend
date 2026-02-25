import { desc, eq, getTableColumns, ilike, or, sql } from 'drizzle-orm';
import express from 'express';
import { games, genres } from '../db/schema';
import { db } from '../db';

const router = express.Router();

// Search all games with optional serach, filtering and pagination
router.get("/", async (req, res) => {
    try {
        const { search, genre, page = 1, limit = 10 } = req.query;

        const currentPage = Math.max(1, +page);
        const limitPerPage = Math.max(1, +limit);

        const offset = (currentPage - 1) * limitPerPage;

        const filterConditions = [];

        // If serach query exists, filter by game title
        if (search) {
            filterConditions.push(ilike(games.title, `%${search}%`));
        }

        // If genre filter exists, filter by genre name
        if (genre) {
            filterConditions.push(ilike(genres.name, `%${genre}%`));
        }

        const whereClause = filterConditions.length > 0 ? or(...filterConditions) : undefined;

        const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(games)
            .leftJoin(genres, eq(games.genreId, genres.id))
            .where(whereClause);

        const totalCount = countResult[0]?.count || 0;

        const gamesList = await db
            .select({
                ...getTableColumns(games),
                genre: { ...getTableColumns(genres) }
            }).from(games).leftJoin(genres, eq(games.genreId, genres.id))
            .where(whereClause)
            .orderBy(desc(games.createdAt))
            .limit(limitPerPage)
            .offset(offset);

        return res.status(200).json({
            data: gamesList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage),
            }
        })
    } catch (error) {
        console.error(`GET /games error: ${error}`);
        res.status(500).json({ error: "Failed to retrieve games" });
    }
});

export default router;