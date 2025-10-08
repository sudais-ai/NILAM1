const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const yts = require('yt-search');
const ytdl = require('yt-dlp-exec');
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);
const axios = require('axios');
const { instagramGetUrl } = require('instagram-url-direct');
const sharp = require('sharp');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, downloadContentFromMessage } = require('@whiskeysockets/baileys');

// Bot Configuration
const BOT_CONFIG = {
    name: '🔥 NIL BOT',
    prefix: '.',
    owner: '923474810818',
    ownerNumbers: ['923474810818', '923474810818@s.whatsapp.net'],
    botNumber: '923471931926',
    ownerName: 'NIL',
    mode: 'public'
};

// Bot Data
let botData = {
    commandsUsed: 0,
    startTime: Date.now(),
    isConnected: false,
    autoTypingGroups: new Set()
};

// Phonk tracks list (100 curated phonk songs)
const PHONK_TRACKS = [
    'DVRST Close Eyes', 'KORDHELL Murder In My Mind', 'Playaphonk Phonky Town',
    'SKXLL CRUSH', 'LXST CXNTURY ODIUM', 'Freddie Dredd Cha Cha',
    'GHOSTEMANE Mercury', 'Pharmacist North Memphis', 'Baker Ya Mama',
    'Hensonn Sahara', 'Kaito Shoma Shadow', 'LXNGVX DESIRE',
    'Pharmacist Painkillers', 'KORDHELL Live Another Day', 'DVRST Berserk Mode',
    'Zxcursed Whxre', 'LXST CXNTURY ANTICHRIST', 'Shadxwbxrn FADED NIGHTS',
    'Moondeity NEON BLADE', 'Slowboy Deep End', 'Soudiere Smoke',
    'LXNGVX APHRODITE', 'Mythrodak Icarus', 'VØJ NARVENT Memory Reboot',
    'Dxrk After Dark', 'Kordhell Dat Phonk', 'Ghostface Playa Why Not',
    'DJ Yung Vamp Phonk', 'Tevvez Legend', 'LXST CXNTURY REDRUM',
    'Freddie Dredd GTG', 'Kaito Shoma MIDNIGHT', 'DVRST The Possession',
    'KORDHELL Like You Would Know', 'Pharmacist Hellraiser', 'Baker Gunner',
    'LXNGVX INSOMNIA', 'Zxcursed Sleepwalker', 'Shadxwbxrn DEMXNS',
    'Moondeity FALL INTO THE FIRE', 'Slowboy Midnight', 'Soudiere 7th Ward',
    'Mythrodak Echoes', 'Dxrk Rave', 'Kordhell Scopin', 'Ghostface Playa Shade',
    'DJ Yung Vamp Tokyo Drift', 'Tevvez Interworld', 'Freddie Dredd Redrum',
    'Kaito Shoma DARK', 'DVRST Escape', 'KORDHELL Slay', 'Pharmacist Morphine',
    'Baker Loaded', 'LXNGVX NEMESIS', 'Zxcursed Haunted', 'Shadxwbxrn NIGHTMARE',
    'Moondeity NITEMARE', 'Slowboy Late Night', 'Soudiere Down Bad',
    'Mythrodak Abyss', 'Dxrk Violet', 'Kordhell Killers', 'Ghostface Playa Push',
    'DJ Yung Vamp Drift King', 'Tevvez Shadows', 'Freddie Dredd Limbo',
    'Kaito Shoma VOID', 'DVRST Run It', 'KORDHELL Face It', 'Pharmacist Xanax',
    'Baker Heat', 'LXNGVX CHAOS', 'Zxcursed Nightmare', 'Shadxwbxrn SHADOW',
    'Moondeity CRYSTAL', 'Slowboy Twilight', 'Soudiere No Sleep',
    'Mythrodak Eclipse', 'Dxrk Phantom', 'Kordhell Demon', 'Ghostface Playa Smoke',
    'DJ Yung Vamp Dark Night', 'Tevvez Abyss', 'Freddie Dredd Evil',
    'Kaito Shoma GHOST', 'DVRST No Mercy', 'KORDHELL Kill Bill',
    'Pharmacist Codeine', 'Baker Locked', 'LXNGVX ETERNAL', 'Zxcursed Phantom',
    'Shadxwbxrn PHANTOM', 'Moondeity ETERNAL', 'Slowboy Dark Hour',
    'Soudiere Phonked', 'Mythrodak Silence', 'Dxrk Shadows', 'Kordhell Zone',
    'Ghostface Playa Phonky', 'DJ Yung Vamp Night Drive', 'Tevvez Darkness'
];

// Helper Functions
function cleanupFile(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Cleaned up: ${path.basename(filePath)}`);
        }
    } catch (error) {
        console.error('Cleanup error:', error.message);
    }
}

async function compressAudio(inputPath, outputPath, maxSizeMB = 15) {
    try {
        await execPromise(`ffmpeg -i "${inputPath}" -b:a 128k -ar 44100 -ac 2 "${outputPath}" -y`);
        
        const stats = fs.statSync(outputPath);
        const fileSizeMB = stats.size / (1024 * 1024);
        
        if (fileSizeMB > maxSizeMB) {
            await execPromise(`ffmpeg -i "${inputPath}" -b:a 64k -ar 44100 -ac 2 "${outputPath}" -y`);
        }
        
        return fs.existsSync(outputPath);
    } catch (error) {
        console.error('Audio compression error:', error.message);
        return false;
    }
}

async function compressVideo(inputPath, outputPath, maxSizeMB = 15) {
    try {
        const stats = fs.statSync(inputPath);
        const fileSizeMB = stats.size / (1024 * 1024);
        
        if (fileSizeMB <= maxSizeMB) {
            fs.copyFileSync(inputPath, outputPath);
            return true;
        }
        
        await execPromise(`ffmpeg -i "${inputPath}" -vcodec libx264 -crf 28 -preset fast -acodec aac -b:a 96k "${outputPath}" -y`);
        
        const newStats = fs.statSync(outputPath);
        const newFileSizeMB = newStats.size / (1024 * 1024);
        
        if (newFileSizeMB > maxSizeMB) {
            await execPromise(`ffmpeg -i "${inputPath}" -vcodec libx264 -crf 32 -preset fast -acodec aac -b:a 64k -s 640x360 "${outputPath}" -y`);
        }
        
        return fs.existsSync(outputPath);
    } catch (error) {
        console.error('Video compression error:', error.message);
        return false;
    }
}

async function downloadYouTubeAudio(query, retries = 2) {
    let tempPath = null;
    let finalPath = null;
    
    try {
        console.log(`🎵 Searching YouTube: ${query}`);
        const search = await yts(query);
        if (!search.videos.length) {
            console.log('No videos found');
            return null;
        }

        const video = search.videos[0];
        console.log(`Found: ${video.title}`);

        tempPath = path.join(__dirname, 'downloads', `temp_${Date.now()}.mp3`);
        finalPath = path.join(__dirname, 'downloads', `audio_${Date.now()}.mp3`);

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                await ytdl(video.url, {
                    extractAudio: true,
                    audioFormat: 'mp3',
                    audioQuality: 0,
                    output: tempPath,
                    noPlaylist: true
                });

                if (fs.existsSync(tempPath)) {
                    const compressed = await compressAudio(tempPath, finalPath, 15);
                    
                    if (compressed && fs.existsSync(finalPath)) {
                        console.log('✅ Audio downloaded and compressed');
                        cleanupFile(tempPath);
                        return { filePath: finalPath, title: video.title, url: video.url };
                    }
                }
            } catch (downloadError) {
                console.log(`Attempt ${attempt + 1} failed: ${downloadError.message}`);
                if (attempt === retries) throw downloadError;
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        return null;
    } catch (error) {
        console.error('YouTube audio download error:', error.message);
        cleanupFile(tempPath);
        cleanupFile(finalPath);
        return null;
    }
}

async function downloadYouTubeVideo(query, retries = 2) {
    let tempPath = null;
    let finalPath = null;
    
    try {
        console.log(`📹 Searching YouTube video: ${query}`);
        const search = await yts(query);
        if (!search.videos.length) {
            console.log('No videos found');
            return null;
        }

        const video = search.videos[0];
        console.log(`Found: ${video.title}`);

        tempPath = path.join(__dirname, 'downloads', `temp_${Date.now()}.mp4`);
        finalPath = path.join(__dirname, 'downloads', `video_${Date.now()}.mp4`);

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                await ytdl(video.url, {
                    format: 'best[ext=mp4][filesize<20M]',
                    output: tempPath,
                    noPlaylist: true
                });

                if (fs.existsSync(tempPath)) {
                    const compressed = await compressVideo(tempPath, finalPath, 15);
                    
                    if (compressed && fs.existsSync(finalPath)) {
                        console.log('✅ Video downloaded and compressed');
                        cleanupFile(tempPath);
                        return { filePath: finalPath, title: video.title, url: video.url };
                    }
                }
            } catch (downloadError) {
                console.log(`Attempt ${attempt + 1} failed: ${downloadError.message}`);
                if (attempt === retries) throw downloadError;
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        return null;
    } catch (error) {
        console.error('YouTube video download error:', error.message);
        cleanupFile(tempPath);
        cleanupFile(finalPath);
        return null;
    }
}

async function downloadInstagram(url) {
    let filePath = null;
    try {
        console.log(`📸 Downloading Instagram: ${url}`);
        const result = await instagramGetUrl(url);
        
        if (!result.url_list || !result.url_list.length) {
            console.log('No Instagram media URLs found');
            return null;
        }
        
        const mediaUrl = result.url_list[0];
        const urlPath = mediaUrl.split('?')[0];
        const isVideo = urlPath.toLowerCase().includes('.mp4');
        const ext = isVideo ? '.mp4' : '.jpg';
        filePath = path.join(__dirname, 'downloads', `ig_${Date.now()}${ext}`);
        
        const response = await axios({
            url: mediaUrl,
            method: 'GET',
            responseType: 'stream',
            timeout: 60000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        return new Promise((resolve, reject) => {
            response.data.pipe(fs.createWriteStream(filePath))
                .on('finish', () => {
                    console.log(`✅ Instagram ${isVideo ? 'video' : 'image'} downloaded`);
                    resolve({ filePath, type: isVideo ? 'video' : 'image' });
                })
                .on('error', (err) => {
                    console.error('Stream error:', err.message);
                    cleanupFile(filePath);
                    reject(err);
                });
        });
    } catch (error) {
        console.error('Instagram download error:', error.message);
        cleanupFile(filePath);
        return null;
    }
}

async function createSticker(imagePath) {
    let stickerPath = null;
    try {
        stickerPath = path.join(__dirname, 'temp', `sticker_${Date.now()}.webp`);
        await sharp(imagePath)
            .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .webp({ quality: 100 })
            .toFile(stickerPath);
        return stickerPath;
    } catch (error) {
        console.error('Sticker creation error:', error.message);
        cleanupFile(stickerPath);
        return null;
    }
}

// Message Handler
async function handleMessage(sock, message) {
    try {
        if (!message.message) return;
        
        const from = message.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        const sender = message.key.participant || message.key.remoteJid;
        
        // Get message text
        const msgContent = message.message;
        let messageText = '';
        if (msgContent.conversation) messageText = msgContent.conversation;
        else if (msgContent.extendedTextMessage?.text) messageText = msgContent.extendedTextMessage.text;
        else if (msgContent.imageMessage?.caption) messageText = msgContent.imageMessage.caption;
        else if (msgContent.videoMessage?.caption) messageText = msgContent.videoMessage.caption;
        
        const text = messageText.trim();
        const lowerText = text.toLowerCase();
        
        // Auto-typing
        if (botData.autoTypingGroups.has(from)) {
            await sock.sendPresenceUpdate('composing', from);
        }
        
        // Hi/Hello response with audio (single send, playable format)
        if (lowerText === 'hi' || lowerText === 'hello' || lowerText === 'hey') {
            try {
                const audioPath = path.join(__dirname, 'voices', 'hi_voice.mp3');
                
                if (fs.existsSync(audioPath)) {
                    await sock.sendMessage(from, {
                        audio: fs.readFileSync(audioPath),
                        mimetype: 'audio/mpeg',
                        fileName: 'greeting.mp3'
                    }, { quoted: message });
                    console.log('✅ Hi audio sent (playable format)');
                } else {
                    await sock.sendMessage(from, {
                        text: `👋 *Hello!* I'm ${BOT_CONFIG.name}\n\n🤖 Type *.menu* to see all commands!\n\n_Send .play <song name> to play music!_`
                    }, { quoted: message });
                }
            } catch (error) {
                console.error('Hi response error:', error.message);
                await sock.sendMessage(from, {
                    text: `👋 *Hello!* I'm ${BOT_CONFIG.name}\n\nType *.menu* for commands!`
                }, { quoted: message });
            }
            return;
        }
        
        // Sound effect responses
        const soundEffects = {
            'woow': 'uwu.mp3',
            'mm': 'anime-moan.mp3',
            'hahaha': 'light-yagami-laugh.mp3',
            'nil': 'niko-niko-nii.mp3',
            'yep': 'yameti.mp3',
            'mum': 'moaning-catgirl.mp3',
            'gambare': 'gambare-gambare-senpai.mp3',
            'oh': 'ohayo-gozaimasu.mp3',
            'paak': 'angry-anime-girls-fuck-you.mp3',
            'ummm': 'muach.mp3'
        };
        
        if (soundEffects[lowerText]) {
            try {
                const audioPath = path.join(__dirname, 'voices', soundEffects[lowerText]);
                
                if (fs.existsSync(audioPath)) {
                    await sock.sendMessage(from, {
                        audio: fs.readFileSync(audioPath),
                        mimetype: 'audio/mpeg',
                        fileName: soundEffects[lowerText]
                    }, { quoted: message });
                    console.log(`✅ Sound effect sent: ${soundEffects[lowerText]}`);
                }
            } catch (error) {
                console.error('Sound effect error:', error.message);
            }
            return;
        }
        
        // Check for commands
        if (!text.startsWith(BOT_CONFIG.prefix)) return;
        
        const args = text.slice(BOT_CONFIG.prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();
        const query = args.join(' ');
        
        botData.commandsUsed++;
        
        // Menu command with video
        if (command === 'menu') {
            const uptime = Math.floor((Date.now() - botData.startTime) / 1000);
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            
            const menuText = `╔═══════════════════════╗
║   👑 *THE LORD NIL* 👑   ║
╚═══════════════════════╝

┏━━━━━━━━━━━━━━━━━━━━━┓
┃  ⚡ *AUDIO COMMANDS* ⚡  
┃━━━━━━━━━━━━━━━━━━━━━
┃ 🎵 .play <song name>
┃ 🎵 .song <song name>
┗━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━┓
┃  📹 *VIDEO COMMANDS* 📹
┃━━━━━━━━━━━━━━━━━━━━━
┃ 🎬 .video <video name>
┃ 📺 .yt <YouTube link>
┃ 📸 .ig <Instagram link>
┗━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━┓
┃  🎧 *PHONK MUSIC* 🎧
┃━━━━━━━━━━━━━━━━━━━━━
┃ 🔥 .nil1 to .nil100
┃ (100 Premium Phonk Tracks)
┗━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━┓
┃  🎨 *FUN FEATURES* 🎨
┃━━━━━━━━━━━━━━━━━━━━━
┃ 🖼️  .sticker (reply to image)
┃ ⌨️  .autotyping (groups)
┗━━━━━━━━━━━━━━━━━━━━━┛

╔═══════════════════════╗
║ 👤 Owner: ${BOT_CONFIG.ownerName}
║ 🤖 Prefix: ${BOT_CONFIG.prefix}
║ 📊 Commands: ${botData.commandsUsed}
║ ⏱️  Uptime: ${hours}h ${minutes}m
╚═══════════════════════╝

_✨ Type any command to get started! ✨_`;
            
            try {
                const menuVideoPath = path.join(__dirname, 'media', 'menu_video.mp4');
                
                if (fs.existsSync(menuVideoPath)) {
                    await sock.sendMessage(from, {
                        video: fs.readFileSync(menuVideoPath),
                        caption: menuText,
                        gifPlayback: false,
                        mimetype: 'video/mp4'
                    }, { quoted: message });
                    console.log('✅ Menu video with caption sent');
                } else {
                    await sock.sendMessage(from, { 
                        text: menuText 
                    }, { quoted: message });
                    console.log('✅ Menu text sent (no video found)');
                }
            } catch (error) {
                console.error('Menu error:', error.message);
                await sock.sendMessage(from, { 
                    text: menuText 
                }, { quoted: message });
            }
        }
        
        // Play audio command
        else if (command === 'play' || command === 'song') {
            if (!query) {
                await sock.sendMessage(from, { 
                    text: '❌ *Please provide a song name!*\n\n📝 Example: *.play shape of you*' 
                }, { quoted: message });
                return;
            }

            await sock.sendMessage(from, { 
                text: `🎵 *Downloading:* ${query}\n\n⏳ Please wait...` 
            }, { quoted: message });

            try {
                const result = await downloadYouTubeAudio(query);
                
                if (result && fs.existsSync(result.filePath)) {
                    await sock.sendMessage(from, {
                        audio: fs.readFileSync(result.filePath),
                        mimetype: 'audio/mpeg',
                        fileName: `${result.title}.mp3`
                    }, { quoted: message });

                    cleanupFile(result.filePath);
                    console.log('✅ Audio sent successfully');
                } else {
                    await sock.sendMessage(from, { 
                        text: '❌ *Failed to download audio.*\n\n💡 Try:\n• Different song name\n• More specific search terms' 
                    }, { quoted: message });
                }
            } catch (error) {
                console.error('Play command error:', error.message);
                await sock.sendMessage(from, { 
                    text: '❌ *Download error!*\n\nPlease try again or use a different song name.' 
                }, { quoted: message });
            }
        }
        
        // Video command
        else if (command === 'video') {
            if (!query) {
                await sock.sendMessage(from, { 
                    text: '❌ *Please provide a video name!*\n\n📝 Example: *.video funny cats*' 
                }, { quoted: message });
                return;
            }
            
            await sock.sendMessage(from, { 
                text: `📹 *Downloading:* ${query}\n\n⏳ Please wait...` 
            }, { quoted: message });
            
            try {
                const result = await downloadYouTubeVideo(query);
                
                if (result && fs.existsSync(result.filePath)) {
                    const stats = fs.statSync(result.filePath);
                    const fileSizeMB = stats.size / (1024 * 1024);
                    
                    await sock.sendMessage(from, {
                        video: fs.readFileSync(result.filePath),
                        caption: `🎬 *${result.title}*\n\n📦 Size: ${fileSizeMB.toFixed(2)} MB`,
                        mimetype: 'video/mp4'
                    }, { quoted: message });
                    
                    cleanupFile(result.filePath);
                    console.log('✅ Video sent successfully');
                } else {
                    await sock.sendMessage(from, { 
                        text: '❌ *Failed to download video.*\n\n💡 Try a shorter video or different search term.' 
                    }, { quoted: message });
                }
            } catch (error) {
                console.error('Video command error:', error.message);
                await sock.sendMessage(from, { 
                    text: '❌ *Download error!*\n\nPlease try again.' 
                }, { quoted: message });
            }
        }
        
        // YouTube link download
        else if (command === 'yt') {
            if (!query || (!query.includes('youtube.com') && !query.includes('youtu.be'))) {
                await sock.sendMessage(from, { 
                    text: '❌ *Please provide a valid YouTube URL!*' 
                }, { quoted: message });
                return;
            }
            
            await sock.sendMessage(from, { 
                text: '📥 *Downloading from YouTube...*\n\n⏳ Please wait...' 
            }, { quoted: message });
            
            let tempPath = null;
            let finalPath = null;
            
            try {
                tempPath = path.join(__dirname, 'downloads', `temp_yt_${Date.now()}.mp4`);
                finalPath = path.join(__dirname, 'downloads', `yt_${Date.now()}.mp4`);
                
                await ytdl(query, {
                    format: 'best[ext=mp4][filesize<20M]',
                    output: tempPath,
                    noPlaylist: true
                });
                
                if (fs.existsSync(tempPath)) {
                    const compressed = await compressVideo(tempPath, finalPath, 15);
                    
                    if (compressed && fs.existsSync(finalPath)) {
                        await sock.sendMessage(from, {
                            video: fs.readFileSync(finalPath),
                            caption: '🎬 *YouTube Download*',
                            mimetype: 'video/mp4'
                        }, { quoted: message });
                        
                        cleanupFile(tempPath);
                        cleanupFile(finalPath);
                        console.log('✅ YouTube download sent');
                    } else {
                        throw new Error('Compression failed');
                    }
                } else {
                    throw new Error('Download failed');
                }
            } catch (error) {
                console.error('YT download error:', error.message);
                cleanupFile(tempPath);
                cleanupFile(finalPath);
                await sock.sendMessage(from, { 
                    text: '❌ *Download failed!*\n\n💡 Video might be too long or unavailable.' 
                }, { quoted: message });
            }
        }
        
        // Instagram download
        else if (command === 'ig') {
            if (!query || !query.includes('instagram.com')) {
                await sock.sendMessage(from, { 
                    text: '❌ *Please provide a valid Instagram URL!*' 
                }, { quoted: message });
                return;
            }
            
            await sock.sendMessage(from, { 
                text: '📸 *Downloading from Instagram...*\n\n⏳ Please wait...' 
            }, { quoted: message });
            
            try {
                const result = await downloadInstagram(query);
                
                if (result && fs.existsSync(result.filePath)) {
                    if (result.type === 'video') {
                        await sock.sendMessage(from, {
                            video: fs.readFileSync(result.filePath),
                            caption: '📸 *Instagram Download*',
                            mimetype: 'video/mp4'
                        }, { quoted: message });
                    } else {
                        await sock.sendMessage(from, {
                            image: fs.readFileSync(result.filePath),
                            caption: '📸 *Instagram Download*'
                        }, { quoted: message });
                    }
                    
                    cleanupFile(result.filePath);
                    console.log('✅ Instagram media sent');
                } else {
                    await sock.sendMessage(from, { 
                        text: '❌ *Download failed!*\n\n💡 Make sure the post is public.' 
                    }, { quoted: message });
                }
            } catch (error) {
                console.error('Instagram download error:', error.message);
                await sock.sendMessage(from, { 
                    text: '❌ *Download failed!*\n\nPlease check the link and try again.' 
                }, { quoted: message });
            }
        }
        
        // Phonk commands (.nil1 to .nil100)
        else if (command.startsWith('nil') && /^nil\d+$/.test(command)) {
            const phonkNum = parseInt(command.substring(3));
            
            if (phonkNum >= 1 && phonkNum <= 100) {
                const phonkQuery = PHONK_TRACKS[phonkNum - 1];
                const phonkPath = path.join(__dirname, 'phonk', `phonk_${phonkNum}.mp3`);
                
                // Check if already downloaded
                if (fs.existsSync(phonkPath)) {
                    try {
                        await sock.sendMessage(from, {
                            audio: fs.readFileSync(phonkPath),
                            mimetype: 'audio/mpeg',
                            fileName: `${phonkQuery}.mp3`
                        }, { quoted: message });
                        console.log(`✅ Phonk ${phonkNum} sent from cache`);
                    } catch (error) {
                        console.error('Phonk send error:', error.message);
                        await sock.sendMessage(from, { 
                            text: '❌ Failed to send phonk track!' 
                        }, { quoted: message });
                    }
                } else {
                    await sock.sendMessage(from, { 
                        text: `🎧 *Loading Phonk ${phonkNum}*\n\n${phonkQuery}\n\n⏳ Please wait...` 
                    }, { quoted: message });
                    
                    try {
                        const result = await downloadYouTubeAudio(phonkQuery + ' phonk');
                        
                        if (result && fs.existsSync(result.filePath)) {
                            // Save to phonk folder
                            fs.copyFileSync(result.filePath, phonkPath);
                            
                            await sock.sendMessage(from, {
                                audio: fs.readFileSync(result.filePath),
                                mimetype: 'audio/mpeg',
                                fileName: `${phonkQuery}.mp3`
                            }, { quoted: message });
                            
                            cleanupFile(result.filePath);
                            console.log(`✅ Phonk ${phonkNum} downloaded and sent`);
                        } else {
                            await sock.sendMessage(from, { 
                                text: '❌ *Failed to download phonk track!*' 
                            }, { quoted: message });
                        }
                    } catch (error) {
                        console.error('Phonk download error:', error.message);
                        await sock.sendMessage(from, { 
                            text: '❌ *Download error!* Please try again.' 
                        }, { quoted: message });
                    }
                }
            }
        }
        
        // Sticker command
        else if (command === 'sticker' || command === 's') {
            const quotedMsg = message.message.extendedTextMessage?.contextInfo?.quotedMessage;
            let imagePath = null;
            let stickerPath = null;
            
            if (quotedMsg?.imageMessage || msgContent.imageMessage) {
                await sock.sendMessage(from, { text: '🎨 *Creating sticker...*' }, { quoted: message });
                
                try {
                    const imageMsg = quotedMsg?.imageMessage || msgContent.imageMessage;
                    const stream = await downloadContentFromMessage(imageMsg, 'image');
                    const buffer = [];
                    for await (const chunk of stream) {
                        buffer.push(chunk);
                    }
                    
                    imagePath = path.join(__dirname, 'temp', `img_${Date.now()}.jpg`);
                    fs.writeFileSync(imagePath, Buffer.concat(buffer));
                    
                    stickerPath = await createSticker(imagePath);
                    if (stickerPath && fs.existsSync(stickerPath)) {
                        await sock.sendMessage(from, {
                            sticker: fs.readFileSync(stickerPath)
                        }, { quoted: message });
                        
                        cleanupFile(imagePath);
                        cleanupFile(stickerPath);
                        console.log('✅ Sticker sent');
                    } else {
                        throw new Error('Sticker creation failed');
                    }
                } catch (error) {
                    console.error('Sticker error:', error.message);
                    cleanupFile(imagePath);
                    cleanupFile(stickerPath);
                    await sock.sendMessage(from, { 
                        text: '❌ *Sticker creation failed!*' 
                    }, { quoted: message });
                }
            } else {
                await sock.sendMessage(from, { 
                    text: '❌ *Reply to an image with .sticker*' 
                }, { quoted: message });
            }
        }
        
        // Auto-typing toggle
        else if (command === 'autotyping') {
            if (!isGroup) {
                await sock.sendMessage(from, { 
                    text: '❌ *This command only works in groups!*' 
                }, { quoted: message });
                return;
            }
            
            if (botData.autoTypingGroups.has(from)) {
                botData.autoTypingGroups.delete(from);
                await sock.sendMessage(from, { 
                    text: '✅ *Auto-typing disabled* for this group' 
                }, { quoted: message });
            } else {
                botData.autoTypingGroups.add(from);
                await sock.sendMessage(from, { 
                    text: '✅ *Auto-typing enabled* for this group' 
                }, { quoted: message });
            }
        }
        
    } catch (error) {
        console.error('Message handler error:', error.message);
    }
}

// Create necessary directories
function ensureDirectories() {
    const dirs = ['session', 'temp', 'cache', 'media', 'downloads', 'voices', 'phonk'];
    dirs.forEach(dir => {
        const dirPath = path.join(__dirname, dir);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            console.log(`✅ Created directory: ${dir}`);
        }
    });
}

// Start Bot
async function startBot() {
    console.log('🚀 Starting NIL Bot...');
    ensureDirectories();
    
    try {
        const { state, saveCreds } = await useMultiFileAuthState('./session');
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: true,
            browser: ['NIL BOT', 'Chrome', '120.0.0.0'],
            markOnlineOnConnect: true
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                console.log('\n🔥 SCAN QR CODE TO LOGIN:\n');
                qrcode.generate(qr, { small: true });
            }
            
            if (connection === 'open') {
                console.log('✅ BOT CONNECTED!');
                console.log('━━━━━━━━━━━━━━━━━━━━━━');
                console.log(`Bot Name: ${BOT_CONFIG.name}`);
                console.log(`Owner: ${BOT_CONFIG.ownerName}`);
                console.log(`Prefix: ${BOT_CONFIG.prefix}`);
                console.log('━━━━━━━━━━━━━━━━━━━━━━');
                botData.isConnected = true;
                
                try {
                    await sock.sendMessage(`${BOT_CONFIG.owner}@s.whatsapp.net`, {
                        text: `✅ *${BOT_CONFIG.name} IS NOW ONLINE!*\n\n` +
                              `📅 ${new Date().toLocaleString()}\n` +
                              `🤖 All features activated!\n` +
                              `⚡ Ready to serve!`
                    });
                } catch (e) {
                    console.log('Owner notification skipped');
                }
            }
            
            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log('Connection closed. Reconnecting:', shouldReconnect);
                
                if (shouldReconnect) {
                    setTimeout(() => startBot(), 3000);
                }
            }
        });

        sock.ev.on('messages.upsert', async ({ messages }) => {
            const message = messages[0];
            if (!message.message || message.key.fromMe) return;
            
            await handleMessage(sock, message);
        });

    } catch (error) {
        console.error('Bot error:', error);
        setTimeout(() => startBot(), 5000);
    }
}

// Start
console.log('🔥 NIL BOT INITIALIZING...');
console.log('📁 Working Directory:', __dirname);
startBot();
