// Also used by the tracker to find players in accessible embedded documents.
function findPlayer(root = document) {
  const videos = [...root.querySelectorAll('video')];
  for (const frame of root.querySelectorAll('iframe')) {
    if (frame.contentDocument) {
      const player = findPlayer(frame.contentDocument);
      if (player) videos.push(player);
    }
  }
  if (!videos.length) {
    for (const node of root.querySelectorAll('*')) {
      if (node.shadowRoot) {
        const player = findPlayer(node.shadowRoot);
        if (player) videos.push(player);
      }
    }
  }
  return videos.sort((a,b) => Number(b.readyState > 0) - Number(a.readyState > 0) || b.clientWidth*b.clientHeight - a.clientWidth*a.clientHeight)[0];
}

if (window !== top && /^https:\/\/(www\.)?dflix\.live$/.test(location.ancestorOrigins[location.ancestorOrigins.length-1])) {
  const destination = location.ancestorOrigins[location.ancestorOrigins.length-1];
  let lastSource;
  let sourceId = 0;
  function report() {
    const video = findPlayer();
    if (!video?.readyState) return;
    if (video.currentSrc !== lastSource) {
      lastSource = video.currentSrc;
      sourceId++;
    }
    top.postMessage({
      kind: 'dflix-position',
      time: video.currentTime,
      paused: video.paused,
      sourceId
    }, destination);
  }
  setInterval(report,1000);
  addEventListener('message',event => {
    if(event.source!==top || event.origin!==destination || event.data?.kind!=='dflix-resume') return;
    const video=findPlayer(), time=event.data.time;
    if(!video?.readyState || !Number.isFinite(time) || time<0) return;
    video.currentTime=time;
    video.play().catch(()=>{});
    report();
  });
}
