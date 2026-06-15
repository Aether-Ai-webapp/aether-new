#!/bin/bash
cd /home/z/my-project
while true; do
  bun run dev &
  SERVER_PID=$!
  # Wait for the process to die
  wait $SERVER_PID 2>/dev/null
  echo "Server died, restarting in 2 seconds..." >> /home/z/my-project/dev.log
  sleep 2
done
