/* Whack-a-Track mini-game for the Rizney YouTube player. */
(() => {
  "use strict";

  const STARTING_HEALTH = 12;
  const youtube = () => window.rizneyPlayer || null;
  let game;
  let active = false;
  let hits = 0;
  let moleTimer;
  let hideTimer;

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
      <p><strong>Hits left: <span id="wat-hits">${STARTING_HEALTH}</span></strong></p>
      <div id="wat-board" role="group" aria-label="Whack-a-Track board"></div>
      <button id="wat-close" type="button">Close game</button>
    `;
    Object.assign(panel.style, {
      maxWidth: "620px", margin: "24px auto", padding: "18px", textAlign: "center",
      color: "#e0aaff", background: "#120b18", border: "2px solid #d4af37", borderRadius: "12px"
    });

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
        $("#wat-hits", panel).textContent = Math.max(0, STARTING_HEALTH - hits);
        if (hits >= STARTING_HEALTH) finish(true);
      });
      board.appendChild(hole);
    }

    $("#wat-close", panel).addEventListener("click", closeGame);
    ( $("main") || document.body ).appendChild(panel);
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
    }, 700);
    moleTimer = setTimeout(spawnMole, 850);
  }

  function startGame(event) {
    event?.preventDefault();
    event?.stopImmediatePropagation();
    if (!playing()) {
      game = createGame();
      game.status.textContent = "Start a song first, then whack it!";
      game.panel.hidden = false;
      game.panel.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    game = createGame();
    clearTimeout(moleTimer);
    hits = 0;
    active = true;
    game.panel.hidden = false;
    game.status.textContent = "Whack the mole!";
    $("#wat-hits", game.panel).textContent = STARTING_HEALTH;
    hideMoles();
    game.panel.scrollIntoView({ behavior: "smooth", block: "center" });
    spawnMole();
  }

  function finish(won) {
    active = false;
    clearTimeout(moleTimer);
    clearTimeout(hideTimer);
    hideMoles();
    game.status.textContent = won ? "💥 TRACK WHACKED!" : "The track survived.";
  }

  function closeGame() {
    active = false;
    clearTimeout(moleTimer);
    clearTimeout(hideTimer);
    if (game) {
      hideMoles();
      game.panel.hidden = true;
    }
  }

  function init() {
    const button = document.querySelector("#whack-track");
    if (!button || button.dataset.whackGameBound === "true") return;
    button.dataset.whackGameBound = "true";
    button.addEventListener("click", startGame, true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
