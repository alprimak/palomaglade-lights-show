// Palomaglade Christmas Lights Show - Audio Streaming Client

class ChristmasAudioPlayer {
    constructor() {
        this.snapcastHost = window.location.hostname;
        this.snapcastPort = 1780;
        this.isPlaying = false;
        this.snapcast = null;
        this.audioContext = null;

        this.playButton = document.getElementById('playButton');
        this.playIcon = document.querySelector('.play-icon');
        this.pauseIcon = document.querySelector('.pause-icon');
        this.statusDot = document.querySelector('.status-dot');
        this.statusText = document.querySelector('.status-text');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.visualizer = document.querySelector('.audio-visualizer');

        this.init();
    }

    async init() {
        this.playButton.addEventListener('click', () => this.togglePlay());
        this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));

        // Try to connect to Snapcast server
        await this.connectToSnapcast();
    }

    async connectToSnapcast() {
        this.updateStatus('connecting', 'Connecting to stream...');

        try {
            // Test connection via WebSocket
            const wsUrl = `ws://${this.snapcastHost}:${this.snapcastPort}/jsonrpc`;

            await new Promise((resolve, reject) => {
                const testWs = new WebSocket(wsUrl);
                const timeout = setTimeout(() => {
                    testWs.close();
                    reject(new Error('Connection timeout'));
                }, 5000);

                testWs.onopen = () => {
                    clearTimeout(timeout);
                    testWs.close();
                    resolve();
                };

                testWs.onerror = () => {
                    clearTimeout(timeout);
                    reject(new Error('WebSocket error'));
                };
            });

            this.updateStatus('ready', 'Ready to play');
            this.playButton.disabled = false;

        } catch (error) {
            console.error('Connection error:', error);
            this.updateStatus('error', 'Stream offline - Show starts at 6 PM');

            // Retry connection every 10 seconds
            setTimeout(() => this.connectToSnapcast(), 10000);
        }
    }

    async togglePlay() {
        if (this.isPlaying) {
            this.stop();
        } else {
            await this.play();
        }
    }

    async play() {
        try {
            // Initialize audio context (must be done after user interaction)
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            // Resume audio context if suspended
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            // Connect to Snapcast stream via WebSocket
            await this.connectSnapcastStream();

            this.isPlaying = true;
            this.updateUI();
            this.updateStatus('playing', 'Now Playing');
            this.visualizer.classList.add('visualizer-active');

        } catch (error) {
            console.error('Playback error:', error);
            this.updateStatus('error', 'Playback failed - try again');
        }
    }

    async connectSnapcastStream() {
        return new Promise((resolve, reject) => {
            const wsUrl = `ws://${this.snapcastHost}:${this.snapcastPort}/jsonrpc`;

            if (this.ws) {
                this.ws.close();
            }

            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log('WebSocket connected');

                // Request to start streaming
                const request = {
                    id: 1,
                    jsonrpc: '2.0',
                    method: 'Server.GetStatus'
                };
                this.ws.send(JSON.stringify(request));

                // Start audio element for streaming
                this.startAudioStream();
                resolve();
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                reject(error);
            };

            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log('Snapcast message:', data);
            };

            this.ws.onclose = () => {
                console.log('WebSocket closed');
                if (this.isPlaying) {
                    this.updateStatus('error', 'Connection lost - reconnecting...');
                    setTimeout(() => this.play(), 3000);
                }
            };
        });
    }

    startAudioStream() {
        // Create or reuse audio element for HTTP stream
        if (!this.audioElement) {
            this.audioElement = new Audio();
            this.audioElement.crossOrigin = 'anonymous';
        }

        // Snapcast HTTP stream endpoint
        this.audioElement.src = `http://${this.snapcastHost}:${this.snapcastPort}/stream`;
        this.audioElement.volume = this.volumeSlider.value / 100;

        this.audioElement.play().catch(error => {
            console.log('Audio play failed, trying alternate method:', error);
            // Fallback: direct connection might work better
            this.tryAlternateStream();
        });

        this.audioElement.onerror = () => {
            console.log('Audio stream error, trying alternate method');
            this.tryAlternateStream();
        };
    }

    tryAlternateStream() {
        // Try direct PCM stream if available
        if (!this.pcmAudio) {
            this.pcmAudio = new Audio();
        }

        // Some setups may have a direct stream endpoint
        this.pcmAudio.src = `http://${this.snapcastHost}:${this.snapcastPort}/stream.wav`;
        this.pcmAudio.volume = this.volumeSlider.value / 100;
        this.pcmAudio.play().catch(e => console.log('Alternate stream also failed:', e));
    }

    stop() {
        this.isPlaying = false;

        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.src = '';
        }

        if (this.pcmAudio) {
            this.pcmAudio.pause();
            this.pcmAudio.src = '';
        }

        if (this.ws) {
            this.ws.close();
        }

        this.updateUI();
        this.updateStatus('ready', 'Ready to play');
        this.visualizer.classList.remove('visualizer-active');
    }

    setVolume(value) {
        const volume = value / 100;

        if (this.audioElement) {
            this.audioElement.volume = volume;
        }
        if (this.pcmAudio) {
            this.pcmAudio.volume = volume;
        }
    }

    updateUI() {
        if (this.isPlaying) {
            this.playIcon.style.display = 'none';
            this.pauseIcon.style.display = 'block';
        } else {
            this.playIcon.style.display = 'block';
            this.pauseIcon.style.display = 'none';
        }
    }

    updateStatus(state, text) {
        this.statusText.textContent = text;
        this.statusDot.className = 'status-dot';

        switch (state) {
            case 'connecting':
                // Default orange pulse
                break;
            case 'ready':
            case 'connected':
                this.statusDot.classList.add('connected');
                break;
            case 'playing':
                this.statusDot.classList.add('playing');
                break;
            case 'error':
                this.statusDot.classList.add('error');
                break;
        }
    }
}

// Initialize player when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.christmasPlayer = new ChristmasAudioPlayer();
});

// Handle visibility changes to save battery
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.christmasPlayer && window.christmasPlayer.isPlaying) {
        // Keep playing in background - don't stop
        console.log('Page hidden, continuing playback');
    }
});
