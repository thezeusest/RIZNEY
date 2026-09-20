/* WHACK-A-TRACK: local mini-game for the Rizney music page. */
(() => {
  'use strict';

  const STORAGE_KEY = 'mewzing.whack-a-track.destroyed';
  const WHACKS_TO_WIN = 18;
  const MOLE_COUNT = 9;
  const destroyed = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
  const songRows = () => [...document.querySelectorAll('.song')];
  const currentSongIndex = () => {
    const text = document.querySelector('#now-playing')?.textContent || '';
    const match = text.match(/Song\s+(\d+)/i);
    return match ? Number(match[1]) - 1 : 0;
  };
  const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify([...destroyed]));

  /* The page creates the YouTube player in its inline script. Capture the
     instance without requiring the player variable to be global. */
  let player = null;
  const capturePlayer = () => {
    if (!window.YT?.Player || window.YT.Player.__watWrapped) return;
    const YouTubePlayer = window.YT.Player;
    const WatchedPlayer = function (...args) {
      player = new YouTubePlayer(...args);
      return player;
    };
    WatchedPlayer.__watWrapped = true;
    WatchedPlayer.prototype = YouTubePlayer.prototype;
    window.YT.Player = WatchedPlayer;
  };
  capturePlayer();
  const playerCaptureTimer = setInterval(() => {
    capturePlayer();
    if (player) clearInterval(playerCaptureTimer);
  }, 100);

  const style = document.createElement('style');
  style.textContent = `
    #wat-launch{margin-left:auto;background:#2c1745;color:#f5d76e;font-weight:bold}
    #wat-panel{width:min(100% - 24px,900px);margin:18px auto 0;padding:16px;color:#e0aaff;background:#120b18;border:2px solid #d4af37;border-radius:12px;box-shadow:0 0 18px #d4af3740}
    #wat-panel[hidden]{display:none}.wat-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.wat-head h2{margin:0;border:0;padding:0;font-family:Georgia,serif}
    #wat-target{margin:12px 0;color:#f5d76e;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.wat-stat{display:flex;justify-content:space-between;gap:12px;margin:7px 0}
    #wat-health{color:#f5d76e;letter-spacing:1px;word-break:break-all}#wat-board{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px}
    .wat-hole{position:relative;width:100%;aspect-ratio:1;min-height:0;overflow:hidden;border:0;border-radius:50%;background:#050305;box-shadow:inset 0 10px 0 #000,0 0 0 2px #3b1d50;cursor:pointer;touch-action:manipulation}
    .wat-hole:focus-visible{outline:3px solid #f5d76e}
    .wat-mole{position:absolute;left:15%;bottom:-8%;width:70%;height:auto;aspect-ratio:1;color:#120b18;background:#c084fc;border:5px solid #e0aaff;border-radius:50%;font:900 clamp(1.8rem,7vw,3rem)/1 monospace;display:grid;place-items:center;text-shadow:0 2px #f5d76e;transform:translateY(115%);transition:transform .12s;z-index:1}
    .wat-mole.up{transform:translateY(0)}
    #wat-message{min-height:1.5em;margin:12px 0 0;color:#f5d76e;text-align:center;font-weight:bold}#wat-restore{display:block;margin:14px auto 0;padding:6px 9px;font-size:.72rem;background:transparent;color:#b9a8c5;border-color:#3b1d50}
    @media(max-width:500px){#wat-launch{width:100%;margin-left:0}#wat-panel{padding:12px}}
  `;
  document.head.appendChild(style);

  const controls = document.querySelector('.controls');
  const main = document.querySelector('main');
  if (!controls || !main) return;

  const launch = document.createElement('button');
  launch.id = 'wat-launch'; launch.type = 'button'; launch.textContent = '🎵 WHACK-A-TRACK';
  controls.appendChild(launch);

  const panel = document.createElement('section');
  panel.id = 'wat-panel'; panel.hidden = true; panel.setAttribute('aria-label', 'Whack-a-Track game');
  panel.innerHTML = '<div class="wat-head"><h2>🎵 WHACK-A-TRACK</h2><button id="wat-close" type="button" aria-label="Close game">×</button></div><div id="wat-target">NOW WHACKING: —</div><div class="wat-stat"><span id="wat-health"></span><span id="wat-time"></span></div><div id="wat-board"></div><div id="wat-message"></div><button id="wat-restore" type="button">Restore defeated tracks</button>';
  main.prepend(panel);

  const board = panel.querySelector('#wat-board');
  for (let i = 0; i < MOLE_COUNT; i++) {
    const hole = document.createElement('button');
    hole.className = 'wat-hole'; hole.type = 'button';
    hole.innerHTML = '<span class="wat-mole" aria-label="Mole">🐹</span>';
    board.appendChild(hole);
  }

  let active = false, targetIndex = 0, hits = 0, timer = 0, popTimer = 0;
  let seconds = 20, songDuration = 0, lastFallbackTick = 0;
  const updateHealth = () => {
    const left = Math.max(0, WHACKS_TO_WIN - hits);
    panel.querySelector('#wat-health').textContent = '█'.repeat(left) + '░'.repeat(WHACKS_TO_WIN - left);
    const mins = Math.floor(seconds / 60);
    panel.querySelector('#wat-time').textContent = `TIME LEFT ${String(mins).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  };
  const pop = () => {
    if (!active) return;
    board.querySelectorAll('.wat-mole').forEach(mole => mole.classList.remove('up'));
    const mole = board.children[Math.floor(Math.random() * MOLE_COUNT)].querySelector('.wat-mole');
    mole.classList.add('up');
    popTimer = setTimeout(() => mole.classList.remove('up'), 900);
  };
  const isPlaying = () => player?.getPlayerState?.() === (window.YT?.PlayerState?.PLAYING ?? 1);
  const updateSongTimer = () => {
    if (!active) return;
    if (player) {
      const duration = Number(player.getDuration?.() || 0);
      const current = Number(player.getCurrentTime?.() || 0);
      if (duration > 0) {
        songDuration = duration;
        seconds = Math.max(0, Math.ceil(duration - current));
      }
      if (songDuration && player.getPlayerState?.() === (window.YT?.PlayerState?.ENDED ?? 0)) return end(false);
    } else if (isPlaying() && Date.now() - lastFallbackTick >= 1000) {
      seconds = Math.max(0, seconds - 1);
      lastFallbackTick = Date.now();
    }
    updateHealth();
    if (seconds <= 0) end(false);
  };
  const end = won => {
    active = false; clearInterval(timer); clearTimeout(popTimer);
    board.querySelectorAll('.wat-mole').forEach(m => m.classList.remove('up'));
    if (won) { destroyed.add(targetIndex); save(); panel.querySelector('#wat-message').textContent = 'TRACK DEFEATED!'; }
    else panel.querySelector('#wat-message').textContent = 'Song finished — try again!';
    songRows().forEach((row, i) => { if (destroyed.has(i)) row.hidden = true; });
  };
  const start = () => {
    targetIndex = currentSongIndex(); hits = 0; songDuration = 0; seconds = 20; active = true; panel.hidden = false;
    if (player) {
      songDuration = Number(player.getDuration?.() || 0);
      seconds = songDuration ? Math.max(1, Math.ceil(songDuration - Number(player.getCurrentTime?.() || 0))) : 20;
    }
    lastFallbackTick = Date.now();
    panel.querySelector('#wat-target').textContent = `NOW WHACKING: Song ${targetIndex + 1}`;
    panel.querySelector('#wat-message').textContent = 'Whack the mole 18 times!'; updateHealth(); pop();
    clearInterval(timer); timer = setInterval(updateSongTimer, 250);
  };

  board.addEventListener('click', event => {
    const mole = event.target.closest('.wat-mole');
    if (!active || !mole || !mole.classList.contains('up')) return;
    hits++; mole.classList.remove('up'); updateHealth();
    if (hits >= WHACKS_TO_WIN) end(true); else pop();
  });
  launch.addEventListener('click', start);
  panel.querySelector('#wat-close').addEventListener('click', () => { panel.hidden = true; active = false; clearInterval(timer); clearTimeout(popTimer); });
  panel.querySelector('#wat-restore').addEventListener('click', () => { destroyed.clear(); save(); songRows().forEach(row => { row.hidden = false; }); panel.querySelector('#wat-message').textContent = 'Tracks restored.'; });
})();
