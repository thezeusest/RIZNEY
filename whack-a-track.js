/* Whack-a-Track mini-game for the Rizney YouTube player. */
(() => {
  "use strict";

  // The track's health still controls the game,
  // but the player does not see the health or hit count.
  const TRACK_HEALTH = 24;
  const GAME_DURATION = 60;
  const MOLE_VISIBLE_MS = 400;
  const MOLE_INTERVAL_MS = 1200;
  const youtube = () => window.rizneyPlayer || window.player || null;
  let game;
  let active = false;
  let trackHealth = TRACK_HEALTH;
  let secondsLeft = GAME_DURATION;
  let moleTimer;
  let hideTimer;
  let gameTimer;

  const $ = (selector, root = document) => root.querySelector(selector);

  const playing = () => {
    const player = youtube();
    return player && typeof player.getPlayerState === "function" &&
      window.YT && player.getPlayerState() === YT.PlayerState.PLAYING;
  };

  function createGame() {
    if (game) return game;

    const panel = document.createElement("section");
    panel.id = "whack-a-track-game";
    panel.setAttribute("aria-label", "Whack-a-Track mini-game");

    panel.innerHTML = `
      <h2>Whack-a-Track</h2>
      <p id="wat-status" aria-live="polite">
        Whack the mole before it disappears!
      </p>

      <p>
        <strong>
          Time: <span id="wat-time">${GAME_DURATION}</span>s
        </strong>
      </p>

      <div id="wat-board"
        role="group"
        aria-label="Whack-a-Track board">
      </div>

      <button id="wat-refresh" type="button" hidden>
        Refresh playlist
      </button>

      <button id="wat-close" type="button">
        Close game
      </button>
    `;

    Object.assign(panel.style, {
      position: "sticky",
      top: "104px",
      zIndex: "20",
      maxWidth: "min(92vw, 620px)",
      margin: "12px auto 24px",
      padding: "18px",
      textAlign: "center",
      color: "#e0aaff",
      background: "#120b18",
      border: "2px solid #d4af37",
      borderRadius: "12px",
      boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
      maxHeight: "calc(100vh - 150px)",
      overflowY: "auto",
      overflowX: "hidden",
      scrollMarginTop: "120px"
    });

    const board = $("#wat-board", panel);

    Object.assign(board.style, {
      display: "grid",
      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
      gap: "10px",
      margin: "18px auto"
    });

    for (let i = 0; i < 6; i++) {
      const hole = document.createElement("button");

      hole.type = "button";
      hole.className = "wat-hole";
      hole.textContent = "🕳️";
      hole.dataset.active = "false";

      Object.assign(hole.style, {
        minHeight: "76px",
        padding: "8px",
        fontSize: "2rem"
      });

      hole.addEventListener("click", () => {
        if (!active || hole.dataset.active !== "true") return;

        hole.dataset.active = "false";
        hole.textContent = "💥";

        trackHealth--;

        if (trackHealth <= 0) finish(true);
      });

      board.appendChild(hole);
    }

    $("#wat-close", panel).addEventListener("click", closeGame);

    $("#wat-refresh", panel).addEventListener("click", () => {
      window.location.reload();
    });

    const playerDock = document.querySelector(".player-dock");

    (playerDock || $("main") || document.body)
      .insertAdjacentElement("afterend", panel);

    panel.hidden = true;

    game = {
      panel,
      board,
      status: $("#wat-status", panel)
    };

    return game;
  }

  function hideMoles() {
    game.board.querySelectorAll(".wat-hole").forEach(hole => {
      hole.dataset.active = "false";
      hole.textContent = "🕳️";
    });
  }

  function spawnMole() {
    if (!active) return;

    const holes = [
      ...game.board.querySelectorAll(".wat-hole")
    ];

    const hole =
      holes[Math.floor(Math.random() * holes.length)];

    hideMoles();

    hole.dataset.active = "true";
    hole.textContent = "💀";

    clearTimeout(hideTimer);

    hideTimer = setTimeout(() => {
      if (hole.dataset.active === "true") {
        hole.textContent = "🕳️";
      }

      hole.dataset.active = "false";
    }, MOLE_VISIBLE_MS);

    moleTimer = setTimeout(
      spawnMole,
      MOLE_INTERVAL_MS
    );
  }

  function startClock() {
    clearInterval(gameTimer);

    secondsLeft = GAME_DURATION;

    $("#wat-time", game.panel).textContent =
      secondsLeft;

    gameTimer = setInterval(() => {
      if (!active) return;

      secondsLeft--;

      $("#wat-time", game.panel).textContent =
        secondsLeft;

      if (secondsLeft <= 0) {
        finish(false);
      }
    }, 1000);
  }

  function startGame(event) {
    event?.preventDefault();
    event?.stopImmediatePropagation();

    game = createGame();

    clearTimeout(moleTimer);
    clearTimeout(hideTimer);
    clearInterval(gameTimer);

    $("#wat-refresh", game.panel).hidden = true;

    if (!playing()) {
      active = false;

      // No extra instructional message.
      game.status.textContent = "";

      game.panel.hidden = false;

      game.panel.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });

      return;
    }

    trackHealth = TRACK_HEALTH;
    active = true;

    game.panel.hidden = false;

    game.status.textContent =
      "Whack the mole before it disappears!";

    hideMoles();

    startClock();

    game.panel.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });

    spawnMole();
  }

  function finish(won) {
    if (!active) return;

    active = false;

    clearTimeout(moleTimer);
    clearTimeout(hideTimer);
    clearInterval(gameTimer);

    hideMoles();

    game.status.textContent = won
      ? "💥 TRACK WHACKED! It has been removed from the playlist."
      : "Time is up — the track survived.";

    if (won) {
      window.dispatchEvent(
        new CustomEvent("rizney:track-whacked")
      );

      $("#wat-refresh", game.panel).hidden = false;
    }

    // Keep the finished game visible.
  }

  function closeGame() {
    active = false;

    clearTimeout(moleTimer);
    clearTimeout(hideTimer);
    clearInterval(gameTimer);

    if (game) {
      hideMoles();
      game.panel.hidden = true;
    }
  }

  function init() {
    const button =
      document.querySelector("#whack-track");

    if (
      !button ||
      button.dataset.whackGameBound === "true"
    ) {
      return;
    }

    button.dataset.whackGameBound = "true";

    Object.assign(button.style, {
      flexBasis: "100%",
      order: "99"
    });

    button.addEventListener(
      "click",
      startGame,
      true
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
