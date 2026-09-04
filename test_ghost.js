const WebSocket = require('ws');
const http = require('http');
const PORT = 9335;
const sleep = ms => new Promise(r => setTimeout(r, ms));

function getWs() {
  return new Promise((res, rej) => {
    http.get({ host: '127.0.0.1', port: PORT, path: '/json/version' }, r => {
      let d = ''; r.on('data', c => d += c); r.on('end', () => res(JSON.parse(d).webSocketDebuggerUrl));
    }).on('error', rej);
  });
}
const rpc = (ws, method, params, id, sid) => new Promise((res, rej) => {
  const msg = JSON.stringify({ id, method, params: params || {}, sessionId: sid });
  const h = d => { const m = JSON.parse(d); if (m.id === id) { ws.removeListener('message', h); res(m); } };
  ws.on('message', h); ws.send(msg);
});
const ev = (ws, sid, expr, id) => rpc(ws, 'Runtime.evaluate', { expression: expr, returnByValue: true }, id, sid).then(m => m.result.result.value);

(async () => {
  const wsUrl = await getWs();
  const ws = new WebSocket(wsUrl);
  await new Promise(r => ws.on('open', r));
  const tgt = await rpc(ws, 'Target.createTarget', { url: 'about:blank' }, 2);
  const sid = (await rpc(ws, 'Target.attachToTarget', { targetId: tgt.result.targetId, flatten: true }, 3)).result.sessionId;
  await rpc(ws, 'Page.enable', {}, 10, sid);
  await rpc(ws, 'Runtime.enable', {}, 11, sid);
  await rpc(ws, 'Runtime.addBinding', { name: 'logerr' }, 12, sid);
  // capture console + page errors
  ws.on('message', d => {
    const m = JSON.parse(d);
    if (m.method === 'Runtime.consoleAPICalled' && m.params.args) {
      const txt = m.params.args.map(a => a.value).join(' ');
      if (txt) console.log('[console]', txt);
    }
    if (m.method === 'Runtime.exceptionThrown') console.log('[PAGE ERROR]', JSON.stringify(m.params.exceptionDetails));
  });
  await rpc(ws, 'Page.navigate', { url: 'http://localhost:8090/zizao.html' }, 13, sid);
  await sleep(2500);
  // force step-04 ghost motion
  const r = await ev(ws, sid, `(function(){
    try {
      var g = document.getElementById('narvGhost');
      g.textContent = '名';
      g.classList.add('try');
      var v = document.getElementById('narvVignette'); v.classList.add('on');
      var sub = document.getElementById('narvSub');
      sub.textContent = '有些情绪，曾经没有名字';
      sub.className = 'narv-sub whisper show';
      return 'ghost on: ' + getComputedStyle(g).opacity + ' / vignette on: ' + v.classList.contains('on') + ' / whisper: ' + getComputedStyle(sub).opacity;
    } catch(e){ return 'ERR ' + e.message; }
  })()`, 14);
  console.log('RESULT:', r);
  await sleep(1500);
  const shot = await rpc(ws, 'Page.captureScreenshot', { format: 'png' }, 15, sid);
  require('fs').writeFileSync('_ghost_shot.png', Buffer.from(shot.result.data, 'base64'));
  console.log('screenshot saved');
  await rpc(ws, 'Browser.close', {}, 99);
  ws.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
