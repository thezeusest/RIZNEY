(() => {
  'use strict';

  if (window.__badgerHuntLoaded) return;
  window.__badgerHuntLoaded = true;

  const init = () => {
    const songList =
      document.querySelector('#song-list') ||
      document.querySelector('.song-list');

    if (!songList) return;

    const rows = Array.from(songList.querySelectorAll('.song'));
    if (!rows.length) return;

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
        color: #fff;
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
        font-size: 46px;
        line-height: 1;
        pointer-events: none;
        user-select: none;
        display: none;
        transition: none !important;
        animation: none !important;
        transform-origin: center center;
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
        pointer-events: none;
      }

      .badger-hunt-launched {
        transition:
          left 420ms cubic-bezier(.2,.8,.2,1),
          top 420ms cubic-bezier(.2,.8,.2,1),
          transform 420ms cubic-bezier(.2,.8,.2,1),
          opacity 420ms linear;
        opacity: 0;
      }
    `;

    document.head.appendChild(style);

    if (getComputedStyle(songList).position === 'static') {
      songList.style.position = 'relative';
    }

    const listParent = songList;

    const badger = document.createElement('div');

    badger.id = 'badger-hunt-piece';
    badger.textContent = '🦡';

    listParent.appendChild(badger);

    let gameActive = false;
    let position = rows.length - 1;
    let horizontalPosition = 50;
    let score = 0;
    let timerSeconds = 180;

    let timerInterval = null;
    let animalAnimation = null;

    let moving = false;
    let collisionCooldownUntil = 0;

    let badgerFacing = 1;

    let animals = [];

    const HORIZONTAL_STEP = 12;

    const MIN_X = 8;
    const MAX_X = 92;

    const MOVE_LOCK = 170;

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

    const updateScore = () => {
      const scoreElement =
        document.getElementById('badger-score');

      if (scoreElement) {
        scoreElement.textContent = `SCORE: ${score}`;
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

    const updateBadgerFacing = () => {
      badger.style.transform =
        badgerFacing === 1
          ? 'scaleX(1)'
          : 'scaleX(-1)';
    };

    const placeBadger = () => {
      if (!rows[position]) return;

      const row = rows[position];

      const parentRect =
        listParent.getBoundingClientRect();

      const rowRect =
        row.getBoundingClientRect();

      const badgerRect =
        badger.getBoundingClientRect();

      const badgerWidth =
        badgerRect.width || 46;

      const badgerHeight =
        badgerRect.height || 46;

      const left =
        (listParent.clientWidth *
          horizontalPosition /
          100) -
        (badgerWidth / 2);

      const top =
        rowRect.top -
        parentRect.top +
        (rowRect.height / 2) -
        (badgerHeight / 2);

      badger.style.left = `${left}px`;
      badger.style.top = `${top}px`;

      updateBadgerFacing();
    };

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

    const moveUp = () => {
      if (!gameActive || moving) return;

      if (position <= 0) return;

      moving = true;

      position--;

      placeBadger();

      moveCameraToCurrentLevel();

      if (position <= 0) {
        setTimeout(() => {
          moving = false;
          winGame();
        }, MOVE_LOCK);
        return;
      }

      setTimeout(() => {
        moving = false;
      }, MOVE_LOCK);
    };

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

    const moveLeft = () => {
      if (!gameActive || moving) return;

      moving = true;

      horizontalPosition =
        Math.max(
          MIN_X,
          horizontalPosition - HORIZONTAL_STEP
        );

      badgerFacing = -1;

      placeBadger();

      setTimeout(() => {
        moving = false;
      }, MOVE_LOCK);
    };

    const moveRight = () => {
      if (!gameActive || moving) return;

      moving = true;

      horizontalPosition =
        Math.min(
          MAX_X,
          horizontalPosition + HORIZONTAL_STEP
        );

      badgerFacing = 1;

      placeBadger();

      setTimeout(() => {
        moving = false;
      }, MOVE_LOCK);
    };

    const handleGameTap = (clientX, clientY) => {
      if (!gameActive) return;

      const rect =
        badger.getBoundingClientRect();

      const centerX =
        rect.left + rect.width / 2;

      const centerY =
        rect.top + rect.height / 2;

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

    const createAnimals = () => {
      removeAnimals();

      rows.forEach((row, index) => {

        if (index === rows.length - 1) {
          return;
        }

        if (index % 2 !== 0) {
          return;
        }

        const count =
          Math.random() < 0.30
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

          const speed =
            isScorpion
              ? 0.68 + Math.random() * 0.35
              : 0.34 + Math.random() * 0.34;

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

    const makeAnimalEscape = animal => {
      if (animal.isScorpion) return;

      if (animal.rowIndex !== position) {
        return;
      }

      const distance =
        animal.x - horizontalPosition;

      const dangerDistance = 25;

      if (Math.abs(distance) < dangerDistance) {

        /*
         * Badger is on the LEFT:
         * animal runs RIGHT.
         */

        if (distance > 0) {
          animal.direction = 1;
        }

        /*
         * Badger is on the RIGHT:
         * animal runs LEFT.
         */

        else {
          animal.direction = -1;
        }

        /*
         * Give it a little panic burst.
         */

        animal.speed =
          Math.min(
            1.15,
            animal.speed + 0.025
          );
      }
    };

    const animateAnimals = () => {

      if (!gameActive) {
        animalAnimation = null;
        return;
      }

      animals.forEach(animal => {

        if (animal.caught) return;

        makeAnimalEscape(animal);

        /*
         * Animals move faster than before.
         */

        animal.x +=
          animal.speed *
          animal.direction *
          0.085;

        /*
         * Wrap around the screen.
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

    /*
     * Launch an animal away from
     * the badger instead of eating it.
     */

    const launchAnimal = (
      animal,
      badgerRect,
      animalRect
    ) => {

      const animalCenterX =
        animalRect.left +
        animalRect.width / 2;

      const animalCenterY =
        animalRect.top +
        animalRect.height / 2;

      const badgerCenterX =
        badgerRect.left +
        badgerRect.width / 2;

      const badgerCenterY =
        badgerRect.top +
        badgerRect.height / 2;

      let launchX = 0;
      let launchY = 0;

      const dx =
        animalCenterX -
        badgerCenterX;

      const dy =
        animalCenterY -
        badgerCenterY;

      /*
       * Whichever direction the badger
       * actually hits from determines
       * which way the animal gets launched.
       */

      if (Math.abs(dx) > Math.abs(dy)) {

        if (dx >= 0) {
          launchX = 125;
        } else {
          launchX = -125;
        }

      } else {

        if (dy >= 0) {
          launchY = 125;
        } else {
          launchY = -125;
        }
      }

      animal.element.classList.add(
        'badger-hunt-hit',
        'badger-hunt-launched'
      );

      /*
       * Push it dramatically off-screen.
       */

      animal.element.style.left =
        `${animal.x + launchX}%`;

      /*
       * Vertical launch uses pixels because
       * the animal is positioned within the
       * song list.
       */

      if (launchY !== 0) {
        animal.element.style.top =
          `${parseFloat(animal.element.style.top || '0') + launchY}px`;
      }

      /*
       * Spin while getting knocked away.
       */

      const spin =
        (Math.random() < 0.5 ? -1 : 1) *
        (540 + Math.random() * 540);

      animal.element.style.transform =
        `rotate(${spin}deg) scale(1.15)`;

      setTimeout(() => {
        if (
          animal.element &&
          animal.element.parentNode
        ) {
          animal.element.remove();
        }
      }, 450);
    };

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
          animal.rowIndex !==
          position
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

        /*
         * SCORPION:
         * Absolutely do NOT launch it.
         * It kills the badger.
         */

        if (animal.isScorpion) {
          dieGame();
          return;
        }

        /*
         * NORMAL ANIMAL:
         * Badger knocks it away.
         */

        animal.caught = true;

        score++;

        updateScore();

        collisionCooldownUntil =
          Date.now() + 350;

        launchAnimal(
          animal,
          badgerRect,
          rect
        );

        setStatus('🦡 WHAM! +1');

        return;
      }
    };

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
        '🏆 BADGER WINS!'
      );

      badger.style.display =
        'block';

      placeBadger();

      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    };

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

      badger.style.display =
        'block';

      placeBadger();
    };

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

    const startGame = () => {

      gameActive = true;

      score = 0;

      updateScore();

      position =
        rows.length - 1;

      horizontalPosition = 50;

      badgerFacing = 1;

      moving = false;

      collisionCooldownUntil = 0;

      badger.style.display =
        'block';

      placeBadger();

      createAnimals();

      setStatus(
        '🦡 HUNT!'
      );

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

      updateTimer();

      if (media) {
        try {
          media.currentTime = 0;

          media.play().catch(() => {});
        } catch (e) {}
      }

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

      window.scrollTo({
        top:
          document.documentElement
            .scrollHeight,
        behavior: 'smooth'
      });

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

    const restartGame = () => {
      startGame();
    };

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

      badgerFacing = 1;

      moving = false;

      score = 0;

      updateScore();

      badger.style.display =
        'none';

      setStatus(
        '🦡 BADGER HUNT'
      );

      window.scrollTo({
        top:
          document.documentElement
            .scrollHeight,
        behavior: 'smooth'
      });
    };

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

    badger.style.display =
      'none';

    updateScore();
    updateTimer();

    setStatus(
      '🦡 BADGER HUNT'
    );
  };

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
