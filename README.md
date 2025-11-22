# 🎮 Crack and Combat

**The Ultimate Multiplayer Mind Game - Outsmart the Oracle, Win the Crown!**

## 🎯 Game Overview

Crack and Combat is an intense multiplayer battle of wits where players face off against the Oracle and each other through 5 challenging rounds. Test your knowledge, reflexes, creativity, and word skills in this fast-paced party game!

## ✨ Features

### 🧩 5 Unique Challenge Types

1. **🎭 Riddles** - Solve the Oracle's mysterious riddles before time runs out
2. **💬 SayIt Challenge** - Race to type valid words starting with random letters (3+ letters required)
3. **🧠 Trivia** - Answer challenging questions across various topics
4. **⚡ Fast Tapper** - Test your reflexes in speed-tapping competitions
5. **🎯 Memory Challenge** - Remember patterns and recall them accurately

### 🎮 Game Mechanics

- **Multiplayer Support**: 2-8 players per room
- **Real-time Competition**: Live scores and instant feedback
- **Smart Word Validation**: Only real words count in SayIt challenges (no gibberish!)
- **Progressive Difficulty**: Challenges adapt based on round number
- **Audio Feedback**: Immersive sound effects and background music
- **Mobile Optimized**: Play on any device with a browser

## 🚀 Quick Start

1. **Install Dependencies**
```bash
npm install
```

2. **Start the Server**
```bash
npm start
```

3. **Open in Browser**
```
http://localhost:3000
```

## 🎲 How to Play

1. **Create or Join a Room**: One player creates a room, others join with the room code
2. **Face the Oracle**: Each round starts with a riddle from the Oracle
3. **Winners Skip, Losers Battle**: Riddle winners rest while others face random challenges
4. **Earn Points**: Correct answers and winning challenges award points
5. **Crown the Champion**: After 5 rounds, the player with the most points wins!

## 💡 SayIt Challenge Rules

The newest addition to Crack and Combat! When you get the SayIt challenge:
- You'll see a random letter (A-Z)
- Type ANY valid English word starting with that letter
- Minimum 3 letters required (e.g., "Bus" ✅, "Be" ❌)
- Only real words count - no random letters!
- 15 seconds to submit your answer
- All players with valid words earn points

### Examples:
- **Letter B**: Bus, Book, Bear, Beautiful ✅
- **Invalid**: Be (too short), bxyz (gibberish), b123 (contains numbers) ❌

## 🛠️ Technologies

- **Backend**: Node.js, Express, Socket.io
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Real-time**: WebSocket communication
- **Audio**: Web Audio API for immersive sound

## 🎨 Features

- Cyberpunk-themed UI with neon aesthetics
- Responsive design for all screen sizes
- Real-time player synchronization
- Auto-submit on timer expiration
- Smart word validation algorithm
- Points tracking and leaderboard

## 📱 Mobile Support

Fully optimized for mobile devices with:
- Touch-friendly controls
- Responsive layouts
- Performance optimizations
- Virtual keyboard support

## 🏆 Scoring System

- **Riddle**: First correct answer wins the round
- **SayIt**: 1 point for each valid word
- **Trivia**: 1 point for correct answers
- **Fast Tapper**: Winner gets 1 point
- **Memory**: Correct recall earns points

## 🎵 Audio Features

- Background music tracks for different game phases
- Sound effects for actions and feedback
- Adjustable volume controls
- Mute/unmute functionality

## 🚦 Game States

1. **Lobby**: Players join and wait for game start
2. **Riddle Phase**: Oracle presents a riddle
3. **Challenge Phase**: Non-winners face random challenges
4. **Round Summary**: View scores and rankings
5. **Game Over**: Final results and winner announcement

## 👥 Room Management

- Automatic room code generation (6 characters)
- Room owner controls game start
- Late joiners become spectators until next round
- Automatic cleanup of empty rooms

---

**Ready to face the Oracle? Create a room and challenge your friends!**

🌐 [Play Now](http://localhost:3000) | 🎮 Version 4.8