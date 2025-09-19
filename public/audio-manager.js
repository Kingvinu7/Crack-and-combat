/**
 * Audio Manager for Crack and Combat
 * Handles background music and sound effects with dynamic switching
 */

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterGainNode = null;
        this.musicGainNode = null;
        this.sfxGainNode = null;
        
        // Audio sources
        this.currentMusic = null;
        this.musicTracks = {};
        this.soundEffects = {};
        
        // Settings
        this.masterVolume = 0.7;
        this.musicVolume = 0.6;
        this.sfxVolume = 0.8;
        this.isMuted = false;
        
        // State tracking
        this.currentTrack = null;
        this.queuedTrack = null;
        this.isInitialized = false;
        this.preloadPromises = [];
        
        // Bind methods
        this.init = this.init.bind(this);
        this.playMusic = this.playMusic.bind(this);
        this.playSound = this.playSound.bind(this);
        this.stopMusic = this.stopMusic.bind(this);
        this.setVolume = this.setVolume.bind(this);
        this.toggleMute = this.toggleMute.bind(this);
        
        // Auto-initialize on user interaction
        this.setupAutoInit();
        
        // Start preloading audio files immediately (but don't decode yet)
        this.preloadAudioFiles();
    }
    
    // Preload audio files in the background for faster playback
    preloadAudioFiles() {
        const musicFiles = [
            '/audio/music/cyber-ambient.mp3',
            '/audio/music/intense-focus.mp3', 
            '/audio/music/triumph-epic.mp3'
        ];
        
        console.log('Starting audio file preload...');
        
        // Use fetch to start downloading files immediately
        musicFiles.forEach(url => {
            fetch(url)
                .then(response => {
                    if (response.ok) {
                        console.log(`Preloaded: ${url}`);
                        return response.arrayBuffer();
                    }
                })
                .then(buffer => {
                    // Store the raw buffer for later decoding
                    if (buffer) {
                        this.preloadedBuffers = this.preloadedBuffers || {};
                        this.preloadedBuffers[url] = buffer;
                    }
                })
                .catch(error => {
                    console.warn(`Failed to preload ${url}:`, error);
                });
        });
    }
    
    setupAutoInit() {
        const initOnInteraction = async (event) => {
            console.log('Audio manager: User interaction detected:', event.type);
            if (!this.isInitialized) {
                // Remove listeners immediately to prevent multiple init calls
                document.removeEventListener('click', initOnInteraction);
                document.removeEventListener('keydown', initOnInteraction);
                document.removeEventListener('touchstart', initOnInteraction);
                document.removeEventListener('touchend', initOnInteraction);
                document.removeEventListener('mousedown', initOnInteraction);
                
                console.log('Audio manager: Starting immediate initialization...');
                try {
                    await this.init();
                    console.log('Audio manager: Initialization completed successfully');
                } catch (error) {
                    console.error('Audio manager: Initialization failed:', error);
                }
            } else {
                console.log('Audio manager: Already initialized');
            }
        };
        
        console.log('Audio manager: Setting up auto-init listeners');
        // Use capture phase for faster response
        document.addEventListener('click', initOnInteraction, true);
        document.addEventListener('keydown', initOnInteraction, true);
        document.addEventListener('touchstart', initOnInteraction, true); // For mobile
        document.addEventListener('touchend', initOnInteraction, true); // Alternative mobile event
        document.addEventListener('mousedown', initOnInteraction, true); // Even faster than click
    }
    
    async init() {
        if (this.isInitialized) return;
        
        try {
            // Create Web Audio Context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Resume audio context immediately (required after user interaction)
            if (this.audioContext.state === 'suspended') {
                console.log('Resuming suspended audio context...');
                await this.audioContext.resume();
            }
            
            // Create gain nodes for volume control
            this.masterGainNode = this.audioContext.createGain();
            this.musicGainNode = this.audioContext.createGain();
            this.sfxGainNode = this.audioContext.createGain();
            
            // Connect audio graph
            this.musicGainNode.connect(this.masterGainNode);
            this.sfxGainNode.connect(this.masterGainNode);
            this.masterGainNode.connect(this.audioContext.destination);
            
            // Set initial volumes
            this.updateVolumes();
            
            this.isInitialized = true;
            console.log('Audio Manager initialized successfully');
            
            // Start playing immediately while loading assets in parallel
            const trackToPlay = this.queuedTrack || 'home';
            this.queuedTrack = null;
            
            // Load and play home track first for immediate feedback
            if (trackToPlay === 'home' && this.preloadedBuffers && this.preloadedBuffers['/audio/music/cyber-ambient.mp3']) {
                try {
                    const buffer = await this.audioContext.decodeAudioData(
                        this.preloadedBuffers['/audio/music/cyber-ambient.mp3'].slice(0)
                    );
                    this.musicTracks['home'] = buffer;
                    this.playMusic('home', false); // No fade for immediate playback
                } catch (e) {
                    console.warn('Failed to decode preloaded home track:', e);
                }
            }
            
            // Load remaining audio assets in background
            this.loadAudioAssets().then(() => {
                console.log('All audio assets loaded');
            }).catch(error => {
                console.warn('Some audio assets failed to load:', error);
            });
            
            // Show audio initialization success
            if (window.showNotification) {
                window.showNotification('Audio system ready! 🔊', 'success');
            }
            
        } catch (error) {
            console.warn('Audio initialization failed:', error);
            // Fallback to HTML5 audio if Web Audio API fails
            this.initFallback();
        }
    }
    
    initFallback() {
        console.log('Using HTML5 audio fallback');
        this.isInitialized = true;
        this.loadAudioAssetsFallback();
        
        // Play queued track or default to home screen music
        const trackToPlay = this.queuedTrack || 'home';
        console.log(`Audio manager (fallback): Playing ${trackToPlay} after initialization`);
        setTimeout(() => {
            this.playMusic(trackToPlay);
            this.queuedTrack = null;
        }, 500); // Small delay to ensure assets are loaded
    }
    
    async loadAudioAssets() {
        // Only load the 3 music files we actually use for faster loading
        const musicFiles = {
            home: '/audio/music/cyber-ambient.mp3',        // Default music
            challenge: '/audio/music/intense-focus.mp3',   // Challenge music  
            victory: '/audio/music/triumph-epic.mp3'       // Final winner music
        };
        
        const sfxFiles = {
            click: '/audio/sfx/ui-click.mp3',
            submit: '/audio/sfx/submit-answer.mp3',
            correct: '/audio/sfx/correct-chime.mp3',
            incorrect: '/audio/sfx/incorrect-buzz.mp3',
            timer: '/audio/sfx/timer-tick.mp3',
            notification: '/audio/sfx/notification-pop.mp3',
            transition: '/audio/sfx/page-transition.mp3',
            tap: '/audio/sfx/tap-sound.mp3'
        };
        
        // Skip home track if already loaded
        const trackOrder = this.musicTracks['home'] ? ['challenge', 'victory'] : ['home', 'challenge', 'victory'];
        
        // Load music tracks in parallel for faster loading
        const musicPromises = trackOrder.map(async (name) => {
            if (musicFiles[name]) {
                try {
                    const buffer = await this.loadAudioBuffer(musicFiles[name]);
                    if (buffer) {
                        this.musicTracks[name] = buffer;
                        console.log(`Music track loaded: ${name}`);
                    }
                } catch (error) {
                    console.warn(`Failed to load music track ${name}:`, error);
                    // Create fallback HTML5 audio
                    this.musicTracks[name] = this.createFallbackAudio(musicFiles[name], true);
                }
            }
        });
        
        await Promise.all(musicPromises);
        
        // Load sound effects
        for (const [name, url] of Object.entries(sfxFiles)) {
            try {
                const buffer = await this.loadAudioBuffer(url);
                if (buffer) {
                    this.soundEffects[name] = buffer;
                }
            } catch (error) {
                console.warn(`Failed to load sound effect ${name}:`, error);
                // Try to generate sample audio as fallback
                if (window.AudioSampleGenerator && this.audioContext) {
                    const generator = new AudioSampleGenerator(this.audioContext);
                    const sampleMethod = `generate${name.charAt(0).toUpperCase() + name.slice(1)}`;
                    if (typeof generator[sampleMethod] === 'function') {
                        try {
                            this.soundEffects[name] = generator[sampleMethod]();
                            console.log(`Generated sample audio for ${name}`);
                        } catch (genError) {
                            console.warn(`Failed to generate sample for ${name}:`, genError);
                            this.soundEffects[name] = this.createFallbackAudio(url, false);
                        }
                    } else {
                        this.soundEffects[name] = this.createFallbackAudio(url, false);
                    }
                } else {
                    this.soundEffects[name] = this.createFallbackAudio(url, false);
                }
            }
        }
    }
    
    loadAudioAssetsFallback() {
        // Only load the 3 music files we actually use for faster loading
        const musicFiles = {
            home: '/audio/music/cyber-ambient.mp3',        // Default music
            challenge: '/audio/music/intense-focus.mp3',   // Challenge music  
            victory: '/audio/music/triumph-epic.mp3'       // Final winner music
        };
        
        const sfxFiles = {
            click: '/audio/sfx/ui-click.mp3',
            submit: '/audio/sfx/submit-answer.mp3',
            correct: '/audio/sfx/correct-chime.mp3',
            incorrect: '/audio/sfx/incorrect-buzz.mp3',
            timer: '/audio/sfx/timer-tick.mp3',
            notification: '/audio/sfx/notification-pop.mp3',
            transition: '/audio/sfx/page-transition.mp3',
            tap: '/audio/sfx/tap-sound.mp3'
        };
        
        // Create HTML5 audio elements
        for (const [name, url] of Object.entries(musicFiles)) {
            this.musicTracks[name] = this.createFallbackAudio(url, true);
        }
        
        for (const [name, url] of Object.entries(sfxFiles)) {
            this.soundEffects[name] = this.createFallbackAudio(url, false);
        }
    }
    
    createFallbackAudio(url, isMusic) {
        const audio = new Audio();
        audio.src = url;
        audio.preload = 'auto';
        audio.volume = isMusic ? this.musicVolume * this.masterVolume : this.sfxVolume * this.masterVolume;
        if (isMusic) {
            audio.loop = true;
        }
        
        // Handle loading errors gracefully
        audio.addEventListener('error', () => {
            console.warn(`Failed to load audio: ${url}`);
        });
        
        return audio;
    }
    
    async loadAudioBuffer(url) {
        try {
            console.log(`Loading audio buffer: ${url}`);
            
            let arrayBuffer;
            
            // Check if we have a preloaded buffer
            if (this.preloadedBuffers && this.preloadedBuffers[url]) {
                console.log(`Using preloaded buffer for: ${url}`);
                arrayBuffer = this.preloadedBuffers[url];
            } else {
                // Fetch if not preloaded
                console.log(`Fetching audio buffer: ${url}`);
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                arrayBuffer = await response.arrayBuffer();
            }
            
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            console.log(`Successfully loaded audio buffer: ${url} (${audioBuffer.duration.toFixed(2)}s)`);
            return audioBuffer;
        } catch (error) {
            console.warn(`Failed to load ${url}:`, error);
            return null;
        }
    }
    
    playMusic(trackName, fadeIn = true) {
        if (!this.isInitialized) {
            // Queue the music to play after initialization
            console.log(`Audio manager: Queueing music "${trackName}" until initialization`);
            this.queuedTrack = trackName;
            return; // Don't retry, let init handle it
        }
        
        if (this.isMuted) return;
        
        // Check if the same track is already playing
        if (this.currentTrack === trackName && this.currentMusic) {
            console.log(`Music "${trackName}" is already playing - no change needed`);
            return;
        }
        
        const track = this.musicTracks[trackName];
        if (!track) {
            console.warn(`Music track not found: ${trackName}`);
            console.log(`Available tracks:`, Object.keys(this.musicTracks));
            return;
        }
        
        console.log(`Attempting to play track: ${trackName}`, {
            trackType: track.constructor.name,
            audioContextState: this.audioContext?.state,
            isMuted: this.isMuted,
            isInitialized: this.isInitialized
        });
        
        // Stop current music only if switching to a different track
        console.log(`Switching music from "${this.currentTrack}" to "${trackName}"`);
        this.stopMusic(false); // Immediate stop for clean transition
        
        try {
            if (track instanceof AudioBuffer && this.audioContext) {
                // Web Audio API
                const source = this.audioContext.createBufferSource();
                source.buffer = track;
                source.loop = true;
                source.connect(this.musicGainNode);
                
                if (fadeIn) {
                    this.musicGainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                    this.musicGainNode.gain.linearRampToValueAtTime(
                        this.musicVolume, 
                        this.audioContext.currentTime + 1
                    );
                }
                
                source.start(0);
                this.currentMusic = source;
            } else if (track instanceof HTMLAudioElement) {
                // HTML5 Audio fallback
                track.currentTime = 0;
                track.volume = this.musicVolume * this.masterVolume;
                
                const playPromise = track.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.warn('Music playback failed:', error);
                    });
                }
                
                this.currentMusic = track;
            }
            
            this.currentTrack = trackName;
            console.log(`Successfully playing music: ${trackName} (${track instanceof AudioBuffer ? 'Web Audio' : 'HTML5'})`);
            
        } catch (error) {
            console.warn(`Failed to play music ${trackName}:`, error);
        }
    }
    
    stopMusic(fadeOut = true) {
        console.log(`Stopping current music: ${this.currentTrack}`);
        
        if (!this.currentMusic) {
            console.log('No current music to stop');
            return;
        }
        
        try {
            if (this.currentMusic instanceof AudioBufferSourceNode) {
                // Web Audio API
                if (fadeOut && this.audioContext) {
                    this.musicGainNode.gain.linearRampToValueAtTime(
                        0, 
                        this.audioContext.currentTime + 0.3
                    );
                    setTimeout(() => {
                        if (this.currentMusic) {
                            try {
                                this.currentMusic.stop();
                            } catch (e) {
                                console.warn('Error stopping audio source:', e);
                            }
                            this.currentMusic = null;
                        }
                        // Reset gain for next track
                        if (this.musicGainNode) {
                            this.musicGainNode.gain.setValueAtTime(this.musicVolume, this.audioContext.currentTime);
                        }
                    }, 300);
                } else {
                    try {
                        this.currentMusic.stop();
                    } catch (e) {
                        console.warn('Error stopping audio source:', e);
                    }
                    this.currentMusic = null;
                    // Reset gain immediately
                    if (this.musicGainNode) {
                        this.musicGainNode.gain.setValueAtTime(this.musicVolume, this.audioContext.currentTime);
                    }
                }
            } else if (this.currentMusic instanceof HTMLAudioElement) {
                // HTML5 Audio - immediate stop for better control
                this.currentMusic.pause();
                this.currentMusic.currentTime = 0;
                this.currentMusic = null;
            }
        } catch (error) {
            console.warn('Error stopping music:', error);
        }
        
        // Always clear references immediately
        const previousTrack = this.currentTrack;
        this.currentMusic = null;
        this.currentTrack = null;
        
        console.log(`Music stopped: ${previousTrack}`);
    }
    
    // Stop music immediately without fade
    stopMusicImmediate() {
        this.stopMusic(false);
    }
    
    // Debug function to check current music state
    getCurrentMusicState() {
        return {
            currentTrack: this.currentTrack,
            hasCurrentMusic: !!this.currentMusic,
            isInitialized: this.isInitialized,
            isMuted: this.isMuted
        };
    }
    
    playSound(soundName, volume = 1.0) {
        if (!this.isInitialized || this.isMuted) return;
        
        const sound = this.soundEffects[soundName];
        if (!sound) {
            console.warn(`Sound effect not found: ${soundName}`);
            return;
        }
        
        try {
            if (sound instanceof AudioBuffer && this.audioContext) {
                // Web Audio API
                const source = this.audioContext.createBufferSource();
                const gainNode = this.audioContext.createGain();
                
                source.buffer = sound;
                source.connect(gainNode);
                gainNode.connect(this.sfxGainNode);
                gainNode.gain.value = volume;
                
                source.start(0);
            } else if (sound instanceof HTMLAudioElement) {
                // HTML5 Audio fallback
                const audioClone = sound.cloneNode();
                audioClone.volume = this.sfxVolume * this.masterVolume * volume;
                
                const playPromise = audioClone.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.warn(`Sound effect playback failed: ${soundName}`, error);
                    });
                }
            }
        } catch (error) {
            console.warn(`Failed to play sound ${soundName}:`, error);
        }
    }
    
    setVolume(type, value) {
        value = Math.max(0, Math.min(1, value));
        
        switch (type) {
            case 'master':
                this.masterVolume = value;
                break;
            case 'music':
                this.musicVolume = value;
                break;
            case 'sfx':
                this.sfxVolume = value;
                break;
        }
        
        this.updateVolumes();
        
        // Save to localStorage
        localStorage.setItem('audioSettings', JSON.stringify({
            masterVolume: this.masterVolume,
            musicVolume: this.musicVolume,
            sfxVolume: this.sfxVolume,
            isMuted: this.isMuted
        }));
    }
    
    updateVolumes() {
        if (this.masterGainNode) {
            this.masterGainNode.gain.value = this.isMuted ? 0 : this.masterVolume;
        }
        
        if (this.musicGainNode) {
            this.musicGainNode.gain.value = this.musicVolume;
        }
        
        if (this.sfxGainNode) {
            this.sfxGainNode.gain.value = this.sfxVolume;
        }
        
        // Update HTML5 audio volumes
        if (this.currentMusic instanceof HTMLAudioElement) {
            this.currentMusic.volume = this.isMuted ? 0 : this.musicVolume * this.masterVolume;
        }
    }
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        this.updateVolumes();
        
        if (this.isMuted) {
            this.stopMusic(false);
        } else if (this.currentTrack) {
            this.playMusic(this.currentTrack);
        }
        
        // Save to localStorage
        localStorage.setItem('audioSettings', JSON.stringify({
            masterVolume: this.masterVolume,
            musicVolume: this.musicVolume,
            sfxVolume: this.sfxVolume,
            isMuted: this.isMuted
        }));
        
        return this.isMuted;
    }
    
    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('audioSettings') || '{}');
            this.masterVolume = settings.masterVolume ?? 0.7;
            this.musicVolume = settings.musicVolume ?? 0.6;
            this.sfxVolume = settings.sfxVolume ?? 0.8;
            this.isMuted = settings.isMuted ?? false;
            this.updateVolumes();
        } catch (error) {
            console.warn('Failed to load audio settings:', error);
        }
    }
    
    // Game state-specific music methods
    playHomeMusic() { this.playMusic('home'); }
    playLobbyMusic() { this.playMusic('lobby'); }
    playOracleMusic() { this.playMusic('oracle'); }
    playRiddleMusic() { this.playMusic('riddle'); }
    playChallengeMusic() { this.playMusic('challenge'); }
    playResultsMusic() { this.playMusic('results'); }
    playVictoryMusic() { this.playMusic('victory'); }
    playDefeatMusic() { this.playMusic('defeat'); }
    
    // Sound effect shortcuts
    playClickSound() { this.playSound('click'); }
    playSubmitSound() { this.playSound('submit'); }
    playCorrectSound() { this.playSound('correct'); }
    playIncorrectSound() { this.playSound('incorrect'); }
    playTimerSound() { this.playSound('timer'); }
    playNotificationSound() { this.playSound('notification'); }
    playTransitionSound() { this.playSound('transition'); }
    playTapSound() { this.playSound('tap'); }
    
    // Mobile performance optimization
    pauseAllAudio() {
        if (this.currentMusic) {
            this.currentMusic.pause();
        }
        // Suspend audio context to save mobile battery
        if (this.audioContext && this.audioContext.state === 'running') {
            this.audioContext.suspend().catch(console.error);
        }
    }
    
    resumeAudio() {
        // Resume audio context
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(console.error);
        }
    }
}

// Create global audio manager instance
window.audioManager = new AudioManager();

// Load saved settings
window.audioManager.loadSettings();