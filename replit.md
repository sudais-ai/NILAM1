# NIL WhatsApp Bot

## Overview
This is a WhatsApp bot built with Baileys that provides media downloading capabilities and interactive features. The bot responds to commands for downloading YouTube audio/video, Instagram content, creating stickers, and serving phonk music tracks.

## Project Type
- **Application Type**: WhatsApp Bot (Console/CLI Application)
- **Language**: Node.js (CommonJS)
- **Main File**: index.js
- **Framework**: @whiskeysockets/baileys (WhatsApp Web API)

## Core Features
1. **Media Downloads**:
   - YouTube audio (.play, .song)
   - YouTube video (.video, .yt)
   - Instagram content (.ig)

2. **Sticker Creation**: Convert images to WhatsApp stickers (.sticker)

3. **Phonk Music**: 100 curated phonk tracks (.nil1 to .nil100)

4. **Auto Responses**: Voice greetings for hi/hello

5. **Group Features**: Auto-typing mode (.autotyping)

## Dependencies
- @whiskeysockets/baileys - WhatsApp Web API
- @distube/ytdl-core, ytdl-core - YouTube downloading
- play-dl - Audio/video streaming
- yt-search - YouTube search
- instagram-url-direct - Instagram downloader
- sharp - Image processing for stickers
- qrcode-terminal - QR code display for authentication
- axios - HTTP requests

## Directory Structure
- `/session` - WhatsApp authentication session data
- `/temp` - Temporary files for processing
- `/cache` - Cache storage
- `/media` - Media files
- `/downloads` - Downloaded content
- `/voices` - Voice message files
- `/phonk` - Phonk music cache

## Bot Configuration
- Prefix: `.` (dot)
- Mode: Public (responds to all users)
- Commands are case-insensitive

## Setup Notes
- Bot requires QR code scan on first run to authenticate with WhatsApp
- Session data is stored in `/session` directory for persistence
- Downloads are cached to improve performance
- Requires active internet connection

## Recent Changes
- 2025-10-07: Initial import and Replit environment setup
  - Installed Node.js 20 and Python 3.11
  - Configured npm dependencies
  - Set up WhatsApp bot workflow
  - Installed ffmpeg for media processing
  
- 2025-10-07: Bot improvements and fixes
  - ✅ Redesigned menu with "THE LORD NIL" branding and professional borders
  - ✅ Fixed Instagram downloader (.ig) - now properly detects videos vs images
  - ✅ Fixed hi/hello audio response - sends only one playable audio
  - ✅ Added 10 sound effect triggers (woow, mm, hahaha, nil, yep, mum, gambare, oh, paak, ummm)

## Replit Setup
- **Languages Installed**: Node.js 20, Python 3.11
- **System Packages**: ffmpeg (for media processing)
- **Workflow**: WhatsApp Bot runs via `node index.js`
- **Port**: Console application (no web server)
- **Authentication**: Requires QR code scan on first run (displayed in console)

## Architecture
- Event-driven architecture using Baileys WebSocket connection
- Message handler with command parser
- File-based caching for downloaded media
- Auto-reconnection on connection loss

## How to Run
1. Start the workflow/run the bot
2. Scan the QR code displayed in the console with WhatsApp mobile app
3. Bot will connect and start responding to commands
4. Session is saved for future runs
