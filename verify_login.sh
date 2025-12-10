#!/bin/bash
# Test tenant auth endpoint with spacing issues
curl -X POST http://localhost:3000/api/tenant/auth \
  -H "Content-Type: application/json" \
  -d '{"room_number": " 103 "}'
echo "\n"
