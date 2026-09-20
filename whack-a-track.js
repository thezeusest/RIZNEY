/* WHACK-A-TRACK: local mini-game for the Rizney music page. */
(() => {
  'use strict';

  const init = () => {
    if (document.getElementById('wat-launch')) return;

    const controls = document.querySelector('.controls');
    const main = document.querySelector('main');

    if (!controls || !main) return;

    const STORAGE_KEY = 'mewzing.whack-a-track.destroyed';

    const GAME_SECONDS = 60;
    const MOLE_COUNT = 12;
    const HITS_TO_WIN = 18;

    const ICONS = ['★', '♬', '♪', '⚡', '✦', '✹', '☼'];

    const rows = () =>
      [...document.querySelectorAll('#song-list .song')];

    let destroyed = new Set();

    try {
      const saved = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || '[]'
      );

      if (Array.isArray(saved)) {
        destroyed = new Set(saved);
      }
    } catch (_) {
      destroyed = new Set();
    }

    const save = () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([...destroyed])
      );
    };

    /* =========================
       GAME STYLES
       ========================= */

    const style = document.createElement('style');

    style.textContent = `
      #wat-launch {
        margin-left: auto;
        background: #2c1745;
        color: #f5d76e;
        font-weight: bold;
        cursor: pointer;
        touch-action: manipulation;
      }

      #wat-panel {
        position: relative;
        width: min(calc(100% - 24px), 900px);
        margin: 18px auto 0;
        padding: 16px;
        color: #e0aaff;
        background: #120b18;
        border: 2px solid #d4af37;
        border-radius: 12px;
        box-shadow: 0 0 18px #d4af3740;
        overflow: hidden;
        box-sizing: border-box;
      }

      #wat-panel[hidden] {
        display: none;
      }

      .wat-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }

      .wat-head h2 {
        margin: 0;
        padding: 0;
        border: 0;
        font-family: Georgia, serif;
      }

      #wat-close {
        font-size: 24px;
        line-height: 1;
        cursor: pointer;
      }

      #wat-target {
        margin: 12px 0;
        color: #f5d76e;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .wat-stat {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        margin: 7px 0;
      }

      #wat-health {
        color: #f5d76e;
        letter-spacing: 1px;
        word-break: break-all;
      }

      /*
        THE BOARD
        3 columns.
        Every hole is a square BEFORE
        border-radius makes it circular.
      */

      #wat-board {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        margin-top: 14px;
      }

      /*
        TRUE CIRCLES
      */

      .wat-hole {
        position: relative;

        width: 100%;
        aspect-ratio: 1 / 1;

        min-width: 0;
        min-height: 0;

        padding: 0;

        border: 0;
        border-radius: 50%;

        background: #050305;

        box-shadow:
          inset 0 8px 0 #000,
          0 0 0 2px #3b1d50;

        overflow: hidden;

        cursor: pointer;
        touch-action: manipulation;

        -webkit-tap-highlight-color: transparent;
      }

      .wat-hole:focus-visible {
        outline: 3px solid #f5d76e;
      }

      .wat-hole.whacked {
        animation: wat-shake 0.22s linear;
        background: #44205e;
      }

      /*
        MOLE
      */

      .wat-mole {
        position: absolute;

        left: 50%;
        bottom: 2%;

        width: 78%;
        height: 78%;

        display: flex;
        align-items: center;
        justify-content: center;

        transform:
          translate(-50%, 120%)
          scale(0.6);

        opacity: 0;

        color: #f5d76e;

        font-family: "Courier New", monospace;
        font-size: clamp(30px, 9vw, 58px);
        font-weight: 900;
        line-height: 1;

        text-shadow:
          3px 3px 0 #000,
          -2px -2px 0 #000,
          2px -2px 0 #000,
          -2px 2px 0 #000;

        transition:
          transform 0.12s ease-out,
          opacity 0.12s ease-out;

        z-index: 5;

        pointer-events: auto;
      }

      .wat-mole.up {
        transform:
          translate(-50%, 0)
          scale(1);

        opacity: 1;
      }

      /*
        WHACK / POW
      */

      .wat-hit-text {
        position: absolute;

        left: 50%;
        top: 50%;

        transform:
          translate(-50%, -50%)
          rotate(-8deg)
          scale(0.5);

        color: #f5d76e;

        font-family: "Courier New", monospace;
        font-size: clamp(20px, 7vw, 42px);
        font-weight: 900;

        white-space: nowrap;

        text-shadow:
          3px 3px 0 #000;

        pointer-events: none;

        z-index: 20;

        animation:
          wat-whack 0.45s ease-out forwards;
      }

      #wat-message {
        min-height: 1.5em;
        margin: 12px 0 0;

        color: #f5d76e;

        text-align: center;
        font-weight: bold;
      }

      #wat-restore {
        display: block;
        margin: 14px auto 0;
        padding: 6px 9px;
        font-size: 0.72rem;
        background: transparent;
        cursor: pointer;
      }

      /*
        ANIMATIONS
      */

      @keyframes wat-shake {
        0%, 100% {
          transform: translateX(0);
        }

        25% {
          transform: translateX(-7px);
        }

        75% {
          transform: translateX(7px);
        }
      }

      @keyframes wat-whack {
        0% {
          opacity: 1;

          transform:
            translate(-50%, -50%)
            rotate(-8deg)
            scale(0.5);
        }

        40% {
          opacity: 1;

          transform:
            translate(-50%, -50%)
            rotate(-8deg)
            scale(1.25);
        }

        100% {
          opacity: 0;

          transform:
            translate(-50%, -80%)
            rotate(8deg)
            scale(0.8);
        }
      }

      /*
        MOBILE
      */

      @media (max-width: 500px) {

        #wat-launch {
          width: 100%;
          margin-left: 0;
        }

        #wat-panel {
          padding: 12px;
        }

        #wat-board {
          gap: 8px;
        }

        .wat-mole {
          font-size: clamp(28px, 12vw, 48px);
        }
      }
    `;

    document.head.appendChild(style);

    /* =========================
       LAUNCH BUTTON
       ========================= */

    const launch = document.createElement('button');

    launch.id = 'wat-launch';
    launch.type = 'button';
    launch.textContent = '🎵 WHACK-A-TRACK';

    controls.appendChild(launch);

    /* =========================
       GAME PANEL
       ========================= */

    const panel = document.createElement('section');

    panel.id = 'wat-panel';
    panel.hidden = true;

    panel.setAttribute(
      'aria-label',
      'Whack-a-Track game'
    );

    panel.innerHTML = `
      <div class="wat-head">
        <h2>🎵 WHACK-A-TRACK</h2>

        <button
          id="wat-close"
          type="button"
          aria-label="Close game"
        >
          ×
        </button>
      </div>

      <div id="wat-target">
        NOW WHACKING: —
      </div>

      <div class="wat-stat">
        <span id="wat-health"></span>
        <span id="wat-time"></span>
      </div>

      <div id="wat-board"></div>

      <p id="wat-message"></p>

      <button
        id="wat-restore"
        type="button"
      >
        Restore defeated tracks
      </button>
    `;

    main.prepend(panel);

    const board =
      panel.querySelector('#wat-board');

    /* =========================
       CREATE HOLES
       ========================= */

    for (let i = 0; i < MOLE_COUNT; i += 1) {

      const hole =
        document.createElement('button');

      hole.className = 'wat-hole';
      hole.type = 'button';

      hole.setAttribute(
        'aria-label',
        `Whack hole ${i + 1}`
      );

      /*
        The mole starts hidden below the hole.
        When .up is added it slides into view.
      */

      hole.innerHTML = `
        <span
          class="wat-mole"
          aria-hidden="true"
        >
          ●
        </span>
      `;

      board.appendChild(hole);
    }

    /* =========================
       GAME VARIABLES
       ========================= */

    let active = false;
    let hits = 0;
    let seconds = GAME_SECONDS;

    let timer = null;
    let popTimer = null;

    /* =========================
       MESSAGE
       ========================= */

    const message = text => {
      panel.querySelector(
        '#wat-message'
      ).textContent = text;
    };

    /* =========================
       UPDATE SCORE / TIME
       ========================= */

    const update = () => {

      const left =
        Math.max(
          0,
          HITS_TO_WIN - hits
        );

      panel.querySelector(
        '#wat-health'
      ).textContent =
        `${'█'.repeat(left)}${'░'.repeat(
          HITS_TO_WIN - left
        )}`;

      panel.querySelector(
        '#wat-time'
      ).textContent =
        `TIME LEFT ${String(
          Math.floor(seconds / 60)
        ).padStart(2, '0')}:${String(
          seconds % 60
        ).padStart(2, '0')}`;
    };

    /* =========================
       POP A TARGET
       ========================= */

    const pop = () => {

      if (!active) return;

      /*
        Hide all currently visible targets.
      */

      board
        .querySelectorAll('.wat-mole')
        .forEach(mole => {
          mole.classList.remove('up');
        });

      /*
        Pick a random hole.
      */

      const hole =
        board.children[
          Math.floor(
            Math.random() * MOLE_COUNT
          )
        ];

      const mole =
        hole.querySelector('.wat-mole');

      /*
        Give it a random music/game symbol.
      */

      mole.textContent =
        ICONS[
          Math.floor(
            Math.random() * ICONS.length
          )
        ];

      /*
        SHOW IT!
      */

      mole.classList.add('up');

      clearTimeout(popTimer);

      /*
        If you don't hit it,
        it disappears after 900ms.
      */

      popTimer =
        setTimeout(() => {

          mole.classList.remove('up');

        }, 900);
    };

    /* =========================
       FINISH GAME
       ========================= */

    const finish = won => {

      active = false;

      clearInterval(timer);
      clearTimeout(popTimer);

      board
        .querySelectorAll('.wat-mole')
        .forEach(mole => {
          mole.classList.remove('up');
        });

      if (!won) {

        message(
          'TIME UP — THE TRACK ESCAPED! 😸'
        );

        return;
      }

      const now =
        document.querySelector(
          '#now-playing'
        )?.textContent || '';

      const match =
        now.match(/Song\s+(\d+)/i);

      const index =
        match
          ? Math.max(
              0,
              Number(match[1]) - 1
            )
          : 0;

      destroyed.add(index);

      save();

      const row =
        rows()[index];

      if (row) {
        row.hidden = true;
      }

      message(
        '💥 TRACK ERASED! 💥'
      );
    };

    /* =========================
       START GAME
       ========================= */

    const start = () => {

      clearInterval(timer);
      clearTimeout(popTimer);

      hits = 0;
      seconds = GAME_SECONDS;

      active = true;

      panel.hidden = false;

      const nowPlaying =
        document.querySelector(
          '#now-playing'
        )?.textContent ||
        'current song';

      panel.querySelector(
        '#wat-target'
      ).textContent =
        `NOW WHACKING: ${nowPlaying}`;

      message(
        `WHACK ${HITS_TO_WIN} TARGETS BEFORE TIME RUNS OUT!`
      );

      update();

      /*
        First mole appears immediately.
      */

      pop();

      /*
        Countdown.
      */

      timer =
        setInterval(() => {

          seconds -= 1;

          update();

          if (seconds <= 0) {
            finish(false);
          }

        }, 1000);
    };

    /* =========================
       HIT DETECTION
       ========================= */

    board.addEventListener(
      'click',
      event => {

        const mole =
          event.target.closest(
            '.wat-mole'
          );

        /*
          Ignore clicks that aren't
          actually on a visible mole.
        */

        if (
          !active ||
          !mole ||
          !mole.classList.contains('up')
        ) {
          return;
        }

        hits += 1;

        /*
          Hide mole immediately.
        */

        mole.classList.remove('up');

        /*
          WHACK / POW!!
        */

        const hitText =
          document.createElement('span');

        hitText.className =
          'wat-hit-text';

        hitText.textContent =
          Math.random() < 0.5
            ? 'WHACK!!'
            : 'POW!!';

        mole.parentElement.appendChild(
          hitText
        );

        setTimeout(() => {
          hitText.remove();
        }, 500);

        /*
          Shake the hole.
        */

        mole.parentElement.classList.add(
          'whacked'
        );

        setTimeout(() => {

          mole.parentElement.classList.remove(
            'whacked'
          );

        }, 250);

        update();

        /*
          WIN!
        */

        if (hits >= HITS_TO_WIN) {

          finish(true);

        } else {

          /*
            Immediately send another
            target onto the board.
          */

          pop();
        }
      }
    );

    /* =========================
       OPEN GAME
       ========================= */

    launch.addEventListener(
      'click',
      start
    );

    /* =========================
       CLOSE GAME
       ========================= */

    panel
      .querySelector('#wat-close')
      .addEventListener(
        'click',
        () => {

          active = false;

          clearInterval(timer);
          clearTimeout(popTimer);

          panel.hidden = true;
        }
      );

    /* =========================
       RESTORE TRACKS
       ========================= */

    panel
      .querySelector('#wat-restore')
      .addEventListener(
        'click',
        () => {

          destroyed.clear();

          save();

          rows().forEach(row => {
            row.hidden = false;
          });

          message(
            'DEFEATED TRACKS RESTORED.'
          );
        }
      );

    /* =========================
       HIDE PREVIOUSLY DEFEATED
       ========================= */

    rows().forEach(
      (row, index) => {
        row.hidden =
          destroyed.has(index);
      }
    );
  };

  /* =========================
     INITIALIZE
     ========================= */

  if (
    document.readyState === 'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      init,
      { once: true }
    );

  } else {

    init();
  }

})();
