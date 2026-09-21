
/* =========================================================
   TORTOISE FROGGER
   One tap = one row.
   NO TORTOISE ANIMATION.
   ========================================================= */

.tf-controls {
  position: relative;
  z-index: 9999;
  margin: 12px auto 8px;
  padding: 8px;
  display: flex;
  justify-content: center;
  gap: 6px;
  flex-wrap: wrap;
  background: #120b18;
  border: 1px solid #5c3975;
  border-radius: 12px;
  max-width: 700px;
}

.tf-controls button {
  border: 1px solid #8f62ad;
  background: #1d1028;
  color: #f0b94b;
  border-radius: 8px;
  padding: 9px 11px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  touch-action: manipulation;
}

.tf-controls button:active {
  transform: scale(.97);
}

.tf-stage {
  position: relative;
}

.tf-tortoise {
  position: absolute;
  z-index: 9000;

  /* IMPORTANT:
     There is NO transition here.
     The tortoise instantly changes rows.
  */
  transition: none !important;

  pointer-events: none;
  user-select: none;
  font-size: 30px;
  line-height: 1;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tf-obstacle {
  position: absolute;
  z-index: 8000;
  pointer-events: none;
  user-select: none;
  font-size: 25px;
  line-height: 1;
}

.tf-row-active {
  position: relative;
}

.tf-game-message {
  text-align: center;
  color: #f0b94b;
  font-size: 12px;
  min-height: 16px;
  margin: 4px 0;
  pointer-events: none;
}
</style>

<script>
/* =========================================================
   TORTOISE FROGGER
   ========================================================= */

(() => {
  'use strict';

  if (window.__TORTOISE_FROGGER__) return;
  window.__TORTOISE_FROGGER__ = true;

  let gameStarted = false;
  let gameOver = false;

  let position = 0;
  let moveLocked = false;

  let timer = null;
  let timeLeft = 180;

  let tortoise = null;
  let stage = null;

  let traffic = [];

  /*
    This is ONLY an input lock.
    It is NOT an animation.
    The tortoise moves immediately.
  */
  const MOVE_LOCK = 180;

  /* ---------------------------------------------------------
     Find the song rows already on the page
     --------------------------------------------------------- */

  function getSongRows() {
    const possible = [
      '.song-row',
      '.song',
      '.song-item',
      '.track-row',
      '.track',
      '.track-item'
    ];

    for (const selector of possible) {
      const found = Array.from(document.querySelectorAll(selector))
        .filter(el => !el.closest('.tf-controls'));

      if (found.length > 1) {
        return found;
      }
    }

    return [];
  }

  /* ---------------------------------------------------------
     Build game area
     --------------------------------------------------------- */

  function setupGame() {
    if (document.getElementById('tf-controls')) return;

    const rows = getSongRows();
    if (!rows.length) return;

    stage = rows[0].parentElement;

    if (!stage) return;

    /*
      Make the song list the Frogger stage.
    */
    stage.classList.add('tf-stage');

    /*
      Controls are placed ABOVE the bottom song row.
      This is intentional so they remain reachable after
      a collision sends the tortoise back down.
    */
    const controls = document.createElement('div');
    controls.id = 'tf-controls';
    controls.className = 'tf-controls';

    controls.innerHTML = `
      <button type="button" id="tf-start">🐢 FROGGER</button>
      <button type="button" id="tf-restart">🔄 RESTART SONG</button>
      <button type="button" id="tf-end">✕ END GAME</button>
    `;

    /*
      Insert controls immediately BEFORE the song list.
      This keeps them above the bottom row.
    */
    stage.parentNode.insertBefore(controls, stage);

    const message = document.createElement('div');
    message.id = 'tf-message';
    message.className = 'tf-game-message';
    controls.parentNode.insertBefore(message, controls.nextSibling);

    /*
      Tortoise.
    */
    tortoise = document.createElement('div');
    tortoise.className = 'tf-tortoise';
    tortoise.textContent = '🐢';

    stage.appendChild(tortoise);

    /*
      Start at bottom.
    */
    position = rows.length - 1;

    placeTortoise();

    /*
      IMPORTANT:
      We DO NOT create obstacles here.
      There are zero obstacles until FROGGER or RESTART SONG
      is pressed.
    */

    document.getElementById('tf-start')
      .addEventListener('click', startGame);

    document.getElementById('tf-restart')
      .addEventListener('click', restartSong);

    document.getElementById('tf-end')
      .addEventListener('click', endGame);

    /*
      Tapping the page moves exactly ONE row.
    */
    document.addEventListener('pointerdown', handlePageTap, {
      passive: true
    });
  }

  /* ---------------------------------------------------------
     Position tortoise
     --------------------------------------------------------- */

  function placeTortoise() {
    const rows = getSongRows();

    if (!tortoise || !rows.length) return;

    if (position < 0) position = 0;
    if (position >= rows.length) {
      position = rows.length - 1;
    }

    const row = rows[position];

    if (!row) return;

    const stageRect = stage.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();

    const x =
      stageRect.width / 2 -
      19;

    const y =
      rowRect.top -
      stageRect.top +
      rowRect.height / 2 -
      19;

    /*
      DIRECT assignment.

      No transform animation.
      No transition.
      No timeout.
      No second positioning call.
    */
    tortoise.style.left = `${x}px`;
    tortoise.style.top = `${y}px`;
  }

  /* ---------------------------------------------------------
     Camera
     --------------------------------------------------------- */

  function moveCameraToCurrentStreet() {
    const rows = getSongRows();

    if (!rows.length) return;

    const row = rows[position];

    if (!row) return;

    /*
      The CAMERA moves.
      The TORTOISE does not.

      This prevents the tortoise itself from appearing
      to hop between rows.
    */
    const rect = row.getBoundingClientRect();

    const target =
      window.scrollY +
      rect.top -
      window.innerHeight * 0.72;

    window.scrollTo({
      top: Math.max(0, target),
      behavior: 'smooth'
    });
  }

  /* ---------------------------------------------------------
     Page tap
     --------------------------------------------------------- */

  function handlePageTap(event) {
    if (!gameStarted || gameOver) return;

    const target = event.target;

    /*
      Never count controls, links, buttons, inputs, players,
      or other interactive elements as a Frogger move.
    */
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('select') ||
      target.closest('video') ||
      target.closest('audio') ||
      target.closest('iframe') ||
      target.closest('.tf-controls')
    ) {
      return;
    }

    moveUp();
  }

  /* ---------------------------------------------------------
     MOVE UP
     --------------------------------------------------------- */

  function moveUp() {
    if (!gameStarted || gameOver) return;
    if (moveLocked) return;

    const rows = getSongRows();

    if (!rows.length) return;

    /*
      TOP REACHED
    */
    if (position <= 0) {
      winGame();
      return;
    }

    moveLocked = true;

    /*
      EXACTLY ONE ROW.

      No +2.
      No delayed correction.
      No second placeTortoise().
    */
    position -= 1;

    placeTortoise();

    /*
      Only the PAGE CAMERA moves.
    */
    moveCameraToCurrentStreet();

    setTimeout(() => {
      moveLocked = false;
    }, MOVE_LOCK);
  }

  /* ---------------------------------------------------------
     TRAFFIC
     --------------------------------------------------------- */

  function removeAllObstacles() {
    document
      .querySelectorAll('.tf-obstacle')
      .forEach(el => el.remove());

    traffic = [];
  }

  function createTraffic() {
    removeAllObstacles();

    const rows = getSongRows();

    if (!rows.length) return;

    /*
      Bottom row stays completely safe.
    */
    for (let i = 0; i < rows.length - 1; i++) {

      /*
        Not every row needs traffic.
        This keeps the game readable.
      */
      if (Math.random() < 0.25) continue;

      const row = rows[i];

      const obstacle = document.createElement('div');
      obstacle.className = 'tf-obstacle';

      const objects = [
        '🚗',
        '🚙',
        '🚕',
        '🚌',
        '🎵',
        '🎸',
        '💿'
      ];

      obstacle.textContent =
        objects[Math.floor(Math.random() * objects.length)];

      const rowRect = row.getBoundingClientRect();
      const stageRect = stage.getBoundingClientRect();

      const direction =
        Math.random() < 0.5 ? 1 : -1;

      const speed =
        0.35 + Math.random() * 0.55;

      const startX =
        direction === 1
          ? -50
          : stageRect.width + 50;

      obstacle.style.left = `${startX}px`;

      obstacle.style.top =
        `${rowRect.top - stageRect.top +
        rowRect.height / 2 - 15}px`;

      stage.appendChild(obstacle);

      traffic.push({
        el: obstacle,
        rowIndex: i,
        x: startX,
        direction,
        speed
      });

      /*
        Sometimes add a second object.
      */
      if (Math.random() < 0.35) {
        const second = obstacle.cloneNode(true);

        second.style.left =
          `${direction === 1
            ? -250
            : stageRect.width + 250}px`;

        stage.appendChild(second);

        traffic.push({
          el: second,
          rowIndex: i,
          x: direction === 1
            ? -250
            : stageRect.width + 250,
          direction,
          speed: speed * (0.8 + Math.random() * 0.4)
        });
      }
    }
  }

  /* ---------------------------------------------------------
     TRAFFIC ANIMATION
     --------------------------------------------------------- */

  function animateTraffic() {
    if (!gameStarted || gameOver) {
      requestAnimationFrame(animateTraffic);
      return;
    }

    const stageWidth = stage.getBoundingClientRect().width;

    for (const item of traffic) {

      item.x += item.speed * item.direction;

      if (item.direction === 1 && item.x > stageWidth + 60) {
        item.x = -60;
      }

      if (item.direction === -1 && item.x < -60) {
        item.x = stageWidth + 60;
      }

      item.el.style.left = `${item.x}px`;

      /*
        Collision check.
      */
      if (item.rowIndex === position) {
        checkCollision(item);
      }
    }

    requestAnimationFrame(animateTraffic);
  }

  /* ---------------------------------------------------------
     COLLISION
     --------------------------------------------------------- */

  function checkCollision(item) {
    if (!tortoise) return;

    const a = tortoise.getBoundingClientRect();
    const b = item.el.getBoundingClientRect();

    const padding = 7;

    const hit =
      a.left + padding < b.right &&
      a.right - padding > b.left &&
      a.top + padding < b.bottom &&
      a.bottom - padding > b.top;

    if (hit) {
      handleHit();
    }
  }

  /* ---------------------------------------------------------
     HIT
     --------------------------------------------------------- */

  function handleHit() {
    if (!gameStarted || gameOver) return;
    if (moveLocked) return;

    moveLocked = true;

    /*
      No animation.
      No hop.

      Directly send tortoise to bottom.
    */
    sendToBottom();

    setTimeout(() => {
      moveLocked = false;
    }, 250);
  }

  function sendToBottom() {
    const rows = getSongRows();

    if (!rows.length) return;

    position = rows.length - 1;

    /*
      Immediately place tortoise on bottom row.
    */
    placeTortoise();

    /*
      Then move the CAMERA to the bottom.
    */
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth'
    });
  }

  /* ---------------------------------------------------------
     SONG / TIMER
     --------------------------------------------------------- */

  function getSongDuration() {
    const media =
      document.querySelector('audio') ||
      document.querySelector('video');

    if (
      media &&
      Number.isFinite(media.duration) &&
      media.duration > 0
    ) {
      return Math.floor(media.duration);
    }

    /*
      Fallback if the song is playing through YouTube iframe.
    */
    return 180;
  }

  function startTimer() {
    clearInterval(timer);

    timeLeft = getSongDuration();

    timer = setInterval(() => {

      if (!gameStarted || gameOver) return;

      timeLeft--;

      if (timeLeft <= 0) {
        timeLeft = 0;
        loseGame();
      }

    }, 1000);
  }

  /* ---------------------------------------------------------
     YOUTUBE CONTROL
     --------------------------------------------------------- */

  function restartYouTube() {
    const iframe =
      document.querySelector('iframe');

    if (!iframe) return;

    try {
      iframe.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func: 'seekTo',
          args: [0, true]
        }),
        '*'
      );

      iframe.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func: 'playVideo'
        }),
        '*'
      );
    } catch (err) {
      /* Ignore YouTube control errors. */
    }
  }

  /* ---------------------------------------------------------
     START GAME
     --------------------------------------------------------- */

  function startGame() {
    const rows = getSongRows();

    if (!rows.length) return;

    gameStarted = true;
    gameOver = false;

    position = rows.length - 1;
    moveLocked = false;

    /*
      Make sure there are NO old obstacles.
    */
    removeAllObstacles();

    /*
      Put tortoise directly on bottom.
    */
    placeTortoise();

    /*
      Scroll to bottom so controls + starting row
      are immediately visible.
    */
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth'
    });

    /*
      NOW — and only now — create traffic.
    */
    createTraffic();

    restartYouTube();
    startTimer();

    showMessage('');
  }

  /* ---------------------------------------------------------
     RESTART SONG
     --------------------------------------------------------- */

  function restartSong() {
    const rows = getSongRows();

    if (!rows.length) return;

    gameStarted = true;
    gameOver = false;

    position = rows.length - 1;
    moveLocked = false;

    removeAllObstacles();

    placeTortoise();

    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth'
    });

    createTraffic();

    restartYouTube();
    startTimer();

    showMessage('');
  }

  /* ---------------------------------------------------------
     END GAME
     --------------------------------------------------------- */

  function endGame() {
    gameStarted = false;
    gameOver = true;

    clearInterval(timer);
    timer = null;

    /*
      Completely remove traffic.
    */
    removeAllObstacles();

    /*
      Return tortoise to bottom.
    */
    const rows = getSongRows();

    if (rows.length) {
      position = rows.length - 1;
      placeTortoise();
    }

    /*
      Bring bottom controls / bottom row back into view.
    */
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth'
    });

    showMessage('');
  }

  /* ---------------------------------------------------------
     WIN
     --------------------------------------------------------- */

  function winGame() {
    gameOver = true;
    gameStarted = false;

    clearInterval(timer);
    timer = null;

    showMessage('🐢 MADE IT!');

    /*
      Freeze traffic where it is.
    */
  }

  /* ---------------------------------------------------------
     LOSE
     --------------------------------------------------------- */

  function loseGame() {
    gameOver = true;
    gameStarted = false;

    clearInterval(timer);
    timer = null;

    showMessage('⏰ TIME!');

    /*
      Traffic stays visible and frozen.
    */
  }

  /* ---------------------------------------------------------
     MESSAGE
     --------------------------------------------------------- */

  function showMessage(text) {
    const message =
      document.getElementById('tf-message');

    if (message) {
      message.textContent = text;
    }
  }

  /* ---------------------------------------------------------
     RESIZE
     --------------------------------------------------------- */

  window.addEventListener('resize', () => {
    /*
      Recalculate the tortoise position without
      changing its row.
    */
    placeTortoise();
  });

  /* ---------------------------------------------------------
     STARTUP
     --------------------------------------------------------- */

  function init() {
    setupGame();

    /*
      Traffic is intentionally NOT created here.
    */
    requestAnimationFrame(animateTraffic);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
</script>
