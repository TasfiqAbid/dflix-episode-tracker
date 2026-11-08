(() => {
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;bottom:14px;right:14px;z-index:2147483646';
  const ui = host.attachShadow({mode:'closed'});
  ui.innerHTML = `<style>
    section{background:#201b22;color:white;border:1px solid #665663;border-radius:10px;padding:10px 12px;font:14px/1.4 system-ui;box-shadow:0 3px 14px #0008}
    button{border:0;border-radius:5px;padding:5px 9px;color:white;background:#923349;cursor:pointer;margin-left:6px}
    small{display:block;color:#e1cad1;max-width:300px}
  </style><section><b>Episode tracker</b> · <span></span><button>Continue</button><small></small></section>`;
  const label = ui.querySelector('span');
  const button = ui.querySelector('button');
  const tip = ui.querySelector('small');
  let key, saved, restoring = false, selected = '', armed = false;
  let stopped = false;
  function storageAvailable() {
    if (chrome.runtime?.id && chrome.storage?.local) return true;
    stopped = true;
    host.remove();
    return false;
  }

  function storageError() {
    if (storageAvailable()) tip.textContent = 'Could not access saved progress. Refresh the page to retry.';
  }

  const epPattern = /^E(?:p(?:isode)?)?\.?\s*0*(\d+)$/i;
  const seasonPattern = /^Season\s+(\d+)$/i;
  function leaves(pattern) {
    return [...document.querySelectorAll('span,small,b,div,p,button,label,strong,h3,h4')]
      .filter(el => !el.children.length && el.getClientRects().length && pattern.test(el.textContent.trim()));
  }
  function season() {
    const opt = [...document.querySelectorAll('select')].map(el => el.selectedOptions[0]?.textContent.trim()).find(t => seasonPattern.test(t));
    return Number((opt || leaves(seasonPattern)[0]?.textContent.trim() || '').match(seasonPattern)?.[1]);
  }
  function rowFor(badge) {
    for (let el = badge.parentElement; el && el !== document.body; el = el.parentElement) {
      if (el.matches('button,a,[role=button]') || el.querySelector('img') || /\bNOW\b/i.test(el.innerText)) return el;
    }
  }
  function active() {
    const now = leaves(/^NOW$/i)[0];
    if (!now) return;
    for (let el = now.parentElement; el && el !== document.body; el = el.parentElement) {
      const numbers = el.innerText.split(/\n/).map(t => t.trim().match(epPattern)).filter(Boolean);
      if (numbers.length) return numbers.length === 1 ? Number(numbers[0][1]) : undefined;
    }
  }
  const video = () => findPlayer();
  let remote, locked=false, lastMedia='', clickedAt=0;
  window.addEventListener('message', event=>{
    const data=event.data;
    if(!key || data?.kind!=='dflix-position' || !Number.isFinite(data.time)) return;
    const frame=[...document.querySelectorAll('iframe')].find(f=>f.contentWindow===event.source && f.clientWidth>=200);
    if(!frame || !event.origin.startsWith('https://')) return;
    if (data.time < 0 || typeof data.paused !== 'boolean' || !Number.isSafeInteger(data.sourceId)) return;
    remote = { time: data.time, paused: data.paused, src: data.sourceId,
      win: event.source, origin: event.origin, stamp: Date.now(), frame };
  });
  function media(){
    const v=video();
    if(v?.readyState) return {time:v.currentTime,paused:v.paused,src:v.currentSrc,v};
    if(remote?.frame.isConnected && Date.now()-remote.stamp<3000) return remote;
  }
  function render() {
    const time = saved?.time;
    label.textContent = saved ? 'S' + saved.s + ' E' + saved.e + (time ? ' · ' + Math.floor(time/60) + ':' + String(time%60).padStart(2,'0') : '') : 'Choose an episode';
    button.hidden = !saved;
  }
  async function route() {
    const path = location.pathname.match(/^\/watch\/([^/]+)/);
    const next = path ? 'watch:' + path[1] : '';
    if (next === key || stopped || !storageAvailable()) return;
    remote=null; locked=true; lastMedia=''; clickedAt=0; key = next; armed = false; restoring = false; saved = null; selected = ''; tip.textContent = ''; host.remove();
    if (!key) return;
    let data;
    try {
      data = await chrome.storage.local.get(key);
    } catch {
      storageError();
      return;
    }
    if (next !== key) return;
    saved = data[key]; locked=Boolean(saved?.time); if(locked) tip.textContent='Press Continue to resume.'; render(); document.body.append(host);
  }
  function record(s,e,time) {
    if (!key || !s || !e || restoring || stopped || !storageAvailable()) return;
    saved = {s,e,time:Math.max(0,Math.floor(time || 0))};
    chrome.storage.local.set({[key]: saved}).catch(storageError);
    render();
  }
  document.addEventListener('click', event => {
    if (!key || restoring || !event.isTrusted) return;
    const badge = leaves(epPattern).find(el => rowFor(el)?.contains(event.target));
    if (!badge) return;
    const e = Number(badge.textContent.trim().match(epPattern)[1]), s = season();
    if (!s) return;
    clickedAt=Date.now(); locked=Boolean(saved?.s===s && saved?.e===e && saved?.time); selected = s + '/' + e; armed = false; tip.textContent = '';
    record(s,e,saved?.s === s && saved.e === e ? saved.time : 0);
  },true);
  function checkpoint() {
    if (stopped || !storageAvailable() || !key || restoring || locked || Date.now()-clickedAt<1500) return;
    const m=media();
    if (!m || !(m.time>0)) return;
    const [chosenSeason,chosenEpisode]=selected.split('/').map(Number);
    const s=season(), e=active() || (s===chosenSeason && chosenEpisode);
    if (!s || !e || (m.paused && !armed)) return;
    if (!m.paused) armed=true;
    const marker=[s,e,Math.floor(m.time)].join('/');
    if (marker===lastMedia) return;
    lastMedia=marker; record(s,e,m.time);
  }

  document.addEventListener('visibilitychange',()=>{if(document.hidden) checkpoint();});
  window.addEventListener('pagehide',checkpoint);
  button.onclick = async () => {
    if (restoring || !saved) return;
    const target = saved, original = key;
    if (season() !== target.s) {
      tip.textContent = 'Choose Season ' + target.s + ', then press Continue.'; return;
    }
    const badge = leaves(epPattern).find(el => Number(el.textContent.trim().match(epPattern)[1]) === target.e);
    const row = badge && rowFor(badge);
    if (!row) { tip.textContent = 'Open the episode list and choose E' + target.e + '.'; return; }
    const selectedBefore=selected;
    restoring = true; selected = target.s + '/' + target.e;
    try {
      const detected=active();
      const changing=detected ? detected!==target.e : !(selectedBefore===target.s+'/'+target.e);
      const before=media();
      if(changing) badge.click();
      let m;
      for(let i=0;i<60 && key===original;i++){
        m=media();
        if(m && (!changing || !before || m.src!==before.src || m.v!==before.v || m.win!==before.win || !target.time)) break;
        if(i===59) m=null;
        await new Promise(resolve=>setTimeout(resolve,150));
      }
      if(key!==original) return;
      if(!m){
        tip.textContent='Press Play, then Continue. For an embedded player, open the extension icon.'; return;
      }
      if(m.v){
        m.v.currentTime=target.time || 0;
        locked=false; armed=true;
        await m.v.play();
      } else {
        m.win.postMessage({kind:'dflix-resume',time:target.time||0},m.origin);
        for(let i=0;i<20 && key===original;i++){
          await new Promise(resolve=>setTimeout(resolve,150));
          if(remote?.win===m.win && remote.stamp>m.stamp && Math.abs(remote.time-target.time)<4) break;
          if(i===19){tip.textContent='Press Play, then Continue again.';return;}
        }
        locked=false; armed=true;
      }
      tip.textContent='';
    } catch {tip.textContent='Press Play in the player.';}
    finally {restoring=false;}
  };
  const checkpointTimer = setInterval(checkpoint, 1000);
  const navigationTimer = setInterval(() => {
    if (!stopped && storageAvailable()) {
      route();
      return;
    }
    clearInterval(checkpointTimer);
    clearInterval(navigationTimer);
  }, 500);
  route();
})();
