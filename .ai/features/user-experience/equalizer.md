# Feature: Equalizer

## Status
- [x] Not Started
- [ ] In Progress
- [ ] Complete

## Priority
P2 (Important)

## Complexity
Medium

## Overview
Audio equalizer with preset configurations (Bass Boost, Vocal, Rock, Pop, etc.) and custom EQ bands. Allows users to adjust audio frequency response to match their preferences, headphones, or music genre.

## User Stories
- As a user, I want to boost bass frequencies so that electronic music sounds more impactful
- As a user, I want to use preset EQ profiles so that I don't have to manually adjust frequencies
- As a user, I want to save custom EQ presets so that I can quickly switch between my preferred settings
- As a user, I want the EQ settings to persist across sessions so that I don't have to reconfigure them

## Acceptance Criteria
- [ ] 10-band graphic equalizer with adjustable frequency bands
- [ ] At least 6 built-in presets (Flat, Bass Boost, Treble Boost, Vocal, Rock, Electronic)
- [ ] Ability to create, save, and delete custom presets
- [ ] Real-time audio processing without audible glitches
- [ ] Visual feedback showing current EQ curve
- [ ] Settings persist in local storage
- [ ] EQ can be enabled/disabled with a toggle
- [ ] Works with all audio formats supported by the player

## Technical Approach

### Frontend Changes
- **Files to modify:**
  - `frontend/src/stores/playerStore.ts` - Add EQ state and settings
  - `frontend/src/components/Player/` - Add EQ controls
- **New components:**
  - `frontend/src/components/Player/Equalizer/Equalizer.tsx` - Main EQ component
  - `frontend/src/components/Player/Equalizer/EQSlider.tsx` - Individual band slider
  - `frontend/src/components/Player/Equalizer/EQPresets.tsx` - Preset selector
  - `frontend/src/components/Player/Equalizer/EQVisualizer.tsx` - Frequency curve display
- **State changes:**
  - Add `eqEnabled: boolean` to player store
  - Add `eqBands: number[]` (array of 10 gain values in dB)
  - Add `eqPreset: string | null` for current preset
  - Add `customPresets: EQPreset[]` for user presets

### Audio Implementation
- **Web Audio API:**
  ```typescript
  // Create audio context and connect nodes
  const audioContext = new AudioContext();
  const source = audioContext.createMediaElementSource(audioElement);

  // Create 10 BiquadFilterNodes for each frequency band
  const frequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
  const filters = frequencies.map(freq => {
    const filter = audioContext.createBiquadFilter();
    filter.type = 'peaking';
    filter.frequency.value = freq;
    filter.Q.value = 1.4; // Standard Q for 10-band EQ
    filter.gain.value = 0; // dB, range -12 to +12
    return filter;
  });

  // Chain: source -> filters -> destination
  source.connect(filters[0]);
  filters.reduce((prev, curr) => { prev.connect(curr); return curr; });
  filters[filters.length - 1].connect(audioContext.destination);
  ```

### Backend Changes
- **No backend changes required** - EQ is purely client-side audio processing
- Future consideration: Store user presets in database for cloud sync

### Database Changes
- None for initial implementation
- Future: Add `eq_presets` table for cloud sync feature

## Dependencies
- **Requires:** Core player functionality must be working
- **Blocks:** None

## Built-in Presets

| Preset | 32Hz | 64Hz | 125Hz | 250Hz | 500Hz | 1kHz | 2kHz | 4kHz | 8kHz | 16kHz |
|--------|------|------|-------|-------|-------|------|------|------|------|-------|
| Flat | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Bass Boost | 6 | 5 | 4 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| Treble Boost | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 4 | 5 | 6 |
| Vocal | -2 | -1 | 0 | 2 | 4 | 4 | 3 | 2 | 0 | -1 |
| Rock | 4 | 3 | 1 | 0 | -1 | 0 | 2 | 3 | 4 | 4 |
| Electronic | 5 | 4 | 2 | 0 | -1 | 0 | 1 | 3 | 4 | 5 |

## Notes
- Web Audio API is well-supported in modern browsers
- Consider adding a "Reset" button to quickly return to flat EQ
- May need to handle audio context suspension/resumption on mobile
- BiquadFilter with 'peaking' type is the standard approach for parametric EQ
- Q value of 1.4 provides good separation between bands without excessive overlap
