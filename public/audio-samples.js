/**
 * Sample Audio Generator for Crack and Combat
 * Creates basic audio samples using Web Audio API when real files are not available
 */

class AudioSampleGenerator {
    constructor(audioContext) {
        this.audioContext = audioContext;
    }
    
    // Generate a simple sine wave tone
    generateTone(frequency, duration, volume = 0.3) {
        const sampleRate = this.audioContext.sampleRate;
        const frameCount = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
        const channelData = buffer.getChannelData(0);
        
        for (let i = 0; i < frameCount; i++) {
            const t = i / sampleRate;
            channelData[i] = Math.sin(2 * Math.PI * frequency * t) * volume * Math.exp(-t * 0.5);
        }
        
        return buffer;
    }
    
    // Generate a more complex tone with harmonics
    generateComplexTone(baseFreq, duration, volume = 0.3) {
        const sampleRate = this.audioContext.sampleRate;
        const frameCount = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
        const channelData = buffer.getChannelData(0);
        
        for (let i = 0; i < frameCount; i++) {
            const t = i / sampleRate;
            let sample = 0;
            
            // Add harmonics
            sample += Math.sin(2 * Math.PI * baseFreq * t) * 0.5;
            sample += Math.sin(2 * Math.PI * baseFreq * 2 * t) * 0.25;
            sample += Math.sin(2 * Math.PI * baseFreq * 3 * t) * 0.125;
            
            // Apply envelope
            const envelope = Math.exp(-t * 2);
            channelData[i] = sample * volume * envelope;
        }
        
        return buffer;
    }
    
    // Generate white noise
    generateNoise(duration, volume = 0.1) {
        const sampleRate = this.audioContext.sampleRate;
        const frameCount = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
        const channelData = buffer.getChannelData(0);
        
        for (let i = 0; i < frameCount; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 3);
            channelData[i] = (Math.random() * 2 - 1) * volume * envelope;
        }
        
        return buffer;
    }
    
    // Generate a click sound
    generateClick() {
        return this.generateTone(800, 0.1, 0.2);
    }
    
    // Generate a submit sound
    generateSubmit() {
        return this.generateComplexTone(600, 0.3, 0.3);
    }
    
    // Generate a correct answer chime
    generateCorrect() {
        const sampleRate = this.audioContext.sampleRate;
        const duration = 0.6;
        const frameCount = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
        const channelData = buffer.getChannelData(0);
        
        // Play ascending notes: C, E, G
        const frequencies = [523.25, 659.25, 783.99];
        const noteDuration = duration / frequencies.length;
        
        for (let i = 0; i < frameCount; i++) {
            const t = i / sampleRate;
            const noteIndex = Math.floor(t / noteDuration);
            const noteTime = t - (noteIndex * noteDuration);
            
            if (noteIndex < frequencies.length) {
                const freq = frequencies[noteIndex];
                const envelope = Math.exp(-noteTime * 2);
                channelData[i] = Math.sin(2 * Math.PI * freq * noteTime) * 0.3 * envelope;
            }
        }
        
        return buffer;
    }
    
    // Generate an incorrect answer buzz
    generateIncorrect() {
        return this.generateTone(200, 0.4, 0.4);
    }
    
    // Generate a timer tick
    generateTimer() {
        return this.generateTone(1000, 0.05, 0.3);
    }
    
    // Generate a notification pop
    generateNotification() {
        return this.generateComplexTone(440, 0.2, 0.25);
    }
    
    // Generate a transition whoosh
    generateTransition() {
        return this.generateNoise(0.3, 0.15);
    }
    
    // Generate a tap sound
    generateTap() {
        return this.generateTone(1200, 0.05, 0.2);
    }
    
    // Generate all sample sounds
    generateAllSamples() {
        return {
            click: this.generateClick(),
            submit: this.generateSubmit(),
            correct: this.generateCorrect(),
            incorrect: this.generateIncorrect(),
            timer: this.generateTimer(),
            notification: this.generateNotification(),
            transition: this.generateTransition(),
            tap: this.generateTap()
        };
    }
}

// Export for use in audio manager
window.AudioSampleGenerator = AudioSampleGenerator;