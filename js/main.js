/**
 * 字造集 - 主逻辑 main.js
 * 基于汉字构形美学与六书逻辑的汉字文化互动共创H5
 */

(function() {
  'use strict';

  // 全局错误处理
  window.addEventListener('error', function(e) {
    console.error('全局错误:', e.message, e.filename, e.lineno);
  });
  window.addEventListener('unhandledrejection', function(e) {
    console.error('未处理的Promise拒绝:', e.reason);
  });

  // ===== 全局状态 =====
  const AppState = {
    currentPage: 'story',
    userName: localStorage.getItem('zizaoji_username') || '',
    collection: JSON.parse(localStorage.getItem('zizaoji_collection') || '[]'),
    labProgress: { xiangxing: false, huiyi: false, zhishi: false },
    abilityScores: { structure: 0, association: 0, design: 0 },
    currentChar: {
      components: [],
      structure: 'left_right',
      structureType: 'lr_standard',
      meaning: '',
      style: null,
      personality: null,
      customLayout: false
    },
    components: [],
    presets: {},
    currentLibCategory: 'nature',
    selectedComponentIndex: -1,
    posterBg: localStorage.getItem('posterBg') || 'xuanzhi'
  };

  // ===== 工具函数 =====
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // ===== 《字造集》配乐 / 音效系统 =====
  // 音乐开关状态持久化：仅控制背景音乐，不影响交互音效。
  window.__zizaojiMuted = localStorage.getItem('zizaoji_music_muted') === '1';
  // 音量统一按设计表的 dB 建议值换算为 HTMLAudio 的线性音量。
  const AudioEngine = (() => {
    const base = 'assets/audio/';
    const tracks = {
      bgmHome: 'bgm/home-guqin.mp3',
      bgmCollection: 'bgm/collection.mp3',
      bgmMeaning: 'sfx/meaning-story.mp3',
      bgmPoster: 'bgm/poster-theme.mp3',
      chime: 'sfx/select-chime.mp3',
      brush: 'sfx/brush-move.mp3',
      success: 'sfx/create-success.mp3',
      woodenFish: 'sfx/deep wooden fish sound.mp3',
      wooden: 'sfx/wooden sound.mp3',
      seal: 'sfx/seal.mp3',
      sun: 'element/sun.mp3',
      moon: 'element/moon.mp3',
      mountain: 'element/mountain.mp3',
      water: 'element/water.mp3',
      fire: 'element/fire.mp3',
      wood: 'element/wood.mp3',
      earth: 'element/earth.mp3'
    };
    const bgmVolumes = {
      story: -17, intro: -17,
      loading: -4, lab: -8, ability: -12, workshop: -5,
      analysis: -13, meaning: -10, charcard: -10, certify: -10,
      poster: -10, collection: -13
    };
    const bgmByPage = {
      loading: 'bgmHome', story: 'bgmHome', intro: 'bgmHome', lab: 'bgmCollection',
      ability: 'bgmCollection', workshop: 'bgmCollection',
      analysis: 'bgmCollection', meaning: 'bgmMeaning',
      // 释义页、字卡页、造字人格页、海报页共享 meaning-story，切换不中断
      charcard: 'bgmMeaning', certify: 'bgmMeaning',
      poster: 'bgmMeaning', collection: 'bgmHome'
    };
    const audioCache = {};
    let currentBgm = null;
    let currentBgmKey = null;
    let unlocked = false;
    const pending = [];
    const now = () => Date.now();
    // 全局音效增益：所有交互音效统一提高
    const sfxBoost = 4;

    function dbToVolume(db) { return Math.max(0, Math.min(1, Math.pow(10, db / 20))); }
    function getAudio(key) {
      if (!audioCache[key]) {
        const a = new Audio(base + tracks[key]);
        a.preload = 'auto';
        audioCache[key] = a;
      }
      return audioCache[key];
    }
    function unlock() {
      if (unlocked) return;
      unlocked = true;
      const queued = pending.splice(0);
      queued.forEach(args => playSfx.apply(null, args));
      if (currentBgmKey) startBgm(currentBgmKey, currentBgm?._zDb ?? -20, true);
    }
    function fadeTo(audio, target, ms, done) {
      if (!audio) { if (done) done(); return; }
      const start = audio.volume;
      const t0 = performance.now();
      const step = t => {
        const p = Math.min(1, (t - t0) / ms);
        audio.volume = start + (target - start) * p;
        if (p < 1) requestAnimationFrame(step);
        else if (done) done();
      };
      requestAnimationFrame(step);
    }
    function startBgm(key, db, immediate, fadeMs=500) {
      const a = getAudio(key);
      const target = dbToVolume(db);
      a.loop = true;
      a._zDb = db;
      if (currentBgm === a && !a.paused) {
        if (Math.abs(a.volume - target) > 0.01) fadeTo(a, target, fadeMs);
        return;
      }
      if (currentBgm && currentBgm !== a) {
        const old = currentBgm;
        fadeTo(old, 0, 450, () => { try { old.pause(); old.currentTime = 0; } catch(e) {} });
      }
      currentBgm = a;
      currentBgmKey = key;
      a.volume = immediate ? target : 0;
      const p = a.play();
      if (p && p.catch) p.catch(() => { unlocked = false; });
      if (!immediate) fadeTo(a, target, fadeMs);
    }
    function pageBgm(pageId) {
      if (window.__zizaojiMuted) return;
      const key = bgmByPage[pageId];
      // 配置为 null 的页面不播放背景音乐，停止当前BGM
      if (key === null) {
        fadeBgmOut(400);
        return;
      }
      if (!key) return;
      const db = bgmVolumes[pageId] ?? -20;
      if (!unlocked) { currentBgmKey = key; currentBgm = getAudio(key); currentBgm._zDb = db; try { currentBgm.currentTime = 0; } catch(e) {} return; }
      startBgm(key, db, false, pageId === 'ability' ? 5000 : 500);
    }
    function playSfx(key, db, maxMs, rate=1, queueIfLocked=true) {
      // 声音开关关闭时，所有交互音效也不播放
      if (window.__zizaojiMuted) return;
      if (!unlocked) {
        if (queueIfLocked) pending.push([key, db, maxMs, rate, false]);
        return;
      }
      const a = getAudio(key);
      try { a.pause(); a.currentTime = 0; } catch(e) {}
      a.loop = false;
      a.playbackRate = rate;
      a.volume = dbToVolume(db + sfxBoost);
      const p = a.play();
      if (p && p.catch) p.catch(() => {});
      if (maxMs) {
        setTimeout(() => { try { a.pause(); a.currentTime = 0; } catch(e) {} }, maxMs);
      }
    }
    function fadeBgmOut(ms=400) {
      if (!currentBgm) return;
      const old = currentBgm;
      fadeTo(old, 0, ms, () => { try { old.pause(); old.currentTime = 0; } catch(e) {} });
      currentBgm = null; currentBgmKey = null;
    }
    function setMuted(muted) {
      window.__zizaojiMuted = !!muted;
      localStorage.setItem('zizaoji_music_muted', window.__zizaojiMuted ? '1' : '0');
      if (window.__zizaojiMuted) {
        if (currentBgm) fadeTo(currentBgm, 0, 180);
        // 静音时同时停止所有正在播放的交互音效
        Object.values(audioCache).forEach(a => {
          if (a !== currentBgm) {
            try { a.pause(); a.currentTime = 0; } catch(e) {}
          }
        });
      } else if (currentBgmKey) {
        const db = currentBgm?._zDb ?? -20;
        if (!unlocked) {
          currentBgm = getAudio(currentBgmKey);
          currentBgm._zDb = db;
        } else {
          startBgm(currentBgmKey, db, false, 180);
        }
      }
      return window.__zizaojiMuted;
    }
    function toggleMuted() {
      return setMuted(!window.__zizaojiMuted);
    }
    function isMuted() { return !!window.__zizaojiMuted; }
    function setMeaningStyle(styleId) {
      // 三种风格严格对应设计表：古风/当代使用 meaning-story，极简使用 home-guqin。
      const key = styleId === 'minimal' ? 'bgmHome' : 'bgmMeaning';
      const db = styleId === 'minimal' ? -12 : (styleId === 'modern' ? -11 : -10);
      if (!unlocked) { currentBgmKey = key; currentBgm = getAudio(key); currentBgm._zDb = db; return; }
      startBgm(key, db, false);
    }
    return { unlock, pageBgm, playSfx, fadeBgmOut, setMeaningStyle, getAudio, setMuted, toggleMuted, isMuted };
  })();
  window.AudioEngine = AudioEngine;

  // 浏览器自动播放策略：首次用户操作后立即解锁，并补播需要的交互声。
  ['pointerdown','touchstart','keydown'].forEach(evt =>
    document.addEventListener(evt, () => AudioEngine.unlock(), { once: true, passive: true })
  );

  function showToast(msg, duration = 2000) {
    const toast = $('#toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
  }

  // 能力值转换为100分制
  function getFinalScore(score, max) {
    return Math.round(score / max * 100);
  }

  // 数字从0涨到目标值的动画
  function animateScore(id, end) {
    const el = document.getElementById(id);
    if (!el) return;
    let num = 0;
    const timer = setInterval(() => {
      num++;
      el.textContent = num;
      if (num >= end) clearInterval(timer);
    }, 15);
  }

  function navigateTo(pageId) {
    if (window.stopStoryVoice && pageId !== 'story') { window.stopStoryVoice(); }
    // 用style.display直接控制，不依赖CSS class
    const allPages = document.querySelectorAll('.page');
    allPages.forEach(p => { p.style.display = 'none'; });
    const page = document.getElementById('page-' + pageId);
    if (page) {
      page.style.display = 'flex';
      page.scrollTop = 0;
      AppState.currentPage = pageId;
       if(window.XuanXuan){
          const xuanMap={
          story:['story','你好，我是玄玄。'],
          intro:['intro','让我们开始创造一个字。'],
          lab:['lab','每一种心情都等待一个名字。'],
          workshop:['workshop','你的此刻，会诞生怎样的文字呢？'],
          analysis:['analysis','让我记录这个字的故事。'],
          charcard:['charcard','我把它记下来了。'],
          collection:['collection','每一个字，都有属于自己的故事哦。']
          };
          if(xuanMap[pageId]) XuanXuan.show(...xuanMap[pageId]);
       }
       AudioEngine.pageBgm(pageId);
      // 触发页面初始化
      try {
        if (pageInit[pageId]) pageInit[pageId]();
      } catch(e) {
        console.error('页面初始化错误:', pageId, e);
      }
    } else {
      console.error('页面不存在:', pageId);
    }
  }

  function inkTransition(callback) {
    AudioEngine.playSfx('brush', -10, 900);
    const layer = document.getElementById('ink-transition');
    if (layer) {
      layer.classList.add('active');
      setTimeout(() => {
        try { if (callback) callback(); } catch(e) { console.error('回调错误:', e); }
        setTimeout(() => { layer.classList.remove('active'); }, 300);
      }, 600);
    } else {
      // 没有过渡层，直接执行
      if (callback) callback();
    }
  }

  function saveCollection() {
    localStorage.setItem('zizaoji_collection', JSON.stringify(AppState.collection));
  }

  function getComponentById(id) {
    return AppState.components.find(c => c.id === id);
  }

  function sanitizeInput(text) {
    // 过滤emoji和特殊控制字符
    return text.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}]/gu, '')
               .replace(/[\x00-\x1F\x7F]/g, '')
               .substring(0, 50);
  }

  // ===== 数据加载 =====
  async function loadData() {
    try {
      const [compRes, presetRes] = await Promise.all([
        fetch('data/components.json'),
        fetch('data/presets.json')
      ]);
      const compData = await compRes.json();
      const presetData = await presetRes.json();
      AppState.components = compData.components;
      AppState.presets = presetData;
    } catch (e) {
      console.error('数据加载失败:', e);
      // 使用内置默认数据
      AppState.components = DEFAULT_COMPONENTS;
      AppState.presets = DEFAULT_PRESETS;
    }
  }

  // ===== 页面初始化函数 =====
  const pageInit = {
    loading() {
      // 六组随机汉字冷知识
      const loadingWords = [
        { word: '公', meaning: '"公"上面不是八，是分开的器物。' },
        { word: '县', meaning: '古意是悬挂，和现在的地名毫无关系。' },
        { word: '慢', meaning: '最初专指傲慢，并不代表速度慢。' },
        { word: '戏', meaning: '本义是人与猛兽搏斗。' },
        { word: '闻', meaning: '如今多指嗅气味，最初专指耳朵听见声音。' },
        { word: '劝', meaning: '现在多指规劝劝阻，本义是勉励、鼓舞他人。' }
      ];
      const randomIndex = Math.floor(Math.random() * loadingWords.length);
      const currentWord = loadingWords[randomIndex];
      const wordEl = document.getElementById('loadingWord');
      const meaningEl = document.getElementById('loadingMeaning');
      if (wordEl) wordEl.textContent = currentWord.word;
      if (meaningEl) meaningEl.textContent = currentWord.meaning;
       AudioEngine.playSfx('chime', -16, 500);

      // 模拟加载，停留后进入
      setTimeout(() => {
        if (!AppState.userName) {
          showNameInput();
        } else {
          navigateTo('intro');
        }
      }, 2800);
    },

    intro() {
      AudioEngine.playSfx('chime', -18, 400);
      AudioEngine.playSfx('chime', -18, 400);
      // 问号2.5秒后消失，正文由CSS动画控制出现
      setTimeout(() => {
        const qm = document.querySelector('.question-mark');
        if (qm) qm.classList.add('hide');
      }, 2500);
    },

    lab() {
      updateLabProgress();
      showLabLevel('xiangxing');
    },

    ability() {
      // 原始分数（每关30 + 完成奖励）
      const raw = AppState.abilityScores;
      // 转换为100分制（max分别为120/150/180）
      const finalScores = {
        structure: Math.min(100, getFinalScore(raw.structure, 120)),
        association: Math.min(100, getFinalScore(raw.association, 150)),
        design: Math.min(100, getFinalScore(raw.design, 180))
      };
      // 数字动画
      animateScore('ability-structure-val', finalScores.structure);
       setTimeout(() => AudioEngine.playSfx('chime', -18, 300), 250);
       setTimeout(() => AudioEngine.playSfx('chime', -18, 300, 1.08), 800);
       setTimeout(() => AudioEngine.playSfx('chime', -18, 300, 1.16), 1350);
      animateScore('ability-association-val', finalScores.association);
      animateScore('ability-design-val', finalScores.design);
      // 进度条跟随分数
      setTimeout(() => {
        $('#ability-structure').style.width = finalScores.structure + '%';
        $('#ability-association').style.width = finalScores.association + '%';
        $('#ability-design').style.width = finalScores.design + '%';
      }, 300);
      // 保存最终分数供认证页使用
      AppState.finalScores = finalScores;
    },

    workshop() {
      renderComponentLibrary();
      renderStructurePanel();
      updateCanvas();
    },

    analysis() {
      startAnalysisAnimation();
    },

    meaning() {
      AppState.currentChar.style = null; // 进入页面时重置，默认无选中
      renderMeaningPreview();
      renderStyleCards();
    },

    charcard() {
      renderCharCard();
    },

    certify() {
      renderCertification();
    },

    poster() {
      generatePoster();
      renderBgSwitcher();
    },

    collection() {
      renderCollection();
    }
  };

  // ===== 音乐开关 UI =====
  function updateMusicSwitchUI(muted = AudioEngine.isMuted()) {
    const buttons = [document.getElementById('soundBtn'), document.getElementById('btn-sound')].filter(Boolean);
    buttons.forEach(btn => {
      btn.classList.toggle('is-muted', muted);
      btn.setAttribute('aria-pressed', String(!muted));
      btn.setAttribute('aria-label', muted ? '开启背景音乐' : '关闭背景音乐');
      btn.title = muted ? '开启背景音乐' : '关闭背景音乐';
    });
  }

  // ===== 情景页声音按钮 UI =====
  function updateStorySoundUI(muted = AudioEngine.isMuted()) {
    const btn = document.getElementById('storySoundBtn');
    if (!btn) return;
    btn.classList.toggle('is-muted', muted);
    btn.setAttribute('aria-pressed', String(!muted));
    btn.setAttribute('aria-label', muted ? '开启声音' : '关闭声音');
  }


  // ===== P00 情景引入页 =====
  function initStory() {
    const btn = document.getElementById('story-start');
    if (btn && !btn.dataset.ready) {
      btn.dataset.ready = '1';
      btn.addEventListener('click', () => {
        stopStoryVoice();
        navigateTo('intro');
      });
    }
    const canvas = document.getElementById('storyParticles');
    if (!canvas || canvas.dataset.ready) return;
    canvas.dataset.ready='1';
    const ctx=canvas.getContext('2d');
    const resize=()=>{canvas.width=innerWidth;canvas.height=innerHeight};
    resize(); window.addEventListener('resize',resize);
    let dots=Array.from({length:45},()=>({x:Math.random()*canvas.width,y:Math.random()*canvas.height,r:Math.random()*1.5,v:Math.random()*.25+.05}));
    function draw(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle='rgba(220,200,160,.55)';
      dots.forEach(d=>{ctx.beginPath();ctx.arc(d.x,d.y,d.r,0,7);ctx.fill();d.y-=d.v;if(d.y<0)d.y=canvas.height});
      requestAnimationFrame(draw);
    }
    draw();

    // ===== 鼠标/手指跟随光晕：黑暗中手持微光 =====
    const light=document.querySelector('.mouse-light');
    let mx=innerWidth/2,my=innerHeight/2,lx=mx,ly=my;
    let lightPulse=0;
    document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;});
    document.addEventListener('touchmove',e=>{let t=e.touches[0];if(t){mx=t.clientX;my=t.clientY;}},{passive:true});
    function moveLight(){
      lx+=(mx-lx)*.1; ly+=(my-ly)*.1;
      if(light){
        const pulseScale=1+lightPulse;
        light.style.left=lx-130*pulseScale+'px';
        light.style.top=ly-130*pulseScale+'px';
        light.style.width=260*pulseScale+'px';
        light.style.height=260*pulseScale+'px';
        lightPulse*=.92;
      }
      requestAnimationFrame(moveLight);
    }
    moveLight();

    // 点击涟漪 + 光晕脉冲
    function createRipple(x,y){
      const r=document.createElement('div');
      r.className='light-ripple';
      r.style.left=x+'px'; r.style.top=y+'px';
      document.body.appendChild(r);
      setTimeout(()=>r.remove(),1100);
      lightPulse=0.4;
    }
    document.addEventListener('click',e=>{
      if(e.target.closest('#page-story')) createRipple(e.clientX,e.clientY);
    });
    document.addEventListener('touchstart',e=>{
      if(e.target.closest('#page-story')){const t=e.touches[0];if(t)createRipple(t.clientX,t.clientY);}
    },{passive:true});

    // ===== 打字机效果：正确保留HTML标签，只拆分文本节点 =====
    const storyPage = document.getElementById('page-story');
    const lines = storyPage.querySelectorAll('.type-line');
    // 保存每行原始HTML，便于重复启动时恢复（避免intro-char嵌套）
    const originalLineHTML = Array.from(lines).map(el => el.innerHTML);
    const charInterval = 85; // 每字间隔ms
    // 每行开始时间（与旁白同步的时间轴，可按需微调）
    const lineStartTimes = [0, 2200, 5000, 7200, 10200, 14200, 18200];
    let storyTimers = [];
    let storyStarted = false;
    let voiceAudio = null;

    function clearStoryTimers(){ storyTimers.forEach(t=>clearTimeout(t)); storyTimers=[]; }

    function resetStoryLines(){
      lines.forEach((el, i) => { el.innerHTML = originalLineHTML[i]; });
    }

    function typeWriteLine(el, startTime){
      // 先重置
      el.classList.remove('visible');
      // 使用TreeWalker只遍历文本节点，保留HTML标签结构
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
      const textNodes = [];
      let node;
      while (node = walker.nextNode()) {
        if (node.textContent.length > 0) textNodes.push(node);
      }
      let totalChars = 0;
      textNodes.forEach(textNode => {
        const text = textNode.textContent;
        const parent = textNode.parentNode;
        const fragment = document.createDocumentFragment();
        for (let ch of text) {
          if (ch === ' ' || ch === '\n' || ch === '\t' || ch === '·') {
            fragment.appendChild(document.createTextNode(ch));
          } else {
            const span = document.createElement('span');
            span.className = 'intro-char';
            span.textContent = ch;
            fragment.appendChild(span);
            totalChars++;
          }
        }
        parent.replaceChild(fragment, textNode);
      });
      // 行容器淡入
      const t1 = setTimeout(()=>el.classList.add('visible'), Math.max(0, startTime - 100));
      storyTimers.push(t1);
      // 逐字显示
      const chars = el.querySelectorAll('.intro-char');
      chars.forEach((c, i) => {
        const t = setTimeout(()=>c.classList.add('visible'), startTime + i * charInterval);
        storyTimers.push(t);
      });
      return startTime + totalChars * charInterval;
    }

    function startStoryAnimation(){
      if(storyStarted) return;
      storyStarted = true;
      clearStoryTimers();
      // 恢复原始HTML后再拆分，避免重复启动时intro-char嵌套
      resetStoryLines();
      // 旁白不再随情景页自动播放，只由“听听隐藏的故事”入口触发。
      // 重置所有行
      lines.forEach(el=>{
        el.classList.remove('visible');
        el.querySelectorAll('.intro-char').forEach(c=>c.classList.remove('visible'));
      });
      btn.classList.remove('visible');
      // 逐行打字
      let lastEnd = 0;
      lines.forEach((line, i) => {
        const end = typeWriteLine(line, lineStartTimes[i] || (i * 1500));
        lastEnd = Math.max(lastEnd, end);
      });
      // 按钮最后出现
      const btnTimer = setTimeout(()=>btn.classList.add('visible'), lastEnd + 1000);
      storyTimers.push(btnTimer);
    }

    // ===== 隐藏旁白：仅由入口触发，且只播放一次 =====
    function initVoice(){
      if(voiceAudio) return voiceAudio;
      voiceAudio = new Audio('assets/voice.mp3');
      voiceAudio.loop = false;
      voiceAudio.volume = 0.85;
      voiceAudio.preload = 'auto';
      return voiceAudio;
    }

    function updateHiddenVoiceUI(state){
      const btn = document.getElementById('hiddenVoiceBtn');
      if(!btn) return;
      const label = btn.querySelector('.hidden-voice-label');
      if(state === 'playing'){
        if(label) label.textContent = '正在聆听...';
        btn.classList.add('is-playing');
        btn.disabled = true;
        btn.setAttribute('aria-label', '正在聆听...');
      }else if(state === 'done'){
        if(label) label.textContent = '已聆听';
        btn.classList.remove('is-playing');
        btn.disabled = true;
        btn.setAttribute('aria-label', '已聆听');
      }else{
        if(label) label.textContent = '听听隐藏的故事';
        btn.classList.remove('is-playing');
        btn.disabled = false;
        btn.setAttribute('aria-label', '听听隐藏的故事');
      }
    }

    async function playHiddenVoice(){
      if(!voiceAudio || voiceAudio.dataset.played === '1') return;
      const v = voiceAudio;
      v.dataset.played = '1';
      v.currentTime = 0;
      v.muted = false;
      v.volume = 0.85;

      // 从时间轴起点重新同步文案与旁白。
      storyStarted = false;
      clearStoryTimers();
      startStoryAnimation();

      updateHiddenVoiceUI('playing');
      v.onended = () => updateHiddenVoiceUI('done');
      v.onerror = () => {
        delete v.dataset.played;
        updateHiddenVoiceUI('ready');
      };
      try{
        await v.play();
      }catch(e){
        delete v.dataset.played;
        updateHiddenVoiceUI('ready');
        console.warn('隐藏旁白播放失败:', e);
      }
    }

    function stopStoryVoice(){
      if(voiceAudio){
        try{ voiceAudio.pause(); voiceAudio.currentTime=0; }catch(e){}
      }
    }
    window.stopStoryVoice = stopStoryVoice;

    function setStorySoundMuted(muted){
      AudioEngine.setMuted(muted);
      updateStorySoundUI(muted);
      updateMusicSwitchUI(muted);
      // 声音按钮只能关闭旁白，不能打开旁白（旁白仅由"听听隐藏的故事"触发）
      if (muted) stopStoryVoice();
    }

    // 情景页进入只启动背景音乐，文案与旁白由"听听隐藏的故事"按钮同步触发。
    function onStoryEnter(){
      AudioEngine.unlock();
      AudioEngine.pageBgm('story');
    }

    // 预加载旁白，但不自动播放。
    initVoice();
    const storySkipBtn=document.getElementById('storySkipBtn');
    if(storySkipBtn && !storySkipBtn.dataset.ready){
      storySkipBtn.dataset.ready='1';
      storySkipBtn.addEventListener('click',(e)=>{
        e.stopPropagation();
        stopStoryVoice();
        clearStoryTimers();
        navigateTo('intro');
      });
    }

    const storySoundBtn=document.getElementById('storySoundBtn');
    if(storySoundBtn && !storySoundBtn.dataset.ready){
      storySoundBtn.dataset.ready='1';
      storySoundBtn.addEventListener('click',(e)=>{
        e.stopPropagation();
        const muted=!AudioEngine.isMuted();
        setStorySoundMuted(muted);
      });
    }

    const hiddenVoiceBtn=document.getElementById('hiddenVoiceBtn');
    if(hiddenVoiceBtn && !hiddenVoiceBtn.dataset.ready){
      hiddenVoiceBtn.dataset.ready='1';
      hiddenVoiceBtn.addEventListener('click',(e)=>{
        e.stopPropagation();
        playHiddenVoice();
      });
    }
    updateHiddenVoiceUI('ready');
    updateStorySoundUI(
AudioEngine.isMuted());
    // 预先拆分文案为逐字span并保持隐藏，等待点击按钮后与旁白同步显示
    startStoryAnimation();
    clearStoryTimers();
    lines.forEach(el=>{
      el.classList.remove('visible');
      el.querySelectorAll('.intro-char').forEach(c=>c.classList.remove('visible'));
    });
    btn.classList.remove('visible');
    storyStarted = false;
    // 页面进入后自动开始（旁白只属于情景页）
    const autoTimer = setTimeout(()=>{
      if(!storyStarted) onStoryEnter();
    }, 50);
    storyTimers.push(autoTimer);
  }

  // ===== P01 开场页 =====
  function initIntro() {
    updateMusicSwitchUI();
    const btn = document.getElementById('intro-start-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        try {
          inkTransition(() => navigateTo('lab'));
        } catch(e) {
          console.error('跳转失败:', e);
          navigateTo('lab');
        }
      });
    } else {
      console.error('intro-start-btn不存在');
    }
    // 开场页声音按钮
    const soundBtn = document.getElementById('soundBtn');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        const muted = AudioEngine.toggleMuted();
        updateMusicSwitchUI(muted);
        showToast(muted ? '背景音乐已关闭' : '背景音乐已开启');
      });
    }
    // 开场页集按钮
    const collectionBtn = document.getElementById('collectionBtn');
    if (collectionBtn) {
      collectionBtn.addEventListener('click', () => {
        inkTransition(() => navigateTo('collection'));
      });
    }
  }

  // ===== 用户名输入 =====
  function showNameInput() {
    $('#name-modal').classList.add('show');
    $('#name-input').focus();
  }

  function initNameInput() {
    const input = $('#name-input');
    const button = $('#name-confirm-btn');

    function submitName() {
      const name = sanitizeInput(input.value.trim());
      if (name.length < 1) {
        showToast('请输入你的名字');
        input.focus();
        return;
      }
      if (name.length > 12) {
        showToast('名字不超过12个字');
        input.focus();
        return;
      }
      AppState.userName = name;
      localStorage.setItem('zizaoji_username', name);
      $('#name-modal').classList.remove('show');
      // 输入用户名后进入首页
      inkTransition(() => {
        navigateTo('intro');
      });
    }

    button.addEventListener('click', submitName);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        submitName();
      }
    });
  }

  // ===== P02 六书实验室 =====
  let currentLabLevel = 'xiangxing';

  function updateLabProgress() {
    const dots = $$('.progress-dot');
    const levels = ['xiangxing', 'huiyi', 'zhishi'];
    levels.forEach((level, i) => {
      if (AppState.labProgress[level]) {
        dots[i].classList.add('done');
        dots[i].classList.remove('active');
      } else if (level === currentLabLevel) {
        dots[i].classList.add('active');
      }
    });
  }

  function showLabLevel(level) {
    currentLabLevel = level;
    $$('.lab-level').forEach(el => el.style.display = 'none');
    const levelEl = $('#level-' + level);
    if (levelEl) levelEl.style.display = 'flex';
    updateLabProgress();

    if (level === 'xiangxing') initXiangxing();
    else if (level === 'huiyi') initHuiyi();
    else if (level === 'zhishi') initBladeDrag();
  }

  // 象形关卡 - 太阳演变时间轴
  function initXiangxing() {
    const timeline = document.getElementById('timeline');
    const sunImage = document.getElementById('sunImage');
    const labels = document.querySelectorAll('.timeline-label span');
    if (!timeline || !sunImage) { console.error('象形关卡元素不存在'); return; }

    const stages = [
      { img: 'assets/images/sun-real.svg' },
      { img: 'assets/images/sun-oracle.svg' },
      { img: 'assets/images/sun-seal.svg' },
      { img: 'assets/images/sun-day.svg' }
    ];

    timeline.value = 0;
    sunImage.src = stages[0].img;
    labels.forEach((item, i) => item.classList.toggle('active', i === 0));

    timeline.addEventListener('input', () => {
      AudioEngine.playSfx('brush', -16, 250);
      const index = parseInt(timeline.value);
      // 墨迹变形切换效果
      sunImage.classList.add('change');
      setTimeout(() => {
        sunImage.src = stages[index].img;
        sunImage.classList.remove('change');
      }, 300);
      labels.forEach((item, i) => item.classList.toggle('active', i === index));

      // 拖到最右端完成关卡
      if (index > 0) AudioEngine.playSfx('chime', -16, 400);
if (index >= 3) {
        setTimeout(() => { AudioEngine.playSfx('success', -10, 1500); completeLevel('xiangxing'); }, 500);
      }
    });
  }

  // 会意关卡
  function initHuiyi() {
    const area = document.getElementById('huiyi-area');
    const comp1 = document.getElementById('huiyi-comp1');
    const comp2 = document.getElementById('huiyi-comp2');
    const result = document.getElementById('huiyi-result');
    if (!area || !comp1 || !comp2 || !result) { console.error('huiyi元素不存在'); return; }
    let dragging = null;
    let offsetX = 0, offsetY = 0;
    let completed = false;

    const startDrag = (el, e) => {
      if (completed) return;
      dragging = el;
      AudioEngine.playSfx('brush', -18, 300);
      AudioEngine.playSfx('brush', -18, 300);
      const touch = e.touches ? e.touches[0] : e;
      const rect = el.getBoundingClientRect();
      offsetX = touch.clientX - rect.left;
      offsetY = touch.clientY - rect.top;
      el.style.zIndex = 10;
    };

    const onDrag = (e) => {
      if (!dragging || completed) return;
      const touch = e.touches ? e.touches[0] : e;
      const areaRect = area.getBoundingClientRect();
      let x = touch.clientX - areaRect.left - offsetX;
      let y = touch.clientY - areaRect.top - offsetY;
      x = Math.max(0, Math.min(areaRect.width - 70, x));
      y = Math.max(0, Math.min(areaRect.height - 70, y));
      dragging.style.left = x + 'px';
      dragging.style.top = y + 'px';

      const r1 = comp1.getBoundingClientRect();
      const r2 = comp2.getBoundingClientRect();
      const dist = Math.hypot(
        (r1.left + r1.width / 2) - (r2.left + r2.width / 2),
        (r1.top + r1.height / 2) - (r2.top + r2.height / 2)
      );
      if (dist < 80) {
        AudioEngine.playSfx('chime', -14, 300, 1.12);
        comp1.style.opacity = '0.3';
        comp2.style.opacity = '0.3';
        result.classList.add('show');
        // 组合成功后自动完成，避免松手偏移
        completed = true;
        dragging = null;
        AudioEngine.playSfx('success', -10, 1500);
        AudioEngine.playSfx('success', -10, 1500);
        setTimeout(() => completeLevel('huiyi'), 400);
      } else {
        comp1.style.opacity = '1';
        comp2.style.opacity = '1';
        result.classList.remove('show');
      }
    };

    const endDrag = () => {
      if (!dragging) return;
      if (result.classList.contains('show') && !completed) {
        completed = true;
        completeLevel('huiyi');
      }
      dragging = null;
    };

    comp1.addEventListener('mousedown', (e) => startDrag(comp1, e));
    comp2.addEventListener('mousedown', (e) => startDrag(comp2, e));
    comp1.addEventListener('touchstart', (e) => startDrag(comp1, e));
    comp2.addEventListener('touchstart', (e) => startDrag(comp2, e));
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('touchmove', onDrag);
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);

    // 重置位置
    comp1.style.left = '20px';
    comp1.style.top = '60px';
    comp2.style.left = '190px';
    comp2.style.top = '60px';
    comp1.style.opacity = '1';
    comp2.style.opacity = '1';
    result.classList.remove('show');
  }

  // 指事关卡 - 红点拖拽到刀刃
  function initBladeDrag() {
    const point = document.getElementById('dragPoint');
    const area = document.getElementById('knifeArea');
    if (!point || !area) { console.error('指事关卡元素不存在'); return; }

    let isDragging = false;
    let offsetX = 0, offsetY = 0;
    let completed = false;

    // 刀刃尖端目标位置（相对于knife-area，SVG坐标系）
    const targetX = 155;
    const targetY = 80;

    // 重置状态
    point.classList.remove('mark-success');
    point.style.background = '#b83232';
    point.style.left = '40px';
    point.style.top = '120px';
    const resultEl = document.getElementById('knifeResult');
    if (resultEl) resultEl.innerHTML = '';

    const startDrag = (e) => {
      if (completed) return;
      isDragging = true;
      AudioEngine.playSfx('brush', -18, 300);
      AudioEngine.playSfx('brush', -18, 300);
      const touch = e.touches ? e.touches[0] : e;
      const rect = point.getBoundingClientRect();
      offsetX = touch.clientX - rect.left;
      offsetY = touch.clientY - rect.top;
      e.preventDefault();
    };

    const onDrag = (e) => {
      if (!isDragging || completed) return;
      const touch = e.touches ? e.touches[0] : e;
      const areaRect = area.getBoundingClientRect();
      let x = touch.clientX - areaRect.left - offsetX;
      let y = touch.clientY - areaRect.top - offsetY;
      x = Math.max(0, Math.min(areaRect.width - 22, x));
      y = Math.max(0, Math.min(areaRect.height - 22, y));
      point.style.left = x + 'px';
      point.style.top = y + 'px';

      // 计算红点中心与刀刃尖端的距离
      const px = x + 11;
      const py = y + 11;
      const distance = Math.sqrt(
        Math.pow(px - targetX, 2) + Math.pow(py - targetY, 2)
      );
      if (distance < 40) {
        successBlade();
      }
    };

    const endDrag = () => {
      isDragging = false;
    };

    point.addEventListener('mousedown', startDrag);
    point.addEventListener('touchstart', startDrag);
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);
  }

  function successBlade() {
    AudioEngine.playSfx('success', -10, 1000);
    AudioEngine.playSfx('success', -10, 1000);
    const point = document.getElementById('dragPoint');
    if (!point) return;
    point.classList.add('mark-success');
    point.style.background = '#4a7c59';

    const resultEl = document.getElementById('knifeResult');
    if (resultEl) resultEl.innerHTML = '刃';

    // 记录第三关完成
    AppState.labProgress.zhishi = true;
    AppState.abilityScores.design += 30;

    setTimeout(() => {
      // 显示成功提示
      const successText = document.getElementById('success-text');
      const levelSuccess = document.getElementById('level-success');
      if (successText) {
        successText.innerHTML = '已有的形体，加上指示的位置，就产生了新的意义。<br><span class="badge">指事派</span>';
      }
      if (levelSuccess) levelSuccess.classList.add('show');

      setTimeout(() => {
        if (levelSuccess) levelSuccess.classList.remove('show');
        // 三关全部完成，进入能力值页面
        AppState.abilityScores.structure += 22;
        AppState.abilityScores.association += 21;
        AppState.abilityScores.design += 26;
        inkTransition(() => navigateTo('ability'));
      }, 2000);
    }, 1200);
  }

  function completeLevel(level) {
    if (AppState.labProgress[level]) return;
    AppState.labProgress[level] = true;

    // 计算能力值
    if (level === 'xiangxing') AppState.abilityScores.association += 30;
    if (level === 'huiyi') AppState.abilityScores.structure += 30;
    if (level === 'zhishi') AppState.abilityScores.design += 30;

    const messages = {
      xiangxing: { text: '你发现了：象形，是把看见的东西变成文字。', badge: '象形派' },
      huiyi: { text: '人倚木而息，于是有了"休"。', badge: '会意派' },
      zhishi: { text: '已有的形体，加上指示的位置，就产生了新的意义。', badge: '指事派' }
    };

    const msg = messages[level];
    $('#success-text').innerHTML = msg.text + '<br><span class="badge">' + msg.badge + '</span>';
    $('#level-success').classList.add('show');

    setTimeout(() => {
      $('#level-success').classList.remove('show');
      const next = { xiangxing: 'huiyi', huiyi: 'zhishi', zhishi: null };
      if (next[level]) {
        showLabLevel(next[level]);
      } else {
        // 全部完成，进入能力值页面
        AppState.abilityScores.structure += 22;
        AppState.abilityScores.association += 21;
        AppState.abilityScores.design += 26;
        inkTransition(() => navigateTo('ability'));
      }
    }, 2000);
  }

  // ===== P04 造字工坊 =====
  function initAbility() {
    const btn = $('#ability-continue-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        inkTransition(() => {
          $('#top-bar').style.display = 'flex';
          navigateTo('workshop');
        });
      });
    }
  }

  function renderComponentLibrary() {
    const categories = [
      { id: 'nature', name: '自然' },
      { id: 'body', name: '身体' },
      { id: 'thing', name: '事物' }
    ];

    // 渲染分类标签
    const catContainer = $('#lib-categories');
    catContainer.innerHTML = categories.map(c =>
      `<div class="lib-cat ${c.id === AppState.currentLibCategory ? 'active' : ''}" data-cat="${c.id}">${c.name}</div>`
    ).join('');
    catContainer.querySelectorAll('.lib-cat').forEach(el => {
      el.addEventListener('click', () => {
         AudioEngine.playSfx('chime', -16, 300);
         AppState.currentLibCategory = el.dataset.cat;
        renderComponentLibrary();
      });
    });

    // 渲染构件
    const items = AppState.components.filter(c => c.category === AppState.currentLibCategory);
    const usedIds = AppState.currentChar.components.map(c => c.id);
    const itemsContainer = $('#lib-items');
    itemsContainer.innerHTML = items.map(c =>
      `<div class="lib-item ${usedIds.includes(c.id) ? 'used' : ''}" data-id="${c.id}" title="${c.meaning}">${c.name}</div>`
    ).join('');
    itemsContainer.querySelectorAll('.lib-item').forEach(el => {
      el.addEventListener('click', () => {
        if (el.classList.contains('used')) {
          // 移除构件
          removeComponent(el.dataset.id);
        } else {
          addComponent(el.dataset.id);
        }
      });
    });
  }

  function addComponent(id) {
    if (AppState.currentChar.components.length >= 2) {
      showToast('最多选择两个构件，可先移除一个');
      return;
    }
    const comp = getComponentById(id);
    if (comp) {
      AppState.currentChar.components.push({ ...comp });
       const elementKey = { sun:'sun', moon:'moon', mountain:'mountain', water:'water', fire:'fire', tree:'wood', wood:'wood', earth:'earth' }[id];
       if (elementKey) AudioEngine.playSfx(elementKey, ({sun:-15,moon:-17,mountain:-14,water:-16,fire:-14,wood:-17,earth:-15}[elementKey] || -16), 1200);
       else AudioEngine.playSfx('chime', -16, 300);
      renderComponentLibrary();
      updateCanvas();
    }
  }

  function removeComponent(id) {
     AudioEngine.playSfx('wooden', -18, 300);
    AppState.currentChar.components = AppState.currentChar.components.filter(c => c.id !== id);
    AppState.selectedComponentIndex = -1;
    renderComponentLibrary();
    updateCanvas();
  }

  function renderStructurePanel() {
    const structures = AppState.presets.structures || {};
    if (!structures[AppState.currentChar.structure]) {
      AppState.currentChar.structure = 'left_right';
      AppState.currentChar.structureType = 'lr_standard';
    }
    const tabs = Object.entries(structures).map(([key, val]) =>
      `<div class="structure-tab ${key === AppState.currentChar.structure ? 'active' : ''}" data-structure="${key}">${val.name}</div>`
    ).join('');
    $('#structure-tabs').innerHTML = tabs;
    $('#structure-tabs').querySelectorAll('.structure-tab').forEach(el => {
      el.addEventListener('click', () => {
         AudioEngine.playSfx('chime', -16, 300);
         AppState.currentChar.structure = el.dataset.structure;
        renderStructurePanel();
        updateCanvas();
      });
    });

    // 渲染结构选项
    const currentStruct = structures[AppState.currentChar.structure];
    if (currentStruct && currentStruct.types) {
      $('#structure-options').innerHTML = currentStruct.types.map(t =>
        `<div class="structure-option ${t.id === AppState.currentChar.structureType ? 'active' : ''}" data-type="${t.id}">${t.name}</div>`
      ).join('');
      $('#structure-options').querySelectorAll('.structure-option').forEach(el => {
        el.addEventListener('click', () => {
           AudioEngine.playSfx('chime', -16, 300);
           AppState.currentChar.structureType = el.dataset.type;
          renderStructurePanel();
          updateCanvas();
        });
      });
    }
  }

  function updateCanvas() {
    const canvas = $('#char-canvas');
    const comps = AppState.currentChar.components;

    if (comps.length === 0) {
      canvas.innerHTML = '<div class="canvas-empty-hint">从下方选择构件<br>开始造字</div>';
      syncTransformPanel(null);
      $('#btn-generate').disabled = true;
      canvas.classList.remove('free-mode');
      return;
    }

    $('#btn-generate').disabled = false;
    canvas.classList.add('free-mode'); // 有构件即可编辑
    canvas.innerHTML = '';

    const structure = AppState.currentChar.structure;
    const structType = AppState.currentChar.structureType;
    const canvasW = canvas.offsetWidth || 220;
    const canvasH = canvas.offsetHeight || 220;

    if (comps.length === 1) {
      // 单构件居中
      const el = createCanvasComponent(comps[0], canvasW * 0.6, canvasH * 0.6, canvasW * 0.2, canvasH * 0.2, 'normal');
      canvas.appendChild(el);
      makeEditable(el);
    } else if (comps.length >= 2) {
      const ratio = getRatio(structType);
      if (structure === 'left_right') {
        // 左右结构自动贴合
        const leftW = canvasW * ratio.left * 0.88;
        const rightW = canvasW * ratio.right * 0.88;
        const gap = canvasW * 0.02;
        const totalW = leftW + rightW + gap;
        const startX = (canvasW - totalW) / 2;
        const el1 = createCanvasComponent(comps[0], leftW, canvasH * 0.88, startX, canvasH * 0.06, 'left');
        const el2 = createCanvasComponent(comps[1], rightW, canvasH * 0.88, startX + leftW + gap, canvasH * 0.06, 'normal');
        canvas.appendChild(el1);
        canvas.appendChild(el2);
        makeEditable(el1);
        makeEditable(el2);
      } else if (structure === 'top_bottom') {
        // 上下结构自动贴合
        const topH = canvasH * ratio.top * 0.88;
        const bottomH = canvasH * ratio.bottom * 0.88;
        const gap = canvasH * 0.02;
        const totalH = topH + bottomH + gap;
        const startY = (canvasH - totalH) / 2;
        const el1 = createCanvasComponent(comps[0], canvasW * 0.82, topH, canvasW * 0.09, startY, 'top');
        const el2 = createCanvasComponent(comps[1], canvasW * 0.82, bottomH, canvasW * 0.09, startY + topH + gap, 'normal');
        canvas.appendChild(el1);
        canvas.appendChild(el2);
        makeEditable(el1);
        makeEditable(el2);
      } else if (structure === 'enclosing') {
        // 三种包围结构：全包围/上包围/侧包围，不同构形逻辑
        let outer, inner;
        if (structType === 'en_top') {
          // 上包围：上方构件覆盖，下方构件下移
          outer = { w: canvasW * 0.88, h: canvasH * 0.42, x: canvasW * 0.06, y: canvasH * 0.04 };
          inner = { w: canvasW * 0.62, h: canvasH * 0.50, x: canvasW * 0.19, y: canvasH * 0.44 };
        } else if (structType === 'en_side') {
          // 侧包围：左侧偏旁，右侧主体
          outer = { w: canvasW * 0.42, h: canvasH * 0.88, x: canvasW * 0.04, y: canvasH * 0.06 };
          inner = { w: canvasW * 0.52, h: canvasH * 0.72, x: canvasW * 0.44, y: canvasH * 0.14 };
        } else {
          // 全包围：外部形成框，内部缩小居中
          outer = { w: canvasW * 0.92, h: canvasH * 0.92, x: canvasW * 0.04, y: canvasH * 0.04 };
          inner = { w: canvasW * 0.50, h: canvasH * 0.50, x: canvasW * 0.25, y: canvasH * 0.24 };
        }
        const el1 = createCanvasComponent(comps[0], outer.w, outer.h, outer.x, outer.y, 'enclosing');
        const el2 = createCanvasComponent(comps[1], inner.w, inner.h, inner.x, inner.y, 'inside');
        canvas.appendChild(el1);
        canvas.appendChild(el2);
        makeEditable(el1);
        makeEditable(el2);
      } else {
        const el1 = createCanvasComponent(comps[0], canvasW * 0.44, canvasH * 0.88, canvasW * 0.04, canvasH * 0.06, 'left');
        const el2 = createCanvasComponent(comps[1], canvasW * 0.44, canvasH * 0.88, canvasW * 0.52, canvasH * 0.06, 'normal');
        canvas.appendChild(el1);
        canvas.appendChild(el2);
        makeEditable(el1);
        makeEditable(el2);
      }
    }
  }

  function createCanvasComponent(comp, w, h, x, y, variant) {
    const el = document.createElement('div');
    el.className = 'canvas-component';
    el.style.width = w + 'px';
    el.style.height = h + 'px';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.fontFamily = 'var(--font-banshu)';
    el.style.fontSize = Math.min(w, h) * 0.7 + 'px';
    el.textContent = comp.name;
    el.dataset.id = comp.id;
    el.dataset.componentId = comp.id;
    // 记录初始尺寸。宽/高调整以此为基准，真正改变构件字形的横纵比例，
    // 而不是只改变外面的空白盒子。
    el.dataset.baseW = String(w);
    el.dataset.baseH = String(h);
    el.dataset.rotate = '0';
    applyComponentTransform(el);
    return el;
  }

  function getRatio(type) {
    const ratios = {
      'lr_standard': { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5 },
      'lr_narrow_wide': { left: 0.38, right: 0.62, top: 0.5, bottom: 0.5 },
      'lr_wide_narrow': { left: 0.62, right: 0.38, top: 0.5, bottom: 0.5 },
      'tb_balanced': { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5 },
      'tb_narrow_wide': { left: 0.5, right: 0.5, top: 0.38, bottom: 0.62 },
      'tb_wide_narrow': { left: 0.5, right: 0.5, top: 0.62, bottom: 0.38 },
      'en_full': { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5 },
      'en_top': { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5 },
      'en_side': { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5 }
    };
    return ratios[type] || ratios['lr_standard'];
  }

  function initWorkshop() {
    initComponentTransformPanel();
    $('#btn-clear-canvas').addEventListener('click', () => {
      AppState.currentChar.components = [];
      AppState.selectedComponentIndex = -1;
      AppState.currentChar.customLayout = false;
      syncTransformPanel(null);
      renderComponentLibrary();
      updateCanvas();
    });

    $('#btn-generate').addEventListener('click', async () => {
      if (AppState.currentChar.components.length === 0) {
        showToast('先选择一个构件，让你的字有一个开始');
        return;
      }
      // 保存用户编辑后的布局并导出完整新字图像（html2canvas截图）
      saveFreeLayout();
      await exportGlyph();
      AppState.currentChar.customLayout = true;
      inkTransition(() => navigateTo('analysis'));
    });

    // 点击画布空白处：取消选中 + 自动收字进入预览
    const canvas = $('#char-canvas');
    if (canvas) {
      canvas.addEventListener('mousedown', (e) => {
        if (e.target === canvas) {
          document.querySelectorAll('.canvas-component.selected').forEach(s => s.classList.remove('selected'));
          autoFitGlyph();
        }
      });
    }
  }

  // 自动收字：计算所有构件边界，统一缩放并居中
  function autoFitGlyph() {
    const canvas = $('#char-canvas');
    const comps = canvas.querySelectorAll('.canvas-component');
    if (comps.length === 0) return;

    const canvasW = canvas.offsetWidth || 220;
    const canvasH = canvas.offsetHeight || 220;

    // 计算所有构件的整体边界
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    comps.forEach(el => {
      const x = parseFloat(el.style.left) || 0;
      const y = parseFloat(el.style.top) || 0;
      const w = parseFloat(el.style.width) || 100;
      const h = parseFloat(el.style.height) || 100;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + w);
      maxY = Math.max(maxY, y + h);
    });

    const groupW = maxX - minX;
    const groupH = maxY - minY;
    if (groupW <= 0 || groupH <= 0) return;

    // 计算缩放比例，让整体占画布的80%
    const targetW = canvasW * 0.8;
    const targetH = canvasH * 0.8;
    const scale = Math.min(targetW / groupW, targetH / groupH, 1.2);

    // 计算居中偏移
    const newGroupW = groupW * scale;
    const newGroupH = groupH * scale;
    const offsetX = (canvasW - newGroupW) / 2 - minX * scale;
    const offsetY = (canvasH - newGroupH) / 2 - minY * scale;

    // 应用到每个构件
    comps.forEach(el => {
      const x = parseFloat(el.style.left) || 0;
      const y = parseFloat(el.style.top) || 0;
      const w = parseFloat(el.style.width) || 100;
      const h = parseFloat(el.style.height) || 100;
      el.style.left = (x * scale + offsetX) + 'px';
      el.style.top = (y * scale + offsetY) + 'px';
      const newW = w * scale;
      const newH = h * scale;
      el.style.width = newW + 'px';
      el.style.height = newH + 'px';
      // 自动收字后把当前尺寸作为新的基准，避免已有宽窄比例被重复放大。
      el.dataset.baseW = String(newW);
      el.dataset.baseH = String(newH);
      applyComponentTransform(el);
    });
  }

  // 保存自由布局
  function saveFreeLayout() {
    const canvas = $('#char-canvas');
    const comps = canvas.querySelectorAll('.canvas-component');
    const layout = [];
    comps.forEach(el => {
      layout.push({
        id: el.dataset.id,
        x: parseFloat(el.style.left) || 0,
        y: parseFloat(el.style.top) || 0,
        w: parseFloat(el.style.width) || 100,
        h: parseFloat(el.style.height) || 100,
        baseW: parseFloat(el.dataset.baseW) || parseFloat(el.style.width) || 100,
        baseH: parseFloat(el.dataset.baseH) || parseFloat(el.style.height) || 100,
        widthRatio: parseFloat(el.dataset.widthRatio) || 1,
        heightRatio: parseFloat(el.dataset.heightRatio) || 1,
        rotate: el.dataset.rotate || 0
      });
    });
    AppState.currentChar.freeLayout = layout;
  }

  // 导出画布为完整新字图像（使用html2canvas截图，保证与用户看到的完全一致）
  async function exportGlyph() {
    const canvas = $('#char-canvas');
    if (!canvas) return null;

    // 先取消所有选中状态，避免红框/控制点进入截图
    document.querySelectorAll('.canvas-component.selected').forEach(s => s.classList.remove('selected'));

    try {
      // 使用html2canvas截图画布，透明背景
      const captured = await html2canvas(canvas, {
        backgroundColor: null,
        scale: 3,
        useCORS: true,
        logging: false
      });

      const dataUrl = captured.toDataURL('image/png');
      const glyph = {
        id: Date.now(),
        image: dataUrl,
        components: AppState.currentChar.components.map(c => ({
          char: c.name,
          id: c.id
        })),
        structure: AppState.currentChar.structure
      };
      sessionStorage.setItem('createdGlyph', JSON.stringify(glyph));
      AppState.createdGlyph = glyph;
      // 同步保存到当前作品，保证进入海报页、刷新页面后仍能显示真正的新造字。
      AppState.currentChar.glyphImage = dataUrl;
      return glyph;
    } catch(e) {
      console.error('html2canvas截图失败，回退到Canvas绘制:', e);
      // 回退方案：用Canvas手动绘制
      return exportGlyphFallback();
    }
  }

  // 回退方案：Canvas手动绘制（html2canvas失败时使用）
  function exportGlyphFallback() {
    const canvas = $('#char-canvas');
    const comps = canvas.querySelectorAll('.canvas-component');
    if (comps.length === 0) return null;

    const canvasW = canvas.offsetWidth || 220;
    const canvasH = canvas.offsetHeight || 220;
    const scale = 3;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvasW * scale;
    exportCanvas.height = canvasH * scale;
    const ctx = exportCanvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.clearRect(0, 0, canvasW, canvasH);

    comps.forEach(el => {
      const x = parseFloat(el.style.left) || 0;
      const y = parseFloat(el.style.top) || 0;
      const w = parseFloat(el.style.width) || 100;
      const h = parseFloat(el.style.height) || 100;
      const rotate = parseFloat(el.dataset.rotate) || 0;
      const char = el.textContent;
      const fontFamily = getComputedStyle(el).fontFamily;
      const baseW = parseFloat(el.dataset.baseW) || w;
      const baseH = parseFloat(el.dataset.baseH) || h;
      const sx = Math.max(0.35, Math.min(3, w / baseW));
      const sy = Math.max(0.35, Math.min(3, h / baseH));

      ctx.save();
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate(rotate * Math.PI / 180);
      ctx.scale(sx, sy);
      ctx.fillStyle = '#171614';
      ctx.font = `${Math.min(baseW, baseH) * 0.7}px ${fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(char, 0, 0);
      ctx.restore();
    });

    const dataUrl = exportCanvas.toDataURL('image/png');
    const glyph = {
      id: Date.now(),
      image: dataUrl,
      components: AppState.currentChar.components.map(c => ({
        char: c.name,
        id: c.id
      })),
      structure: AppState.currentChar.structure
    };
    sessionStorage.setItem('createdGlyph', JSON.stringify(glyph));
    AppState.createdGlyph = glyph;
    // 将最终新造字图像同步挂到当前作品，保证进入海报页或刷新后仍能恢复。
    AppState.currentChar.glyphImage = dataUrl;
    return glyph;
  }

  function applyComponentTransform(el) {
    if (!el) return;
    const w = parseFloat(el.style.width) || 100;
    const h = parseFloat(el.style.height) || 100;
    const baseW = parseFloat(el.dataset.baseW) || w;
    const baseH = parseFloat(el.dataset.baseH) || h;
    const rotate = parseFloat(el.dataset.rotate) || 0;
    const sx = Math.max(0.35, Math.min(3, w / baseW));
    const sy = Math.max(0.35, Math.min(3, h / baseH));
    el.style.transformOrigin = 'center center';
    el.style.transform = `scaleX(${sx}) scaleY(${sy}) rotate(${rotate}deg)`;
    el.style.fontSize = Math.min(baseW, baseH) * 0.7 + 'px';
    el.dataset.widthRatio = String(sx);
    el.dataset.heightRatio = String(sy);
  }

  function syncTransformPanel(el) {
    const panel = $('#component-transform-panel');
    if (!panel) return;
    if (!el) {
      panel.hidden = true;
      return;
    }
    panel.hidden = false;
    const w = parseFloat(el.style.width) || 100;
    const h = parseFloat(el.style.height) || 100;
    const baseW = parseFloat(el.dataset.baseW) || w;
    const baseH = parseFloat(el.dataset.baseH) || h;
    const widthRange = $('#component-width-range');
    const heightRange = $('#component-height-range');
    const widthValue = $('#component-width-value');
    const heightValue = $('#component-height-value');
    if (widthRange) widthRange.value = Math.round((w / baseW) * 100);
    if (heightRange) heightRange.value = Math.round((h / baseH) * 100);
    if (widthValue) widthValue.textContent = `${Math.round((w / baseW) * 100)}%`;
    if (heightValue) heightValue.textContent = `${Math.round((h / baseH) * 100)}%`;
  }

  function getSelectedCanvasComponent() {
    return document.querySelector('#char-canvas .canvas-component.selected');
  }

  // 清理旧版本可能残留的部件操作提示文字。
  // 当前版本不显示任何“双指横向拉伸……”提示，只保留比例控制面板本身。
  function removeLegacyTransformHint() {
  }

  function initComponentTransformPanel() {
    removeLegacyTransformHint();
    const panel = $('#component-transform-panel');
    if (!panel) return;
    const widthRange = $('#component-width-range');
    const heightRange = $('#component-height-range');
    const widthValue = $('#component-width-value');
    const heightValue = $('#component-height-value');

    const updateDimension = (dimension, value) => {
      const el = getSelectedCanvasComponent();
      if (!el) return;
      const base = parseFloat(el.dataset[dimension === 'width' ? 'baseW' : 'baseH']) || 100;
      const oldW = parseFloat(el.style.width) || 100;
      const oldH = parseFloat(el.style.height) || 100;
      const next = Math.max(40, Math.min(320, base * (Number(value) / 100)));
      const cx = (parseFloat(el.style.left) || 0) + oldW / 2;
      const cy = (parseFloat(el.style.top) || 0) + oldH / 2;
      if (dimension === 'width') {
        el.style.width = next + 'px';
        el.style.left = (cx - next / 2) + 'px';
        if (widthValue) widthValue.textContent = `${Math.round(Number(value))}%`;
      } else {
        el.style.height = next + 'px';
        el.style.top = (cy - next / 2) + 'px';
        if (heightValue) heightValue.textContent = `${Math.round(Number(value))}%`;
      }
      applyComponentTransform(el);
      saveFreeLayout();
    };

    widthRange?.addEventListener('input', e => updateDimension('width', e.target.value));
    heightRange?.addEventListener('input', e => updateDimension('height', e.target.value));

    $('#component-transform-reset')?.addEventListener('click', () => {
      const el = getSelectedCanvasComponent();
      if (!el) return;
      const baseW = parseFloat(el.dataset.baseW) || 100;
      const baseH = parseFloat(el.dataset.baseH) || 100;
      const oldW = parseFloat(el.style.width) || baseW;
      const oldH = parseFloat(el.style.height) || baseH;
      const cx = (parseFloat(el.style.left) || 0) + oldW / 2;
      const cy = (parseFloat(el.style.top) || 0) + oldH / 2;
      el.style.width = baseW + 'px';
      el.style.height = baseH + 'px';
      el.style.left = (cx - baseW / 2) + 'px';
      el.style.top = (cy - baseH / 2) + 'px';
      applyComponentTransform(el);
      syncTransformPanel(el);
      saveFreeLayout();
    });

    panel.hidden = true;
  }

  // 使构件可拖动、缩放、旋转
  function makeEditable(el) {
    let isDragging = false;
    let isResizing = false;
    let isRotating = false;
    let lastBrushAt = 0;
    let lastNearAt = 0;
    let startX, startY, startLeft, startTop, startW, startH, startRotate;

    el.addEventListener('mousedown', (e) => {
      // 选中
      document.querySelectorAll('.canvas-component.selected').forEach(s => s.classList.remove('selected'));
      el.classList.add('selected');
      syncTransformPanel(el);
       const compId = el.dataset.componentId;
       const elementKey = { sun:'sun', moon:'moon', mountain:'mountain', water:'water', fire:'fire', tree:'wood', wood:'wood', earth:'earth' }[compId];
       if (elementKey) AudioEngine.playSfx(elementKey, ({sun:-15,moon:-17,mountain:-14,water:-16,fire:-14,wood:-17,earth:-15}[elementKey] || -16), 1000);
       else AudioEngine.playSfx('chime', -16, 300);
      e.stopPropagation();

      const rect = el.getBoundingClientRect();
      const canvasRect = el.parentElement.getBoundingClientRect();

      // 判断是否点击了缩放控制点（右上角）
      const relX = e.clientX - rect.left;
      const relY = e.clientY - rect.top;
      if (relX > rect.width - 20 && relY < 20) {
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startW = parseFloat(el.style.width) || rect.width;
        startH = parseFloat(el.style.height) || rect.height;
      }
      // 判断是否点击了旋转控制点（顶部）
      else if (relY < -10 || (relY < 15 && relX > rect.width / 2 - 15 && relX < rect.width / 2 + 15)) {
        isRotating = true;
        startRotate = parseFloat(el.dataset.rotate) || 0;
        startX = e.clientX;
      }
      else {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startLeft = parseFloat(el.style.left) || 0;
        startTop = parseFloat(el.style.top) || 0;
      }
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        el.style.left = (startLeft + dx) + 'px';
        el.style.top = (startTop + dy) + 'px';
      } else if (isResizing) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const newW = Math.max(30, startW + dx);
        const newH = Math.max(30, startH + dy);
        el.style.width = newW + 'px';
        el.style.height = newH + 'px';
        applyComponentTransform(el);
        syncTransformPanel(el);
      } else if (isRotating) {
        const dx = e.clientX - startX;
        const rotate = startRotate + dx * 0.5;
        el.dataset.rotate = rotate;
        applyComponentTransform(el);
      }
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
      isResizing = false;
      isRotating = false;
    });

    // 手机触摸：单指拖动；双指捏住旋转选中构件（附带等比缩放）。
    // 双指角度变化 => 旋转；双指距离变化 => 等比缩放。
    let pinchActive = false;
    let pinchStartAngle = 0;
    let pinchStartDistance = 0;
    let pinchStartRotate = 0;
    let pinchStartW = 0;
    let pinchStartH = 0;
    let pinchStartLeft = 0;
    let pinchStartTop = 0;

    const touchAngle = (a, b) => Math.atan2(b.clientY - a.clientY, b.clientX - a.clientX) * 180 / Math.PI;
    const touchDistance = (a, b) => Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);

    el.addEventListener('touchstart', (e) => {
      document.querySelectorAll('.canvas-component.selected').forEach(s => s.classList.remove('selected'));
      el.classList.add('selected');
      syncTransformPanel(el);
      e.stopPropagation();

      if (e.touches.length >= 2) {
        pinchActive = true;
        isDragging = false;
        const a = e.touches[0], b = e.touches[1];
        pinchStartAngle = touchAngle(a, b);
        pinchStartDistance = touchDistance(a, b);
        pinchStartRotate = parseFloat(el.dataset.rotate) || 0;
        pinchStartW = parseFloat(el.style.width) || el.getBoundingClientRect().width;
        pinchStartH = parseFloat(el.style.height) || el.getBoundingClientRect().height;
        pinchStartLeft = parseFloat(el.style.left) || 0;
        pinchStartTop = parseFloat(el.style.top) || 0;
        e.preventDefault();
        return;
      }

      const touch = e.touches[0];
      isDragging = true;
      startX = touch.clientX;
      startY = touch.clientY;
      startLeft = parseFloat(el.style.left) || 0;
      startTop = parseFloat(el.style.top) || 0;
      e.preventDefault();
    }, { passive: false });

    el.addEventListener('touchmove', (e) => {
      if (pinchActive && e.touches.length >= 2) {
        const a = e.touches[0], b = e.touches[1];
        const currentAngle = touchAngle(a, b);
        const currentDistance = touchDistance(a, b);

        // 双指旋转：角度差直接应用到构件旋转
        const angleDelta = currentAngle - pinchStartAngle;
        const newRotate = pinchStartRotate + angleDelta;
        el.dataset.rotate = newRotate;

        // 双指等比缩放：距离比作为缩放因子
        if (pinchStartDistance > 0) {
          const scale = Math.max(0.3, Math.min(2.5, currentDistance / pinchStartDistance));
          const newW = Math.max(24, Math.min(360, pinchStartW * scale));
          const newH = Math.max(24, Math.min(360, pinchStartH * scale));
          // 以原构件中心为锚点，缩放时不漂移
          const centerX = pinchStartLeft + pinchStartW / 2;
          const centerY = pinchStartTop + pinchStartH / 2;
          el.style.width = newW + 'px';
          el.style.height = newH + 'px';
          el.style.left = (centerX - newW / 2) + 'px';
          el.style.top = (centerY - newH / 2) + 'px';
        }

        applyComponentTransform(el);
        syncTransformPanel(el);
        e.preventDefault();
        return;
      }

      if (isDragging && e.touches.length === 1) {
        const touch = e.touches[0];
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;
        el.style.left = (startLeft + dx) + 'px';
        el.style.top = (startTop + dy) + 'px';
        e.preventDefault();
      }
    }, { passive: false });

    el.addEventListener('touchend', (e) => {
      if (e.touches.length < 2) {
        if (pinchActive) {
          saveFreeLayout();
          syncTransformPanel(el);
        }
        pinchActive = false;
      }
      if (e.touches.length === 0) isDragging = false;
    });

    el.addEventListener('touchcancel', () => {
      if (pinchActive) saveFreeLayout();
      pinchActive = false;
      isDragging = false;
    });

  }

  // ===== P05 六书构形分析 =====
  function startAnalysisAnimation() {
    const labels = ['象形', '会意', '指事', '形声', '转注', '假借'];
    const ring = document.getElementById('ring-outer');
    if (!ring) { console.error('ring-outer不存在'); return; }
    ring.innerHTML = '';

    // 中间显示用户造出的完整新字图像
    const centerEl = document.querySelector('.ring-center');
    const glyph = AppState.createdGlyph || JSON.parse(sessionStorage.getItem('createdGlyph') || 'null');
    if (centerEl && glyph && glyph.image) {
      centerEl.innerHTML = `<img src="${glyph.image}" alt="新造字" style="width:80px;height:80px;object-fit:contain;">`;
    }

    labels.forEach((label, i) => {
      const angle = (i / 6) * 360;
      const rad = (angle - 90) * Math.PI / 180;
      const r = 120;
      const x = 140 + r * Math.cos(rad) - 25;
      const y = 140 + r * Math.sin(rad) - 10;
      const el = document.createElement('div');
      el.className = 'ring-label';
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.textContent = label;
      ring.appendChild(el);
    });

    // 2.5秒后锁定类别并跳转
    setTimeout(() => {
      try {
        // 转盘停止后，所有候选字保持完全一致的普通状态，不加红/加粗/放大
        const textEl = document.getElementById('analysis-text');
        if (textEl) textEl.textContent = '构形完成，正在赋予意义……';

        setTimeout(() => {
          try { inkTransition(() => navigateTo('meaning')); }
          catch(e) { console.error('跳转失败:', e); navigateTo('meaning'); }
        }, 1200);
      } catch(e) {
        console.error('分析动画错误:', e);
        // 出错也继续跳转
        setTimeout(() => navigateTo('meaning'), 500);
      }
    }, 2500);
  }

  // ===== P06 释义页 =====
  function renderMeaningPreview() {
    const comps = AppState.currentChar.components;
    const compNames = comps.map(c => c.name).join(' + ');
    $('#meaning-components').textContent = compNames;

    // 顶部显示用户造出的完整新字图像
    const charEl = $('#meaning-char');
    const glyph = AppState.createdGlyph || JSON.parse(sessionStorage.getItem('createdGlyph') || 'null');
    if (glyph && glyph.image) {
      charEl.innerHTML = `<img src="${glyph.image}" alt="新造字" style="width:120px;height:120px;object-fit:contain;">`;
    } else {
      // 兜底：文字拼接
      if (comps.length === 1) {
        charEl.textContent = comps[0].name;
      } else {
        charEl.textContent = comps.map(c => c.name).join('');
      }
    }

    // 推荐释义
    if (!AppState.currentChar.meaning) {
      AppState.currentChar.meaning = generateMeaning();
      $('#meaning-input').value = AppState.currentChar.meaning;
    }
  }

  function generateMeaning() {
    const comps = AppState.currentChar.components;
    if (comps.length === 0) return '';
    const meanings = {
      sun: '光明', moon: '思念', mountain: '高远', water: '流动',
      fire: '热情', tree: '生长', person: '人间', heart: '心事',
      eye: '目光', mouth: '言语', hand: '把握', door: '归途',
      stone: '坚定', earth: '根基', clothes: '温暖', vehicle: '远行'
    };
    if (comps.length === 1) {
      return `心中有${meanings[comps[0].id] || comps[0].name}，便是此刻。`;
    }
    const m1 = meanings[comps[0].id] || comps[0].name;
    const m2 = meanings[comps[1].id] || comps[1].name;
    return `${m1}与${m2}相遇，生出新的心意。`;
  }

  function renderStyleCards() {
    const styles = AppState.presets.interpretationStyles || {};
    const container = $('#style-cards');
    const currentStyle = AppState.currentChar.style;
    container.innerHTML = Object.entries(styles).map(([id, s]) =>
      `<div class="style-card ${id === currentStyle ? 'active' : ''}" data-style="${id}">
        <div class="style-card-name">${s.name}</div>
        <div class="style-card-desc">${s.description}</div>
        <div class="style-card-preview">${getStylePreview(id)}</div>
      </div>`
    ).join('');
    container.querySelectorAll('.style-card').forEach(el => {
      el.addEventListener('click', () => {
        const styleId = el.dataset.style;
        // 互斥：点击已选中的则收起，否则切换到新的
        if (AppState.currentChar.style === styleId) {
          AppState.currentChar.style = null;
          hideMeaningModal();
        } else {
          AppState.currentChar.style = styleId;
           AudioEngine.playSfx('chime', -15, 300, styleId === 'modern' ? 1.12 : (styleId === 'minimal' ? 0.90 : 1.0));
          showMeaningModal(styleId);
        }
        renderStyleCards();
      });
    });
  }

  // 显示释义弹窗
  function showMeaningModal(styleId) {
    const styles = AppState.presets.interpretationStyles || {};
    const s = styles[styleId] || {};
    const comps = AppState.currentChar.components;
    const charName = comps.length === 1 ? comps[0].name : comps.map(c => c.name).join('');

    $('#modalCharacter').textContent = charName;
    $('#modalStyle').textContent = s.name || '';
    $('#modalMeaning').textContent = getStylePreview(styleId);
    $('#meaningOverlay').classList.add('show');
  }

  // 关闭释义弹窗
  function hideMeaningModal() {
    $('#meaningOverlay').classList.remove('show');
  }

  function getStylePreview(styleId) {
    const comps = AppState.currentChar.components;
    const compNames = comps.map(c => c.name).join('、');
    const meaning = AppState.currentChar.meaning || '心有所向';
    if (styleId === 'classical') {
      return `从${comps[0]?.name || '心'}从${comps[1]?.name || '月'}，${meaning.substring(0, 8)}之意。`;
    } else if (styleId === 'modern') {
      return meaning;
    } else {
      return `${comps[0]?.name || '心'} · ${comps[1]?.name || '月'} · 念`;
    }
  }

  function initMeaning() {
    $('#meaning-input').addEventListener('input', (e) => {
      AppState.currentChar.meaning = sanitizeInput(e.target.value);
    });

    $('#meaning-confirm-btn').addEventListener('click', () => {
      // 风格选择是可选的，不选也可以直接赋予意义
      const meaning = $('#meaning-input').value.trim();
      if (!meaning) {
        AppState.currentChar.meaning = generateMeaning();
        $('#meaning-input').value = AppState.currentChar.meaning;
      } else {
        AppState.currentChar.meaning = sanitizeInput(meaning);
      }
      // 计算人格
      AppState.currentChar.personality = calculatePersonality();
      inkTransition(() => navigateTo('charcard'));
    });

    // 弹窗关闭按钮
    const modalClose = document.getElementById('modalClose');
    if (modalClose) {
      modalClose.addEventListener('click', () => {
        hideMeaningModal();
        AppState.currentChar.style = null;
        renderStyleCards();
      });
    }

    // 弹窗"赋予它意义"按钮
    const modalGiveBtn = document.getElementById('modalGiveMeaning');
    if (modalGiveBtn) {
      modalGiveBtn.addEventListener('click', () => {
        const meaning = $('#meaning-input').value.trim();
        if (!meaning) {
          AppState.currentChar.meaning = generateMeaning();
          $('#meaning-input').value = AppState.currentChar.meaning;
        } else {
          AppState.currentChar.meaning = sanitizeInput(meaning);
        }
        AppState.currentChar.personality = calculatePersonality();
        hideMeaningModal();
        inkTransition(() => navigateTo('charcard'));
      });
    }

    // 点击遮罩关闭弹窗
    const overlay = document.getElementById('meaningOverlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          hideMeaningModal();
          AppState.currentChar.style = null;
          renderStyleCards();
        }
      });
    }
  }

  function calculatePersonality() {
    const fallback = [
      { name: '会意魔法师', description: '擅长将不同意象组合成新的心意。' },
      { name: '象形观察家', description: '善于从万物形态中发现新的表达。' },
      { name: '构形设计师', description: '专注结构与秩序，创造独特字形。' },
      { name: '情绪造字师', description: '用情感连接笔画与意义。' }
    ];
    const personalities = (AppState.presets.personalities || []).filter(p =>
      ['会意魔法师','象形观察家','构形设计师','情绪造字师'].includes(p.name)
    );
    const pool = personalities.length === 4 ? personalities : fallback;
    // 随机一次，结果由 saveCurrentChar 持久化，不随查看变化
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // ===== 古籍字卡 =====
  function renderCharCard() {
     AudioEngine.playSfx('success', -9, 1500);
    const char = AppState.currentChar;
    const comps = char.components;
    const styles = AppState.presets.interpretationStyles || {};
    // 没有选择风格时，styleName为空，不显示
    const styleName = char.style ? (styles[char.style]?.name || '') : '';

    // 字：使用导出的完整新字图像
    const charEl = document.getElementById('charcard-char');
    const glyph = AppState.createdGlyph || JSON.parse(sessionStorage.getItem('createdGlyph') || 'null');
    if (glyph && glyph.image) {
      charEl.innerHTML = `<img src="${glyph.image}" alt="新造字" style="width:100px;height:100px;object-fit:contain;">`;
    } else {
      const charName = comps.length === 1 ? comps[0].name : comps.map(c => c.name).join('');
      charEl.textContent = charName;
    }

    // 构件
    const compEl = document.getElementById('charcard-components');
    if (compEl) compEl.textContent = comps.map(c => c.name).join(' + ');

    // 风格：没有选择时隐藏
    const styleEl = document.getElementById('charcard-style');
    if (styleEl) {
      if (styleName) {
        styleEl.textContent = styleName;
        styleEl.style.display = '';
      } else {
        styleEl.style.display = 'none';
      }
    }

    // 释义
    const meaningEl = document.getElementById('charcard-meaning');
    if (meaningEl) meaningEl.textContent = char.meaning || '心有所向，便是此刻。';

    // 用户名
    const footerEl = document.getElementById('charcard-footer');
    if (footerEl) footerEl.textContent = (AppState.userName || '字造师') + ' · 创意生成';
  }

  function initCharCard() {
    const btn = document.getElementById('charcard-next-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        inkTransition(() => navigateTo('certify'));
      });
    }
  }

  // ===== P07 认证页 =====
  function renderCertification() {
    const char = AppState.currentChar;
    const personality = char.personality || { name: '会意魔法师', description: '擅长把两个已有意义组合起来' };

    $('#personality-name').textContent = personality.name;
    $('#personality-desc').textContent = personality.description;

    $('#certify-name').textContent = AppState.userName || '字造师';
    $('#certify-type').textContent = personality.name;

    // 星级（使用100分制最终分数）
    const scores = AppState.finalScores || AppState.abilityScores;
    const toStars = (s) => '★'.repeat(Math.min(5, Math.ceil(s / 20))) + '☆'.repeat(Math.max(0, 5 - Math.ceil(s / 20)));
    $('#certify-structure').textContent = toStars(scores.structure);
    $('#certify-association').textContent = toStars(scores.association);
    $('#certify-creativity').textContent = toStars(scores.design);
    $('#certify-count').textContent = String(AppState.collection.length + 1).padStart(2, '0');
     [0,1,2,3,4].forEach((i) => setTimeout(() => AudioEngine.playSfx('chime', -17, 300, 0.95 + i*0.08), 220 + i*240));
     setTimeout(() => AudioEngine.playSfx('success', -9, 1500), 1550);
  }

  function initCertify() {
    $('#certify-continue-btn').addEventListener('click', () => {
      // 保存到字造集
      saveCurrentChar();
      inkTransition(() => navigateTo('poster'));
    });
  }

  function saveCurrentChar() {
    const char = {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      components: AppState.currentChar.components,
      structure: AppState.currentChar.structure,
      structureType: AppState.currentChar.structureType,
      structureName: getStructureName(),
      freeLayout: AppState.currentChar.freeLayout || null,
      meaning: AppState.currentChar.meaning,
      style: AppState.currentChar.style,
      styleName: getStyleName(),
      personality: AppState.currentChar.personality,
      charName: AppState.currentChar.components.map(c => c.name).join(''),
      userName: AppState.userName,
      charIndex: getCharIndexName(),
      // 持久化新造字成品图，避免刷新/重新进入海报页后只剩“（新造字）”占位符。
      glyphImage: AppState.createdGlyph?.image || AppState.currentChar.glyphImage || null
    };
    AppState.collection.unshift(char);
    saveCollection();
  }

  function getStructureName() {
    const structures = AppState.presets.structures || {};
    const s = structures[AppState.currentChar.structure];
    if (!s) return '';
    const t = s.types?.find(t => t.id === AppState.currentChar.structureType);
    return s.name + (t ? '·' + t.name : '');
  }

  function getStyleName() {
    const styles = AppState.presets.interpretationStyles || {};
    return AppState.currentChar.style ? (styles[AppState.currentChar.style]?.name || '') : '';
  }

  function getCharIndexName() {
    const count = AppState.collection.length + 1;
    const names = ['第一个', '第二个', '第三个', '第四个', '第五个'];
    return names[count - 1] || `第${count}个`;
  }

  // ===== P09 海报页 =====
  async function generatePoster() {
    const canvas = $('#poster-canvas');
    const char = AppState.collection[0] || AppState.currentChar;

    // 优先使用当前内存中的成品，其次读取已持久化到作品记录里的成品图。
    let glyph = AppState.createdGlyph || null;
    if (!glyph) {
      try { glyph = JSON.parse(sessionStorage.getItem('createdGlyph') || 'null'); } catch (_) {}
    }
    const persistedGlyphImage = glyph?.image || char?.glyphImage || AppState.currentChar?.glyphImage || null;

    const posterData = {
      ...char,
      components: char.components,
      meaning: char.meaning,
      personality: char.personality,
      userName: AppState.userName,
      year: '2026',
      charIndex: char.charIndex || '第一个',
      glyphImage: persistedGlyphImage
    };

    // 设置当前背景，传null让generate使用内部currentBgId。
    PosterGenerator.setBackground(AppState.posterBg);
    await PosterGenerator.generate(posterData, null, canvas);
  }

  function renderBgSwitcher() {
    const bgs = PosterGenerator.getBackgrounds();
    const container = $('#poster-bg-switch');
    container.innerHTML = bgs.map(bg =>
      `<div class="bg-dot ${bg.id === AppState.posterBg ? 'active' : ''}"
            data-bg="${bg.id}"
            style="background-image:url('${bg.image}');background-size:cover;background-position:center;"
            title="${bg.name}"></div>`
    ).join('');
    container.querySelectorAll('.bg-dot').forEach(el => {
      el.addEventListener('click', async () => {
        const bgId = el.dataset.bg;
        AudioEngine.playSfx('chime', -16, 300);
        AppState.posterBg = bgId;
        localStorage.setItem('posterBg', bgId);
        PosterGenerator.setBackground(bgId);
        // 立即更新可视背景，随后再异步重绘 Canvas；避免手机端点击后看起来没有切换。
        const posterCanvas = $('#poster-canvas');
        const bgDef = bgs.find(item => item.id === bgId);
        if (posterCanvas && bgDef) {
          posterCanvas.style.backgroundImage = `url(\"${new URL(bgDef.image, document.baseURI).href}\")`;
          posterCanvas.style.backgroundSize = 'cover';
          posterCanvas.style.backgroundPosition = 'center';
          posterCanvas.style.backgroundRepeat = 'no-repeat';
        }
        renderBgSwitcher();
        await generatePoster();
      });
    });
  }

  function initPoster() {
    $('#btn-save-poster').addEventListener('click', async () => {
      const canvas = $('#poster-canvas');
      const success = await PosterGenerator.saveAsImage(canvas, `字造集_${AppState.userName}_${Date.now()}.png`);
      if (success === 'mobile') showToast('海报已生成，请长按图片保存');
      else if (success) showToast('海报已保存');
    });

    $('#btn-new-char').addEventListener('click', () => {
      resetCurrentChar();
      inkTransition(() => navigateTo('workshop'));
    });

    $('#btn-view-collection').addEventListener('click', () => {
      inkTransition(() => navigateTo('collection'));
    });
  }

  function resetCurrentChar() {
    AppState.currentChar = {
      components: [],
      structure: 'left_right',
      structureType: 'lr_standard',
      meaning: '',
      style: null,
      personality: null,
      customLayout: false
    };
    AppState.selectedComponentIndex = -1;
  }

  // ===== P10 字造集 =====
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  function renderCollectionGlyph(char) {
    const image = char?.glyphImage;
    if (image) {
      return `<img class="collection-glyph-image" src="${escapeHtml(image)}" alt="用户造字" draggable="false">`;
    }

    const comps = Array.isArray(char?.components) ? char.components : [];
    const labels = comps.map(c => c?.name || c?.char || '').filter(Boolean).slice(0, 2);
    if (!labels.length) return '<span class="collection-glyph-fallback">字</span>';
    if (labels.length === 1) return `<span class="collection-glyph-fallback single">${escapeHtml(labels[0])}</span>`;

    const type = char?.structureType || '';
    let a = 'collection-glyph-part part-a', b = 'collection-glyph-part part-b';
    if (String(char?.structure || '').includes('top_bottom') || String(type).startsWith('tb_')) {
      a += ' tb'; b += ' tb';
    } else if (String(char?.structure || '').includes('enclosing') || String(type).startsWith('en_')) {
      a += ' en'; b += ' en';
    }
    return `<span class="collection-glyph-composite" aria-label="用户造字">
      <span class="${a}">${escapeHtml(labels[0])}</span>
      <span class="${b}">${escapeHtml(labels[1])}</span>
    </span>`;
  }

  function renderCollection() {
    const grid = $('#collection-grid');
    if (AppState.collection.length === 0) {
      grid.innerHTML = `
        <div class="collection-empty">
          <div class="icon">字</div>
          <div>还没有创造的字</div>
          <div style="font-size:12px;margin-top:8px;opacity:0.6">开始造第一个字吧</div>
        </div>`;
      return;
    }

    // 字卡必须展示用户实际完成的“新造字”成品，而不是把两个构件名称直接拼成“山水”。
    // 新作品优先使用造字工坊导出的 glyphImage；历史作品若没有成品图，则按其结构重建为单一合成字图。
    grid.innerHTML = AppState.collection.map((char, i) => `
      <div class="collection-card" data-index="${i}">
        <div class="char glyph-result">${renderCollectionGlyph(char)}</div>
        ${char.styleName ? `<div class="name">${escapeHtml(char.styleName)}</div>` : ''}
        <div class="style-tag">${escapeHtml(char.personality?.name || '造字师')}</div>
      </div>
    `).join('');

    grid.querySelectorAll('.collection-card').forEach(el => {
      el.addEventListener('click', () => {
         AudioEngine.playSfx('chime', -16, 300);
         showCharDetail(parseInt(el.dataset.index));
      });
    });
  }

  function showCharDetail(index) {
    const char = AppState.collection[index];
    if (!char) return;

    // 详情页顶部必须显示用户真正完成的“新造字”成品，不能把两个构件名称直接拼起来。
    const detailChar = $('#detail-char');
    if (detailChar) {
      if (char.glyphImage) {
        detailChar.innerHTML = `<img src="${escapeHtml(char.glyphImage)}" alt="用户新造字" draggable="false">`;
      } else {
        detailChar.textContent = char.charName || '新造字';
      }
    }
    $('#detail-components').textContent = char.components?.map(c => c.name).join(' + ') || '';
    $('#detail-structure').textContent = char.structureName || '';
    $('#detail-meaning').textContent = char.meaning || '';
    const styleDetail = $('#detail-style');
    const styleSection = styleDetail?.closest('.detail-section');
    if (styleDetail) styleDetail.textContent = char.styleName || '';
    if (styleSection) styleSection.style.display = char.styleName ? '' : 'none';
    $('#detail-personality').textContent = char.personality?.name || '';
    $('#detail-date').textContent = new Date(char.createdAt).toLocaleDateString('zh-CN');

    $('#detail-modal').classList.add('show');
    $('#detail-modal').dataset.index = index;
  }

  function initCollection() {
    $('#btn-collection-new').addEventListener('click', () => {
      resetCurrentChar();
      inkTransition(() => navigateTo('workshop'));
    });

    $('#detail-close').addEventListener('click', () => {
      $('#detail-modal').classList.remove('show');
    });

    $('#detail-edit').addEventListener('click', () => {
      const index = parseInt($('#detail-modal').dataset.index);
      const char = AppState.collection[index];
      const newMeaning = prompt('修改释义：', char.meaning);
      if (newMeaning !== null) {
        char.meaning = sanitizeInput(newMeaning);
        saveCollection();
        renderCollection();
        showCharDetail(index);
        showToast('释义已更新');
      }
    });

    $('#detail-regen').addEventListener('click', () => {
      const index = parseInt($('#detail-modal').dataset.index);
      const char = AppState.collection[index];
      // 重新生成海报
      AppState.currentChar = { ...char };
      $('#detail-modal').classList.remove('show');
      inkTransition(() => navigateTo('poster'));
    });

    $('#detail-delete').addEventListener('click', () => {
      const index = parseInt($('#detail-modal').dataset.index);
      if (confirm('确定删除这个字吗？')) {
        AppState.collection.splice(index, 1);
        saveCollection();
        renderCollection();
        $('#detail-modal').classList.remove('show');
        showToast('已删除');
      }
    });
  }

  // ===== 顶部导航 =====
  function initTopBar() {
    updateMusicSwitchUI();
    const btnCollection = document.getElementById('btn-collection');
    if (btnCollection) {
      btnCollection.addEventListener('click', () => {
        inkTransition(() => navigateTo('collection'));
      });
    }
    const btnSound = document.getElementById('btn-sound');
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        const muted = AudioEngine.toggleMuted();
        updateMusicSwitchUI(muted);
        showToast(muted ? '背景音乐已关闭' : '背景音乐已开启');
      });
    }
    // 跳过训练按钮已移除，保留核心导航逻辑
  }

  // ===== 默认数据（加载失败时使用） =====
  const DEFAULT_COMPONENTS = [
    { id: 'sun', name: '日', meaning: '太阳', category: 'nature', variants: ['normal','left','top'] },
    { id: 'moon', name: '月', meaning: '月亮', category: 'nature', variants: ['normal','left','top'] },
    { id: 'mountain', name: '山', meaning: '山岳', category: 'nature', variants: ['normal','bottom'] },
    { id: 'water', name: '水', meaning: '水流', category: 'nature', variants: ['normal','left','bottom'] },
    { id: 'fire', name: '火', meaning: '火焰', category: 'nature', variants: ['normal','left','bottom'] },
    { id: 'tree', name: '木', meaning: '树木', category: 'nature', variants: ['normal','left','top','bottom'] },
    { id: 'person', name: '人', meaning: '人类', category: 'body', variants: ['normal','left'] },
    { id: 'heart', name: '心', meaning: '心脏', category: 'body', variants: ['normal','left','bottom','inside'] },
    { id: 'eye', name: '目', meaning: '眼睛', category: 'body', variants: ['normal','left','top'] },
    { id: 'mouth', name: '口', meaning: '嘴巴', category: 'body', variants: ['normal','left','top','inside'] },
    { id: 'hand', name: '手', meaning: '手掌', category: 'body', variants: ['normal','left','top'] },
    { id: 'door', name: '门', meaning: '门户', category: 'thing', variants: ['normal','top','enclosing'] },
    { id: 'stone', name: '石', meaning: '石头', category: 'thing', variants: ['normal','left','bottom'] },
    { id: 'earth', name: '土', meaning: '土地', category: 'thing', variants: ['normal','left','bottom'] },
    { id: 'clothes', name: '衣', meaning: '衣服', category: 'thing', variants: ['normal','top','enclosing'] },
    { id: 'vehicle', name: '车', meaning: '车辆', category: 'thing', variants: ['normal','left','top'] }
  ];

  const DEFAULT_PRESETS = {
    structures: {
      left_right: { name: '左右', types: [
        { id: 'lr_standard', name: '标准' },
        { id: 'lr_narrow_wide', name: '左窄右宽' },
        { id: 'lr_wide_narrow', name: '左宽右窄' }
      ]},
      top_bottom: { name: '上下', types: [
        { id: 'tb_balanced', name: '均衡' },
        { id: 'tb_narrow_wide', name: '上窄下宽' },
        { id: 'tb_wide_narrow', name: '上宽下窄' }
      ]},
      enclosing: { name: '包围', types: [
        { id: 'en_full', name: '全包围' },
        { id: 'en_top', name: '上包围' },
        { id: 'en_side', name: '侧包围' }
      ]}
    },
    interpretationStyles: {
      classical: { name: '古风雅致', description: '古文字训诂风格' },
      modern: { name: '当代扎心', description: '社交媒体感表达' },
      minimal: { name: '极简哲学', description: '极简高级哲学感' }
    },
    personalities: [
      { id: 'huiyi_mage', name: '会意魔法师', description: '擅长把两个已有意义组合起来' },
      { id: 'xiangxing_observer', name: '象形观察家', description: '擅长从现实世界寻找造字灵感' },
      { id: 'structure_designer', name: '构形设计师', description: '对字形比例和结构特别敏感' },
      { id: 'emotion_crafter', name: '情绪造字师', description: '擅长把难以描述的情绪变成文字' }
    ],
    loadingFacts: ['「公」，上面不是八，是分开的器物。', '「县」古意是悬挂。', '「慢」最初专指傲慢。']
  };

  // ===== 应用初始化 =====
  async function init() {
    await loadData();

    // 初始化各模块（每个都独立try-catch，防止一个失败影响全部）
    const initFns = [initStory, initIntro, initNameInput, initAbility, initWorkshop, initMeaning, initCharCard, initCertify, initPoster, initCollection, initTopBar];
    initFns.forEach(fn => {
      try { fn(); } catch(e) { console.error('初始化失败:', fn.name, e); }
    });

    // 从加载页开始
    try {
      navigateTo('story');
    } catch(e) {
      console.error('导航失败:', e);
      // 兜底：直接显示intro页
      document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
      const intro = document.getElementById('page-intro');
      if (intro) intro.style.display = 'flex';
    }
  }

  // DOM加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
