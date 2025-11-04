const socket = io();
let currentRoom = null;
let playerName = null;
let isRoomOwner = false;
let tapCount = 0;
let tapperActive = false;
let gameEnded = false; // Track if game has ended to prevent stray overlays

// Memory Challenge variables
let memoryTimer = null;
let memoryBalloons = [];

// Replaced matrix rain with gentle, motion-sickness-free background animations

// DOM elements
const pages = {
    home: document.getElementById('home-screen'),
    lobby: document.getElementById('lobby-screen'),
    oracleIntro: document.getElementById('oracle-intro-screen'),
    riddle: document.getElementById('riddle-screen'),
    riddleResults: document.getElementById('riddle-results-screen'),
    textChallenge: document.getElementById('text-challenge-screen'),
    riddleChallenge: document.getElementById('riddle-challenge-screen'),
    riddleChallengeResults: document.getElementById('riddle-challenge-results-screen'),
    triviaChallenge: document.getElementById('trivia-challenge-screen'),
    triviaResults: document.getElementById('trivia-results-screen'),
    fastTapper: document.getElementById('fast-tapper-screen'),
    memoryChallenge: document.getElementById('memory-challenge-screen'),
    memoryResults: document.getElementById('memory-results-screen'),
    challengeResults: document.getElementById('challenge-results-screen'),
    waiting: document.getElementById('waiting-screen'),
    roundSummary: document.getElementById('round-summary-screen'),
    gameOver: document.getElementById('game-over-screen')
};
const playerNameInput = document.getElementById('player-name');
const roomCodeInput = document.getElementById('room-code');
const riddleAnswer = document.getElementById('riddle-answer');

const createRoomBtn = document.getElementById('create-room-btn');
const joinRoomBtn = document.getElementById('join-room-btn');
const startGameBtn = document.getElementById('start-game-btn');
const submitRiddleBtn = document.getElementById('submit-riddle');
const howToPlayBtn = document.getElementById('how-to-play-btn');
const howToPlayModal = document.getElementById('how-to-play-modal');
const closeHowToPlayBtn = document.getElementById('close-how-to-play');

// Audio control elements
const audioSettingsModal = document.getElementById('audio-settings-modal');
const closeAudioSettingsBtn = document.getElementById('close-audio-settings');
const masterVolumeSlider = document.getElementById('master-volume');
const musicVolumeSlider = document.getElementById('music-volume');
const sfxVolumeSlider = document.getElementById('sfx-volume');
const testMusicBtn = document.getElementById('test-music-btn');
const testSfxBtn = document.getElementById('test-sfx-btn');

const roomCodeDisplay = document.getElementById('room-code-display');
const playersListEl = document.getElementById('players-list');
const oracleIntroMessage = document.getElementById('oracle-intro-message');
const riddleText = document.getElementById('riddle-text');

// Get new button elements
const initializeBtn = document.getElementById('initialize-btn');
const connectBtn = document.getElementById('connect-btn');

// Get popup elements
const initializePopup = document.getElementById('initialize-popup');
const connectPopup = document.getElementById('connect-popup');
const popupPlayerName = document.getElementById('popup-player-name');
const popupConnectName = document.getElementById('popup-connect-name');
const popupRoomCode = document.getElementById('popup-room-code');

// Event listeners for new buttons
if (initializeBtn) {
    initializeBtn.addEventListener('click', showInitializePopup);
}
if (connectBtn) {
    connectBtn.addEventListener('click', showConnectPopup);
}

// Keep old event listeners for backward compatibility
if (createRoomBtn) {
    createRoomBtn.addEventListener('click', createRoom);
}
if (joinRoomBtn) {
    joinRoomBtn.addEventListener('click', joinRoom);
}

startGameBtn.addEventListener('click', startGame);
submitRiddleBtn.addEventListener('click', submitRiddleAnswer);
howToPlayBtn.addEventListener('click', showHowToPlay);
closeHowToPlayBtn.addEventListener('click', hideHowToPlay);

// Audio settings modal event listeners
closeAudioSettingsBtn.addEventListener('click', hideAudioSettings);
testMusicBtn.addEventListener('click', testMusic);
testSfxBtn.addEventListener('click', testSoundEffects);

// Volume slider event listeners
masterVolumeSlider.addEventListener('input', updateMasterVolume);
musicVolumeSlider.addEventListener('input', updateMusicVolume);
sfxVolumeSlider.addEventListener('input', updateSfxVolume);
playerNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') createRoom();
});
roomCodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') joinRoom();
});
riddleAnswer.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') submitRiddleAnswer();
});

// Close modal when clicking outside
howToPlayModal.addEventListener('click', (e) => {
    if (e.target === howToPlayModal) {
        hideHowToPlay();
    }
});

audioSettingsModal.addEventListener('click', (e) => {
    if (e.target === audioSettingsModal) {
        hideAudioSettings();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (howToPlayModal.classList.contains('show')) {
            hideHowToPlay();
        }
        if (audioSettingsModal.classList.contains('show')) {
            hideAudioSettings();
        }
    }
});

// Challenge response event listeners
document.getElementById('submit-challenge-response').addEventListener('click', () => submitChallengeResponse(false));
document.getElementById('challenge-response').addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) submitChallengeResponse(false);
});

// Fast tapper event listener
document.getElementById('tap-button').addEventListener('click', onTap);

// Trivia option event listeners
document.querySelectorAll('.trivia-option').forEach(button => {
    button.addEventListener('click', onTriviaOptionClick);
});

// Riddle option event listeners
document.querySelectorAll('.riddle-option').forEach(button => {
    button.addEventListener('click', onRiddleOptionClick);
});

// Custom notification system
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `custom-notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Position multiple notifications
    const existingNotifications = document.querySelectorAll('.custom-notification');
    if (existingNotifications.length > 0) {
        notification.style.top = `${20 + (existingNotifications.length * 80)}px`;
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                    // Reposition remaining notifications
                    repositionNotifications();
                }
            }, 300);
        }
    }, 4000);
    
    // Add click to close
    notification.addEventListener('click', (e) => {
        if (e.target === notification) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                notification.remove();
                repositionNotifications();
            }, 300);
        }
    });
}

function repositionNotifications() {
    const notifications = document.querySelectorAll('.custom-notification');
    notifications.forEach((notification, index) => {
        notification.style.top = `${20 + (index * 80)}px`;
    });
}

// Determine what music should be playing for a given page
function getMusicForPage(pageName) {
    switch (pageName) {
        case 'textChallenge':
        case 'triviaChallenge':
        case 'fastTapper':
            return 'challenge'; // intense-focus
            
        case 'gameOver':
            return 'victory'; // triumph-epic (will be set by game-over handler)
            
        default:
            return 'home'; // cyber-ambient for all other pages
    }
}

// Utility functions
function showPage(pageName) {
    console.log('Switching to page:', pageName);
    
    // Mobile optimization: batch DOM updates
    if (window.mobileOptimized) {
        requestAnimationFrame(() => {
            Object.values(pages).forEach(page => page.classList.remove('active'));
            if (pages[pageName]) {
                pages[pageName].classList.add('active');
            }
        });
    } else {
        Object.values(pages).forEach(page => page.classList.remove('active'));
        if (pages[pageName]) {
            pages[pageName].classList.add('active');
        }
    }
    
    if (pages[pageName]) {
        
        // Simplified 3-track music system with smart switching
        if (window.audioManager) {
            console.log(`Showing page: ${pageName}, Audio initialized: ${window.audioManager.isInitialized}`);
            
            // Play transition sound - mobile optimization handled in audio manager
            if (window.audioManager.isInitialized) {
                // On mobile, only play transitions for important page changes
                if (!window.mobileOptimized || ['gameOver', 'roundSummary'].includes(pageName)) {
                    window.audioManager.playTransitionSound();
                }
            }
            
            // Determine what music should play
            const requiredMusic = getMusicForPage(pageName);
            
            // Only change music if we need a different track
            if (pageName === 'gameOver') {
                // Special case: game over music is handled by the game-over event
                console.log('Game over page - music will be set by game-over handler');
            } else if (requiredMusic) {
                console.log(`Page ${pageName} requires music: ${requiredMusic}`);
                window.audioManager.playMusic(requiredMusic);
            }
        } else {
            console.warn('Audio manager not available when showing page:', pageName);
        }
    }
}

// Popup functions
function showInitializePopup() {
    if (initializePopup) {
        initializePopup.classList.add('active');
        if (popupPlayerName) {
            popupPlayerName.focus();
        }
        if (window.audioManager) window.audioManager.playCorrectSound();
    }
}

function closeInitializePopup() {
    if (initializePopup) {
        initializePopup.classList.remove('active');
    }
}

function showConnectPopup() {
    if (connectPopup) {
        connectPopup.classList.add('active');
        if (popupConnectName) {
            popupConnectName.focus();
        }
        if (window.audioManager) window.audioManager.playCorrectSound();
    }
}

function closeConnectPopup() {
    if (connectPopup) {
        connectPopup.classList.remove('active');
    }
}

function confirmInitialize() {
    const name = popupPlayerName ? popupPlayerName.value.trim() : '';
    if (!name) {
        showNotification('Please enter your name', 'warning');
        if (window.audioManager) window.audioManager.playIncorrectSound();
        return;
    }
    if (name.length > 15) {
        showNotification('Name must be 15 characters or less', 'warning');
        if (window.audioManager) window.audioManager.playIncorrectSound();
        return;
    }
    
    // Set the hidden input value for backward compatibility
    if (playerNameInput) {
        playerNameInput.value = name;
    }
    
    closeInitializePopup();
    createRoom();
}

function confirmConnect() {
    const name = popupConnectName ? popupConnectName.value.trim() : '';
    const code = popupRoomCode ? popupRoomCode.value.trim().toUpperCase() : '';
    
    if (!name) {
        showNotification('Please enter your name', 'warning');
        if (window.audioManager) window.audioManager.playIncorrectSound();
        return;
    }
    if (name.length > 15) {
        showNotification('Name must be 15 characters or less', 'warning');
        if (window.audioManager) window.audioManager.playIncorrectSound();
        return;
    }
    if (!code) {
        showNotification('Please enter a room code', 'warning');
        if (window.audioManager) window.audioManager.playIncorrectSound();
        return;
    }
    if (code.length !== 6) {
        showNotification('Room code must be 6 characters', 'warning');
        if (window.audioManager) window.audioManager.playIncorrectSound();
        return;
    }
    
    // Set the hidden input values for backward compatibility
    if (playerNameInput) {
        playerNameInput.value = name;
    }
    if (roomCodeInput) {
        roomCodeInput.value = code;
    }
    
    closeConnectPopup();
    joinRoom();
}

// Make popup functions global for onclick handlers
window.showInitializePopup = showInitializePopup;
window.closeInitializePopup = closeInitializePopup;
window.showConnectPopup = showConnectPopup;
window.closeConnectPopup = closeConnectPopup;
window.confirmInitialize = confirmInitialize;
window.confirmConnect = confirmConnect;

// Add keyboard support for popups
document.addEventListener('keydown', function(e) {
    if (initializePopup && initializePopup.classList.contains('active')) {
        if (e.key === 'Enter') {
            confirmInitialize();
        } else if (e.key === 'Escape') {
            closeInitializePopup();
        }
    } else if (connectPopup && connectPopup.classList.contains('active')) {
        if (e.key === 'Enter') {
            confirmConnect();
        } else if (e.key === 'Escape') {
            closeConnectPopup();
        }
    }
});

function createRoom() {
    const name = playerNameInput.value.trim();
    if (!name) {
        showNotification('Please enter your name', 'warning');
        if (window.audioManager) window.audioManager.playIncorrectSound();
        return;
    }
    if (name.length > 15) {
        showNotification('Name must be 15 characters or less', 'warning');
        if (window.audioManager) window.audioManager.playIncorrectSound();
        return;
    }
    playerName = name;
    
    // Ensure audio is initialized on user action with fallback music start
    if (window.audioManager && !window.audioManager.isInitialized) {
        console.log('Initializing audio on create room action');
        window.audioManager.init().then(() => {
            // Ensure home music starts playing after init
            setTimeout(() => {
                if (window.audioManager && window.audioManager.isInitialized) {
                    console.log('Starting home music after manual init');
                    window.audioManager.playMusic('home');
                }
            }, 200);
        }).catch(console.error);
    }
    
    if (window.audioManager) window.audioManager.playClickSound();
    socket.emit('create-room', { playerName: name });
}

function joinRoom() {
    const name = playerNameInput.value.trim();
    const roomCode = roomCodeInput.value.trim().toUpperCase();
    if (!name || !roomCode) {
        showNotification('Please enter your name and room code', 'warning');
        if (window.audioManager) window.audioManager.playIncorrectSound();
        return;
    }
    if (name.length > 15) {
        showNotification('Name must be 15 characters or less', 'warning');
        if (window.audioManager) window.audioManager.playIncorrectSound();
        return;
    }
    if (roomCode.length !== 6) {
        showNotification('Room code must be 6 characters', 'warning');
        if (window.audioManager) window.audioManager.playIncorrectSound();
        return;
    }
    playerName = name;
    
    // Ensure audio is initialized on user action with fallback music start
    if (window.audioManager && !window.audioManager.isInitialized) {
        console.log('Initializing audio on join room action');
        window.audioManager.init().then(() => {
            // Ensure home music starts playing after init
            setTimeout(() => {
                if (window.audioManager && window.audioManager.isInitialized) {
                    console.log('Starting home music after manual init');
                    window.audioManager.playMusic('home');
                }
            }, 200);
        }).catch(console.error);
    }
    
    if (window.audioManager) window.audioManager.playClickSound();
    socket.emit('join-room', { playerName: name, roomCode: roomCode });
}

function startGame() {
    if (currentRoom) {
        if (window.audioManager) window.audioManager.playClickSound();
        socket.emit('start-game', { roomCode: currentRoom });
    }
}

function submitRiddleAnswer() {
    const answer = riddleAnswer.value.trim();
    if (!answer || !currentRoom) return;
    if (window.audioManager) window.audioManager.playSubmitSound();
    socket.emit('submit-riddle-answer', { roomCode: currentRoom, answer: answer });
    riddleAnswer.disabled = true;
    submitRiddleBtn.disabled = true;
    submitRiddleBtn.textContent = 'Submitted!';
}

function submitChallengeResponse(isAutoSubmit = false) {
    const response = document.getElementById('challenge-response').value.trim();
    const submitBtn = document.getElementById('submit-challenge-response');
    
    if (!isAutoSubmit) {
        if (!response) {
            showNotification('Please enter your response - this is a complex challenge that requires thought!', 'warning');
            return;
        }
        if (response.length < 5) {
            showNotification('Please provide a more detailed response for this complex scenario.', 'warning');
            return;
        }
    }
    
    if (!currentRoom) return;
    const finalResponse = isAutoSubmit ? `[Auto-submitted] ${response}` : response;
    socket.emit('submit-challenge-response', { roomCode: currentRoom, response: finalResponse });
    document.getElementById('challenge-response').disabled = true;
    submitBtn.disabled = true;
    submitBtn.textContent = isAutoSubmit ? 'Auto-Submitted!' : 'Submitted!';
    if (isAutoSubmit) {
        setTimeout(() => {
            const shortResponse = response.length > 50 ? response.substring(0, 50) + '...' : response;
            showNotification(`Your response was auto-submitted: "${shortResponse}"`, 'info');
        }, 1000);
    }
}

function onTap() {
    if (!tapperActive) return;
    tapCount++;
    if (window.audioManager) window.audioManager.playTapSound();
    document.getElementById('tap-count').textContent = tapCount.toString();
    const button = document.getElementById('tap-button');
    const countDisplay = document.getElementById('tap-count');
    
    button.style.transform = 'scale(0.95)';
    countDisplay.style.animation = 'none';
    
    setTimeout(() => {
        button.style.transform = 'scale(1)';
        countDisplay.style.animation = 'numberPulse 0.1s ease-out';
    }, 50);
}

function onTriviaOptionClick(event) {
    const selectedOption = parseInt(event.target.dataset.option);
    const buttons = document.querySelectorAll('.trivia-option');
    
    if (window.audioManager) window.audioManager.playSubmitSound();
    
    // Disable all buttons and highlight selected
    buttons.forEach(btn => {
        btn.disabled = true;
        btn.classList.remove('selected');
    });
    
    event.target.classList.add('selected');
    
    // Submit the answer
    if (currentRoom) {
        socket.emit('submit-trivia-answer', { 
            roomCode: currentRoom, 
            answer: selectedOption 
        });
    }
}

function onRiddleOptionClick(event) {
    const selectedOption = parseInt(event.target.dataset.option);
    const buttons = document.querySelectorAll('.riddle-option');
    
    if (window.audioManager) window.audioManager.playSubmitSound();
    
    // Disable all buttons and highlight selected
    buttons.forEach(btn => {
        btn.disabled = true;
        btn.classList.remove('selected');
    });
    
    event.target.classList.add('selected');
    
    // Submit the answer
    if (currentRoom) {
        socket.emit('submit-riddle-answer', { 
            roomCode: currentRoom, 
            answer: selectedOption 
        });
    }
}

function startFastTapperTimer(duration) {
    tapperActive = true;
    let timeLeft = duration;
    const timer = setInterval(() => {
        document.getElementById('fast-tapper-timer').textContent = timeLeft;
        
        if (timeLeft <= 3) {
            document.getElementById('fast-tapper-timer').classList.add('urgent');
            document.getElementById('fast-tapper-timer').classList.remove('danger');
        } else if (timeLeft <= 5) {
            document.getElementById('fast-tapper-timer').classList.add('danger');
            document.getElementById('fast-tapper-timer').classList.remove('urgent');
        }
        
        timeLeft--;
        
        if (timeLeft < 0) {
            clearInterval(timer);
            tapperActive = false;
            document.getElementById('tap-button').disabled = true;
            document.getElementById('fast-tapper-timer').classList.remove('urgent', 'danger');
            
            socket.emit('submit-tap-result', { roomCode: currentRoom, taps: tapCount });
            
            setTimeout(() => {
                showNotification(`Time's up! You tapped ${tapCount} times!`, 'success');
            }, 500);
        }
    }, 1000);
}

function startMemoryChallenge(balloons, question, displayTime, answerTime) {
    // Show balloons
    displayBalloons(balloons);
    document.getElementById('memory-instruction').textContent = 'Memorize the balloons and their numbers!';
    document.getElementById('memory-display').style.display = 'flex';
    document.getElementById('memory-question-section').style.display = 'none';
    
    // After display time, hide balloons and show question
    setTimeout(() => {
        // Hide balloons
        document.getElementById('balloons-container').innerHTML = '';
        document.getElementById('memory-display').style.display = 'none';
        document.getElementById('memory-instruction').style.display = 'none';
        
        // Show question section
        document.getElementById('memory-question-section').style.display = 'block';
        document.getElementById('memory-question').textContent = question;
        
        // Reset and enable input
        const answerInput = document.getElementById('memory-answer-input');
        answerInput.value = '';
        answerInput.disabled = false;
        document.getElementById('submit-memory-answer').disabled = false;
        
        // Start answer timer
        let timeLeft = answerTime;
        document.getElementById('memory-timer').textContent = timeLeft;
        
        memoryTimer = setInterval(() => {
            timeLeft--;
            document.getElementById('memory-timer').textContent = timeLeft;
            
            if (timeLeft <= 3) {
                document.getElementById('memory-timer').classList.add('urgent');
                document.getElementById('memory-timer').classList.remove('danger');
            } else if (timeLeft <= 5) {
                document.getElementById('memory-timer').classList.add('danger');
                document.getElementById('memory-timer').classList.remove('urgent');
            }
            
            if (timeLeft <= 0) {
                clearInterval(memoryTimer);
                submitMemoryAnswer();
            }
        }, 1000);
        
    }, displayTime * 1000);
}

function displayBalloons(balloons) {
    const container = document.getElementById('balloons-container');
    container.innerHTML = '';
    
    balloons.forEach(balloon => {
        const balloonEl = document.createElement('div');
        balloonEl.className = `balloon ${balloon.color}`;
        balloonEl.textContent = balloon.number;
        container.appendChild(balloonEl);
    });
}

function submitMemoryAnswer() {
    const answerInput = document.getElementById('memory-answer-input');
    const answer = answerInput.value.trim() || '[No answer]';
    
    socket.emit('submit-memory-answer', {
        roomCode: currentRoom,
        answer: answer
    });
    
    // Disable input and button
    answerInput.disabled = true;
    document.getElementById('submit-memory-answer').disabled = true;
    
    showNotification('Answer submitted!', 'success');
}

// Add event listener for submit button
document.getElementById('submit-memory-answer').addEventListener('click', submitMemoryAnswer);
document.getElementById('memory-answer-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') submitMemoryAnswer();
});

function updateLobbyOwnerDisplay() {
    const lobbyHeader = document.querySelector('.lobby-header');
    const existingOwnerBadge = document.querySelector('.owner-badge');
    if (existingOwnerBadge) {
        existingOwnerBadge.remove();
    }
    
    if (isRoomOwner) {
        const ownerBadge = document.createElement('div');
        ownerBadge.className = 'owner-badge';
        ownerBadge.innerHTML = 'You are the Room Owner';
        lobbyHeader.appendChild(ownerBadge);
    }
}

function updateStartButton() {
    const playerCount = document.querySelectorAll('.player').length;
    const waitingText = document.querySelector('.waiting-text');
    if (isRoomOwner && playerCount >= 2) {
        startGameBtn.classList.remove('hidden');
        startGameBtn.disabled = false;
        startGameBtn.textContent = 'Start Game';
        waitingText.style.display = 'none';
    } else if (isRoomOwner && playerCount < 2) {
        startGameBtn.classList.remove('hidden');
        startGameBtn.disabled = true;
        startGameBtn.textContent = 'Need More Players';
        waitingText.textContent = 'Waiting for more players...';
        waitingText.style.display = 'block';
    } else {
        startGameBtn.classList.add('hidden');
        waitingText.textContent = 'Waiting for room owner to start...';
        waitingText.style.display = 'block';
    }
}

function updatePlayers(players) {
    playersListEl.innerHTML = players.map((player, index) => {
        const isOwnerPlayer = index === 0;
        const spectatorStatus = player.isSpectator ? ' (Spectator)' : '';
        const spectatorClass = player.isSpectator ? ' spectator' : '';
        return `
            <div class="player ${isOwnerPlayer ? 'owner-player' : ''}${spectatorClass}">
                ${isOwnerPlayer ? 'OWNER ' : ''}${player.name}: ${player.score}pts${spectatorStatus}
            </div>
        `;
    }).join('');
}

// ENHANCED: Points table creation with comprehensive debugging
function createPointsTable(roundHistory, tableId) {
    console.log('=== POINTS TABLE DEBUG START ===');
    console.log('createPointsTable called with:');
    console.log('- tableId:', tableId);
    console.log('- roundHistory:', roundHistory);
    console.log('- roundHistory type:', typeof roundHistory);
    console.log('- roundHistory isArray:', Array.isArray(roundHistory));
    console.log('- roundHistory length:', roundHistory ? roundHistory.length : 'N/A');
    
    const table = document.getElementById(tableId);
    console.log('- table element found:', !!table);
    console.log('- table element:', table);
    
    if (!table) {
        console.error('Table element with id "' + tableId + '" not found');
        console.log('Available elements with "points" in id:');
        document.querySelectorAll('[id*="points"]').forEach(el => {
            console.log('  - Found element:', el.id, el);
        });
        return;
    }
    
    if (!roundHistory || !Array.isArray(roundHistory) || roundHistory.length === 0) {
        console.warn('No valid round history data provided');
        console.log('Setting no-data message in table');
        table.innerHTML = '<div class="no-data">No game data available yet</div>';
        console.log('No-data message set');
        return;
    }
    
    console.log('Creating points table with valid data');
    
    let tableHtml = '<div class="points-table">';
    // Header
    tableHtml += '<div class="points-table-header">';
    tableHtml += '<div class="player-name-header">Player</div>';
    for (let i = 1; i <= 5; i++) {
        tableHtml += `<div class="round-header">R${i}</div>`;
    }
    tableHtml += '<div class="total-header">Total</div>';
    tableHtml += '</div>';
    
    // Player rows
    roundHistory.forEach((playerHistory, index) => {
        console.log(`Processing player ${index + 1}:`, playerHistory);
        if (!playerHistory.playerName) {
            console.warn('Skipping player with no name:', playerHistory);
            return;
        }
        
        tableHtml += '<div class="points-table-row">';
        tableHtml += `<div class="player-name-cell">${playerHistory.playerName}</div>`;
        
        // Round results
        for (let i = 0; i < 5; i++) {
            const result = (playerHistory.rounds && playerHistory.rounds[i]) ? playerHistory.rounds[i] : '-';
            const resultClass = result === 'W' ? 'win' : result === 'L' ? 'loss' : '';
            tableHtml += `<div class="round-result ${resultClass}">${result}</div>`;
        }
        
        // Total wins
        const totalWins = playerHistory.rounds ? playerHistory.rounds.filter(r => r === 'W').length : 0;
        tableHtml += `<div class="total-score">${totalWins}</div>`;
        tableHtml += '</div>';
    });
    tableHtml += '</div>';
    
    console.log('Setting table HTML (length:', tableHtml.length, 'chars)');
    console.log('HTML preview:', tableHtml.substring(0, 200) + '...');
    table.innerHTML = tableHtml;
    
    console.log('Points table created successfully for:', tableId);
    console.log('Final table innerHTML length:', table.innerHTML.length);
    console.log('=== POINTS TABLE DEBUG END ===');
}

function startTimer(elementId, seconds) {
    const element = document.getElementById(elementId);
    if (!element) {
        console.warn('Timer element not found:', elementId);
        return null;
    }
    
    let timeLeft = seconds;
    
    // Clear any existing timer for this element type to prevent memory leaks
    if (elementId === 'riddle-timer' && window.riddleTimer) {
        clearInterval(window.riddleTimer);
        window.riddleTimer = null;
    } else if (elementId === 'riddle-challenge-timer' && window.riddleChallengeTimer) {
        clearInterval(window.riddleChallengeTimer);
        window.riddleChallengeTimer = null;
    } else if (elementId === 'trivia-timer' && window.triviaTimer) {
        clearInterval(window.triviaTimer);
        window.triviaTimer = null;
    }
    
    const timer = setInterval(() => {
        // Check if element still exists (prevent errors if DOM changes)
        if (!element.parentNode) {
            clearInterval(timer);
            return;
        }
        
        element.textContent = timeLeft;
        
        if (timeLeft <= 10) {
            element.classList.add('urgent');
            element.classList.remove('danger');
        } else if (timeLeft <= 20) {
            element.classList.add('danger');
            element.classList.remove('urgent');
        } else {
            element.classList.remove('urgent', 'danger');
        }
        
        timeLeft--;
        
        if (timeLeft < 0) {
            clearInterval(timer);
            element.classList.remove('urgent', 'danger');
            
            // Clear the global reference
            if (elementId === 'riddle-timer') {
                window.riddleTimer = null;
            } else if (elementId === 'riddle-challenge-timer') {
                window.riddleChallengeTimer = null;
            } else if (elementId === 'trivia-timer') {
                window.triviaTimer = null;
            }
        }
    }, 1000);
    
    // Store timer reference globally for proper cleanup
    if (elementId === 'riddle-timer') {
        window.riddleTimer = timer;
    } else if (elementId === 'riddle-challenge-timer') {
        window.riddleChallengeTimer = timer;
    } else if (elementId === 'trivia-timer') {
        window.triviaTimer = timer;
    }
    
    return timer;
}

function startChallengeTimer(elementId, seconds) {
    const element = document.getElementById(elementId);
    const textarea = document.getElementById('challenge-response');
    const submitBtn = document.getElementById('submit-challenge-response');
    
    if (!element) {
        console.warn('Challenge timer element not found:', elementId);
        return null;
    }
    
    // Clear any existing timer to prevent multiple timers running and memory leaks
    if (window.challengeTimer) {
        clearInterval(window.challengeTimer);
        window.challengeTimer = null;
    }
    
    let timeLeft = seconds;
    window.challengeTimer = setInterval(() => {
        // Check if elements still exist (prevent errors if DOM changes)
        if (!element.parentNode) {
            clearInterval(window.challengeTimer);
            window.challengeTimer = null;
            return;
        }
        
        element.textContent = timeLeft;
        
        if (timeLeft <= 10) {
            element.classList.add('urgent');
            element.classList.remove('danger');
        } else if (timeLeft <= 20) {
            element.classList.add('danger');
            element.classList.remove('urgent');
        } else {
            element.classList.remove('urgent', 'danger');
        }
        
        timeLeft--;
        
        if (timeLeft < 0) {
            clearInterval(window.challengeTimer);
            window.challengeTimer = null;
            element.classList.remove('urgent', 'danger');
            
            if (textarea && !textarea.disabled && submitBtn && !submitBtn.disabled) {
                const currentText = textarea.value.trim();
                if (currentText.length > 0) {
                    console.log('Auto-submitting response:', currentText.substring(0, 30) + '...');
                    
                    element.textContent = 'AUTO-SUBMIT';
                    element.classList.add('auto-submit');
                    
                    setTimeout(() => {
                        submitChallengeResponse(true);
                    }, 500);
                } else {
                    console.log('Timer ended with no input');
                    element.textContent = 'TIME UP';
                }
            }
        }
    }, 1000);
    return window.challengeTimer;
}

function typeWriter(element, text, speed = 30) {
    return new Promise((resolve) => {
        element.textContent = '';
        element.scrollTop = 0;
        
        // On mobile, make typewriter effect much faster to reduce CPU usage
        if (window.mobileOptimized) {
            speed = speed / 3; // 3x faster on mobile
        }
        
        let i = 0;
        
        function typeNextChar() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                element.scrollTop = element.scrollHeight;
                i++;
                
                const char = text.charAt(i - 1);
                let delay = speed;
                
                if (char === '.' || char === '!' || char === '?') {
                    delay = speed * 3;
                } else if (char === ',' || char === ';') {
                    delay = speed * 2;
                }
                
                // On mobile, use requestAnimationFrame for better performance
                if (window.mobileOptimized && delay < 20) {
                    requestAnimationFrame(typeNextChar);
                } else {
                    setTimeout(typeNextChar, delay);
                }
            } else {
                resolve();
            }
        }
        
        typeNextChar();
    });
}

async function showIndividualResult(data) {
    const overlay = document.getElementById('result-overlay');
    const content = document.getElementById('individual-result-content');
    
    let responseText = data.response || "";
    const isAutoSubmitted = responseText.startsWith('[Auto-submitted]');
    
    if (isAutoSubmitted) {
        responseText = responseText.replace('[Auto-submitted] ', '');
    }
    
    const feedbackText = data.feedback || "No feedback available.";
    
    const autoSubmitIndicator = isAutoSubmitted ?
        '<div class="auto-submit-indicator">Auto-submitted when time expired</div>' : '';
    
    const resultHtml = `
        <div class="individual-result ${data.passed ? 'passed' : 'failed'}">
            <h3>${data.passed ? 'WELL REASONED!' : 'INSUFFICIENT!'}</h3>
            ${autoSubmitIndicator}
            <div class="result-response"></div>
            <div class="result-feedback"></div>
            <div class="continue-instruction">Click 'Continue' to proceed.</div>
            <button onclick="hideIndividualResult()" class="btn secondary">Continue</button>
        </div>
    `;
    
    content.innerHTML = resultHtml;
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    
    const responseEl = content.querySelector('.result-response');
    const feedbackEl = content.querySelector('.result-feedback');
    const continueBtn = content.querySelector('.btn');
    
    await typeWriter(responseEl, `"${responseText}"`, 20);
    await new Promise(resolve => setTimeout(resolve, 500));
    await typeWriter(feedbackEl, feedbackText);
    
    continueBtn.classList.remove('hidden');
    
    setTimeout(() => {
        if (overlay.style.display === 'flex') {
            hideIndividualResult();
        }
    }, 5000); // Reduced from 8000ms to 5000ms for faster flow
}

function hideIndividualResult() {
    const overlay = document.getElementById('result-overlay');
    if (overlay) {
        overlay.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore scrolling
        
        // Ensure cyber-ambient continues playing
        if (window.audioManager) {
            console.log('Hiding individual result - ensuring cyber ambient continues');
            window.audioManager.playMusic('home'); // cyber-ambient
        }
    }
}

// Add click-to-close functionality for overlay
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('result-overlay');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                hideIndividualResult();
            }
        });
    }
});

function showHowToPlay() {
    console.log('showHowToPlay called');
    console.log('howToPlayModal element:', howToPlayModal);
    if (howToPlayModal) {
        howToPlayModal.classList.add('show');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        console.log('Modal should now be visible');
    } else {
        console.error('howToPlayModal element not found!');
    }
}

function hideHowToPlay() {
    console.log('hideHowToPlay called');
    howToPlayModal.classList.remove('show');
    document.body.style.overflow = 'auto'; // Restore scrolling
}

// Audio control functions
function toggleAudio() {
    if (window.audioManager) {
        const isMuted = window.audioManager.toggleMute();
        
        // Update all audio toggle buttons
        document.querySelectorAll('.audio-toggle-btn .audio-icon').forEach(icon => {
            icon.textContent = isMuted ? '🔇' : '🔊';
        });
        
        document.querySelectorAll('.audio-toggle-btn').forEach(btn => {
            btn.title = isMuted ? 'Enable Audio' : 'Disable Audio';
        });
        
        if (!isMuted) {
            window.audioManager.playClickSound();
        }
    }
}

function showAudioSettings() {
    if (window.audioManager) {
        window.audioManager.playClickSound();
        
        // Update sliders with current values
        masterVolumeSlider.value = Math.round(window.audioManager.masterVolume * 100);
        musicVolumeSlider.value = Math.round(window.audioManager.musicVolume * 100);
        sfxVolumeSlider.value = Math.round(window.audioManager.sfxVolume * 100);
        
        updateVolumeDisplays();
        
        audioSettingsModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function hideAudioSettings() {
    audioSettingsModal.classList.remove('show');
    document.body.style.overflow = 'auto';
}

function updateMasterVolume(event) {
    const value = event.target.value / 100;
    if (window.audioManager) {
        window.audioManager.setVolume('master', value);
    }
    updateVolumeDisplays();
}

function updateMusicVolume(event) {
    const value = event.target.value / 100;
    if (window.audioManager) {
        window.audioManager.setVolume('music', value);
    }
    updateVolumeDisplays();
}

function updateSfxVolume(event) {
    const value = event.target.value / 100;
    if (window.audioManager) {
        window.audioManager.setVolume('sfx', value);
        window.audioManager.playClickSound();
    }
    updateVolumeDisplays();
}

function updateVolumeDisplays() {
    const masterValue = document.querySelector('#master-volume').value;
    const musicValue = document.querySelector('#music-volume').value;
    const sfxValue = document.querySelector('#sfx-volume').value;
    
    document.querySelector('#master-volume').nextElementSibling.textContent = masterValue + '%';
    document.querySelector('#music-volume').nextElementSibling.textContent = musicValue + '%';
    document.querySelector('#sfx-volume').nextElementSibling.textContent = sfxValue + '%';
}

function testMusic() {
    if (window.audioManager) {
        window.audioManager.playMusic('home');
        window.audioManager.playClickSound();
    }
}

function testSoundEffects() {
    if (window.audioManager) {
        window.audioManager.playCorrectSound();
        setTimeout(() => window.audioManager.playNotificationSound(), 300);
        setTimeout(() => window.audioManager.playSubmitSound(), 600);
    }
}

// Socket event listeners
socket.on('room-created', (data) => {
    currentRoom = data.roomCode;
    isRoomOwner = data.isOwner;
    roomCodeDisplay.textContent = `Room: ${data.roomCode}`;
    
    updateLobbyOwnerDisplay();
    updateStartButton();
    showPage('lobby');
});

socket.on('join-success', (data) => {
    currentRoom = data.roomCode;
    isRoomOwner = data.isOwner;
    roomCodeDisplay.textContent = `Room: ${data.roomCode}`;
    
    // Handle spectator mode
    if (data.isSpectator) {
        showNotification(`Joined as spectator! You'll participate from round ${data.currentRound + 1}`, 'info');
        
        // Show current game state if game is in progress
        if (data.gameState !== 'waiting') {
            showNotification(`Game in progress - Round ${data.currentRound}/${data.maxRounds}`, 'info');
        }
    }
    
    updateLobbyOwnerDisplay();
    updateStartButton();
    showPage('lobby');
});

socket.on('player-joined', (data) => {
    updatePlayers(data.players);
    updateStartButton();
});

socket.on('player-left', (data) => {
    updatePlayers(data.players);
    updateStartButton();
});

socket.on('oracle-speaks', (data) => {
    console.log('Oracle speaks event received:', data.type, '-', data.message);
    oracleIntroMessage.textContent = data.message;
    
    // Only show oracle intro page for round introductions, not for challenge intros or evaluations
    if (data.type === 'introduction') {
        console.log('Showing oracle intro page for round introduction');
        showPage('oracleIntro');
    } else if (data.type === 'challenge-intro') {
        // For challenge intros, show a brief notification without changing pages
        console.log('Oracle challenge intro - showing notification instead of changing pages');
        showNotification(data.message, 'info');
    } else if (data.type === 'evaluation') {
        // For evaluation messages, don't change pages either
        console.log('Oracle evaluation message - no page change');
    } else {
        // Fallback for any other oracle message types
        console.log('Unknown oracle message type:', data.type, '- showing notification');
        showNotification(data.message, 'info');
    }
});

socket.on('riddle-presented', (data) => {
    gameEnded = false; // Reset game state when new round starts
    document.getElementById('round-display').textContent = `Round ${data.round}/${data.maxRounds}`;
    riddleText.textContent = data.riddle.question;
    
    riddleAnswer.disabled = false;
    riddleAnswer.value = '';
    riddleAnswer.focus();
    submitRiddleBtn.disabled = false;
    submitRiddleBtn.textContent = 'Submit Answer';
    
    document.getElementById('submission-count').textContent = '0/0 players answered';
    
    showPage('riddle');
    startTimer('riddle-timer', 60);
});

socket.on('answer-submitted', (data) => {
    const submissionCount = document.getElementById('submission-count');
    submissionCount.textContent = `${data.totalSubmissions}/${data.totalPlayers} players answered`;
    
    // Show auto-advance indicator when all players have answered
    if (data.totalSubmissions === data.totalPlayers) {
        submissionCount.innerHTML = `
            <span style="color: var(--accent-green); font-weight: bold;">
                ✓ All players answered! Auto-advancing...
            </span>
        `;
        
        // Clear any running riddle timer to prevent conflicts
        if (window.riddleTimer) {
            clearInterval(window.riddleTimer);
            window.riddleTimer = null;
        }
        
        // Add visual feedback to timer
        const timer = document.getElementById('riddle-timer');
        if (timer) {
            timer.textContent = 'ADVANCING...';
            timer.classList.add('auto-submit');
        }
    }
});

socket.on('riddle-results-reveal', (data) => {
    document.getElementById('riddle-results-message').textContent = data.message;
    
    const answersListEl = document.getElementById('all-answers-list');
    let answersHtml = '';
    
    data.allAnswers.forEach((answerData, index) => {
        const isCorrect = answerData.correct;
        const isWinner = answerData.winner;
        const orderText = index === 0 ? '1st' : index === 1 ? '2nd' : index === 2 ? '3rd' : `${index + 1}th`;
        
        answersHtml += `
            <div class="answer-item ${isCorrect ? 'correct' : 'incorrect'} ${isWinner ? 'winner' : ''}">
                <div class="answer-header">
                    <span class="player-name">${answerData.playerName}</span>
                    <span class="answer-order">${orderText}</span>
                    ${isWinner ? '<span class="winner-badge">WINNER</span>' : ''}
                </div>
                <div class="answer-text">"${answerData.answer}"</div>
                <div class="answer-status">
                    ${isCorrect ? 'Correct' : 'Incorrect'}
                </div>
            </div>
        `;
    });
    
    answersListEl.innerHTML = answersHtml;
    showPage('riddleResults');
});

socket.on('text-challenge-start', (data) => {
    const isParticipant = data.participants.includes(playerName);
    
    if (isParticipant) {
        document.getElementById('text-challenge-title').textContent = 
            `${data.challengeType.toUpperCase()} CHALLENGE`;
        
        const challengeContent = data.challengeContent;
        const contentElement = document.getElementById('text-challenge-content');
        
        if (!challengeContent || challengeContent.trim().length === 0) {
            console.warn('Empty challenge content received, using fallback');
            contentElement.textContent = "Challenge loading failed. Please describe your approach to the situation.";
        } else {
            console.log('Setting challenge content:', challengeContent.substring(0, 50) + '...');
            contentElement.textContent = challengeContent;
        }
        
        document.getElementById('challenge-response').value = '';
        document.getElementById('challenge-response').disabled = false;
        document.getElementById('submit-challenge-response').disabled = false;
        document.getElementById('submit-challenge-response').textContent = 'Submit Response';
        document.getElementById('text-challenge-submission-count').textContent = 
            `0/${data.participants.length} players responded`;
        
        showPage('textChallenge');
        startChallengeTimer('text-challenge-timer', data.timeLimit || 60);
        setTimeout(() => {
            const textarea = document.getElementById('challenge-response');
            textarea.focus();
            textarea.placeholder = 'Think carefully and provide a detailed response... (auto-submits at 0)';
        }, 500);
    } else {
        document.getElementById('waiting-title').textContent = 'Others are facing a complex challenge...';
        document.getElementById('waiting-message').textContent = 
            `Non-winners are solving a challenging ${data.challengeType} scenario!`;
        showPage('waiting');
    }
});

socket.on('trivia-challenge-start', (data) => {
    const isParticipant = data.participants.includes(playerName);
    
    if (isParticipant) {
        document.getElementById('trivia-question').textContent = data.question;
        
        const buttons = document.querySelectorAll('.trivia-option');
        buttons.forEach((btn, index) => {
            btn.textContent = data.options[index];
            btn.disabled = false;
            btn.classList.remove('selected');
        });
        
        document.getElementById('trivia-submission-count').textContent = 
            `0/${data.participants.length} players answered`;
        
        showPage('triviaChallenge');
        startTimer('trivia-timer', data.timeLimit || 45);
    } else {
        document.getElementById('waiting-title').textContent = 'Trivia Challenge!';
        document.getElementById('waiting-message').textContent = 'Others are solving a challenging trivia question!';
        showPage('waiting');
    }
});

socket.on('riddle-challenge-start', (data) => {
    const isParticipant = data.participants.includes(playerName);
    
    if (isParticipant) {
        document.getElementById('riddle-challenge-question').textContent = data.question;
        
        const buttons = document.querySelectorAll('#riddle-challenge-options .riddle-option');
        buttons.forEach((btn, index) => {
            btn.textContent = data.options[index];
            btn.disabled = false;
            btn.classList.remove('selected');
        });
        
        document.getElementById('riddle-challenge-submission-count').textContent = 
            `0/${data.participants.length} players answered`;
        
        showPage('riddleChallenge');
        startTimer('riddle-challenge-timer', data.timeLimit || 45);
    } else {
        document.getElementById('waiting-title').textContent = 'Riddle Challenge!';
        document.getElementById('waiting-message').textContent = 'Others are solving a challenging riddle!';
        showPage('waiting');
    }
});

socket.on('fast-tapper-start', (data) => {
    const isParticipant = data.participants.includes(playerName);
    
    if (isParticipant) {
        tapCount = 0;
        document.getElementById('tap-count').textContent = '0';
        document.getElementById('tap-button').disabled = false;
        
        showPage('fastTapper');
        startFastTapperTimer(data.duration || 10);
    } else {
        document.getElementById('waiting-title').textContent = 'Fast Tapper Challenge!';
        document.getElementById('waiting-message').textContent = 'Others are tapping as fast as they can!';
        showPage('waiting');
    }
});

socket.on('memory-challenge-start', (data) => {
    const isParticipant = data.participants.includes(playerName);
    
    if (isParticipant) {
        memoryBalloons = data.balloons;
        showPage('memoryChallenge');
        startMemoryChallenge(data.balloons, data.question, data.displayTime || 2, data.answerTime || 20);
    } else {
        document.getElementById('waiting-title').textContent = 'Memory Challenge!';
        document.getElementById('waiting-message').textContent = 'Others are testing their memory!';
        showPage('waiting');
    }
});

socket.on('memory-challenge-results', (data) => {
    document.getElementById('memory-results-message').textContent = 
        `Question: ${data.question}`;
    
    document.getElementById('memory-correct-answer-text').textContent = data.correctAnswer;
    
    const answersListEl = document.getElementById('all-memory-answers-list');
    let answersHtml = '';
    
    data.results.forEach((result, index) => {
        answersHtml += `
            <div class="answer-item ${result.correct ? 'correct' : 'incorrect'} ${result.won ? 'winner' : ''}">
                <div class="answer-header">
                    <span class="player-name">${result.playerName}</span>
                    ${result.won ? '<span class="winner-badge">WINNER</span>' : ''}
                </div>
                <div class="answer-text">"${result.answer}"</div>
                <div class="answer-status">
                    ${result.correct ? 'Correct' : 'Incorrect'}
                </div>
            </div>
        `;
    });
    
    answersListEl.innerHTML = answersHtml;
    showPage('memoryResults');
});

socket.on('memory-answer-submitted', (data) => {
    const submissionCount = document.getElementById('memory-submission-count');
    submissionCount.textContent = `${data.totalSubmissions}/${data.expectedSubmissions} players answered`;
    
    // Show auto-advance indicator when all players have answered
    if (data.totalSubmissions === data.expectedSubmissions) {
        submissionCount.innerHTML = `
            <span style="color: var(--accent-green); font-weight: bold;">
                ✓ All players answered! Auto-advancing...
            </span>
        `;
        
        // Clear timer
        if (memoryTimer) {
            clearInterval(memoryTimer);
            memoryTimer = null;
        }
        
        const timer = document.getElementById('memory-timer');
        if (timer) {
            timer.textContent = 'ADVANCING...';
            timer.classList.add('auto-submit');
        }
    }
});

socket.on('challenge-individual-result', (data) => {
    // Prevent individual results from showing after game has ended
    if (gameEnded) {
        console.log('Game has ended, ignoring individual result overlay');
        return;
    }
    
    // Challenge completed - go back to cyber-ambient
    if (window.audioManager) {
        console.log('Challenge completed - returning to cyber ambient');
        window.audioManager.playMusic('home'); // cyber-ambient
    }
    showIndividualResult(data);
});

socket.on('fast-tapper-results', (data) => {
    document.getElementById('challenge-results-title').textContent = 'FAST TAPPER RESULTS';
    document.getElementById('challenge-results-message').textContent = 
        `Fastest fingers: ${data.maxTaps} taps!`;
    
    const resultsHtml = data.results.map(result => `
        <div class="tap-result-item ${result.won ? 'winner correct' : 'incorrect'}">
            <span class="tap-result-name">${result.won ? '🏆 ' : ''}${result.playerName}</span>
            <span class="tap-result-count">${result.taps} taps</span>
        </div>
    `).join('');
    
    document.getElementById('challenge-results-content').innerHTML = resultsHtml;
    
    // Fast tapper completed - go back to cyber-ambient
    if (window.audioManager) {
        console.log('Fast tapper completed - returning to cyber ambient');
        window.audioManager.playMusic('home'); // cyber-ambient
    }
    
    showPage('challengeResults');
});

socket.on('challenge-response-submitted', (data) => {
    const submissionCount = document.getElementById('text-challenge-submission-count');
    submissionCount.textContent = `${data.totalSubmissions}/${data.expectedSubmissions} players responded`;
    
    // Show auto-advance indicator when all players have responded
    if (data.totalSubmissions === data.expectedSubmissions) {
        submissionCount.innerHTML = `
            <span style="color: var(--accent-green); font-weight: bold;">
                ✓ All players responded! Auto-advancing...
            </span>
        `;
        
        // Clear client timer and show advancing status
        if (window.challengeTimer) {
            clearInterval(window.challengeTimer);
            window.challengeTimer = null;
        }
        
        // Add visual feedback to timer
        const timer = document.getElementById('text-challenge-timer');
        if (timer) {
            timer.textContent = 'ADVANCING...';
            timer.classList.add('auto-submit');
        }
    }
});

socket.on('trivia-answer-submitted', (data) => {
    const submissionCount = document.getElementById('trivia-submission-count');
    submissionCount.textContent = `${data.totalSubmissions}/${data.expectedSubmissions} players answered`;
    
    // Show auto-advance indicator when all players have answered
    if (data.totalSubmissions === data.expectedSubmissions) {
        submissionCount.innerHTML = `
            <span style="color: var(--accent-green); font-weight: bold;">
                ✓ All players answered! Auto-advancing...
            </span>
        `;
        
        // Clear any running timer to prevent early termination
        if (window.triviaTimer) {
            clearInterval(window.triviaTimer);
            window.triviaTimer = null;
        }
        
        // Add visual feedback to timer
        const timer = document.getElementById('trivia-timer');
        if (timer) {
            timer.textContent = 'ADVANCING...';
            timer.classList.add('auto-submit');
        }
    }
});

socket.on('riddle-answer-submitted', (data) => {
    const submissionCount = document.getElementById('riddle-challenge-submission-count');
    submissionCount.textContent = `${data.totalSubmissions}/${data.expectedSubmissions} players answered`;
    
    // Show auto-advance indicator when all players have answered
    if (data.totalSubmissions === data.expectedSubmissions) {
        submissionCount.innerHTML = `
            <span style="color: var(--accent-green); font-weight: bold;">
                ✓ All players answered! Auto-advancing...
            </span>
        `;
        
        // Clear any running timer to prevent early termination
        if (window.riddleChallengeTimer) {
            clearInterval(window.riddleChallengeTimer);
            window.riddleChallengeTimer = null;
        }
        
        // Add visual feedback to timer
        const timer = document.getElementById('riddle-challenge-timer');
        if (timer) {
            timer.textContent = 'ADVANCING...';
            timer.classList.add('auto-submit');
        }
    }
});

socket.on('trivia-results', (data) => {
    document.getElementById('trivia-results-message').textContent = 
        `Correct answer: ${data.correctOption}`;
    
    document.getElementById('correct-answer-text').textContent = data.correctOption;
    
    const answersListEl = document.getElementById('all-trivia-answers-list');
    let answersHtml = '';
    
    data.results.forEach((result, index) => {
        const orderText = index === 0 ? '1st' : index === 1 ? '2nd' : index === 2 ? '3rd' : `${index + 1}th`;
        
        answersHtml += `
            <div class="answer-item ${result.correct ? 'correct' : 'incorrect'} ${result.won ? 'winner' : ''}">
                <div class="answer-header">
                    <span class="player-name">${result.playerName}</span>
                    <span class="answer-order">${orderText}</span>
                    ${result.won ? '<span class="winner-badge">WINNER</span>' : ''}
                </div>
                <div class="answer-text">"${result.selectedOption}"</div>
                <div class="answer-status">
                    ${result.correct ? 'Correct' : 'Incorrect'}
                </div>
            </div>
        `;
    });
    
    answersListEl.innerHTML = answersHtml;
    showPage('triviaResults');
});

socket.on('riddle-results', (data) => {
    document.getElementById('riddle-challenge-results-message').textContent = 
        `Correct answer: ${data.correctOption}`;
    
    document.getElementById('riddle-challenge-correct-answer-text').textContent = data.correctOption;
    
    const answersListEl = document.getElementById('all-riddle-challenge-answers-list');
    let answersHtml = '';
    
    data.results.forEach((result, index) => {
        const orderText = index === 0 ? '1st' : index === 1 ? '2nd' : index === 2 ? '3rd' : `${index + 1}th`;
        
        answersHtml += `
            <div class="answer-item ${result.correct ? 'correct' : 'incorrect'} ${result.won ? 'winner' : ''}">
                <div class="answer-header">
                    <span class="player-name">${result.playerName}</span>
                    <span class="answer-order">${orderText}</span>
                    ${result.won ? '<span class="winner-badge">WINNER</span>' : ''}
                </div>
                <div class="answer-text">"${result.selectedOption}"</div>
                <div class="answer-status">
                    ${result.correct ? 'Correct' : 'Incorrect'}
                </div>
            </div>
        `;
    });
    
    answersListEl.innerHTML = answersHtml;
    showPage('riddleChallengeResults');
});

socket.on('tap-result-submitted', (data) => {
    console.log(`${data.player} tapped ${data.taps} times`);
});

// ENHANCED: Round summary handler with comprehensive debugging
socket.on('round-summary', (data) => {
    console.log('=== ROUND SUMMARY DEBUG START ===');
    console.log('Full data received:', data);
    console.log('Round:', data.round);
    console.log('Max rounds:', data.maxRounds);
    console.log('Players:', data.players);
    console.log('Riddle winner:', data.riddleWinner);
    console.log('Challenge results:', data.challengeResults);
    console.log('Round history received:');
    console.log('- Type:', typeof data.roundHistory);
    console.log('- Is array:', Array.isArray(data.roundHistory));
    console.log('- Length:', data.roundHistory ? data.roundHistory.length : 'N/A');
    console.log('- Content:', data.roundHistory);
    
    document.getElementById('round-summary-title').textContent = `Round ${data.round} Complete!`;
    
    if (data.roundHistory && Array.isArray(data.roundHistory) && data.roundHistory.length > 0) {
        console.log('Valid round history found - calling createPointsTable');
        console.log('Calling createPointsTable with tableId: points-table');
        createPointsTable(data.roundHistory, 'points-table');
        console.log('createPointsTable call completed');
    } else {
        console.warn('No valid round history data received');
        console.log('Setting fallback message');
        const pointsTable = document.getElementById('points-table');
        console.log('Points table element found:', !!pointsTable);
        if (pointsTable) {
            pointsTable.innerHTML = '<div class="no-data">Leaderboard data processing...</div>';
            console.log('Fallback message set in points table');
        }
    }
    
    const nextRoundText = document.getElementById('next-round-text');
    if (nextRoundText) {
        if (data.round >= data.maxRounds) {
            nextRoundText.textContent = 'Final results coming up...';
        } else {
            nextRoundText.textContent = `Round ${data.round + 1} starting soon...`;
        }
    }
    
    console.log('Showing round summary page');
    showPage('roundSummary');
    console.log('=== ROUND SUMMARY DEBUG END ===');
});

// ENHANCED: Game over handler with debugging
socket.on('game-over', (data) => {
    gameEnded = true; // Mark game as ended to prevent stray overlays
    console.log('=== GAME OVER DEBUG START ===');
    console.log('Game over data received:', data);
    console.log('Winner:', data.winner);
    console.log('Scores:', data.scores);
    console.log('Final round history:');
    console.log('- Type:', typeof data.roundHistory);
    console.log('- Is array:', Array.isArray(data.roundHistory));
    console.log('- Length:', data.roundHistory ? data.roundHistory.length : 'N/A');
    console.log('- Content:', data.roundHistory);
    
    // Play triumph epic ONLY in final winner screen
    if (window.audioManager) {
        console.log('Final winner screen - playing triumph epic');
        window.audioManager.playMusic('victory'); // triumph-epic
    }
    
    const scoresHtml = data.scores.map((player, index) => {
        const medal = index === 0 ? 'GOLD' : index === 1 ? 'SILVER' : index === 2 ? 'BRONZE' : 'FINISHER';
        return `
            <div class="final-score ${index === 0 ? 'winner' : ''}">
                <span>${medal} ${player.name}</span>
                <span>${player.score} pts</span>
            </div>
        `;
    }).join('');
    
    const bigWinnerEl = document.getElementById('big-winner-announcement');
    if (bigWinnerEl && data.winner) {
        let winnerDisplay = '';
        if (data.tied) {
            winnerDisplay = `🏆 TIE GAME! 🏆<br>Multiple Champions with ${data.winner.score} Points`;
        } else if (data.winner.score === 0) {
            winnerDisplay = `💀 NO WINNER 💀<br>Oracle Remains Victorious`;
        } else {
            winnerDisplay = `🏆 CHAMPION: ${data.winner.name} 🏆<br>${data.winner.score} Points`;
        }
        bigWinnerEl.innerHTML = winnerDisplay;
    } else if (bigWinnerEl) {
        // Fallback if no winner data
        bigWinnerEl.innerHTML = `🤖 GAME COMPLETE 🤖<br>Results Processing...`;
    }
    
    const finalOracleEl = document.getElementById('final-oracle');
    if (finalOracleEl) {
        finalOracleEl.textContent = data.winner.score > 0 ? 'DEFEATED' : 'VICTORIOUS';
    }
    
    const finalOracleMessageEl = document.getElementById('final-oracle-message');
    if (finalOracleMessageEl) {
        finalOracleMessageEl.textContent = `"${data.message}"`;
    }
    
    const finalScoresEl = document.getElementById('final-scores');
    if (finalScoresEl) {
        finalScoresEl.innerHTML = scoresHtml;
    }
    
    if (data.roundHistory && Array.isArray(data.roundHistory) && data.roundHistory.length > 0) {
        console.log('Valid final round history found - calling createPointsTable');
        console.log('Calling createPointsTable with tableId: final-points-table');
        createPointsTable(data.roundHistory, 'final-points-table');
        console.log('Final createPointsTable call completed');
    } else {
        console.warn('No final round history data received');
        const finalPointsTable = document.getElementById('final-points-table');
        console.log('Final points table element found:', !!finalPointsTable);
        if (finalPointsTable) {
            finalPointsTable.innerHTML = '<div class="no-data">Final leaderboard data not available</div>';
        }
    }
    
    console.log('Showing game over page');
    showPage('gameOver');
    console.log('=== GAME OVER DEBUG END ===');
});

socket.on('error', (data) => {
    console.error('Socket error:', data.message);
    showNotification(data.message, 'error');
});

// Handle spectator activation
socket.on('spectator-activated', (data) => {
    showNotification(data.message, 'success');
    if (window.audioManager) window.audioManager.playCorrectSound();
});

// Handle game state updates for mid-game joiners
socket.on('game-state-update', (data) => {
    console.log('Game state update received:', data);
    showNotification(data.message, 'info');
    
    // Update UI based on current game state
    switch (data.gameState) {
        case 'riddle-phase':
            showNotification('Riddle phase in progress - watch and wait for next round!', 'info');
            break;
        case 'challenge-phase':
            showNotification('Challenge phase in progress - you\'ll join next round!', 'info');
            break;
        default:
            showNotification('Game in progress - you\'ll participate soon!', 'info');
    }
});

// Handle game ended due to insufficient players
socket.on('game-ended', (data) => {
    showNotification(data.message, 'warning');
    
    // Show game ended screen or return to lobby
    const gameEndedMessage = document.createElement('div');
    gameEndedMessage.className = 'game-ended-overlay';
    gameEndedMessage.innerHTML = `
        <div class="game-ended-content">
            <h2>Game Ended</h2>
            <p>${data.message}</p>
            <p>Reason: ${data.reason}</p>
            <button onclick="this.parentElement.parentElement.remove(); showPage('lobby');" class="btn primary">
                Return to Lobby
            </button>
        </div>
    `;
    document.body.appendChild(gameEndedMessage);
    
    setTimeout(() => {
        gameEndedMessage.remove();
        showPage('lobby');
    }, 5000);
});

// Mobile optimization and keyboard handling
function handleMobileKeyboard() {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
        // Aggressive mobile performance optimizations
        console.log('Mobile device detected - applying performance optimizations');
        
        // Disable smooth scrolling to reduce CPU load
        document.documentElement.style.scrollBehavior = 'auto';
        
        // Reduce DOM update frequency
        window.mobileOptimized = true;
        
        // Optimize audio for mobile
        if (window.audioManager) {
            window.audioManager.optimizeForMobile();
        }
        
        // Prevent zoom when focusing inputs
        document.querySelectorAll('input, textarea').forEach(input => {
            input.addEventListener('focus', () => {
                if (input.style.fontSize !== '16px') {
                    input.style.fontSize = '16px';
                }
            });
        });
        
        // Handle viewport changes when keyboard opens/closes
        let initialViewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        
        function handleViewportChange() {
            if (window.visualViewport) {
                const currentHeight = window.visualViewport.height;
                const heightDiff = initialViewportHeight - currentHeight;
                
                if (heightDiff > 150) {
                    // Keyboard is likely open
                    document.body.classList.add('keyboard-open');
                } else {
                    // Keyboard is likely closed
                    document.body.classList.remove('keyboard-open');
                }
            }
        }
        
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleViewportChange);
        }
    }
}


// Add audio controls to all pages
function addAudioControlsToAllPages() {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        // Skip if already has audio controls
        if (page.querySelector('.top-audio-bar')) return;
        
        const audioBar = document.createElement('div');
        audioBar.className = 'top-audio-bar';
        audioBar.innerHTML = `
            <div class="audio-controls-top">
                <button class="audio-toggle-btn audio-btn-top" title="Toggle Audio">
                    <span class="audio-icon">🔊</span>
                </button>
                <button class="audio-settings-btn audio-btn-top" title="Audio Settings">
                    <span class="audio-icon">⚙️</span>
                </button>
            </div>
        `;
        
        // Insert as first child after matrix-bg if it exists
        const matrixBg = page.querySelector('.matrix-bg');
        if (matrixBg) {
            matrixBg.insertAdjacentElement('afterend', audioBar);
        } else {
            page.insertBefore(audioBar, page.firstChild);
        }
    });
    
    // Add event listeners to all audio control buttons
    document.querySelectorAll('.audio-toggle-btn').forEach(btn => {
        btn.addEventListener('click', toggleAudio);
    });
    
    document.querySelectorAll('.audio-settings-btn').forEach(btn => {
        btn.addEventListener('click', showAudioSettings);
    });
    
    // Add event listeners for home screen specific buttons (by ID)
    const homeAudioToggle = document.getElementById('audio-toggle-btn');
    const homeAudioSettings = document.getElementById('audio-settings-btn');
    
    if (homeAudioToggle) {
        homeAudioToggle.addEventListener('click', toggleAudio);
        console.log('Home screen audio toggle button event listener added');
    }
    
    if (homeAudioSettings) {
        homeAudioSettings.addEventListener('click', showAudioSettings);
        console.log('Home screen audio settings button event listener added');
    }
}

// Audio status indicator
function updateSystemStatus(status, color = 'var(--accent-green)') {
    const statusText = document.getElementById('status-text');
    const statusIndicator = document.getElementById('status-indicator');
    if (statusText) statusText.textContent = status;
    if (statusIndicator) statusIndicator.style.color = color;
}

// Monitor audio initialization
function checkAudioStatus() {
    if (window.audioManager) {
        if (window.audioManager.isInitialized) {
            updateSystemStatus('AUDIO READY', 'var(--accent-green)');
        } else {
            // Check if preloading is in progress
            const preloadCount = window.audioManager.preloadedBuffers ? 
                Object.keys(window.audioManager.preloadedBuffers).length : 0;
            
            if (preloadCount > 0) {
                updateSystemStatus(`PRELOADED ${preloadCount}/3 - CLICK TO START`, 'var(--accent-yellow)');
            } else {
                updateSystemStatus('CLICK TO ENABLE AUDIO', 'var(--accent-yellow)');
            }
        }
    } else {
        updateSystemStatus('LOADING...', 'var(--accent-yellow)');
    }
}

// Check audio status only when needed (removed continuous polling to save battery)
// setInterval(checkAudioStatus, 1000); // Disabled for mobile performance

// Add a global click handler to ensure audio starts on any click
document.addEventListener('click', function(event) {
    if (window.audioManager && !window.audioManager.isInitialized) {
        console.log('Global click detected - initializing audio');
        window.audioManager.init().then(() => {
            console.log('Audio initialized from global click - starting home music');
            setTimeout(() => {
                if (window.audioManager && window.audioManager.isInitialized) {
                    window.audioManager.playMusic('home');
                }
            }, 100);
        }).catch(console.error);
    } else if (window.audioManager && window.audioManager.isInitialized && !window.audioManager.currentTrack) {
        // If audio is initialized but no music is playing, start home music
        console.log('Audio initialized but no music playing - starting home music');
        window.audioManager.playMusic('home');
    }
}, { once: false }); // Don't use once, so it can retry

// Cleanup function to prevent memory leaks and battery drain
function cleanupTimers() {
    console.log('Cleaning up timers for mobile performance...');
    
    if (window.challengeTimer) {
        clearInterval(window.challengeTimer);
        window.challengeTimer = null;
    }
    
    if (window.riddleTimer) {
        clearInterval(window.riddleTimer);
        window.riddleTimer = null;
    }
    
    if (window.riddleChallengeTimer) {
        clearInterval(window.riddleChallengeTimer);
        window.riddleChallengeTimer = null;
    }
    
    if (window.triviaTimer) {
        clearInterval(window.triviaTimer);
        window.triviaTimer = null;
    }
}

// Clean up when page is hidden or user navigates away (saves mobile battery)
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        console.log('Page hidden - cleaning up for mobile performance');
        cleanupTimers();
        
        // Pause audio to save battery
        if (window.audioManager) {
            window.audioManager.pauseAllAudio();
        }
    } else {
        console.log('Page visible - resuming audio if needed');
        // Resume audio when page becomes visible again
        if (window.audioManager && window.audioManager.isInitialized) {
            window.audioManager.resumeAudio();
            window.audioManager.playMusic('home');
        }
    }
});

// Clean up when user leaves the page
window.addEventListener('beforeunload', function() {
    cleanupTimers();
    if (window.audioManager) {
        window.audioManager.pauseAllAudio();
    }
});

// Initialize
addAudioControlsToAllPages();
showPage('home');
handleMobileKeyboard();
checkAudioStatus(); // Initial check

// Only focus on desktop to prevent mobile keyboard popup
if (!/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    playerNameInput.focus();
}
console.log('Frontend loaded - Crack and Combat v4.8 (Enhanced Mobile Performance)');
