#!/bin/bash
echo "Startar utvecklingsservern..."
cd /workspace || exit 1
# Start the dev server and mirror logs to server.log
npm run dev 2>&1 | tee /workspace/server.log
