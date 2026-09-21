/* Tap-to-move Frogger for the Rizney song list. Each song row is a crossing. */
(() => {
  "use strict";
  const youtube = () => window.rizneyPlayer || window.player || null;
  const $ = (selector, root = document) => root.querySelector(selector);
  let game;

  function styles() {
    if ($("#frogger-styles")) return;
    const style = document.createElement("style");
    style.id = "frogger-styles";
    style.textContent = `
      #frogger-game { max-width:min(92vw,620px); margin:8px auto 18px; padding:12px 14px 16px; text-align:center; background:#120b18; border:2px solid #d4af37; border-radius:12px; box-shadow:0 0 24px rgba(212,175,55,.35); color:#c084fc; }
      #frogger-game h2 { margin:0 0 5px; color:#f5d76e; } #frogger-status { min-height:1.4em; margin:3px 0; }
      .frogger-row { position:relative; outline:2px solid transparent; transition:outline-color .15s,background .15s; }
      .frogger-row.frogger-current { outline-color:#f5d76e; background:rgba(212,175,55,.16); }
      .frogger-obstacle { float:right; margin-left:8px; opacity:.9; } .frogger-frog { float:left; margin-right:8px; }
      #frogger-game .frogger-help { font-size:.9em; color:#b9a8c5; margin:5px 0 10px; }
      @media (max-width:640px) { #frogger-game { width:100%; margin-top:4px; } }
    `;
    document.head.appendChild(style);
  }

  function songRows() { return [...document.querySelectorAll("#song-list .song, .song")]; }
  function createGame() {
    if (game) return game;
    styles();
    const panel = document.createElement("section");
    panel.id = "frogger-game"; panel.hidden = true; panel.setAttribute("aria-label", "Rizney Frogger");
    panel.innerHTML = `<h2>Frogger: Mix'N'Mojo</h2><p id="frogger-status" aria-live="polite">Tap the page to hop upward.</p><p><span id="frogger-time">--:--</span> left · Score: <span id="frogger-score">0</span></p><p class="frogger-help">Every song is a row. Tap the left or right side of the page to dodge the object in that row, then hop forward.</p><button id="frogger-close" type="button">Close game</button>`;
    ($(".player-dock") || $("main") || document.body).insertAdjacentElement("afterend", panel);
    game = { panel, rows:[], position:0, active:false, startedAt:0, animation:0, score:0 };
    $("#frogger-close", panel).onclick = closeGame;
    return game;
  }
  function setStatus(text) { game.status.textContent = text; }
  function decorateRows() {
    game.rows = songRows();
    game.rows.forEach((row, index) => {
      row.classList.add("frogger-row"); row.dataset.froggerIndex = index;
      row.querySelector(".frogger-obstacle")?.remove(); row.querySelector(".frogger-frog")?.remove();
      const obstacle = document.createElement("span"); obstacle.className = "frogger-obstacle"; obstacle.textContent = Math.random() < .78 ? (index % 2 ? "🚙" : "🎸") : "";
      obstacle.dataset.lane = Math.random() < .5 ? "left" : "right"; row.appendChild(obstacle);
    });
  }
  function draw() {
    game.rows.forEach((row, index) => {
      row.classList.toggle("frogger-current", game.active && index === game.position);
      row.querySelector(".frogger-frog")?.remove();
      if (game.active && index === game.position) { const frog = document.createElement("span"); frog.className = "frogger-frog"; frog.textContent = "🐸"; row.prepend(frog); }
    });
  }
  function timeLeft() {
    const player = youtube(), duration = player?.getDuration?.() || 0, current = player?.getCurrentTime?.() || 0;
    return Math.max(0, duration - current);
  }
  function finish(won, message) {
    if (!game.active) return;
    game.active = false; cancelAnimationFrame(game.animation);
    game.rows.forEach(row => row.classList.remove("frogger-current")); draw();
    if (won) { game.score = Math.max(0, Math.round(1000 + timeLeft() * 10)); $("#frogger-score", game.panel).textContent = game.score; setStatus(`🎉 Congratulations! You reached the player! Score: ${game.score}`); $(".player-dock")?.scrollIntoView({ behavior:"smooth", block:"start" }); }
    else setStatus(message || "Bonk! You hit an obstacle. Press Frogger to try again.");
  }
  function tick() {
    if (!game.active) return;
    const player = youtube(), left = timeLeft();
    $("#frogger-time", game.panel).textContent = `${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, "0")}`;
    if (player && window.YT && player.getPlayerState?.() === YT.PlayerState.ENDED || (player?.getDuration?.() && left <= .2)) return finish(false, "The song ended before you reached the player!");
    draw(); game.animation = requestAnimationFrame(tick);
  }
  function hop(event) {
    if (!game?.active || event.target.closest("button, a, input, select, textarea")) return;
    const lane = event.clientX < window.innerWidth / 2 ? "left" : "right";
    const row = game.rows[game.position], obstacle = row?.querySelector(".frogger-obstacle");
    if (obstacle?.textContent && obstacle.dataset.lane === lane) return finish(false, "Bonk! Try again and tap the opposite side of the page.");
    if (game.position <= 0) return finish(true);
    game.position--; game.score += 10; $("#frogger-score", game.panel).textContent = game.score; draw();
    game.rows[game.position]?.scrollIntoView({ behavior:"smooth", block:"center" });
  }
  function start(event) {
    event?.preventDefault(); game = createGame(); game.panel.hidden = false; game.status = $("#frogger-status", game.panel);
    const player = youtube();
    if (!player || !window.YT || player.getPlayerState?.() !== YT.PlayerState.PLAYING) { game.active = false; setStatus("Start playing a song first, then launch Frogger!"); game.panel.scrollIntoView({ behavior:"smooth", block:"start" }); return; }
    decorateRows(); if (!game.rows.length) return setStatus("No song rows were found.");
    game.position = game.rows.length - 1; game.score = 0; game.active = true; game.startedAt = performance.now(); $("#frogger-score", game.panel).textContent = "0"; setStatus("Tap the left or right side to dodge and hop upward!"); draw(); game.rows[game.position].scrollIntoView({ behavior:"smooth", block:"center" }); tick();
  }
  function closeGame() { if (!game) return; game.active = false; cancelAnimationFrame(game.animation); game.panel.hidden = true; game.rows.forEach(row => { row.classList.remove("frogger-row","frogger-current"); row.querySelector(".frogger-obstacle")?.remove(); row.querySelector(".frogger-frog")?.remove(); }); }
  function init() {
    const controls = $(".controls"); if (!controls || $("#frogger-start")) return;
    const button = document.createElement("button"); button.id = "frogger-start"; button.type = "button"; button.textContent = "Frogger"; button.onclick = start; controls.appendChild(button);
    document.addEventListener("pointerdown", hop, { passive:false });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once:true }); else init();
})();
