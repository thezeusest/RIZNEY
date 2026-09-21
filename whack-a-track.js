/* Whack-a-Track mini-game for the Rizney YouTube player. */
(() => {
  "use strict";

  // Hits are not ammunition: every visible mole can be whacked. The track's
  // health is the only progress limit, and it is displayed as a real bar.
  const TRACK_HEALTH = 12;
  const GAME_DURATION = 60;
  const MOLE_VISIBLE_MS = 900;
  const MOLE_INTERVAL_MS = 1400;
  const youtube = () => window.rizneyPlayer || window.player || null;
  let game;
  let active = false;
  let hits = 0;
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
      <h2>🎯 Whack-a-Track</h2>
      <p id="wat-status" aria-live="polite">Whack the mole before it disappears!</p>
      <p><strong>Time: <span id="wat-time">${GAME_DURATION}</span>s · Hits: <span id="wat-hits">0</span></strong></p>
      <label for="wat-health"><strong>Track health: <span id="wat-health-value">${TRACK_HEALTH}</span> / ${TRACK_HEALTH}</strong></label>
      <progress id="wat-health" max="${TRACK_HEALTH}" value="${TRACK_HEALTH}" aria-label="Track health"></progress>
      <div id="wat-board" role="group" aria-label="Whack-a-Track board"></div>
      <button id="wat-refresh" type="button" hidden>Refresh playlist</button>
      <button id="wat-close" type="button">Close game</button>
    `;
    Object.assign(panel.style, {
      maxWidth: "620px", margin: "24px auto", padding: "18px", textAlign: "center",
      color: "#e0aaff", background: "#120b18", border: "2px solid #d4af37", borderRadius: "12px"
    });

    const health = $("#wat-health", panel);
    Object.assign(health.style, { display: "block", width: "100%", height: "18px", margin: "8px 0 14px", accentColor: "#d4af37" });
    const board = $("#wat-board", panel);
    Object.assign(board.style, {
      display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "10px", margin: "18px auto"
    });

    for (let i = 0; i < 6; i++) {
      const hole = document.createElement("button");
      hole.type = "button";
      hole.className = "wat-hole";
      hole.textContent = "🕳️";
      hole.dataset.active = "false";
      Object.assign(hole.style, { minHeight: "76px", padding: "8px", fontSize: "2rem" });
      hole.addEventListener("click", () => {
        if (!active || hole.dataset.active !== "true") return;
        hole.dataset.active = "false";
        hole.textContent = "💥";
        hits++;
        trackHealth--;
        $("#wat-hits", panel).textContent = hits;
        $("#wat-health", panel).value = trackHealth;
        $("#wat-health-value", panel).textContent = trackHealth;
        if (trackHealth <= 0) finish(true);
      });
      board.appendChild(hole);
    }

    $("#wat-close", panel).addEventListener("click", closeGame);
    $("#wat-refresh", panel).addEventListener("click", () => window.location.reload());
    const playerDock = document.querySelector(".player-dock");
    (playerDock || $("main") || document.body).insertAdjacentElement("afterend", panel);
    panel.hidden = true;
    game = { panel, board, status: $("#wat-status", panel) };
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
    const holes = [...game.board.querySelectorAll(".wat-hole")];
    const hole = holes[Math.floor(Math.random() * holes.length)];
    hideMoles();
    hole.dataset.active = "true";
    hole.textContent = "🐹";
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (hole.dataset.active === "true") hole.textContent = "🕳️";
      hole.dataset.active = "false";
    }, MOLE_VISIBLE_MS);
    moleTimer = setTimeout(spawnMole, MOLE_INTERVAL_MS);
  }

  function startClock() {
    clearInterval(gameTimer);
    secondsLeft = GAME_DURATION;
    $("#wat-time", game.panel).textContent = secondsLeft;
    gameTimer = setInterval(() => {
      if (!active) return;
      secondsLeft--;
      $("#wat-time", game.panel).textContent = secondsLeft;
      if (secondsLeft <= 0) finish(false);
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
      game.status.textContent = "Start a song first, then whack it!";
      game.panel.hidden = false;
      game.panel.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    hits = 0;
    trackHealth = TRACK_HEALTH;
    active = true;
    game.panel.hidden = false;
    game.status.textContent = "Whack the mole! You have unlimited hits.";
    $("#wat-hits", game.panel).textContent = hits;
    $("#wat-health", game.panel).value = trackHealth;
    $("#wat-health-value", game.panel).textContent = trackHealth;
    hideMoles();
    startClock();
    game.panel.scrollIntoView({ behavior: "smooth", block: "center" });
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
      window.dispatchEvent(new CustomEvent("rizney:track-whacked"));
      $("#wat-refresh", game.panel).hidden = false;
    }
    // Keep the finished game visible so the health bar and result can be seen.
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
    const button = document.querySelector("#whack-track");
    if (!button || button.dataset.whackGameBound === "true") return;
    button.dataset.whackGameBound = "true";
    Object.assign(button.style, { flexBasis: "100%", order: "99" });
    button.addEventListener("click", startGame, true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
