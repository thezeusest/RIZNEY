/* =========================================================
   WHACK-A-TRACK
   Rizney / Mewzing mini-game
   ========================================================= */

(() => {
  'use strict';

  function initWhackATrack() {

    /* Don't create the game twice */
    if (document.getElementById('wat-launch')) return;

    const controls = document.querySelector('.controls');
    const main = document.querySelector('main');

    if (!controls || !main) {
      console.log('WHACK-A-TRACK: controls or main not found.');
      return;
    }

    const GAME_SECONDS = 60;
    const HOLE_COUNT = 12;
    const HITS_TO_WIN = 18;

    let playing = false;
    let hits = 0;
    let timeLeft = GAME_SECONDS;
    let timer = null;
    let moleTimer = null;

    /* =====================================================
       CSS
       ===================================================== */

    const style = document.createElement('style');

    style.textContent = `

      /* LAUNCH BUTTON */

      #wat-launch {
        margin-left: auto;
        background: #2c1745;
        color: #f5d76e;
        font-weight: bold;
        cursor: pointer;
        touch-action: manipulation;
      }


      /* GAME PANEL */

      #wat-panel {
        width: min(900px, calc(100% - 24px));
        margin: 18px auto;
        padding: 16px;
        box-sizing: border-box;

        background: #120b18;
        color: #e0aaff;

        border: 2px solid #d4af37;
        border-radius: 12px;

        box-shadow: 0 0 18px #d4af3740;

        overflow: hidden;
      }

      #wat-panel[hidden] {
        display: none;
      }


      /* HEADER */

      .wat-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .wat-head h2 {
        margin: 0;
        padding: 0;
        border: 0;
        font-family: Georgia, serif;
      }

      #wat-close {
        font-size: 26px;
        background: transparent;
        color: #f5d76e;
        border: 0;
        cursor: pointer;
      }


      /* TARGET SONG */

      #wat-target {
        margin: 12px 0;
        color: #f5d76e;
        font-weight: bold;

        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }


      /* SCORE / CLOCK */

      .wat-stat {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        margin: 8px 0;
      }

      #wat-score {
        color: #f5d76e;
        font-weight: bold;
      }

      #wat-time {
        color: #f5d76e;
        font-weight: bold;
      }


      /* ===================================================
         THE 12 HOLES
         =================================================== */

      #wat-board {
        display: grid;

        grid-template-columns: repeat(3, 1fr);

        gap: 10px;

        margin-top: 16px;
      }


      /*
         IMPORTANT:
         Each hole is square first,
         THEN becomes a circle.
      */

      .wat-hole {

        position: relative;

        width: 100%;
        aspect-ratio: 1 / 1;

        padding: 0;
        margin: 0;

        box-sizing: border-box;

        border: 3px solid #3b1d50;
        border-radius: 50%;

        background: #050305;

        cursor: pointer;

        overflow: hidden;

        touch-action: manipulation;

        -webkit-tap-highlight-color: transparent;

        transition:
          background 0.08s ease,
          border-color 0.08s ease;
      }


      /* ACTIVE HOLE */

      .wat-hole.has-mole {

        background: #26102f;

        border-color: #d4af37;

        box-shadow:
          inset 0 0 0 5px #0b050d,
          0 0 12px #d4af3766;
      }


      /* ===================================================
         THE MOLE
         =================================================== */

      .wat-mole {

        position: absolute;

        left: 50%;
        top: 50%;

        width: 70%;
        height: 70%;

        transform: translate(-50%, -50%);

        display: none;

        align-items: center;
        justify-content: center;

        z-index: 10;

        pointer-events: none;
      }


      /*
         THIS is deliberately simple.

         It does NOT depend on an emoji.
         It does NOT slide from underneath.
         It simply appears.
      */

      .wat-mole.visible {
        display: flex;
      }


      /* MOLE BODY */

      .wat-mole-body {

        position: relative;

        width: 62%;
        height: 68%;

        background: #8b5a3c;

        border: 4px solid #000;

        border-radius: 50% 50% 42% 42%;

        box-sizing: border-box;

        image-rendering: pixelated;
      }


      /* EARS */

      .wat-ear {

        position: absolute;

        top: -20%;

        width: 35%;
        height: 35%;

        background: #8b5a3c;

        border: 4px solid #000;

        border-radius: 50%;
      }

      .wat-ear.left {
        left: -18%;
      }

      .wat-ear.right {
        right: -18%;
      }


      /* EYES */

      .wat-eye {

        position: absolute;

        top: 28%;

        width: 13%;
        height: 13%;

        background: #fff;

        border: 2px solid #000;

        border-radius: 50%;
      }

      .wat-eye.left {
        left: 25%;
      }

      .wat-eye.right {
        right: 25%;
      }


      /* PUPILS */

      .wat-eye::after {

        content: '';

        position: absolute;

        left: 50%;
        top: 50%;

        width: 45%;
        height: 45%;

        transform: translate(-50%, -50%);

        background: #000;

        border-radius: 50%;
      }


      /* NOSE */

      .wat-nose {

        position: absolute;

        left: 50%;
        bottom: 24%;

        width: 22%;
        height: 16%;

        transform: translateX(-50%);

        background: #d98b8b;

        border: 3px solid #000;

        border-radius: 50%;
      }


      /* ===================================================
         HIT TEXT
         =================================================== */

      .wat-hit {

        position: absolute;

        left: 50%;
        top: 50%;

        transform: translate(-50%, -50%);

        z-index: 50;

        color: #f5d76e;

        font-family: "Courier New", monospace;

        font-size: clamp(22px, 7vw, 42px);

        font-weight: 900;

        white-space: nowrap;

        text-shadow:
          3px 3px 0 #000;

        pointer-events: none;

        animation: wat-hit-animation 0.45s ease-out forwards;
      }


      @keyframes wat-hit-animation {

        0% {
          opacity: 1;
          transform:
            translate(-50%, -50%)
            scale(0.5)
            rotate(-8deg);
        }

        35% {
          opacity: 1;
          transform:
            translate(-50%, -50%)
            scale(1.25)
            rotate(-8deg);
        }

        100% {
          opacity: 0;
          transform:
            translate(-50%, -80%)
            scale(0.8)
            rotate(8deg);
        }
      }


      /* MESSAGE */

      #wat-message {

        min-height: 1.5em;

        margin: 12px 0 0;

        text-align: center;

        color: #f5d76e;

        font-weight: bold;
      }


      /* RESTORE */

      #wat-restore {

        display: block;

        margin: 14px auto 0;

        padding: 6px 10px;

        background: transparent;

        color: #e0aaff;

        cursor: pointer;
      }


      /* MOBILE */

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

      }

    `;

    document.head.appendChild(style);


    /* =====================================================
       LAUNCH BUTTON
       ===================================================== */

    const launch = document.createElement('button');

    launch.id = 'wat-launch';
    launch.type = 'button';
    launch.textContent = '🎵 WHACK-A-TRACK';

    controls.appendChild(launch);


    /* =====================================================
       GAME PANEL
       ===================================================== */

    const panel = document.createElement('section');

    panel.id = 'wat-panel';
    panel.hidden = true;

    panel.innerHTML = `

      <div class="wat-head">

        <h2>🎵 WHACK-A-TRACK</h2>

        <button
          id="wat-close"
          type="button"
        >
          ×
        </button>

      </div>

      <div id="wat-target">
        NOW WHACKING: —
      </div>

      <div class="wat-stat">

        <span id="wat-score">
          HITS: 0 / ${HITS_TO_WIN}
        </span>

        <span id="wat-time">
          TIME: 60
        </span>

      </div>

      <div id="wat-board"></div>

      <p id="wat-message">
        Ready?
      </p>

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


    /* =====================================================
       CREATE 12 HOLES
       ===================================================== */

    for (let i = 0; i < HOLE_COUNT; i++) {

      const hole =
        document.createElement('button');

      hole.type = 'button';

      hole.className = 'wat-hole';

      hole.dataset.index = i;

      hole.setAttribute(
        'aria-label',
        `Whack hole ${i + 1}`
      );


      /*
         CSS MOLE

         No emoji.
         No external image.
      */

      hole.innerHTML = `

        <span class="wat-mole">

          <span class="wat-mole-body">

            <span class="wat-ear left"></span>
            <span class="wat-ear right"></span>

            <span class="wat-eye left"></span>
            <span class="wat-eye right"></span>

            <span class="wat-nose"></span>

          </span>

        </span>

      `;

      board.appendChild(hole);
    }


    /* =====================================================
       GAME FUNCTIONS
       ===================================================== */

    function updateDisplay() {

      panel.querySelector('#wat-score').textContent =
        `HITS: ${hits} / ${HITS_TO_WIN}`;

      panel.querySelector('#wat-time').textContent =
        `TIME: ${timeLeft}`;
    }


    function hideAllMoles() {

      board
        .querySelectorAll('.wat-hole')
        .forEach(hole => {

          hole.classList.remove('has-mole');

          const mole =
            hole.querySelector('.wat-mole');

          mole.classList.remove('visible');
        });
    }


    function showMole() {

      if (!playing) return;

      hideAllMoles();


      /*
         Pick random hole.
      */

      const index =
        Math.floor(
          Math.random() * HOLE_COUNT
        );


      const hole =
        board.children[index];


      const mole =
        hole.querySelector('.wat-mole');


      /*
         SHOW IT.

         No transform.
         No weird animation.
         Just visible.
      */

      hole.classList.add('has-mole');

      mole.classList.add('visible');


      clearTimeout(moleTimer);


      /*
         Give the player 1 second.
      */

      moleTimer =
        setTimeout(() => {

          if (!playing) return;

          hole.classList.remove('has-mole');

          mole.classList.remove('visible');

          showMole();

        }, 1000);
    }


    function hitMole(hole) {

      if (!playing) return;

      if (!hole.classList.contains('has-mole')) {
        return;
      }


      const mole =
        hole.querySelector('.wat-mole');


      if (!mole.classList.contains('visible')) {
        return;
      }


      /* COUNT HIT */

      hits += 1;


      /* REMOVE MOLE */

      hole.classList.remove('has-mole');

      mole.classList.remove('visible');


      clearTimeout(moleTimer);


      /* =================================================
         POW / WHACK
         ================================================= */

      const hit =
        document.createElement('span');

      hit.className = 'wat-hit';

      hit.textContent =
        Math.random() < 0.5
          ? 'WHACK!!'
          : 'POW!!';


      hole.appendChild(hit);


      setTimeout(() => {
        hit.remove();
      }, 500);


      updateDisplay();


      /* WIN */

      if (hits >= HITS_TO_WIN) {

        finishGame(true);

        return;
      }


      /* NEXT MOLE */

      showMole();
    }


    function finishGame(won) {

      playing = false;

      clearInterval(timer);
      clearTimeout(moleTimer);

      hideAllMoles();


      if (won) {

        panel.querySelector(
          '#wat-message'
        ).textContent =
          '💥 TRACK ERASED! 💥';

      } else {

        panel.querySelector(
          '#wat-message'
        ).textContent =
          'TIME UP — THE TRACK ESCAPED! 😸';
      }
    }


    function startGame() {

      clearInterval(timer);
      clearTimeout(moleTimer);

      hits = 0;
      timeLeft = GAME_SECONDS;

      playing = true;

      panel.hidden = false;


      const nowPlaying =
        document.querySelector(
          '#now-playing'
        )?.textContent ||
        'CURRENT SONG';


      panel.querySelector(
        '#wat-target'
      ).textContent =
        `NOW WHACKING: ${nowPlaying}`;


      panel.querySelector(
        '#wat-message'
      ).textContent =
        'WHACK THE MOLES!';


      updateDisplay();

      hideAllMoles();


      /* FIRST MOLE */

      showMole();


      /* CLOCK */

      timer =
        setInterval(() => {

          timeLeft -= 1;

          updateDisplay();

          if (timeLeft <= 0) {

            finishGame(false);
          }

        }, 1000);
    }


    /* =====================================================
       IMPORTANT:
       CLICK THE ENTIRE HOLE
       ===================================================== */

    board.addEventListener(
      'click',
      event => {

        const hole =
          event.target.closest('.wat-hole');

        if (!hole) return;

        hitMole(hole);
      }
    );


    /* =====================================================
       BUTTON EVENTS
       ===================================================== */

    launch.addEventListener(
      'click',
      startGame
    );


    panel
      .querySelector('#wat-close')
      .addEventListener(
        'click',
        () => {

          playing = false;

          clearInterval(timer);
          clearTimeout(moleTimer);

          hideAllMoles();

          panel.hidden = true;
        }
      );


    panel
      .querySelector('#wat-restore')
      .addEventListener(
        'click',
        () => {

          panel.querySelector(
            '#wat-message'
          ).textContent =
            'Tracks restored.';
        }
      );


    console.log(
      'WHACK-A-TRACK initialized successfully!'
    );
  }


  /* =======================================================
     START
     ======================================================= */

  if (
    document.readyState === 'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      initWhackATrack,
      { once: true }
    );

  } else {

    initWhackATrack();
  }

})();
