#!/bin/bash
# Snapserver Health Check and Auto-Recovery Script
# Run via cron every minute: * * * * * /home/alprimak/Projects/palomaglade-lights-show/snapserver-health.sh

LOG_FILE="/var/log/snapserver-health.log"
MAX_LOG_SIZE=1048576  # 1MB

# Rotate log if too large
if [ -f "$LOG_FILE" ] && [ $(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE" 2>/dev/null) -gt $MAX_LOG_SIZE ]; then
    mv "$LOG_FILE" "$LOG_FILE.old"
fi

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Check if snapserver process is running
if ! pgrep -x snapserver > /dev/null; then
    log "CRITICAL: snapserver process not found, attempting restart..."
    sudo systemctl restart snapserver
    sleep 2
    if pgrep -x snapserver > /dev/null; then
        log "SUCCESS: snapserver restarted successfully"
    else
        log "FAILED: Could not restart snapserver"
    fi
    exit 1
fi

# Check if HTTP port 1780 is responding
HTTP_CHECK=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://127.0.0.1:1780/ 2>/dev/null)
if [ "$HTTP_CHECK" != "200" ] && [ "$HTTP_CHECK" != "101" ]; then
    log "WARNING: HTTP port 1780 not responding (code: $HTTP_CHECK)"
fi

# Check if TCP port 4953 (audio input) is listening
if ! ss -tln | grep -q ":4953 "; then
    log "CRITICAL: TCP port 4953 not listening, attempting restart..."
    sudo systemctl restart snapserver
    sleep 2
    if ss -tln | grep -q ":4953 "; then
        log "SUCCESS: Port 4953 now listening after restart"
    else
        log "FAILED: Port 4953 still not listening"
    fi
    exit 1
fi

# Check JSON-RPC is responding (actual health check)
JSONRPC_CHECK=$(curl -s --max-time 5 -X POST -H "Content-Type: application/json" \
    -d '{"id":1,"jsonrpc":"2.0","method":"Server.GetStatus"}' \
    http://127.0.0.1:1780/jsonrpc 2>/dev/null)

if [ -z "$JSONRPC_CHECK" ]; then
    log "CRITICAL: JSON-RPC not responding, server may be hung. Force restarting..."
    # Kill any hung processes first
    sudo pkill -9 snapserver 2>/dev/null
    sleep 1
    sudo systemctl start snapserver
    sleep 2
    if pgrep -x snapserver > /dev/null; then
        log "SUCCESS: snapserver force-restarted successfully"
    else
        log "FAILED: Could not force-restart snapserver"
    fi
    exit 1
fi

# Optional: Log status periodically (every 10 minutes based on minute)
MINUTE=$(date +%M)
if [ "$((MINUTE % 10))" -eq "0" ]; then
    CLIENTS=$(echo "$JSONRPC_CHECK" | grep -o '"connected":[^,]*' | head -1)
    log "STATUS: snapserver healthy, $CLIENTS"
fi

exit 0
