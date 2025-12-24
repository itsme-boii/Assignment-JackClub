import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

//Initialize DynamoDB Client
export const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "fake",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "fake",
    },
});

// Create Dynamo client
export const docClient = DynamoDBDocumentClient.from(client);

// Table name
export const TABLE_NAME = process.env.TABLE_NAME || "UserBalances";
