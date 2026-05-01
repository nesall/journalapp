@echo off
setlocal enabledelayedexpansion

set DB_URL=%DATABASE_URL%
if "%DB_URL%"=="" set DB_URL=postgresql://journalapp_user:password@localhost/journalapp

for %%f in (migrations\*.sql) do (
    set "version=%%~nf"
    echo Checking !version!...

    psql --dbname="%DB_URL%" -t -A -c "SELECT COUNT(*) FROM schema_migrations WHERE version='!version!';" > tmp.txt 2>err.txt

    if errorlevel 1 (
        echo ERROR querying schema_migrations for !version!
        type err.txt
        exit /b 1
    )

    set /p applied=<tmp.txt
    set applied=!applied: =!
    del tmp.txt
    del err.txt

    if "!applied!"=="0" (
        echo Applying !version!...
        psql --dbname="%DB_URL%" -f "%%f"
        psql --dbname="%DB_URL%" -c "INSERT INTO schema_migrations(version) VALUES('!version!');"
        echo Done: !version!
    ) else (
        echo Skipping !version! ^(already applied^)
    )
)

echo All migrations applied.