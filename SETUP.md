# Palomaglade Christmas Lights Show - Streaming Setup

## Step 1: Install Required Packages

Run these commands on your Ubuntu machine:

```bash
sudo apt update
sudo apt install -y ffmpeg snapserver snapclient nginx
```

## Step 2: Configure Snapcast Server

Copy the config file to the system location:

```bash
sudo cp ~/Projects/palomaglade-lights-show/snapserver.conf /etc/snapserver.conf
```

## Step 3: Set Up the Web Interface

```bash
sudo cp -r ~/Projects/palomaglade-lights-show/web/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html/
```

## Step 4: Configure Nginx

```bash
sudo cp ~/Projects/palomaglade-lights-show/nginx-palomaglade.conf /etc/nginx/sites-available/palomaglade
sudo ln -sf /etc/nginx/sites-available/palomaglade /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

## Step 5: Start Services

```bash
sudo systemctl enable snapserver
sudo systemctl start snapserver
sudo systemctl status snapserver
```

## Step 6: Open Firewall Ports (if using ufw)

```bash
sudo ufw allow 80/tcp      # Web interface
sudo ufw allow 1704/tcp    # Snapcast stream
sudo ufw allow 1705/tcp    # Snapcast control
sudo ufw allow 1780/tcp    # Snapcast HTTP/WebSocket
```

## Your Network Info

- **Your Server IP:** 192.168.68.66
- **Web Interface:** http://192.168.68.66
- **Snapcast Stream:** 192.168.68.66:1704

## For Your Neighbor's Windows PC

Have them run this FFmpeg command (replace YOUR_IP with 192.168.68.66):

```cmd
ffmpeg -f dshow -i audio="Stereo Mix" -acodec pcm_s16le -ar 48000 -ac 2 -f wav tcp://192.168.68.66:4953
```

Or if using WASAPI loopback:
```cmd
ffmpeg -f dshow -i audio="WASAPI" -acodec pcm_s16le -ar 48000 -ac 2 -f wav tcp://192.168.68.66:4953
```

To list available audio devices on Windows:
```cmd
ffmpeg -list_devices true -f dshow -i dummy
```
