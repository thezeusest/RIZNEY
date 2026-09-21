<!-- =========================================================
     RHYME CLIMB
     First test version using pronouncingjs
     ========================================================= -->

<style>
  #rhyme-climb-game {
    margin: 24px auto;
    max-width: 560px;
    padding: 18px;
    border: 2px solid #5b2b75;
    border-radius: 16px;
    background: #120b18;
    color: #f3d18a;
    text-align: center;
    box-sizing: border-box;
  }

  #rhyme-climb-game h2 {
    margin: 0 0 8px;
    font-size: 1.35rem;
  }

  #rhyme-climb-game .rhyme-word {
    font-size: 2.2rem;
    font-weight: bold;
    margin: 12px 0;
  }

  #rhyme-climb-game .rhyme-status {
    min-height: 28px;
    margin: 10px 0;
    font-weight: bold;
  }

  #rhyme-climb-game input {
    width: 100%;
    box-sizing: border-box;
    padding: 13px;
    border-radius: 10px;
    border: 1px solid #70408d;
    background: #1d1028;
    color: white;
    font-size: 17px;
    text-align: center;
    margin-bottom: 10px;
  }

  #rhyme-climb-game button {
    width: 100%;
    padding: 13px;
    border: 0;
    border-radius: 10px;
    background: #d69a32;
    color: #160d1c;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
  }

  #rhyme-climb-game button:disabled {
    opacity: 0.5;
    cursor: default;
  }

  #rhyme-climb-tortoise {
    font-size: 42px;
    margin: 8px 0;
    transition: transform 0.25s ease;
  }

  #rhyme-climb-tortoise.climb {
    transform: translateY(-8px);
  }

  #rhyme-climb-launch {
    margin: 30px auto;
    max-width: 560px;
    padding: 14px;
    text-align: center;
  }

  #rhyme-climb-start {
    width: 100%;
    padding: 15px;
    border: 0;
    border-radius: 12px;
    background: #d69a32;
    color: #160d1c;
    font-size: 17px;
    font-weight: bold;
    cursor: pointer;
  }
</style>

<!-- Game interface -->
<div id="rhyme-climb-game" style="display:none;">
  <h2>🐢 RHYME CLIMB</h2>

  <div id="rhyme-climb-level">Level: 1</div>

  <div id="rhyme-climb-tortoise">🐢</div>

  <div>Find a word that rhymes with:</div>

  <div class="rhyme-word" id="rhyme-climb-word">MOON</div>

  <form id="rhyme-climb-form">
    <input
      id="rhyme-climb-input"
      type="text"
      autocomplete="off"
      autocapitalize="none"
      spellcheck="false"
      placeholder="Type your rhyme..."
    >

    <button type="submit">CLIMB 🐢</button>
  </form>

  <div
    id="rhyme-climb-status"
    class="rhyme-status"
    aria-live="polite"
  ></div>

  <button
    id="rhyme-climb-next"
    type="button"
    style="display:none;"
  >
    NEXT RHYME
  </button>
</div>

<!-- This stays at the bottom/footer of the page -->
<div id="rhyme-climb-launch">
  <button id="rhyme-climb-start" type="button">
    🐢 START RHYME CLIMB
  </button>
</div>

<!-- pronouncingjs browser library -->
<script src="https://cdn.jsdelivr.net/gh/aparrish/pronouncingjs@master/build/pronouncing-browser.js"></script>

<script>
(() => {
  "use strict";

  const startButton = document.getElementById("rhyme-climb-start");
  const game = document.getElementById("rhyme-climb-game");
  const form = document.getElementById("rhyme-climb-form");
  const input = document.getElementById("rhyme-climb-input");
  const wordDisplay = document.getElementById("rhyme-climb-word");
  const status = document.getElementById("rhyme-climb-status");
  const levelDisplay = document.getElementById("rhyme-climb-level");
  const tortoise = document.getElementById("rhyme-climb-tortoise");

  let songs = [];
  let currentLevel = 0;
  let targetWord = "";

  /*
    Common words only.

    The dictionary itself is much larger, but we don't want
    the game randomly choosing weird names or obscure words.
  */
  const targetWords = [
    "moon",
    "light",
    "night",
    "dream",
    "heart",
    "fire",
    "rain",
    "blue",
    "star",
    "day",
    "sound",
    "song",
    "love",
    "time",
    "road",
    "home",
    "sky",
    "stone",
    "sea",
    "tree",
    "green",
    "gold",
    "dream",
    "dance",
    "face",
    "place",
    "run",
    "fun",
    "way",
    "play"
  ];

  function getSongs() {
    return Array.from(document.querySelectorAll(".song"));
  }

  function randomTargetWord() {
    const usable = targetWords.filter(word => {
      if (
        typeof window.pronouncing === "undefined" ||
        typeof window.pronouncing.rhymes !== "function"
      ) {
        return true;
      }

      return window.pronouncing.rhymes(word).length > 0;
    });

    const pool = usable.length ? usable : targetWords;

    return pool[Math.floor(Math.random() * pool.length)];
  }

  function showLevel() {
    levelDisplay.textContent =
      "Level: " + (currentLevel + 1) + " / " + songs.length;

    const currentSong = songs[currentLevel];

    if (currentSong) {
      currentSong.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }
  }

  function newRhyme() {
    targetWord = randomTargetWord();

    wordDisplay.textContent = targetWord.toUpperCase();

    input.value = "";
    input.focus();

    status.textContent = "";
  }

  function animateTortoise() {
    tortoise.classList.remove("climb");

    /*
      Force a browser reflow so the animation can restart.
    */
    void tortoise.offsetWidth;

    tortoise.classList.add("climb");

    setTimeout(() => {
      tortoise.classList.remove("climb");
    }, 300);
  }

  function moveUp(amount) {
    currentLevel += amount;

    if (currentLevel >= songs.length - 1) {
      currentLevel = songs.length - 1;
      showLevel();

      status.textContent = "🏁 YOU REACHED THE TOP! 🐢";
      input.disabled = true;

      return;
    }

    showLevel();
    animateTortoise();

    setTimeout(() => {
      newRhyme();
    }, 300);
  }

  function checkRhyme(answer) {
    if (!answer) {
      status.textContent = "Type a word first 😸";
      return;
    }

    if (
      typeof window.pronouncing === "undefined" ||
      typeof window.pronouncing.rhymes !== "function"
    ) {
      status.textContent =
        "The rhyme dictionary hasn't loaded yet. Try again.";
      return;
    }

    const cleanAnswer = answer
      .toLowerCase()
      .replace(/[^a-z']/g, "")
      .trim();

    const cleanTarget = targetWord.toLowerCase();

    if (!cleanAnswer) {
      status.textContent = "Type a word first 😸";
      return;
    }

    if (cleanAnswer === cleanTarget) {
      status.textContent =
        "😸 That's the same word! Try an actual rhyme.";
      return;
    }

    const perfectRhymes =
      window.pronouncing.rhymes(cleanTarget) || [];

    const isPerfect = perfectRhymes.includes(cleanAnswer);

    if (isPerfect) {
      status.textContent =
        "✨ PERFECT RHYME! +2 LEVELS";

      moveUp(2);
      return;
    }

    /*
      First version of "soft rhyme":

      If the player's word is in the dictionary and shares
      the final few sounds with the target, we'll give it
      a softer one-level climb.

      This is intentionally forgiving for now.
    */

    const targetPhones =
      window.pronouncing.phonesForWord(cleanTarget);

    const answerPhones =
      window.pronouncing.phonesForWord(cleanAnswer);

    if (
      targetPhones.length &&
      answerPhones.length
    ) {
      const target = targetPhones[0]
        .split(" ")
        .slice(-3)
        .join(" ");

      const answer = answerPhones[0]
        .split(" ")
        .slice(-3)
        .join(" ");

      if (
        target === answer ||
        targetPhones[0].split(" ").slice(-2).join(" ") ===
        answerPhones[0].split(" ").slice(-2).join(" ")
      ) {
        status.textContent =
          "😸 CLOSE RHYME! +1 LEVEL";

        moveUp(1);
        return;
      }
    }

    status.textContent =
      "🐢 Nope! Try another rhyme.";
  }

  startButton.addEventListener("click", () => {
    songs = getSongs();

    if (!songs.length) {
      alert(
        "I couldn't find any .song blocks on this page yet."
      );
      return;
    }

    currentLevel = songs.length - 1;

    game.style.display = "block";

    input.disabled = false;

    showLevel();
    newRhyme();

    game.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  });

  form.addEventListener("submit", event => {
    event.preventDefault();

    checkRhyme(input.value);
  });

})();
</script>
