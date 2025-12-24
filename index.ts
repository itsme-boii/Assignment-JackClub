import "dotenv/config";
import express from "express";
import { getBalance, transact } from "./service";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// GET /balance/:userId
app.get("/balance/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const balance = await getBalance(userId);
        res.json({ userId, balance });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// POST /transact
app.post("/transact", async (req, res) => {
    try {
        const { userId, amount, type, idempotentKey } = req.body;

        if (!userId || !amount || !type || !idempotentKey) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        if (type !== "credit" && type !== "debit") {
            return res.status(400).json({ error: "Invalid transaction type" });
        }

        await transact({
            userId,
            amount: Number(amount),
            type,
            idempotentKey,
        });

        const newBalance = await getBalance(userId);
        res.json({ success: true, balance: newBalance });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
