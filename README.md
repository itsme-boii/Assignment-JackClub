# Assignment

## File Structure
1. **db.ts**: Handles database connection and configuration.
2. **index.ts**: Contains API routes and serves as the application entry point.
3. **service.ts**: Implements service logic to fetch balances and process transactions.

## Running Instructions

### Docker
To build and run the application using Docker:

1. **Build the image:**
   ```bash
   docker build -t assignment-api .
   ```

2. **Run the container:**
   ```bash
   docker run -p 3000:3000 --env-file .env assignment-api
   ```

## Testing

### Get Balance
```bash
curl http://localhost:3000/balance/user123
```

### Perform Transaction
```bash
curl -X POST http://localhost:3000/transact \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "amount": 100,
    "type": "credit",
    "idempotentKey": "key1"
  }'
```
