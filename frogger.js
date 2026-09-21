/*
TORTOISE FROGGER 🐢
Rizney / Mewzing Music Page

FEATURES:

- 🐢 Tortoise ONLY — no skateboard
- Existing song rows are the streets
- Tap anywhere that isn't a button/control to hop
- Slow tortoise movement
- Bottom street is always safe
- Getting hit sends tortoise back to bottom
- Getting hit ALSO scrolls the page back to bottom
- Song timer continues after getting hit
- Restart Song resets the game and song
- End Game stops Frogger
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
let position = rows.length - 1;

let hopping = false;
let timer = null;

let timeLeft = 0;
let songStartedAt = 0;

/*
  BIGGER NUMBER = SLOWER TORTOISE
*/
const HOP_TIME = 900;

const DEFAULT_SONG_TIME = 180;

/* -----------------------------------------
   FOOTER
----------------------------------------- */

const footer = document.createElement('div');

footer.id = 'tortoise-frogger';

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

document.body.appendChild(footer);

/* -----------------------------------------
   CSS
----------------------------------------- */

const style = document.createElement('style');

style.textContent = `

  #tortoise-frogger {
    position: relative;
    z-index: 99999;
    width: 100%;
    box-sizing: border-box;
    padding: 12px 10px 18px;
    margin-top: 20px;

    background:
      linear-gradient(
        to bottom,
        #120b18,
        #080509
      );

    border-top: 2px solid #d69a2d;

    box-shadow:
      0 -4px 18px rgba(0,0,0,.45);

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
    font-variant-numeric: tabular-nums;
  }

  #tf-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 7px;
    flex-wrap: wrap;
  }

  #tf-controls button {
    border: 1px solid #d69a2d;

    background: #1d1028;

    color: #f0c56a;

    border-radius: 7px;

    padding: 9px 11px;

    font-size: 12px;
    font-weight: bold;

    cursor: pointer;

    touch-action: manipulation;
  }

  #tf-controls button:active {
    transform: scale(.96);
  }

  /*
    THE TORTOISE

    Notice:
    It is ONLY 🐢
    No skateboard.
  */

  .tf-tortoise {

    position: fixed;

    z-index: 99990;

    font-size: 34px;

    line-height: 1;

    pointer-events: none;

    transform:
      translate(-50%, -50%);

    filter:
      drop-shadow(
        2px 3px 2px
        rgba(0,0,0,.55)
      );

    transition:
      top ${HOP_TIME}ms
      cubic-bezier(.22,.61,.36,1);

  }

  .tf-hit-flash {
    animation:
      tfHitFlash .35s ease;
  }

  @keyframes tfHitFlash {

    0% {
      filter: brightness(1);
    }

    50% {
      filter: brightness(2.2);
    }

    100% {
      filter: brightness(1);
    }

  }

  @media (max-width: 600px) {

    #tf-controls button {
      padding: 10px 9px;
      font-size: 11px;
    }

    .tf-tortoise {
      font-size: 32px;
    }

  }

`;

document.head.appendChild(style);

/* -----------------------------------------
   CREATE TORTOISE
----------------------------------------- */

const tortoise =
  document.createElement('div');

tortoise.className =
  'tf-tortoise';

/*
  ONLY TORTOISE.
*/
tortoise.textContent = '🐢';

tortoise.setAttribute(
  'aria-hidden',
  'true'
);

document.body.appendChild(tortoise);

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
  status.textContent = message;
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
    String(secs).padStart(
      2,
      '0'
    )
  );
}

function setTimer(seconds) {
  timerDisplay.textContent =
    formatTime(seconds);
}

/* -----------------------------------------
   PUT TORTOISE ON CURRENT STREET
----------------------------------------- */

function placeTortoise() {

  const row =
    rows[position];

  if (!row) return;

  rows.forEach(
    r =>
      r.classList.remove(
        'tf-row-active'
      )
  );

  row.classList.add(
    'tf-row-active'
  );

  const rect =
    row.getBoundingClientRect();

  /*
    Tortoise stays roughly 72% down
    the screen.

    This leaves plenty of road visible
    above him.
  */

  tortoise.style.left =
    (window.innerWidth * 0.50)
    + 'px';

  tortoise.style.top =
    (
      rect.top +
      rect.height * 0.50
    )
    + 'px';
}

/* -----------------------------------------
   MOVE CAMERA TO CURRENT STREET
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
    Put the tortoise around 72% down
    the visible screen.

    That means the player can see
    several streets ABOVE them.
  */

  const targetY =
    window.innerHeight * 0.72;

  const scrollAmount =
    window.scrollY +
    rect.top -
    targetY;

  window.scrollTo({
    top: Math.max(
      0,
      scrollAmount
    ),
    behavior:
      smooth
        ? 'smooth'
        : 'auto'
  });

  /*
    Reposition tortoise after the
    browser has moved the page.
  */

  setTimeout(
    () => {
      placeTortoise();
    },
    smooth ? 450 : 20
  );
}

/* -----------------------------------------
   SEND TORTOISE ALL THE WAY HOME
----------------------------------------- */

function sendToBottom() {

  /*
    Bottom song row.
  */

  position =
    rows.length - 1;

  /*
    Put him on the bottom row FIRST.
  */

  placeTortoise();

  /*
    Then move the CAMERA back down.

    THIS is the important part:
    getting hit now physically scrolls
    the page back to the bottom.
  */

  moveCameraToCurrentStreet(true);

  /*
    Flash the safe starting street.
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
   RESTART YOUTUBE SONG
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

  setTimer(timeLeft);

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

      /*
        One or two objects per street.
      */

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

        obstacle.style.left =
          (
            Math.random() * 100
          ) + '%';

        obstacle.style.top =
          '50%';

        /*
          Different streets travel
          in different directions.
        */

        const direction =
          i % 2 === 0
            ? 1
            : -1;

        obstacle.dataset.direction =
          direction;

        /*
          Traffic remains faster than
          our tortoise.
        */

        obstacle.dataset.speed =
          (
            0.35 +
            Math.random() * 0.45
          ).toFixed(2);

        row.appendChild(
          obstacle
        );

        traffic.push({
          element:
            obstacle,

          x:
            parseFloat(
              obstacle.style.left
            ),

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
    Check for collisions.
  */

  if (
    active &&
    !gameOver &&
    !hopping &&
    checkCollision()
  ) {

    handleHit();
  }

  requestAnimationFrame(
    animateTraffic
  );
}

requestAnimationFrame(
  animateTraffic
);

/* -----------------------------------------
   COLLISION DETECTION
----------------------------------------- */

function checkCollision() {

  /*
    Bottom row is ALWAYS SAFE.
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

    const obstacleRect =
      obstacle.getBoundingClientRect();

    const hit =
      tortoiseRect.left <
        obstacleRect.right &&
      tortoiseRect.right >
        obstacleRect.left &&
      tortoiseRect.top <
        obstacleRect.bottom &&
      tortoiseRect.bottom >
        obstacleRect.top;

    if (hit) {
      return true;
    }
  }

  return false;
}

/* -----------------------------------------
   HIT!
----------------------------------------- */

function handleHit() {

  if (
    !active ||
    gameOver ||
    hopping
  ) {
    return;
  }

  hopping = true;

  setStatus(
    '💥 BONK! BACK TO THE BOTTOM!'
  );

  /*
    Give the collision a tiny moment
    so the player can actually see it.
  */

  setTimeout(
    () => {

      /*
        THIS sends both:
        1. the tortoise
        2. the CAMERA

        back to the bottom.
      */

      sendToBottom();

      hopping = false;

      if (
        active &&
        !gameOver
      ) {

        setStatus(
          '🐢 TRY AGAIN!'
        );
      }

    },
    300
  );
}

/* -----------------------------------------
   TORTOISE HOP
----------------------------------------- */

function hop() {

  if (
    !active ||
    gameOver ||
    hopping
  ) {
    return;
  }

  /*
    Already at the top?
  */

  if (
    position === 0
  ) {

    winGame();

    return;
  }

  hopping = true;

  /*
    One street upward.
  */

  position--;

  /*
    Move the CAMERA ONLY when
    necessary to keep the tortoise
    low on screen.
  */

  moveCameraToCurrentStreet(true);

  /*
    Move the tortoise.
  */

  placeTortoise();

  setStatus(
    '🐢 HOP...'
  );

  /*
    Slow tortoise.
  */

  setTimeout(
    () => {

      hopping = false;

      /*
        Reaching the top wins.
      */

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
    HOP_TIME
  );
}

/* -----------------------------------------
   START GAME
----------------------------------------- */

function startGame() {

  active = true;

  gameOver = false;

  hopping = false;

  position =
    rows.length - 1;

  /*
    Start at bottom.
  */

  placeTortoise();

  /*
    Scroll all the way down to
    the starting street.
  */

  moveCameraToCurrentStreet(
    true
  );

  /*
    Restart the currently playing
    YouTube song.
  */

  restartYouTubeSong();

  /*
    Restart timer.
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

  hopping = false;

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

  hopping = false;

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

  hopping = false;

  stopTimer();

  position =
    rows.length - 1;

  /*
    Return to the bottom when
    ending the game too.
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
   BUTTONS
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
   TAP ANYWHERE TO HOP
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
      Buttons and controls do NOT
      make the tortoise hop.
    */

    if (target) {
      return;
    }

    hop();

  },
  true
);

/* -----------------------------------------
   TOUCH
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

    hop();

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
