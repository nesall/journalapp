#!/bin/bash
set -e
cd /var/www/journalapp
git pull
npm install
npm run build
bash scripts/migrate.sh
sudo systemctl restart journalapp
echo "Deployed!"
