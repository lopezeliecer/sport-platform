# API Gateway Metrics

Production-grade Prometheus metrics for monitoring and observability.

## Quick Start

### Access Metrics

```bash
curl http://localhost:3000/api/v1/gateway/metrics
```

### Configure Prometheus

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'api-gateway'
    scrape_interval: 15s
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/v1/gateway/metrics'
```

## Available Metrics

### HTTP Request Metrics

```prometheus
# Total requests
api_gateway_http_requests_total{method, route, status_code, service}

# Request duration (P50, P95, P99)
api_gateway_http_request_duration_ms{method, route, service}

# Error tracking
api_gateway_http_request_errors_total{method, route, error_type, service}
```

### Circuit Breaker Metrics

```prometheus
# State: 0=CLOSED, 1=HALF_OPEN, 2=OPEN
api_gateway_circuit_breaker_state{service}

# Trip counter
api_gateway_circuit_breaker_trips_total{service}
```

### Service Health Metrics

```prometheus
# Health: 0=DOWN, 1=DEGRADED, 2=UP
api_gateway_service_health{service}

# Active concurrent requests
api_gateway_active_requests{service}
```

### Node.js Metrics (30+)

- CPU usage
- Memory consumption
- Event loop lag
- Active handles
- GC statistics
- And more...

## Grafana Queries

### Request Rate by Service

```promql
rate(api_gateway_http_requests_total[5m])
```

### P95 Response Time

```promql
histogram_quantile(0.95,
  rate(api_gateway_http_request_duration_ms_bucket[5m])
)
```

### Error Rate

```promql
rate(api_gateway_http_request_errors_total[5m])
```

### Circuit Breaker Status

```promql
api_gateway_circuit_breaker_state
```

## Alerting Examples

### High Error Rate

```yaml
- alert: HighErrorRate
  expr: rate(api_gateway_http_request_errors_total[5m]) > 10
  for: 2m
  labels:
    severity: warning
```

### Circuit Breaker Open

```yaml
- alert: CircuitBreakerOpen
  expr: api_gateway_circuit_breaker_state == 2
  for: 1m
  labels:
    severity: critical
```

### Service Down

```yaml
- alert: ServiceDown
  expr: api_gateway_service_health == 0
  for: 3m
  labels:
    severity: critical
```

## Performance Impact

- **Memory:** ~10-20MB for histogram buckets
- **CPU:** <1% overhead
- **Network:** ~50KB per scrape (~10KB gzip)

## Documentation

For complete implementation details, see:

- [Phase 2.5 Summary](../../docs/phase-2.5-metrics-monitoring-summary.md)
- [API Gateway Roadmap](../../docs/prompt-10/API_GATEWAY_IMPLEMENTATION_ROADMAP.md)

## Related Endpoints

- `GET /api/v1/gateway/health` - Gateway health check
- `GET /api/v1/gateway/services/health` - All services health
- `GET /api/v1/gateway/circuit-breakers` - Circuit breaker states
- `GET /api/v1/gateway/metrics` - **Prometheus metrics**
