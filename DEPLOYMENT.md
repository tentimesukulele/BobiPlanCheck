# BobiPlan Production Deployment Guide

## Server Setup for bobeki.anglezko.eu

### Prerequisites

1. **Linux Server** (Ubuntu 20.04+ recommended)
2. **Node.js 18+** and npm
3. **MySQL 8.0+**
4. **Nginx** (for reverse proxy)
5. **SSL Certificate** (Let's Encrypt recommended)
6. **Domain DNS** pointing to your server IP

### 1. Server Environment Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL
sudo apt install -y mysql-server
sudo mysql_secure_installation

# Install Nginx
sudo apt install -y nginx

# Install PM2 for process management
sudo npm install -g pm2
```

### 2. MySQL Database Setup

```bash
# Login to MySQL
sudo mysql -u root -p

# Create database and user
CREATE DATABASE bobiplan;
CREATE USER 'bobiplan_user'@'localhost' IDENTIFIED BY 'your_secure_password_here';
GRANT ALL PRIVILEGES ON bobiplan.* TO 'bobiplan_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Deploy Application Code

```bash
# Create application directory
sudo mkdir -p /var/www/bobiplan
sudo chown $USER:$USER /var/www/bobiplan

# Clone or upload your code
cd /var/www/bobiplan
# Upload your server folder contents here

# Install dependencies
cd server
npm install --production

# Copy and configure environment
cp .env.example .env
```

### 4. Configure Environment Variables

Edit `/var/www/bobiplan/server/.env`:

```bash
# Server Configuration
PORT=3000
NODE_ENV=production
DOMAIN=bobeki.anglezko.eu

# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=bobiplan
DB_USER=bobiplan_user
DB_PASSWORD=your_secure_password_here

# JWT Configuration (generate a secure 256-bit key)
JWT_SECRET=your-super-secure-jwt-secret-key-here-64-characters-minimum
JWT_EXPIRES_IN=24h

# Expo Push Notifications
EXPO_ACCESS_TOKEN=your_expo_access_token_from_expo_dev

# CORS Configuration
CORS_ORIGIN=https://bobeki.anglezko.eu,exp://192.168.1.100:8081

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info

# File Upload
UPLOAD_MAX_SIZE=5242880
UPLOAD_DEST=./uploads
```

### 5. Initialize Database

```bash
# Run database setup
npm run setup:no-seed  # Without sample data
# OR
npm run setup         # With sample family data
```

### 6. Configure PM2

Create `/var/www/bobiplan/server/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'bobiplan-api',
    script: './src/server.js',
    cwd: '/var/www/bobiplan/server',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max_old_space_size=1024'
  }]
};
```

### 7. Start Application with PM2

```bash
# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions provided by the command above
```

### 8. Configure Nginx Reverse Proxy

Create `/etc/nginx/sites-available/bobiplan`:

```nginx
server {
    listen 80;
    server_name bobeki.anglezko.eu;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name bobeki.anglezko.eu;

    # SSL configuration (update paths after obtaining certificates)
    ssl_certificate /etc/letsencrypt/live/bobeki.anglezko.eu/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bobeki.anglezko.eu/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # API routes
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Root endpoint
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 9. Enable Site and Obtain SSL Certificate

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/bobiplan /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration

# Install Certbot for Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d bobeki.anglezko.eu

# Test auto-renewal
sudo certbot renew --dry-run

# Restart services
sudo systemctl restart nginx
pm2 restart all
```

### 10. Firewall Configuration

```bash
# Configure UFW
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh
sudo ufw --force enable
sudo ufw status
```

### 11. Monitoring and Maintenance

```bash
# Monitor PM2 processes
pm2 monit
pm2 logs bobiplan-api

# Check Nginx status
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log

# Database backup script
#!/bin/bash
# /home/ubuntu/backup-db.sh
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
mysqldump -u bobiplan_user -p'your_secure_password_here' bobiplan > $BACKUP_DIR/bobiplan_$DATE.sql
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete  # Keep 7 days
```

### 12. Testing Production Deployment

```bash
# Test health endpoint
curl https://bobeki.anglezko.eu/health

# Test API endpoints
curl https://bobeki.anglezko.eu/api/family

# Monitor logs
pm2 logs bobiplan-api --lines 50
```

## Mobile App Configuration

### Update Expo Configuration

1. **Update `app.json`** with production build settings
2. **Configure EAS Build** for iOS distribution
3. **Update API endpoints** in `src/config/api.ts` (already configured)
4. **Test push notifications** with production server

### TestFlight Deployment

```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Configure build
eas build:configure

# Build for iOS
eas build --platform ios --profile production

# Submit to App Store Connect
eas submit --platform ios
```

## Security Checklist

- ✅ Strong database passwords
- ✅ JWT secrets properly generated
- ✅ HTTPS with valid SSL certificates
- ✅ Rate limiting configured
- ✅ Security headers enabled
- ✅ Firewall properly configured
- ✅ Regular database backups
- ✅ PM2 process monitoring
- ✅ Log rotation configured

## Troubleshooting

### Common Issues

1. **502 Bad Gateway**: Check if Node.js app is running (`pm2 status`)
2. **Database connection errors**: Verify MySQL credentials and service status
3. **SSL certificate issues**: Check certificate renewal and Nginx configuration
4. **High memory usage**: Monitor with `pm2 monit` and adjust PM2 settings

### Support Commands

```bash
# Restart everything
sudo systemctl restart mysql nginx
pm2 restart all

# Check service status
sudo systemctl status mysql nginx
pm2 status

# View logs
pm2 logs bobiplan-api
sudo tail -f /var/log/nginx/access.log
tail -f /var/www/bobiplan/server/logs/combined.log
```

## Maintenance Schedule

- **Daily**: Monitor logs and server resources
- **Weekly**: Check SSL certificate status and database performance
- **Monthly**: Update system packages and review security logs
- **Quarterly**: Review and rotate JWT secrets, backup retention policies