#!/bin/bash
set -e
cd /var/www/journalapp
git pull
npm install --production
npm run build
bash scripts/migrate.sh
#systemctl  restart journalapp
echo "Deployed!"
