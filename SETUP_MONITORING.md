# Snapserver Monitoring Setup

## Problem Diagnosis

The snapserver becomes unresponsive due to:

1. **Graceful shutdown hangs**: When stopped, snapserver takes 90 seconds to terminate
   because it waits for WebSocket sessions to close gracefully, but they don't.

2. **Port binding race**: After force-kill, ports stay in TIME_WAIT state, causing
   "Address already in use" errors on quick restarts.

3. **WebSocket session accumulation**: Many browser connections disconnect abruptly,
   piling up "End of file" errors that may overwhelm the server.

## Solution: 3-Part Fix

### Part 1: Install Systemd Override (faster restarts)

```bash
sudo mkdir -p /etc/systemd/system/snapserver.service.d
sudo cp ~/Projects/palomaglade-lights-show/snapserver-override.conf /etc/systemd/system/snapserver.service.d/override.conf
sudo systemctl daemon-reload
sudo systemctl restart snapserver
```

This reduces shutdown timeout from 90s to 10s and enables automatic restart.

### Part 2: Install Cron Health Check (auto-recovery)

```bash
# Edit crontab
crontab -e

# Add this line (runs every minute):
* * * * * /home/alprimak/Projects/palomaglade-lights-show/snapserver-health.sh

# Make sure the log file is writable
sudo touch /var/log/snapserver-health.log
sudo chown $USER:$USER /var/log/snapserver-health.log
```

### Part 3: Quick Manual Commands

When server is stuck, use these:

```bash
# Force restart (recommended)
sudo pkill -9 snapserver && sleep 1 && sudo systemctl start snapserver

# Check health
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"id":1,"jsonrpc":"2.0","method":"Server.GetStatus"}' \
  http://127.0.0.1:1780/jsonrpc | jq .

# View health check log
tail -f /var/log/snapserver-health.log

# Check recent errors
journalctl -u snapserver --since "10 minutes ago" | grep -i error
```

## Monitoring Commands

```bash
# Live process stats
watch -n 1 'ps aux | grep snapserver | grep -v grep'

# Port status
ss -tlnp | grep -E "(1704|4953|1780)"

# WebSocket connections
ss -tn | grep 1780 | wc -l

# Memory usage
systemctl status snapserver | grep Memory
```
