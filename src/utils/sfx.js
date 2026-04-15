// Shared general-select sound, used globally across all pages
const selectAudio = new Audio("/sfx-select.wav");
selectAudio.preload = "auto";
selectAudio.volume = 0.3;

export function playSelectSfx() {
  selectAudio.currentTime = 0;
  selectAudio.play().catch(() => {});
}

// Save / Buy sound
const saveAudio = new Audio("/sfx-save.wav");
saveAudio.preload = "auto";
saveAudio.volume = 0.3;

export function playSaveSfx() {
  saveAudio.currentTime = 0;
  saveAudio.play().catch(() => {});
}
