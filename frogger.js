/*
TORTOISE FROGGER 🐢
Rizney / Mewzing Music Page

NO-HOP VERSION

- 🐢 Tortoise only
- NO skateboard
- NO hop animation
- NO jump
- NO bounce
- NO sliding animation
- Tortoise simply moves to the next street
- Slightly slower gameplay than classic Frogger
- NO obstacles exist before game starts
- Obstacles are created when game starts
- End Game removes all obstacles
- Getting hit sends tortoise to bottom
- Getting hit scrolls page back to bottom
  */

(() => {
'use strict';

if (document.getElementById('tortoise-frogger')) return;

function init() {

if (document.getElementById('tortoise-frogger')) return;

/* -----------------------------------------
   FIND SONG ROWS
----------------------------------------- */

let rows = Array.from(
  document.querySelectorAll('#song-list .song')
);

if (!rows.length) {
  rows = Array.from(
    document.querySelectorAll('.song')
  );
}

if (rows.length < 2) {
  console.warn(
    'Tortoise Frogger: Not enough song rows found.'
  );
  return;
}

/* -----------------------------------------
   GAME STATE
----------------------------------------- */

let active = false;
let gameOver = false;

let position =
  rows.length - 1;

let moving = false;

let timer = null;

let timeLeft = 0;

let songStartedAt = 0;

/*
  This is NOT an animation duration.

  It is simply a tiny input lock so the
  player cannot accidentally move several
  streets with one touch/click.
*/

const MOVE_LOCK = 180;

const DEFAULT_SONG_TIME = 180;

/* -----------------------------------------
   FOOTER
----------------------------------------- */

const footer =
  document.createElement('div');

footer.id =
  'tortoise-frogger';

footer.innerHTML = `
  <div id="tf-status">
    🐢 READY — PRESS FROGGER
  </div>

  <div id="tf-timer">
    0:00
  </div>

  <div id="tf-controls">

    <button id="tf-start">
      🐢 FROGGER
    </button>

    <button id="tf-restart">
      🔄 RESTART SONG
    </button>

    <button id="tf-end">
      ✕ END GAME
    </button>

  </div>
`;

document.body.appendChild(
  footer
);

/* -----------------------------------------
   CSS
----------------------------------------- */

const style =
  document.createElement('style');

style.textContent = `

  #tortoise-frogger {
    position: relative;
    z-index: 99999;

    width: 100%;
    box-sizing: border-box;

    padding:
      12px
      10px
      18px;

    margin-top: 20px;

    background:
      linear-gradient(
        to bottom,
        #120b18,
        #080509
      );

    border-top:
      2px solid #d69a2d;

    box-shadow:
      0 -4px 18px
      rgba(0,0,0,.45);

    text-align: center;

    font-family:
      Arial,
      sans-serif;
  }

  #tf-status {
    color: #d69a2d;

    font-size: 13px;

    font-weight: bold;

    letter-spacing: 1px;

    margin-bottom: 5px;
  }

  #tf-timer {
    color: #fff;

    font-size: 24px;

    font-weight: bold;

    margin-bottom: 9px;

    font-variant-numeric:
      tabular-nums;
  }

  #tf-controls {
    display: flex;

    justify-content:
      center;

    align-items:
      center;

    gap: 7px;

    flex-wrap:
      wrap;
  }

  #tf-controls button {

    border:
      1px solid #d69a2d;

    background:
      #1d1028;

    color:
      #f0c56a;

    border-radius:
      7px;

    padding:
      9px 11px;

    font-size:
      12px;

    font-weight:
      bold;

    cursor:
      pointer;

    touch-action:
      manipulation;
  }

  #tf-controls button:active {
    transform:
      scale(.96);
  }

  /*
    THE TORTOISE.

    IMPORTANT:
    There is NO transition here.

    No hop.
    No slide.
    No jump.
    No bounce.

    It simply changes position.
  */

  .tf-tortoise {

    position:
      fixed;

    z-index:
      99990;

    font-size:
      34px;

    line-height:
      1;

    pointer-events:
      none;

    transform:
      translate(
        -50%,
        -50%
      );

    filter:
      drop-shadow(
        2px 3px 2px
        rgba(0,0,0,.55)
      );
  }

  .tf-hit-flash {
    animation:
      tfHitFlash .35s ease;
  }

  @keyframes tfHitFlash {

    0% {
      filter:
        brightness(1);
    }

    50% {
      filter:
        brightness(2.2);
    }

    100% {
      filter:
        brightness(1);
    }
  }

  @media (max-width: 600px) {

    #tf-controls button {
      padding:
        10px 9px;

      font-size:
        11px;
    }

    .tf-tortoise {
      font-size:
        32px;
    }
  }

`;

document.head.appendChild(
  style
);

/* -----------------------------------------
   CREATE TORTOISE
----------------------------------------- */

const tortoise =
  document.createElement('div');

tortoise.className =
  'tf-tortoise';

/*
  ONLY THE TORTOISE.
*/

tortoise.textContent =
  '🐢';

tortoise.setAttribute(
  'aria-hidden',
  'true'
);

document.body.appendChild(
  tortoise
);

/* -----------------------------------------
   CONTROLS
----------------------------------------- */

const startButton =
  document.getElementById(
    'tf-start'
  );

const restartButton =
  document.getElementById(
    'tf-restart'
  );

const endButton =
  document.getElementById(
    'tf-end'
  );

const status =
  document.getElementById(
    'tf-status'
  );

const timerDisplay =
  document.getElementById(
    'tf-timer'
  );

/* -----------------------------------------
   HELPERS
----------------------------------------- */

function setStatus(message) {
  status.textContent =
    message;
}

function formatTime(seconds) {

  seconds =
    Math.max(
      0,
      Math.ceil(seconds)
    );

  const minutes =
    Math.floor(
      seconds / 60
    );

  const secs =
    seconds % 60;

  return (
    minutes +
    ':' +
    String(secs)
      .padStart(2, '0')
  );
}

function setTimer(seconds) {

  timerDisplay.textContent =
    formatTime(seconds);
}

/* -----------------------------------------
   PLACE TORTOISE
----------------------------------------- */

function placeTortoise() {

  const row =
    rows[position];

  if (!row) return;

  const rect =
    row.getBoundingClientRect();

  /*
    Fixed horizontal position.
  */

  tortoise.style.left =
    (
      window.innerWidth *
      0.50
    ) + 'px';

  /*
    DIRECT POSITION.

    No CSS transition means
    there is NO animated hop.
  */

  tortoise.style.top =
    (
      rect.top +
      rect.height *
      0.50
    ) + 'px';
}

/* -----------------------------------------
   CAMERA
----------------------------------------- */

function moveCameraToCurrentStreet(
  smooth = true
) {

  const row =
    rows[position];

  if (!row) return;

  const rect =
    row.getBoundingClientRect();

  /*
    Keep tortoise low enough that
    upcoming streets are visible.
  */

  const targetY =
    window.innerHeight *
    0.72;

  const targetScroll =
    window.scrollY +
    rect.top -
    targetY;

  window.scrollTo({

    top:
      Math.max(
        0,
        targetScroll
      ),

    behavior:
      smooth
        ? 'smooth'
        : 'auto'
  });

  /*
    After the camera moves,
    put tortoise exactly on the
    current row again.
  */

  setTimeout(
    () => {
      placeTortoise();
    },
    smooth
      ? 450
      : 0
  );
}

/* -----------------------------------------
   REMOVE ALL OBSTACLES
----------------------------------------- */

function removeAllObstacles() {

  document
    .querySelectorAll(
      '.tf-obstacle'
    )
    .forEach(
      obstacle =>
        obstacle.remove()
    );

  traffic.length = 0;
}

/* -----------------------------------------
   RETURN TO BOTTOM
----------------------------------------- */

function sendToBottom() {

  position =
    rows.length - 1;

  /*
    Immediately put tortoise
    at bottom.
  */

  placeTortoise();

  /*
    Scroll page back down.
  */

  moveCameraToCurrentStreet(
    true
  );

  const bottomRow =
    rows[position];

  if (bottomRow) {

    bottomRow.classList.remove(
      'tf-hit-flash'
    );

    void bottomRow.offsetWidth;

    bottomRow.classList.add(
      'tf-hit-flash'
    );
  }
}

/* -----------------------------------------
   YOUTUBE RESTART
----------------------------------------- */

function restartYouTubeSong() {

  const iframe =
    document.querySelector(
      'iframe[src*="youtube.com"], iframe[src*="youtube-nocookie.com"]'
    );

  if (!iframe) {
    return false;
  }

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
        func: 'playVideo',
        args: []
      }),

      '*'
    );

    return true;

  } catch (error) {

    console.warn(
      'YouTube restart failed:',
      error
    );

    return false;
  }
}

/* -----------------------------------------
   SONG DURATION
----------------------------------------- */

function getSongDuration() {

  const media =
    document.querySelector(
      'audio, video'
    );

  if (
    media &&
    isFinite(media.duration) &&
    media.duration > 0
  ) {

    return media.duration;
  }

  return DEFAULT_SONG_TIME;
}

/* -----------------------------------------
   TIMER
----------------------------------------- */

function stopTimer() {

  if (timer) {

    clearInterval(timer);

    timer = null;
  }
}

function startTimer() {

  stopTimer();

  timeLeft =
    getSongDuration();

  songStartedAt =
    Date.now();

  setTimer(
    timeLeft
  );

  timer =
    setInterval(
      () => {

        const elapsed =
          (
            Date.now() -
            songStartedAt
          ) / 1000;

        timeLeft =
          Math.max(
            0,
            getSongDuration() -
            elapsed
          );

        setTimer(
          timeLeft
        );

        if (
          timeLeft <= 0
        ) {

          loseGame();
        }

      },
      250
    );
}

/* -----------------------------------------
   TRAFFIC
----------------------------------------- */

const trafficSymbols = [
  '🚗',
  '🚙',
  '🚕',
  '🚌',
  '🎵',
  '🎸',
  '💿'
];

/*
  EMPTY BEFORE GAME START.

  Nothing gets created here.
*/

const traffic = [];

/* -----------------------------------------
   CREATE TRAFFIC
----------------------------------------- */

function createTraffic() {

  /*
    Safety:
    Remove anything left over
    from an earlier game.
  */

  removeAllObstacles();

  rows.forEach(
    (row, index) => {

      /*
        Bottom row is SAFE.
      */

      if (
        index ===
        rows.length - 1
      ) {
        return;
      }

      const count =
        index % 3 === 0
          ? 2
          : 1;

      if (
        getComputedStyle(row)
          .position ===
        'static'
      ) {

        row.style.position =
          'relative';
      }

      for (
        let i = 0;
        i < count;
        i++
      ) {

        const obstacle =
          document.createElement(
            'div'
          );

        obstacle.className =
          'tf-obstacle';

        obstacle.textContent =
          trafficSymbols[
            Math.floor(
              Math.random() *
              trafficSymbols.length
            )
          ];

        obstacle.style.position =
          'absolute';

        obstacle.style.zIndex =
          '20';

        obstacle.style.pointerEvents =
          'none';

        obstacle.style.fontSize =
          '27px';

        obstacle.style.lineHeight =
          '1';

        const startingX =
          Math.random() *
          100;

        obstacle.style.left =
          startingX + '%';

        obstacle.style.top =
          '50%';

        const direction =
          i % 2 === 0
            ? 1
            : -1;

        const speed =
          0.35 +
          Math.random() *
          0.45;

        row.appendChild(
          obstacle
        );

        traffic.push({

          element:
            obstacle,

          x:
            startingX,

          direction:
            direction,

          speed:
            speed
        });
      }
    }
  );
}

/* -----------------------------------------
   TRAFFIC LOOP
----------------------------------------- */

let lastFrame =
  performance.now();

function animateTraffic(now) {

  const delta =
    Math.min(
      40,
      now - lastFrame
    );

  lastFrame =
    now;

  /*
    ABSOLUTELY NOTHING happens
    here unless the game is active.
  */

  if (
    active &&
    !gameOver
  ) {

    traffic.forEach(
      car => {

        let x =
          car.x;

        x +=
          car.direction *
          car.speed *
          delta *
          0.08;

        if (
          x > 110
        ) {
          x = -15;
        }

        if (
          x < -15
        ) {
          x = 110;
        }

        car.x =
          x;

        car.element.style.left =
          x + '%';
      }
    );

    if (
      !moving &&
      checkCollision()
    ) {

      handleHit();
    }
  }

  requestAnimationFrame(
    animateTraffic
  );
}

requestAnimationFrame(
  animateTraffic
);

/* -----------------------------------------
   COLLISION
----------------------------------------- */

function checkCollision() {

  /*
    Bottom row is completely safe.
  */

  if (
    position ===
    rows.length - 1
  ) {

    return false;
  }

  const row =
    rows[position];

  if (!row) {
    return false;
  }

  const tortoiseRect =
    tortoise.getBoundingClientRect();

  const obstacles =
    row.querySelectorAll(
      '.tf-obstacle'
    );

  for (
    const obstacle
    of obstacles
  ) {

    const rect =
      obstacle.getBoundingClientRect();

    const hit =
      tortoiseRect.left <
        rect.right &&
      tortoiseRect.right >
        rect.left &&
      tortoiseRect.top <
        rect.bottom &&
      tortoiseRect.bottom >
        rect.top;

    if (hit) {
      return true;
    }
  }

  return false;
}

/* -----------------------------------------
   HIT
----------------------------------------- */

function handleHit() {

  if (
    !active ||
    gameOver ||
    moving
  ) {
    return;
  }

  moving = true;

  setStatus(
    '💥 BONK! BACK TO THE BOTTOM!'
  );

  setTimeout(
    () => {

      sendToBottom();

      moving = false;

      if (
        active &&
        !gameOver
      ) {

        setStatus(
          '🐢 TRY AGAIN!'
        );
      }

    },
    250
  );
}

/* -----------------------------------------
   MOVE UP
----------------------------------------- */

function moveUp() {

  if (
    !active ||
    gameOver ||
    moving
  ) {
    return;
  }

  if (
    position === 0
  ) {

    winGame();

    return;
  }

  moving = true;

  /*
    Move exactly ONE street.

    There is NO animation.
  */

  position--;

  /*
    Put tortoise directly
    on the new street.
  */

  placeTortoise();

  /*
    Then adjust camera so the
    tortoise stays low.
  */

  moveCameraToCurrentStreet(
    true
  );

  setStatus(
    '🐢 MOVING...'
  );

  /*
    This is only an input lock.
    It does NOT animate the tortoise.
  */

  setTimeout(
    () => {

      moving = false;

      if (
        position === 0
      ) {

        winGame();

      } else {

        setStatus(
          '🐢 KEEP GOING!'
        );
      }

    },
    MOVE_LOCK
  );
}

/* -----------------------------------------
   START GAME
----------------------------------------- */

function startGame() {

  /*
    Remove anything from a previous
    game first.
  */

  removeAllObstacles();

  active = true;

  gameOver = false;

  moving = false;

  position =
    rows.length - 1;

  /*
    Put tortoise at bottom.
  */

  placeTortoise();

  /*
    Scroll to starting street.
  */

  moveCameraToCurrentStreet(
    true
  );

  /*
    NOW — and only now —
    create the obstacles.
  */

  createTraffic();

  /*
    Restart current song.
  */

  restartYouTubeSong();

  /*
    Start timer.
  */

  startTimer();

  setStatus(
    '🐢 GO! REACH THE TOP!'
  );
}

/* -----------------------------------------
   WIN
----------------------------------------- */

function winGame() {

  if (
    !active ||
    gameOver
  ) {
    return;
  }

  active = false;

  gameOver = true;

  moving = false;

  stopTimer();

  setStatus(
    '🏁 YOU MADE IT! 🐢'
  );

  setTimer(
    timeLeft
  );
}

/* -----------------------------------------
   SONG ENDED
----------------------------------------- */

function loseGame() {

  if (
    !active ||
    gameOver
  ) {
    return;
  }

  active = false;

  gameOver = true;

  moving = false;

  stopTimer();

  /*
    Freeze traffic where it is.
    It remains visible because the game
    ended, but nothing moves.
  */

  setStatus(
    '⌛ SONG OVER!'
  );

  setTimer(0);
}

/* -----------------------------------------
   END GAME
----------------------------------------- */

function endGame() {

  active = false;

  gameOver = true;

  moving = false;

  stopTimer();

  /*
    REMOVE ALL TRAFFIC.

    This means there are literally
    NO obstacle objects on screen
    after ending the game.
  */

  removeAllObstacles();

  position =
    rows.length - 1;

  placeTortoise();

  moveCameraToCurrentStreet(
    true
  );

  setStatus(
    '🐢 GAME ENDED'
  );

  setTimer(0);
}

/* -----------------------------------------
   BUTTON EVENTS
----------------------------------------- */

startButton.addEventListener(
  'click',
  event => {

    event.preventDefault();
    event.stopPropagation();

    startGame();
  }
);

restartButton.addEventListener(
  'click',
  event => {

    event.preventDefault();
    event.stopPropagation();

    startGame();
  }
);

endButton.addEventListener(
  'click',
  event => {

    event.preventDefault();
    event.stopPropagation();

    endGame();
  }
);

/* -----------------------------------------
   TAP ANYWHERE = MOVE
----------------------------------------- */

document.addEventListener(
  'click',
  event => {

    if (
      !active ||
      gameOver
    ) {
      return;
    }

    const target =
      event.target.closest(
        'button, a, input, select, textarea, audio, video, iframe, #tortoise-frogger'
      );

    if (target) {
      return;
    }

    moveUp();

  },
  true
);

/* -----------------------------------------
   TOUCH = MOVE
----------------------------------------- */

document.addEventListener(
  'touchend',
  event => {

    if (
      !active ||
      gameOver
    ) {
      return;
    }

    const target =
      event.target.closest(
        'button, a, input, select, textarea, audio, video, iframe, #tortoise-frogger'
      );

    if (target) {
      return;
    }

    event.preventDefault();

    moveUp();

  },
  {
    passive: false,
    capture: true
  }
);

/* -----------------------------------------
   RESIZE
----------------------------------------- */

window.addEventListener(
  'resize',
  () => {

    if (active) {
      placeTortoise();
    }

  }
);

/* -----------------------------------------
   INITIAL STATE
----------------------------------------- */

position =
  rows.length - 1;

/*
  No obstacles are created here.

  The screen should be completely
  obstacle-free until START.
*/

placeTortoise();

setStatus(
  '🐢 READY — PRESS FROGGER'
);

setTimer(0);

}

if (
document.readyState ===
'loading'
) {

document.addEventListener(
  'DOMContentLoaded',
  init
);

} else {

init();

}

})();
