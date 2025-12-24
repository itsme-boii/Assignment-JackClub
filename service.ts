import { GetItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { docClient, TABLE_NAME } from "./db";

interface TransactionInput {
    idempotentKey: string;
    userId: string;
    amount: number;
    type: "credit" | "debit";
}

/**
 * Get balance of a user
 * @param userId user id
 * @returns balance
 */
export async function getBalance(userId: string): Promise<number> {
    const command = new GetItemCommand({
        TableName: TABLE_NAME,
        Key: { userId: { S: userId } },
    });

    const result = await docClient.send(command);
    return result.Item && result.Item.balance ? parseInt(result.Item.balance.N!, 10) : 0;
}

/**
 * Perform a transaction
 * @param input transaction input
 * @returns void
 */
export async function transact(input: TransactionInput): Promise<void> {
    const { idempotentKey, userId, amount, type } = input;

    const updateExpression = "SET balance = if_not_exists(balance, :zero) + :amount ADD processedKeys :key";

    const finalAmount = type === "credit" ? amount : -amount;

    const command = new UpdateItemCommand({
        TableName: TABLE_NAME,
        Key: { userId: { S: userId } },
        UpdateExpression: updateExpression,
        ConditionExpression: "NOT contains(processedKeys, :keyStr)" + (type === "debit" ? " AND (balance >= :absAmount)" : ""),
        ExpressionAttributeValues: {
            ":amount": { N: finalAmount.toString() },
            ":key": { SS: [idempotentKey] },
            ":keyStr": { S: idempotentKey },
            ":zero": { N: "0" },
            ...(type === "debit" ? { ":absAmount": { N: amount.toString() } } : {}),
        },
    });

    try {
        await docClient.send(command);
    } catch (error: any) {
        if (error.name === "ConditionalCheckFailedException") {

            // Fetch current state
            const current = await docClient.send(new GetItemCommand({
                TableName: TABLE_NAME,
                Key: { userId: { S: userId } },
            }));

            if (current.Item) {

                // Duplicate key check
                const processedKeys = current.Item.processedKeys?.SS || [];
                if (processedKeys.includes(idempotentKey)) {
                    throw new Error("Transaction failed: Duplicate transaction");
                }

                // Insufficient funds check
                if (type === "debit") {
                    const balance = current.Item.balance?.N ? parseInt(current.Item.balance.N, 10) : 0;
                    if (balance < amount) {
                        throw new Error("Transaction failed: Insufficient funds");
                    }
                }
            }

            //Sometimes it fails for unknown cause so we gonna log it and throw error
            throw new Error("Transaction failed: Idempotency check or Insufficient funds (Unknown cause)");
        }
        throw error;
    }
}
