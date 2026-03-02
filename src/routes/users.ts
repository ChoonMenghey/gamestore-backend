import express from "express";
import { and, desc, eq, ilike, or, sql, getTableColumns } from "drizzle-orm";

import { db } from "../db/index.js";
import { user, games, genres, type User } from "../db/schema/index.js";

type UserRoles = User["role"];

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const { search, role, page = 1, limit = 10 } = req.query;

        const currentPage = Math.max(1, Number(page) || 1);
        const limitPerPage = Math.max(1, Math.min(Number(limit) || 10, 100));
        const offset = (currentPage - 1) * limitPerPage;

        const filterConditions = [];

        if (search) {
            const escaped = String(search).replace(/%/g, '\\%').replace(/_/g, '\\_');
            filterConditions.push(
                or(ilike(user.name, `%${escaped}%`), ilike(user.email, `%${search}%`))
            );
        }

        if (role) {
            filterConditions.push(eq(user.role, role as UserRoles));
        }

        const whereClause =
            filterConditions.length > 0 ? and(...filterConditions) : undefined;

        const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(user)
            .where(whereClause);

        const totalCount = countResult[0]?.count ?? 0;

        const usersList = await db
            .select()
            .from(user)
            .where(whereClause)
            .orderBy(desc(user.createdAt))
            .limit(limitPerPage)
            .offset(offset);
        res.status(200).json({
            data: usersList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage),
            },
        });
    } catch (error) {
        console.error("GET /users error:", error);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// Get user details with role-specific data
router.get("/:id", async (req, res) => {
    try {
        const userId = req.params.id;

        const [userRecord] = await db
            .select()
            .from(user)
            .where(eq(user.id, userId));

        if (!userRecord) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json({ data: userRecord });
    } catch (error) {
        console.error("GET /users/:id error:", error);
        res.status(500).json({ error: "Failed to fetch user" });
    }
});

// List games associated with a user
router.get("/:id/games", async (req, res) => {
    try {
        const userId = req.params.id;
        const { page = 1, limit = 10 } = req.query;

        const [userRecord] = await db
            .select({ id: user.id, role: user.role })
            .from(user)
            .where(eq(user.id, userId));

        if (!userRecord) {
            return res.status(404).json({ error: "User not found" });
        }

        if (userRecord.role !== "developer" && userRecord.role !== "admin") {
            return res.status(200).json({
                data: [],
                pagination: {
                    page: 1,
                    limit: 0,
                    total: 0,
                    totalPages: 0,
                },
            });
        }
        const currentPage = Math.max(1, Number(page) || 1);
        const limitPerPage = Math.max(1, Math.min(Number(limit) || 10, 100));

        const offset = (currentPage - 1) * limitPerPage;

        const countResult =
            userRecord.role === "admin"
                ? await db
                    .select({ count: sql<number>`count(distinct ${games.id})` })
                    .from(games)
                : await db
                    .select({ count: sql<number>`count(distinct ${games.id})` })
                    .from(games)
                    .where(eq(games.developerId, userId));

        const totalCount = countResult[0]?.count ?? 0;

        const gamesList =
            userRecord.role === "admin"
                ? await db
                    .select({
                        ...getTableColumns(games),
                        genre: {
                            ...getTableColumns(genres),
                        },
                    })
                    .from(games)
                    .leftJoin(genres, eq(games.genreId, genres.id))
                    .orderBy(desc(games.createdAt))
                    .limit(limitPerPage)
                    .offset(offset)
                : await db
                    .select({
                        ...getTableColumns(games),
                        genre: {
                            ...getTableColumns(genres),
                        },
                    })
                    .from(games)
                    .leftJoin(genres, eq(games.genreId, genres.id))
                    .where(eq(games.developerId, userId))
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
        console.error("GET /users/:id/games error:", error);
        res.status(500).json({ error: "Failed to fetch user games" });
    }
});

export default router;