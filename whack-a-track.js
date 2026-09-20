/* ============================================================
   WHACK-A-TRACK - Mewzing.com mini-game
   ============================================================ */

(() => {
  "use strict";

  const SETTINGS = {
    STARTING_HEALTH: 32,
    START_MOLE_DELAY: 850,
    MIN_MOLE_DELAY: 260,
    START_VISIBLE_TIME: 650,
    MIN_VISIBLE_TIME: 180,
    MOBILE_COLUMNS: 2,
    DESKTOP_COLUMNS: 3,
    ROWS: 2,
    STORAGE_KEY: "mewzing_whack_a_track_destroyed"
  };

  let game = null;
  let moleTimer = null;
  let countdownTimer = null;
  let currentTrack = null;
  let gameActive = false;
  let gameWon = false;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const isMobile = () => window.matchMedia("(max-width: 700px)").matches;
  const youtube = () => window.rizneyPlayer || null;
  const youtubePlaying = player => player && typeof player.getPlayerState === "function" && player.getPlayerState() === 1;

  function getDestroyedTracks() {
    try {
      const value = JSON.parse(localStorage.getItem(SETTINGS.STORAGE_KEY) || "[]");
      return Array.isArray(value) ? value : [];
    } catch { return []; }
  }

  function saveDestroyedTrack(id) {
    if (!id) return;
    const tracks = getDestroyedTracks();
    if (!tracks.includes(id)) {
      tracks.push(id);
      try { localStorage.setItem(SETTINGS.STORAGE_KEY, JSON.stringify(tracks)); } catch {}
    }
  }

  function restoreDestroyedTracks() {
    try { localStorage.removeItem(SETTINGS.STORAGE_KEY); } catch {}
    window.location.reload();
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
  }

  // The site uses the YouTube IFrame API, not HTML5 <audio>. The old code
  // only searched for <audio>, so it could never find the playing song.
  function findAudio() {
    const player = youtube();
    if (youtubePlaying(player)) return player;
    return $$("audio").find(audio => !audio.paused && !audio.ended) || null;
  }

  function isPlaying(source) {
    return source === youtube() ? youtubePlaying(source) : !!source && !source.paused && !source.ended;
  }

  function getTrackID(source) {
    if (source === youtube()) {
      try { return source.getVideoData().video_id || null; } catch { return null; }
    }
    return source?.dataset?.id || source?.dataset?.trackId || source?.src || null;
  }

  function getTrackTitle(source) {
    if (source === youtube()) {
      return $("#now-playing")?.textContent?.replace(/^Now playing:\s*/i, "").trim() || "CURRENT TRACK";
    }
    return source?.dataset?.title || source?.getAttribute?.("title") || "CURRENT TRACK";
  }

  function getCurrentTime(source) {
    try { return source === youtube() ? source.getCurrentTime() : source.currentTime; } catch { return 0; }
  }

  function getDuration(source) {
    try { return source === youtube() ? source.getDuration() : source.duration; } catch { return 0; }
  }

  function pauseSource(source) {
    try {
      if (source === youtube()) source.pauseVideo();
      else source.pause();
    } catch {}
  }

  function createGame() {
    if (game) return game;

    const launch = document.createElement("button");
    launch.id = "wat-launch";
    launch.type = "button";
    launch.textContent = "🎵 WHACK-A-TRACK";
    Object.assign(launch.style, {
      position: "fixed", top: "10px", right: "10px", zIndex: "1000",
      cursor: "pointer", padding: "10px 14px", borderRadius: "10px",
      border: "2px solid currentColor", background: "#55208a", color: "inherit",
      fontWeight: "800", fontSize: "14px", margin: "0", minHeight: "44px",
      touchAction: "manipulation"
    });
    document.body.appendChild(launch);

    const panel = document.createElement("section");
    panel.id = "whack-a-track";
    panel.setAttribute("aria-label", "Whack-A-Track game");
    Object.assign(panel.style, {
      display: "none", width: "100%", maxWidth: "620px", margin: "30px auto",
      padding: "18px", boxSizing: "border-box", border: "3px solid currentColor",
      borderRadius: "16px", background: "rgba(0,0,0,0.06)", textAlign: "center"
    });
    panel.innerHTML = `
      <div style="font-size:26px;font-weight:900;margin-bottom:8px">🎵 WHACK-A-TRACK</div>
      <div id="wat-track-title" style="font-weight:800;margin-bottom:14px;overflow-wrap:anywhere">NOW WHACKING: —</div>
      <div style="display:flex;justify-content:space-between;font-weight:800;font-size:14px;margin-bottom:5px"><span>SONG HEALTH</span><span id="wat-hits-left">32 WHACKS LEFT</span></div>
      <div style="height:22px;border:2px solid currentColor;border-radius:8px;overflow:hidden;margin-bottom:10px"><div id="wat-health" style="height:100%;width:100%;background:currentColor;transition:width .12s linear"></div></div>
      <div id="wat-time" style="font-size:18px;font-weight:900;margin-bottom:16px">TIME LEFT 0:00</div>
      <div id="wat-message" aria-live="polite" style="min-height:42px;font-size:24px;font-weight:900;margin-bottom:10px"></div>
      <div id="wat-board" style="display:grid;gap:12px;width:100%;max-width:500px;margin:0 auto"></div>
      <button id="wat-close" type="button" style="margin-top:18px;min-height:44px;padding:10px 16px;border:2px solid currentColor;border-radius:10px;background:transparent;color:inherit;font-weight:800;cursor:pointer">CLOSE</button>`;
    ( $("main") || document.body ).appendChild(panel);

    const restore = document.createElement("button");
    restore.type = "button";
    restore.textContent = "↩ Restore Destroyed Tracks";
    Object.assign(restore.style, { display: "block", margin: "12px auto 30px", minHeight: "44px", padding: "8px 12px", border: "0", background: "transparent", color: "inherit", cursor: "pointer", opacity: ".75", fontSize: "12px" });
    ( $("main") || document.body ).appendChild(restore);

    const board = $("#wat-board", panel);
    const holes = [];
    for (let i = 0; i < SETTINGS.ROWS * SETTINGS.DESKTOP_COLUMNS; i++) {
      const hole = document.createElement("button");
      hole.type = "button";
      Object.assign(hole.style, { position: "relative", minHeight: isMobile() ? "105px" : "125px", border: "0", borderRadius: "14px", background: "transparent", cursor: "pointer", overflow: "hidden", padding: "0", touchAction: "manipulation" });
      hole.innerHTML = `<div style="position:absolute;left:10%;right:10%;bottom:14px;height:30px;border-radius:50%;background:#111"></div><div class="wat-mole" aria-hidden="true" style="position:absolute;left:50%;bottom:6px;transform:translate(-50%,110%);transition:transform .12s ease-out;font-size:${isMobile() ? 52 : 64}px;line-height:1;pointer-events:none">🐹</div>`;
      hole.addEventListener("click", () => { if (gameActive && !gameWon && hole.dataset.active === "true") whackMole(hole); });
      board.appendChild(hole);
      holes.push(hole);
    }

    function updateColumns() { board.style.gridTemplateColumns = `repeat(${isMobile() ? SETTINGS.MOBILE_COLUMNS : SETTINGS.DESKTOP_COLUMNS}, minmax(0, 1fr))`; }
    window.addEventListener("resize", updateColumns);
    launch.addEventListener("click", startGame);
    $("#wat-close", panel).addEventListener("click", closeGame);
    restore.addEventListener("click", restoreDestroyedTracks);
    updateColumns();

    game = { launch, panel, board, holes, title: $("#wat-track-title", panel), health: $("#wat-health", panel), hitsLeft: $("#wat-hits-left", panel), time: $("#wat-time", panel), message: $("#wat-message", panel), hits: 0 };
    return game;
  }

  function resetHealth() { game.hits = 0; game.health.style.width = "100%"; game.hitsLeft.textContent = `${SETTINGS.STARTING_HEALTH} WHACKS LEFT`; }
  function updateHealth() { const remaining = Math.max(0, SETTINGS.STARTING_HEALTH - game.hits); game.health.style.width = `${remaining / SETTINGS.STARTING_HEALTH * 100}%`; game.hitsLeft.textContent = `${remaining} WHACKS LEFT`; }
  function progress() { const duration = getDuration(currentTrack?.source); return duration > 0 ? Math.min(1, getCurrentTime(currentTrack.source) / duration) : 0; }
  function moleDelay() { return Math.max(SETTINGS.MIN_MOLE_DELAY, SETTINGS.START_MOLE_DELAY - progress() * 590); }
  function visibleTime() { return Math.max(SETTINGS.MIN_VISIBLE_TIME, SETTINGS.START_VISIBLE_TIME - progress() * 470); }

  function hideMole(hole) { hole.dataset.active = "false"; $(".wat-mole", hole).style.transform = "translate(-50%,110%)"; }
  function spawnMole() {
    if (!gameActive || gameWon) return;
    const available = game.holes.filter(hole => hole.dataset.active !== "true");
    if (!available.length) return;
    const hole = available[Math.floor(Math.random() * available.length)];
    hole.dataset.active = "true";
    $(".wat-mole", hole).style.transform = "translate(-50%,0)";
    setTimeout(() => { if (hole.dataset.active === "true") hideMole(hole); }, visibleTime());
  }
  function scheduleNextMole() { if (!gameActive || gameWon) return; clearTimeout(moleTimer); moleTimer = setTimeout(() => { spawnMole(); scheduleNextMole(); }, moleDelay()); }

  function whackMole(hole) {
    game.hits++;
    updateHealth();
    hideMole(hole);
    const feedback = document.createElement("div");
    feedback.textContent = Math.random() < .5 ? "💥 POW!!" : "💥 WHACK!!";
    Object.assign(feedback.style, { position: "absolute", left: "50%", top: "10%", transform: "translate(-50%,0)", fontWeight: "900", fontSize: isMobile() ? "20px" : "24px", pointerEvents: "none", zIndex: "20", whiteSpace: "nowrap" });
    hole.appendChild(feedback);
    setTimeout(() => feedback.remove(), 520);
    if (game.hits >= SETTINGS.STARTING_HEALTH) winGame();
  }

  function startGame() {
    stopGameTimers();
    const source = findAudio();
    if (!source) { alert("WHACK-A-TRACK needs a song to be playing first! 😸"); return; }
    if (!isPlaying(source)) { alert("Start playing a song first, then WHACK IT! 😸"); return; }
    currentTrack = { source, id: getTrackID(source), title: getTrackTitle(source) };
    if (getDestroyedTracks().includes(currentTrack.id)) { alert("That track has already been WHACKED! 💀"); return; }
    createGame();
    gameActive = true; gameWon = false; game.panel.style.display = "block";
    game.title.textContent = `NOW WHACKING: ${currentTrack.title}`; game.message.textContent = ""; resetHealth(); updateTime();
    game.panel.scrollIntoView({ behavior: "smooth", block: "center" });
    countdownTimer = setInterval(updateTime, 100);
    scheduleNextMole();
  }

  function updateTime() {
    if (!currentTrack?.source || !game) return;
    const remaining = Math.max(0, getDuration(currentTrack.source) - getCurrentTime(currentTrack.source));
    game.time.textContent = `TIME LEFT ${formatTime(remaining)}`;
    if (currentTrack.source === youtube() && window.YT && currentTrack.source.getPlayerState?.() === YT.PlayerState.ENDED) songEnded();
  }

  function winGame() {
    if (gameWon) return;
    gameWon = true; gameActive = false; stopGameTimers(); game.holes.forEach(hideMole); pauseSource(currentTrack.source); saveDestroyedTrack(currentTrack.id); game.health.style.width = "0%";
    game.message.innerHTML = "💥 <strong>WHACK!!</strong><br>🎵 <strong>SONG IS WHACK!!</strong><br>💀 <strong>TRACK DESTROYED</strong>";
  }

  function songEnded() {
    if (!gameActive || gameWon) return;
    gameActive = false; stopGameTimers(); game.holes.forEach(hideMole); game.message.innerHTML = "😈 <strong>THE TRACK SURVIVED!</strong>"; game.time.textContent = "TIME LEFT 0:00";
  }

  function stopGameTimers() { clearTimeout(moleTimer); clearInterval(countdownTimer); moleTimer = null; countdownTimer = null; }
  function closeGame() { gameActive = false; gameWon = false; stopGameTimers(); if (game) { game.holes.forEach(hideMole); game.panel.style.display = "none"; game.message.textContent = ""; } }

  function init() { if (!document.getElementById("wat-launch")) createGame(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true }); else init();
})();
