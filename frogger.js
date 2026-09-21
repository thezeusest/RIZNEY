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
     Find YouTube player
     --------------------------------------------------------- */

  function getPlayer() {
    return window.rizneyPlayer || window.player || null;
  }

  /* ---------------------------------------------------------
     Find song rows
     --------------------------------------------------------- */

  function getSongRows() {
    let rows = document.querySelectorAll("#song-list .song");

    if (!rows.length) {
      rows = document.querySelectorAll(".song");
    }

    return [...rows];
  }

  /* ---------------------------------------------------------
     Styles
     --------------------------------------------------------- */

  function addStyles() {
    if (document.getElementById("tortoise-frogger-styles")) return;

    const style = document.createElement("style");
    style.id = "tortoise-frogger-styles";

    style.textContent = `
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

      /* Bottom-of-page Frogger controls */

      .frogger-footer {
        width: min(92%, 680px);
        margin: 30px auto 20px;
        padding: 12px;
        box-sizing: border-box;
        border: 1px solid #d4af37;
        border-radius: 12px;
        background: #120b18;
        color: #f5d76e;
        text-align: center;
      }

      .frogger-footer-title {
        font-weight: bold;
        margin-bottom: 6px;
      }

      .frogger-footer-info {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        font-size: .9rem;
        margin-bottom: 8px;
      }

      .frogger-message {
        min-height: 1.4em;
        color: #c084fc;
        margin: 6px 0;
      }

      .frogger-button {
        border: 1px solid #d4af37;
        border-radius: 8px;
        background: #1d1028;
        color: #f5d76e;
        padding: 8px 14px;
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
     Create footer
     --------------------------------------------------------- */

  function createFooter() {
    if (document.getElementById("frogger-footer")) {
      return document.getElementById("frogger-footer");
    }

    const footer = document.createElement("section");

    footer.id = "frogger-footer";
    footer.className = "frogger-footer";
    footer.setAttribute(
      "aria-label",
      "Tortoise Frogger"
    );

    footer.innerHTML = `
      <div class="frogger-footer-title">
        🐢🛹 TORTOISE FROGGER
      </div>

      <div class="frogger-footer-info">
        <span>TIME: <strong id="frogger-time">--:--</strong></span>
        <span>STREETS: <strong id="frogger-progress">0 / 0</strong></span>
      </div>

      <div
        class="frogger-message"
        id="frogger-message"
        aria-live="polite"
      >
        Play a song, then tap anywhere to hop.
      </div>

      <button
        class="frogger-button"
        id="frogger-restart"
        type="button"
      >
        🐢 START / RESTART FROGGER
      </button>
    `;

    /*
      Put it at the VERY BOTTOM of the page.
    */

    document.body.appendChild(footer);

    document
      .getElementById("frogger-restart")
      .addEventListener("click", restart);

    return footer;
  }

  /* ---------------------------------------------------------
     HUD
     --------------------------------------------------------- */

  function message(text) {
    const el = document.getElementById("frogger-message");
    if (el) el.textContent = text;
  }

  function updateHUD() {
    if (!game) return 0;

    const player = getPlayer();

    let remaining = 0;

    try {
      const duration = player?.getDuration?.() || 0;
      const current = player?.getCurrentTime?.() || 0;

      remaining = Math.max(
        0,
        duration - current
      );
    } catch (_) {}

    const timeEl =
      document.getElementById("frogger-time");

    if (timeEl) {
      const minutes = Math.floor(remaining / 60);
      const seconds = Math.floor(remaining % 60);

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
     Prepare streets
     --------------------------------------------------------- */

  function prepareRows() {
    game.rows = getSongRows();

    game.rows.forEach((row, index) => {
      row.classList.add("frogger-street");
      row.dataset.froggerStreet = index;
    });
  }

  /* ---------------------------------------------------------
     Traffic
     
     IMPORTANT:
     The bottom/start row gets NO obstacle.
     --------------------------------------------------------- */

  function addTraffic() {
    const obstacles = [
      "🚗",
      "🚙",
      "🏎️",
      "🎸",
      "🎵"
    ];

    game.rows.forEach((row, index) => {
      row
        .querySelectorAll(".frogger-obstacle")
        .forEach(el => el.remove());

      /*
        The last row is the starting street.
        It is always SAFE.
      */

      if (index === game.rows.length - 1) {
        return;
      }

      const obstacle =
        document.createElement("span");

      obstacle.className = "frogger-obstacle";

      obstacle.textContent =
        obstacles[
          Math.floor(
            Math.random() * obstacles.length
          )
        ];

      obstacle.style.top =
        `${20 + Math.random() * 50}%`;

      obstacle.dataset.direction =
        Math.random() < 0.5
          ? "left"
          : "right";

      obstacle.dataset.speed =
        String(35 + Math.random() * 55);

      obstacle.dataset.x =
        obstacle.dataset.direction === "left"
          ? String(100 + Math.random() * 30)
          : String(-20 - Math.random() * 30);

      row.appendChild(obstacle);
    });
  }

  /* ---------------------------------------------------------
     Place tortoise
     --------------------------------------------------------- */

  function placeTortoise() {
    if (!game) return;

    game.rows.forEach(row => {
      row.classList.remove(
        "frogger-current-street"
      );

      row
        .querySelectorAll(".frogger-tortoise")
        .forEach(el => el.remove());
    });

    const row = game.rows[game.position];

    if (!row) return;

    row.classList.add(
      "frogger-current-street"
    );

    const tortoise =
      document.createElement("span");

    tortoise.className =
      "frogger-tortoise";

    tortoise.textContent = "🐢🛹";

    tortoise.setAttribute(
      "aria-hidden",
      "true"
    );

    row.appendChild(tortoise);

    row.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }

  /* ---------------------------------------------------------
     Start
     --------------------------------------------------------- */

  function start() {
    const player = getPlayer();

    if (!player) {
      message(
        "Play a song first — the song is the clock!"
      );
      return;
    }

    let duration = 0;

    try {
      duration =
        player.getDuration?.() || 0;
    } catch (_) {}

    if (!duration) {
      message(
        "Start playing a song first — then roll!"
      );
      return;
    }

    prepareRows();

    if (!game.rows.length) {
      message(
        "I couldn't find the song rows."
      );
      return;
    }

    addTraffic();

    /*
      LAST row = bottom of page = starting point.
    */

    game.position =
      game.rows.length - 1;

    game.active = true;
    game.won = false;
    game.lastFrame =
      performance.now();

    placeTortoise();

    message(
      "🐢🛹 GO! Tap anywhere to hop upward!"
    );

    cancelAnimationFrame(
      game.animation
    );

    game.animation =
      requestAnimationFrame(loop);
  }

  function restart(event) {
    event?.preventDefault();
    start();
  }

  /* ---------------------------------------------------------
     Hop
     --------------------------------------------------------- */

  function hop(event) {
    if (!game || !game.active) return;

    /*
      These elements DON'T count as a hop.
    */

    if (
      event.target.closest(
        "button, a, input, select, textarea, audio, video, iframe"
      )
    ) {
      return;
    }

    event.preventDefault();

    /*
      Starting row is safe.
      The tortoise can always make its first hop.
    */

    if (
      game.position ===
      game.rows.length - 1
    ) {
      game.position--;
      placeTortoise();

      message(
        "🐢🛹 NICE! Keep climbing!"
      );

      updateHUD();
      return;
    }

    /*
      Check the street BEFORE moving.
    */

    if (
      checkCollision(
        game.rows[game.position]
      )
    ) {
      lose(
        "💥 BONK! Traffic got you!"
      );
      return;
    }

    /*
      Top reached.
    */

    if (game.position <= 0) {
      win();
      return;
    }

    game.position--;

    placeTortoise();

    if (game.position === 0) {
      message(
        "🏁 LAST STREET! REACH THE TOP!"
      );
    } else {
      message(
        "🐢🛹 HOP!"
      );
    }

    updateHUD();
  }

  /* ---------------------------------------------------------
     Collision
     --------------------------------------------------------- */

  function checkCollision(row) {
    if (!row) return false;

    /*
      No obstacle on starting row,
      so there is nothing to hit there.
    */

    const tortoise =
      row.querySelector(
        ".frogger-tortoise"
      );

    if (!tortoise) return false;

    const t =
      tortoise.getBoundingClientRect();

    const tx =
      t.left + t.width / 2;

    const ty =
      t.top + t.height / 2;

    const obstacles =
      row.querySelectorAll(
        ".frogger-obstacle"
      );

    for (const obstacle of obstacles) {
      const r =
        obstacle.getBoundingClientRect();

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
     Lose
     --------------------------------------------------------- */

  function lose(text) {
    game.active = false;

    cancelAnimationFrame(
      game.animation
    );

    message(
      text +
      " Tap START / RESTART to try again."
    );

    const row =
      game.rows[game.position];

    row?.classList.add(
      "frogger-danger"
    );

    setTimeout(() => {
      row?.classList.remove(
        "frogger-danger"
      );
    }, 500);
  }

  /* ---------------------------------------------------------
     Win
     --------------------------------------------------------- */

  function win() {
    if (!game.active) return;

    game.active = false;
    game.won = true;

    cancelAnimationFrame(
      game.animation
    );

    game.position = 0;

    placeTortoise();

    message(
      "🎉 YOU MADE IT! 🐢🛹 YOU REACHED THE TOP!"
    );

    updateHUD();
  }

  /* ---------------------------------------------------------
     Move traffic
     --------------------------------------------------------- */

  function moveTraffic(delta) {
    if (!game?.active) return;

    game.rows.forEach(row => {
      const obstacle =
        row.querySelector(
          ".frogger-obstacle"
        );

      if (!obstacle) return;

      let x =
        parseFloat(
          obstacle.dataset.x
        );

      const speed =
        parseFloat(
          obstacle.dataset.speed
        ) || 50;

      const direction =
        obstacle.dataset.direction === "left"
          ? -1
          : 1;

      x +=
        direction *
        speed *
        delta /
        1000;

      if (
        direction > 0 &&
        x > 110
      ) {
        x = -20;
      }

      if (
        direction < 0 &&
        x < -20
      ) {
        x = 110;
      }

      obstacle.dataset.x =
        String(x);

      obstacle.style.left =
        `${x}%`;
    });
  }

  /* ---------------------------------------------------------
     Main loop
     --------------------------------------------------------- */

  function loop(now) {
    if (!game || !game.active) {
      return;
    }

    const delta =
      Math.min(
        100,
        now - game.lastFrame
      );

    game.lastFrame = now;

    moveTraffic(delta);

    const remaining =
      updateHUD();

    /*
      Song ended.
    */

    if (remaining <= 0.15) {
      lose(
        "🎵 The song ended before you reached the top!"
      );
      return;
    }

    /*
      Collision while sitting on a street.
    */

    if (
      game.position <
      game.rows.length - 1
    ) {
      if (
        checkCollision(
          game.rows[game.position]
        )
      ) {
        lose(
          "💥 BONK! Traffic got you!"
        );
        return;
      }
    }

    game.animation =
      requestAnimationFrame(loop);
  }

  /* ---------------------------------------------------------
     Tap anywhere
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

    createFooter();

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
