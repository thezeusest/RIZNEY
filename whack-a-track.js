/* ============================================================
   WHACK-A-TRACK
   Mewzing.com mini-game
   ============================================================ */

(() => {
  "use strict";

  // ------------------------------------------------------------
  // SETTINGS
  // ------------------------------------------------------------

  const SETTINGS = {
    // Higher number = harder to destroy
    STARTING_HEALTH: 32,

    // How quickly moles appear
    START_MOLE_DELAY: 850,

    // How quickly the game becomes harder
    MIN_MOLE_DELAY: 260,

    // How long a mole stays visible
    START_VISIBLE_TIME: 650,
    MIN_VISIBLE_TIME: 180,

    // Number of columns on mobile
    // Deliberately reduced to keep targets large.
    MOBILE_COLUMNS: 2,
    DESKTOP_COLUMNS: 3,

    // Number of rows
    ROWS: 2,

    STORAGE_KEY: "mewzing_whack_a_track_destroyed"
  };

  // ------------------------------------------------------------
  // STATE
  // ------------------------------------------------------------

  let game = null;
  let moleTimer = null;
  let countdownTimer = null;
  let currentAudio = null;
  let currentTrack = null;
  let gameActive = false;
  let gameWon = false;

  // ------------------------------------------------------------
  // HELPERS
  // ------------------------------------------------------------

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  function isMobile() {
    return window.matchMedia("(max-width: 700px)").matches;
  }

  function getDestroyedTracks() {
    try {
      const saved = localStorage.getItem(SETTINGS.STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveDestroyedTrack(id) {
    if (!id) return;

    const tracks = getDestroyedTracks();

    if (!tracks.includes(id)) {
      tracks.push(id);
      localStorage.setItem(
        SETTINGS.STORAGE_KEY,
        JSON.stringify(tracks)
      );
    }
  }

  function restoreDestroyedTracks() {
    localStorage.removeItem(SETTINGS.STORAGE_KEY);

    // Reload so the existing music grid can rebuild normally.
    window.location.reload();
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) {
      return "0:00";
    }

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${mins}:${String(secs).padStart(2, "0")}`;
  }

  // ------------------------------------------------------------
  // FIND CURRENT SONG
  // ------------------------------------------------------------

  function findAudio() {
    // Prefer an actively playing HTML5 audio element.
    const audios = $$("audio");

    const playing = audios.find(
      audio =>
        !audio.paused &&
        !audio.ended &&
        audio.currentTime > 0
    );

    return playing || audios[0] || null;
  }

  function getTrackTitle(audio) {
    if (!audio) return "UNKNOWN TRACK";

    // Common possibilities for an existing music site.
    const sources = [
      audio.dataset.title,
      audio.getAttribute("data-title"),
      audio
