#!/bin/bash

# Script untuk generate random secrets untuk production

echo "=================================="
echo "Security Keys Generator"
echo "=================================="
echo ""

echo "JWT_SECRET:"
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

echo ""
echo "SESSION_SECRET:"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

echo ""
echo "Copy secrets di atas ke file .env Anda"
echo "=================================="
