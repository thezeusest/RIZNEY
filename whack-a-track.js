/* WHACK-A-TRACK: local mini-game for the Rizney music page. */
(() => {
  'use strict';

  const init = () => {
    if (document.querySelector('#wat-launch')) return;

    const STORAGE_KEY = 'mewzing.whack-a-track.destroyed';
    const WHACKS_TO_WIN = 18;
    const MOLE_COUNT = 12;
    const ICONS = ['✦', '★', '♬', '♪', '⚡', '✧', '◉', '●', '✹', '☼'];
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
      const reading = text.match(/Reading\s+\d+\s+of\s+\d+:\s+Song\s+(\d+)/i);
      if (reading) return Math.max(0, Number(reading[1]) - 1);
      const match = text.match(/Song\s+(\d+)/i);
      return match ? Math.max(0, Number(match[1]) - 1) : 0;
    };
    const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify([...destroyed]));

    const style = document.createElement('style');
    style.textContent = `
      #wat-launch{margin-left:auto;background:#2c1745;color:#f5d76e;font-weight:bold}
      #wat-panel{position:relative;width:min(100% - 24px,900px);margin:18px auto 0;padding:16px;color:#e0aaff;background:#120b18;border:2px solid #d4af37;border-radius:12px;box-shadow:0 0 18px #d4af3740;overflow:hidden}
      #wat-panel[hidden]{display:none}.wat-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.wat-head h2{margin:0;border:0;padding:0;font-family:Georgia,serif}
      #wat-target{margin:12px 0;color:#f5d76e;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.wat-stat{display:flex;justify-content:space-between;gap:12px;margin:7px 0}
      #wat-health{color:#f5d76e;letter-spacing:1px;word-break:break-all}#wat-board{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px}
      .wat-hole{position:relative;min-height:94px;overflow:hidden;border:0;border-radius:50%;background:#050305;box-shadow:inset 0 10px 0 #000,0 0 0 2px #3b1d50;cursor:pointer;touch-action:manipulation}
      .wat-hole:focus-visible{outline:3px solid #f5d76e}.wat-hole.whacked{animation:wat-shake .22s linear;background:#44205e;box-shadow:0 0 20px #f5d76e,inset 0 10px 0 #000}
      .wat-mole{position:absolute;inset:auto 8% -8px;height:75px;width:75px;display:flex;align-items:center;justify-content:center;transform:translateY(84px);transition:transform .12s ease,color .12s ease,opacity .12s ease;opacity:0;color:#120b18;background:#c084fc;border:5px solid #e0aaff;border-radius:50% 50% 30% 30%;font-size:30px;line-height:1;box-shadow:0 10px 18px #0008}
      .wat-mole.up{transform:translateY(0);opacity:1}.wat-mole.hit{animation:wat-pop .3s ease-out}.wat-float,.wat-spark{position:absolute;pointer-events:none;z-index:5;font-weight:bold;color:#f5d76e;text-shadow:0 0 8px #fff;animation:wat-float .7s ease-out forwards}.wat-spark{font-size:1.3rem;animation:wat-spark .5s ease-out forwards}
      #wat-panel.wat-win{animation:wat-win .7s ease-in-out 2;border-color:#fff;box-shadow:0 0 35px #f5d76e,0 0 80px #c084fc}.wat-erased{animation:wat-erase .9s ease-in forwards!important;pointer-events:none}
      #wat-message{min-height:1.5em;margin:12px 0 0;color:#f5d76e;text-align:center;font-weight:bold}#wat-restore{display:block;margin:14px auto 0;padding:6px 9px;font-size:.72rem;background:transparent;color:#b9a8c5;border-color:#3b1d50}
      @keyframes wat-shake{0%,100%{transform:translateX(0) rotate(0)}25%{transform:translateX(-7px) rotate(-5deg)}75%{transform:translateX(7px) rotate(5deg)}}
      @keyframes wat-pop{0%{transform:translateY(0) scale(1)}45%{transform:translateY(-12px) scale(1.35) rotate(12deg)}100%{transform:translateY(84px) scale(.3);opacity:0}}
      @keyframes wat-float{0%{transform:translate(-50%,0) scale(.7);opacity:1}100%{transform:translate(-50%,-48px) scale(1.35);opacity:0}}
      @keyframes wat-spark{0%{transform:scale(.2) rotate(0);opacity:1}100%{transform:scale(1.8) rotate(180deg);opacity:0}}
      @keyframes wat-win{50%{transform:scale(1.025) rotate(-1deg)}100%{transform:scale(1) rotate(0)}}
      @keyframes wat-erase{0%{opacity:1;transform:scale(1) rotate(0)}45%{opacity:1;transform:scale(1.06) rotate(-2deg)}100%{opacity:0;transform:scale(.05) rotate(18deg);filter:blur(8px)}}
      @media(max-width:500px){#wat-launch{width:100%;margin-left:0}#wat-panel{padding:12px}.wat-hole{min-height:104px}.wat-mole{height:82px;width:82px;font-size:32px;line-height:72px}}
    `;
    document.head.appendChild(style);

    const launch = document.createElement('button');
    launch.id = 'wat-launch'; launch.type = 'button'; launch.textContent = '🎵 WHACK-A-TRACK'; controls.appendChild(launch);

    const panel = document.createElement('section');
    panel.id = 'wat-panel'; panel.hidden = true; panel.setAttribute('aria-label', 'Whack-a-Track game');
    panel.innerHTML = `<div class="wat-head"><h2>🎵 WHACK-A-TRACK</h2><button id="wat-close" type="button" aria-label="Close game">×</button></div><div id="wat-target">NOW WHACKING: —</div><div class="wat-stat"><span id="wat-health"></span><span id="wat-time">TIME LEFT 00:20</span></div><div id="wat-board" aria-label="Mole board"></div><p id="wat-message"></p><button id="wat-restore" type="button">Restore defeated tracks</button>`;
    main.prepend(panel);

    const board = panel.querySelector('#wat-board');
    for (let i = 0; i < MOLE_COUNT; i += 1) {
      const hole = document.createElement('button');
      hole.className = 'wat-hole'; hole.type = 'button'; hole.setAttribute('aria-label', `Whack hole ${i + 1}`);
      hole.innerHTML = '<span class="wat-mole" aria-label="Mole">●</span>'; board.appendChild(hole);
    }

    let active = false, targetIndex = 0, hits = 0, seconds = 20, timer = 0, popTimer = 0;
    const setMessage = text => { panel.querySelector('#wat-message').textContent = text; };
    const updateHealth = () => {
      const left = Math.max(0, WHACKS_TO_WIN - hits);
      panel.querySelector('#wat-health').textContent = '█'.repeat(left) + '░'.repeat(WHACKS_TO_WIN - left);
      panel.querySelector('#wat-time').textContent = `TIME LEFT ${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    };
    const sound = (frequency, duration = .08) => {
      try {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = context.createOscillator(); const gain = context.createGain();
        oscillator.frequency.value = frequency; gain.gain.setValueAtTime(.035, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + duration);
        oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + duration);
      } catch (_) { /* Sound is optional. */ }
    };
    const burst = (hole, text = '+1') => {
      const rect = hole.getBoundingClientRect(); const parent = panel.getBoundingClientRect();
      const float = document.createElement('span'); float.className = 'wat-float'; float.textContent = text;
      float.style.left = `${rect.left - parent.left + rect.width / 2}px`; float.style.top = `${rect.top - parent.top + 12}px`; panel.appendChild(float);
      for (let i = 0; i < 4; i += 1) { const spark = document.createElement('span'); spark.className = 'wat-spark'; spark.textContent = ICONS[(hits + i) % ICONS.length]; spark.style.left = `${rect.left - parent.left + rect.width / 2 + (i - 2) * 18}px`; spark.style.top = `${rect.top - parent.top + 25}px`; panel.appendChild(spark); setTimeout(() => spark.remove(), 520); }
      setTimeout(() => float.remove(), 720);
    };
    const pop = () => {
      if (!active) return;
      board.querySelectorAll('.wat-mole').forEach(mole => mole.classList.remove('up'));
      const hole = board.children[Math.floor(Math.random() * MOLE_COUNT)]; const mole = hole.querySelector('.wat-mole');
      mole.textContent = ICONS[Math.floor(Math.random() * ICONS.length)]; mole.classList.add('up'); hole.setAttribute('aria-label', `Whack ${mole.textContent}`);
      clearTimeout(popTimer); popTimer = setTimeout(() => mole.classList.remove('up'), Math.max(150, 650 - hits * 18));
    };
    const finish = won => {
      active = false; clearInterval(timer); clearTimeout(popTimer);
      board.querySelectorAll('.wat-mole').forEach(mole => mole.classList.remove('up'));
      if (!won) { setMessage('TIME UP — the track escaped! Try again!'); sound(130, .18); return; }
      destroyed.add(targetIndex); save(); panel.classList.add('wat-win'); setMessage('💥 TRACK ERASED! 💥'); sound(880, .12); setTimeout(() => sound(1175, .2), 90);
      const row = songRows()[targetIndex];
      if (row) { row.classList.add('wat-erased'); setTimeout(() => { row.hidden = true; row.classList.remove('wat-erased'); }, 900); }
      setTimeout(() => panel.classList.remove('wat-win'), 1500);
    };
    const start = () => {
      targetIndex = currentSongIndex(); hits = 0; seconds = Math.max(1, Math.ceil(Number(window.player?.getDuration?.() || 20)));
      active = true; panel.hidden = false; panel.querySelector('#wat-target').textContent = `NOW WHACKING: Song ${targetIndex + 1}`; setMessage(`Whack ${WHACKS_TO_WIN} targets before the song ends!`); updateHealth(); pop();
      clearInterval(timer); timer = setInterval(() => { if (!active) return; seconds -= 1; updateHealth(); if (seconds <= 0) finish(false); }, 1000);
    };
    board.addEventListener('click', event => {
      const mole = event.target.closest('.wat-mole'); if (!active || !mole?.classList.contains('up')) return;
      const hole = mole.closest('.wat-hole'); hits += 1; mole.classList.add('hit'); hole.classList.add('whacked'); burst(hole); sound(360 + hits * 22);
      setTimeout(() => { mole.classList.remove('hit'); hole.classList.remove('whacked'); }, 240); updateHealth(); if (hits >= WHACKS_TO_WIN) finish(true); else pop();
    });
    launch.addEventListener('click', start);
    panel.querySelector('#wat-close').addEventListener('click', () => { active = false; clearInterval(timer); clearTimeout(popTimer); panel.hidden = true; });
    panel.querySelector('#wat-restore').addEventListener('click', () => { destroyed.clear(); save(); songRows().forEach(row => { row.hidden = false; }); setMessage('Defeated tracks restored.'); });
    songRows().forEach((row, index) => { row.hidden = destroyed.has(index); });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
