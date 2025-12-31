# LinkedIn Post Draft

---

**How I Built a Synchronized Christmas Lights Show for Our Neighborhood**

This holiday season, I helped create something special for our Tampa community: a synchronized Christmas lights show where visitors can tune in on their smartphones to hear music perfectly matched to the dancing lights.

**The Challenge**

Traditional FM transmitters are limited to 200 feet by FCC regulations and require visitors to tune their car radios. We wanted something more accessible - just scan a QR code and you're in.

**The Solution**

I built a streaming infrastructure using:
- **Snapcast** for sub-second audio synchronization across all devices
- **Nginx** as a reverse proxy with WebSocket support
- **FFmpeg** streaming from the Windows PC running LightORama
- A festive **web interface** with falling snowflakes

Visitors simply go to palomaglade.com, tap Play, and experience the show.

**Engineering Lessons Learned**

The most interesting challenge came after launch. Under heavy mobile traffic, our Snapcast server would occasionally become unresponsive. Instead of accepting "just restart it," we investigated:

1. **Root cause**: WebSocket sessions from mobile browsers weren't closing cleanly
2. **Symptom**: Server hung during graceful shutdown (90 second timeout!)
3. **Solution**: Implemented health monitoring with automatic recovery

We tuned the audio buffer from 1000ms down to 400ms - finding the sweet spot between latency and audio quality. Lower caused artifacts; higher made the lights feel delayed.

**By the Numbers**
- Running since November 24th
- ~300+ unique visitors over the season
- 74% on iPhones (makes sense - people tune in from their cars)
- Uptime improved from manual restarts to fully automated recovery

**Open Source**

I've published the complete solution on GitHub so other neighborhoods can build their own: [link to repo]

The infrastructure cost? Just an old laptop running Ubuntu.

**Inspiration**

While we're nowhere near the Guinness World Record holder (ERDAJT in LaGrange, NY with 738,652 lights!), we've created something our community loves. Sometimes the best engineering is the kind that brings people together.

Happy holidays from Tampa!

#Christmas #Engineering #OpenSource #IoT #AudioStreaming #Community #Tampa

---

## Suggested Image/Video

Consider posting with:
1. A video of the light show with music
2. A screenshot of the web player on a phone
3. The architecture diagram from the README

## References

- ERDAJT World Record: https://hudsonvalleycountry.com/erdajt-light-display-2025-returns/
- Bluebonnet Lights (similar neighborhood project): https://www.bluebonnetlights.com/
