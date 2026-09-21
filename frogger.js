/*
TORTOISE FROGGER 🐢
Rizney / Mewzing Music Page

CLEAN MOVEMENT VERSION

- 🐢 Tortoise ONLY
- No skateboard
- No hop animation
- Tortoise moves upward at a moderate speed
- Slower than classic Frogger
- Traffic does NOT move until game starts
- Bottom street is always safe
- Getting hit sends tortoise to bottom
- Getting hit scrolls page back to bottom
- Song timer continues after getting hit
- Restart Song resets game + song
- End Game freezes everything
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
  How long the tortoise takes to
  move from one street to the next.

  Classic Frogger is much faster.

  This is deliberately slower,
  but not painfully slow.
*/

const MOVE_TIME = 560;

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
    TORTOISE

    No animation.
    No hopping.
    Just moves from
    one street to another.
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

    /*
      This is the ONLY
      movement animation.

      Smooth, but slower
      than classic Frogger.
    */

    transition:
      top ${MOVE_TIME}ms
      ease-in-out;
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
   TORTOISE
----------------------------------------- */

const tortoise =
  document.createElement('div');

tortoise.className =
  'tf-tortoise';

/*
  ONLY 🐢
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

  tortoise.style.left =
    (
      window.innerWidth *
      0.50
    ) + 'px';

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
    Keep tortoise around 72%
    down the screen.

    This leaves the streets
    above visible.
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

  setTimeout(
    () => {
      placeTortoise();
    },
    smooth
      ? 400
      : 20
  );
}

/* -----------------------------------------
   RETURN TO BOTTOM
----------------------------------------- */

function sendToBottom() {

  /*
    Bottom song row.
  */

  position =
    rows.length - 1;

  /*
    Put tortoise there.
  */

  placeTortoise();

  /*
    IMPORTANT:
    Scroll the actual page
    back down.
  */

  moveCameraToCurrentStreet(
    true
  );

  /*
    Flash the starting street.
  */

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

const traffic = [];

function createTraffic() {

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

        /*
          Objects exist on the
          streets but DO NOT MOVE
          until the game starts.
        */

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

        obstacle.dataset.direction =
          direction;

        obstacle.dataset.speed =
          (
            0.35 +
            Math.random() *
            0.45
          ).toFixed(2);

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
            parseFloat(
              obstacle.dataset.speed
            )

        });
      }
    }
  );
}

createTraffic();

/* -----------------------------------------
   TRAFFIC ANIMATION
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
    THIS is important:

    If the game isn't active,
    traffic does absolutely
    nothing.
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

    /*
      Collision check.
    */

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
    Bottom row is always safe.
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

  /*
    Tiny collision pause.
  */

  setTimeout(
    () => {

      /*
        Reset position.
      */

      sendToBottom();

      /*
        Allow movement again.
      */

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
   MOVE TORTOISE UP
----------------------------------------- */

function moveUp() {

  if (
    !active ||
    gameOver ||
    moving
  ) {
    return;
  }

  /*
    Already at top.
  */

  if (
    position === 0
  ) {

    winGame();

    return;
  }

  moving = true;

  /*
    One street upward.
  */

  position--;

  /*
    Move the page camera.
  */

  moveCameraToCurrentStreet(
    true
  );

  /*
    Move tortoise smoothly.

    NO HOP.
  */

  placeTortoise();

  setStatus(
    '🐢 MOVING...'
  );

  /*
    Moderate tortoise speed.
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
    MOVE_TIME
  );
}

/* -----------------------------------------
   START GAME
----------------------------------------- */

function startGame() {

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
    Scroll to bottom.
  */

  moveCameraToCurrentStreet(
    true
  );

  /*
    Restart song.
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
   LOSE
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

  position =
    rows.length - 1;

  /*
    Return tortoise to bottom.
  */

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

    /*
      Buttons and controls do not
      move the tortoise.
    */

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
