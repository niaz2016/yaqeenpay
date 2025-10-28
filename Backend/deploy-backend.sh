#!/bin/bash
# YaqeenPay Backend Deployment Script with CORS Fix

echo "=== Stopping YaqeenPay Backend Service ===\"
sudo systemctl stop yaqeenpay-backend

echo "=== Deploying Updated Files ==="
# The files will be copied by SCP from local machine

echo "=== Restarting YaqeenPay Backend Service ==="
sudo systemctl start yaqeenpay-backend

echo "=== Checking Service Status ==="
sudo systemctl status yaqeenpay-backend --no-pager

echo "=== Deployment Complete ==="
