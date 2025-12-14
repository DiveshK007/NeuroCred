# Production Deployment Guide

## Prerequisites

- Kubernetes cluster (v1.24+)
- kubectl configured
- Docker registry access
- PostgreSQL database (managed or self-hosted)
- Redis instance
- QIE testnet/mainnet RPC access
- Domain name with DNS access
- SSL certificate (Let's Encrypt via Cert-Manager)

## Environment Setup

### 1. Create Namespace

```bash
kubectl create namespace neurocred-prod
```

### 2. Create Secrets

```bash
# Database credentials
kubectl create secret generic postgres-secret \
  --from-literal=username=neurocred \
  --from-literal=password=<secure-password> \
  -n neurocred-prod

# Redis password
kubectl create secret generic redis-secret \
  --from-literal=password=<redis-password> \
  -n neurocred-prod

# API keys
kubectl create secret generic api-secrets \
  --from-literal=sentry-dsn=<sentry-dsn> \
  --from-literal=jwt-secret=<jwt-secret> \
  -n neurocred-prod

# Private keys (encrypted)
kubectl create secret generic blockchain-secrets \
  --from-literal=private-key=<encrypted-private-key> \
  --from-literal=rpc-url=<qie-rpc-url> \
  -n neurocred-prod
```

### 3. Create ConfigMap

```bash
kubectl apply -f k8s/base/configmap.yaml -n neurocred-prod
```

## Database Setup

### 1. Initialize Database

```bash
# Run migrations
kubectl run alembic-migration \
  --image=neurocred/backend:latest \
  --restart=Never \
  --command -- alembic upgrade head \
  -n neurocred-prod
```

### 2. Verify Database

```bash
kubectl exec -it <postgres-pod> -n neurocred-prod -- psql -U neurocred -d neurocred
```

## Application Deployment

### 1. Deploy Backend

```bash
# Apply backend deployment
kubectl apply -f k8s/overlays/prod/backend-deployment.yaml -n neurocred-prod

# Apply backend service
kubectl apply -f k8s/overlays/prod/backend-service.yaml -n neurocred-prod
```

### 2. Deploy Frontend

```bash
# Apply frontend deployment
kubectl apply -f k8s/overlays/prod/frontend-deployment.yaml -n neurocred-prod

# Apply frontend service
kubectl apply -f k8s/overlays/prod/frontend-service.yaml -n neurocred-prod
```

### 3. Deploy Workers

```bash
# Deploy RQ workers
kubectl apply -f k8s/overlays/prod/worker-deployment.yaml -n neurocred-prod
```

### 4. Deploy Ingress

```bash
# Apply ingress configuration
kubectl apply -f k8s/overlays/prod/ingress.yaml -n neurocred-prod
```

## SSL Certificate Setup

### 1. Install Cert-Manager

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

### 2. Create ClusterIssuer

```bash
kubectl apply -f k8s/overlays/prod/cluster-issuer.yaml
```

### 3. Verify Certificate

```bash
kubectl get certificate -n neurocred-prod
```

## Monitoring Setup

### 1. Deploy Prometheus

```bash
kubectl apply -f k8s/monitoring/prometheus.yaml -n neurocred-prod
```

### 2. Deploy Grafana

```bash
kubectl apply -f k8s/monitoring/grafana.yaml -n neurocred-prod
```

### 3. Configure Alerts

```bash
kubectl apply -f k8s/monitoring/alert-rules.yaml -n neurocred-prod
```

## Verification

### 1. Check Pod Status

```bash
kubectl get pods -n neurocred-prod
```

### 2. Check Services

```bash
kubectl get svc -n neurocred-prod
```

### 3. Test Health Endpoints

```bash
curl https://api.neurocred.io/health
curl https://api.neurocred.io/health/ready
```

### 4. Check Logs

```bash
kubectl logs -f deployment/backend -n neurocred-prod
kubectl logs -f deployment/frontend -n neurocred-prod
```

## Post-Deployment

### 1. Verify Database Connections

```bash
kubectl exec -it deployment/backend -n neurocred-prod -- python -c "from database.connection import init_db; import asyncio; asyncio.run(init_db())"
```

### 2. Test API Endpoints

```bash
# Generate test score
curl -X POST https://api.neurocred.io/api/score \
  -H "Content-Type: application/json" \
  -d '{"address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"}'
```

### 3. Monitor Metrics

- Check Prometheus: `https://prometheus.neurocred.io`
- Check Grafana: `https://grafana.neurocred.io`
- Check Sentry: Monitor error rates

## Rollback Procedure

### 1. Rollback Deployment

```bash
# Rollback backend
kubectl rollout undo deployment/backend -n neurocred-prod

# Rollback frontend
kubectl rollout undo deployment/frontend -n neurocred-prod
```

### 2. Verify Rollback

```bash
kubectl rollout status deployment/backend -n neurocred-prod
kubectl rollout status deployment/frontend -n neurocred-prod
```

## Scaling

### 1. Horizontal Scaling

```bash
# Scale backend
kubectl scale deployment/backend --replicas=5 -n neurocred-prod

# Scale frontend
kubectl scale deployment/frontend --replicas=3 -n neurocred-prod

# Scale workers
kubectl scale deployment/worker --replicas=10 -n neurocred-prod
```

### 2. Auto-scaling

```bash
# Apply HPA
kubectl apply -f k8s/overlays/prod/hpa.yaml -n neurocred-prod
```

## Backup and Recovery

### 1. Database Backup

```bash
# Manual backup
kubectl exec -it <postgres-pod> -n neurocred-prod -- pg_dump -U neurocred neurocred > backup.sql

# Automated backups (via CronJob)
kubectl apply -f k8s/overlays/prod/backup-cronjob.yaml -n neurocred-prod
```

### 2. Restore Database

```bash
kubectl exec -i <postgres-pod> -n neurocred-prod -- psql -U neurocred neurocred < backup.sql
```

## Troubleshooting

### Common Issues

1. **Pods not starting**: Check resource limits and secrets
2. **Database connection errors**: Verify credentials and network policies
3. **High latency**: Check resource usage and scaling
4. **Certificate issues**: Verify Cert-Manager and DNS configuration

### Debug Commands

```bash
# Describe pod
kubectl describe pod <pod-name> -n neurocred-prod

# Check events
kubectl get events -n neurocred-prod --sort-by='.lastTimestamp'

# Port forward for debugging
kubectl port-forward deployment/backend 8000:8000 -n neurocred-prod
```

