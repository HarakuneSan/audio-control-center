import { activeWindowSync, openWindowsSync } from 'get-windows';
import express from 'express';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { exec } from 'node:child_process';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Constants from environment variables
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';
const DEBUG = process.env.DEBUG === 'true';

// Virtual Key Codes for media controls
const VIRTUAL_KEYS = {
    MEDIA_NEXT_TRACK: process.env.MEDIA_NEXT_TRACK || '0xB0',
    MEDIA_PREV_TRACK: process.env.MEDIA_PREV_TRACK || '0xB1',
    MEDIA_PLAY_PAUSE: process.env.MEDIA_PLAY_PAUSE || '0xB3'
};

// Audio device names from environment variables
const AUDIO_DEVICES = {
    DEVICE_1: process.env.DEVICE_1_NAME || 'Headphones',
    DEVICE_2: process.env.DEVICE_2_NAME || 'TV'
};

// Setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// Middleware
app.use(express.static(path.join(__dirname, 'public')));

// Utility Functions
async function executePowerShell(command) {
    return new Promise((resolve, reject) => {
        exec(`powershell -Command "${command}"`, (error, stdout, stderr) => {
            if (error) {
                console.error('PowerShell execution error:', error);
                reject(error);
                return;
            }
            if (stderr) {
                console.error('PowerShell stderr:', stderr);
                reject(new Error(stderr));
                return;
            }
            resolve(stdout.trim());
        });
    });
}

function executeNirCmd(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error('NirCmd execution error:', error);
                reject(error);
                return;
            }
            resolve(stdout);
        });
    });
}

// Error Response Helper
function sendErrorResponse(res, statusCode, message) {
    console.error(`Error: ${message}`);
    res.status(statusCode).send(message);
}

// Media Control Endpoints
app.get('/change', async (req, res) => {
    const { type } = req.query;
    
    if (!type) {
        return sendErrorResponse(res, 400, 'Missing action type');
    }

    try {
        switch (type) {
            case 'nextsong':
                await executeNirCmd(`nircmd sendkeypress ${VIRTUAL_KEYS.MEDIA_NEXT_TRACK}`);
                res.send('Next track command sent');
                break;

            case 'prevsong':
                await executeNirCmd(`nircmd sendkeypress ${VIRTUAL_KEYS.MEDIA_PREV_TRACK}`);
                res.send('Previous track command sent');
                break;

            case 'play':
                await executeNirCmd(`nircmd sendkeypress ${VIRTUAL_KEYS.MEDIA_PLAY_PAUSE}`);
                res.send('Play/Pause command sent');
                break;

            case 'toggle_mute':
                await executePowerShell('Set-AudioDevice -PlaybackMuteToggle');
                res.send('System mute toggled');
                break;

            case 'change_device':
                debugLog('Device switching requested');
                const currentDevice = await executePowerShell(
                    "Get-AudioDevice -List | Where-Object { $_.Default -eq $true -and $_.Type -eq 'Playback' } | select Name"
                );
                
                debugLog(`Current device: ${currentDevice}`);
                
                // Check which device is currently active and switch to the other one
                if (currentDevice.includes(AUDIO_DEVICES.DEVICE_1)) {
                    // Switch to device 2
                    debugLog(`Switching to device 2: ${AUDIO_DEVICES.DEVICE_2}`);
                    await executeNirCmd(`nircmd.exe setdefaultsounddevice "${AUDIO_DEVICES.DEVICE_2}" 1`);
                } else {
                    // Switch to device 1
                    debugLog(`Switching to device 1: ${AUDIO_DEVICES.DEVICE_1}`);
                    await executeNirCmd(`nircmd.exe setdefaultsounddevice "${AUDIO_DEVICES.DEVICE_1}" 1`);
                }
                res.send('Audio output device changed');
                break;

            case 'deaf_discord':
                // TODO: Implement Discord deaf functionality
                res.send('Discord deafened');
                break;

            case 'mute_discord':
                // TODO: Implement Discord mute functionality
                res.send('Discord muted');
                break;

            default:
                sendErrorResponse(res, 400, `Invalid action: ${type}`);
        }
    } catch (error) {
        sendErrorResponse(res, 500, `Failed to execute ${type}: ${error.message}`);
    }
});

// Audio Control Endpoints
app.get('/volume', async (req, res) => {
    const { level } = req.query;

    try {
        if (level !== undefined) {
            // Set volume
            const volumeLevel = parseInt(level);
            
            if (isNaN(volumeLevel) || volumeLevel < 0 || volumeLevel > 100) {
                return sendErrorResponse(res, 400, 'Invalid volume level (must be 0-100)');
            }

            await executePowerShell(`Set-AudioDevice -PlaybackVolume ${volumeLevel}`);
            res.send(`Volume set to ${volumeLevel}%`);
        } else {
            // Get current volume
            const volume = await executePowerShell('Get-AudioDevice -PlaybackVolume');
            const volumeNumber = parseFloat(volume);
            
            if (isNaN(volumeNumber)) {
                return sendErrorResponse(res, 500, 'Invalid volume value received from system');
            }
            
            res.send(Math.round(volumeNumber).toString());
        }
    } catch (error) {
        sendErrorResponse(res, 500, `Volume operation failed: ${error.message}`);
    }
});

app.get('/mute', async (req, res) => {
    const { status } = req.query;

    try {
        if (status !== undefined) {
            // Set mute status
            const shouldMute = status === 'true';
            await executePowerShell(`Set-AudioDevice -PlaybackMute $${shouldMute}`);
            res.send(`Audio ${shouldMute ? 'muted' : 'unmuted'}`);
        } else {
            // Get current mute status
            const muteStatus = await executePowerShell('Get-AudioDevice -PlaybackMute');
            const isMuted = muteStatus.toLowerCase() === 'true';
            res.send(isMuted.toString());
        }
    } catch (error) {
        sendErrorResponse(res, 500, `Mute operation failed: ${error.message}`);
    }
});

// Spotify Integration
app.get('/spotify', (req, res) => {
    try {
        const windows = openWindowsSync();
        const spotifyWindow = windows.find(window => 
            window.owner.path.toLowerCase().includes('spotify.exe')
        );
        
        if (spotifyWindow && spotifyWindow.title) {
            res.send(spotifyWindow.title);
        } else {
            res.send('No active Spotify window found');
        }
    } catch (error) {
        sendErrorResponse(res, 500, `Spotify info retrieval failed: ${error.message}`);
    }
});

// Health Check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Debug logging function
function debugLog(message) {
    if (DEBUG) {
        console.log(`[DEBUG] ${message}`);
    }
}

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Audio Control Server running on http://${HOST}:${PORT}`);
    console.log(`📊 Health check available at http://${HOST}:${PORT}/health`);
    
    if (DEBUG) {
        console.log(`🔧 Configuration:`);
        console.log(`   - Port: ${PORT}`);
        console.log(`   - Host: ${HOST}`);
        console.log(`   - Device 1: ${AUDIO_DEVICES.DEVICE_1}`);
        console.log(`   - Device 2: ${AUDIO_DEVICES.DEVICE_2}`);
        console.log(`   - Debug Mode: ${DEBUG}`);
    }
});