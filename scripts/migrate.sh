#!/bin/bash
set -e

DB_URL=${DATABASE_URL:-"postgresql://journalapp_user:password@localhost/journalapp"}

for file in migrations/*.sql; do
    version=$(basename "$file" .sql)
    echo "Checking $version..."

    applied=$(psql "$DB_URL" -tAc "SELECT COUNT(*) FROM schema_migrations WHERE version='$version';")

    if [ "$applied" -eq 0 ]; then
        echo "Applying $version..."
        psql "$DB_URL" -f "$file"
        psql "$DB_URL" -c "INSERT INTO schema_migrations(version) VALUES('$version');"
        echo "Done: $version"
    else
        echo "Skipping $version (already applied)"
    fi
done

echo "All migrations applied."