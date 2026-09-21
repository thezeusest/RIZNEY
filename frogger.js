/* RIZNEY RHYME CLIMB
   Your song blocks become the levels.
   Hard rhyme = 2 points
   Soft rhyme = 1 point
*/

(() => {
  'use strict';

  if (window.__rhymeClimbLoaded) return;
  window.__rhymeClimbLoaded = true;

  const initRhymeClimb = () => {

    /* -----------------------------------------
       RHYME BANK
       Add more words here later.
       hard = strong/perfect rhymes
       soft = near/slant rhymes
    ----------------------------------------- */

    const rhymeBank = {
      moon: {
        hard: ['tune', 'spoon', 'soon', 'noon', 'June'],
        soft: ['home', 'room', 'boom']
      },

      fire: {
        hard: ['tire', 'wire', 'hire', 'higher'],
        soft: ['far', 'fear', 'fair']
      },

      light: {
        hard: ['night', 'right', 'sight', 'fight', 'bright'],
        soft: ['life', 'like', 'line']
      },

      rain: {
        hard: ['train', 'pain', 'brain', 'chain', 'plane'],
        soft: ['run', 'ring', 'room']
      },

      blue: {
        hard: ['true', 'glue', 'shoe', 'clue', 'flew'],
        soft: ['you', 'new', 'through']
      },

      star: {
        hard: ['car', 'far', 'jar', 'bar'],
        soft: ['heart', 'hard', 'dark']
      },

      dream: {
        hard: ['team', 'cream', 'stream', 'beam'],
        soft: ['dreams', 'green', 'seem']
      },

      night: {
        hard: ['light', 'right', 'fight', 'sight'],
        soft: ['life', 'like', 'line']
      },

      day: {
        hard: ['say', 'way', 'play', 'stay', 'gray'],
        soft: ['time', 'mine', 'name']
      },

      sound: {
        hard: ['round', 'found', 'ground', 'bound'],
        soft: ['song', 'down', 'around']
      },

      song: {
        hard: ['long', 'wrong', 'strong', 'along'],
        soft: ['sound', 'sing', 'gone']
      },

      heart: {
        hard: ['start', 'part', 'cart', 'art'],
        soft: ['hard', 'dark', 'far']
      }
    };


    /* -----------------------------------------
       FIND YOUR SONG LEVELS
    ----------------------------------------- */

    const songs = Array.from(document.querySelectorAll('.song'));

    if (!songs.length) {
      console.warn('Rhyme Climb: no .song elements found.');
      return;
    }


    /* -----------------------------------------
       GAME STATE
    ----------------------------------------- */

    let currentLevel = songs.length - 1;
    let score = 0;
    let started = false;
    let finished = false;
    let timeLeft = 90;
    let timer = null;

    let currentWord = '';
    let currentHard = [];
    let currentSoft = [];


    /* -----------------------------------------
       GAME UI
    ----------------------------------------- */

    const game = document.createElement('section');

    game.id = 'rhyme-climb-game';

    game.innerHTML = `
      <div class="rc-inner">

        <div class="rc-title">🎵 RHYME CLIMB</div>

        <div class="rc-stats">
          <span id="rc-level">LEVEL</span>
          <span id="rc-score">SCORE: 0</span>
          <span id="rc-time">TIME: 90</span>
        </div>

        <div id="rc-word-box">
          <div class="rc-small">RHYME WITH</div>
          <div id="rc-word">READY?</div>
        </div>

        <form id="rc-form">
          <input
            id="rc-input"
            type="text"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            placeholder="type a rhyme..."
          >

          <button id="rc-submit" type="submit">
            ⬆️ CLIMB
          </button>
        </form>

        <div id="rc-message">Get to the top before the song ends!</div>

        <button id="rc-start" type="button">
          START RHYME CLIMB
        </button>

      </div>
    `;


    /* -----------------------------------------
       STYLES
    ----------------------------------------- */

    const style = document.createElement('style');

    style.textContent = `
      #rhyme-climb-game {
        margin: 25px 0;
        padding: 16px;
        background: #120b18;
        border: 2px solid #5d3978;
        border-radius: 14px;
        color: #f4c76b;
        text-align: center;
        font-family: inherit;
      }

      #rhyme-climb-game .rc-inner {
        max-width: 500px;
        margin: auto;
      }

      #rhyme-climb-game .rc-title {
        font-size: 1.35rem;
        font-weight: bold;
        margin-bottom: 10px;
      }

      #rhyme-climb-game .rc-stats {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        font-size: .8rem;
        margin-bottom: 14px;
        color: #ddd;
      }

      #rc-word-box {
        background: #1d1028;
        border: 2px solid #f4c76b;
        border-radius: 12px;
        padding: 18px 10px;
        margin-bottom: 12px;
      }

      #rhyme-climb-game .rc-small {
        font-size: .7rem;
        letter-spacing: 2px;
        color: #aaa;
        margin-bottom: 5px;
      }

      #rc-word {
        font-size: 2.2rem;
        font-weight: bold;
        color: #fff;
        text-transform: uppercase;
      }

      #rc-form {
        display: flex;
        gap: 8px;
        width: 100%;
      }

      #rc-input {
        flex: 1;
        min-width: 0;
        box-sizing: border-box;
        padding: 12px;
        border-radius: 9px;
        border: 2px solid #5d3978;
        background: #09070d;
        color: #fff;
        font-size: 16px;
        text-align: center;
        outline: none;
      }

      #rc-input:focus {
        border-color: #f4c76b;
      }

      #rc-submit,
      #rc-start {
        border: 0;
        border-radius: 9px;
        padding: 12px 14px;
        background: #f4c76b;
        color: #160d1d;
        font-weight: bold;
        cursor: pointer;
      }

      #rc-start {
        margin-top: 12px;
        width: 100%;
      }

      #rc-message {
        min-height: 24px;
        margin-top: 12px;
        font-size: .9rem;
        color: #ddd;
      }

      #rhyme-climb-game.rc-hit #rc-word-box {
        animation: rcPop .18s ease-out;
      }

      @keyframes rcPop {
        50% {
          transform: scale(1.05);
        }
      }

      @media (max-width: 480px) {
        #rc-form {
          flex-direction: column;
        }

        #rc-submit {
          width: 100%;
        }
      }
    `;

    document.head.appendChild(style);


    /* -----------------------------------------
       PUT GAME ABOVE THE SONG LEVELS
    ----------------------------------------- */

    const firstSong = songs[0];

    if (firstSong && firstSong.parentNode) {
      firstSong.parentNode.insertBefore(game, firstSong);
    }


    /* -----------------------------------------
       ELEMENTS
    ----------------------------------------- */

    const wordEl = game.querySelector('#rc-word');
    const levelEl = game.querySelector('#rc-level');
    const scoreEl = game.querySelector('#rc-score');
    const timeEl = game.querySelector('#rc-time');
    const messageEl = game.querySelector('#rc-message');
    const inputEl = game.querySelector('#rc-input');
    const form = game.querySelector('#rc-form');
    const startBtn = game.querySelector('#rc-start');


    /* -----------------------------------------
       PICK RANDOM WORD
    ----------------------------------------- */

    const chooseWord = () => {

      const words = Object.keys(rhymeBank);

      const word = words[Math.floor(Math.random() * words.length)];

      currentWord = word;
      currentHard = rhymeBank[word].hard;
      currentSoft = rhymeBank[word].soft;

      wordEl.textContent = word.toUpperCase();

      inputEl.value = '';
      inputEl.focus();

    };


    /* -----------------------------------------
       UPDATE LEVEL DISPLAY
    ----------------------------------------- */

    const updateLevel = () => {

      const displayLevel = songs.length - currentLevel;

      levelEl.textContent =
        `LEVEL: ${displayLevel}/${songs.length}`;

      scoreEl.textContent =
        `SCORE: ${score}`;

      timeEl.textContent =
        `TIME: ${timeLeft}`;

    };


    /* -----------------------------------------
       MOVE PLAYER UP THE SONG LIST
    ----------------------------------------- */

    const climb = () => {

      if (currentLevel <= 0) {
        winGame();
        return;
      }

      currentLevel--;

      songs[currentLevel].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });

      updateLevel();

      chooseWord();

    };


    /* -----------------------------------------
       CHECK RHYME
    ----------------------------------------- */

    const checkAnswer = (answer) => {

      answer = answer
        .toLowerCase()
        .trim()
        .replace(/[^a-z'-]/g, '');

      if (!answer) {
        messageEl.textContent = 'Type something first 😸';
        return;
      }

      if (currentHard.includes(answer)) {

        score += 2;

        messageEl.textContent =
          '🟢 HARD RHYME! +2';

        game.classList.remove('rc-hit');
        void game.offsetWidth;
        game.classList.add('rc-hit');

        climb();

        return;
      }


      if (currentSoft.includes(answer)) {

        score += 1;

        messageEl.textContent =
          '🟡 SOFT RHYME! +1';

        game.classList.remove('rc-hit');
        void game.offsetWidth;
        game.classList.add('rc-hit');

        climb();

        return;
      }


      messageEl.textContent =
        '❌ Nope! Try another rhyme.';

    };


    /* -----------------------------------------
       SUBMIT ANSWER
    ----------------------------------------- */

    form.addEventListener('submit', (event) => {

      event.preventDefault();

      if (!started || finished) return;

      checkAnswer(inputEl.value);

    });


    /* -----------------------------------------
       START GAME
    ----------------------------------------- */

    const startGame = () => {

      clearInterval(timer);

      currentLevel = songs.length - 1;
      score = 0;
      timeLeft = 90;
      started = true;
      finished = false;

      startBtn.style.display = 'none';

      updateLevel();

      messageEl.textContent =
        'Find a rhyme and climb!';

      chooseWord();

      timer = setInterval(() => {

        timeLeft--;

        updateLevel();

        if (timeLeft <= 0) {
          loseGame();
        }

      }, 1000);

    };


    /* -----------------------------------------
       WIN
    ----------------------------------------- */

    const winGame = () => {

      finished = true;
      started = false;

      clearInterval(timer);

      wordEl.textContent = '🏆 TOP!';

      messageEl.innerHTML =
        `<strong>YOU MADE IT! 😸</strong><br>
         Final score: ${score}`;

      inputEl.disabled = true;

      startBtn.textContent = 'PLAY AGAIN';
      startBtn.style.display = 'block';

    };


    /* -----------------------------------------
       LOSE
    ----------------------------------------- */

    const loseGame = () => {

      finished = true;
      started = false;

      clearInterval(timer);

      timeLeft = 0;
      updateLevel();

      wordEl.textContent = '⏰ TIME!';

      messageEl.innerHTML =
        `You reached level ${songs.length - currentLevel} of ${songs.length}.<br>
         Score: ${score}`;

      inputEl.disabled = true;

      startBtn.textContent = 'TRY AGAIN';
      startBtn.style.display = 'block';

    };


    /* -----------------------------------------
       START BUTTON
    ----------------------------------------- */

    startBtn.addEventListener('click', () => {

      inputEl.disabled = false;

      startGame();

    });


    /* -----------------------------------------
       INITIAL STATE
    ----------------------------------------- */

    form.style.display = 'none';
    wordEl.textContent = 'READY?';
    levelEl.textContent = `LEVEL: 0/${songs.length}`;
    timeEl.textContent = 'TIME: 90';

  };


  /* Wait until the song blocks exist. */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRhymeClimb);
