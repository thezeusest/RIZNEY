/* WHACK-A-TRACK: local mini-game for the Rizney music page. */
(() => {
  'use strict';

  const init = () => {
    if (document.querySelector('#wat-launch')) return;

    const STORAGE_KEY = 'mewzing.whack-a-track.destroyed';
    const WHACKS_TO_WIN = 18;
    const MOLE_COUNT = 9;
    const controls = document.querySelector('.controls');
    const main = document.querySelector('main');
    if (!controls || !main) return false;

    let destroyedValues = [];
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (Array.isArray(stored)) destroyedValues = stored;
    } catch (_) {
      localStorage.removeItem(STORAGE_KEY);
    }
    const destroyed = new Set(destroyedValues);
    const songRows = () => [...document.querySelectorAll('.song')];
    const currentSongIndex = () => {
      const text = document.querySelector('#now-playing')?.textContent || '';
      const match = text.match(/Song\s+(\d+)/i);
      return match ? Math.max(0, Number(match[1]) - 1) : 0;
    };
    const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify([...destroyed]));

    const style = document.createElement('style');
    style.textContent = `
      #wat-launch{margin-left:auto;background:#2c1745;color:#f5d76e;font-weight:bold}
      #wat-panel{width:min(100% - 24px,900px);margin:18px auto 0;padding:16px;color:#e0aaff;background:#120b18;border:2px solid #d4af37;border-radius:12px;box-shadow:0 0 18px #d4af3740}
      #wat-panel[hidden]{display:none}.wat-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.wat-head h2{margin:0;border:0;padding:0;font-family:Georgia,serif}
      #wat-target{margin:12px 0;color:#f5d76e;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.wat-stat{display:flex;justify-content:space-between;gap:12px;margin:7px 0}
      #wat-health{color:#f5d76e;letter-spacing:1px;word-break:break-all}#wat-board{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px}
      .wat-hole{position:relative;min-height:94px;overflow:hidden;border:0;border-radius:50%;background:#050305;box-shadow:inset 0 10px 0 #000,0 0 0 2px #3b1d50;cursor:pointer;touch-action:manipulation}
      .wat-hole:focus-visible{outline:3px solid #f5d76e}.wat-mole{position:absolute;inset:auto 8% -8px;height:75px;color:#120b18;background:#c084fc;border:5px solid #e0aaff;border-radius:50% 50% 20% 20%;font:900 35px/65px monospace;text-shadow:0 2px #f5d76e;transform:translateY(100%);transition:transform .12s}.wat-mole.up{transform:translateY(0)}
      #wat-message{min-height:1.5em;margin:12px 0 0;color:#f5d76e;text-align:center;font-weight:bold}#wat-restore{display:block;margin:14px auto 0;padding:6px 9px;font-size:.72rem;background:transparent}
      @media(max-width:500px){#wat-launch{width:100%;margin-left:0}#wat-panel{padding:12px}.wat-hole{min-height:104px}.wat-mole{height:82px;font-size:32px;line-height:72px}}
    `;
    document.head.appendChild(style);

    const launch = document.createElement('button');
    launch.id = 'wat-launch';
    launch.type = 'button';
    launch.textContent = '🎵 WHACK-A-TRACK';
    controls.appendChild(launch);

    const panel = document.createElement('section');
    panel.id = 'wat-panel';
    panel.hidden = true;
    panel.setAttribute('aria-label', 'Whack-a-Track game');
    panel.innerHTML = `
      <div class="wat-head"><h2>🎵 WHACK-A-TRACK</h2><button id="wat-close" type="button" aria-label="Close game">×</button></div>
      <div id="wat-target">NOW WHACKING: —</div>
      <div class="wat-stat"><span id="wat-health"></span><span id="wat-time">TIME LEFT 00:20</span></div>
      <div id="wat-board" aria-label="Mole board"></div>
      <p id="wat-message"></p>
      <button id="wat-restore" type="button">Restore defeated tracks</button>`;
    main.prepend(panel);

    const board = panel.querySelector('#wat-board');
    for (let i = 0; i < MOLE_COUNT; i += 1) {
      const hole = document.createElement('button');
      hole.className = 'wat-hole';
      hole.type = 'button';
      hole.setAttribute('aria-label', `Whack hole ${i + 1}`);
      hole.innerHTML = '<span class="wat-mole" aria-label="Mole">●</span>';
      board.appendChild(hole);
    }

    let active = false;
    let targetIndex = 0;
    let hits = 0;
    let seconds = 20;
    let timer = 0;
    let popTimer = 0;

    const updateHealth = () => {
      const left = Math.max(0, WHACKS_TO_WIN - hits);
      panel.querySelector('#wat-health').textContent = '█'.repeat(left) + '░'.repeat(WHACKS_TO_WIN - left);
      panel.querySelector('#wat-time').textContent = `TIME LEFT 00:${String(seconds).padStart(2, '0')}`;
    };
    const pop = () => {
      if (!active) return;
      board.querySelectorAll('.wat-mole').forEach(mole => mole.classList.remove('up'));
      const mole = board.children[Math.floor(Math.random() * MOLE_COUNT)].querySelector('.wat-mole');
      mole.classList.add('up');
      clearTimeout(popTimer);
      popTimer = setTimeout(() => mole.classList.remove('up'), 800);
    };
    const finish = won => {
      active = false;
      clearInterval(timer);
      clearTimeout(popTimer);
      board.querySelectorAll('.wat-mole').forEach(mole => mole.classList.remove('up'));
      panel.querySelector('#wat-message').textContent = won ? 'TRACK DEFEATED!' : 'Time up — try again!';
      if (won) {
        destroyed.add(targetIndex);
        save();
      }
      songRows().forEach((row, index) => { row.hidden = destroyed.has(index); });
    };
    const start = () => {
      targetIndex = currentSongIndex();
      hits = 0;
      seconds = 20;
      active = true;
      panel.hidden = false;
      panel.querySelector('#wat-target').textContent = `NOW WHACKING: Song ${targetIndex + 1}`;
      panel.querySelector('#wat-message').textContent = `Whack the mole ${WHACKS_TO_WIN} times!`;
      updateHealth();
      pop();
      clearInterval(timer);
      timer = setInterval(() => {
        if (!active) return;
        seconds -= 1;
        updateHealth();
        if (seconds <= 0) finish(false);
      }, 1000);
    };

    board.addEventListener('click', event => {
      const mole = event.target.closest('.wat-mole');
      if (!active || !mole?.classList.contains('up')) return;
      hits += 1;
      mole.classList.remove('up');
      updateHealth();
      if (hits >= WHACKS_TO_WIN) finish(true);
      else pop();
    });
    launch.addEventListener('click', start);
    panel.querySelector('#wat-close').addEventListener('click', () => {
      active = false;
      clearInterval(timer);
      clearTimeout(popTimer);
      panel.hidden = true;
    });
    panel.querySelector('#wat-restore').addEventListener('click', () => {
      destroyed.clear();
      save();
      songRows().forEach(row => { row.hidden = false; });
      panel.querySelector('#wat-message').textContent = 'Defeated tracks restored.';
    });
    songRows().forEach((row, index) => { row.hidden = destroyed.has(index); });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
