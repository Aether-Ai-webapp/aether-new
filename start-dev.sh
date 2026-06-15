#!/bin/bash
export NODE_OPTIONS='--max-old-space-size=512'
cd /home/z/my-project
exec node node_modules/.bin/next dev -p 3000 -H 0.0.0.0
