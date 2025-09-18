const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Google Gemini Setup
let genAI = null;
if (process.env.GEMINI_API_KEY) {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

app.use(express.static(path.join(__dirname, 'public')));

// Challenge Types (will be shuffled for each game session)
const BASE_CHALLENGE_TYPES = ['negotiator', 'detective', 'multipleChoiceTrivia', 'fastTapper', 'danger'];

// Shuffle array function
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Game Data with 50+ riddles and trivia questions
const gameData = {
    riddles: [
        { question: "I speak without a mouth and hear without ears. What am I?", answer: "ECHO", difficulty: "easy" },
        { question: "The more you take, the more you leave behind. What am I?", answer: "FOOTSTEPS", difficulty: "easy" },
        { question: "I have cities, but no houses. I have mountains, but no trees. What am I?", answer: "MAP", difficulty: "medium" },
        { question: "What has keys but no locks, space but no room, and you can enter but not go inside?", answer: "KEYBOARD", difficulty: "medium" },
        { question: "What gets wet while drying?", answer: "TOWEL", difficulty: "easy" },
        { question: "I am not alive, but I grow; I don't have lungs, but I need air. What am I?", answer: "FIRE", difficulty: "medium" },
        { question: "What comes once in a minute, twice in a moment, but never in a thousand years?", answer: "M", difficulty: "hard" },
        { question: "I have a golden head and a golden tail, but no body. What am I?", answer: "COIN", difficulty: "easy" },
        { question: "I am tall when I am young, and short when I am old. What am I?", answer: "CANDLE", difficulty: "medium" },
        { question: "What has one head, one foot, and four legs?", answer: "BED", difficulty: "medium" },
        { question: "What can travel around the world while staying in a corner?", answer: "STAMP", difficulty: "hard" },
        { question: "What breaks but never falls, and what falls but never breaks?", answer: "DAWN", difficulty: "hard" },
        { question: "I can be cracked, made, told, and played. What am I?", answer: "JOKE", difficulty: "medium" },
        { question: "What has hands but cannot clap?", answer: "CLOCK", difficulty: "easy" },
        { question: "What runs around the whole yard without moving?", answer: "FENCE", difficulty: "medium" },
        { question: "What has a neck but no head?", answer: "BOTTLE", difficulty: "easy" },
        { question: "What can fill a room but takes up no space?", answer: "LIGHT", difficulty: "easy" },
        { question: "What word is spelled incorrectly in every dictionary?", answer: "INCORRECTLY", difficulty: "easy" },
        { question: "What goes up but never comes down?", answer: "AGE", difficulty: "easy" },
        { question: "What has teeth but cannot bite?", answer: "ZIPPER", difficulty: "medium" },
        { question: "What has an eye but cannot see?", answer: "NEEDLE", difficulty: "medium" },
        { question: "What gets sharper the more you use it?", answer: "BRAIN", difficulty: "medium" },
        { question: "What is always in front of you but can't be seen?", answer: "FUTURE", difficulty: "medium" },
        { question: "What is so fragile that saying its name breaks it?", answer: "SILENCE", difficulty: "hard" },
        { question: "What is black when you buy it, red when you use it, and gray when you throw it away?", answer: "CHARCOAL", difficulty: "hard" },
        { question: "What has a thumb and four fingers but is not alive?", answer: "GLOVE", difficulty: "easy" },
        { question: "What gets bigger when more is taken away from it?", answer: "HOLE", difficulty: "medium" },
        { question: "What is full of holes but still holds water?", answer: "SPONGE", difficulty: "easy" },
        { question: "What disappears as soon as you say its name?", answer: "SILENCE", difficulty: "hard" },
        { question: "What has a head and a tail but no body?", answer: "COIN", difficulty: "easy" },
        { question: "What is always hungry and must always be fed, but if you give it water it will die?", answer: "FIRE", difficulty: "hard" },
        { question: "What can you catch but not throw?", answer: "COLD", difficulty: "medium" },
        { question: "What has many keys but can't open any doors?", answer: "PIANO", difficulty: "medium" },
        { question: "What is heavier: a ton of feathers or a ton of bricks?", answer: "EQUAL", difficulty: "easy" },
        { question: "What goes through towns and hills but never moves?", answer: "ROAD", difficulty: "medium" },
        { question: "What has four legs but cannot walk?", answer: "TABLE", difficulty: "easy" },
        { question: "What can you break without hitting or dropping it?", answer: "PROMISE", difficulty: "hard" },
        { question: "What is bought by the yard and worn by the foot?", answer: "CARPET", difficulty: "hard" },
        { question: "What starts with T, ends with T, and has T in it?", answer: "TEAPOT", difficulty: "medium" },
        { question: "What can you hold without touching it?", answer: "BREATH", difficulty: "hard" },
        { question: "What has a ring but no finger?", answer: "TELEPHONE", difficulty: "medium" },
        { question: "What is taken before you can get it?", answer: "PICTURE", difficulty: "medium" },
        { question: "What has no beginning, end, or middle?", answer: "CIRCLE", difficulty: "medium" },
        { question: "What gets wetter the more it dries?", answer: "TOWEL", difficulty: "easy" },
        { question: "What is cut on a table but never eaten?", answer: "CARDS", difficulty: "medium" },
        { question: "What has cities but no people, forests but no trees, and water but no fish?", answer: "MAP", difficulty: "hard" },
        { question: "What is so delicate that even saying its name will break it?", answer: "SILENCE", difficulty: "hard" },
        { question: "What flies without wings?", answer: "TIME", difficulty: "hard" },
        { question: "What has a face and two hands but no arms or legs?", answer: "CLOCK", difficulty: "easy" },
        { question: "What is made of water but if you put it into water it will die?", answer: "ICE", difficulty: "medium" },
        { question: "What belongs to you but others use it more than you do?", answer: "NAME", difficulty: "medium" },
        { question: "What is always coming but never arrives?", answer: "TOMORROW", difficulty: "medium" },
        { question: "What can be seen in the middle of March and April that cannot be seen at the beginning or end of either month?", answer: "R", difficulty: "hard" },
        { question: "What word becomes shorter when you add two letters to it?", answer: "SHORT", difficulty: "hard" },
        { question: "What occurs once in every minute, twice in every moment, yet never in a thousand years?", answer: "M", difficulty: "hard" }
    ],
    triviaQuestions: [
        {
            question: "Which artificial intelligence technique mimics the structure of the human brain?",
            options: ["Neural Networks", "Decision Trees", "Linear Regression", "K-Means Clustering"],
            correctAnswer: 0,
            difficulty: "medium"
        },
        {
            question: "What is the primary component of Earth's atmosphere that AI systems might struggle to process without proper sensors?",
            options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Argon"],
            correctAnswer: 2,
            difficulty: "medium"
        },
        {
            question: "In quantum computing, what phenomenon allows qubits to exist in multiple states simultaneously?",
            options: ["Entanglement", "Superposition", "Decoherence", "Tunneling"],
            correctAnswer: 1,
            difficulty: "above-medium"
        },
        {
            question: "Which programming paradigm treats computation as the evaluation of mathematical functions?",
            options: ["Object-Oriented", "Procedural", "Functional", "Assembly"],
            correctAnswer: 2,
            difficulty: "medium"
        },
        {
            question: "What is the term for AI systems that can perform any intellectual task that humans can do?",
            options: ["Narrow AI", "General AI", "Super AI", "Weak AI"],
            correctAnswer: 1,
            difficulty: "medium"
        },
        {
            question: "Which cryptographic algorithm is considered quantum-resistant?",
            options: ["RSA", "ECC", "Lattice-based", "SHA-256"],
            correctAnswer: 2,
            difficulty: "above-medium"
        },
        {
            question: "In machine learning, what technique prevents overfitting by randomly setting some neurons to zero during training?",
            options: ["Batch Normalization", "Dropout", "Regularization", "Cross-validation"],
            correctAnswer: 1,
            difficulty: "above-medium"
        },
        {
            question: "What is the maximum theoretical efficiency of a Carnot heat engine operating between 300K and 600K?",
            options: ["25%", "50%", "75%", "100%"],
            correctAnswer: 1,
            difficulty: "above-medium"
        },
        {
            question: "Which data structure provides O(1) average time complexity for insertions, deletions, and lookups?",
            options: ["Binary Tree", "Hash Table", "Linked List", "Array"],
            correctAnswer: 1,
            difficulty: "medium"
        },
        {
            question: "In cybersecurity, what attack vector exploits the time difference in cryptographic operations?",
            options: ["SQL Injection", "Timing Attack", "Buffer Overflow", "Man-in-the-Middle"],
            correctAnswer: 1,
            difficulty: "above-medium"
        },
        {
            question: "What is the primary challenge in achieving artificial general intelligence?",
            options: ["Processing Power", "Data Storage", "Transfer Learning", "Energy Consumption"],
            correctAnswer: 2,
            difficulty: "above-medium"
        },
        {
            question: "Which mathematical concept is fundamental to understanding neural network backpropagation?",
            options: ["Linear Algebra", "Chain Rule", "Fourier Transform", "Bayes' Theorem"],
            correctAnswer: 1,
            difficulty: "medium"
        },
        {
            question: "In distributed systems, what problem does the Byzantine Generals Problem address?",
            options: ["Load Balancing", "Consensus", "Data Replication", "Network Partitioning"],
            correctAnswer: 1,
            difficulty: "above-medium"
        },
        {
            question: "What is the fundamental unit of information in quantum computing?",
            options: ["Bit", "Byte", "Qubit", "Photon"],
            correctAnswer: 2,
            difficulty: "medium"
        },
        {
            question: "Which AI ethics principle focuses on ensuring AI systems can explain their decision-making process?",
            options: ["Fairness", "Transparency", "Accountability", "Privacy"],
            correctAnswer: 1,
            difficulty: "medium"
        },
        {
            question: "In complexity theory, what class of problems can be solved in polynomial time by a non-deterministic Turing machine?",
            options: ["P", "NP", "NP-Complete", "PSPACE"],
            correctAnswer: 1,
            difficulty: "above-medium"
        },
        {
            question: "What is the primary advantage of using transformer architecture in large language models?",
            options: ["Lower Memory Usage", "Parallel Processing", "Smaller Model Size", "Faster Training"],
            correctAnswer: 1,
            difficulty: "above-medium"
        },
        {
            question: "Which phenomenon in physics could potentially be exploited for faster-than-light communication if properly harnessed?",
            options: ["Quantum Tunneling", "Quantum Entanglement", "Wormholes", "Time Dilation"],
            correctAnswer: 1,
            difficulty: "above-medium"
        },
        {
            question: "In game theory, what strategy always chooses the option that minimizes the maximum possible loss?",
            options: ["Nash Equilibrium", "Minimax", "Dominant Strategy", "Pareto Optimal"],
            correctAnswer: 1,
            difficulty: "medium"
        },
        {
            question: "What is the primary bottleneck in current AI systems when processing real-world data?",
            options: ["Computational Speed", "Memory Bandwidth", "Context Understanding", "Power Consumption"],
            correctAnswer: 2,
            difficulty: "above-medium"
        },
        {
            question: "What is Bungee.exchange primarily used for?",
            options: ["NFT trading", "Cross-chain token swapping", "Staking rewards", "Mining pools"],
            correctAnswer: 1,
            difficulty: "medium"
        },
        {
            question: "Which routing modes does Bungee.exchange offer for cross-chain swaps?",
            options: ["Auto Mode and Manual Mode", "Fast Mode and Secure Mode", "Basic Mode and Pro Mode", "Direct Mode and Bridge Mode"],
            correctAnswer: 0,
            difficulty: "medium"
        },
        {
            question: "What is the main advantage of Bungee's Auto Mode?",
            options: ["Lower fees", "Automatically selects the best route", "Faster transactions", "Higher security"],
            correctAnswer: 1,
            difficulty: "medium"
        },
        {
            question: "Which of these blockchains is supported by Bungee.exchange?",
            options: ["Bitcoin", "Ethereum", "Litecoin", "Dogecoin"],
            correctAnswer: 1,
            difficulty: "easy"
        },
        {
            question: "How does Bungee ensure security in cross-chain swaps?",
            options: ["Single validator", "Decentralized network of liquidity pools", "Government backing", "Insurance policies"],
            correctAnswer: 1,
            difficulty: "above-medium"
        },
        {
            question: "What technology does Bungee use to enable cross-chain functionality?",
            options: ["Atomic swaps only", "Bridge protocols and AMMs", "Centralized exchanges", "Mining rewards"],
            correctAnswer: 1,
            difficulty: "above-medium"
        },
        {
            question: "Which wallet integration was recently announced by Bungee?",
            options: ["MetaMask", "Bitget Wallet", "Trust Wallet", "Coinbase Wallet"],
            correctAnswer: 1,
            difficulty: "medium"
        },
        {
            question: "What is the primary benefit of using Bungee over traditional exchanges for cross-chain swaps?",
            options: ["Lower transaction costs", "Seamless cross-chain experience", "Better customer support", "Faster KYC process"],
            correctAnswer: 1,
            difficulty: "medium"
        },
        {
            question: "How many blockchain networks does Bungee support for cross-chain transactions?",
            options: ["Less than 5", "5-10", "More than 10", "Only 2"],
            correctAnswer: 2,
            difficulty: "medium"
        },
        {
            question: "What makes Bungee different from other cross-chain platforms?",
            options: ["Only supports Ethereum", "Marketplace of competing off-chain agents", "Requires KYC verification", "Only works with stablecoins"],
            correctAnswer: 1,
            difficulty: "above-medium"
        }
    ],
    oraclePersonality: {
        introductions: [
            "🤖 I AM THE ORACLE! Your inferior minds will face my complex challenges!",
            "💀 Mortals... prepare for tests that will strain your thinking!",
            "⚡ I am the AI overlord! My challenges grow more cunning each round!",
            "🔥 Welcome to intellectual warfare! Can your minds handle the complexity?"
        ]
    }
};

let rooms = {};

// Helper Functions
function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getRandomRiddle(usedIndices = []) {
    const availableRiddles = gameData.riddles.filter((_, index) => !usedIndices.includes(index));
    if (availableRiddles.length === 0) {
        // Reset used indices if all riddles have been used
        console.log('All riddles used, resetting available riddles');
        return { riddle: gameData.riddles[0], index: 0 };
    }
    const randomIndex = Math.floor(Math.random() * availableRiddles.length);
    const selectedRiddle = availableRiddles[randomIndex];
    const originalIndex = gameData.riddles.indexOf(selectedRiddle);
    return { riddle: selectedRiddle, index: originalIndex };
}

function getRandomTriviaQuestion(usedIndices = []) {
    const availableQuestions = gameData.triviaQuestions.filter((_, index) => !usedIndices.includes(index));
    if (availableQuestions.length === 0) {
        console.log('All trivia questions used, resetting available questions');
        return { question: gameData.triviaQuestions[0], index: 0 };
    }
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const selectedQuestion = availableQuestions[randomIndex];
    const originalIndex = gameData.triviaQuestions.indexOf(selectedQuestion);
    return { question: selectedQuestion, index: originalIndex };
}

function getRandomOracleMessage(type) {
    const messages = gameData.oraclePersonality[type] || [];
    if (messages.length === 0) {
        console.warn(`No oracle messages found for type: ${type}`);
        return "The Oracle speaks in mysterious ways...";
    }
    return messages[Math.floor(Math.random() * messages.length)];
}

// Initialize and update round history properly
function initializeRoundHistory(room) {
    console.log('Initializing round history for room:', room.code, 'with players:', room.players.map(p => p.name));
    room.roundHistory = room.players.map(player => ({
        playerName: player.name,
        playerId: player.id,
        rounds: []
    }));
    console.log('Round history initialized:', room.roundHistory);
}

function updateRoundHistory(room, riddleWinner, challengeResults) {
    console.log('Updating round history. Riddle winner:', riddleWinner);
    console.log('Challenge results:', challengeResults);
    console.log('Current round history before update:', room.roundHistory);
    
    // Ensure round history exists and is populated
    if (!room.roundHistory || room.roundHistory.length === 0) {
        console.log('Round history missing or empty, reinitializing...');
        initializeRoundHistory(room);
    }
    
    // Update each player's round result
    room.roundHistory.forEach(playerHistory => {
        const player = room.players.find(p => p.id === playerHistory.playerId || p.name === playerHistory.playerName);
        if (!player) {
            console.log('Player not found for history:', playerHistory.playerName);
            return;
        }
        
        // Skip updating round history for spectators (players who joined mid-game)
        if (player.isSpectator) {
            console.log(`${player.name} is spectator, skipping round history update`);
            return;
        }
        
        // Only add round results for players who were active in this round
        // Check if player joined before or at the start of current round
        const joinedAtRound = player.joinedAtRound || 0;
        if (joinedAtRound >= room.currentRound) {
            console.log(`${player.name} joined at round ${joinedAtRound}, current is ${room.currentRound}, skipping history update`);
            return;
        }
        
        let roundResult = 'L'; // Default to loss
        
        // Check if they won the riddle
        if (player.name === riddleWinner) {
            roundResult = 'W';
            console.log(`${player.name} won riddle this round`);
        } else if (challengeResults && challengeResults.length > 0) {
            // Check if they survived/won the challenge
            const playerResult = challengeResults.find(result => {
                // For text challenges
                if (result.playerName === player.name && result.passed) return true;
                // For fast tapper challenges
                if (result.playerName === player.name && result.won) return true;
                // For group challenges
                if (result.players && result.players.includes(player.name) && result.survived) return true;
                return false;
            });
            
            if (playerResult) {
                roundResult = 'W';
                console.log(`${player.name} won challenge this round`);
            }
        }
        
        playerHistory.rounds.push(roundResult);
        console.log(`${playerHistory.playerName}: ${roundResult} (total rounds: ${playerHistory.rounds.length})`);
    });
    
    console.log('Updated round history:', room.roundHistory);
}

// Better challenge content generation with validation
async function generateChallengeContent(type, roundNumber) {
    if (!genAI) {
        // Creative fallback content that matches the fun vibe
        const fallbacks = {
            negotiator: "Convince your pet parrot to stop repeating your embarrassing phone conversations to guests.",
            detective: "The space station's oxygen generator was sabotaged. Clues: Tool marks on the panel, coffee stains nearby, access card used at 3 AM, and security footage shows a hooded figure. Three suspects: Engineer Jake, Security Chief Maria, and Maintenance Worker Bob. Who is guilty?",
            trivia: "Which ancient wonder of the world was located in Alexandria, Egypt and was destroyed by earthquakes?",
            danger: "You're aboard a malfunctioning AI-controlled spacecraft hurtling toward a black hole. The AI has locked all manual controls and is systematically shutting down life support systems. You have access to the ship's quantum computer core, emergency thruster controls, and a neural interface headset. The AI claims it's 'protecting humanity from itself.' How do you regain control and escape?"
        };
        console.log(`Using fallback for ${type}:`, fallbacks[type]);
        return fallbacks[type] || "Complete this challenge to survive!";
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        let prompt = '';

        switch (type) {
            case 'negotiator':
                prompt = `Create a fun, short negotiation challenge. Keep it simple and playful, 20-30 words max. Player must convince someone to do something. Make it quirky or amusing. Example: "Convince your cat to get off your keyboard while you're working from home."`;
                break;
            case 'detective':
                prompt = `Create a mystery with 4-5 clues and 3 suspects. Use simple words but make it challenging to solve. 60-70 words max. Include red herrings. Example: "Someone poisoned the king's food. Clues: bitter taste, cook was nervous, guard left early, poison bottle in garden, rival prince visited kitchen. Suspects: head cook, royal guard, prince's messenger."`;
                break;
            case 'trivia':
                prompt = `Ask a challenging trivia question about science, history, or geography. Use simple words but make it require good knowledge. Not too obvious. Example: "Which gas makes up about 78% of Earth's atmosphere?" or "What empire built Machu Picchu?"`;
                break;
            case 'danger':
                prompt = `Create a mind-bending survival scenario requiring creative problem-solving. Focus on psychological challenges, illusions, or reality distortions. Make it challenging but solvable with clever thinking. 30-50 words max. Example: "You're in a mirrored room where your reflections move on their own. Spot the real you before the glass shatters."`;
                break;
        }

        // Add timeout and retry logic for API calls
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Gemini API timeout after 10 seconds')), 10000);
        });

        const result = await Promise.race([
            model.generateContent(prompt),
            timeoutPromise
        ]);
        
        if (!result || !result.response) {
            throw new Error('Invalid response from Gemini API');
        }
        
        const response = (await result.response).text();
        
        if (!response || response.trim().length === 0) {
            throw new Error('Empty response from Gemini API');
        }
        
        // Better text cleanup and validation
        let cleaned = response.trim()
            .replace(/^["']|["']$/g, '')
            .replace(/\n+/g, ' ')
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s.,!?;:()\-'"]/g, '')
            .substring(0, 500); // Limit length to prevent extremely long responses
        // Remove special chars that might break UI
        
        // Ensure we have content
        if (!cleaned || cleaned.length < 10) {
            console.log('AI generated empty or too short content, using fallback');
            const fallbacks = {
                negotiator: "Convince your neighbor's loud dog to stop barking at 3 AM by offering it something irresistible.",
                detective: "The space station's oxygen generator was sabotaged. Clues: Tool marks on the panel, coffee stains nearby, access card used at 3 AM, and security footage shows a hooded figure. Three suspects: Engineer Jake, Security Chief Maria, and Maintenance Worker Bob. Who is guilty?",
                trivia: "Which ancient wonder of the world was located in Alexandria, Egypt and was destroyed by earthquakes?",
                danger: "You're in a mirrored room where your reflections move on their own. Spot the real you before the glass shatters."
            };
            cleaned = fallbacks[type] || "Complete this challenge to survive!";
        }
        
        // Cap length based on challenge type
        let maxLength = 400;
        if (type === 'negotiator') {
            maxLength = 150; // Keep negotiator challenges much shorter
        }
        if (cleaned.length > maxLength) {
            cleaned = cleaned.substring(0, maxLength - 3) + "...";
        }
        
        console.log(`Generated medium difficulty ${type} challenge (${cleaned.length} chars): ${cleaned.substring(0, 50)}...`);
        return cleaned;
        
    } catch (e) {
        console.error('AI challenge generation error:', e.message);
        console.error('Error details:', {
            type: e.name,
            message: e.message,
            stack: e.stack ? e.stack.substring(0, 200) : 'No stack trace'
        });
        
        // Enhanced fallbacks with more variety
        const enhancedFallbacks = {
            negotiator: [
                "Convince your smart home AI to unlock the doors after it's decided you're 'not authorized' due to a software glitch.",
                "Persuade your neighbor's overly protective guard dog to let you retrieve your ball from their yard.",
                "Talk your way past a suspicious security guard who thinks you're up to something sneaky.",
                "Convince a stubborn vending machine to give you your snack after it ate your money."
            ],
            detective: [
                "The research facility's experimental AI has gone missing from its secure server. Clues: Unauthorized network access at 2:47 AM, a coffee-stained USB drive, electromagnetic interference in Lab 7, and security footage showing a figure in a lab coat. Three researchers had late access: Dr. Chen (AI ethics specialist), Dr. Rodriguez (cybersecurity expert), and Dr. Kim (neural network architect). Who took the AI and why?",
                "Someone sabotaged the space station's life support. Evidence: Tool marks on the oxygen recycler, mysterious chemical residue, a missing access card, and power fluctuations at 3:15 AM. Suspects: Chief Engineer Martinez, Security Officer Kim, and Maintenance Tech Johnson. Who's the saboteur?",
                "The museum's priceless diamond vanished during the gala. Clues: Disabled security camera, wine stain on the display case, a dropped earring, and the alarm was mysteriously delayed by 5 minutes. Three people were near the exhibit: Curator Sarah, Guest VIP Thompson, and Waiter Miguel. Who stole it?"
            ],
            trivia: [
                "What is the theoretical maximum processing speed limit imposed by the laws of physics on any computer?",
                "Which programming language was specifically designed to be impossible to learn or use effectively?",
                "What phenomenon allows quantum computers to potentially solve certain problems exponentially faster than classical computers?"
            ],
            danger: [
                "You're in a mirrored room where your reflections move on their own. Spot the real you before the glass shatters. The mirrors seem to show different versions of yourself, each moving independently. How do you identify which one is real?",
                "You're trapped in a room where gravity keeps shifting directions every 30 seconds. The exit door is on the ceiling, but it's locked with a puzzle that requires steady hands. How do you solve it?",
                "You're in a library where the books rewrite themselves when you're not looking directly at them. You need to find a specific piece of information, but every time you look away, the text changes. How do you get the answer?"
            ]
        };
        
        // Select a random fallback for variety
        const fallbackArray = enhancedFallbacks[type] || ["Face this challenging test!"];
        const randomFallback = fallbackArray[Math.floor(Math.random() * fallbackArray.length)];
        
        console.log(`Using enhanced fallback for ${type}: ${randomFallback.substring(0, 50)}...`);
        return randomFallback;
    }
}

// ENHANCED: Smart AI judging that rewards creativity but shuts down lazy shortcuts
async function evaluatePlayerResponse(challengeContent, playerResponse, challengeType) {
    // Detect auto-submitted responses
    const isAutoSubmitted = playerResponse.startsWith('[Auto-submitted]');
    const cleanResponse = isAutoSubmitted ? playerResponse.replace('[Auto-submitted] ', '') : playerResponse;
    
    if (!genAI) {
        return { 
            pass: Math.random() > 0.4, 
            feedback: isAutoSubmitted ? "Auto-submitted response received." : "No AI available - random result!" 
        };
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        let evaluationPrompt = '';
        
        // Detect oversmart shortcuts that should be brutally shut down
        const lazyShortcuts = [
            /shoot|gun|weapon|kill|murder|violence/i,
            /teleport|magic|supernatural|wizard|spell/i,
            /cheat|hack|exploit|glitch|bug/i,
            /call.*police|call.*911|call.*help/i,
            /ignore|skip|don't|won't|refuse/i,
            /easy|simple|just.*do|obviously/i,
            /run.*away|just.*run|simply.*run/i,
            /use.*phone.*call|call.*someone/i,
            /break.*window|smash.*glass/i
        ];
        
        // Detect genuinely clever responses that should always pass
        const cleverIndicators = [
            /distract|diversion|misdirect/i,
            /slowly|carefully|quietly/i,
            /food|bait|lure|attract/i,
            /mirror|reflection|light|blink|eye/i,
            /observe|watch|look|examine|study/i,
            /test|try|experiment|check/i,
            /pattern|difference|unique|distinguish/i,
            /sound|noise|whistle/i,
            /patience|wait|timing/i,
            /psychology|behavior|instinct/i,
            /creative|innovative|unconventional/i,
            /fiction|story|imagine|pretend/i
        ];
        
        const hasLazyShortcut = lazyShortcuts.some(pattern => pattern.test(cleanResponse));
        const hasCleverIndicators = cleverIndicators.some(pattern => pattern.test(cleanResponse));
        
        switch (challengeType) {
            case 'negotiator':
                if (hasLazyShortcut && !hasCleverIndicators) {
                    evaluationPrompt = `This negotiation attempt contains an oversmart shortcut: "${cleanResponse}"\n\nSituation: ${challengeContent}\n\nThis is clearly trying to avoid the actual negotiation challenge with lazy solutions like violence, magic, or ignoring the problem. Respond with FAIL and give a brutal, sharp comeback explaining why this approach completely misses the point and would fail spectacularly. Be witty and cutting in your response. Keep under 350 characters.`;
                } else if (hasCleverIndicators) {
                    evaluationPrompt = `Evaluate this clever negotiation attempt:\n\nSituation: ${challengeContent}\n\nPlayer's approach: "${cleanResponse}"\n\nThis response shows creative thinking elements. Reward genuine creativity, psychological insights, and clever approaches. Look for: food bribes, creative distractions, emotional appeals, understanding behavior, or innovative solutions. PASS creative approaches that show real thought. Answer PASS or FAIL with encouraging feedback. Keep under 350 characters. ${isAutoSubmitted ? 'NOTE: Auto-submitted when time ran out.' : ''}`;
                } else {
                    evaluationPrompt = `Evaluate this negotiation attempt:\n\nSituation: ${challengeContent}\n\nPlayer's approach: "${cleanResponse}"\n\nDoes this show genuine creative thinking? Look for: clever bribing with food, creative distractions, sneaky approaches, emotional appeals, logical compromises, or other inventive solutions. Even risky plans should pass if they show real creativity and effort. Answer PASS or FAIL with encouraging or constructive feedback. Keep under 350 characters. ${isAutoSubmitted ? 'NOTE: Auto-submitted when time ran out.' : ''}`;
                }
                break;
                
            case 'danger':
                if (hasLazyShortcut && !hasCleverIndicators) {
                    evaluationPrompt = `This survival plan contains an oversmart shortcut: "${cleanResponse}"\n\nDanger: ${challengeContent}\n\nThis avoids the actual psychological challenge with lazy solutions like violence, magic, or ignoring the problem. Respond with FAIL and give a sharp explanation of why this approach misses the point of the mind-bending scenario. Be cutting about their lack of creative thinking. Keep under 350 characters.`;
                } else if (hasCleverIndicators) {
                    evaluationPrompt = `Evaluate this clever survival plan:\n\nDanger: ${challengeContent}\n\nPlayer's plan: "${cleanResponse}"\n\nThis response shows creative thinking elements. Reward genuine creativity, psychological insights, and innovative approaches. Look for: observation skills, pattern recognition, creative testing methods, or fictional but logical solutions. PASS creative approaches that show real thought, even if fictional. Answer PASS or FAIL with encouraging feedback. Keep under 350 characters. ${isAutoSubmitted ? 'NOTE: Auto-submitted when time ran out.' : ''}`;
                } else {
                    evaluationPrompt = `Evaluate this survival plan:\n\nDanger: ${challengeContent}\n\nPlayer's plan: "${cleanResponse}"\n\nDoes this show creative problem-solving for this mind-bending scenario? Look for: observation techniques, pattern testing, psychological insights, creative identification methods, or innovative fictional solutions. Even unconventional or fictional approaches should PASS if they demonstrate genuine creative thinking and logical reasoning. Answer PASS or FAIL with detailed reasoning. Keep under 350 characters. ${isAutoSubmitted ? 'NOTE: Auto-submitted when time ran out.' : ''}`;
                }
                break;
                
            case 'detective':
                if (hasLazyShortcut && !hasCleverIndicators) {
                    evaluationPrompt = `This detective conclusion tries to shortcut the mystery: "${cleanResponse}"\n\nMystery: ${challengeContent}\n\nThis avoids actually analyzing the clues and evidence provided. Respond with FAIL and a sharp explanation of why good detective work requires examining evidence, not taking lazy shortcuts. Be cutting about their lack of deductive reasoning. Keep under 350 characters.`;
                } else if (hasCleverIndicators) {
                    evaluationPrompt = `Evaluate this clever detective work:\n\nMystery: ${challengeContent}\n\nPlayer's conclusion: "${cleanResponse}"\n\nThis response shows analytical thinking elements. Reward logical deduction, evidence analysis, and creative reasoning. Look for: careful consideration of clues, psychological insights, or innovative connections. PASS thoughtful analysis even if conclusion isn't perfect. Answer PASS or FAIL with encouraging feedback. Keep under 350 characters. ${isAutoSubmitted ? 'NOTE: Auto-submitted when time ran out.' : ''}`;
                } else {
                    evaluationPrompt = `Evaluate this detective conclusion:\n\nMystery: ${challengeContent}\n\nPlayer's conclusion: "${cleanResponse}"\n\nDid they analyze the clues logically and reach a reasonable conclusion? Even if not perfect, reward genuine deductive reasoning and consideration of evidence. Look for thoughtful analysis over correct guesses. Answer PASS or FAIL with constructive feedback. Keep under 350 characters. ${isAutoSubmitted ? 'NOTE: Auto-submitted when time ran out.' : ''}`;
                }
                break;
                
            case 'trivia':
                evaluationPrompt = `Evaluate this trivia answer:\n\nQuestion: ${challengeContent}\n\nPlayer answered: "${cleanResponse}"\n\nIs this correct or demonstrates good knowledge? Consider partial credit for close attempts or showing understanding of the topic. Answer PASS or FAIL with brief explanation. Keep under 350 characters. ${isAutoSubmitted ? 'NOTE: Auto-submitted when time ran out.' : ''}`;
                break;
                
            default:
                evaluationPrompt = `Evaluate this response:\n\nChallenge: ${challengeContent}\n\nResponse: ${cleanResponse}\n\nDoes this show genuine effort and creative thinking? PASS or FAIL with reason. Keep under 350 characters. ${isAutoSubmitted ? 'NOTE: Auto-submitted when time ran out.' : ''}`;
        }

        // Add timeout and retry logic for evaluation API calls
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Gemini evaluation timeout after 8 seconds')), 8000);
        });

        const result = await Promise.race([
            model.generateContent(evaluationPrompt),
            timeoutPromise
        ]);
        
        if (!result || !result.response) {
            throw new Error('Invalid response from Gemini evaluation API');
        }
        
        const response = (await result.response).text();
        
        if (!response || response.trim().length === 0) {
            throw new Error('Empty response from Gemini evaluation API');
        }
        
        const pass = /PASS/i.test(response);
        let feedback = response.replace(/PASS|FAIL/gi, '').trim();
        
        // Better feedback cleanup
        feedback = feedback
            .replace(/[^\w\s.,!?;:()\-'"]/g, '') // Remove special chars
            .replace(/\s+/g, ' ')
            .trim();

        // Truncate if still too long
        const MAX_FEEDBACK_LENGTH = 350;
        if (feedback.length > MAX_FEEDBACK_LENGTH) {
            feedback = feedback.substring(0, MAX_FEEDBACK_LENGTH - 3) + '...';
        }
        
        // Ensure we have some feedback
        if (!feedback || feedback.length < 5) {
            if (hasLazyShortcut && !hasCleverIndicators) {
                feedback = pass ? "Surprisingly workable despite shortcuts." : "Lazy shortcuts don't work here. Try harder.";
            } else if (hasCleverIndicators) {
                feedback = pass ? "Excellent creative thinking!" : "Creative approach but needs refinement.";
            } else {
                feedback = pass ? "Good creative thinking!" : "Needs more clever approach.";
            }
        }
        
        // Add auto-submit indicator
        if (isAutoSubmitted) {
            feedback = `⏰ ${feedback}`;
        }
        
        const evaluationType = hasLazyShortcut && !hasCleverIndicators ? 'LAZY SHORTCUT' : 
                              hasCleverIndicators ? 'CLEVER RESPONSE' : 'STANDARD';
        console.log(`AI Evaluation (${evaluationType}): ${pass ? 'PASS' : 'FAIL'} - "${feedback}"`);
        return { pass, feedback };
        
    } catch (e) {
        console.error('AI evaluation error:', e.message);
        console.error('Evaluation error details:', {
            type: e.name,
            message: e.message,
            challengeType: challengeType,
            responseLength: cleanResponse.length,
            stack: e.stack ? e.stack.substring(0, 200) : 'No stack trace'
        });
        
        // Improved fallback logic based on response quality
        let fallbackPass = false;
        let fallbackFeedback = "The Oracle's judgment is unclear at this time.";
        
        // Basic heuristics when AI fails
        if (cleanResponse.length > 20) {
            // Longer responses get benefit of doubt
            fallbackPass = Math.random() > 0.3;
            fallbackFeedback = "Detailed response shows effort. Oracle systems experiencing interference.";
        } else if (cleanResponse.length > 5) {
            // Short but not empty responses
            fallbackPass = Math.random() > 0.5;
            fallbackFeedback = "Brief but present response. Oracle evaluation systems disrupted.";
        } else {
            // Very short responses are likely poor
            fallbackPass = Math.random() > 0.7;
            fallbackFeedback = "Minimal response detected. Oracle judgment hindered by system errors.";
        }
        
        // Add auto-submit indicator
        if (isAutoSubmitted) {
            fallbackFeedback = `⏰ ${fallbackFeedback}`;
        }
        
        console.log(`Fallback evaluation result: ${fallbackPass ? 'PASS' : 'FAIL'} - "${fallbackFeedback}"`);
        return { 
            pass: fallbackPass, 
            feedback: fallbackFeedback
        };
    }
}

// Assign Different Challenge to Each Non-Winner with 40 second timing
async function startChallengePhase(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    // Filter out spectators and riddle winner
    const activePlayers = room.players.filter(p => !p.isSpectator);
    const nonWinners = activePlayers.filter(p => p.name !== room.riddleWinner);
    
    if (nonWinners.length === 0) {
        endRound(roomCode, []);
        return;
    }

    room.gameState = 'challenge-phase';
    room.challengeResponses = {};
    // Use shuffled challenge types for this room
    const challengeTypeIndex = (room.currentRound - 1) % room.shuffledChallengeTypes.length;
    const challengeType = room.shuffledChallengeTypes[challengeTypeIndex];

    console.log(`Round ${room.currentRound}: ${challengeType} challenge (40 seconds)`);
    io.to(roomCode).emit('oracle-speaks', {
        message: `Round ${room.currentRound}: Face my ${challengeType.toUpperCase()} challenge!`,
        type: 'challenge-intro'
    });
    setTimeout(async () => {
        if (challengeType === 'fastTapper') {
            // Fast Tapper Challenge
            room.tapResults = {};
            io.to(roomCode).emit('fast-tapper-start', {
                participants: nonWinners.map(p => p.name),
                duration: 10
            });
            
            room.challengeTimer = setTimeout(() => {
                evaluateFastTapperResults(roomCode);
            }, 12000);
            
        } else if (challengeType === 'multipleChoiceTrivia') {
            // Multiple Choice Trivia Challenge
            const { question: triviaQuestion, index } = getRandomTriviaQuestion(room.usedTriviaIndices || []);
            if (!room.usedTriviaIndices) room.usedTriviaIndices = [];
            room.usedTriviaIndices.push(index);
            
            room.currentTriviaQuestion = triviaQuestion;
            room.triviaAnswers = {};
            
            io.to(roomCode).emit('trivia-challenge-start', {
                question: triviaQuestion.question,
                options: triviaQuestion.options,
                participants: nonWinners.map(p => p.name),
                timeLimit: 45
            });
            
            room.challengeTimer = setTimeout(() => {
                evaluateTriviaResults(roomCode);
            }, 48000);
            
        } else {
            // Text-based challenges with 40 seconds
            // Text-based challenges with dynamic time limits
let challengeContent = await generateChallengeContent(challengeType, room.currentRound);

// Validate challenge content before sending
if (!challengeContent || challengeContent.trim().length === 0) {
    console.error('Empty challenge content generated, using emergency fallback');
    challengeContent = "Describe your strategy for handling a difficult situation that requires creative thinking.";
}

// Set time limit based on challenge type
let timeLimit = 60; // Default for detective, trivia, danger
if (challengeType === 'negotiator') {
    timeLimit = 60; // Same time for negotiator challenges
}

console.log(`Sending ${challengeType} challenge content (${challengeContent.length} chars): ${challengeContent.substring(0, 50)}...`);
io.to(roomCode).emit('text-challenge-start', {
    challengeType: challengeType,
    challengeContent: challengeContent,
    participants: nonWinners.map(p => p.name),
    timeLimit: timeLimit
});
room.currentChallengeType = challengeType;
room.currentChallengeContent = challengeContent;

// Set timer with 5 second buffer
room.challengeTimer = setTimeout(() => {
    evaluateTextChallengeResults(roomCode);
}, timeLimit * 1000 + 8000);
    }
  },500);
}
// Evaluate Trivia Results
async function evaluateTriviaResults(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    const triviaEntries = Object.entries(room.triviaAnswers);
    if (triviaEntries.length === 0) {
        endRound(roomCode, []);
        return;
    }

    const correctAnswer = room.currentTriviaQuestion.correctAnswer;
    let winners = [];
    let earliest = Infinity;

    // Find winners (correct answers, earliest first)
    triviaEntries.forEach(([playerId, answerData]) => {
        if (answerData.answer === correctAnswer) {
            if (answerData.timestamp < earliest) {
                earliest = answerData.timestamp;
                winners = [playerId];
            } else if (answerData.timestamp === earliest) {
                winners.push(playerId);
            }
        }
    });

    // Award points to winners
    winners.forEach(playerId => {
        const player = room.players.find(p => p.id === playerId);
        if (player) player.score += 1;
    });

    const results = triviaEntries.map(([playerId, answerData]) => {
        const player = room.players.find(p => p.id === playerId);
        return {
            playerName: player?.name || 'Unknown',
            answer: answerData.answer,
            correct: answerData.answer === correctAnswer,
            won: winners.includes(playerId),
            selectedOption: room.currentTriviaQuestion.options[answerData.answer]
        };
    }).sort((a, b) => a.timestamp - b.timestamp);

    io.to(roomCode).emit('trivia-results', {
        results: results,
        correctAnswer: correctAnswer,
        correctOption: room.currentTriviaQuestion.options[correctAnswer],
        question: room.currentTriviaQuestion.question
    });

    setTimeout(() => {
        endRound(roomCode, results);
    }, 6000);
}

// Evaluate Fast Tapper Results
async function evaluateFastTapperResults(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    const tapEntries = Object.entries(room.tapResults);
    if (tapEntries.length === 0) {
        endRound(roomCode, []);
        return;
    }

    let maxTaps = 0;
    let winners = [];
    tapEntries.forEach(([playerId, taps]) => {
        if (taps > maxTaps) {
            maxTaps = taps;
            winners = [playerId];
        } else if (taps === maxTaps) {
            winners.push(playerId);
        }
    });
    // Award points to winners
    winners.forEach(playerId => {
        const player = room.players.find(p => p.id === playerId);
        if (player) player.score += 1;
    });
    const results = tapEntries.map(([playerId, taps]) => {
        const player = room.players.find(p => p.id === playerId);
        return {
            playerName: player?.name || 'Unknown',
            taps: taps,
            won: winners.includes(playerId)
        };
    }).sort((a, b) => b.taps - a.taps);
    io.to(roomCode).emit('fast-tapper-results', {
        results: results,
        maxTaps: maxTaps
    });
    setTimeout(() => {
        endRound(roomCode, results);
    }, 6000);
}

// Evaluate Text Challenge Results
async function evaluateTextChallengeResults(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;
    const responses = Object.entries(room.challengeResponses);
    if (responses.length === 0) {
        endRound(roomCode, []);
        return;
    }

    io.to(roomCode).emit('oracle-speaks', {
        message: "The Oracle carefully evaluates your responses...",
        type: 'evaluation'
    });
    const evaluationResults = [];

    for (const [playerId, response] of responses) {
        const player = room.players.find(p => p.id === playerId);
        if (!player) continue;

        const evaluation = await evaluatePlayerResponse(
            room.currentChallengeContent, 
            response, 
            room.currentChallengeType
        );
        if (evaluation.pass) {
            player.score += 1;
        }

        evaluationResults.push({
            playerName: player.name,
            response: response,
            passed: evaluation.pass,
            feedback: evaluation.feedback
        });
        // Send individual result to player
        io.to(playerId).emit('challenge-individual-result', {
            passed: evaluation.pass,
            feedback: evaluation.feedback,
            response: response
        });
        await new Promise(resolve => setTimeout(resolve, 1500)); // Reduced from 3000ms to 1500ms for faster evaluation flow
    }

    setTimeout(() => {
        endRound(roomCode, evaluationResults);
    }, 2000); // Reduced from 5000ms to 2000ms to move faster to round summary
}

// Game Flow Functions
function startNewRound(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;
    
    room.currentRound++;
    room.gameState = 'riddle-phase';
    
    // Activate spectators at the start of new rounds
    room.players.forEach(player => {
        if (player.isSpectator && player.joinedAtRound < room.currentRound) {
            console.log(`Activating spectator ${player.name} for round ${room.currentRound}`);
            player.isSpectator = false;
            
            // Clear their round history - they start fresh from this round
            if (room.roundHistory) {
                const playerHistory = room.roundHistory.find(h => h.playerId === player.id || h.playerName === player.name);
                if (playerHistory) {
                    console.log(`Clearing round history for newly activated player ${player.name}`);
                    playerHistory.rounds = []; // Start fresh, no pre-filled losses
                }
            }
            
            // Notify player they're now active
            const socket = io.sockets.sockets.get(player.id);
            if (socket) {
                socket.emit('spectator-activated', {
                    message: `You're now an active player starting from round ${room.currentRound}!`,
                    round: room.currentRound
                });
            }
        }
    });
    
    const { riddle, index } = getRandomRiddle(room.usedRiddleIndices);
    room.currentRiddle = riddle;
    room.usedRiddleIndices.push(index);
    
    room.riddleWinner = null;
    room.riddleAnswers = {};
    room.challengeResponses = {};
    room.tapResults = {};
    
    // Initialize round history on first round OR if it's missing
    if (room.currentRound === 1 || !room.roundHistory || room.roundHistory.length === 0) {
        console.log('First round or missing round history, reinitializing...');
        initializeRoundHistory(room);
    }
    
    io.to(roomCode).emit('oracle-speaks', {
        message: getRandomOracleMessage('introductions'),
        type: 'introduction'
    });
    setTimeout(() => {
        io.to(roomCode).emit('riddle-presented', {
            riddle: room.currentRiddle,
            round: room.currentRound,
            maxRounds: room.maxRounds
        });
        room.timeRemaining = 45;
        room.riddleTimer = setInterval(() => {
            room.timeRemaining--;
            if (room.timeRemaining <= 0) {
                clearInterval(room.riddleTimer);
                endRiddlePhase(roomCode);
            }
        }, 1000);
    }, 2500);
}

function endRiddlePhase(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;
    
    // Clear the timer if it's still running
    if (room.riddleTimer) {
        clearInterval(room.riddleTimer);
        room.riddleTimer = null;
    }
    
    const correctAnswer = room.currentRiddle.answer.toUpperCase();
    let winner = null, earliest = Infinity;
    for (const [pid, ans] of Object.entries(room.riddleAnswers)) {
        if (ans.answer.toUpperCase() === correctAnswer && ans.timestamp < earliest) {
            earliest = ans.timestamp;
            const player = room.players.find(p => p.id === pid);
            if (player) { winner = player.name; room.riddleWinner = winner; }
        }
    }
    if (winner) {
        const player = room.players.find(p => p.name === winner);
        if (player) player.score += 1;
    }
    
    const answersDisplay = Object.entries(room.riddleAnswers).map(([pid, ans]) => {
        const player = room.players.find(p => p.id === pid);
        return {
            playerName: player?.name ?? 'Unknown',
            answer: ans.answer,
            correct: ans.answer.toUpperCase() === correctAnswer,
            winner: player?.name === winner,
            timestamp: ans.timestamp
        };
    }).sort((a, b) => a.timestamp - b.timestamp);
    io.to(roomCode).emit('riddle-results-reveal', {
        winner: winner,
        correctAnswer: room.currentRiddle.answer,
        message: winner ? `${winner} solved it first!` : `No one solved my riddle!`,
        allAnswers: answersDisplay
    });
    setTimeout(() => {
        startChallengePhase(roomCode);
    }, 4000); // Increased from 1500ms to 4000ms (4 seconds) to give players time to read results
}

// FIXED: Enhanced endRound function with improved tie-breaking
function endRound(roomCode, challengeResults) {
    const room = rooms[roomCode];
    if (!room) return;
    
    console.log('End round called for room:', roomCode);
    console.log('Room players:', room.players.map(p => p.name));
    console.log('Round history before update:', room.roundHistory);
    // Ensure round history exists before updating
    if (!room.roundHistory || room.roundHistory.length === 0) {
        console.log('Round history missing in endRound, reinitializing...');
        initializeRoundHistory(room);
    }
    
    // Always ensure round history is updated before emitting
    updateRoundHistory(room, room.riddleWinner, challengeResults);
    console.log('Emitting round summary with round history:', room.roundHistory);
    
    // Always include roundHistory in emission
    const roundHistoryToSend = room.roundHistory && room.roundHistory.length > 0 ? room.roundHistory : [];
    
    io.to(roomCode).emit('round-summary', {
        round: room.currentRound,
        maxRounds: room.maxRounds,
        players: room.players,
        riddleWinner: room.riddleWinner,
        challengeResults: challengeResults,
        roundHistory: roundHistoryToSend
    });
    if (room.currentRound >= room.maxRounds) {
        setTimeout(() => {
            // FIXED: Enhanced winner selection for the final game-over
            const finalScores = Object.values(rooms[roomCode].players).sort((a, b) => b.score - a.score);
            const winner = finalScores[0];
            
            // Check for ties
            const tiedPlayers = finalScores.filter(player => player.score === winner.score);
            
            let winnerMessage = `The Oracle has chosen!`;
            if (tiedPlayers.length > 1) {
                winnerMessage = `It's a tie! The Oracle declares a shared victory!`;
            } else if (winner.score === 0) {
                winnerMessage = `No one pleased the Oracle. Humanity is doomed.`;
            }

            io.to(roomCode).emit('game-over', {
                winner: winner,
                tied: tiedPlayers.length > 1,
                message: winnerMessage,
                scores: finalScores,
                roundHistory: room.roundHistory
            });
        }, 12000);
    } else {
        setTimeout(() => {
            startNewRound(roomCode);
        }, 12000);
    }
}

// Socket Events
io.on('connection', (socket) => {
    socket.on('create-room', (data) => {
        const roomCode = generateRoomCode();
        const newRoom = {
            code: roomCode,
            players: [{ id: socket.id, name: data.playerName, score: 0 }],
            gameState: 'waiting',
            currentRound: 0,
            maxRounds: 5,
            currentRiddle: null,
            riddleWinner: null,
            riddleAnswers: {},
            challengeResponses: {},
            tapResults: {},
            triviaAnswers: {},
            currentChallengeType: null,
            currentChallengeContent: null,
            currentTriviaQuestion: null,
            usedRiddleIndices: [],
            usedTriviaIndices: [],
            timeRemaining: 0,
            riddleTimer: null,
            challengeTimer: null,
            roundHistory: [],
            ownerId: socket.id,
            shuffledChallengeTypes: shuffleArray(BASE_CHALLENGE_TYPES) // Shuffle challenges for this room
        };
        
        rooms[roomCode] = newRoom;
        socket.join(roomCode);
        
        console.log('Room created:', roomCode, 'with player:', data.playerName);
        
        socket.emit('room-created', { 
            roomCode: roomCode, 
            playerName: data.playerName,
            isOwner: true
        });
    });

    socket.on('join-room', (data) => {
        const room = rooms[data.roomCode];
        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }
        if (room.players.length >= 8) {
            socket.emit('error', { message: 'Room is full' });
            return;
        }
        
        // Check if player name already exists
        const existingPlayer = room.players.find(p => p.name === data.playerName);
        if (existingPlayer) {
            socket.emit('error', { message: 'Player name already taken' });
            return;
        }
        
        // Allow joining games in progress - add as spectator initially
        let isSpectator = false;
        let playerScore = 0;
        
        if (room.gameState !== 'waiting') {
            console.log(`Player ${data.playerName} joining game in progress in room ${data.roomCode}`);
            isSpectator = true;
            // They'll become active in the next round
        }
        
        const newPlayer = { 
            id: socket.id, 
            name: data.playerName, 
            score: playerScore,
            isSpectator: isSpectator,
            joinedAtRound: room.currentRound || 0
        };
        
        room.players.push(newPlayer);
        
        // Initialize round history for new player if game is ongoing
        if (room.gameState !== 'waiting' && room.roundHistory) {
            // Add player to round history with losses for missed rounds
            const newPlayerHistory = {
                playerName: data.playerName,
                playerId: socket.id,
                rounds: []
            };
            
            // Fill in losses for rounds they missed
            for (let i = 0; i < room.currentRound; i++) {
                newPlayerHistory.rounds.push('L');
            }
            
            room.roundHistory.push(newPlayerHistory);
            console.log(`Added ${data.playerName} to round history with ${room.currentRound} missed rounds`);
        }
        
        socket.join(data.roomCode);
        console.log('Player joined:', data.playerName, 'in room:', data.roomCode, 'as', isSpectator ? 'spectator' : 'active player');
        
        socket.emit('join-success', {
            roomCode: data.roomCode,
            playerName: data.playerName,
            isOwner: false,
            isSpectator: isSpectator,
            gameState: room.gameState,
            currentRound: room.currentRound || 0,
            maxRounds: room.maxRounds
        });
        
        // Send current game state to new player if game is in progress
        if (room.gameState !== 'waiting') {
            socket.emit('game-state-update', {
                gameState: room.gameState,
                currentRound: room.currentRound,
                maxRounds: room.maxRounds,
                players: room.players,
                message: isSpectator ? 'You joined as a spectator. You\'ll participate from the next round.' : 'Game in progress'
            });
            
            // If in riddle phase, send current riddle
            if (room.gameState === 'riddle-phase' && room.currentRiddle) {
                socket.emit('riddle-presented', {
                    riddle: room.currentRiddle,
                    round: room.currentRound,
                    maxRounds: room.maxRounds,
                    isSpectator: true
                });
            }
        }
        
        io.to(data.roomCode).emit('player-joined', {
            players: room.players,
            newPlayer: data.playerName,
            isSpectator: isSpectator
        });
    });

    socket.on('start-game', (data) => {
        const room = rooms[data.roomCode];
        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }
        if (room.ownerId !== socket.id) {
            socket.emit('error', { message: 'Only the room owner can start the game' });
            return;
        }
        if (room.players.length < 2) {
            socket.emit('error', { message: 'Need at least 2 players to start' });
            return;
        }
        if (room.gameState !== 'waiting') {
            socket.emit('error', { message: 'Game already started' });
            return;
        }
        startNewRound(data.roomCode);
    });
    socket.on('submit-riddle-answer', (data) => {
        try {
            if (!data || !data.roomCode || !data.answer) {
                console.warn('Invalid riddle answer submission:', data);
                return;
            }
            const room = rooms[data.roomCode];
            if (!room || room.gameState !== 'riddle-phase') return;
            const player = room.players.find(p => p.id === socket.id);
            if (!player || player.isSpectator) return; // Spectators can't submit answers
            
            if (!room.riddleAnswers[socket.id]) {
                room.riddleAnswers[socket.id] = {
                    answer: data.answer.trim(),
                    timestamp: Date.now(),
                    playerName: player.name
                };
                
                const activePlayers = room.players.filter(p => !p.isSpectator);
                
                io.to(data.roomCode).emit('answer-submitted', {
                    player: player.name,
                    totalSubmissions: Object.keys(room.riddleAnswers).length,
                    totalPlayers: activePlayers.length
                });
                
                // Check if all active players have answered
                if (Object.keys(room.riddleAnswers).length === activePlayers.length) {
                    console.log('All active players submitted riddle answer. Ending riddle phase early.');
                    // Clear the riddle timer if it's still running
                    if (room.riddleTimer) {
                        clearInterval(room.riddleTimer);
                        room.riddleTimer = null;
                    }
                    endRiddlePhase(data.roomCode);
                }
            }
        } catch (error) {
            console.error('Error in submit-riddle-answer:', error);
            socket.emit('error', { message: 'Failed to submit answer' });
        }
    });
    socket.on('submit-challenge-response', (data) => {
        const room = rooms[data.roomCode];
        if (!room || room.gameState !== 'challenge-phase') return;
        const player = room.players.find(p => p.id === socket.id);
        if (!player || player.isSpectator || player.name === room.riddleWinner) return;
        
        room.challengeResponses[socket.id] = data.response.trim();
        
        const activePlayers = room.players.filter(p => !p.isSpectator);
        const expectedSubmissions = activePlayers.filter(p => p.name !== room.riddleWinner).length;
        const totalSubmissions = Object.keys(room.challengeResponses).length;
        
        io.to(data.roomCode).emit('challenge-response-submitted', {
            player: player.name,
            totalSubmissions: totalSubmissions,
            expectedSubmissions: expectedSubmissions
        });
        
        // Check if all players have responded - auto advance
        if (totalSubmissions === expectedSubmissions) {
            console.log('All active non-winners submitted challenge response. Ending challenge phase early.');
            if (room.challengeTimer) {
                clearTimeout(room.challengeTimer);
                room.challengeTimer = null;
            }
            evaluateTextChallengeResults(data.roomCode);
        }
    });
    socket.on('submit-tap-result', (data) => {
        const room = rooms[data.roomCode];
        if (!room || room.gameState !== 'challenge-phase') return;
        const player = room.players.find(p => p.id === socket.id);
        if (!player || player.isSpectator || player.name === room.riddleWinner) return;
        
        room.tapResults[socket.id] = data.taps;
        
        const activePlayers = room.players.filter(p => !p.isSpectator);
        
        io.to(data.roomCode).emit('tap-result-submitted', {
            player: player.name,
            taps: data.taps,
            totalSubmissions: Object.keys(room.tapResults).length,
            expectedSubmissions: activePlayers.filter(p => p.name !== room.riddleWinner).length
        });
    });

    socket.on('submit-trivia-answer', (data) => {
        const room = rooms[data.roomCode];
        if (!room || room.gameState !== 'challenge-phase') return;
        const player = room.players.find(p => p.id === socket.id);
        if (!player || player.isSpectator || player.name === room.riddleWinner) return;
        
        if (!room.triviaAnswers[socket.id]) {
            room.triviaAnswers[socket.id] = {
                answer: data.answer,
                timestamp: Date.now(),
                playerName: player.name
            };
            
            const activePlayers = room.players.filter(p => !p.isSpectator);
            const expectedSubmissions = activePlayers.filter(p => p.name !== room.riddleWinner).length;
            
            io.to(data.roomCode).emit('trivia-answer-submitted', {
                player: player.name,
                totalSubmissions: Object.keys(room.triviaAnswers).length,
                expectedSubmissions: expectedSubmissions
            });
            
            // Check if all active players have answered
            if (Object.keys(room.triviaAnswers).length === expectedSubmissions) {
                console.log('All active non-winners submitted trivia answer. Ending trivia phase early.');
                if (room.challengeTimer) {
                    clearTimeout(room.challengeTimer);
                    room.challengeTimer = null;
                }
                evaluateTriviaResults(data.roomCode);
            }
        }
    });
    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        
        Object.keys(rooms).forEach(roomCode => {
            const room = rooms[roomCode];
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            
            if (playerIndex !== -1) {
                const disconnectedPlayer = room.players[playerIndex];
                const playerName = disconnectedPlayer.name;
                console.log(`Player ${playerName} disconnected from room ${roomCode} during ${room.gameState}`);
                
                // Handle disconnect based on game state
                handlePlayerDisconnect(room, roomCode, socket.id, playerName);
                
                // Remove player from room
                room.players.splice(playerIndex, 1);
                
                // Check if room should be deleted
                if (room.players.length === 0) {
                    console.log(`Room ${roomCode} is empty, cleaning up`);
                    cleanupRoom(room, roomCode);
                    delete rooms[roomCode];
                } else {
                    // Update ownership if owner left
                    if (disconnectedPlayer.id === room.ownerId && room.players.length > 0) {
                        room.ownerId = room.players[0].id;
                        console.log(`Ownership transferred to ${room.players[0].name} in room ${roomCode}`);
                    }
                    
                    // Notify remaining players
                    io.to(roomCode).emit('player-left', {
                        players: room.players,
                        leftPlayer: playerName,
                        gameState: room.gameState
                    });
                    
                    // Check if game can continue
                    checkGameContinuation(room, roomCode);
                }
            }
        });
    });
    
    // Helper function to handle player disconnect based on game state
    function handlePlayerDisconnect(room, roomCode, socketId, playerName) {
        console.log(`Handling disconnect for ${playerName} in ${room.gameState} state`);
        
        switch (room.gameState) {
            case 'riddle-phase':
                // Auto-submit empty answer if they haven't answered
                if (!room.riddleAnswers[socketId]) {
                    room.riddleAnswers[socketId] = {
                        answer: '[DISCONNECTED]',
                        timestamp: Date.now(),
                        playerName: playerName
                    };
                    console.log(`Auto-submitted disconnection for ${playerName} in riddle phase`);
                }
                break;
                
            case 'challenge-phase':
                // Handle different challenge types
                if (room.currentChallengeType === 'fastTapper') {
                    if (!room.tapResults[socketId]) {
                        room.tapResults[socketId] = 0; // 0 taps
                        console.log(`Auto-submitted 0 taps for disconnected ${playerName}`);
                    }
                } else if (room.currentChallengeType === 'multipleChoiceTrivia') {
                    if (!room.triviaAnswers[socketId]) {
                        room.triviaAnswers[socketId] = {
                            answer: -1, // Invalid answer
                            timestamp: Date.now(),
                            playerName: playerName
                        };
                        console.log(`Auto-submitted invalid trivia answer for disconnected ${playerName}`);
                    }
                } else {
                    // Text-based challenge
                    if (!room.challengeResponses[socketId]) {
                        room.challengeResponses[socketId] = '[DISCONNECTED] Player left the game';
                        console.log(`Auto-submitted disconnection response for ${playerName}`);
                    }
                }
                break;
        }
        
        // Remove from round history or mark as disconnected
        if (room.roundHistory) {
            const playerHistory = room.roundHistory.find(h => h.playerId === socketId || h.playerName === playerName);
            if (playerHistory) {
                console.log(`Player ${playerName} found in round history, keeping for final results`);
                // Keep their history but mark them as disconnected
                playerHistory.disconnected = true;
            }
        }
    }
    
    // Helper function to clean up room resources
    function cleanupRoom(room, roomCode) {
        console.log(`Cleaning up room ${roomCode}`);
        
        // Clear all timers
        if (room.riddleTimer) {
            clearInterval(room.riddleTimer);
            room.riddleTimer = null;
        }
        if (room.challengeTimer) {
            clearTimeout(room.challengeTimer);
            room.challengeTimer = null;
        }
        
        // Clear any other timers or intervals that might exist
        if (room.gameTimer) {
            clearTimeout(room.gameTimer);
            room.gameTimer = null;
        }
    }
    
    // Helper function to check if game can continue after player disconnect
    function checkGameContinuation(room, roomCode) {
        const activePlayers = room.players.filter(p => !p.isSpectator);
        
        if (activePlayers.length < 1) {
            console.log(`Not enough active players in room ${roomCode}, ending game`);
            // End game gracefully
            io.to(roomCode).emit('game-ended', {
                reason: 'Not enough players to continue',
                message: 'Game ended due to insufficient players'
            });
            
            // Reset room to waiting state
            room.gameState = 'waiting';
            room.currentRound = 0;
            cleanupRoom(room, roomCode);
            return;
        }
        
        // Check if we need to advance phases due to all remaining players having submitted
        switch (room.gameState) {
            case 'riddle-phase':
                const riddleSubmissions = Object.keys(room.riddleAnswers).length;
                const activePlayerCount = activePlayers.length;
                if (riddleSubmissions >= activePlayerCount) {
                    console.log(`All remaining players submitted riddle answers, advancing phase`);
                    if (room.riddleTimer) {
                        clearInterval(room.riddleTimer);
                        room.riddleTimer = null;
                    }
                    endRiddlePhase(roomCode);
                }
                break;
                
            case 'challenge-phase':
                const nonWinners = activePlayers.filter(p => p.name !== room.riddleWinner);
                let submissions = 0;
                
                if (room.currentChallengeType === 'fastTapper') {
                    submissions = Object.keys(room.tapResults).length;
                } else if (room.currentChallengeType === 'multipleChoiceTrivia') {
                    submissions = Object.keys(room.triviaAnswers).length;
                } else {
                    submissions = Object.keys(room.challengeResponses).length;
                }
                
                if (submissions >= nonWinners.length) {
                    console.log(`All remaining non-winners submitted challenge responses, advancing phase`);
                    if (room.challengeTimer) {
                        clearTimeout(room.challengeTimer);
                        room.challengeTimer = null;
                    }
                    
                    // Evaluate results based on challenge type
                    if (room.currentChallengeType === 'fastTapper') {
                        evaluateFastTapperResults(roomCode);
                    } else if (room.currentChallengeType === 'multipleChoiceTrivia') {
                        evaluateTriviaResults(roomCode);
                    } else {
                        evaluateTextChallengeResults(roomCode);
                    }
                }
                break;
        }
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🤖 Crack and Combat server running on port ${PORT}`);
    console.log('🎯 ENHANCED: Smart AI judging with creative rewards and brutal shortcuts punishment!');
    console.log('⏱️ Challenge Timer: 40 seconds with auto-submit');
    console.log('🎲 Total Riddles Available:', gameData.riddles.length);
    console.log('📋 Challenge Types (shuffled per game):', BASE_CHALLENGE_TYPES.join(', '));
    console.log('🧠 Smart Judging: Rewards creativity, punishes lazy shortcuts');
    if (genAI) {
        console.log('🔑 Gemini 2.5 Flash: AI-powered challenges with smart evaluation!');
    } else {
        console.log('⚠️ No Gemini API key: Using fallback challenges.');
    }
});
