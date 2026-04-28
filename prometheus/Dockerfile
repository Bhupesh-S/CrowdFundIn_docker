# Custom Prometheus image with config baked in.
# Eliminates bind mounts entirely — no host-path resolution issues
# when Jenkins uses the host Docker socket (Docker-in-Docker socket sharing).
FROM prom/prometheus:v2.52.0

COPY prometheus.yml /etc/prometheus/prometheus.yml
COPY alerts.yml     /etc/prometheus/alerts.yml
