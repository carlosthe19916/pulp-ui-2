"""Pulp settings for local/CI e2e against the official pulp/pulp image.

Paths match the OpenAPI client used by pulp-ui-2 (`API_ROOT=/api/pulp/` with domains).
"""

SECRET_KEY = "e2e-secret-key-not-for-production"
CONTENT_ORIGIN = "http://localhost:8080"
CONTENT_PATH_PREFIX = "/api/pulp-content/"
API_ROOT = "/api/pulp/"
# DOMAIN_ENABLED is driven by the PULP_DOMAIN_ENABLED env var (see docker-compose.yml)
# so CI can test both modes; dynaconf merges PULP_-prefixed env vars over this file.
TOKEN_AUTH_DISABLED = True
ANALYTICS = False
ALLOWED_IMPORT_PATHS = ["/tmp"]
ALLOWED_EXPORT_PATHS = ["/tmp"]
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
