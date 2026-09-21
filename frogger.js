/* =========================================================
   TORTOISE FROGGER 🐢
   RIZNEY / MEWZING MUSIC PAGE

   FINAL CLEAN VERSION

   🐢 Tortoise ONLY
   🐢 One tap = exactly ONE row
   🐢 NO hop
   🐢 NO bounce
   🐢 NO sliding animation
   🐢 Camera may scroll, but tortoise stays attached to row
   🚗 NO traffic exists before game starts
   🛣️ Bottom row is always safe
   💥 Hit = return to bottom
   📱 Hit = page returns to bottom
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

    let position = rows.length - 1;

    let moving = false;

    let timer = null;

    let timeLeft = 0;

    let songStartedAt = 0;

    /*
      This is NOT an animation.

      It only prevents several taps from being
      registered almost simultaneously.
    */
    const MOVE_LOCK = 220;

    const DEFAULT_SONG_TIME = 180;

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

      Put the controls BEFORE the song list.

      This means the controls are immediately above
      the bottom Frogger street and can be reached
      after the tortoise gets sent back down.
    */

    const songList =
      document.getElementById('song-list');

    if (
      songList &&
      songList.parentNode
    ) {

      songList.parentNode.insertBefore(
        footer,
        songList
      );

    } else {

      document.body.appendChild(
        footer
      );
    }

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
          10px
          10px
          12px;

        margin:
          8px 0 8px;

        background:
          linear-gradient(
            to bottom,
            #120b18,
            #080509
          );

        border:
          2px solid #d69a2d;

        border-radius:
          10px;

        box-shadow:
          0 0 14px
          rgba(0,0,0,.45);

        text-align: center;

        font-family:
          Arial,
          sans-serif;
      }

      #tf-status {
        color:
          #d69a2d;

        font-size:
          12px;

        font-weight:
          bold;

        letter-spacing:
          1px;

        margin-bottom:
          4px;
      }

      #tf-timer {
        color:
          #fff;

        font-size:
          22px;

        font-weight:
          bold;

        margin-bottom:
          7px;

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
          6px;

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
          9px 10px;

        font-size:
          11px;

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
        THE TORTOISE

        IMPORTANT:

        NO transition.
        NO animation.
        NO hop.
        NO bounce.

        It is positioned directly on the song row.
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
          27px;

        line-height:
          1;
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
            9px 7px;

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

    /*
      The tortoise uses document coordinates so that
      normal page scrolling carries it with the row.

      This is what prevents the weird:
      "up two rows → back down one row" appearance.
    */

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
        DIRECT POSITION.

        No transition.
        No timeout.
        No second positioning.

        ONE position = ONE row.
      */

      tortoise.style.left =
        (
          parentRect.width * 0.50
        ) + 'px';

      tortoise.style.top =
        (
          rowRect.top -
          parentRect.top +
          rowRect.height * 0.50
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
        Keep the current street around 72%
        down the screen.

        IMPORTANT:

        We DO NOT reposition the tortoise
        after scrolling.

        The tortoise is attached to the row,
        so the browser naturally scrolls it
        with the page.
      */

      const targetY =
        window.innerHeight * 0.72;

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

      /*
        Directly put tortoise on bottom row.
      */

      placeTortoise();

      /*
        Scroll actual page down.
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
        Flash bottom street.
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
      IMPORTANT:

      createTraffic() is NOT called here.

      Therefore there are ZERO obstacles
      before the game starts.
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

    function createTraffic() {

      /*
        Start completely fresh.
      */

      removeTraffic();

      rows.forEach(
        (row, index) => {

          /*
            Bottom row is always safe.
          */

          if (
            index ===
            rows.length - 1
          ) {
            return;
          }

          /*
            Keep traffic reasonably sparse.
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

            /*
              Start on the row.
            */

            const startingX =
              Math.random() * 100;

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

      /*
        Traffic ONLY moves while active.
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
          Collision.
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

        /*
          Slightly smaller collision box
          so touching the very edge isn't
          an automatic BONK.
        */

        const padding = 7;

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

      /*
        Tiny pause only for the collision message.

        This is NOT tortoise movement animation.
      */

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

      /*
        Top reached.
      */

      if (
        position === 0
      ) {

        winGame();

        return;
      }

      moving = true;

      /*
        THIS IS THE ONLY MOVEMENT:

        One tap.
        One number change.
        Exactly one row.

        No +2.
        No second movement.
        No delayed correction.
      */

      position =
        position - 1;

      /*
        Instantly put tortoise
        on that exact row.
      */

      placeTortoise();

      /*
        Camera follows separately.
      */

      moveCameraToCurrentStreet(
        true
      );

      setStatus(
        '🐢 KEEP GOING!'
      );

      /*
        This only prevents another tap
        for a fraction of a second.

        It does NOT animate the tortoise.
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
       START GAME
       ===================================================== */

    function startGame() {

      active = true;

      gameOver = false;

      moving = false;

      position =
        rows.length - 1;

      /*
        Make absolutely sure
        there is no old traffic.
      */

      removeTraffic();

      /*
        Put tortoise on bottom.
      */

      placeTortoise();

      /*
        Put bottom row + controls
        into view.
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
        NOW traffic is created.

        There was NO traffic before this.
      */

      createTraffic();

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
        Remove traffic completely.
      */

      removeTraffic();

      /*
        Return tortoise to bottom.
      */

      position =
        rows.length - 1;

      placeTortoise();

      /*
        Scroll to bottom where
        the controls are.
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
       TAP ANYWHERE = ONE ROW
       ===================================================== */

    function isInteractiveTarget(target) {

      if (!target) {
        return false;
      }

      return !!target.closest(
        'button, a, input, select, textarea, audio, video, iframe, #tortoise-frogger'
      );
    }

    document.addEventListener(
      'click',
      event => {

        if (
          !active ||
          gameOver
        ) {
          return;
        }

        if (
          isInteractiveTarget(
            event.target
          )
        ) {
          return;
        }

        moveUp();
      },
      true
    );

    /* =====================================================
       TOUCH = ONE ROW
       ===================================================== */

    document.addEventListener(
      'touchend',
      event => {

        if (
          !active ||
          gameOver
        ) {
          return;
        }

        if (
          isInteractiveTarget(
            event.target
          )
        ) {
          return;
        }

        /*
          Do NOT call preventDefault here.

          The page needs to remain scrollable so
          the controls can always be reached.
        */

        moveUp();

      },
      {
        passive: true,
        capture: true
      }
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

    /*
      Bottom row is where the tortoise
      starts.

      NO traffic is created here.
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
