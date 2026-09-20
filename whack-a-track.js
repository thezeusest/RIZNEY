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
      if (match) return Math.max(0, Number(match[1]) - 1);
      return Number.isFinite(currentIndex) ? Math.max(0, currentIndex) : 0;
    };
    const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify([...destroyed]));

    const style = document.createElement('style');
    style.textContent = `
      #wat-launch{margin-left:auto;background:#2c1745;color:#f5d76e;font-weight:bold}
      #wat-panel{width:min(100% - 24px,900px);margin:18px auto 0;padding:16px;color:#e0aaff;background:#120b18;border:2px solid #d4af37;border-radius:12px;box-shadow:0 0 18px #d4af3740}
      #wat-panel[hidden]{display:none}.wat-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.wat-head h2{margin:0;border:0;padding:0;font-family:Georgia,serif}
      #wat-target{margin:12px 0;color:#f5d76e;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.wat-stat{display:flex;justify-content:space-between;gap:12px;margin:7px 0}
      #wat-health{color:#f5d76e;letter-spacing:1px;word-break:break-all}#wat-board{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px}
      .wat-hole{position:relative;min-height:94px;overflow:hidden;border:0;border-radius:50%;background:#050305;box-shadow:inset 0 10px 0 #000,0 0 0 2px #3b1d50;cursor:pointer;touch-action:manipulation}
      .wat-hole:focus-visible{outline:3px solid #f5d76e}
      .wat-mole{position:absolute;inset:auto 8% -8px;height:75px;width:75px;display:flex;align-items:center;justify-content:center;transform:translateY(84px);transition:transform .12s ease,color .12s ease,opacity .12s ease;opacity:0;color:#120b18;background:#c084fc;border:5px solid #e0aaff;border-radius:50% 50% 30% 30%;font-size:30px;line-height:1;box-shadow:0 10px 18px rgba(0,0,0,.35)}
      .wat-mole.up{transform:translateY(0);opacity:1}
      #wat-message{min-height:1.5em;margin:12px 0 0;color:#f5d76e;text-align:center;font-weight:bold}#wat-restore{display:block;margin:14px auto 0;padding:6px 9px;font-size:.72rem;background:transparent;color:#b9a8c5;border-color:#3b1d50}
      @media(max-width:500px){#wat-launch{width:100%;margin-left:0}#wat-panel{padding:12px}.wat-hole{min-height:104px}.wat-mole{height:82px;width:82px;font-size:32px;line-height:72px}}
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
    let songDuration = 20;

    const getSongDuration = () => {
      const duration = Number(player?.getDuration?.() || 0);
      if (Number.isFinite(duration) && duration > 0) return duration;
      return 20;
    };

    const setMessage = text => {
      panel.querySelector('#wat-message').textContent = text;
    };

    const updateHealth = () => {
      const left = Math.max(0, WHACKS_TO_WIN - hits);
      panel.querySelector('#wat-health').textContent = '█'.repeat(left) + '░'.repeat(WHACKS_TO_WIN - left);
      const mins = Math.floor(seconds / 60);
      const secs = String(seconds % 60).padStart(2, '0');
      panel.querySelector('#wat-time').textContent = `TIME LEFT ${String(mins).padStart(2, '0')}:${secs}`;
    };

    const pop = () => {
      if (!active) return;
      board.querySelectorAll('.wat-mole').forEach(mole => {
        mole.classList.remove('up');
        mole.textContent = '●';
      });

      const hole = board.children[Math.floor(Math.random() * MOLE_COUNT)];
      const mole = hole.querySelector('.wat-mole');
      const icon = ICONS[Math.floor(Math.random() * ICONS.length)];
      mole.textContent = icon;
      mole.classList.add('up');
      hole.setAttribute('aria-label', `Whack ${icon}`);

      clearTimeout(popTimer);
      const visibleFor = Math.max(160, 680 - hits * 18);
      popTimer = setTimeout(() => {
        mole.classList.remove('up');
      }, visibleFor);
    };

    const finish = won => {
      active = false;
      clearInterval(timer);
      clearTimeout(popTimer);
      board.querySelectorAll('.wat-mole').forEach(mole => {
        mole.classList.remove('up');
        mole.textContent = '●';
      });

      if (won) {
        destroyed.add(targetIndex);
        save();
        setMessage('TRACK DEFEATED! Song ends and drops from the playlist.');
        songRows().forEach((row, index) => { row.hidden = destroyed.has(index); });

        try {
          if (typeof player?.seekTo === 'function') {
            const duration = Number(player.getDuration?.() || 0);
            if (Number.isFinite(duration) && duration > 0) {
              player.seekTo(Math.max(0, duration - 0.05), true);
            }
          }
        } catch (_) {
          // Ignore seeking errors and fall back to stopping the player.
        }

        setTimeout(() => {
          if (typeof playNext === 'function') {
            playNext();
          }
        }, 180);

        return;
      }

      setMessage('Time up — try again!');
      songRows().forEach((row, index) => { row.hidden = destroyed.has(index); });
    };

    const start = () => {
      targetIndex = currentSongIndex();
      hits = 0;
      songDuration = getSongDuration();
      seconds = Math.max(1, Math.ceil(songDuration));
      active = true;
      panel.hidden = false;
      panel.querySelector('#wat-target').textContent = `NOW WHACKING: ${titleFor(targetIndex)}`;
      setMessage(`Whack ${WHACKS_TO_WIN} moles before the song ends!`);
      updateHealth();
      clearInterval(timer);
      timer = setInterval(() => {
        if (!active) return;
        seconds -= 1;
        if (seconds <= 0) {
          seconds = 0;
          updateHealth();
          finish(false);
          return;
        }
        updateHealth();
      }, 1000);
      pop();
      clearTimeout(popTimer);
      const loop = () => {
        if (!active) return;
        const delay = Math.max(180, 680 - hits * 18);
        popTimer = setTimeout(() => {
          pop();
          loop();
        }, delay);
      };
      loop();
    };

    board.addEventListener('click', event => {
      const mole = event.target.closest('.wat-mole');
      if (!active || !mole || !mole.classList.contains('up')) return;
      hits += 1;
      mole.classList.remove('up');
      updateHealth();
      if (hits >= WHACKS_TO_WIN) {
        finish(true);
      } else {
        pop();
      }
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
      setMessage('Defeated tracks restored.');
    });

    songRows().forEach((row, index) => { row.hidden = destroyed.has(index); });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();

