const SOUND_PATH = "/sounds/new-order-notification-01.mp3";
const COOLDOWN_MS = 220; // minimal gap to restart sound cleanly

let audio: HTMLAudioElement | null = null;
let lastPlayed = 0;
let enabled = false;

// BroadcastChannel so only one tab plays the alert
const bcSupported =
  typeof window !== "undefined" && "BroadcastChannel" in window;
const bc = bcSupported ? new BroadcastChannel("order-alert") : null;
if (bc) {
  bc.onmessage = (ev) => {
    if (ev.data === "play") {
      // another tab requested playback
    }
  };
}

function ensureAudio() {
  if (audio) return;
  audio = new Audio(SOUND_PATH);
  audio.preload = "auto";
  audio.volume = 0.95;

  try {
    const ctx = new (window.AudioContext ||
      (
        window as unknown as Window & {
          webkitAudioContext: typeof AudioContext;
        }
      ).webkitAudioContext)();
    fetch(SOUND_PATH)
      .then((r) => r.arrayBuffer())
      .then((buf) => ctx.decodeAudioData(buf))
      .catch(() => {});
  } catch (err) {
    console.warn(
      "Web Audio API not supported, skipping audio context preloading. Error:",
      err
    );
  }
}

export async function enableSoundByUserGesture(): Promise<boolean> {
  // calling this from a click handler to "unlock" audio playback
  ensureAudio();
  if (!audio) return false;
  try {
    await audio.play();
    audio.pause();
    audio.currentTime = 0;
    enabled = true;
    return true;
  } catch {
    // Still mark enabled; subsequent gesture should work
    enabled = true;
    return false;
  }
}

export function isSoundEnabled() {
  return enabled;
}

/**
 * Play the short notification sound. Will broadcast to other tabs so only one plays.
 */
export function play() {
  ensureAudio();
  if (!audio) return;

  // If BroadcastChannel exists, announce play; other tabs that get it should not play.
  if (bc) {
    // let other tabs know; they can decide not to play
    bc.postMessage("play");
  }

  if (!enabled) {
    // don't attempt automatic playback if not enabled by user gesture
    console.warn(
      "Audio not enabled. Call enableSoundByUserGesture() after a user click."
    );
    return;
  }

  const now = Date.now();
  if (now - lastPlayed < COOLDOWN_MS) {
    // quick restart ensures latest is heard
    try {
      audio.currentTime = 0;
    } catch {
      // ignore
    }
  }
  lastPlayed = now;

  const p = audio.play();
  if (p && p instanceof Promise) {
    p.catch((err) => {
      console.warn("Playback failed:", err);
    });
  }
}

// Automatically enable sound on any user interaction or when tab becomes visible
if (typeof window !== "undefined") {
  const cleanup = () => {
    document.removeEventListener("click", tryEnable);
    document.removeEventListener("touchstart", tryEnable);
    document.removeEventListener("visibilitychange", tryEnable);
    document.removeEventListener("DOMContentLoaded", tryEnable);
    window.removeEventListener("load", tryEnable);
    window.removeEventListener("focus", tryEnable);
    window.removeEventListener("pageshow", tryEnable);
  };

  const tryEnable = () => {
    if (!enabled) {
      enableSoundByUserGesture()
        .then((success) => {
          if (success) {
            cleanup();
          }
        })
        .catch(() => {});
    } else {
      cleanup();
    }
  };

  document.addEventListener("click", tryEnable, { once: true });
  document.addEventListener("touchstart", tryEnable, { once: true });
  document.addEventListener("visibilitychange", tryEnable);
  document.addEventListener("DOMContentLoaded", tryEnable);
  window.addEventListener("load", tryEnable);
  window.addEventListener("focus", tryEnable);
  window.addEventListener("pageshow", tryEnable);
}
