# NeuroCred API Documentation

## Overview

The NeuroCred API provides a RESTful interface for interacting with the AI-powered credit scoring system on the QIE blockchain. All endpoints are versioned and require authentication.

**Base URL**: `https://api.neurocred.io/v1` (production) or `http://localhost:8000` (development)

**API Version**: 1.0.0

## Authentication

NeuroCred API supports three authentication methods:

### 1. API Key Authentication

Include your API key in the `X-API-Key` header:

```bash
curl -H "X-API-Key: your-api-key" https://api.neurocred.io/api/score/0x...
```

### 2. JWT Token Authentication

First, obtain a JWT token using wallet signature verification:

```bash
# Step 1: Get JWT token
curl -X POST https://api.neurocred.io/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x...",
    "message": "Sign this message...",
    "signature": "0x..."
  }'

# Step 2: Use token in requests
curl -H "Authorization: Bearer your-jwt-token" https://api.neurocred.io/api/score/0x...
```

### 3. Wallet Signature Authentication

For blockchain operations, you can authenticate using wallet signatures:

```bash
curl -X POST https://api.neurocred.io/api/score \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x...",
    "signature": "0x...",
    "message": "Sign this message...",
    "timestamp": 1234567890
  }'
```

## Rate Limiting

All endpoints are rate-limited to prevent abuse:

- **Default**: 60 requests per minute per IP
- **Score Generation**: 10 requests per minute
- **Chat API**: 30 requests per minute
- **Authentication**: 10 requests per minute

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1640995200
```

## Endpoints

### Health Check

#### `GET /health`

Check API health status.

**Response**:
```json
{
  "status": "healthy",
  "service": "NeuroCred API",
  "version": "1.0.0"
}
```

#### `GET /health/ready`

Check if API is ready to serve requests (includes dependency checks).

**Response**:
```json
{
  "status": "ready",
  "database": "connected",
  "redis": "connected",
  "blockchain": "connected"
}
```

### Authentication

#### `POST /api/auth/token`

Create a JWT token using wallet signature verification.

**Request Body**:
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "message": "Sign this message to authenticate...",
  "signature": "0x..."
}
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 86400
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid wallet signature
- `429 Too Many Requests`: Rate limit exceeded

### Credit Scoring

#### `POST /api/score`

Generate a credit score for a wallet address and update it on-chain.

**Request Body**:
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "signature": "0x...",  // Optional: for wallet signature auth
  "message": "Sign this message...",  // Optional
  "timestamp": 1234567890  // Optional
}
```

**Response**:
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "score": 750,
  "baseScore": 650,
  "riskBand": 1,
  "explanation": "Score calculated based on on-chain activity, staking, and oracle data.",
  "transactionHash": "0x...",
  "stakingBoost": 50,
  "oraclePenalty": 0,
  "stakedAmount": 1000000000000000000,
  "stakingTier": 2
}
```

**Response Fields**:
- `score`: Final credit score (0-1000)
- `baseScore`: Base score before boosts/penalties
- `riskBand`: Risk band (0=Very Low, 1=Low, 2=Moderate, 3=High)
- `stakingBoost`: Score boost from staking (0-300)
- `oraclePenalty`: Penalty from oracle data (0-100)
- `stakedAmount`: Amount of NCRD tokens staked (in wei)
- `stakingTier`: Staking tier (0=None, 1=Bronze, 2=Silver, 3=Gold)

**Error Responses**:
- `400 Bad Request`: Invalid wallet address
- `401 Unauthorized`: Authentication required
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

#### `GET /api/score/{address}`

Get the current credit score for a wallet address.

**Path Parameters**:
- `address`: Ethereum wallet address (0x-prefixed, 42 characters)

**Response**: Same as `POST /api/score`

**Example**:
```bash
curl https://api.neurocred.io/api/score/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

### Oracle Data

#### `GET /api/oracle/price`

Get current oracle price for QIE/USD.

**Response**:
```json
{
  "price": 2.45,
  "timestamp": 1640995200,
  "oracleAddress": "0x..."
}
```

**Error Responses**:
- `500 Internal Server Error`: Oracle not configured or unavailable

#### `GET /api/oracle/volatility`

Get volatility data for an asset.

**Query Parameters**:
- `asset`: Asset symbol (default: "QIE")
- `days`: Number of days for volatility calculation (default: 30)

**Response**:
```json
{
  "asset": "QIE",
  "volatility_30d": 0.25,
  "current_price_usd": 2.45
}
```

### Staking

#### `GET /api/staking/{address}`

Get staking information for a wallet address.

**Path Parameters**:
- `address`: Ethereum wallet address

**Response**:
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "stakedAmount": "1000000000000000000",
  "tier": 2,
  "tierName": "Silver",
  "scoreBoost": 50
}
```

**Response Fields**:
- `stakedAmount`: Amount staked in wei
- `tier`: Staking tier (0-3)
- `tierName`: Human-readable tier name
- `scoreBoost`: Score boost from staking

### Lending

#### `GET /api/lending/ltv/{address}`

Get Loan-to-Value (LTV) ratio for a wallet address.

**Path Parameters**:
- `address`: Ethereum wallet address

**Response**:
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "ltvBps": 7000,
  "ltvPercent": 70.0,
  "riskBand": 1,
  "score": 750
}
```

**Response Fields**:
- `ltvBps`: LTV in basis points (e.g., 7000 = 70%)
- `ltvPercent`: LTV as percentage
- `riskBand`: Risk band used for LTV calculation
- `score`: Current credit score

### Chat API (NeuroLend)

#### `POST /api/chat`

Chat with the NeuroLend AI agent for loan negotiation.

**Request Body**:
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "message": "I need a loan of 1000 QIE for 30 days"
}
```

**Response**:
```json
{
  "response": "I can offer you a loan of 1000 QIE at 5% APR for 30 days. Would you like to accept?",
  "offer": {
    "amount": "1000000000000000000000",
    "interestRate": 5.0,
    "termDays": 30,
    "collateralRequired": "1500000000000000000000"
  },
  "signature": "0x...",
  "requiresSignature": true
}
```

**Response Fields**:
- `response`: AI agent's text response
- `offer`: Loan offer details (if applicable)
- `signature`: EIP-712 signature for the offer (if applicable)
- `requiresSignature`: Whether the offer requires a signature

**Error Responses**:
- `400 Bad Request`: Invalid message or address
- `401 Unauthorized`: Authentication required
- `429 Too Many Requests`: Rate limit exceeded

### On-Chain Updates

#### `POST /api/update-on-chain`

Update credit score on the blockchain.

**Request Body**:
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "score": 750,
  "riskBand": 1
}
```

**Response**:
```json
{
  "success": true,
  "transactionHash": "0x...",
  "message": "Score updated on-chain successfully"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid score or risk band
- `401 Unauthorized`: Authentication required
- `500 Internal Server Error`: Blockchain transaction failed

### Metrics

#### `GET /metrics`

Get Prometheus metrics (for monitoring).

**Response**: Prometheus metrics format

**Note**: This endpoint is typically only accessible to monitoring systems.

## Error Handling

All errors follow a consistent format:

```json
{
  "detail": "Error message",
  "error_code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Common Error Codes

- `INVALID_ADDRESS`: Invalid Ethereum address format
- `INVALID_SCORE`: Score out of valid range (0-1000)
- `INVALID_RISK_BAND`: Risk band out of valid range (0-3)
- `AUTH_REQUIRED`: Authentication required
- `INVALID_SIGNATURE`: Invalid wallet signature
- `RATE_LIMIT_EXCEEDED`: Rate limit exceeded
- `BLOCKCHAIN_ERROR`: Blockchain transaction failed
- `ORACLE_ERROR`: Oracle data unavailable

## Pagination

Endpoints that return lists support pagination:

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response Headers**:
```
X-Total-Count: 100
X-Page: 1
X-Per-Page: 20
X-Total-Pages: 5
```

## Webhooks

NeuroCred supports webhooks for real-time notifications:

### Webhook Events

- `score.updated`: Credit score was updated
- `loan.created`: New loan was created
- `loan.repaid`: Loan was repaid
- `loan.defaulted`: Loan defaulted
- `staking.tier_changed`: Staking tier changed

### Webhook Configuration

Configure webhooks via the dashboard or API:

```bash
curl -X POST https://api.neurocred.io/api/webhooks \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.com/webhooks",
    "events": ["score.updated", "loan.created"],
    "secret": "your-webhook-secret"
  }'
```

## SDKs and Examples

### Python SDK

```python
from neurocred import NeuroCredClient

client = NeuroCredClient(api_key="your-api-key")

# Get score
score = client.get_score("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb")
print(f"Credit Score: {score['score']}")

# Generate new score
result = client.generate_score("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb")
print(f"New Score: {result['score']}")
```

### JavaScript SDK

```javascript
import { NeuroCredClient } from '@neurocred/sdk';

const client = new NeuroCredClient({
  apiKey: 'your-api-key',
  baseURL: 'https://api.neurocred.io'
});

// Get score
const score = await client.getScore('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
console.log(`Credit Score: ${score.score}`);

// Generate new score
const result = await client.generateScore('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
console.log(`New Score: ${result.score}`);
```

### cURL Examples

```bash
# Get score
curl -H "X-API-Key: your-api-key" \
  https://api.neurocred.io/api/score/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

# Generate new score
curl -X POST https://api.neurocred.io/api/score \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"}'

# Get staking info
curl -H "X-API-Key: your-api-key" \
  https://api.neurocred.io/api/staking/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

## Interactive API Documentation

FastAPI automatically generates interactive API documentation:

- **Swagger UI**: `https://api.neurocred.io/docs`
- **ReDoc**: `https://api.neurocred.io/redoc`
- **OpenAPI Schema**: `https://api.neurocred.io/openapi.json`

## Support

For API support:
- **Documentation**: https://docs.neurocred.io
- **GitHub Issues**: https://github.com/neurocred/neurocred/issues
- **Email**: api-support@neurocred.io

