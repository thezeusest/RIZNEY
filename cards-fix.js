/* Cards behavior enhancements for the Rizney music player. */
(() => {
  "use strict";

  function setupCards() {
    const button = document.querySelector("#draw-cards");
    const reading = document.querySelector("#reading");
    const playerDock = document.querySelector(".player-dock");
    const controls = document.querySelector(".controls");
    if (!button || !reading || button.dataset.cardsEnhancementBound) return;
    button.dataset.cardsEnhancementBound = "true";

    const scrollToReading = () => {
      if (reading.hidden) return;
      requestAnimationFrame(() => {
        const topOffset = (playerDock?.offsetHeight || 0) + (controls?.offsetHeight || 0) + 8;
        const top = reading.getBoundingClientRect().top + window.scrollY - topOffset;
        window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      });
    };

    // Run after the inline CARDS handler has created the six cards.
    button.addEventListener("click", () => {
      requestAnimationFrame(() => {
        scrollToReading();
        const firstCard = reading.querySelector("#cards a");
        if (firstCard) {
          firstCard.click();
          const player = window.rizneyPlayer || window.player;
          if (player && typeof player.playVideo === "function") player.playVideo();
        }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupCards, { once: true });
  } else {
    setupCards();
  }
})();
