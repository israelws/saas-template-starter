#!/bin/bash

echo "Starting Admin Dashboard Frontend..."
echo "=================================="

# Clean any stale builds
echo "Cleaning stale builds..."
rm -rf .next

# Start the dev server
echo "Starting development server..."
npm run dev