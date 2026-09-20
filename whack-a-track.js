/* WHACK-A-TRACK
 * Optional local-only arcade mini-game for the existing Mewzing/Rizney page.
 * Load this file after the existing inline player script with:
 *   <script src="whack-a-track.js"></script>
 */
(() => {
  'use strict';

  const STORAGE_KEY = 'mewzing.whack-a-track.destroyed';
  const WHACKS_TO_WIN = 18;
  const MOLE_COUNT = 9;
  const destroyed = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
  const getIds = () => window.ids || [];
  const titleFor = index => typeof window.titleFor === 'function' ? window.titleFor(index) : `Song ${index + 1}`;
  const currentIndex = () => Number.isInteger(window.currentIndex) ? window.currentIndex : 0;

  const style = document.createElement('style');
  style.textContent = `
    #wat-launch { margin-left:auto; background:#2c1745; color:#f5d76e; font-weight:bold; }
    #wat-panel { width:min(100% - 24px,900px); margin:18px auto 0; padding:16px; color:#e0aaff; background:#120b18; border:2px solid #d4af37; border-radius:12px; box-shadow:0 0 18px #d4af3740; font-family:monospace; }
    #wat-panel[hidden] { display:none; }
    .wat-head { display:flex; align-items:center; justify-content:space-between; gap:10px; }
    .wat-head h2 { margin:0; border:0; padding:0; font-family:Georgia,serif; }
    #wat-target { margin:12px 0; color:#f5d76e; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .wat-stat { display:flex; justify-content:space-between; gap:12px; margin:7px 0; }
    #wat-health { color:#f5d76e; letter-spacing:1px; word-break:break-all; }
    #wat-board { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-top:14px; }
    .wat-hole { position:relative; min-height:94px; overflow:hidden; border:0; border-radius:50%; background:#050305; box-shadow:inset 0 10px 0 #000, 0 0 0 2px #3b1d50; cursor:pointer; touch-action:manipulation; }
    .wat-hole:focus-visible { outline:3px solid #f5d76e; }
    .wat-mole { position:absolute; inset:auto 8% -8px; height:75px; color:#120b18; background:#c084fc; border:5px solid #e0aaff; border-radius:50% 50% 20% 20%; font:900 35px/65px monospace; text-shadow:7px 0 #120b18, -7px 0 #120b18; transform:translateY(110%); transition:transform .08s; user-select:none; }
    .wat-mole.up { transform:translateY(0); }
    .wat-pop { position:absolute; z-index:2; color:#f5d76e; font:bold 1.25rem monospace; pointer-events:none; animation:wat-pop .45s ease-out forwards; }
    @keyframes wat-pop { from { transform:translateY(0) scale(1); opacity:1 } to { transform:translateY(-35px) scale(1.2); opacity:0 } }
    #wat-message { min-height:1.5em; margin:12px 0 0; color:#f5d76e; text-align:center; font-weight:bold; }
    #wat-restore { display:block; margin:14px auto 0; padding:6px 9px; font-size:.72rem; background:transparent; color:#b9a8c5; border-color:#3b1d50; }
    @media (max-width:500px) { #wat-launch { width:100%; margin-left:0; } #wat-panel { padding:12px; } .wat-hole { min-height:104px; } .wat-mole { height:82px; font-size:32px; line-height:72px; } }
  `;
  document.head.appendChild(style);

  const controls = document.querySelector('.controls');
  const main = document.querySelector('main');
  if (!controls || !main) return;

  const launch = document.createElement('button');
  launch.id = 'wat-launch'; launch.type = 'button'; launch.textContent = '🎵 WHACK-A-TRACK';
  controls.appendChild(launch);

  const panel = document.createElement('section');
  panel.id = 'wat-panel'; panel.hidden = true; panel.setAttribute('aria-label', 'Whack-a-Track game');
  panel.innerHTML = `<div class="wat-head"><h2>🎵 WHACK-A-TRACK</h2><button id="wat-close" type="button" aria-label="Close game">×</button></div><div id="wat-target">NOW WHACKING: —</div><div class="wat-stat"><span>SONG HEALTH</span><strong id="wat-health"></strong></div><div class="wat-stat"><span id="wat-left">18 WHACKS LEFT</span><span id="wat-time">TIME LEFT --:--</span></div><div id="wat-board"></div><div id="wat-message">Tap the moles. Save the song? Absolutely not.</div><button id="wat-restore" type="button">↩ Restore Destroyed Tracks</button>`;
  main.prepend(panel);
  const board = panel.querySelector('#wat-board');
  for (let i=0; i<MOLE_COUNT; i++) { const hole=document.createElement('button'); hole.className='wat-hole'; hole.type='button'; hole.innerHTML='<span class="wat-mole" aria-label="8-bit mole">●</span>'; board.appendChild(hole); }

  let active = false, targetId = null, hits = 0, timer = 0, popTimer = 0;
  const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify([...destroyed]));
  const refreshList = () => document.querySelectorAll('.song').forEach(row => { const n=row.querySelector('.song-number'); const i=n ? Number(n.textContent.trim())-1 : -1; if (destroyed.has(getIds()[i])) row.hidden=true; });
  const format = s => { s=Math.max(0,Math.ceil(s)); return `TIME LEFT ${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`; };
  const health = () => { const left=Math.max(0,WHACKS_TO_WIN-hits); panel.querySelector('#wat-health').textContent='█'.repeat(left)+'░'.repeat(WHACKS_TO_WIN-left); panel.querySelector('#wat-left').textContent=`${left} WHACKS LEFT`; };
  const end = (won) => { active=false; clearInterval(timer); clearTimeout(popTimer); board.querySelectorAll('.wat-mole').forEach(m=>m.classList.remove('up')); if(won){ destroyed.add(targetId); save(); refreshList(); const p=window.player; if(p && p.stopVideo) p.stopVideo(); panel.querySelector('#wat-message').textContent='💥 WHACK! 🎵 SONG IS WHACK!! 💀 TRACK DESTROYED'; } else panel.querySelector('#wat-message').textContent='😈 THE TRACK SURVIVED!'; };
  const pop = () => { if(!active)return; const mole=board.children[Math.floor(Math.random()*MOLE_COUNT)].querySelector('.wat-mole'); mole.classList.add('up'); popTimer=setTimeout(()=>{ mole.classList.remove('up'); pop(); }, 650+Math.random()*700); };
  const start = () => { const ids=getIds(), i=currentIndex(); targetId=ids[i]; if(!targetId)return; active=true; hits=0; panel.hidden=false; panel.querySelector('#wat-target').textContent=`NOW WHACKING: ${titleFor(i)}`; panel.querySelector('#wat-message').textContent='Tap the moles. Save the song? Absolutely not.'; health(); panel.scrollIntoView({behavior:'smooth',block:'start'}); clearInterval(timer); timer=setInterval(()=>{ const p=window.player; const left=p && p.getDuration ? p.getDuration()-p.getCurrentTime() : 0; panel.querySelector('#wat-time').textContent=format(left); if(left<=0) end(false); },250); clearTimeout(popTimer); pop(); };
  board.addEventListener('click', e => { const mole=e.target.closest('.wat-mole'); if(!active || !mole || !mole.classList.contains('up')) return; hits++; mole.classList.remove('up'); const pop=document.createElement('span'); pop.className='wat-pop'; pop.textContent=Math.random()<.5?'💥 POW!!':'💥 WHACK!!'; mole.parentElement.appendChild(pop); setTimeout(()=>pop.remove(),500); health(); if(hits>=WHACKS_TO_WIN) end(true); });
  launch.addEventListener('click', start); panel.querySelector('#wat-close').addEventListener('click',()=>{panel.hidden=true; active=false; clearInterval(timer); clearTimeout(popTimer);}); panel.querySelector('#wat-restore').addEventListener('click',()=>{destroyed.clear(); localStorage.removeItem(STORAGE_KEY); refreshList(); panel.querySelector('#wat-message').textContent='All tracks restored. The moles are sorry.';});
  refreshList();
})();
