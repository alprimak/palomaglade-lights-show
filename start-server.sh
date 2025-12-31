#!/bin/bash

# Palomaglade Christmas Lights Show - Start Script
# Run this to start the streaming server

echo "Starting Palomaglade Christmas Lights Show Server..."
echo ""

# Check if snapserver is installed
if ! command -v snapserver &> /dev/null; then
    echo "ERROR: snapserver is not installed!"
    echo "Please run: sudo apt install snapserver"
    exit 1
fi

# Check if nginx is running
if systemctl is-active --quiet nginx; then
    echo "✓ Nginx is running"
else
    echo "Starting nginx..."
    sudo systemctl start nginx
fi

# Check snapserver status
if systemctl is-active --quiet snapserver; then
    echo "✓ Snapserver is running"
else
    echo "Starting snapserver..."
    sudo systemctl start snapserver
fi

echo ""
echo "=========================================="
echo "  Palomaglade Christmas Lights Show"
echo "=========================================="
echo ""
echo "Server Status:"
echo "  Web Interface: http://$(hostname -I | awk '{print $1}')"
echo "  Snapcast Port: 1780"
echo "  Stream Input:  TCP port 4953"
echo ""
echo "Tell your neighbor to run this on Windows:"
echo "  ffmpeg -f dshow -i audio=\"Stereo Mix\" -acodec pcm_s16le -ar 48000 -ac 2 -f wav tcp://$(hostname -I | awk '{print $1}'):4953"
echo ""
echo "Press Ctrl+C to stop monitoring"
echo ""

# Monitor logs
sudo journalctl -u snapserver -f
