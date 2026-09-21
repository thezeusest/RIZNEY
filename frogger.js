/* Frogger-style Rizney mini-game: reach the top before the current song ends. */
(() => {
  "use strict";
  const COLS = 11;
  const ROWS = 9;
  const youtube = () => window.rizneyPlayer || window.player || null;
  const $ = (selector, root = document) => root.querySelector(selector);
  let game;

  function injectStyles() {
    if ($("#frogger-styles")) return;
    const style = document.createElement("style");
    style.id = "frogger-styles";
    style.textContent = `
      #frogger-game { max-width:min(92vw,620px); margin:8px auto 18px; padding:12px 14px 16px; text-align:center; background:#120b18; border:2px solid #d4af37; border-radius:12px; box-shadow:0 0 24px rgba(212,175,55,.35); color:#c084fc; }
      #frogger-game h2 { margin:0 0 5px; color:#f5d76e; }
      #frogger-status { min-height:1.4em; margin:3px 0; }
      #frogger-board { display:grid; grid-template-columns:repeat(11,1fr); gap:2px; width:min(100%,520px); margin:12px auto; padding:3px; background:#241333; border:1px solid #8b5ab5; }
      .frogger-cell { aspect-ratio:1; display:grid; place-items:center; border-radius:2px; font-size:clamp(1rem,4.8vw,1.65rem); user-select:none; }
      .frogger-road { background:#2a2330; } .frogger-safe { background:#17351e; } .frogger-goal { background:#243f18; }
      .frogger-controls { display:grid; grid-template-columns:repeat(3,50px); justify-content:center; gap:5px; margin:8px auto; }
      .frogger-controls button { min-height:38px; padding:3px; } .frogger-controls .empty { visibility:hidden; }
      @media (max-width:640px) { #frogger-game { width:100%; margin-top:4px; } }
    `;
    document.head.appendChild(style);
  }

  function createGame() {
    if (game) return game;
    injectStyles();
    const panel = document.createElement("section");
    panel.id = "frogger-game";
    panel.hidden = true;
    panel.setAttribute("aria-label", "Rizney Frogger");
    panel.innerHTML = `<h2>Frogger: Mix'N'Mojo</h2><p id="frogger-status" aria-live="polite">Reach the top before the song ends!</p><p><span id="frogger-time">--:--</span> left</p><div id="frogger-board" role="grid" aria-label="Frogger board"></div><div class="frogger-controls" aria-label="Frog controls"><button class="empty" tabindex="-1" aria-hidden="true"></button><button type="button" data-move="up" aria-label="Move up">▲</button><button class="empty" tabindex="-1" aria-hidden="true"></button><button type="button" data-move="left" aria-label="Move left">◀</button><button type="button" data-move="down" aria-label="Move down">▼</button><button type="button" data-move="right" aria-label="Move right">▶</button></div><button id="frogger-close" type="button">Close game</button>`;
    ($(".player-dock") || $("main") || document.body).insertAdjacentElement("afterend", panel);
    const board = $("#frogger-board", panel);
    const cells = [];
    for (let row = 0; row < ROWS; row++) for (let col = 0; col < COLS; col++) {
      const cell = document.createElement("div");
      cell.className = `frogger-cell ${row === 0 ? "frogger-goal" : row === ROWS - 1 || row % 2 === 0 ? "frogger-safe" : "frogger-road"}`;
      cell.setAttribute("role", "gridcell"); board.appendChild(cell); cells.push(cell);
    }
    game = { panel, board, cells, row:ROWS - 1, col:Math.floor(COLS / 2), active:false, timer:null, animation:null };
    $("#frogger-close", panel).onclick = closeGame;
    panel.querySelectorAll("[data-move]").forEach(button => button.onclick = () => move(button.dataset.move));
    return game;
  }

  function resetBoard() {
    game.cells.forEach(cell => { cell.textContent = ""; });
    game.row = ROWS - 1; game.col = Math.floor(COLS / 2); render();
  }
  function carAt(row, col, now) {
    if (row === 0 || row === ROWS - 1 || row % 2 === 0) return false;
    const speed = row % 4 === 1 ? 0.004 : -0.005;
    const offset = Math.floor(now * speed * COLS * 2);
    const start = ((row * 3 + offset) % COLS + COLS) % COLS;
    return (col - start + COLS) % COLS < 2;
  }
  function render() {
    const now = performance.now();
    game.cells.forEach((cell, i) => {
      const row = Math.floor(i / COLS), col = i % COLS;
      cell.textContent = row === game.row && col === game.col ? "🐸" : carAt(row, col, now) ? "🚗" : row === 0 ? "✦" : "";
    });
  }
  function move(direction) {
    if (!game?.active) return;
    const delta = { up:[-1,0], down:[1,0], left:[0,-1], right:[0,1] }[direction];
    if (!delta) return;
    game.row = Math.max(0, Math.min(ROWS - 1, game.row + delta[0]));
    game.col = Math.max(0, Math.min(COLS - 1, game.col + delta[1]));
    if (game.row === 0) return finish(true);
    render();
  }
  function finish(won) {
    if (!game.active) return;
    game.active = false; cancelAnimationFrame(game.animation); clearInterval(game.timer);
    game.status.textContent = won ? "🐸 You made it! The groove is yours!" : "The song ended! Press Frogger to try again.";
    render();
  }
  function tick() {
    if (!game.active) return;
    const player = youtube();
    const duration = player?.getDuration?.() || 0, current = player?.getCurrentTime?.() || 0;
    const left = Math.max(0, duration - current);
    $("#frogger-time", game.panel).textContent = duration ? `${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, "0")}` : "--:--";
    if (player && window.YT && player.getPlayerState?.() === YT.PlayerState.ENDED) return finish(false);
    if (duration && current >= duration - .2) return finish(false);
    if (game.row > 0 && game.row < ROWS - 1 && carAt(game.row, game.col, performance.now())) return finish(false);
    render(); game.animation = requestAnimationFrame(tick);
  }
  function startGame(event) {
    event?.preventDefault();
    game = createGame(); game.panel.hidden = false; game.status = $("#frogger-status", game.panel);
    const player = youtube();
    if (!player || !window.YT || player.getPlayerState?.() !== YT.PlayerState.PLAYING) {
      game.active = false; game.status.textContent = "Start playing a song first, then launch Frogger!"; game.panel.scrollIntoView({ behavior:"smooth", block:"start" }); return;
    }
    game.active = true; resetBoard(); game.status.textContent = "Use arrow keys, WASD, or the buttons. Avoid the cars!"; game.panel.scrollIntoView({ behavior:"smooth", block:"start" }); tick();
  }
  function closeGame() { if (!game) return; game.active = false; cancelAnimationFrame(game.animation); clearInterval(game.timer); game.panel.hidden = true; }
  function init() {
    const controls = $(".controls"); if (!controls || $("#frogger-start")) return;
    const button = document.createElement("button"); button.id = "frogger-start"; button.type = "button"; button.textContent = "Frogger"; button.onclick = startGame; controls.appendChild(button);
    document.addEventListener("keydown", event => { if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","w","a","s","d"].includes(event.key)) { event.preventDefault(); move(({ArrowUp:"up",ArrowDown:"down",ArrowLeft:"left",ArrowRight:"right",w:"up",a:"left",s:"down",d:"right"})[event.key]); } });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once:true }); else init();
})();
