# Audio Assets for Crack and Combat

This directory contains all audio assets for the game. The audio system supports both Web Audio API and HTML5 Audio fallback.

## Directory Structure

```
audio/
├── music/          # Background music tracks
│   ├── cyber-ambient.mp3      # Home screen - mysterious, cyberpunk ambient
│   ├── waiting-tension.mp3    # Lobby - building anticipation
│   ├── mysterious-voice.mp3   # Oracle speaking - ethereal, AI-like
│   ├── thinking-pressure.mp3  # Riddle solving - focused, ticking tension
│   ├── intense-focus.mp3      # Challenges - high-stakes concentration
│   ├── reveal-dramatic.mp3    # Results reveal - dramatic buildup
│   ├── triumph-epic.mp3       # Victory - celebratory, epic
│   └── dark-ominous.mp3       # Defeat/Oracle wins - dark, foreboding
└── sfx/            # Sound effects
    ├── ui-click.mp3           # Button clicks
    ├── submit-answer.mp3      # Answer submission
    ├── correct-chime.mp3      # Correct answer feedback
    ├── incorrect-buzz.mp3     # Wrong answer feedback
    ├── timer-tick.mp3         # Timer countdown
    ├── notification-pop.mp3   # General notifications
    ├── page-transition.mp3    # Screen transitions
    └── tap-sound.mp3          # Fast tapper feedback
```

## Music Recommendations

### Background Music Tracks

1. **cyber-ambient.mp3** (Home Screen)
   - Style: Dark ambient, cyberpunk
   - Mood: Mysterious, technological
   - Duration: 2-3 minutes (loops seamlessly)
   - Example: Blade Runner-style ambient soundscape

2. **waiting-tension.mp3** (Lobby)
   - Style: Subtle tension building
   - Mood: Anticipation, preparation
   - Duration: 1-2 minutes (loops)
   - Example: Pre-battle tension music

3. **mysterious-voice.mp3** (Oracle Speaking)
   - Style: Ethereal, AI-like
   - Mood: Otherworldly, intelligent
   - Duration: 30-60 seconds
   - Example: Sci-fi AI communication sounds

4. **thinking-pressure.mp3** (Riddles)
   - Style: Focused, rhythmic
   - Mood: Concentration, time pressure
   - Duration: 1-2 minutes (loops)
   - Example: Quiz show tension music

5. **intense-focus.mp3** (Challenges)
   - Style: High-energy, driving
   - Mood: Intense concentration
   - Duration: 1-2 minutes (loops)
   - Example: Action movie thinking scenes

6. **reveal-dramatic.mp3** (Results)
   - Style: Dramatic orchestral
   - Mood: Revelation, suspense
   - Duration: 30-45 seconds
   - Example: Game show result reveal

7. **triumph-epic.mp3** (Victory)
   - Style: Epic, celebratory
   - Mood: Achievement, success
   - Duration: 45-60 seconds
   - Example: Victory fanfare

8. **dark-ominous.mp3** (Defeat)
   - Style: Dark, foreboding
   - Mood: Failure, AI dominance
   - Duration: 30-45 seconds
   - Example: Villain victory theme

### Sound Effects

- **ui-click.mp3**: Subtle, satisfying click (50-100ms)
- **submit-answer.mp3**: Confirmation beep (200-300ms)
- **correct-chime.mp3**: Pleasant success sound (500ms)
- **incorrect-buzz.mp3**: Negative feedback buzz (300-500ms)
- **timer-tick.mp3**: Urgent ticking sound (100ms)
- **notification-pop.mp3**: Friendly notification (200ms)
- **page-transition.mp3**: Smooth transition whoosh (300ms)
- **tap-sound.mp3**: Quick tap feedback (50ms)

## Recommended Sources for Royalty-Free Music

1. **Freesound.org** - Community-driven sound library
2. **Zapsplat.com** - Professional sound effects (free with registration)
3. **YouTube Audio Library** - Free music and sound effects
4. **Incompetech.com** - Kevin MacLeod's royalty-free music
5. **Pixabay Music** - Free music tracks
6. **Adobe Stock Audio** - Premium option
7. **Epidemic Sound** - Subscription service

## Audio Format Requirements

- **Format**: MP3 (widely supported) or OGG (smaller file size)
- **Quality**: 128-192 kbps for music, 64-128 kbps for SFX
- **Length**: Music should loop seamlessly, SFX should be short
- **Volume**: Normalized to prevent clipping

## Implementation Notes

The audio system automatically:
- Handles browser autoplay restrictions
- Provides HTML5 Audio fallback
- Manages volume levels independently
- Saves user preferences
- Gracefully handles missing files

## Adding New Audio Files

1. Add your audio files to the appropriate directory
2. Update the file paths in `audio-manager.js` if needed
3. Test across different browsers and devices
4. Ensure files are optimized for web delivery