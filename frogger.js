/* =========================================================
BADGER HUNT 🦡

- Badger starts hidden until game starts
- Song rows are the levels
- Tap above = up
- Tap below = down
- Tap left = left
- Tap right = right
- Animals move across the rows at different speeds
- Touch animal = +1 point
- Animal flips upside down and disappears
- Scorpion 🦂 = instant death
- Scorpions move faster than normal animals
- Reach the top = WIN
- Timer follows the song when possible
- Bottom controls
  ========================================================= */

(() => {
'use strict';

if (window.__badgerHuntLoaded) return;
window.__badgerHuntLoaded = true;

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

footer.id = 'badger-hunt';

footer.innerHTML = `
  <div id="badger-status">🦡 BADGER HUNT</div>
  <div id="badger-score">SCORE: 0</div>
  <div id="badger-timer">TIME: --:--</div>

  <div id="badger-buttons">
    <button id="badger-start">BADGER HUNT</button>
    <button id="badger-restart">RESTART SONG</button>
    <button id="badger-end">END GAME</button>
  </div>
`;

document.body.appendChild(footer);


/* -----------------------------------------------------
   STYLES
   ----------------------------------------------------- */

const style = document.createElement('style');

style.textContent = `
  #badger-hunt {
    position: relative;
    width: 100%;
    box-sizing: border-box;
    padding: 14px 10px 22px;
    margin-top: 18px;
    text-align: center;
    z-index: 9999;
  }

  #badger-status {
    color: #f2b84b;
    font-weight: bold;
    font-size: 16px;
    margin-bottom: 4px;
  }

  #badger-score,
  #badger-timer {
    color: #ffffff;
    font-size: 14px;
    margin-bottom: 4px;
  }

  #badger-buttons {
    display: flex;
    justify-content: center;
    gap: 7px;
    flex-wrap: wrap;
    margin-top: 9px;
  }

  #badger-buttons button {
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

  #badger-buttons button:active {
    transform: scale(.96);
  }

  #badger-hunt-piece {
    position: absolute;
    z-index: 9998;

    font-size: 31px;
    line-height: 1;

    pointer-events: none;
    user-select: none;

    display: none;

    transition: none !important;
    animation: none !important;
  }

  .badger-hunt-animal {
    position: absolute;
    z-index: 9997;

    font-size: 27px;
    line-height: 1;

    pointer-events: none;
    user-select: none;
  }

  .badger-hunt-hit {
    transform: rotate(180deg);
    opacity: 0;
    transition:
      transform 260ms linear,
      opacity 260ms linear;
  }
`;

document.head.appendChild(style);


/* -----------------------------------------------------
   POSITIONING
   ----------------------------------------------------- */

if (getComputedStyle(songList).position === 'static') {
  songList.style.position = 'relative';
}

const listParent = songList;


/* -----------------------------------------------------
   BADGER
   ----------------------------------------------------- */

const badger = document.createElement('div');

badger.id = 'badger-hunt-piece';
badger.textContent = '🦡';

listParent.appendChild(badger);


/* -----------------------------------------------------
   GAME STATE
   ----------------------------------------------------- */

let gameActive = false;

let position = rows.length - 1;

let horizontalPosition = 50;

let score = 0;

let timerSeconds = 180;

let timerInterval = null;

let animalAnimation = null;

let moving = false;

let collisionCooldownUntil = 0;

let animals = [];


const HORIZONTAL_STEP = 12;

const MIN_X = 8;

const MAX_X = 92;

const MOVE_LOCK = 170;


/* -----------------------------------------------------
   ANIMALS
   ----------------------------------------------------- */

const ANIMALS = [
  '🐿️',
  '🦔',
  '🐁',
  '🐍',
  '🦜',
  '🦀',
  '🦆',
  '🦉',
  '🐤',
  '🐣'
];

const SCORPION = '🦂';


/* -----------------------------------------------------
   HELPERS
   ----------------------------------------------------- */

const formatTime = seconds => {

  seconds = Math.max(
    0,
    Math.floor(seconds)
  );

  const minutes =
    Math.floor(seconds / 60);

  const secs =
    seconds % 60;

  return (
    String(minutes).padStart(2, '0') +
    ':' +
    String(secs).padStart(2, '0')
  );
};


const updateScore = () => {

  const scoreElement =
    document.getElementById('badger-score');

  if (scoreElement) {
    scoreElement.textContent =
      `SCORE: ${score}`;
  }
};


const updateTimer = () => {

  const timerElement =
    document.getElementById('badger-timer');

  if (timerElement) {
    timerElement.textContent =
      `TIME: ${formatTime(timerSeconds)}`;
  }
};


const setStatus = text => {

  const status =
    document.getElementById('badger-status');

  if (status) {
    status.textContent = text;
  }
};


/* -----------------------------------------------------
   PLACE BADGER
   ----------------------------------------------------- */

const placeBadger = () => {

  if (!rows[position]) return;

  const row = rows[position];

  const parentRect =
    listParent.getBoundingClientRect();

  const rowRect =
    row.getBoundingClientRect();

  const badgerWidth =
    badger.getBoundingClientRect().width || 31;

  const left =
    (listParent.clientWidth *
      horizontalPosition / 100) -
    (badgerWidth / 2);

  const top =
    rowRect.top -
    parentRect.top +
    (rowRect.height / 2) -
    16;

  badger.style.left =
    `${left}px`;

  badger.style.top =
    `${top}px`;
};


/* -----------------------------------------------------
   CAMERA
   ----------------------------------------------------- */

const moveCameraToCurrentLevel = () => {

  if (!rows[position]) return;

  const rect =
    rows[position].getBoundingClientRect();

  const targetY =
    window.scrollY +
    rect.top -
    window.innerHeight * 0.55;

  window.scrollTo({
    top: Math.max(0, targetY),
    behavior: 'smooth'
  });
};


/* -----------------------------------------------------
   MOVE UP
   ----------------------------------------------------- */

const moveUp = () => {

  if (!gameActive || moving) return;

  if (position <= 0) return;

  moving = true;

  position--;

  placeBadger();

  moveCameraToCurrentLevel();

  setTimeout(() => {
    moving = false;
  }, MOVE_LOCK);
};


/* -----------------------------------------------------
   MOVE DOWN
   ----------------------------------------------------- */

const moveDown = () => {

  if (!gameActive || moving) return;

  if (position >= rows.length - 1) return;

  moving = true;

  position++;

  placeBadger();

  moveCameraToCurrentLevel();

  setTimeout(() => {
    moving = false;
  }, MOVE_LOCK);
};


/* -----------------------------------------------------
   MOVE LEFT
   ----------------------------------------------------- */

const moveLeft = () => {

  if (!gameActive || moving) return;

  moving = true;

  horizontalPosition =
    Math.max(
      MIN_X,
      horizontalPosition -
      HORIZONTAL_STEP
    );

  placeBadger();

  setTimeout(() => {
    moving = false;
  }, MOVE_LOCK);
};


/* -----------------------------------------------------
   MOVE RIGHT
   ----------------------------------------------------- */

const moveRight = () => {

  if (!gameActive || moving) return;

  moving = true;

  horizontalPosition =
    Math.min(
      MAX_X,
      horizontalPosition +
      HORIZONTAL_STEP
    );

  placeBadger();

  setTimeout(() => {
    moving = false;
  }, MOVE_LOCK);
};


/* -----------------------------------------------------
   FOUR-DIRECTION TAP CONTROL
   ----------------------------------------------------- */

const handleGameTap =
  (clientX, clientY) => {

  if (!gameActive) return;

  const rect =
    badger.getBoundingClientRect();

  const centerX =
    rect.left +
    rect.width / 2;

  const centerY =
    rect.top +
    rect.height / 2;

  const dx =
    clientX - centerX;

  const dy =
    clientY - centerY;

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
   PAGE TAP
   ----------------------------------------------------- */

document.addEventListener(
  'pointerup',
  event => {

    if (!gameActive) return;

    const target = event.target;

    if (
      target &&
      target.closest &&
      (
        target.closest('#badger-hunt') ||
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
   REMOVE ANIMALS
   ----------------------------------------------------- */

const removeAnimals = () => {

  animals.forEach(animal => {

    if (
      animal.element &&
      animal.element.parentNode
    ) {
      animal.element.remove();
    }
  });

  animals = [];
};


/* -----------------------------------------------------
   CREATE ANIMALS
   ----------------------------------------------------- */

const createAnimals = () => {

  removeAnimals();

  rows.forEach((row, index) => {

    /*
       Bottom row is safe.

       Not every row gets animals.
       This keeps the game playable.
    */

    if (index === rows.length - 1) {
      return;
    }

    if (index % 2 !== 0) {
      return;
    }


    /*
       Usually one animal.
       Occasionally two.
    */

    const count =
      Math.random() < 0.22
        ? 2
        : 1;


    for (let i = 0; i < count; i++) {

      const isScorpion =
        Math.random() < 0.12;

      const emoji =
        isScorpion
          ? SCORPION
          : ANIMALS[
              Math.floor(
                Math.random() *
                ANIMALS.length
              )
            ];


      const element =
        document.createElement('div');

      element.className =
        'badger-hunt-animal';

      element.textContent = emoji;


      const parentRect =
        listParent.getBoundingClientRect();

      const rowRect =
        row.getBoundingClientRect();

      const rowTop =
        rowRect.top -
        parentRect.top +
        rowRect.height / 2 -
        14;

      element.style.top =
        `${rowTop}px`;


      let x =
        Math.random() * 100;

      element.style.left =
        `${x}%`;

      listParent.appendChild(element);


      /*
         Different speeds.

         Normal animals:
         0.16 - 0.42

         Scorpion:
         0.42 - 0.68

         So the scorpion is
         noticeably faster.
      */

      const speed =
        isScorpion
          ? 0.42 +
            Math.random() * 0.26
          : 0.16 +
            Math.random() * 0.26;


      animals.push({
        element,
        rowIndex: index,
        x,
        direction:
          Math.random() < 0.5
            ? 1
            : -1,
        speed,
        isScorpion,
        caught: false
      });
    }
  });
};


/* -----------------------------------------------------
   ANIMAL MOVEMENT
   ----------------------------------------------------- */

const animateAnimals = () => {

  if (!gameActive) {

    animalAnimation = null;

    return;
  }


  animals.forEach(animal => {

    if (animal.caught) return;


    /*
       Scorpions are faster.
    */

    animal.x +=
      animal.speed *
      animal.direction *
      0.065;


    /*
       Wrap around the screen.
    */

    if (animal.x > 105) {
      animal.x = -5;
    }

    if (animal.x < -5) {
      animal.x = 105;
    }


    animal.element.style.left =
      `${animal.x}%`;
  });


  checkAnimalCollisions();


  animalAnimation =
    requestAnimationFrame(
      animateAnimals
    );
};


/* -----------------------------------------------------
   COLLISION CHECK
   ----------------------------------------------------- */

const checkAnimalCollisions = () => {

  if (!gameActive) return;

  if (moving) return;

  if (
    Date.now() <
    collisionCooldownUntil
  ) {
    return;
  }


  const badgerRect =
    badger.getBoundingClientRect();


  /*
     Smaller hit box makes normal animals
     easier to catch.
  */

  const padding = 7;

  const left =
    badgerRect.left + padding;

  const right =
    badgerRect.right - padding;

  const top =
    badgerRect.top + padding;

  const bottom =
    badgerRect.bottom - padding;


  for (const animal of animals) {

    if (animal.caught) continue;

    if (
      animal.rowIndex !== position
    ) {
      continue;
    }


    const rect =
      animal.element.getBoundingClientRect();


    const hit =
      rect.right > left &&
      rect.left < right &&
      rect.bottom > top &&
      rect.top < bottom;


    if (!hit) continue;


    /* ---------------------------------------------
       SCORPION
       --------------------------------------------- */

    if (animal.isScorpion) {

      dieGame();

      return;
    }


    /* ---------------------------------------------
       NORMAL ANIMAL
       --------------------------------------------- */

    animal.caught = true;

    score++;

    updateScore();

    collisionCooldownUntil =
      Date.now() + 300;


    /*
       Flip upside down.
    */

    animal.element.classList.add(
      'badger-hunt-hit'
    );


    /*
       Remove after the flip/fall.
    */

    setTimeout(() => {

      if (
        animal.element &&
        animal.element.parentNode
      ) {
        animal.element.remove();
      }

    }, 300);


    setStatus(
      `🦡 GOT IT! +1`
    );


    /*
       Only catch one thing per collision frame.
    */

    return;
  }
};


/* -----------------------------------------------------
   WIN
   ----------------------------------------------------- */

const winGame = () => {

  gameActive = false;

  clearInterval(timerInterval);

  timerInterval = null;


  if (animalAnimation) {

    cancelAnimationFrame(
      animalAnimation
    );

    animalAnimation = null;
  }


  removeAnimals();


  setStatus(
    `🏆 BADGER WINS!`
  );


  badger.style.display =
    'block';


  placeBadger();


  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};


/* -----------------------------------------------------
   DEATH
   ----------------------------------------------------- */

const dieGame = () => {

  gameActive = false;

  clearInterval(timerInterval);

  timerInterval = null;


  if (animalAnimation) {

    cancelAnimationFrame(
      animalAnimation
    );

    animalAnimation = null;
  }


  removeAnimals();


  setStatus(
    '🦂 STUNG! GAME OVER!'
  );


  /*
     Keep badger visible so the player
     knows where they died.
  */

  badger.style.display =
    'block';


  placeBadger();
};


/* -----------------------------------------------------
   TIME OUT
   ----------------------------------------------------- */

const timeOut = () => {

  gameActive = false;

  clearInterval(timerInterval);

  timerInterval = null;


  if (animalAnimation) {

    cancelAnimationFrame(
      animalAnimation
    );

    animalAnimation = null;
  }


  removeAnimals();


  setStatus(
    '⏰ TIME OUT!'
  );


  badger.style.display =
    'block';


  placeBadger();
};


/* -----------------------------------------------------
   START GAME
   ----------------------------------------------------- */

const startGame = () => {

  gameActive = true;

  score = 0;

  updateScore();


  position =
    rows.length - 1;

  horizontalPosition = 50;

  moving = false;

  collisionCooldownUntil = 0;


  badger.style.display =
    'block';


  placeBadger();


  createAnimals();


  setStatus(
    '🦡 HUNT!'
  );


  /*
     Find current media.
  */

  const media =
    document.querySelector('audio') ||
    document.querySelector('video');


  /*
     Determine timer.
  */

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


  updateTimer();


  /*
     Restart local media.
  */

  if (media) {

    try {

      media.currentTime = 0;

      media.play().catch(
        () => {}
      );

    } catch (e) {}
  }


  /*
     Try YouTube.
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


  /*
     Timer.
  */

  clearInterval(timerInterval);


  timerInterval =
    setInterval(() => {

      if (!gameActive) return;

      timerSeconds--;

      updateTimer();


      if (timerSeconds <= 0) {

        timeOut();
      }

    }, 1000);


  /*
     Scroll to bottom.
  */

  window.scrollTo({
    top:
      document.documentElement.scrollHeight,
    behavior: 'smooth'
  });


  /*
     Start animal movement.
  */

  if (animalAnimation) {

    cancelAnimationFrame(
      animalAnimation
    );
  }


  animalAnimation =
    requestAnimationFrame(
      animateAnimals
    );
};


/* -----------------------------------------------------
   RESTART
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


  if (animalAnimation) {

    cancelAnimationFrame(
      animalAnimation
    );

    animalAnimation = null;
  }


  removeAnimals();


  position =
    rows.length - 1;

  horizontalPosition = 50;

  moving = false;

  score = 0;

  updateScore();


  /*
     Hide badger completely.
  */

  badger.style.display =
    'none';


  setStatus(
    '🦡 BADGER HUNT'
  );


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
  .getElementById('badger-start')
  .addEventListener(
    'click',
    startGame
  );


document
  .getElementById('badger-restart')
  .addEventListener(
    'click',
    restartGame
  );


document
  .getElementById('badger-end')
  .addEventListener(
    'click',
    endGame
  );


/* -----------------------------------------------------
   INITIAL STATE
   ----------------------------------------------------- */

badger.style.display =
  'none';

updateScore();

updateTimer();

setStatus(
  '🦡 BADGER HUNT'
);

};

/* -------------------------------------------------------
INITIALIZE
------------------------------------------------------- */

if (
document.readyState === 'loading'
) {

document.addEventListener(
  'DOMContentLoaded',
  init
);

} else {

init();

}

})();
