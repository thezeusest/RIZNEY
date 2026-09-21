$('#draw-cards').onclick = () => {
  cardPlaylist = [...ids.keys()]
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(6, ids.length));

  cardPosition = 0;
  reading.hidden = false;
  cards.innerHTML = '';

  ['✦', '✧', '✩', '✹', '✺', '✷']
    .slice(0, cardPlaylist.length)
    .forEach((symbol, position) => {
      const card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = `
        <span class="symbol">${symbol}</span>
        <strong>Reading ${position + 1}</strong>
        <a href="#">Play song ${cardPlaylist[position] + 1}</a>
      `;

      card.querySelector('a').onclick = event => {
        event.preventDefault();
        playPosition(position);
      };

      cards.appendChild(card);
    });

  // Automatically start the first song in the new six-song playlist.
  playPosition(0);

  // Scroll to show both “Your Music Reading” and the cards.
  requestAnimationFrame(() => {
    const playerDock = document.querySelector('.player-dock');
    const controls = document.querySelector('.controls');
    const offset =
      (playerDock?.offsetHeight || 0) +
      (controls?.offsetHeight || 0) +
      12;

    const top = reading.getBoundingClientRect().top + window.scrollY - offset;

    window.scrollTo({
      top: Math.max(0, top),
      behavior: 'smooth'
    });
  });

  updateButtons();
};
