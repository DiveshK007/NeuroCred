# NeuroCred Python SDK

Official Python SDK for integrating NeuroCred credit scores into your application.

## Installation

```bash
pip install neurocred-sdk
```

## Usage

```python
from neurocred import NeuroCredClient

client = NeuroCredClient(
    api_key='your-api-key',
    base_url='https://neurocred-backend.onrender.com'  # Optional
)

# Get credit score
score = client.get_score('0x...')

# Get score history
history = client.get_score_history('0x...', limit=30)

# Get loans
loans = client.get_loans('0x...')

# Register webhook
webhook = client.register_webhook(
    url='https://your-app.com/webhook',
    events=['score.updated', 'loan.created']
)

# Verify webhook signature
is_valid = client.verify_webhook_signature(
    payload,
    signature,
    secret
)
```

## API Reference

See [NeuroCred API Documentation](https://neurocred-backend.onrender.com/docs) for full API reference.

