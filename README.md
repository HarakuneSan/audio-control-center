# 🎵 Audio Control Center

A web-based audio control application for Windows that lets you control volume, media playback, and switch between audio devices from your browser. The design looks good.

**🤖 AI-Assisted Development**: Large parts of this project were developed with AI assistance. I wanted to check how far I can push AI for my personal projects. AI helped with code generation, debugging, and documentation.

## ✨ Features

- **Volume Control**: Real-time slider and direct input (0-100)
- **Media Controls**: Play/pause, previous/next track
- **Device Switching**: Toggle between two audio devices
- **Spotify Integration**: Shows currently playing track
- **Modern UI**: Glassmorphism design with smooth animations

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **Windows 10/11**
- **NirCmd** utility

### Installation

1. **Clone and setup**
   ```bash
   git clone https://github.com/HarakuneSan/audio-control-center
   cd audio-control-center
   npm install
   ```

2. **Configure**
   ```bash
   mv env.example .env
   # Edit .env with your device names
   ```

3. **Add NirCmd**
   - Download from https://www.nirsoft.net/utils/nircmd.html
   - Place `nircmd.exe` in project root

4. **Start**
   ```bash
   npm start
   # Open http://localhost:5000
   ```

## ⚙️ Configuration

Rename `env.example` to `.env` and customize:

```env
# Server
PORT=5000
HOST=localhost

# Your audio devices
DEVICE_1_NAME=Your First Device
DEVICE_2_NAME=Your Second Device

# Debug mode
DEBUG=false
```

## 🎛️ Usage

- **Volume**: Drag slider or click number to type value
- **Mute**: Click mute button
- **Media**: Click play/pause, previous/next buttons
- **Device**: Click device button to switch audio outputs

## 🛠️ Technical Details

- **Backend**: Node.js + Express + PowerShell + NirCmd
- **Frontend**: Vanilla JavaScript + CSS3 glassmorphism
- **Audio Control**: PowerShell AudioDeviceCmdlets + NirCmd
- **Spotify**: get-windows module for track detection

## 🐛 Troubleshooting

- **Volume not working**: Check if NirCmd is in the project root and .env device names
- **Media controls**: Ensure NirCmd is installed and media player is active
- **Device switching**: Verify device names match Windows Sound settings exactly
- **Debug mode**: Set `DEBUG=true` in .env for detailed logs

---

**Made with ❤️ and AI assistance for better audio control** 