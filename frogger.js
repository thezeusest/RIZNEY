/* =========================================================
   TORTOISE FROGGER 🐢🛹
   Each song row = a street.
   Tap anywhere that isn't a button/link to hop upward.
   Reach the top before the current song ends.
   ========================================================= */

(() => {
  "use strict";

  if (window.__RIZNEY_TORTOISE_FROGGER__) return;
  window.__RIZNEY_TORTOISE_FROGGER__ = true;

  let game = null;

  /* ---------------------------------------------------------
     Find the existing YouTube player
     --------------------------------------------------------- */

  function getPlayer() {
    return window.rizneyPlayer || window.player || null;
  }

  /* ---------------------------------------------------------
     Find the existing song rows
     --------------------------------------------------------- */

  function getSongRows() {
    return [
      ...document.querySelectorAll("#song-list .song"),
      ...document.querySelectorAll("#song-list > *")
    ].filter((row, index, all) => {
      return row && row.children && row !== all[index - 1];
    });
  }

  /* ---------------------------------------------------------
     Styles
     --------------------------------------------------------- */

  function addStyles() {
    if (document.getElementById("tortoise-frogger-styles")) return;

    const style = document.createElement("style");
    style.id = "tortoise-frogger-styles";

    style.textContent = `
      /* ---------------------------------------------
         Tortoise Frogger
         --------------------------------------------- */

      .frogger-street {
        position: relative !important;
        overflow: hidden !important;
      }

      .frogger-current-street {
        outline: 2px solid #d4af37 !important;
        outline-offset: -2px;
      }

      .frogger-tortoise {
        position: absolute !important;
        left: 50% !important;
        bottom: 2px !important;
        transform: translateX(-50%) !important;
        z-index: 9999 !important;
        font-size: 28px !important;
        line-height: 1 !important;
        pointer-events: none !important;
        user-select: none !important;
        white-space: nowrap !important;
        filter: drop-shadow(0 2px 2px rgba(0,0,0,.45));
        transition: transform .16s ease;
      }

      .frogger-obstacle {
        position: absolute !important;
        z-index: 5 !important;
        pointer-events: none !important;
        user-select: none !important;
        font-size: 25px !important;
        line-height: 1 !important;
        white-space: nowrap !important;
      }

      .frogger-hud {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        flex-wrap: wrap;
        margin: 8px 0;
        padding: 8px 10px;
        border: 1px solid #d4af37;
        border-radius: 10px;
        background: #120b18;
        color: #f5d76e;
        font-size: .9rem;
        text-align: center;
      }

      .frogger-hud strong {
        color: #fff;
      }

      .frogger-message {
        width: 100%;
        color: #c084fc;
      }

      .frogger-button {
        border: 1px solid #d4af37;
        border-radius: 8px;
        background: #1d1028;
        color: #f5d76e;
        padding: 7px 12px;
        cursor: pointer;
        font: inherit;
      }

      .frogger-button:active {
        transform: translateY(1px);
      }

      .frogger-danger {
        animation: froggerShake .18s linear 2;
      }

      @keyframes froggerShake {
        0%,100% { transform: translateX(0); }
        25% { transform: translateX(-4px); }
        75% { transform: translateX(4px); }
      }

      @media (prefers-reduced-motion: reduce) {
        .frogger-tortoise {
          transition: none;
        }

        .frogger-danger {
          animation: none;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /* ---------------------------------------------------------
     Create the little HUD
     --------------------------------------------------------- */

  function createHUD() {
    if (document.getElementById("frogger-hud")) {
      return document.getElementById("frogger-hud");
    }

    const hud = document.createElement("div");
    hud.id = "frogger-hud";
    hud.className = "frogger-hud";

    hud.innerHTML = `
      <div>🐢🛹 <strong>FROGGER</strong></div>
      <div>TIME: <strong id="frogger-time">--:--</strong></div>
      <div>STREETS: <strong id="frogger-progress">0 / 0</strong></div>
      <div class="frogger-message" id="frogger-message">
        Play a song, then tap anywhere to hop.
      </div>
      <button class="frogger-button" id="frogger-restart" type="button">
        Restart
      </button>
    `;

    const songList =
      document.querySelector("#song-list") ||
      document.querySelector("main") ||
      document.body;

    songList.parentNode.insertBefore(hud, songList);

    document
      .getElementById("frogger-restart")
      .addEventListener("click", restart);

    return hud;
  }

  /* ---------------------------------------------------------
     HUD helpers
     --------------------------------------------------------- */

  function message(text) {
    const el = document.getElementById("frogger-message");
    if (el) el.textContent = text;
  }

  function updateHUD() {
    if (!game) return;

    const player = getPlayer();

    let remaining = 0;

    try {
      const duration = player?.getDuration?.() || 0;
      const current = player?.getCurrentTime?.() || 0;
      remaining = Math.max(0, duration - current);
    } catch (_) {}

    const minutes = Math.floor(remaining / 60);
    const seconds = Math.floor(remaining % 60);

    const timeEl = document.getElementById("frogger-time");

    if (timeEl) {
      timeEl.textContent =
        `${minutes}:${String(seconds).padStart(2, "0")}`;
    }

    const progressEl =
      document.getElementById("frogger-progress");

    if (progressEl) {
      progressEl.textContent =
        `${game.position + 1} / ${game.rows.length}`;
    }

    return remaining;
  }

  /* ---------------------------------------------------------
     Get a usable song row list
     --------------------------------------------------------- */

  function prepareRows() {
    let rows = document.querySelectorAll("#song-list .song");

    if (!rows.length) {
      rows = document.querySelectorAll(".song");
    }

    game.rows = [...rows];

    game.rows.forEach((row, index) => {
      row.classList.add("frogger-street");
      row.dataset.froggerStreet = index;
    });
  }

  /* ---------------------------------------------------------
     Put random traffic on every street
     --------------------------------------------------------- */

  function addTraffic() {
    const obstacles = [
      "🚗",
      "🚙",
      "🏎️",
      "🎸",
      "🎵",
      "🛹"
    ];

    game.rows.forEach((row, index) => {
      row.querySelectorAll(".frogger-obstacle").forEach(el => el.remove());

      const obstacle = document.createElement("span");

      obstacle.className = "frogger-obstacle";

      obstacle.textContent =
        obstacles[Math.floor(Math.random() * obstacles.length)];

      obstacle.style.top =
        `${20 + Math.random() * 50}%`;

      obstacle.dataset.direction =
        Math.random() < 0.5 ? "left" : "right";

      obstacle.dataset.speed =
        String(35 + Math.random() * 55);

      obstacle.dataset.x =
        String(
          obstacle.dataset.direction === "left"
            ? 100 + Math.random() * 30
            : -20 - Math.random() * 30
        );

      row.appendChild(obstacle);
    });
  }

  /* ---------------------------------------------------------
     Put the tortoise on a row
     --------------------------------------------------------- */

  function placeTortoise() {
    if (!game) return;

    game.rows.forEach(row => {
      row.classList.remove("frogger-current-street");

      row
        .querySelectorAll(".frogger-tortoise")
        .forEach(el => el.remove());
    });

    const row = game.rows[game.position];

    if (!row) return;

    row.classList.add("frogger-current-street");

    const tortoise = document.createElement("span");

    tortoise.className = "frogger-tortoise";
    tortoise.textContent = "🐢🛹";
    tortoise.setAttribute("aria-hidden", "true");

    row.appendChild(tortoise);

    row.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }

  /* ---------------------------------------------------------
     Start / restart
     --------------------------------------------------------- */

  function start() {
    const player = getPlayer();

    if (!player) {
      message("Play a song first — the song is the clock!");
      return;
    }

    let duration = 0;

    try {
      duration = player.getDuration?.() || 0;
    } catch (_) {}

    if (!duration) {
      message("Start playing a song first — then the tortoise can roll!");
      return;
    }

    prepareRows();

    if (!game.rows.length) {
      message("I couldn't find the song rows.");
      return;
    }

    addTraffic();

    game.position = game.rows.length - 1;
    game.active = true;
    game.won = false;
    game.lastFrame = performance.now();

    placeTortoise();

    message(
      "🐢🛹 GO! Tap anywhere to hop to the next street!"
    );

    cancelAnimationFrame(game.animation);
    game.animation = requestAnimationFrame(loop);
  }

  function restart(event) {
    event?.preventDefault();
    start();
  }

  /* ---------------------------------------------------------
     One hop
     --------------------------------------------------------- */

  function hop(event) {
    if (!game || !game.active) return;

    /*
      IMPORTANT:
      Buttons, links, the player, inputs, etc.
      do NOT count as a hop.
    */

    if (
      event.target.closest(
        "button, a, input, select, textarea, audio, video, iframe"
      )
    ) {
      return;
    }

    event.preventDefault();

    if (game.position <= 0) {
      win();
      return;
    }

    const currentRow = game.rows[game.position];

    if (checkCollision(currentRow)) {
      lose("💥 BONK! The tortoise got hit!");
      return;
    }

    game.position--;

    placeTortoise();

    message(
      game.position === 0
        ? "🏁 ONE MORE STEP — REACH THE TOP!"
        : "🐢🛹 HOP!"
    );

    updateHUD();
  }

  /* ---------------------------------------------------------
     Collision
     --------------------------------------------------------- */

  function checkCollision(row) {
    if (!row) return false;

    const tortoise = row.querySelector(".frogger-tortoise");

    if (!tortoise) return false;

    const t = tortoise.getBoundingClientRect();

    const tx = t.left + t.width / 2;
    const ty = t.top + t.height / 2;

    const obstacles =
      row.querySelectorAll(".frogger-obstacle");

    for (const obstacle of obstacles) {
      const r = obstacle.getBoundingClientRect();

      if (
        tx >= r.left - 8 &&
        tx <= r.right + 8 &&
        ty >= r.top - 8 &&
        ty <= r.bottom + 8
      ) {
        return true;
      }
    }

    return false;
  }

  /* ---------------------------------------------------------
     Game over
     --------------------------------------------------------- */

  function lose(text) {
    game.active = false;

    cancelAnimationFrame(game.animation);

    message(text + " Tap Restart to try again.");

    const row = game.rows[game.position];

    row?.classList.add("frogger-danger");

    setTimeout(() => {
      row?.classList.remove("frogger-danger");
    }, 500);
  }

  /* ---------------------------------------------------------
     Victory
     --------------------------------------------------------- */

  function win() {
    if (!game.active) return;

    game.active = false;
    game.won = true;

    cancelAnimationFrame(game.animation);

    game.position = 0;

    placeTortoise();

    message(
      "🎉 YOU MADE IT! 🐢🛹 The tortoise reached the top!"
    );

    updateHUD();
  }

  /* ---------------------------------------------------------
     Move the traffic
     --------------------------------------------------------- */

  function moveTraffic(delta) {
    if (!game?.active) return;

    game.rows.forEach(row => {
      const obstacle =
        row.querySelector(".frogger-obstacle");

      if (!obstacle) return;

      let x = parseFloat(obstacle.dataset.x);

      const speed =
        parseFloat(obstacle.dataset.speed) || 50;

      const direction =
        obstacle.dataset.direction === "left"
          ? -1
          : 1;

      x += direction * speed * delta / 1000;

      /*
        Wrap the obstacle around the street.
      */

      if (direction > 0 && x > 110) {
        x = -20;
      }

      if (direction < 0 && x < -20) {
        x = 110;
      }

      obstacle.dataset.x = String(x);
      obstacle.style.left = `${x}%`;
    });
  }

  /* ---------------------------------------------------------
     Main animation loop
     --------------------------------------------------------- */

  function loop(now) {
    if (!game || !game.active) return;

    const delta =
      Math.min(100, now - game.lastFrame);

    game.lastFrame = now;

    moveTraffic(delta);

    const remaining = updateHUD();

    /*
      Song ended.
    */

    if (remaining <= 0.15) {
      lose(
        "🎵 The song ended before the tortoise reached the top!"
      );
      return;
    }

    /*
      Collision can also happen while the tortoise
      is sitting on a street.
    */

    if (checkCollision(game.rows[game.position])) {
      lose("💥 BONK! Traffic got you!");
      return;
    }

    game.animation = requestAnimationFrame(loop);
  }

  /* ---------------------------------------------------------
     Global tap handler
     --------------------------------------------------------- */

  function installTouchControl() {
    document.addEventListener(
      "pointerdown",
      hop,
      {
        passive: false
      }
    );
  }

  /* ---------------------------------------------------------
     Initialize
     --------------------------------------------------------- */

  function init() {
    if (game) return;

    addStyles();

    createHUD();

    game = {
      rows: [],
      position: 0,
      active: false,
      won: false,
      animation: 0,
      lastFrame: 0
    };

    installTouchControl();

    message(
      "Play a song, then tap anywhere to make 🐢🛹 hop upward."
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );
  } else {
    init();
  }

})();
