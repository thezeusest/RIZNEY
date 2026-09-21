(() => {
  'use strict';

  if (window.__duckDonationLoaded) return;
  window.__duckDonationLoaded = true;

  const init = () => {
    const songList =
      document.querySelector('#song-list') ||
      document.querySelector('.song-list');

    if (!songList) return;

    const rows = Array.from(songList.querySelectorAll('.song'));
    if (!rows.length) return;

    if (getComputedStyle(songList).position === 'static') {
      songList.style.position = 'relative';
    }

    const footer = document.createElement('div');

    footer.id = 'duck-donation-game';

    footer.innerHTML = `
      <div id="duck-status">🦆 DUCK DONATION</div>
      <div id="duck-amount">$0</div>
      <div id="duck-buttons">
        <button id="duck-start">DUCK DONATION</button>
        <button id="duck-restart">RESTART</button>
        <button id="duck-end">END GAME</button>
      </div>
    `;

    document.body.appendChild(footer);

    const style = document.createElement('style');

    style.textContent = `
      #duck-donation-game {
        position: relative;
        width: 100%;
        box-sizing: border-box;
        padding: 14px 10px 22px;
        margin-top: 18px;
        text-align: center;
        z-index: 9999;
      }

      #duck-status {
        color: #f2b84b;
        font-weight: bold;
        font-size: 16px;
        margin-bottom: 4px;
      }

      #duck-amount {
        color: #fff;
        font-size: 22px;
        font-weight: bold;
        margin-bottom: 5px;
      }

      #duck-buttons {
        display: flex;
        justify-content: center;
        gap: 7px;
        flex-wrap: wrap;
        margin-top: 9px;
      }

      #duck-buttons button {
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

      #duck-buttons button:active {
        transform: scale(.96);
      }

      #duck-piece {
        position: absolute;
        z-index: 10000;
        font-size: 43px;
        line-height: 1;
        pointer-events: none;
        user-select: none;
        display: none;
        transition: none !important;
        animation: none !important;
        transform-origin: center center;
      }

      .duck-hazard {
        position: absolute;
        z-index: 9997;
        font-size: 31px;
        line-height: 1;
        pointer-events: none;
        user-select: none;
        transition: none !important;
      }

      .duck-ladder {
        position: absolute;
        z-index: 9995;
        pointer-events: none;
        user-select: none;
        color: #f2b84b;
        font-size: 30px;
        line-height: 1;
        opacity: .85;
      }

      .duck-hit {
        animation: duck-hit-flash .18s linear 3;
      }

      @keyframes duck-hit-flash {
        50% {
          opacity: .25;
        }
      }

      #duck-win {
        color: #f2b84b;
        font-size: 15px;
        font-weight: bold;
        line-height: 1.5;
        margin-top: 7px;
      }
    `;

    document.head.appendChild(style);

    const listParent = songList;

    const duck = document.createElement('div');

    duck.id = 'duck-piece';
    duck.textContent = '🦆';

    listParent.appendChild(duck);

    let gameActive = false;

    let position = rows.length - 1;

    let horizontalPosition = 50;

    let amount = 0;

    let duckFacing = 1;

    let moving = false;

    let hazards = [];

    let hazardAnimation = null;

    let moveCooldown = null;

    const MIN_X = 7;
    const MAX_X = 93;

    const HORIZONTAL_STEP = 12;

    const MOVE_LOCK = 160;

    /*
     * ---------------------------------------------------------
     * STATUS
     * ---------------------------------------------------------
     */

    const setStatus = text => {
      const element =
        document.getElementById('duck-status');

      if (element) {
        element.textContent = text;
      }
    };

    const updateAmount = () => {
      const element =
        document.getElementById('duck-amount');

      if (element) {
        element.textContent =
          `$${amount}`;
      }
    };

    /*
     * ---------------------------------------------------------
     * DUCK FACING
     * ---------------------------------------------------------
     */

    const updateDuckFacing = () => {
      duck.style.transform =
        duckFacing === 1
          ? 'scaleX(1)'
          : 'scaleX(-1)';
    };

    /*
     * ---------------------------------------------------------
     * PLACE DUCK
     * ---------------------------------------------------------
     */

    const placeDuck = () => {
      if (!rows[position]) return;

      const row = rows[position];

      const parentRect =
        listParent.getBoundingClientRect();

      const rowRect =
        row.getBoundingClientRect();

      const duckRect =
        duck.getBoundingClientRect();

      const width =
        duckRect.width || 43;

      const height =
        duckRect.height || 43;

      const left =
        listParent.clientWidth *
        horizontalPosition /
        100 -
        width / 2;

      const top =
        rowRect.top -
        parentRect.top +
        rowRect.height / 2 -
        height / 2;

      duck.style.left =
        `${left}px`;

      duck.style.top =
        `${top}px`;

      updateDuckFacing();
    };

    /*
     * ---------------------------------------------------------
     * LADDERS
     * ---------------------------------------------------------
     */

    const createLadders = () => {

      document
        .querySelectorAll('.duck-ladder')
        .forEach(el => el.remove());

      /*
       * Put a ladder between alternating
       * levels. The ladders intentionally
       * zig-zag so the player has to work
       * across the screen.
       */

      for (
        let i = 1;
        i < rows.length;
        i += 2
      ) {

        if (!rows[i - 1]) continue;

        const lowerRow = rows[i];
        const upperRow = rows[i - 1];

        const lowerRect =
          lowerRow.getBoundingClientRect();

        const upperRect =
          upperRow.getBoundingClientRect();

        const parentRect =
          listParent.getBoundingClientRect();

        const ladder =
          document.createElement('div');

        ladder.className =
          'duck-ladder';

        ladder.textContent = '🪜';

        const side =
          ((i / 2) % 2 === 0)
            ? 28
            : 72;

        const top =
          upperRect.top -
          parentRect.top +
          upperRect.height / 2;

        ladder.style.left =
          `${side}%`;

        ladder.style.top =
          `${top - 18}px`;

        listParent.appendChild(ladder);
      }
    };

    /*
     * ---------------------------------------------------------
     * CAMERA
     * ---------------------------------------------------------
     */

    const moveCamera = () => {

      if (!rows[position]) return;

      const rect =
        rows[position].getBoundingClientRect();

      const target =
        window.scrollY +
        rect.top -
        window.innerHeight * .55;

      window.scrollTo({
        top: Math.max(0, target),
        behavior: 'smooth'
      });
    };

    /*
     * ---------------------------------------------------------
     * MOVEMENT
     * ---------------------------------------------------------
     */

    const finishMove = () => {
      clearTimeout(moveCooldown);

      moveCooldown =
        setTimeout(() => {
          moving = false;
        }, MOVE_LOCK);
    };

    const moveUp = () => {

      if (!gameActive || moving) return;

      if (position <= 0) {
        winGame();
        return;
      }

      moving = true;

      position--;

      placeDuck();

      moveCamera();

      finishMove();

      if (position <= 0) {
        clearTimeout(moveCooldown);

        moveCooldown =
          setTimeout(() => {
            moving = false;
            winGame();
          }, MOVE_LOCK);
      }
    };

    const moveDown = () => {

      if (!gameActive || moving) return;

      if (
        position >=
        rows.length - 1
      ) {
        return;
      }

      moving = true;

      position++;

      placeDuck();

      moveCamera();

      finishMove();
    };

    const moveLeft = () => {

      if (!gameActive || moving) return;

      moving = true;

      horizontalPosition =
        Math.max(
          MIN_X,
          horizontalPosition -
          HORIZONTAL_STEP
        );

      duckFacing = -1;

      placeDuck();

      finishMove();
    };

    const moveRight = () => {

      if (!gameActive || moving) return;

      moving = true;

      horizontalPosition =
        Math.min(
          MAX_X,
          horizontalPosition +
          HORIZONTAL_STEP
        );

      duckFacing = 1;

      placeDuck();

      finishMove();
    };

    /*
     * ---------------------------------------------------------
     * TOUCH CONTROL
     *
     * UP = move toward ladder
     * DOWN = move back
     * LEFT / RIGHT = hop sideways
     *
     * Diagonal tapping naturally chooses
     * the strongest direction.
     * ---------------------------------------------------------
     */

    const handleGameTap = (
      clientX,
      clientY
    ) => {

      if (!gameActive) return;

      const rect =
        duck.getBoundingClientRect();

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

      const deadZone = 16;

      if (
        Math.abs(dx) < deadZone &&
        Math.abs(dy) < deadZone
      ) {
        return;
      }

      if (
        Math.abs(dx) >
        Math.abs(dy)
      ) {

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

        const target =
          event.target;

        if (
          target &&
          target.closest &&
          (
            target.closest(
              '#duck-donation-game'
            ) ||
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

    /*
     * ---------------------------------------------------------
     * HAZARDS
     * ---------------------------------------------------------
     */

    const removeHazards = () => {

      hazards.forEach(hazard => {

        if (
          hazard.element &&
          hazard.element.parentNode
        ) {
          hazard.element.remove();
        }
      });

      hazards = [];
    };

    const createHazards = () => {

      removeHazards();

      rows.forEach((row, index) => {

        /*
         * Don't put hazards on the starting
         * row.
         */

        if (
          index ===
          rows.length - 1
        ) {
          return;
        }

        /*
         * Every other row becomes
         * a Donkey-Kong-style hazard level.
         */

        if (index % 2 !== 0) {
          return;
        }

        const number =
          Math.random() < .45
            ? 2
            : 1;

        for (
          let i = 0;
          i < number;
          i++
        ) {

          const types = [
            '💰',
            '💸',
            '👻'
          ];

          const type =
            types[
              Math.floor(
                Math.random() *
                types.length
              )
            ];

          const element =
            document.createElement('div');

          element.className =
            'duck-hazard';

          element.textContent =
            type;

          const parentRect =
            listParent.getBoundingClientRect();

          const rowRect =
            row.getBoundingClientRect();

          const top =
            rowRect.top -
            parentRect.top +
            rowRect.height / 2 -
            16;

          element.style.top =
            `${top}px`;

          const x =
            10 +
            Math.random() * 80;

          element.style.left =
            `${x}%`;

          listParent.appendChild(
            element
          );

          /*
           * 💰 = rolling barrel
           * 💸 = flying money
           * 👻 = wandering ghost
           */

          let speed;

          if (type === '💰') {
            speed =
              .30 +
              Math.random() * .22;
          } else if (type === '💸') {
            speed =
              .24 +
              Math.random() * .25;
          } else {
            speed =
              .18 +
              Math.random() * .18;
          }

          hazards.push({
            element,
            type,
            rowIndex: index,
            x,
            direction:
              Math.random() < .5
                ? -1
                : 1,
            speed,
            rotation: 0
          });
        }
      });
    };

    /*
     * ---------------------------------------------------------
     * HAZARD ANIMATION
     * ---------------------------------------------------------
     */

    const animateHazards = () => {

      if (!gameActive) {
        hazardAnimation = null;
        return;
      }

      hazards.forEach(hazard => {

        /*
         * Money bag rolls.
         */

        if (hazard.type === '💰') {

          hazard.x +=
            hazard.speed *
            hazard.direction *
            .09;

          hazard.rotation +=
            hazard.direction *
            7;

          hazard.element.style.transform =
            `rotate(${hazard.rotation}deg)`;
        }

        /*
         * Flying money moves a little
         * more freely.
         */

        else if (
          hazard.type === '💸'
        ) {

          hazard.x +=
            hazard.speed *
            hazard.direction *
            .09;

          hazard.element.style.transform =
            `scaleX(${hazard.direction}) rotate(${Math.sin(Date.now() / 180) * 8}deg)`;
        }

        /*
         * Ghost drifts.
         */

        else {

          hazard.x +=
            hazard.speed *
            hazard.direction *
            .07;

          hazard.element.style.transform =
            `translateY(${Math.sin(Date.now() / 220) * 4}px) scaleX(${hazard.direction})`;
        }

        /*
         * Reverse at the edges.
         */

        if (hazard.x > 94) {
          hazard.x = 94;
          hazard.direction = -1;
        }

        if (hazard.x < 6) {
          hazard.x = 6;
          hazard.direction = 1;
        }

        hazard.element.style.left =
          `${hazard.x}%`;
      });

      checkHazardCollisions();

      hazardAnimation =
        requestAnimationFrame(
          animateHazards
        );
    };

    /*
     * ---------------------------------------------------------
     * COLLISIONS
     * ---------------------------------------------------------
     */

    const checkHazardCollisions = () => {

      if (!gameActive) return;

      if (moving) return;

      const duckRect =
        duck.getBoundingClientRect();

      const padding = 7;

      const left =
        duckRect.left + padding;

      const right =
        duckRect.right - padding;

      const top =
        duckRect.top + padding;

      const bottom =
        duckRect.bottom - padding;

      for (const hazard of hazards) {

        if (
          hazard.rowIndex !==
          position
        ) {
          continue;
        }

        const rect =
          hazard.element
            .getBoundingClientRect();

        const hit =
          rect.right > left &&
          rect.left < right &&
          rect.bottom > top &&
          rect.top < bottom;

        if (!hit) continue;

        /*
         * JACKPOT.
         *
         * Every collision adds exactly
         * one dollar to the joke donation.
         */

        amount++;

        updateAmount();

        /*
         * Flash the duck.
         */

        duck.classList.remove(
          'duck-hit'
        );

        void duck.offsetWidth;

        duck.classList.add(
          'duck-hit'
        );

        /*
         * Bounce the hazard away a little
         * so one collision isn't counted
         * repeatedly.
         */

        hazard.direction *= -1;

        hazard.x +=
          hazard.direction * 8;

        setStatus(
          `💸 OOPS! +$1`
        );

        return;
      }
    };

    /*
     * ---------------------------------------------------------
     * WIN
     * ---------------------------------------------------------
     */

    const winGame = () => {

      if (!gameActive) return;

      gameActive = false;

      if (hazardAnimation) {
        cancelAnimationFrame(
          hazardAnimation
        );

        hazardAnimation = null;
      }

      removeHazards();

      duck.style.display =
        'block';

      placeDuck();

      setStatus(
        '🦆 YOU MADE IT!'
      );

      const oldWin =
        document.getElementById(
          'duck-win'
        );

      if (oldWin) {
        oldWin.remove();
      }

      const message =
        document.createElement('div');

      message.id =
        'duck-win';

      if (amount === 0) {

        message.innerHTML =
          `You somehow made it untouched. 😂<br>` +
          `Suggested donation: <strong>$0</strong>`;

      } else {

        message.innerHTML =
          `The duck recommends a donation of ` +
          `<strong>$${amount}</strong>. 😸<br>` +
          `<small>That's just the game's completely made-up math.</small>`;
      }

      footer.appendChild(message);

      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    };

    /*
     * ---------------------------------------------------------
     * START
     * ---------------------------------------------------------
     */

    const startGame = () => {

      gameActive = true;

      amount = 0;

      position =
        rows.length - 1;

      horizontalPosition = 50;

      duckFacing = 1;

      moving = false;

      updateAmount();

      const oldWin =
        document.getElementById(
          'duck-win'
        );

      if (oldWin) {
        oldWin.remove();
      }

      duck.style.display =
        'block';

      placeDuck();

      createLadders();

      createHazards();

      setStatus(
        '🦆 GET THAT DUCK UP THERE!'
      );

      window.scrollTo({
        top:
          document.documentElement
            .scrollHeight,
        behavior: 'smooth'
      });

      if (hazardAnimation) {
        cancelAnimationFrame(
          hazardAnimation
        );
      }

      hazardAnimation =
        requestAnimationFrame(
          animateHazards
        );
    };

    /*
     * ---------------------------------------------------------
     * RESTART
     * ---------------------------------------------------------
     */

    const restartGame = () => {
      startGame();
    };

    /*
     * ---------------------------------------------------------
     * END
     * ---------------------------------------------------------
     */

    const endGame = () => {

      gameActive = false;

      if (hazardAnimation) {
        cancelAnimationFrame(
          hazardAnimation
        );

        hazardAnimation = null;
      }

      removeHazards();

      document
        .querySelectorAll(
          '.duck-ladder'
        )
        .forEach(el => el.remove());

      position =
        rows.length - 1;

      horizontalPosition = 50;

      duckFacing = 1;

      moving = false;

      amount = 0;

      updateAmount();

      duck.style.display =
        'none';

      const oldWin =
        document.getElementById(
          'duck-win'
        );

      if (oldWin) {
        oldWin.remove();
      }

      setStatus(
        '🦆 DUCK DONATION'
      );

      window.scrollTo({
        top:
          document.documentElement
            .scrollHeight,
        behavior: 'smooth'
      });
    };

    /*
     * ---------------------------------------------------------
     * BUTTONS
     * ---------------------------------------------------------
     */

    document
      .getElementById('duck-start')
      .addEventListener(
        'click',
        startGame
      );

    document
      .getElementById('duck-restart')
      .addEventListener(
        'click',
        restartGame
      );

    document
      .getElementById('duck-end')
      .addEventListener(
        'click',
        endGame
      );

    /*
     * ---------------------------------------------------------
     * INITIAL STATE
     * ---------------------------------------------------------
     */

    duck.style.display =
      'none';

    updateAmount();

    setStatus(
      '🦆 DUCK DONATION'
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
