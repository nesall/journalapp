# Linux Commands Reference — JournalApp Deployment

## Service Management (systemd)

```bash
systemctl status journalapp          # Check if the app is running
systemctl start journalapp           # Start the app
systemctl stop journalapp            # Stop the app
systemctl restart journalapp         # Restart the app (required after deploy)
systemctl enable journalapp          # Auto-start on server reboot
systemctl daemon-reload              # Reload systemd after editing .service file
```

## Logs

```bash
journalctl -u journalapp -f          # Live log stream for the app (-f = follow)
journalctl -u journalapp -n 100      # Last 100 log lines
tail -f /var/log/apache2/journalapp-error.log   # Live Apache error log
tail -f /var/log/apache2/journalapp-access.log  # Live Apache access log
```

## Apache

```bash
systemctl status apache2             # Check Apache status
systemctl reload apache2             # Reload config without downtime
a2ensite journalapp.conf             # Enable a site config
a2dissite journalapp.conf            # Disable a site config
a2enmod proxy proxy_http headers     # Enable Apache modules
apache2ctl configtest                # Test Apache config for syntax errors
```

## PostgreSQL

```bash
sudo -u postgres psql                          # Open psql as postgres superuser
sudo -u postgres psql journalapp               # Open psql in journalapp database
sudo -u postgres psql -c "\l"                  # List all databases
sudo -u postgres psql journalapp -c "\dt"      # List all tables in journalapp
sudo -u postgres psql journalapp -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO journalapp_user;"
```

## File & Directory

```bash
ls -la                               # List files with permissions and hidden files
mkdir -p /var/www/journalapp/static/uploads   # Create directory (and parents)
chown -R arman:arman /var/www/journalapp      # Change ownership recursively
chmod +x scripts/deploy.sh           # Make a script executable
nano /etc/apache2/sites-available/journalapp.conf  # Edit a file
cat /etc/os-release                  # Show Linux distro info
```

## Networking

```bash
curl -s ifconfig.me                  # Get your public server IP
ss -tlnp | grep -E '80|443|3000'    # Show what's listening on specific ports
dig journal.phenixcode.com +short    # Check DNS resolution for a domain
```

## Process & System

```bash
ps aux | grep node                   # Find running Node processes
kill -9 <pid>                        # Force kill a process by PID
free -h                              # Show memory usage (human readable)
df -h                                # Show disk usage (human readable)
top                                  # Live process monitor (q to quit)
```

## Git

```bash
git clone https://github.com/...     # Clone a repository
git pull                             # Pull latest changes
git config pull.rebase false         # Set pull strategy to merge
git config --global --add safe.directory /var/www/journalapp  # Trust a directory
```

## Node / npm

```bash
node --version                       # Check Node version
npm --version                        # Check npm version
npm install                          # Install dependencies
npm run build                        # Build the SvelteKit app
```

## SSL / Certbot

```bash
certbot --apache -d journal.phenixcode.com    # Issue/reinstall SSL cert for domain
certbot renew --dry-run                        # Test cert auto-renewal
snap list | grep certbot                       # Check certbot version
```

## Sudoers

```bash
visudo -f /etc/sudoers.d/journalapp  # Safely edit sudoers for specific app
sudo -l -U arman                     # List sudo permissions for user arman
```

## Miscellaneous

```bash
which psql                           # Find full path of a command
export $(grep -v '^#' .env | xargs) # Load .env file into current shell session
sed -i 's/\r//' scripts/migrate.sh  # Fix Windows line endings (CRLF → LF)
```