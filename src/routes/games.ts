import { and, desc, eq, getTableColumns, ilike, or, sql } from 'drizzle-orm';
import express, { Request, Response } from 'express';
import { games, genres, user } from '../db/schema/index.js';
import { db } from '../db/index.js';
import { auth } from '../lib/auth.js';

const router = express.Router();

// Search all games with optional serach, filtering and pagination
router.get("/", async (req: Request, res: Response) => {
    try {
        const { search, genre, page = 1, limit = 10 } = req.query;

        const currentPage = Math.max(1, Number(page) || 1);
        const limitPerPage = Math.max(1, Math.min(Number(limit) || 10, 100));

        const offset = (currentPage - 1) * limitPerPage;

        const filterConditions = [];

        // If search query exists, filter by game title
        if (search) {
            filterConditions.push(ilike(games.title, `%${search}%`));
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
            .leftJoin(user, eq(games.developerId, user.id))
            .where(whereClause);

        const totalCount = Number(countResult[0]?.count) || 0;

        const gamesList = await db
            .select({
                ...getTableColumns(games),
                genre: { ...getTableColumns(genres) },
                developerId: { ...getTableColumns(user) }
            }).from(games)
            .leftJoin(genres, eq(games.genreId, genres.id))
            .leftJoin(user, eq(games.developerId, user.id))
            .where(whereClause)
            .orderBy(desc(games.createdAt))
            .limit(limitPerPage)
            .offset(offset);

        res.status(200).json({
            data: gamesList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage),
            },
        });
    } catch (error) {
        console.error(`GET /games error: ${error}`);
        res.status(500).json({ error: "Failed to retrieve games" });
    }
});

router.post('/', async (req, res) => {

    try {
        const {
            title,
            genreId,
            price,
            status,
            developerId,
            description,
            bannerUrl,
            bannerCldPubId,
        } = req.body;

        const [createdGames] = await db
            .insert(games)
            .values({
                genreId,
                developerId,
                title,
                price,
                bannerCldPubId,
                bannerUrl,
                status,
                description,
            })
            .returning({ id: games.id });

        if (!createdGames) throw Error("???");

        res.status(201).json({ data: createdGames });

    } catch (e) {
        console.error(`POST /games error ${e}`);
        res.status(500).json({ error: e });
    }
})
export default router;