/* =========================================================
   TORTOISE FROGGER 🐢
   RIZNEY / MEWZING MUSIC PAGE

   FOUR-DIRECTION VERSION

   🐢 Above tortoise  = UP
   🐢 Below tortoise  = DOWN
   🐢 Left of tortoise = LEFT
   🐢 Right of tortoise = RIGHT

   🐢 One tap = one movement
   🐢 NO hop
   🐢 NO bounce
   🐢 NO sliding animation
   🚗 Slower / easier traffic
   🚗 No traffic before game starts
   🛣️ Bottom street is always safe
   💥 Hit = return to bottom
   🎵 Timer continues after hit
   🔄 Restart Song = fresh game
   ✕ End Game = everything stops
   ========================================================= */

(() => {
  'use strict';

  if (document.getElementById('tortoise-frogger')) return;

  function init() {

    if (document.getElementById('tortoise-frogger')) return;

    /* =====================================================
       FIND SONG ROWS
       ===================================================== */

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

    /* =====================================================
       GAME STATE
       ===================================================== */

    let active = false;
    let gameOver = false;

    /*
      Vertical position.
      Bottom row = rows.length - 1
      Top row = 0
    */

    let position =
      rows.length - 1;

    /*
      Horizontal position as a percentage
      of the song-list width.

      50 = center.
    */

    let horizontalPosition = 50;

    let moving = false;

    let timer = null;

    let timeLeft = 0;

    let songStartedAt = 0;

    /*
      This is ONLY an input lock.
      It is NOT an animation.
    */

    const MOVE_LOCK = 170;

    const DEFAULT_SONG_TIME = 180;

    /*
      How far the tortoise moves left/right
      with one tap.
    */

    const HORIZONTAL_STEP = 12;

    /*
      Keep the tortoise away from the
      extreme edges.
    */

    const MIN_X = 8;
    const MAX_X = 92;

    /* =====================================================
       FOOTER / CONTROLS
       ===================================================== */

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

        <button id="tf-start" type="button">
          🐢 FROGGER
        </button>

        <button id="tf-restart" type="button">
          🔄 RESTART SONG
        </button>

        <button id="tf-end" type="button">
          ✕ END GAME
        </button>

      </div>
    `;

    /*
      IMPORTANT:

      Controls stay at the VERY BOTTOM
      of the page.
    */

    document.body.appendChild(
      footer
    );

    /* =====================================================
       CSS
       ===================================================== */

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

        margin-top:
          20px;

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

        text-align:
          center;

        font-family:
          Arial,
          sans-serif;
      }

      #tf-status {
        color:
          #d69a2d;

        font-size:
          13px;

        font-weight:
          bold;

        letter-spacing:
          1px;

        margin-bottom:
          5px;
      }

      #tf-timer {
        color:
          #fff;

        font-size:
          24px;

        font-weight:
          bold;

        margin-bottom:
          9px;

        font-variant-numeric:
          tabular-nums;
      }

      #tf-controls {
        display:
          flex;

        justify-content:
          center;

        align-items:
          center;

        gap:
          7px;

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

        No transition.
        No animation.
        It simply appears
        at the new position.
      */

      .tf-tortoise {

        position:
          absolute;

        z-index:
          99990;

        font-size:
          34px;

        line-height:
          1;

        width:
          40px;

        height:
          40px;

        display:
          flex;

        align-items:
          center;

        justify-content:
          center;

        pointer-events:
          none;

        user-select:
          none;

        transform:
          translate(
            -50%,
            -50%
          );

        transition:
          none !important;

        animation:
          none !important;

        filter:
          drop-shadow(
            2px 3px 2px
            rgba(0,0,0,.55)
          );
      }

      .tf-obstacle {

        position:
          absolute;

        z-index:
          20;

        pointer-events:
          none;

        user-select:
          none;

        font-size:
          25px;

        line-height:
          1;

        transform:
          translateY(-50%);
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
            10px 8px;

          font-size:
            10px;
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

    /* =====================================================
       MAKE SONG LIST A POSITIONING AREA
       ===================================================== */

    const listParent =
      rows[0].parentElement;

    if (
      listParent &&
      getComputedStyle(listParent).position ===
        'static'
    ) {

      listParent.style.position =
        'relative';
    }

    /* =====================================================
       TORTOISE
       ===================================================== */

    const tortoise =
      document.createElement('div');

    tortoise.className =
      'tf-tortoise';

    tortoise.textContent =
      '🐢';

    tortoise.setAttribute(
      'aria-hidden',
      'true'
    );

    if (listParent) {

      listParent.appendChild(
        tortoise
      );

    } else {

      document.body.appendChild(
        tortoise
      );
    }

    /* =====================================================
       CONTROLS
       ===================================================== */

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

    /* =====================================================
       HELPERS
       ===================================================== */

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

    /* =====================================================
       PLACE TORTOISE
       ===================================================== */

    function placeTortoise() {

      const row =
        rows[position];

      if (!row || !listParent) {
        return;
      }

      const rowRect =
        row.getBoundingClientRect();

      const parentRect =
        listParent.getBoundingClientRect();

      /*
        Horizontal position.
      */

      tortoise.style.left =
        (
          parentRect.width *
          horizontalPosition /
          100
        ) + 'px';

      /*
        Vertical position.
      */

      tortoise.style.top =
        (
          rowRect.top -
          parentRect.top +
          rowRect.height *
          0.50
        ) + 'px';
    }

    /* =====================================================
       CAMERA
       ===================================================== */

    function moveCameraToCurrentStreet(
      smooth = true
    ) {

      const row =
        rows[position];

      if (!row) return;

      const rect =
        row.getBoundingClientRect();

      /*
        Keep the tortoise toward the lower
        part of the screen.

        The tortoise itself does NOT animate.
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
    }

    /* =====================================================
       RETURN TO BOTTOM
       ===================================================== */

    function sendToBottom() {

      position =
        rows.length - 1;

      horizontalPosition =
        50;

      placeTortoise();

      /*
        Scroll all the way down
        to the footer.
      */

      window.scrollTo({

        top:
          Math.max(
            0,
            document.documentElement.scrollHeight -
            window.innerHeight
          ),

        behavior:
          'smooth'
      });

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

    /* =====================================================
       YOUTUBE RESTART
       ===================================================== */

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
            event:
              'command',

            func:
              'seekTo',

            args:
              [0, true]
          }),

          '*'
        );

        iframe.contentWindow.postMessage(

          JSON.stringify({
            event:
              'command',

            func:
              'playVideo',

            args:
              []
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

    /* =====================================================
       SONG DURATION
       ===================================================== */

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

    /* =====================================================
       TIMER
       ===================================================== */

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

            if (
              !active ||
              gameOver
            ) {
              return;
            }

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

    /* =====================================================
       TRAFFIC
       ===================================================== */

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

    /*
      REMOVE ALL TRAFFIC
    */

    function removeTraffic() {

      traffic.forEach(
        car => {

          if (
            car.element &&
            car.element.parentNode
          ) {

            car.element.remove();
          }
        }
      );

      traffic.length = 0;
    }

    /*
      CREATE TRAFFIC

      This version is deliberately easier:

      - fewer objects
      - slower objects
      - bigger gaps
    */

    function createTraffic() {

      removeTraffic();

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
            Only about 1 out of every
            2 rows gets traffic.

            This makes the game much
            less punishing.
          */

          if (
            index % 2 !== 0 &&
            Math.random() < 0.55
          ) {
            return;
          }

          if (
            getComputedStyle(row).position ===
            'static'
          ) {

            row.style.position =
              'relative';
          }

          /*
            Usually one object.

            Occasionally two.
          */

          const count =
            Math.random() < 0.18
              ? 2
              : 1;

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

            /*
              Start with generous
              spacing.
            */

            const startingX =
              i === 0
                ? Math.random() * 70 + 15
                : Math.random() * 20;

            obstacle.style.left =
              startingX + '%';

            obstacle.style.top =
              '50%';

            const direction =
              i % 2 === 0
                ? 1
                : -1;

            /*
              SLOWER than before.
            */

            const speed =
              0.18 +
              Math.random() *
              0.20;

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

    /* =====================================================
       TRAFFIC ANIMATION
       ===================================================== */

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
              0.055;

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
          Check collision only
          when the tortoise isn't
          currently being moved.
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

    /* =====================================================
       COLLISION
       ===================================================== */

    function checkCollision() {

      /*
        Bottom street is always safe.
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

        /*
          Smaller collision box.
          Makes the game forgiving.
        */

        const padding = 9;

        const hit =
          tortoiseRect.left +
            padding <
            rect.right &&

          tortoiseRect.right -
            padding >
            rect.left &&

          tortoiseRect.top +
            padding <
            rect.bottom &&

          tortoiseRect.bottom -
            padding >
            rect.top;

        if (hit) {
          return true;
        }
      }

      return false;
    }

    /* =====================================================
       HIT
       ===================================================== */

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

    /* =====================================================
       MOVE UP
       ===================================================== */

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

      position =
        position - 1;

      placeTortoise();

      moveCameraToCurrentStreet(
        true
      );

      setStatus(
        '🐢 UP!'
      );

      releaseMovement();
    }

    /* =====================================================
       MOVE DOWN
       ===================================================== */

    function moveDown() {

      if (
        !active ||
        gameOver ||
        moving
      ) {
        return;
      }

      /*
        Don't allow movement beyond
        the bottom street.
      */

      if (
        position >=
        rows.length - 1
      ) {
        return;
      }

      moving = true;

      position =
        position + 1;

      placeTortoise();

      moveCameraToCurrentStreet(
        true
      );

      setStatus(
        '🐢 DOWN!'
      );

      releaseMovement();
    }

    /* =====================================================
       MOVE LEFT
       ===================================================== */

    function moveLeft() {

      if (
        !active ||
        gameOver ||
        moving
      ) {
        return;
      }

      if (
        horizontalPosition <=
        MIN_X
      ) {
        return;
      }

      moving = true;

      horizontalPosition =
        Math.max(
          MIN_X,
          horizontalPosition -
          HORIZONTAL_STEP
        );

      placeTortoise();

      setStatus(
        '🐢 LEFT!'
      );

      releaseMovement();
    }

    /* =====================================================
       MOVE RIGHT
       ===================================================== */

    function moveRight() {

      if (
        !active ||
        gameOver ||
        moving
      ) {
        return;
      }

      if (
        horizontalPosition >=
        MAX_X
      ) {
        return;
      }

      moving = true;

      horizontalPosition =
        Math.min(
          MAX_X,
          horizontalPosition +
          HORIZONTAL_STEP
        );

      placeTortoise();

      setStatus(
        '🐢 RIGHT!'
      );

      releaseMovement();
    }

    /* =====================================================
       MOVEMENT LOCK
       ===================================================== */

    function releaseMovement() {

      /*
        Again:

        This is NOT an animation.

        It simply prevents accidental
        double-taps.
      */

      setTimeout(
        () => {

          moving = false;

          if (
            position === 0
          ) {

            winGame();
          }

        },
        MOVE_LOCK
      );
    }

    /* =====================================================
       DETERMINE DIRECTION FROM TAP
       ===================================================== */

    function handleGameTap(
      clientX,
      clientY
    ) {

      if (
        !active ||
        gameOver ||
        moving
      ) {
        return;
      }

      /*
        Ignore the game footer.
      */

      const footerRect =
        footer.getBoundingClientRect();

      if (
        clientY >= footerRect.top
      ) {
        return;
      }

      /*
        Get tortoise's actual screen
        position.
      */

      const tortoiseRect =
        tortoise.getBoundingClientRect();

      const tortoiseCenterX =
        tortoiseRect.left +
        tortoiseRect.width / 2;

      const tortoiseCenterY =
        tortoiseRect.top +
        tortoiseRect.height / 2;

      const dx =
        clientX -
        tortoiseCenterX;

      const dy =
        clientY -
        tortoiseCenterY;

      /*
        Require a little distance
        so accidentally touching the
        tortoise doesn't cause movement.
      */

      const deadZone = 18;

      if (
        Math.abs(dx) < deadZone &&
        Math.abs(dy) < deadZone
      ) {
        return;
      }

      /*
        Whichever direction is stronger
        determines the movement.

        So:

        TAP ABOVE  → UP
        TAP BELOW  → DOWN
        TAP LEFT   → LEFT
        TAP RIGHT  → RIGHT
      */

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
    }

    /* =====================================================
       START GAME
       ===================================================== */

    function startGame() {

      active = true;

      gameOver = false;

      moving = false;

      position =
        rows.length - 1;

      horizontalPosition =
        50;

      /*
        No old traffic.
      */

      removeTraffic();

      /*
        Put tortoise at bottom center.
      */

      placeTortoise();

      /*
        Bring bottom of page into view.
      */

      window.scrollTo({

        top:
          Math.max(
            0,
            document.documentElement.scrollHeight -
            window.innerHeight
          ),

        behavior:
          'smooth'
      });

      /*
        NOW create traffic.
      */

      createTraffic();

      restartYouTubeSong();

      startTimer();

      setStatus(
        '🐢 GO! REACH THE TOP!'
      );
    }

    /* =====================================================
       WIN
       ===================================================== */

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

    /* =====================================================
       LOSE
       ===================================================== */

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

    /* =====================================================
       END GAME
       ===================================================== */

    function endGame() {

      active = false;

      gameOver = true;

      moving = false;

      stopTimer();

      /*
        Remove all traffic.
      */

      removeTraffic();

      /*
        Return tortoise to bottom center.
      */

      position =
        rows.length - 1;

      horizontalPosition =
        50;

      placeTortoise();

      /*
        Scroll to the actual footer.
      */

      window.scrollTo({

        top:
          Math.max(
            0,
            document.documentElement.scrollHeight -
            window.innerHeight
          ),

        behavior:
          'smooth'
      });

      setStatus(
        '🐢 GAME ENDED'
      );

      setTimer(0);
    }

    /* =====================================================
       BUTTON EVENTS
       ===================================================== */

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

    /* =====================================================
       TOUCH / TAP CONTROLS
       ===================================================== */

    /*
      Use pointer events so one finger tap
      creates ONE movement rather than
      accidentally firing both touch and click.
    */

    document.addEventListener(
      'pointerup',
      event => {

        if (
          !active ||
          gameOver
        ) {
          return;
        }

        const target =
          event.target;

        /*
          Buttons / links / media / footer
          are not game movement.
        */

        if (
          target.closest(
            'button, a, input, select, textarea, audio, video, iframe, #tortoise-frogger'
          )
        ) {
          return;
        }

        /*
          Only primary touch / mouse pointer.
        */

        if (
          event.pointerType === 'mouse' &&
          event.button !== 0
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

    /* =====================================================
       RESIZE
       ===================================================== */

    window.addEventListener(
      'resize',
      () => {

        placeTortoise();

      }
    );

    /* =====================================================
       INITIAL STATE
       ===================================================== */

    position =
      rows.length - 1;

    horizontalPosition =
      50;

    /*
      Tortoise starts at bottom.
      Traffic does NOT exist yet.
    */

    placeTortoise();

    setStatus(
      '🐢 READY — PRESS FROGGER'
    );

    setTimer(0);
  }

  /* =======================================================
     INITIALIZE
     ======================================================= */

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
