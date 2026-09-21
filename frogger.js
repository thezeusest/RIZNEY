/* =========================================================
TORTOISE FROGGER

- Tortoise hidden until game starts
- 4-direction tap controls
- Traffic only appears during the game
- Hit = knocked back 10 rows
- Knocked tortoise lands upside down
- While upside down, tortoise cannot move
- Another traffic object must hit him to flip him upright
- Bottom row is always safe
  ========================================================= */

(() => {
'use strict';

if (window.__tortoiseFroggerLoaded) return;
window.__tortoiseFroggerLoaded = true;

const init = () => {

const songList =
  document.querySelector('#song-list') ||
  document.querySelector('.song-list');

if (!songList) return;

const rows = Array.from(
  songList.querySelectorAll('.song')
);

if (!rows.length) return;

/* -----------------------------------------------------
   FOOTER
   ----------------------------------------------------- */

const footer = document.createElement('div');
footer.id = 'tortoise-frogger';

footer.innerHTML = `
  <div id="frogger-status">🐢 FROGGER</div>
  <div id="frogger-timer">TIME: --:--</div>

  <div id="frogger-buttons">
    <button id="frogger-start">FROGGER</button>
    <button id="frogger-restart">RESTART SONG</button>
    <button id="frogger-end">END GAME</button>
  </div>
`;

document.body.appendChild(footer);


/* -----------------------------------------------------
   STYLES
   ----------------------------------------------------- */

const style = document.createElement('style');

style.textContent = `
  #tortoise-frogger {
    position: relative;
    width: 100%;
    box-sizing: border-box;
    padding: 14px 10px 20px;
    margin-top: 18px;
    text-align: center;
    z-index: 9999;
  }

  #frogger-status {
    color: #f2b84b;
    font-weight: bold;
    font-size: 15px;
    margin-bottom: 5px;
  }

  #frogger-timer {
    color: #ffffff;
    font-size: 14px;
    margin-bottom: 10px;
  }

  #frogger-buttons {
    display: flex;
    justify-content: center;
    gap: 7px;
    flex-wrap: wrap;
  }

  #frogger-buttons button {
    border: 1px solid #f2b84b;
    background: #1d1028;
    color: #f2b84b;
    border-radius: 8px;
    padding: 9px 11px;
    font-weight: bold;
    font-size: 12px;
    cursor: pointer;
    touch-action: manipulation;
  }

  #frogger-buttons button:active {
    transform: scale(.96);
  }

  #tortoise-frogger-piece {
    position: absolute;
    z-index: 9998;

    font-size: 31px;
    line-height: 1;

    pointer-events: none;
    user-select: none;

    transition: none !important;
    animation: none !important;

    display: none;
  }
`;

document.head.appendChild(style);


/* -----------------------------------------------------
   MAKE SONG LIST A POSITIONING AREA
   ----------------------------------------------------- */

const listParent = songList;

if (getComputedStyle(listParent).position === 'static') {
  listParent.style.position = 'relative';
}


/* -----------------------------------------------------
   TORTOISE
   ----------------------------------------------------- */

const tortoise = document.createElement('div');

tortoise.id = 'tortoise-frogger-piece';
tortoise.textContent = '🐢';

listParent.appendChild(tortoise);


/* -----------------------------------------------------
   GAME STATE
   ----------------------------------------------------- */

let gameActive = false;

let position = rows.length - 1;

let horizontalPosition = 50;

let timerSeconds = 180;
let timerInterval = null;

let moving = false;

let upsideDown = false;

let lastHitObstacle = null;

let collisionCooldownUntil = 0;

const HORIZONTAL_STEP = 12;

const MIN_X = 8;
const MAX_X = 92;

const MOVE_LOCK = 170;

const KNOCKBACK_ROWS = 10;


/* -----------------------------------------------------
   BASIC HELPERS
   ----------------------------------------------------- */

const formatTime = seconds => {
  seconds = Math.max(0, Math.floor(seconds));

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    String(minutes).padStart(2, '0') +
    ':' +
    String(secs).padStart(2, '0')
  );
};


const setStatus = text => {
  const status = document.getElementById('frogger-status');

  if (status) {
    status.textContent = text;
  }
};


const updateTimerDisplay = () => {
  const timer = document.getElementById('frogger-timer');

  if (timer) {
    timer.textContent = 'TIME: ' + formatTime(timerSeconds);
  }
};


/* -----------------------------------------------------
   PLACE TORTOISE
   ----------------------------------------------------- */

const placeTortoise = () => {

  if (!rows[position]) return;

  const row = rows[position];

  const parentRect = listParent.getBoundingClientRect();
  const rowRect = row.getBoundingClientRect();

  const tortoiseWidth =
    tortoise.getBoundingClientRect().width || 31;

  const left =
    (listParent.clientWidth * horizontalPosition / 100) -
    (tortoiseWidth / 2);

  const top =
    rowRect.top -
    parentRect.top +
    (rowRect.height / 2) -
    16;

  tortoise.style.left = `${left}px`;
  tortoise.style.top = `${top}px`;

  tortoise.style.transform =
    upsideDown ? 'rotate(180deg)' : 'none';
};


/* -----------------------------------------------------
   CAMERA
   ----------------------------------------------------- */

const moveCameraToCurrentStreet = (down = false) => {

  if (!rows[position]) return;

  const row = rows[position];

  const rect = row.getBoundingClientRect();

  const targetY =
    window.scrollY +
    rect.top -
    (window.innerHeight * 0.55);

  window.scrollTo({
    top: Math.max(0, targetY),
    behavior: 'smooth'
  });
};


/* -----------------------------------------------------
   MOVE UP
   ----------------------------------------------------- */

const moveUp = () => {

  if (!gameActive || upsideDown || moving) return;

  if (position <= 0) return;

  moving = true;

  position--;

  placeTortoise();

  moveCameraToCurrentStreet();

  setTimeout(() => {
    moving = false;
  }, MOVE_LOCK);
};


/* -----------------------------------------------------
   MOVE DOWN
   ----------------------------------------------------- */

const moveDown = () => {

  if (!gameActive || upsideDown || moving) return;

  if (position >= rows.length - 1) return;

  moving = true;

  position++;

  placeTortoise();

  moveCameraToCurrentStreet(true);

  setTimeout(() => {
    moving = false;
  }, MOVE_LOCK);
};


/* -----------------------------------------------------
   MOVE LEFT
   ----------------------------------------------------- */

const moveLeft = () => {

  if (!gameActive || upsideDown || moving) return;

  moving = true;

  horizontalPosition =
    Math.max(
      MIN_X,
      horizontalPosition - HORIZONTAL_STEP
    );

  placeTortoise();

  setTimeout(() => {
    moving = false;
  }, MOVE_LOCK);
};


/* -----------------------------------------------------
   MOVE RIGHT
   ----------------------------------------------------- */

const moveRight = () => {

  if (!gameActive || upsideDown || moving) return;

  moving = true;

  horizontalPosition =
    Math.min(
      MAX_X,
      horizontalPosition + HORIZONTAL_STEP
    );

  placeTortoise();

  setTimeout(() => {
    moving = false;
  }, MOVE_LOCK);
};


/* -----------------------------------------------------
   TAP CONTROL
   ----------------------------------------------------- */

const handleGameTap = (clientX, clientY) => {

  if (!gameActive || upsideDown) return;

  const rect =
    tortoise.getBoundingClientRect();

  const centerX =
    rect.left + rect.width / 2;

  const centerY =
    rect.top + rect.height / 2;

  const dx = clientX - centerX;
  const dy = clientY - centerY;

  const deadZone = 18;

  if (
    Math.abs(dx) < deadZone &&
    Math.abs(dy) < deadZone
  ) {
    return;
  }

  if (Math.abs(dx) > Math.abs(dy)) {

    if (dx < 0) {
      moveLeft();
    } else {
      moveRight();
    }

  } else {

    if (dy < 0) {
      moveUp();
    } else {
      moveDown();
    }
  }
};


/* -----------------------------------------------------
   PAGE TAP LISTENER
   ----------------------------------------------------- */

document.addEventListener(
  'pointerup',
  event => {

    if (!gameActive || upsideDown) return;

    const target = event.target;

    if (
      target &&
      target.closest &&
      (
        target.closest('#tortoise-frogger') ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('select') ||
        target.closest('iframe') ||
        target.closest('video') ||
        target.closest('audio')
      )
    ) {
      return;
    }

    handleGameTap(
      event.clientX,
      event.clientY
    );
  },
  true
);


/* -----------------------------------------------------
   TRAFFIC
   ----------------------------------------------------- */

let traffic = [];

const removeTraffic = () => {

  traffic.forEach(item => {

    if (item.element &&
        item.element.parentNode) {

      item.element.remove();
    }
  });

  traffic = [];
};


const createTraffic = () => {

  removeTraffic();

  /*
     Bottom row is always safe.

     Traffic is deliberately sparse so the game
     stays forgiving.
  */

  rows.forEach((row, index) => {

    if (index === rows.length - 1) return;

    /*
       Only roughly every other row gets traffic.
    */

    if (index % 2 !== 0) return;

    const count =
      Math.random() < 0.18 ? 2 : 1;

    for (let i = 0; i < count; i++) {

      const obstacle =
        document.createElement('div');

      obstacle.className =
        'tortoise-frogger-traffic';

      obstacle.textContent =
        Math.random() < 0.5 ? '🚗' : '🚙';

      obstacle.style.position = 'absolute';
      obstacle.style.zIndex = '9997';
      obstacle.style.pointerEvents = 'none';
      obstacle.style.userSelect = 'none';
      obstacle.style.fontSize = '27px';
      obstacle.style.lineHeight = '1';

      const parentRect =
        listParent.getBoundingClientRect();

      const rowRect =
        row.getBoundingClientRect();

      const rowTop =
        rowRect.top -
        parentRect.top +
        (rowRect.height / 2) -
        14;

      obstacle.style.top =
        `${rowTop}px`;

      let x =
        Math.random() * 100;

      obstacle.style.left = `${x}%`;

      listParent.appendChild(obstacle);

      traffic.push({
        element: obstacle,
        rowIndex: index,
        x: x,
        speed:
          0.18 +
          Math.random() * 0.20,
        direction:
          Math.random() < 0.5 ? 1 : -1
      });
    }
  });
};


/* -----------------------------------------------------
   TRAFFIC ANIMATION
   ----------------------------------------------------- */

let trafficAnimation = null;

const animateTraffic = () => {

  if (!gameActive) {
    trafficAnimation = null;
    return;
  }

  const listWidth =
    listParent.clientWidth;

  traffic.forEach(item => {

    item.x +=
      item.speed *
      item.direction *
      0.055;

    if (item.x > 105) {
      item.x = -5;
    }

    if (item.x < -5) {
      item.x = 105;
    }

    item.element.style.left =
      `${item.x}%`;
  });

  checkCollisions();

  trafficAnimation =
    requestAnimationFrame(animateTraffic);
};


/* -----------------------------------------------------
   COLLISION DETECTION
   ----------------------------------------------------- */

const checkCollisions = () => {

  if (!gameActive) return;

  if (Date.now() < collisionCooldownUntil) {
    return;
  }

  if (moving) return;

  const tortoiseRect =
    tortoise.getBoundingClientRect();

  /*
     Smaller collision box makes the game forgiving.
  */

  const padding = 9;

  const tLeft =
    tortoiseRect.left + padding;

  const tRight =
    tortoiseRect.right - padding;

  const tTop =
    tortoiseRect.top + padding;

  const tBottom =
    tortoiseRect.bottom - padding;


  for (const item of traffic) {

    if (!rows[position]) continue;

    if (item.rowIndex !== position) {
      continue;
    }

    /*
       Don't immediately use the exact same
       object that knocked us over to flip us.
    */

    if (
      upsideDown &&
      item === lastHitObstacle
    ) {
      continue;
    }

    const rect =
      item.element.getBoundingClientRect();

    const hit =
      rect.right > tLeft &&
      rect.left < tRight &&
      rect.bottom > tTop &&
      rect.top < tBottom;

    if (!hit) continue;


    /* -----------------------------------------------
       NORMAL TORTOISE GETS HIT
       ----------------------------------------------- */

    if (!upsideDown) {

      lastHitObstacle = item;

      upsideDown = true;

      /*
         Fall back exactly 10 rows,
         or as far as possible if near bottom.
      */

      position =
        Math.min(
          rows.length - 1,
          position + KNOCKBACK_ROWS
        );

      /*
         Center him after the knockdown.
      */

      horizontalPosition = 50;

      placeTortoise();

      collisionCooldownUntil =
        Date.now() + 900;

      setStatus(
        '🙃 OH NO! UPSIDE DOWN!'
      );

      moveCameraToCurrentStreet(true);

      return;
    }


    /* -----------------------------------------------
       UPSIDE-DOWN TORTOISE GETS HIT AGAIN
       ----------------------------------------------- */

    if (upsideDown) {

      /*
         Another object has arrived.
         FLIP!
      */

      upsideDown = false;

      lastHitObstacle = null;

      collisionCooldownUntil =
        Date.now() + 700;

      placeTortoise();

      setStatus(
        '🐢 BACK UP! KEEP GOING!'
      );

      return;
    }
  }
};


/* -----------------------------------------------------
   WIN
   ----------------------------------------------------- */

const winGame = () => {

  gameActive = false;

  clearInterval(timerInterval);

  timerInterval = null;

  if (trafficAnimation) {
    cancelAnimationFrame(trafficAnimation);
    trafficAnimation = null;
  }

  removeTraffic();

  setStatus('🐢 YOU MADE IT!');

  tortoise.style.display = 'block';

  upsideDown = false;

  tortoise.style.transform = 'none';

  placeTortoise();

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};


/* -----------------------------------------------------
   LOSE
   ----------------------------------------------------- */

const loseGame = () => {

  gameActive = false;

  clearInterval(timerInterval);

  timerInterval = null;

  if (trafficAnimation) {
    cancelAnimationFrame(trafficAnimation);
    trafficAnimation = null;
  }

  removeTraffic();

  setStatus('TIME OUT! 🐢');

  tortoise.style.display = 'block';

  upsideDown = false;

  tortoise.style.transform = 'none';

  position = rows.length - 1;

  horizontalPosition = 50;

  placeTortoise();

  window.scrollTo({
    top:
      document.documentElement.scrollHeight,
    behavior: 'smooth'
  });
};


/* -----------------------------------------------------
   START GAME
   ----------------------------------------------------- */

const startGame = () => {

  gameActive = true;

  upsideDown = false;

  lastHitObstacle = null;

  moving = false;

  position = rows.length - 1;

  horizontalPosition = 50;

  tortoise.style.display = 'block';

  tortoise.style.transform = 'none';

  /*
     Put tortoise at bottom before starting.
  */

  placeTortoise();

  /*
     Fresh traffic every time.
  */

  createTraffic();

  setStatus(
    '🐢 GO! REACH THE TOP!'
  );

  /*
     Start timer.
  */

  clearInterval(timerInterval);

  timerInterval =
    setInterval(() => {

      if (!gameActive) return;

      timerSeconds--;

      updateTimerDisplay();

      if (timerSeconds <= 0) {
        loseGame();
      }

    }, 1000);

  /*
     Try to use the currently playing media
     duration when available.
  */

  const media =
    document.querySelector('audio') ||
    document.querySelector('video');

  if (
    media &&
    Number.isFinite(media.duration) &&
    media.duration > 0
  ) {
    timerSeconds =
      Math.ceil(media.duration);
  } else {
    timerSeconds = 180;
  }

  updateTimerDisplay();


  /*
     Start / restart currently playing media.
  */

  if (media) {

    try {
      media.currentTime = 0;
      media.play().catch(() => {});
    } catch (e) {}
  }


  /*
     YouTube iframe support.
  */

  const iframe =
    document.querySelector(
      'iframe[src*="youtube.com"], iframe[src*="youtu.be"]'
    );

  if (iframe) {

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

    } catch (e) {}
  }


  window.scrollTo({
    top:
      document.documentElement.scrollHeight,
    behavior: 'smooth'
  });


  if (trafficAnimation) {
    cancelAnimationFrame(trafficAnimation);
  }

  trafficAnimation =
    requestAnimationFrame(animateTraffic);
};


/* -----------------------------------------------------
   RESTART SONG
   ----------------------------------------------------- */

const restartGame = () => {
  startGame();
};


/* -----------------------------------------------------
   END GAME
   ----------------------------------------------------- */

const endGame = () => {

  gameActive = false;

  clearInterval(timerInterval);

  timerInterval = null;

  if (trafficAnimation) {
    cancelAnimationFrame(trafficAnimation);
    trafficAnimation = null;
  }

  removeTraffic();

  upsideDown = false;

  lastHitObstacle = null;

  moving = false;

  /*
     Put tortoise back at bottom,
     then HIDE him completely.
  */

  position = rows.length - 1;

  horizontalPosition = 50;

  tortoise.style.transform = 'none';

  placeTortoise();

  tortoise.style.display = 'none';

  setStatus('🐢 FROGGER');

  window.scrollTo({
    top:
      document.documentElement.scrollHeight,
    behavior: 'smooth'
  });
};


/* -----------------------------------------------------
   BUTTONS
   ----------------------------------------------------- */

document
  .getElementById('frogger-start')
  .addEventListener('click', startGame);

document
  .getElementById('frogger-restart')
  .addEventListener('click', restartGame);

document
  .getElementById('frogger-end')
  .addEventListener('click', endGame);


/* -----------------------------------------------------
   INITIAL STATE
   ----------------------------------------------------- */

tortoise.style.display = 'none';

updateTimerDisplay();

setStatus('🐢 FROGGER');

};

/* -------------------------------------------------------
INITIALIZE
------------------------------------------------------- */

if (document.readyState === 'loading') {

document.addEventListener(
  'DOMContentLoaded',
  init
);

} else {

init();

}

})();
