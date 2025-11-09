#!/bin/bash
# TechTorio Backend Deployment Script with CORS Fix

echo "=== Stopping TechTorio Backend Service ===\"
sudo systemctl stop techtorio-backend

echo "=== Deploying Updated Files ==="
# The files will be copied by SCP from local machine

echo "=== Restarting TechTorio Backend Service ==="
sudo systemctl start techtorio-backend

echo "=== Checking Service Status ==="
sudo systemctl status techtorio-backend --no-pager

echo "=== Deployment Complete ==="
