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
      audio.getAttribute("title"),
      audio.closest("[data-title]")?.dataset.title,
      audio.closest("[data-song-title]")?.dataset.songTitle,
      audio.closest(".song")?.querySelector(".song-title")?.textContent,
      audio.closest(".track")?.querySelector(".track-title")?.textContent
    ];

    for (const value of sources) {
      if (value && value.trim()) {
        return value.trim();
      }
    }

    // Fall back to filename.
    if (audio.src) {
      try {
        const url = new URL(audio.src);
        const filename = url.pathname.split("/").pop();

        if (filename) {
          return decodeURIComponent(
            filename.replace(/\.[^/.]+$/, "")
          );
        }
      } catch {}
    }

    return "CURRENT TRACK";
  }

  function getTrackID(audio) {
    if (!audio) return null;

    // Best case: existing site provides an ID.
    const candidates = [
      audio.dataset.id,
      audio.dataset.trackId,
      audio.dataset.videoId,
      audio.getAttribute("data-id"),
      audio.getAttribute("data-track-id"),
      audio.getAttribute("data-video-id")
    ];

    for (const value of candidates) {
      if (value) return value;
    }

    // Look for YouTube ID.
    const text = [
      audio.src,
      audio.dataset.src,
      audio.dataset.youtube,
      audio.closest("[data-video-id]")?.dataset.videoId
    ]
      .filter(Boolean)
      .join(" ");

    const youtubeMatch = text.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/
    );

    if (youtubeMatch) {
      return youtubeMatch[1];
    }

    // Last resort: audio source itself.
    return audio.src || getTrackTitle(audio);
  }

  // ------------------------------------------------------------
  // BUILD GAME
  // ------------------------------------------------------------

  function createGame() {
    if (game) return game;

    const controls = $(".controls");
    const main =
      $("main") ||
      $(".main") ||
      document.body;

    // ----------------------------------------------------------
    // Launch button
    // ----------------------------------------------------------

    const launch = document.createElement("button");

    launch.id = "wat-launch";
    launch.type = "button";
    launch.textContent = "🎵 WHACK-A-TRACK";

    Object.assign(launch.style, {
      cursor: "pointer",
      padding: "10px 14px",
      borderRadius: "10px",
      border: "2px solid currentColor",
      background: "transparent",
      color: "inherit",
      fontWeight: "800",
      fontSize: "14px",
      margin: "8px",
      minHeight: "44px",
      touchAction: "manipulation"
    });

    if (controls) {
      controls.appendChild(launch);
    } else {
      document.body.appendChild(launch);
    }

    // ----------------------------------------------------------
    // Game panel
    // ----------------------------------------------------------

    const panel = document.createElement("section");

    panel.id = "whack-a-track";
    panel.setAttribute("aria-label", "Whack-A-Track game");

    Object.assign(panel.style, {
      display: "none",
      width: "100%",
      maxWidth: "620px",
      margin: "30px auto",
      padding: "18px",
      boxSizing: "border-box",
      border: "3px solid currentColor",
      borderRadius: "16px",
      background: "rgba(0,0,0,0.06)",
      textAlign: "center"
    });

    panel.innerHTML = `
      <div class="wat-header">
        <div
          style="
            font-size:26px;
            font-weight:900;
            margin-bottom:8px;
          "
        >
          🎵 WHACK-A-TRACK
        </div>

        <div
          id="wat-track-title"
          style="
            font-weight:800;
            margin-bottom:14px;
            overflow-wrap:anywhere;
          "
        >
          NOW WHACKING: —
        </div>

        <div
          style="
            display:flex;
            justify-content:space-between;
            gap:10px;
            font-weight:800;
            font-size:14px;
            margin-bottom:5px;
          "
        >
          <span>SONG HEALTH</span>
          <span id="wat-hits-left">32 WHACKS LEFT</span>
        </div>

        <div
          style="
            height:22px;
            border:2px solid currentColor;
            border-radius:8px;
            overflow:hidden;
            margin-bottom:10px;
          "
        >
          <div
            id="wat-health"
            style="
              height:100%;
              width:100%;
              background:currentColor;
              transition:width .12s linear;
            "
          ></div>
        </div>

        <div
          id="wat-time"
          style="
            font-size:18px;
            font-weight:900;
            margin-bottom:16px;
          "
        >
          TIME LEFT 0:00
        </div>
      </div>

      <div
        id="wat-message"
        aria-live="polite"
        style="
          min-height:42px;
          font-size:24px;
          font-weight:900;
          margin-bottom:10px;
        "
      ></div>

      <div
        id="wat-board"
        style="
          display:grid;
          grid-template-columns:repeat(3, minmax(0, 1fr));
          gap:12px;
          width:100%;
          max-width:500px;
          margin:0 auto;
        "
      ></div>

      <button
        id="wat-close"
        type="button"
        style="
          margin-top:18px;
          min-height:44px;
          padding:10px 16px;
          border:2px solid currentColor;
          border-radius:10px;
          background:transparent;
          color:inherit;
          font-weight:800;
          cursor:pointer;
        "
      >
        CLOSE
      </button>
    `;

    main.appendChild(panel);

    // ----------------------------------------------------------
    // Restore button
    // ----------------------------------------------------------

    const restore = document.createElement("button");

    restore.type = "button";
    restore.textContent = "↩ Restore Destroyed Tracks";

    Object.assign(restore.style, {
      display: "block",
      margin: "12px auto 30px",
      minHeight: "44px",
      padding: "8px 12px",
      border: "0",
      background: "transparent",
      color: "inherit",
      cursor: "pointer",
      opacity: "0.75",
      fontSize: "12px"
    });

    main.appendChild(restore);

    // ----------------------------------------------------------
    // Mole board
    // ----------------------------------------------------------

    const board = $("#wat-board", panel);

    const holes = [];

    const totalHoles = SETTINGS.ROWS *
      (isMobile()
        ? SETTINGS.MOBILE_COLUMNS
        : SETTINGS.DESKTOP_COLUMNS);

    for (let i = 0; i < totalHoles; i++) {
      const hole = document.createElement("button");

      hole.type = "button";
      hole.className = "wat-hole";

      Object.assign(hole.style, {
        position: "relative",
        minHeight: isMobile() ? "105px" : "125px",
        border: "0",
        borderRadius: "14px",
        background: "transparent",
        cursor: "pointer",
        overflow: "hidden",
        touchAction: "manipulation",
        padding: "0"
      });

      hole.innerHTML = `
        <div
          class="wat-hole-shadow"
          style="
            position:absolute;
            left:10%;
            right:10%;
            bottom:14px;
            height:30px;
            border-radius:50%;
            background:#111;
          "
        ></div>

        <div
          class="wat-mole"
          aria-hidden="true"
          style="
            position:absolute;
            left:50%;
            bottom:6px;
            transform:translate(-50%,110%);
            transition:transform .12s ease-out;
            font-size:${isMobile() ? "52px" : "64px"};
            line-height:1;
            user-select:none;
            pointer-events:none;
          "
        >
          🐹
        </div>
      `;

      // Use a pixel-art-ish filter/appearance without requiring images.
      const mole = $(".wat-mole", hole);

      mole.style.fontFamily =
        `"Courier New", monospace`;

      hole.addEventListener("click", () => {
        if (!gameActive || gameWon) return;

        if (hole.dataset.active === "true") {
          whackMole(hole);
        }
      });

      board.appendChild(hole);
      holes.push(hole);
    }

    // ----------------------------------------------------------
    // Responsive board
    // ----------------------------------------------------------

    function updateColumns() {
      board.style.gridTemplateColumns =
        `repeat(${
          isMobile()
            ? SETTINGS.MOBILE_COLUMNS
            : SETTINGS.DESKTOP_COLUMNS
        }, minmax(0, 1fr))`;
    }

    window.addEventListener("resize", updateColumns);

    // ----------------------------------------------------------
    // Button events
    // ----------------------------------------------------------

    launch.addEventListener("click", startGame);

    $("#wat-close", panel).addEventListener(
      "click",
      closeGame
    );

    restore.addEventListener(
      "click",
      restoreDestroyedTracks
    );

    updateColumns();

    game = {
      launch,
      panel,
      board,
      holes,
      title: $("#wat-track-title", panel),
      health: $("#wat-health", panel),
      hitsLeft: $("#wat-hits-left", panel),
      time: $("#wat-time", panel),
      message: $("#wat-message", panel)
    };

    return game;
  }

  // ------------------------------------------------------------
  // START GAME
  // ------------------------------------------------------------

  function startGame() {
    stopGameTimers();

    currentAudio = findAudio();

    if (!currentAudio) {
      alert(
        "WHACK-A-TRACK needs a song to be playing first! 😸"
      );
      return;
    }

    if (
      currentAudio.paused ||
      currentAudio.ended
    ) {
      alert(
        "Start playing a song first, then WHACK IT! 😸"
      );
      return;
    }

    currentTrack = {
      id: getTrackID(currentAudio),
      title: getTrackTitle(currentAudio)
    };

    const destroyed = getDestroyedTracks();

    if (destroyed.includes(currentTrack.id)) {
      alert("That track has already been WHACKED! 💀");
      return;
    }

    createGame();

    gameActive = true;
    gameWon = false;

    game.panel.style.display = "block";

    game.title.textContent =
      `NOW WHACKING: ${currentTrack.title}`;

    game.message.textContent = "";

    resetHealth();

    // Scroll to game.
    setTimeout(() => {
      game.panel.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }, 50);

    // Make sure audio continues.
    currentAudio.play().catch(() => {});

    // Listen for natural song ending.
    currentAudio.addEventListener(
      "ended",
      songEnded,
      { once: true }
    );

    updateTime();

    countdownTimer = setInterval(
      updateTime,
      100
    );

    scheduleNextMole();
  }

  // ------------------------------------------------------------
  // HEALTH
  // ------------------------------------------------------------

  function resetHealth() {
    game.health.style.width = "100%";

    game.hitsLeft.textContent =
      `${SETTINGS.STARTING_HEALTH} WHACKS LEFT`;
  }

  function updateHealth() {
    const remaining = Math.max(
      0,
      SETTINGS.STARTING_HEALTH -
        game.hits
    );

    const percentage =
      (remaining / SETTINGS.STARTING_HEALTH) * 100;

    game.health.style.width =
      `${percentage}%`;

    game.hitsLeft.textContent =
      `${remaining} WHACKS LEFT`;
  }

  // ------------------------------------------------------------
  // MOLE SPEED
  // ------------------------------------------------------------

  function getElapsedRatio() {
    if (
      !currentAudio ||
      !Number.isFinite(currentAudio.duration) ||
      currentAudio.duration <= 0
    ) {
      return 0;
    }

    return Math.min(
      1,
      currentAudio.currentTime /
        currentAudio.duration
    );
  }

  function getMoleDelay() {
    const progress = getElapsedRatio();

    return Math.max(
      SETTINGS.MIN_MOLE_DELAY,
      SETTINGS.START_MOLE_DELAY -
        progress * 590
    );
  }

  function getVisibleTime() {
    const progress = getElapsedRatio();

    return Math.max(
      SETTINGS.MIN_VISIBLE_TIME,
      SETTINGS.START_VISIBLE_TIME -
        progress * 470
    );
  }

  // ------------------------------------------------------------
  // MOLE SPAWNING
  // ------------------------------------------------------------

  function scheduleNextMole() {
    if (!gameActive || gameWon) return;

    clearTimeout(moleTimer);

    moleTimer = setTimeout(() => {
      spawnMole();
      scheduleNextMole();
    }, getMoleDelay());
  }

  function spawnMole() {
    if (!gameActive || gameWon) return;

    const available = game.holes.filter(
      hole => hole.dataset.active !== "true"
    );

    if (!available.length) return;

    const hole =
      available[
        Math.floor(
          Math.random() * available.length
        )
      ];

    const mole = $(".wat-mole", hole);

    hole.dataset.active = "true";

    mole.style.transform =
      "translate(-50%, 0)";

    const visibleTime = getVisibleTime();

    setTimeout(() => {
      if (
        hole.dataset.active === "true"
      ) {
        hideMole(hole);
      }
    }, visibleTime);
  }

  function hideMole(hole) {
    hole.dataset.active = "false";

    const mole = $(".wat-mole", hole);

    mole.style.transform =
      "translate(-50%, 110%)";
  }

  // ------------------------------------------------------------
  // WHACK
  // ------------------------------------------------------------

  function whackMole(hole) {
    if (!gameActive || gameWon) return;

    // Count the hit.
    game.hits++;

    updateHealth();

    const mole = $(".wat-mole", hole);

    // Immediately hide the mole.
    hideMole(hole);

    // POW / WHACK feedback.
    showWhackFeedback(hole);

    // HARD MODE:
    // Only one health point per successful hit.
    if (
      game.hits >= SETTINGS.STARTING_HEALTH
    ) {
      winGame();
    }
  }

  function showWhackFeedback(hole) {
    const feedback =
      document.createElement("div");

    feedback.textContent =
      Math.random() < 0.5
        ? "💥 POW!!"
        : "💥 WHACK!!";

    Object.assign(feedback.style, {
      position: "absolute",
      left: "50%",
      top: "10%",
      transform: "translate(-50%, 0) rotate(-4deg)",
      fontWeight: "900",
      fontSize: isMobile()
        ? "20px"
        : "24px",
      pointerEvents: "none",
      zIndex: "20",
      whiteSpace: "nowrap"
    });

    hole.appendChild(feedback);

    feedback.animate(
      [
        {
          transform:
            "translate(-50%, 0) scale(.7)",
          opacity: 0
        },
        {
          transform:
            "translate(-50%, -10px) scale(1.1)",
          opacity: 1
        },
        {
          transform:
            "translate(-50%, -35px) scale(1)",
          opacity: 0
        }
      ],
      {
        duration: 500,
        easing: "ease-out"
      }
    );

    setTimeout(() => {
      feedback.remove();
    }, 520);
  }

  // ------------------------------------------------------------
  // WIN
  // ------------------------------------------------------------

  function winGame() {
    if (gameWon) return;

    gameWon = true;
    gameActive = false;

    stopGameTimers();

    // STOP ALL MOLES.
    game.holes.forEach(hideMole);

    // ----------------------------------------------------------
    // VERY IMPORTANT:
    // Stop the song immediately.
    // ----------------------------------------------------------

    if (currentAudio) {
      try {
        currentAudio.pause();

        // Resetting currentTime is intentionally NOT done.
        // This stops playback without messing with the player's
        // normal track position more than necessary.
      } catch {}
    }

    // Save destroyed song.
    if (currentTrack?.id) {
      saveDestroyedTrack(
        currentTrack.id
      );
    }

    game.health.style.width = "0%";

    game.message.innerHTML = `
      💥 <strong>WHACK!!</strong><br>
      🎵 <strong>SONG IS WHACK!!</strong><br>
      💀 <strong>TRACK DESTROYED</strong>
    `;

    // ----------------------------------------------------------
    // Hide/remove the song from the existing page.
    // ----------------------------------------------------------

    hideCurrentTrack();

    // Give the victory message a moment to display.
    // The audio has ALREADY stopped.
  }

  // ------------------------------------------------------------
  // SONG SURVIVED
  // ------------------------------------------------------------

  function songEnded() {
    if (!gameActive || gameWon) return;

    gameActive = false;

    stopGameTimers();

    game.holes.forEach(hideMole);

    game.message.innerHTML =
      "😈 <strong>THE TRACK SURVIVED!</strong>";

    game.time.textContent =
      "TIME LEFT 0:00";
  }

  // ------------------------------------------------------------
  // HIDE DESTROYED TRACK
  // ------------------------------------------------------------

  function hideCurrentTrack() {
    if (!currentAudio) return;

    let container =
      currentAudio.closest(
        "[data-track-id], [data-video-id], [data-song-id], .track, .song, .song-card, .music-card"
      );

    if (container) {
      container.style.transition =
        "opacity .4s ease, transform .4s ease";

      container.style.opacity = "0";
      container.style.transform =
        "scale(.96)";

      setTimeout(() => {
        container.style.display = "none";
      }, 450);
    }
  }

  // ------------------------------------------------------------
  // TIMER
  // ------------------------------------------------------------

  function updateTime() {
    if (!currentAudio) return;

    const remaining =
      Math.max(
        0,
        currentAudio.duration -
          currentAudio.currentTime
      );

    game.time.textContent =
      `TIME LEFT ${formatTime(remaining)}`;
  }

  // ------------------------------------------------------------
  // CLEANUP
  // ------------------------------------------------------------

  function stopGameTimers() {
    clearTimeout(moleTimer);
    clearInterval(countdownTimer);

    moleTimer = null;
    countdownTimer = null;
  }

  function closeGame() {
    gameActive = false;
    gameWon = false;

    stopGameTimers();

    if (game) {
      game.holes.forEach(hideMole);
      game.panel.style.display = "none";
      game.message.textContent = "";
    }
  }

  // ------------------------------------------------------------
  // INITIALIZE
  // ------------------------------------------------------------

  function init() {
    if (document.getElementById("wat-launch")) {
      return;
    }

    createGame();

    console.log(
      "🎵 WHACK-A-TRACK initialized."
    );
  }

  // Give the existing music page time to load.
  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );
  } else {
    init();
  }

})();
