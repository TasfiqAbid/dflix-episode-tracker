(async () => {
  const status=document.querySelector('#status');
  const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
  if(!/^https:\/\/(www\.)?dflix\.live\/watch\//.test(tab?.url || '')){
    status.textContent='Open a DFlix episode first.'; return;
  }
  const [{result:origins}]=await chrome.scripting.executeScript({target:{tabId:tab.id},func:() =>
    [...new Set([...document.querySelectorAll('iframe')].filter(f=>f.clientWidth>=200 && f.clientHeight>=100).map(f=>{
      try{return new URL(f.src,location.href).origin;}catch{return '';}
    }).filter(o=>o.startsWith('https://') && o!==location.origin))]});
  status.textContent=origins.length?'Enable the embedded video host, then refresh DFlix.':'No separate player host detected. Play an episode and check the tracker.';
  for(const origin of origins){
    const pattern=origin+'/*', btn=document.createElement('button');
    btn.textContent='Enable '+new URL(origin).hostname;document.body.append(btn);
    btn.onclick=async()=>{
      try {
        if(!await chrome.permissions.request({origins:[pattern]})) return;
        const id='player-'+new URL(origin).hostname.replace(/[^a-z0-9]/gi,'-');
        if(!(await chrome.scripting.getRegisteredContentScripts({ids:[id]})).length)
          await chrome.scripting.registerContentScripts([{id,matches:[pattern],allFrames:true,js:['media.js']}]);
        status.textContent='Enabled. Refresh the DFlix tab.';
      } catch {status.textContent='Could not enable this player host.';}
    };
  }
})().catch(()=>document.querySelector('#status').textContent='Open the DFlix watch page and try again.');
