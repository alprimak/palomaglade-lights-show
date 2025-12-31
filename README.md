# Palomaglade Christmas Lights Show

A synchronized Christmas lights and audio streaming solution for neighborhood light shows. Visitors can tune in via their smartphones at [palomaglade.com](https://palomaglade.com) to hear music perfectly synced with the light display.

## Architecture

```
┌─────────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│   Windows PC        │     │    Ubuntu Server     │     │   Visitors' Phones  │
│   (Light Control)   │     │                      │     │                     │
│                     │     │  ┌────────────────┐  │     │  ┌───────────────┐  │
│  LightORama +       │────▶│  │  Snapserver    │──│────▶│  │   Snapweb     │  │
│  FFmpeg             │ TCP │  │  (Audio Sync)  │  │HTTPS│  │   Player      │  │
│                     │     │  └────────────────┘  │     │  └───────────────┘  │
│  Stereo Mix ──────────────▶     Port 4953       │     │                     │
│                     │     │  ┌────────────────┐  │     │  Browser-based     │
└─────────────────────┘     │  │    Nginx       │  │     │  synchronized      │
                            │  │  (Reverse Proxy│  │     │  audio playback    │
                            │  └────────────────┘  │     └─────────────────────┘
                            └──────────────────────┘
```

## Features

- **Sub-second audio synchronization** - Uses Snapcast for precise multi-device sync (~400ms latency)
- **Web-based player** - No app installation required, works on any smartphone browser
- **Christmas-themed UI** - Festive design with falling snowflakes animation
- **Auto-recovery monitoring** - Health check script with automatic restart on failure
- **HTTPS support** - Secure connections via Let's Encrypt

## Components

| Component | Purpose |
|-----------|---------|
| `snapserver.conf` | Snapcast server configuration with optimized buffer settings |
| `nginx-palomaglade.conf` | Nginx reverse proxy with WebSocket support |
| `web/index.html` | Christmas-themed landing page with embedded Snapweb player |
| `WINDOWS_SENDER.bat` | Windows batch script for FFmpeg audio streaming |
| `snapserver-health.sh` | Health monitoring and auto-restart script |
| `snapserver-override.conf` | Systemd service improvements for faster restarts |

## Quick Start

### 1. Server Setup (Ubuntu)

```bash
# Install dependencies
sudo apt update
sudo apt install -y snapserver nginx certbot python3-certbot-nginx

# Copy configuration files
sudo cp snapserver.conf /etc/snapserver.conf
sudo cp nginx-palomaglade.conf /etc/nginx/sites-available/palomaglade
sudo ln -sf /etc/nginx/sites-available/palomaglade /etc/nginx/sites-enabled/

# Deploy web interface
sudo cp -r web/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html/

# Start services
sudo systemctl enable snapserver nginx
sudo systemctl restart snapserver nginx

# Set up SSL (replace with your domain)
sudo certbot --nginx -d yourdomain.com
```

### 2. Windows Audio Sender

Copy `WINDOWS_SENDER.bat` to the PC running your light show software and run it. Make sure "Stereo Mix" is enabled in Windows sound settings.

### 3. Enable Monitoring (Recommended)

```bash
# Install systemd override for faster restarts
sudo mkdir -p /etc/systemd/system/snapserver.service.d
sudo cp snapserver-override.conf /etc/systemd/system/snapserver.service.d/override.conf
sudo systemctl daemon-reload

# Set up health check cron job
sudo touch /var/log/snapserver-health.log
sudo chown $USER:$USER /var/log/snapserver-health.log
(crontab -l 2>/dev/null; echo "* * * * * $(pwd)/snapserver-health.sh") | crontab -
```

## Technical Details

### Why Snapcast?

Traditional FM transmitters have limitations:
- FCC limits transmission to 200 feet
- Requires listeners to tune their car radio
- No way to reach people with phones

Snapcast provides:
- Internet-based streaming with precise synchronization
- Works on any device with a web browser
- No geographic limitations

### Buffer Optimization

After extensive testing, we settled on **400ms buffer**:
- Lower (200ms): Audio artifacts and dropouts
- Higher (1000ms): Noticeable delay vs lights
- 400ms: Sweet spot for quality and sync

### Auto-Recovery System

The health monitoring system addresses a known Snapcast issue where the server becomes unresponsive under heavy WebSocket session load:

1. **Problem**: WebSocket sessions from mobile browsers don't close cleanly
2. **Symptom**: Server stops accepting new audio input
3. **Solution**: Health script detects unresponsive JSON-RPC and force-restarts

## Ports

| Port | Service | Description |
|------|---------|-------------|
| 80 | HTTP | Redirects to HTTPS |
| 443 | HTTPS | Web interface |
| 1704 | Snapcast TCP | Native client streaming |
| 1780 | Snapcast HTTP | WebSocket for Snapweb |
| 4953 | Audio Input | Receives FFmpeg TCP stream |

## License

MIT License - Feel free to use this for your own neighborhood light show!

## Acknowledgments

- [Snapcast](https://github.com/badaix/snapcast) - Synchronous multiroom audio player
- [LightORama](https://www1.lightorama.com/) - Light show sequencing software
- Built with love in Tampa, FL
