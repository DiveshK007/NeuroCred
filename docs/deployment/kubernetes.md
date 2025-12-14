# Kubernetes Deployment Guide

## Prerequisites

- Kubernetes cluster (v1.24+)
- kubectl configured
- Helm 3.0+ (optional)
- Docker registry access

## Quick Start

### 1. Apply Base Manifests

```bash
kubectl apply -f k8s/base/ -n neurocred-prod
```

### 2. Apply Environment Overlay

```bash
kubectl apply -k k8s/overlays/prod/ -n neurocred-prod
```

### 3. Verify Deployment

```bash
kubectl get all -n neurocred-prod
```

## Manual Deployment

### 1. Create Namespace

```bash
kubectl create namespace neurocred-prod
```

### 2. Create Secrets

```bash
# Database
kubectl create secret generic postgres-secret \
  --from-literal=username=neurocred \
  --from-literal=password=<password> \
  -n neurocred-prod

# Redis
kubectl create secret generic redis-secret \
  --from-literal=password=<password> \
  -n neurocred-prod

# API
kubectl create secret generic api-secrets \
  --from-literal=jwt-secret=<secret> \
  --from-literal=sentry-dsn=<dsn> \
  -n neurocred-prod
```

### 3. Create ConfigMap

```bash
kubectl apply -f k8s/base/configmap.yaml -n neurocred-prod
```

### 4. Deploy Applications

```bash
# Backend
kubectl apply -f k8s/base/backend-deployment.yaml -n neurocred-prod
kubectl apply -f k8s/base/backend-service.yaml -n neurocred-prod

# Frontend
kubectl apply -f k8s/base/frontend-deployment.yaml -n neurocred-prod
kubectl apply -f k8s/base/frontend-service.yaml -n neurocred-prod

# Workers
kubectl apply -f k8s/base/worker-deployment.yaml -n neurocred-prod
```

### 5. Deploy Ingress

```bash
kubectl apply -f k8s/base/ingress.yaml -n neurocred-prod
```

## Using Kustomize

### 1. Base Configuration

```bash
kubectl apply -k k8s/base/
```

### 2. Environment-Specific

```bash
# Development
kubectl apply -k k8s/overlays/dev/

# Staging
kubectl apply -k k8s/overlays/staging/

# Production
kubectl apply -k k8s/overlays/prod/
```

## Resource Management

### Resource Requests and Limits

```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "2Gi"
    cpu: "2000m"
```

### Horizontal Pod Autoscaling

```bash
kubectl apply -f k8s/base/hpa.yaml -n neurocred-prod
```

## Database Setup

### External Database

If using managed PostgreSQL:

```yaml
# Update ConfigMap with external database URL
DATABASE_URL: postgresql://user:pass@host:5432/neurocred
```

### Internal Database (StatefulSet)

```bash
kubectl apply -f k8s/base/postgres-statefulset.yaml -n neurocred-prod
```

## Monitoring

### ServiceMonitor (Prometheus)

```bash
kubectl apply -f k8s/monitoring/servicemonitor.yaml -n neurocred-prod
```

### Grafana Dashboards

```bash
kubectl apply -f k8s/monitoring/grafana-dashboard.yaml -n neurocred-prod
```

## SSL/TLS

### Cert-Manager

```bash
# Install Cert-Manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create ClusterIssuer
kubectl apply -f k8s/base/cluster-issuer.yaml

# Certificate is automatically created by ingress
```

## Updates and Rollouts

### Rolling Update

```bash
# Update image
kubectl set image deployment/backend backend=neurocred/backend:v1.1.0 -n neurocred-prod

# Monitor rollout
kubectl rollout status deployment/backend -n neurocred-prod
```

### Rollback

```bash
kubectl rollout undo deployment/backend -n neurocred-prod
```

## Troubleshooting

### Check Pod Status

```bash
kubectl get pods -n neurocred-prod
kubectl describe pod <pod-name> -n neurocred-prod
```

### View Logs

```bash
kubectl logs -f deployment/backend -n neurocred-prod
kubectl logs -f deployment/frontend -n neurocred-prod
```

### Debug Container

```bash
kubectl exec -it deployment/backend -n neurocred-prod -- bash
```

### Check Events

```bash
kubectl get events -n neurocred-prod --sort-by='.lastTimestamp'
```

## Scaling

### Manual Scaling

```bash
kubectl scale deployment/backend --replicas=5 -n neurocred-prod
```

### Auto-scaling

```bash
# Apply HPA
kubectl apply -f k8s/base/hpa.yaml -n neurocred-prod

# Check HPA status
kubectl get hpa -n neurocred-prod
```

## Backup and Restore

### Database Backup

```bash
# Create backup job
kubectl apply -f k8s/base/backup-job.yaml -n neurocred-prod

# Manual backup
kubectl exec -it <postgres-pod> -n neurocred-prod -- \
  pg_dump -U neurocred neurocred > backup.sql
```

### Restore Database

```bash
kubectl exec -i <postgres-pod> -n neurocred-prod -- \
  psql -U neurocred neurocred < backup.sql
```

