#!/bin/sh
set -e

if [ "$ENABLE_SSL" != "true" ]; then
  echo "ENABLE_SSL is not true — skipping certificate generation"
  exit 0
fi

DOMAIN="${DOMAIN:-futbol-olvidable.archsys.com}"
EMAIL="${CERTBOT_EMAIL:-admin@$DOMAIN}"

echo "Requesting Let's Encrypt certificate for $DOMAIN..."

certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  --non-interactive \
  -d "$DOMAIN" || {
    echo "Certificate request failed (domain may not point here yet). Continuing..."
    exit 0
  }

echo "Certificate obtained for $DOMAIN"
exit 0
