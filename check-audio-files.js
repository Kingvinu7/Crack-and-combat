#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const musicDir = './public/audio/music';
const sfxDir = './public/audio/sfx';

const expectedMusicFiles = [
    'cyber-ambient.mp3',
    'waiting-tension.mp3',
    'mysterious-voice.mp3',
    'thinking-pressure.mp3',
    'intense-focus.mp3',
    'reveal-dramatic.mp3',
    'triumph-epic.mp3',
    'dark-ominous.mp3'
];

const expectedSfxFiles = [
    'ui-click.mp3',
    'submit-answer.mp3',
    'correct-chime.mp3',
    'incorrect-buzz.mp3',
    'timer-tick.mp3',
    'notification-pop.mp3',
    'page-transition.mp3',
    'tap-sound.mp3'
];

console.log('🎵 Crack and Combat - Audio Files Check\n');

// Check music directory
console.log('📁 Music Directory:', musicDir);
try {
    const musicFiles = fs.readdirSync(musicDir);
    console.log('   Found files:', musicFiles.length);
    
    musicFiles.forEach(file => {
        if (file !== 'test-upload.txt') {
            const filePath = path.join(musicDir, file);
            const stats = fs.statSync(filePath);
            console.log(`   ✓ ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
        }
    });
    
    console.log('\n🎯 Expected music files:');
    expectedMusicFiles.forEach(file => {
        const exists = musicFiles.includes(file);
        console.log(`   ${exists ? '✅' : '❌'} ${file}`);
    });
    
} catch (error) {
    console.log('   ❌ Error reading music directory:', error.message);
}

// Check SFX directory
console.log('\n📁 SFX Directory:', sfxDir);
try {
    const sfxFiles = fs.readdirSync(sfxDir);
    console.log('   Found files:', sfxFiles.length);
    
    sfxFiles.forEach(file => {
        const filePath = path.join(sfxDir, file);
        const stats = fs.statSync(filePath);
        console.log(`   ✓ ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
    });
    
    console.log('\n🎯 Expected SFX files:');
    expectedSfxFiles.forEach(file => {
        const exists = sfxFiles.includes(file);
        console.log(`   ${exists ? '✅' : '❌'} ${file}`);
    });
    
} catch (error) {
    console.log('   ❌ Error reading SFX directory:', error.message);
}

console.log('\n💡 Instructions:');
console.log('1. Upload your music files to: public/audio/music/');
console.log('2. Upload your sound effects to: public/audio/sfx/');
console.log('3. Use the exact filenames shown above');
console.log('4. Supported formats: .mp3, .wav, .ogg');
console.log('5. Run this script again to verify: node check-audio-files.js');