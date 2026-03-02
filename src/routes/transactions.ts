import express, { Request, Response } from "express";
import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "../db/index.js";
import { transactions, games, player, user } from "../db/schema/index.js";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
    try {
        const userRole = req.user?.role;
        const userId = req.user?.id;

        if (!userRole || !userId) {
            return res.status(401).json({ error: "Unauthorized", message: "User not authenticated" });
        }

        const { page = 1, limit = 10 } = req.query;

        const currentPage = Math.max(1, +page);
        const limitPerPage = Math.max(1, +limit);
        const offset = (currentPage - 1) * limitPerPage;

        // Build the WHERE clause based on role
        let whereClause;

        if (userRole === "admin") {
            // Admin can see all transactions
            whereClause = undefined;
        } else if (userRole === "developer") {
            // Developer can only see transactions for their games
            whereClause = eq(games.developerId, userId);
        } else {
            return res.status(403).json({ error: "Forbidden", message: "Only admins and developers can view transactions" });
        }

        // Count total transactions
        const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(transactions)
            .innerJoin(games, eq(transactions.gameId, games.id))
            .where(whereClause);

        const totalCount = countResult[0]?.count ?? 0;

        // Fetch transactions with related data
        const transactionsList = await db
            .select({
                id: transactions.id,
                playerId: transactions.playerId,
                gameId: transactions.gameId,
                transactionDate: transactions.transactionDate,
                amount: transactions.amount,
                developerId: games.developerId,
            })
            .from(transactions)
            .innerJoin(games, eq(transactions.gameId, games.id))
            .where(whereClause)
            .orderBy(desc(transactions.transactionDate))
            .limit(limitPerPage)
            .offset(offset);

        res.status(200).json({
            data: transactionsList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                pages: Math.ceil(totalCount / limitPerPage),
            },
        });
    } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({ error: "Internal Server Error", message: "Failed to fetch transactions" });
    }
});

export default router;
