import { and, desc, eq, getTableColumns, ilike, or, sql } from 'drizzle-orm';
import express from 'express';
import { games, genres } from '../db/schema/index.js';
import { db } from '../db/index.js';

const router = express.Router();

// Search all games with optional serach, filtering and pagination
router.get("/", async (req, res) => {
    try {
        const { search, genre, page = 1, limit = 10 } = req.query;

        const currentPage = Math.max(1, Number(page) || 1);
        const limitPerPage = Math.max(1, Math.min(Number(limit) || 10, 100));

        const offset = (currentPage - 1) * limitPerPage;

        const filterConditions = [];

        // If search query exists, filter by game title
        if (search) {
            const escaped = String(search).replace(/%/g, '\\%').replace(/_/g, '\\_');
            filterConditions.push(ilike(games.title, `%${escaped}%`));
        }

        // If genre filter exists, filter by genre name
        if (genre) {
            filterConditions.push(ilike(genres.name, `%${genre}%`));
        }

        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

        const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(games)
            .leftJoin(genres, eq(games.genreId, genres.id))
            .where(whereClause);

        const totalCount = Number(countResult[0]?.count) || 0;

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