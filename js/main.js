/* ============================================================
   字造集 - main.js（最终版）
   [0] 内联依赖：XuanXuan 墨灵 / create-button-state
   [1] 开场 H5：情绪画廊 / 七步叙事 / 书写入场 / 造字之旅
   [2] 主程序：六书实验室 / 能力值 / 造字工坊 / 释义 / 海报 / 我的字造集
   [3] 桥接：开场结束 → 主程序
   ============================================================ */

/* ===== [0a] XuanXuan 墨灵角色（已内联） ===== */
/* 玄玄 · 墨灵角色系统
 * 跨文件复用：zizao.html（场景一 情绪字卡页）与 index.html（场景二~七）。
 * 资源路径通过 setBase() 适配两个文件所在目录。
 */
window.XuanXuan = {
  base: '',
  _el: null,
  _img: null,
  _dialog: null,
  _ink: null,

  // 各情绪/动作对应的精灵图
  POSES: {
    peek: 'tantou.png',        // 探头
    blink: 'zhayan.png',       // 眨眼
    think: 'tuosaisikao.png',  // 托腮思考
    tailQ: 'xiaoweibabianchengwenhao.png', // 小尾巴变问号
    wood: 'bianchengmu.png',   // 变成木（树枝纹理）
    fire: 'bianchenghuo.png',   // 变成火（头顶火苗）
    scroll: 'xiaoshujuanjilu.png', // 拿小书卷记录
    jump: 'tiaoqilai.png',      // 跳起来
    cat: 'xueshimao.png',       // 雪狮猫（博士帽）
    base: 'xuanxuan.png'        // 本体
  },

  // 页面 → 默认姿态
  PAGE_POSE: {
    zizao: 'peek', intro: 'peek', story: 'peek', lab: 'think',
    workshop: 'tailQ', analysis: 'scroll', meaning: 'scroll',
    charcard: 'jump', collection: 'cat'
  },

  // 页面默认台词（场景一特殊处理为三段）
  PAGE_LINE: {
    lab: '每一种心情，都在等待一个名字。',
    workshop: '你的此刻，会诞生怎样的文字呢？',
    analysis: '让我把这个字的故事记下来。',
    meaning: '让我把这个字的故事记下来。',
    charcard: '我把它记下来了！',
    collection: '每一个字，都有属于自己的故事哦。'
  },

  setBase(p) { this.base = p || ''; },

  init() {
    if (this._el) return;
    const d = document.createElement('div');
    d.id = 'xuanxuan';
    d.innerHTML =
      '<img id="xuan-img" alt="玄玄" src="' + this.base + 'images/xuanxuan/' + this.POSES.base + '">' +
      '<div class="xuan-dialog"></div>' +
      '<div class="xuan-ink"></div>';
    const host = document.getElementById('app') || document.body;
    host.appendChild(d);
    this._el = d;
    this._img = d.querySelector('#xuan-img');
    this._dialog = d.querySelector('.xuan-dialog');
    this._ink = d.querySelector('.xuan-ink');
  },

  _imgFor(pose) {
    return this.base + 'images/xuanxuan/' + (this.POSES[pose] || this.POSES.base);
  },

  pose(name) {
    this.init();
    this._img.src = this._imgFor(name);
  },

  say(text) {
    this.init();
    const box = this._dialog;
    if (!text) { box.style.display = 'none'; return; }
    box.innerHTML = text;
    box.style.display = 'block';
    box.classList.remove('xuan-bubble-in');
    void box.offsetWidth; // 重启动画
    box.classList.add('xuan-bubble-in');
  },

  hide() { if (this._el) this._el.style.display = 'none'; },

  // 主入口：page 决定姿态/定位，text 覆盖默认台词
  show(page, text) {
    this.init();
    const el = this._el;
    el.className = 'xuan-' + page;
    el.style.display = 'block';
    el.classList.remove('xuan-jump', 'xuan-enter');
    void el.offsetWidth;

    // 造字人格、海报页面不显示玄玄
    if (page === 'personality' || page === 'poster') { this.hide(); return; }

    this.pose(this.PAGE_POSE[page] || 'peek');

    // 入场（墨池探头 / 柔和浮入）
    el.classList.add('xuan-enter');

    if (page === 'zizao') { this._greetZizao(); return; }
    if (page === 'charcard') {
      el.classList.add('xuan-jump');
      this.say(text || this.PAGE_LINE[page] || '');
      return;
    }
    this.say(text || this.PAGE_LINE[page] || '');
  },

  // 场景一：情绪字卡页 · 墨池探头 → 眨眼 → 抖墨点 → 三段台词
  _greetZizao() {
    const lines = [
      '你好，我是玄玄。',
      '我是由千年文字孕育出的墨灵。',
      '今天，你想创造一个怎样的字？'
    ];
    this.say(lines[0]);
    setTimeout(() => { this.pose('blink'); }, 1100);
    setTimeout(() => { this.pose('peek'); }, 1750);
    setTimeout(() => { this._inkDots(); }, 1950);
    setTimeout(() => { this.say(lines[1]); }, 2700);
    setTimeout(() => { this.say(lines[2]); }, 4300);
  },

  // 抖落墨点粒子
  _inkDots() {
    if (!this._ink) return;
    const n = 7;
    for (let i = 0; i < n; i++) {
      const dot = document.createElement('span');
      dot.className = 'xuan-ink-dot';
      const dx = (Math.random() * 2 - 1) * 30;
      const dy = 18 + Math.random() * 34;
      dot.style.setProperty('--dx', dx + 'px');
      dot.style.setProperty('--dy', dy + 'px');
      dot.style.animationDelay = (Math.random() * 0.3) + 's';
      this._ink.appendChild(dot);
      setTimeout(() => dot.remove(), 2000 + Math.random() * 300);
    }
  },

  // 场景三：认识偏旁 · 木/火 变形
  transform(componentId) {
    if (componentId === 'tree' || componentId === 'wood') {
      this.pose('wood');
      this.say('木，代表生命与生长。');
    } else if (componentId === 'fire') {
      this.pose('fire');
      this.say('火，代表光明与热烈。');
    }
  },

  // 场景四：组合失败 · 安慰
  comfort() {
    this.pose('think');
    this.say('咦？它还在等待另一半呢。');
  },

  // 场景六：字卡高潮 · 跳起来
  jumpForJoy() {
    this.pose('jump');
    if (this._el) {
      this._el.classList.remove('xuan-jump');
      void this._el.offsetWidth;
      this._el.classList.add('xuan-jump');
    }
    this.say('我把它记下来了！');
  }
};

/* ===== [0b] 造字按钮状态机（已内联） ===== */

let selectedParts=[];

function selectPart(part){
 if(!selectedParts.includes(part)){
   selectedParts.push(part);
 }
 updateCreateButton();
}

function updateCreateButton(){
 const btn=document.querySelector('#create-btn');
 if(!btn)return;

 const enough = selectedParts.length >= 2;

 btn.disabled = !enough;

 if(enough){
   btn.classList.add('active');
   btn.classList.remove('disabled');
 }else{
   btn.classList.remove('active');
   btn.classList.add('disabled');
 }
}

// 防止绕过按钮逻辑进入下一页
function canCreate(){
 return selectedParts.length >= 2;
}


/* ===== [1] 开场 H5 ===== */
(function () {

  // ===================================================================
  //  GALLERY  (3D infinite parallax cloud)
  // ===================================================================
  const items = [
    { file: 'images/moods/anxin.png',    title: '安心', pinyin: 'ān xīn',   tag: '会意 · 象形', desc: '“安”从女在宀下，屋下有女则安定，会意也；“心”象形，象心脏之形。屋宇庇护，女子安然，心得其所，是为安心。' },
    { file: 'images/moods/benshang.png', title: '悲伤', pinyin: 'bēi shāng', tag: '形声',       desc: '“悲”从心，非声，非本有违背、哀痛之意；“伤”从人，省声。非声入心，痛彻肝肠；人逢离别，悲从中来。' },
    { file: 'images/moods/fennu.png',    title: '愤怒', pinyin: 'fèn nù',    tag: '形声',       desc: '“愤”从心，贲声，气满胸臆；“怒”从心，奴声，心被压制而爆发。贲声激越，奴心难抑；怒火中烧，势不可遏。' },
    { file: 'images/moods/gudu.png',     title: '孤独', pinyin: 'gū dú',     tag: '形声',       desc: '“孤”从子，瓜声，幼而无父曰孤；“独”从犬，蜀声，一犬独行。孑然一身，瓜声如叹；独对长空，形影相吊。' },
    { file: 'images/moods/kongju.png',   title: '恐惧', pinyin: 'kǒng jù',   tag: '形声',       desc: '“恐”从心，巩声，心有畏巩；“惧”从心，瞿声，瞿然惊视。巩声颤心，瞿目四顾；幽林孤灯，惧由心生。' },
    { file: 'images/moods/qidai.png',    title: '期待', pinyin: 'qī dài',    tag: '形声',       desc: '“期”从月，其声，月满为期；“待”从彳，寺声，止而等候。月满其期，伫立以待；晨光初露，希望在前。' },
    { file: 'images/moods/xiyue.png',    title: '喜悦', pinyin: 'xǐ yuè',    tag: '会意 · 形声', desc: '“喜”从壴从口，鼓乐欢庆，会意也；“悦”从心，兑声。鼓乐张口，喜上眉梢；心悦神畅，如沐春风。' },
    { file: 'images/moods/zhenfen.png',  title: '振奋', pinyin: 'zhèn fèn',  tag: '形声 · 会意', desc: '“振”从手，辰声，振衣而起；“奋”从奞在田上，鸟奋翼欲飞。振衣云端，奋翼九霄；红旗猎猎，意气风发。' }
  ];

  const moodLines = {
    '安心': '屋檐之下，心有所栖',
    '悲伤': '雨落肩头，未曾说出口',
    '愤怒': '胸中火起，烧断沉默',
    '孤独': '人潮之中，自成孤岛',
    '恐惧': '暗处有声，呼吸变轻',
    '期待': '晨光未亮，已起身等候',
    '喜悦': '风过眉梢，嘴角先笑',
    '振奋': '振衣千仞，意气凌云'
  };

  const cloud = document.getElementById('cloud');
  const scene = document.getElementById('scene');
  const dragHint = document.getElementById('dragHint');
  const detailOverlay = document.getElementById('detailOverlay');
  const detailPanel = document.getElementById('detailPanel');
  const detailContent = document.getElementById('detailContent');
  const closeBtn = document.getElementById('closeBtn');
  const createBtn = document.getElementById('createBtn');

  // ===== 悲伤情绪卡片：细雨滴下落动效（细、长、透明，整体极淡）=====
  const rainCanvas = document.getElementById('rainCanvas');
  const rctx = rainCanvas.getContext('2d');
  let rainRAF = null;
  const RainFX = (() => {
    let drops = [], active = false, w = 0, h = 0;
    function size() {
      w = window.innerWidth; h = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      rainCanvas.width = Math.floor(w * dpr);
      rainCanvas.height = Math.floor(h * dpr);
      rctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function spawn(init) {
      const len = 14 + Math.random() * 26;       // 细而长
      return {
        x: Math.random() * w,
        y: init ? Math.random() * h : -len - Math.random() * 40,
        len,
        speed: 4 + Math.random() * 5,            // 下落速度
        slant: 1.2 + Math.random() * 1.0,        // 风斜
        w: 0.8 + Math.random() * 0.6,            // 细
        a: 0.05 + Math.random() * 0.10           // 透明
      };
    }
    function makeDrops() {
      const count = w < 640 ? 70 : 150;
      drops = [];
      for (let i = 0; i < count; i++) drops.push(spawn(true));
    }
    function frame() {
      rctx.clearRect(0, 0, w, h);
      rctx.lineCap = 'round';
      for (const d of drops) {
        rctx.strokeStyle = 'rgba(176,198,224,' + d.a + ')';
        rctx.lineWidth = d.w;
        rctx.beginPath();
        rctx.moveTo(d.x, d.y);
        rctx.lineTo(d.x + d.slant, d.y + d.len);
        rctx.stroke();
        d.y += d.speed;
        d.x += d.slant * 0.15;
        if (d.y > h + d.len) { d.y = -d.len - Math.random() * 30; d.x = Math.random() * w; }
      }
      rainRAF = requestAnimationFrame(frame);
    }
    return {
      start() {
        if (active) return;
        active = true; size(); makeDrops();
        rainCanvas.classList.add('on');
        if (rainRAF) cancelAnimationFrame(rainRAF);
        frame();
      },
      stop() {
        active = false;
        rainCanvas.classList.remove('on');
        if (rainRAF) { cancelAnimationFrame(rainRAF); rainRAF = null; }
        rctx.clearRect(0, 0, w, h);
      },
      resize() { if (active) size(); }
    };
  })();

  const PERSPECTIVE = 1500;
  const COPIES_PER_ITEM = 9;
  const AUTO_SPEED = 0.16;
  const INERTIA_DECAY = 0.93;
  const PARALLAX_AMT = 80;
  const FOCUS_NEAR = 540;
  const HOVER_SCALE = 0.14;

  let cards = [];
  const cardEls = new Map();
  let camera = { x: 0, y: 0 };
  let targetCamera = { x: 0, y: 0 };
  let velX = 0, velY = 0;
  let isDragging = false;
  let lastPointer = { x: 0, y: 0 };
  let downX = 0, downY = 0;
  let dragDistance = 0;
  let downCardEl = null;
  let didDrag = false;
  let lastFocusTs = 0;
  let hintShown = false;

  const pointers = new Map();
  let isPinching = false;
  let pinchPrevDist = 0;
  let pinchPrevMid = { x: 0, y: 0 };
  let viewScale = 1;
  let targetViewScale = 1;

  let parX = 0, parY = 0;
  let parTX = 0, parTY = 0;

  let focusedCard = null;
  let currentZikaItem = null;

  const t0 = performance.now();

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const midOf = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const depthFactor = (z) => PERSPECTIVE / (PERSPECTIVE - z);

  function initGallery() {
    createCards();
    bindEvents();
    requestAnimationFrame(animate);
  }

  function createCards() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const bands = [
      { count: 1, zMin: 140,  zMax: 250,  sizeMin: 165, sizeMax: 220 },
      { count: 2, zMin: -210, zMax: -30,  sizeMin: 112, sizeMax: 172 },
      { count: 2, zMin: -580, zMax: -300, sizeMin: 70,  sizeMax: 116 },
      { count: 4, zMin: -1090,zMax: -720, sizeMin: 40,  sizeMax: 76  }
    ];

    const spreadX = vw * 2.7;
    const spreadY = vh * 2.05;

    items.forEach((item) => {
      bands.forEach((band) => {
        for (let i = 0; i < band.count; i++) {
          let x, y;
          if (band.zMin > 0) {
            let tries = 0;
            do {
              x = (Math.random() * 2 - 1) * spreadX * 0.7;
              y = (Math.random() * 2 - 1) * spreadY * 0.7;
              tries++;
            } while (tries < 12 && cards.some(c => c.z > 0 && Math.hypot(c.x - x, c.y - y) < 360));
          } else {
            x = (Math.random() * 2 - 1) * spreadX;
            y = (Math.random() * 2 - 1) * spreadY;
          }

          const z = band.zMin + Math.random() * (band.zMax - band.zMin);
          const size = band.sizeMin + Math.random() * (band.sizeMax - band.sizeMin);
          const w = size;
          const h = size / 0.75;

          const el = document.createElement('div');
          el.className = 'card';
          el.style.width = w + 'px';
          el.style.height = h + 'px';
          el.style.marginLeft = (w / -2) + 'px';
          el.style.marginTop = (h / -2) + 'px';
          el.setAttribute('data-title', item.title);
          el.innerHTML = `
            <img src="${item.file}" alt="${item.title}" loading="lazy" draggable="false"
                 onerror="this.parentNode.classList.add('img-missing')">
            <div class="card-label">${item.title}</div>
          `;

          const labelEl = el.querySelector('.card-label');
          const cardObj = {
            el, labelEl,
            x, y, z,
            itemIndex: items.indexOf(item),
            rot: (Math.random() - 0.5) * 9,
            phase: Math.random() * Math.PI * 2,
            bobAmp: 3 + Math.random() * 4,
            rotAmp: 1 + Math.random() * 1.5,
            hovered: false,
            hoverT: 0,
            focusActive: false,
            focusAnimT: 0,
            exiting: false,
            baseW: w, baseH: h
          };

          el.addEventListener('mouseenter', () => { if (!focusedCard) cardObj.hovered = true; });
          el.addEventListener('mouseleave', () => { cardObj.hovered = false; });

          cloud.appendChild(el);
          cardEls.set(el, cardObj);
          cards.push(cardObj);
        }
      });
    });

    if (!window.matchMedia('(hover: hover)').matches) {
      document.body.classList.add('show-labels');
    }
  }

  function bindEvents() {
    scene.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    // 手机端兜底：触屏轻点（非拖拽）打开字卡。部分浏览器会吞掉 pointer 合成 click，这里双保险确保可靠触发。
    scene.addEventListener('click', (e) => {
      if (didDrag) return;
      const cardEl = (e.target && e.target.closest) ? e.target.closest('.card') : null;
      if (!cardEl) return;
      tryFocusCard(cardEls.get(cardEl));
    });

    window.addEventListener('resize', () => {
      const vw = window.innerWidth, vh = window.innerHeight;
      cards.forEach(card => {
        if (Math.abs(card.x) > vw * 4) card.x *= 0.5;
        if (Math.abs(card.y) > vh * 3) card.y *= 0.5;
      });
      RainFX.resize();
    });

    closeBtn.addEventListener('click', (e) => { e.stopPropagation(); exitFocus(); });
    detailOverlay.addEventListener('click', (e) => {
      // 刚打开字卡时，忽略由「点击卡片」产生的合成 click（此时遮罩已激活、命中遮罩自身），
      // 否则字卡一打开就会被立刻关闭——这是手机/电脑端点击卡片后字卡不显示的根因
      if (performance.now() - lastFocusTs < 450) return;
      if (e.target === detailOverlay || e.target === detailPanel) exitFocus();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (createJourney.classList.contains('show')) closeCreate();
        else if (detailOverlay.classList.contains('active')) exitFocus();
      }
    });

    createBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentZikaItem) startScrollTransition(currentZikaItem);
    });
  }

  function onPointerDown(e) {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 1) {
      isDragging = true;
      dragDistance = 0;
      didDrag = false;
      lastPointer.x = e.clientX;
      lastPointer.y = e.clientY;
      downX = e.clientX;
      downY = e.clientY;
      velX = 0; velY = 0;
      downCardEl = (e.target && e.target.closest) ? e.target.closest('.card') : null;
      showHint();
    } else if (pointers.size === 2) {
      isDragging = false;
      isPinching = true;
      downCardEl = null;
      const pts = [...pointers.values()];
      pinchPrevDist = dist(pts[0], pts[1]);
      pinchPrevMid = midOf(pts[0], pts[1]);
      velX = 0; velY = 0;
      showHint();
    }
  }

  function onPointerMove(e) {
    const vw = window.innerWidth, vh = window.innerHeight;
    parTX = -(e.clientX / vw - 0.5) * PARALLAX_AMT;
    parTY = -(e.clientY / vh - 0.5) * PARALLAX_AMT;

    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (isPinching && pointers.size >= 2) {
      e.preventDefault();
      const pts = [...pointers.values()];
      const d = dist(pts[0], pts[1]);
      const m = midOf(pts[0], pts[1]);

      if (pinchPrevDist > 0) {
        targetViewScale = clamp(targetViewScale * (d / pinchPrevDist), 0.45, 3.2);
      }
      const mdx = m.x - pinchPrevMid.x;
      const mdy = m.y - pinchPrevMid.y;
      targetCamera.x -= mdx / viewScale;
      targetCamera.y -= mdy / viewScale;
      dragDistance += Math.hypot(mdx, mdy);
      didDrag = true;

      pinchPrevDist = d;
      pinchPrevMid = m;
      return;
    }

    if (isDragging) {
      e.preventDefault();
      const dx = e.clientX - lastPointer.x;
      const dy = e.clientY - lastPointer.y;
      lastPointer.x = e.clientX;
      lastPointer.y = e.clientY;
      dragDistance += Math.sqrt(dx * dx + dy * dy);
      if (dragDistance > 12) didDrag = true;

      const rx = -dx * 1.1;
      const ry = -dy * 1.1;
      targetCamera.x += rx;
      targetCamera.y += ry;
      velX = rx; velY = ry;
    }
  }

  function onPointerUp(e) {
    pointers.delete(e.pointerId);

    if (pointers.size < 2) {
      isPinching = false;
      pinchPrevDist = 0;
    }

    if (pointers.size === 0) {
      isDragging = false;
      // 轻点（拖拽距离很小）落在某张卡片上 → 进入字卡焦点（桌面 / 手机一致）
      if (downCardEl && dragDistance <= 30) {
        tryFocusCard(cardEls.get(downCardEl));
      }
      downCardEl = null;
    } else if (pointers.size === 1) {
      const [p] = [...pointers.values()];
      lastPointer.x = p.x;
      lastPointer.y = p.y;
      isDragging = true;
      dragDistance = 999;
      velX = 0; velY = 0;
    }
  }

  function showHint() {
    if (hintShown) return;
    hintShown = true;
    dragHint.classList.add('show');
    setTimeout(() => dragHint.classList.remove('show'), 4200);
  }

  function tryFocusCard(obj) {
    if (!obj) return;
    const t = performance.now();
    if (t - lastFocusTs < 350) return; // 防抖：pointerup 与合成 click 可能双双触发，避免重复进入焦点
    lastFocusTs = t;
    enterFocus(obj);
  }

  function enterFocus(card) {
    pointers.clear();
    isPinching = false;
    isDragging = false;
    pinchPrevDist = 0;
    dragDistance = 999;
    velX = 0; velY = 0;

    if (focusedCard && focusedCard !== card) {
      focusedCard.exiting = true;
      focusedCard.el.classList.remove('focused');
    }

    focusedCard = card;
    card.hovered = false;
    card.el.classList.remove('hovered');
    card.focusActive = true;
    card.exiting = false;
    card.focusAnimT = 0;
    card.el.classList.add('focused');
    document.body.classList.add('focusing');

    const item = items[card.itemIndex];
    currentZikaItem = item;
    detailContent.setAttribute('data-char', item.title[0]);
    detailContent.innerHTML = `
      <div class="detail-image-card">
        <img src="${item.file}" alt="${item.title}">
        <div class="detail-image-text">
          <div class="detail-pinyin">${item.pinyin}</div>
          <h2 class="detail-title">${item.title}</h2>
          <div class="detail-tag">${item.tag}</div>
        </div>
      </div>
      <p class="detail-desc">${item.desc}</p>
    `;
    detailOverlay.classList.add('active');
    // 悲伤情绪卡片：进入详情时落下细雨
    if (item.file === 'images/moods/benshang.png') RainFX.start();
    // 详情页不显示玄玄，避免遮挡文字和按钮
    if (window.XuanXuan && window.XuanXuan._el) window.XuanXuan._el.style.display = 'none';
  }

  function exitFocus() {
    detailOverlay.classList.remove('active');
    RainFX.stop();
    document.body.classList.remove('focusing');
    if (focusedCard) {
      focusedCard.exiting = true;
      focusedCard.el.classList.remove('focused');
      focusedCard = null;
    }
    currentZikaItem = null;
    velX = 0; velY = 0;
    // 返回画廊后重新显示玄玄（不重新触发入场台词）
    if (window.XuanXuan && window.XuanXuan._el) window.XuanXuan._el.style.display = 'block';
  }

  function updateCards(time) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const wrapX = vw * 4.4 * viewScale;
    const wrapY = vh * 3.4 * viewScale;

    const nearF = depthFactor(FOCUS_NEAR);
    const farF = depthFactor(-1090);
    const focusing = !!focusedCard;

    cards.forEach(card => {
      const f = depthFactor(card.z);
      const depthNorm = Math.max(0, Math.min(1, (f - farF) / (nearF - farF)));

      if (card.focusActive) {
        const goal = card.exiting ? 0 : 1;
        card.focusAnimT += (goal - card.focusAnimT) * 0.11;

        if (card.exiting && card.focusAnimT < 0.02) {
          card.focusAnimT = 0;
          card.focusActive = false;
          card.exiting = false;
          card.el.style.zIndex = Math.round(1000 + card.z);
          return;
        }

        const t = card.focusAnimT;
        const basePx = (card.x - camera.x - parX) * f * viewScale;
        const basePy = (card.y - camera.y - parY) * f * viewScale;
        const baseScale = f * viewScale * (1 + 0.16 * depthNorm);
        const focusScale = nearF * viewScale * 1.12;
        const px = basePx * (1 - t);
        const py = basePy * (1 - t);
        const scale = baseScale + (focusScale - baseScale) * t;
        const zEff = card.z + (FOCUS_NEAR - card.z) * t;

        card.el.style.transform = `translate3d(${px}px, ${py}px, ${zEff}px) scale(${scale}) rotate(${card.rot * (1 - t)}deg)`;
        card.el.style.opacity = 1;
        card.el.style.filter = `blur(${7 * (1 - depthNorm) * (1 - t)}px) brightness(${0.5 + 0.5 * t})`;
        card.el.style.zIndex = 3000;
        return;
      }

      const bob = Math.sin(time * 0.0006 + card.phase) * card.bobAmp;
      const rotWobble = Math.sin(time * 0.0004 + card.phase) * card.rotAmp;

      let px = (card.x - camera.x) * f * viewScale;
      let py = (card.y - camera.y) * f * viewScale + bob * f * viewScale;

      if (px < -vw * 2.0) card.x += wrapX;
      else if (px > vw * 2.0) card.x -= wrapX;
      if (py < -vh * 1.6) card.y += wrapY;
      else if (py > vh * 1.6) card.y -= wrapY;

      px = (card.x - camera.x) * f * viewScale;
      py = (card.y - camera.y) * f * viewScale + bob * f * viewScale;

      px -= parX * f * viewScale;
      py -= parY * f * viewScale;

      card.hoverT += ((card.hovered ? 1 : 0) - card.hoverT) * 0.18;
      const hov = card.hoverT;

      let opacity = 0.1 + 0.9 * Math.pow(depthNorm, 0.6);
      let blur = (1 - depthNorm) * 7;
      let brightness = 0.3 + 0.7 * depthNorm;
      let scale = f * viewScale * (1 + 0.16 * depthNorm);

      scale *= 1 + HOVER_SCALE * hov;
      brightness += 0.22 * hov;
      opacity = Math.min(1, opacity + 0.08 * hov);

      if (focusing) {
        opacity = opacity * 0.5 + 0.05;
        blur += 3.2;
        brightness *= 0.72;
      }

      card.el.style.transform = `translate3d(${px}px, ${py}px, ${card.z}px) scale(${scale}) rotate(${card.rot + rotWobble}deg)`;
      card.el.style.opacity = opacity;
      card.el.style.filter = `blur(${blur}px) brightness(${brightness})`;
      card.el.style.zIndex = Math.round(1000 + card.z + (hov > 0.3 ? 600 : 0));

      if (hov > 0.05) card.el.classList.add('hovered');
      else card.el.classList.remove('hovered');
    });
  }

  function animate() {
    const now = performance.now();
    const time = now - t0;
    const focusing = !!focusedCard;

    if (!isDragging && !isPinching && !focusing) {
      if (Math.abs(velX) > 0.02 || Math.abs(velY) > 0.02) {
        targetCamera.x += velX;
        targetCamera.y += velY;
        velX *= INERTIA_DECAY;
        velY *= INERTIA_DECAY;
      } else {
        velX = 0; velY = 0;
        targetCamera.x += AUTO_SPEED;
      }
    }

    const ptx = (isDragging || isPinching || focusing) ? 0 : parTX;
    const pty = (isDragging || isPinching || focusing) ? 0 : parTY;
    parX += (ptx - parX) * 0.06;
    parY += (pty - parY) * 0.06;

    camera.x += (targetCamera.x - camera.x) * 0.08;
    camera.y += (targetCamera.y - camera.y) * 0.08;
    viewScale += (targetViewScale - viewScale) * 0.15;

    updateCards(time);
    requestAnimationFrame(animate);
  }

  // ===================================================================
  //  AMBIENT STARFIELD  (global + opening)
  // ===================================================================
  function makeStarField(canvas) {
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dpr = 1;
    let stars = [], streaks = [];

    function resize() {
      w = window.innerWidth; h = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round((w * h) / 9000);
      stars = [];
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * w, y: Math.random() * h,
          r: Math.random() * 1.5 + 0.4,
          a: Math.random() * 0.5 + 0.3,
          ph: Math.random() * Math.PI * 2,
          sp: Math.random() * 0.7 + 0.3,
          dy: -(Math.random() * 7 + 2),
          hue: Math.random() < 0.45 ? '201,168,86' : '245,240,230'
        });
      }
      streaks = [];
      const sc = Math.max(2, Math.round(count / 60));
      for (let i = 0; i < sc; i++) {
        streaks.push({
          x: Math.random() * w, y: Math.random() * h,
          len: Math.random() * 140 + 90,
          ang: Math.PI * (0.62 + Math.random() * 0.16),
          sp: Math.random() * 26 + 14,
          a: Math.random() * 0.18 + 0.08,
          ph: Math.random() * Math.PI * 2
        });
      }
    }

    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        s.y += s.dy * 0.016;
        if (s.y < -6) { s.y = h + 6; s.x = Math.random() * w; }
        const tw = s.a * (0.45 + 0.55 * Math.sin(t * 0.001 * s.sp + s.ph));
        const rr = s.r * 4;
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, rr);
        g.addColorStop(0, `rgba(${s.hue},${tw})`);
        g.addColorStop(1, `rgba(${s.hue},0)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(s.x, s.y, rr, 0, Math.PI * 2); ctx.fill();
      }
      for (const st of streaks) {
        const dx = Math.cos(st.ang) * st.sp * 0.016;
        const dy = Math.sin(st.ang) * st.sp * 0.016;
        st.x += dx; st.y += dy;
        if (st.x > w + st.len || st.y > h + st.len || st.x < -st.len) {
          st.x = -st.len * Math.cos(st.ang); st.y = Math.random() * h * 0.5;
        }
        const ex = st.x + Math.cos(st.ang) * st.len;
        const ey = st.y + Math.sin(st.ang) * st.len;
        const tw = st.a * (0.5 + 0.5 * Math.sin(t * 0.0012 + st.ph));
        const g = ctx.createLinearGradient(st.x, st.y, ex, ey);
        g.addColorStop(0, `rgba(245,240,230,0)`);
        g.addColorStop(0.5, `rgba(245,240,230,${tw})`);
        g.addColorStop(1, `rgba(245,240,230,0)`);
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(st.x, st.y); ctx.lineTo(ex, ey); ctx.stroke();
      }
    }
    return { resize, draw };
  }

  const globalStars = makeStarField(document.getElementById('starCanvas'));
  const openingStars = makeStarField(document.getElementById('openingStars'));
  globalStars.resize();
  openingStars.resize();
  window.addEventListener('resize', () => { globalStars.resize(); openingStars.resize(); });

  function starLoop() {
    const t = performance.now();
    globalStars.draw(t);
    if (!opening.classList.contains('done')) openingStars.draw(t);
    requestAnimationFrame(starLoop);
  }

  // ===================================================================
  //  NARRATIVE  (7-step opening story: 夜晚·一盏灯下 → 一盏灯 → 无名情绪 → 未造之字 → 亲手造字)
  // ===================================================================
  const narrative = document.getElementById('narrative');
  const narvStrobe = document.getElementById('narvStrobe');
  const narvLamp = document.getElementById('narvLamp');
  const narvDesk = document.getElementById('narvDesk');
  const narvText = document.getElementById('narvText');
  const narvOracle = document.getElementById('narvOracle');
  const narvWipe = document.getElementById('narvWipe');
  const narvGlass = document.getElementById('narvGlass');
  const narvHint2 = document.getElementById('narvHint2');
  const narvEnter = document.getElementById('narvEnter');
  const narvMotes = document.getElementById('narvMotes');
  const narvPhone = document.getElementById('narvPhone');
  const narvNight = document.getElementById('narvNight');
  const narvMoon = document.getElementById('narvMoon');
  const narvWindow = document.getElementById('narvWindow');
  const narvCursor = document.getElementById('narvCursor');
  const narvFeeling = document.getElementById('narvFeeling');
  const narvSub = document.getElementById('narvSub');
  const narvBloom = document.getElementById('narvBloom');
  const narvVignette = document.getElementById('narvVignette');
  const narvGhost = document.getElementById('narvGhost');
  const octx = narvOracle.getContext('2d');
  const nmctx = narvMotes.getContext('2d');
  const wctx = narvWipe.getContext('2d');
  const gctx = narvGlass.getContext('2d');
  const nctx = narvNight.getContext('2d');

  let oW = 0, oH = 0, oDpr = 1;
  let oracleGlyphs = [];
  let oracleMode = 'idle';
  let oracleT0 = 0;
  let oracleRunning = false;
  let glassTrail = [];
  const ORACLE_CHARS = ['木','火','水','山','石','田','人','月','日','雨','风','心','川','泉','土','星'];

  let skipRequested = false;
  const wait = (ms) => new Promise(r => { if (skipRequested) return r(); setTimeout(r, ms); });

  function resizeNarrative() {
    oW = window.innerWidth; oH = window.innerHeight;
    oDpr = Math.min(window.devicePixelRatio || 1, 2);
    [narvOracle, narvWipe, narvGlass, narvMotes, narvNight].forEach(c => {
      c.width = oW * oDpr; c.height = oH * oDpr;
      c.style.width = oW + 'px'; c.style.height = oH + 'px';
      c.getContext('2d').setTransform(oDpr, 0, 0, oDpr, 0, 0);
    });
    if (motesRAF) buildMotes();
    if (nightRAF) buildStars();
    if (oracleMode === 'scatter' || oracleMode === 'gather' || oracleMode === 'scatter2') {
      wctx.clearRect(0, 0, oW, oH);
      wctx.fillStyle = '#000'; wctx.fillRect(0, 0, oW, oH);
    }
  }

  window.addEventListener('resize', resizeNarrative);

  // ---- night sky: drifting starfield (step 00 动效优先) ----
  let stars = [];
  let shooting = null;
  let nightRAF = 0;
  function buildStars() {
    // 夜空已按要求去除闪烁白星与流星，仅保留纯黑夜底与窗的静默
    stars = [];
    shooting = null;
  }
  function nightStep() {
    nctx.clearRect(0, 0, oW, oH);
    nightRAF = requestAnimationFrame(nightStep);
  }
  function startNight() {
    if (nightRAF) return;
    buildStars();
    narvNight.classList.add('on');
    nightRAF = requestAnimationFrame(nightStep);
  }
  function stopNight() {
    if (nightRAF) { cancelAnimationFrame(nightRAF); nightRAF = 0; }
    nctx.clearRect(0, 0, oW, oH);
    narvNight.classList.remove('on');
  }

  // ---- faint subtitle whisper (文字退为极淡旁白，动效为主) ----
  function showSub(str, gold) {
    narvSub.textContent = str;
    narvSub.className = 'narv-sub' + (gold ? ' gold' : '') + ' show';
  }
  function hideSub() {
    narvSub.classList.remove('show');
  }

  // ---- center light burst (step 06 造字瞬间的一束光) ----
  function flashBloom() {
    narvBloom.classList.remove('flash');
    void narvBloom.offsetWidth; // 强制重启动画
    narvBloom.classList.add('flash');
  }

  // ---- phone typing: 虚拟打字机——反复输入又逐字删掉，表现犹豫迷茫（不知道用什么字）----
  let phoneTypeTimer = 0;
  function startPhoneTyping() {
    const words = ['安心', '难过', '孤单', '开心', '害怕', '想说', '安宁', '委屈'];
    const holder = document.createElement('span');
    holder.className = 'narv-phone-type';
    narvPhone.insertBefore(holder, narvCursor);
    let wi = 0;
    const typeWord = (word, next) => {
      let i = 0;
      const step = () => {
        if (skipRequested || !narvPhone.classList.contains('on')) return;
        holder.textContent = word.slice(0, ++i);
        // 打字节奏不匀，带迟疑感
        if (i < word.length) phoneTypeTimer = setTimeout(step, 300 + Math.random() * 180);
        else phoneTypeTimer = setTimeout(next, 560);
      };
      step();
    };
    const eraseWord = (next) => {
      const del = () => {
        if (skipRequested || !narvPhone.classList.contains('on')) return;
        holder.textContent = holder.textContent.slice(0, -1);
        if (holder.textContent.length > 0) phoneTypeTimer = setTimeout(del, 150);
        else phoneTypeTimer = setTimeout(next, 420); // 删空后停一瞬，像叹气，再换一个词
      };
      del();
    };
    const cycle = () => {
      if (wi >= words.length) wi = 0; // 循环换词，直到用户轻触屏幕
      const w = words[wi++];
      typeWord(w, () => eraseWord(cycle));
    };
    cycle();
  }
  function stopPhoneTyping() {
    clearTimeout(phoneTypeTimer);
    narvPhone.querySelectorAll('.narv-phone-type').forEach(el => el.remove());
  }


  function buildStrobe() {
    narvStrobe.innerHTML = '';
    const glyphs = ['木','火','水','山','石','田','人','月','日','雨','风','心','川','泉','土','星','光','夜','墨','古'];
    const N = 28;
    for (let i = 0; i < N; i++) {
      const g = document.createElement('div');
      g.className = 'narv-glyph';
      g.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
      g.style.left = (Math.random() * 100) + '%';
      g.style.top = (Math.random() * 100) + '%';
      g.style.fontSize = (1.6 + Math.random() * 2.4) + 'rem';
      g.style.animationDelay = (Math.random() * 16) + 's';
      g.style.animationDuration = (12 + Math.random() * 12) + 's';
      narvStrobe.appendChild(g);
    }
  }

  // ---- ambient warm motes (living, cozy particle field) ----
  let motes = [];
  let motesRAF = 0;
  function buildMotes() {
    const area = oW * oH;
    const count = Math.max(30, Math.min(72, Math.round(area / 24000)));
    motes = [];
    for (let i = 0; i < count; i++) {
      motes.push({
        x: Math.random() * oW,
        y: Math.random() * oH,
        r: 0.6 + Math.random() * 1.9,
        vy: -(0.05 + Math.random() * 0.22),
        sway: 4 + Math.random() * 10,
        ph: Math.random() * Math.PI * 2,
        sp: 0.4 + Math.random() * 0.9,
        a: 0.22 + Math.random() * 0.5,
        tw: 0.5 + Math.random() * 1.4
      });
    }
  }
  function motesStep(t) {
    nmctx.clearRect(0, 0, oW, oH);
    nmctx.globalCompositeOperation = 'screen';
    for (const m of motes) {
      m.y += m.vy;
      m.ph += 0.01 * m.sp;
      const x = m.x + Math.sin(m.ph) * m.sway;
      if (m.y < -12) { m.y = oH + 12; m.x = Math.random() * oW; }
      const tw = 0.55 + 0.45 * Math.sin(t * 0.001 * m.tw + m.ph);
      const alpha = m.a * tw;
      const rad = m.r * 6;
      const g = nmctx.createRadialGradient(x, m.y, 0, x, m.y, rad);
      g.addColorStop(0, 'rgba(255,210,150,' + alpha.toFixed(3) + ')');
      g.addColorStop(0.4, 'rgba(255,182,112,' + (alpha * 0.5).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(255,170,90,0)');
      nmctx.fillStyle = g;
      nmctx.beginPath(); nmctx.arc(x, m.y, rad, 0, Math.PI * 2); nmctx.fill();
    }
    nmctx.globalCompositeOperation = 'source-over';
    motesRAF = requestAnimationFrame(motesStep);
  }
  function startMotes() {
    if (motesRAF) return;
    buildMotes();
    narvMotes.classList.add('on');
    motesRAF = requestAnimationFrame(motesStep);
  }
  function stopMotes() {
    if (motesRAF) { cancelAnimationFrame(motesRAF); motesRAF = 0; }
    if (nmctx) nmctx.clearRect(0, 0, oW, oH);
    narvMotes.classList.remove('on');
  }

  function setText(str, opts = {}) {
    return new Promise(resolve => {
      if (skipRequested) return resolve();
      narvText.className = 'narv-text' + (opts.serif ? ' serif' : '') + (opts.gold ? ' gold' : '');
      narvText.innerHTML = '';
      const chars = [...str];
      chars.forEach((c, i) => {
        const span = document.createElement('span');
        span.className = 'ch' + (opts.brush ? ' brush' : '');
        span.textContent = (c === ' ') ? ' ' : c;
        span.style.animationDelay = (i * 0.12) + 's';
        narvText.appendChild(span);
      });
      const total = chars.length * 120 + 1100;
      setTimeout(resolve, total);
    });
  }

  function clearText() {
    narvText.innerHTML = '';
    narvText.className = 'narv-text';
  }

  function dissolveWords() {
    const spans = narvText.querySelectorAll('.ch');
    [9, 10, 11, 12].forEach((i, k) => {
      const s = spans[i];
      if (!s) return;
      // like ink washed apart by water: each char drifts a random direction while blurring
      const dx = (k % 2 === 0 ? -1 : 1) * (22 + Math.random() * 36);
      const dy = (Math.random() * 46 - 10);
      s.style.setProperty('--dx', dx.toFixed(1) + 'px');
      s.style.setProperty('--dy', dy.toFixed(1) + 'px');
      s.classList.add('dissolve');
    });
  }

  function spawnFragments() {
    const fragChars = ['𠂉','𠀀','𠃍','𠄌','𠁝','乂','冂','勹','𠂇'];
    const positions = [[-130,-40],[130,-30],[-160,60],[160,70],[-95,120],[105,130],[0,-140]];
    positions.forEach((p, i) => {
      const f = document.createElement('div');
      f.className = 'narv-frag';
      f.textContent = fragChars[i % fragChars.length];
      // --tx/--ty：朝画面中心(0,0)收拢的方向，制造「欲聚又散」的呼吸感
      f.style.setProperty('--tx', (-p[0] * 0.32).toFixed(1) + 'px');
      f.style.setProperty('--ty', (-p[1] * 0.32).toFixed(1) + 'px');
      f.style.left = `calc(50% + ${p[0]}px)`;
      f.style.top = `calc(42% + ${p[1]}px)`;
      f.style.animationDelay = (i * 1.4) + 's';
      narrative.appendChild(f);
    });
  }
  function clearFragments() {
    document.querySelectorAll('.narv-frag').forEach(f => f.remove());
  }

  // 「名」反复想成形却碎散：动效本身即「有些情绪，曾经没有名字」
  function playGhostName(times) {
    narvGhost.textContent = '名';
    let played = 0;
    const run = () => {
      narvGhost.classList.remove('try');
      void narvGhost.offsetWidth; // 强制回流以重启动画
      narvGhost.classList.add('try');
      played++;
      if (played < (times || 1)) narvGhost.addEventListener('animationend', run, { once: true });
    };
    run();
  }
  function clearGhost() {
    narvGhost.classList.remove('try');
    narvGhost.textContent = '';
    narvGhost.style.opacity = '0';
  }

  function ripple(x, y) {
    const r = document.createElement('div');
    r.className = 'narv-ripple';
    r.style.left = x + 'px';
    r.style.top = y + 'px';
    narrative.appendChild(r);
    setTimeout(() => r.remove(), 1200);
  }

  function waitFirstTouch() {
    return new Promise(resolve => {
      if (skipRequested) return resolve({ x: oW / 2, y: oH / 2 });
      const h = (e) => {
        narrative.removeEventListener('pointerdown', h);
        resolve({ x: e.clientX, y: e.clientY });
      };
      narrative.addEventListener('pointerdown', h, { once: true });
    });
  }

  function pushGlass(x, y) {
    glassTrail.push({ x, y, age: 0, life: 24, r: 12 });
  }
  function drawGlassTrail(ctx) {
    for (let i = glassTrail.length - 1; i >= 0; i--) {
      const p = glassTrail[i]; p.age++;
      if (p.age >= p.life) { glassTrail.splice(i, 1); continue; }
    }
    if (!glassTrail.length) return;
    const last = glassTrail[glassTrail.length - 1];
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const g = ctx.createRadialGradient(last.x, last.y, 6, last.x, last.y, 34);
    g.addColorStop(0, 'rgba(245,240,230,0.20)');
    g.addColorStop(1, 'rgba(245,240,230,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(last.x, last.y, 34, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.lineCap = 'round';
    for (let i = 0; i < glassTrail.length - 1; i++) {
      const a = glassTrail[i], b = glassTrail[i + 1];
      const life = 1 - a.age / a.life;
      ctx.globalCompositeOperation = 'screen';
      ctx.strokeStyle = `rgba(230,220,200,${0.12 * life})`;
      ctx.lineWidth = 2 + life * 8;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    ctx.restore();
  }

  function wipeAt(x, y, r) {
    wctx.save();
    wctx.globalCompositeOperation = 'destination-out';
    const g = wctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    wctx.fillStyle = g;
    wctx.beginPath(); wctx.arc(x, y, r, 0, Math.PI * 2); wctx.fill();
    wctx.restore();
  }

  function enableWipe() {
    return new Promise(resolve => {
      if (skipRequested) return resolve();
      let resolved = false, erased = 0, lastPt = null;
      const finish = () => {
        if (resolved) return;
        resolved = true;
        narvWipe.removeEventListener('pointerdown', down);
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        wctx.clearRect(0, 0, oW, oH); // fully reveal
        resolve();
      };
      const down = (e) => { lastPt = { x: e.clientX, y: e.clientY }; wipeAt(lastPt.x, lastPt.y, 42); };
      const move = (e) => {
        if (!lastPt) lastPt = { x: e.clientX, y: e.clientY };
        wipeAt(e.clientX, e.clientY, 44);
        pushGlass(e.clientX, e.clientY);
        lastPt = { x: e.clientX, y: e.clientY };
        erased++;
        if (erased > 36) finish();
      };
      const up = () => { if (erased > 8) finish(); };
      narvWipe.addEventListener('pointerdown', down);
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      setTimeout(finish, 7000); // fallback: auto-reveal if no interaction
    });
  }

  // ---- 预加载弘磊板书：canvas 不会自动触发 @font-face 下载，需显式 load ----
  // 「字」字形已内嵌为 data URI（860B），毫秒级就绪；外部完整字体仅作回退
  let banshuPreload = null;
  function preloadBanshu() {
    if (banshuPreload) return banshuPreload;
    try {
      if (document.fonts && document.fonts.load) {
        banshuPreload = document.fonts.load("700 240px 'Honglei-Banshu'", '字').catch(() => {});
      } else {
        banshuPreload = Promise.resolve();
      }
    } catch (e) { banshuPreload = Promise.resolve(); }
    return banshuPreload;
  }
  function banshuReady(timeout) {
    return Promise.race([preloadBanshu(), new Promise(r => setTimeout(r, timeout || 2500))]);
  }

  function startOracle() {
    oracleGlyphs = [];
    const n = 14;
    for (let i = 0; i < n; i++) {
      const sx = oW * (0.18 + Math.random() * 0.64);
      const sy = oH * (0.18 + Math.random() * 0.64);
      oracleGlyphs.push({
        ch: ORACLE_CHARS[i % ORACLE_CHARS.length],
        sx, sy, x: sx, y: sy,
        size: 40 + Math.random() * 44,
        rot: (Math.random() - 0.5) * 0.5,
        ang: Math.atan2(sy - oH / 2, sx - oW / 2),
        dist: Math.hypot(sx - oW / 2, sy - oH / 2),
        alpha: 1
      });
    }
    wctx.clearRect(0, 0, oW, oH);
    wctx.fillStyle = '#000'; wctx.fillRect(0, 0, oW, oH);
    gctx.clearRect(0, 0, oW, oH);
    oracleMode = 'scatter';
    oracleT0 = performance.now();
    if (!oracleRunning) { oracleRunning = true; requestAnimationFrame(oracleLoop); }
  }

  function oracleLoop() {
    if (oracleMode === 'idle') { oracleRunning = false; return; }
    const now = performance.now();
    const t = (now - oracleT0) / 1000;

    octx.clearRect(0, 0, oW, oH);
    for (const g of oracleGlyphs) {
      let x = g.x, y = g.y, a = g.alpha;
      if (oracleMode === 'gather') {
        const p = Math.min(1, (now - oracleT0) / 1400);
        const e = 1 - Math.pow(1 - p, 3);
        x = g.sx + (oW / 2 - g.sx) * e;
        y = g.sy + (oH / 2 - g.sy) * e;
        a = Math.max(0, 1 - p * 0.55);
      } else if (oracleMode === 'scatter2') {
        const p = Math.min(1, (now - oracleT0) / 1400);
        const dx = g.sx - oW / 2, dy = g.sy - oH / 2;
        x = oW / 2 + dx * (1 + p * 3);
        y = oH / 2 + dy * (1 + p * 3);
        a = Math.max(0, 1 - p);
      }
      octx.save();
      octx.globalAlpha = a;
      octx.fillStyle = '#c9a85a';
      octx.shadowBlur = 18; octx.shadowColor = 'rgba(201,168,86,0.6)';
      octx.font = `700 ${g.size}px 'Songti SC','STSong','SimSun',serif`;
      octx.textAlign = 'center'; octx.textBaseline = 'middle';
      octx.translate(x, y); octx.rotate(g.rot);
      octx.fillText(g.ch, 0, 0);
      octx.restore();
    }
    if (oracleMode === 'gather' && t > 1.4) {
      octx.save();
      octx.globalAlpha = Math.min(1, (t - 1.4) / 0.6);
      octx.fillStyle = '#e8d9a8';
      octx.shadowBlur = 40; octx.shadowColor = 'rgba(201,168,86,0.8)';
      // 弘磊板书：古字汇聚成的那个「字」，用书法感更强的板书体（未加载完时回退宋体）
      octx.font = `700 ${Math.min(oW, oH) * 0.28}px 'Honglei-Banshu','Songti SC','STSong','SimSun',serif`;
      octx.textAlign = 'center'; octx.textBaseline = 'middle';
      octx.fillText('字', oW / 2, oH / 2);
      octx.restore();
    }

    gctx.clearRect(0, 0, oW, oH);
    if (oracleMode === 'scatter') drawGlassTrail(gctx);

    requestAnimationFrame(oracleLoop);
  }

  function gatherWord() {
    return new Promise(resolve => {
      if (skipRequested) { oracleMode = 'idle'; gctx.clearRect(0, 0, oW, oH); return resolve(); }
      oracleMode = 'gather';
      oracleT0 = performance.now();
      setTimeout(() => {
        oracleMode = 'scatter2';
        oracleT0 = performance.now();
        setTimeout(() => {
          oracleMode = 'idle';
          gctx.clearRect(0, 0, oW, oH);
          resolve();
        }, 1500);
      }, 2400);
    });
  }

  function revealGallery() {
    narvEnter.classList.remove('show');
    if (narvSkip) narvSkip.classList.remove('show');
    stopMotes();
    stopNight();
    stopPhoneTyping();
    narvPhone.classList.remove('on');
    narvCursor.classList.remove('on');
    narvFeeling.classList.remove('on', 'condense');
    narvMoon.classList.remove('on');
    narvWindow.classList.remove('on');
    narvVignette.classList.remove('on');
    clearGhost();
    narvBloom.classList.remove('flash');
    narvLamp.classList.remove('on');
    narvStrobe.classList.remove('on');
    narvDesk.classList.remove('on');
    hideSub();
    clearText();
    clearFragments();
    narrative.classList.add('done');
    // 进入情绪长廊（3D 漂浮画廊）后背景音乐继续播放，不中断
    if (narvBgm && !window.__zizaojiMuted && narvBgm.paused) {
      narvBgm.play().catch(() => {});
    }
    setTimeout(() => { narrative.style.display = 'none'; }, 1500);
    showHint();
    // 场景一：玄玄从墨池探头、眨眼、抖墨点，并自我介绍
    if (window.XuanXuan) window.XuanXuan.show('zizao');
  }
  narvEnter.addEventListener('click', revealGallery);

  // ===== 6-step narrative sound toggle (右上角声音按钮) =====
  const narvSound = document.getElementById('narvSound');
  const narvBgm = new Audio('media/bgm/home-guqin.mp3');
  narvBgm.loop = true;
  narvBgm.volume = 0.6;
  // 暴露到全局，供开场外的 enterMainApp() 在跳转主程序时停止开场 BGM（否则作用域隔离导致无法暂停）
  window.narvBgm = narvBgm;
  if (narvSound) {
    // 初始化：开场页声音按钮默认「开启」，与主程序（背景音乐 + 音效）共用同一静音状态
    const initialMuted = narvSound.classList.contains('muted');
    window.__zizaojiMuted = initialMuted;
    try { localStorage.setItem('zizaoji_music_muted', initialMuted ? '1' : '0'); } catch (e) {}

    // 浏览器自动播放策略：需用户手势后才能播放。首次交互（进入字造集/点击等）即解锁并播放首页 BGM。
    let homeBgmStarted = false;
    const tryStartHomeBgm = () => {
      if (homeBgmStarted || window.__zizaojiMuted) return;
      homeBgmStarted = true;
      narvBgm.play().catch(() => {});
    };
    ['pointerdown', 'touchstart', 'keydown'].forEach(evt =>
      window.addEventListener(evt, tryStartHomeBgm, { passive: true })
    );

    // 阻止冒泡，避免点声音按钮时误触推进叙事步骤
    narvSound.addEventListener('pointerdown', (e) => e.stopPropagation());
    narvSound.addEventListener('click', (e) => {
      e.stopPropagation();
      const nowMuted = narvSound.classList.toggle('muted');
      // 声音开关同时控制整个应用的背景音乐与音效，并持久化到主程序
      window.__zizaojiMuted = nowMuted;
      try { localStorage.setItem('zizaoji_music_muted', nowMuted ? '1' : '0'); } catch (e2) {}
      if (nowMuted) narvBgm.pause();
      else { homeBgmStarted = true; narvBgm.play().catch(() => {}); }
    });
  }

  // ===== 6-step narrative skip button (右上角跳过) =====
  const narvSkip = document.getElementById('narvSkip');
  if (narvSkip) {
    // 阻止冒泡，避免点跳过时误触推进叙事步骤
    narvSkip.addEventListener('pointerdown', (e) => e.stopPropagation());
    narvSkip.addEventListener('click', (e) => {
      e.stopPropagation();
      if (skipRequested) return;
      skipRequested = true;
      revealGallery();
    });
  }

  let narrativeRunning = false;
  async function playNarrative() {
    if (narrativeRunning) return;
    narrativeRunning = true;
    preloadBanshu(); // 提前拉弘磊板书，保证第 06 步的「字」已是板书体
    resizeNarrative();
    buildStrobe();
    narrative.classList.add('show');
    if (narvSkip) narvSkip.classList.add('show');
    startMotes();

    // ---- 00 夜：夜色自黑中浮现（窗缓升；无星无月，纯黑静默；文字仅极淡一字）----
    startNight();
    narvWindow.classList.add('on');
    showSub('夜');
    await wait(2600);
    hideSub();

    // ---- 01 灯：灯芯点燃，暖光池在桌面晕开（光本身即叙事，不靠文字）----
    narvLamp.classList.add('on');
    narvStrobe.classList.add('on');
    showSub('灯');
    await wait(1100);
    narvDesk.classList.add('on');
    await wait(2000);
    hideSub();

    // ---- 02 手机：灯下点亮手机，虚拟打字——反复输入又删掉，犹豫迷茫不知道用什么字 ----
    narvPhone.classList.add('on');
    await wait(950);
    narvCursor.classList.add('on');
    await wait(700);
    startPhoneTyping(); // 打字机循环：输入→删掉→换词，直到用户轻触
    narvHint2.textContent = '轻触屏幕';
    narvHint2.classList.add('show');
    const touch = await waitFirstTouch();
    stopPhoneTyping();
    ripple(touch.x, touch.y);
    narvHint2.classList.remove('show');
    await wait(700);
    narvCursor.classList.remove('on');
    narvPhone.classList.remove('on');

    // ---- 03 感觉：暖色光团浮起 → 「有些情绪，曾经没有名字。」→ 想凝成字，却「没有任何一个字能够准确表达」，随墨散（写不出）----
    narvFeeling.classList.add('on');
    await wait(1400);
    await setText('有些情绪，曾经没有名字。', { serif: true, gold: true });
    await wait(1500);
    clearText();
    await wait(400);
    narvFeeling.classList.add('condense'); // 光团收紧，似要凝成那个「字」
    await wait(1100);
    await setText('没有任何一个字能够准确表达。');
    dissolveWords(); // 文字如墨被水冲散
    await wait(2000);
    clearText();
    narvFeeling.classList.remove('on', 'condense');
    narvLamp.classList.remove('on');
    narvStrobe.classList.remove('on');
    await wait(800);

    // ---- 04 无名之绪：黑暗里一个「名」反复想成形却碎散，甲骨文碎片欲聚又散（动效即「曾经没有名字」的余韵）----
    narvVignette.classList.add('on');
    spawnFragments();
    // 「名」第一次尝试成形 → 将成未成地颤抖 → 碎散（4.4s）
    playGhostName(1);
    await wait(2600);
    // 第二次尝试，仍未成；碎片随暗角呼吸始终无法凝为一个字
    playGhostName(1);
    await wait(1600);
    clearGhost();
    await wait(600);
    clearFragments();
    narvVignette.classList.remove('on');

    // ---- 05 古人造字：拂去黑暗，露出甲骨文（交互，行动即叙事）----
    await banshuReady(2500); // 确保汇聚成「字」时弘磊板书已就绪
    startOracle();
    narvHint2.textContent = '拖动指尖，拂去黑暗';
    narvHint2.classList.add('show');
    await enableWipe();
    narvHint2.classList.remove('show');

    // ---- 06 你的字：古字汇聚成「字」，再散开如邀请（一束光迸发，按钮亮起）----
    flashBloom(); // 汇聚成「字」的那一束光
    await gatherWord();
    narvEnter.classList.add('show');
  }

  // ===================================================================
  //  CREATE-JOURNEY  (开始造字之旅)
  // ===================================================================
  const createJourney = document.getElementById('createJourney');
  const cjSeed = document.getElementById('cjSeed');
  const cjInput = document.getElementById('cjInput');
  const cjCanvas = document.getElementById('cjCanvas');
  const cjResult = document.getElementById('cjResult');
  const cjClose = document.getElementById('cjClose');
  const cjBack = document.getElementById('cjBack');
  const cjCommit = document.getElementById('cjCommit');
  const cjctx = cjCanvas.getContext('2d');

  let cjSeedEmotion = '安心';
  let cjStrokes = [];
  let cjCurrent = null;
  let cjTrail = [];
  let cjPointer = { x: 0, y: 0 };
  let cjIsDown = false;
  let cjRunning = false;
  let cjLastTx = 0, cjLastTy = 0;

  function resizeCj() {
    const r = cjCanvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cjCanvas.width = r.width * dpr;
    cjCanvas.height = r.height * dpr;
    cjctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function openCreate(item) {
    cjSeedEmotion = item.title;
    cjSeed.textContent = `为「${item.title}」造一个字`;
    cjInput.value = '';
    cjStrokes = [];
    cjCurrent = null;
    cjTrail = [];
    cjResult.innerHTML = '';
    createJourney.classList.add('show');
    setTimeout(resizeCj, 60);
    if (!cjRunning) { cjRunning = true; requestAnimationFrame(cjRender); }
  }
  function closeCreate() {
    createJourney.classList.remove('show');
    cjRunning = false;
  }
  cjClose.addEventListener('click', closeCreate);
  cjBack.addEventListener('click', closeCreate);

  function cjPos(e) {
    const r = cjCanvas.getBoundingClientRect();
    const cx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    const cy = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
    return { x: cx, y: cy };
  }
  cjCanvas.addEventListener('pointerdown', (e) => {
    cjIsDown = true;
    const p = cjPos(e);
    cjPointer = p;
    cjCurrent = [p];
    cjTrail.push({ x: p.x, y: p.y, age: 0, life: 22, r: 9 });
  });
  window.addEventListener('pointermove', (e) => {
    if (!cjRunning || !cjIsDown) return;
    const p = cjPos(e);
    cjPointer = p;
    if (cjCurrent) cjCurrent.push(p);
    const dx = p.x - cjLastTx, dy = p.y - cjLastTy;
    if (dx * dx + dy * dy > 4) {
      cjTrail.push({ x: p.x, y: p.y, age: 0, life: 22, r: 9 });
      cjLastTx = p.x; cjLastTy = p.y;
    }
  });
  window.addEventListener('pointerup', () => {
    if (!cjIsDown) return;
    cjIsDown = false;
    if (cjCurrent && cjCurrent.length > 4) cjStrokes.push(cjCurrent);
    cjCurrent = null;
  });

  function cjRender() {
    if (!cjRunning) return;
    cjctx.clearRect(0, 0, cjCanvas.width, cjCanvas.height);
    // glass disk
    const px = cjPointer.x, py = cjPointer.y;
    cjctx.save();
    cjctx.globalCompositeOperation = 'screen';
    const g = cjctx.createRadialGradient(px, py, 4, px, py, 30);
    g.addColorStop(0, 'rgba(245,240,230,0.16)');
    g.addColorStop(1, 'rgba(245,240,230,0)');
    cjctx.fillStyle = g;
    cjctx.beginPath(); cjctx.arc(px, py, 30, 0, Math.PI * 2); cjctx.fill();
    cjctx.restore();
    // trail
    cjctx.save();
    cjctx.lineCap = 'round'; cjctx.lineJoin = 'round';
    for (let i = cjTrail.length - 1; i >= 0; i--) {
      const p = cjTrail[i]; p.age++;
      if (p.age >= p.life) { cjTrail.splice(i, 1); continue; }
      const life = 1 - p.age / p.life;
      cjctx.globalCompositeOperation = 'screen';
      cjctx.fillStyle = `rgba(245,240,230,${0.18 * life})`;
      cjctx.beginPath(); cjctx.arc(p.x, p.y, p.r * (0.4 + life), 0, Math.PI * 2); cjctx.fill();
    }
    cjctx.restore();
    // ink
    cjctx.save();
    cjctx.lineCap = 'round'; cjctx.lineJoin = 'round';
    cjctx.shadowBlur = 16; cjctx.shadowColor = 'rgba(201,168,86,0.5)';
    const all = [...cjStrokes];
    if (cjCurrent) all.push(cjCurrent);
    for (const st of all) {
      if (st.length < 2) continue;
      cjctx.beginPath();
      cjctx.moveTo(st[0].x, st[0].y);
      for (let i = 1; i < st.length; i++) {
        const p = st[i], prev = st[i - 1];
        cjctx.quadraticCurveTo(prev.x, prev.y, (prev.x + p.x) / 2, (prev.y + p.y) / 2);
      }
      cjctx.lineTo(st[st.length - 1].x, st[st.length - 1].y);
      cjctx.strokeStyle = 'rgba(245,240,230,0.9)';
      cjctx.lineWidth = 2.6;
      cjctx.stroke();
    }
    cjctx.restore();
    requestAnimationFrame(cjRender);
  }

  cjCommit.addEventListener('click', () => {
    const name = (cjInput.value || '').trim();
    if (!name) {
      cjInput.focus();
      cjInput.style.borderColor = 'var(--seal-light)';
      setTimeout(() => { cjInput.style.borderColor = ''; }, 1200);
      return;
    }
    let sketch = '';
    try {
      if (cjStrokes.length > 0 && cjCanvas.width > 0) {
        const url = cjCanvas.toDataURL('image/png');
        if (url.length > 200) sketch = url;
      }
    } catch (err) { sketch = ''; }
    const char = name.charAt(0);
    cjResult.innerHTML = `
      <div class="cj-seal">${sketch ? `<img src="${sketch}" alt="${char}">` : char}</div>
      <div class="cj-seal-name">「${name}」</div>
      <p class="cj-seal-note">此字，为「${cjSeedEmotion}」而生。</p>
      <button class="cj-restart" id="cjRestart">再写一个</button>
    `;
    const restart = document.getElementById('cjRestart');
    if (restart) restart.addEventListener('click', () => {
      cjInput.value = ''; cjStrokes = []; cjCurrent = null; cjResult.innerHTML = '';
      cjInput.focus();
    });
  });

  // ===== BorderGlow 边框光晕（鼠标靠近边缘时沿边框发光） =====
  function initBorderGlow(el, opts) {
    if (!el) return;
    opts = opts || {};
    const edge = (opts.edgeSensitivity != null) ? opts.edgeSensitivity : 30;
    el.style.setProperty('--gc', opts.glowColor || '40 80 80');
    el.style.setProperty('--gi', (opts.glowIntensity != null) ? opts.glowIntensity : 1);
    el.style.setProperty('--gr', ((opts.glowRadius != null) ? opts.glowRadius : 40) + 'px');
    if (opts.borderRadius != null) el.style.borderRadius = opts.borderRadius + 'px';
    el.classList.add('border-glow');
    function update(e) {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const dEdge = Math.min(x, y, r.width - x, r.height - y);
      el.style.setProperty('--mx', x + 'px');
      el.style.setProperty('--my', y + 'px');
      el.style.setProperty('--ang', (Math.atan2(y - r.height / 2, x - r.width / 2) * 180 / Math.PI) + 'deg');
      const near = dEdge < edge ? 1 : 0;
      el.style.setProperty('--near', near);
      el.classList.toggle('active', near === 1);
    }
    el.addEventListener('mousemove', update);
    el.addEventListener('mouseleave', () => { el.style.setProperty('--near', 0); el.classList.remove('active'); });
    el.addEventListener('touchstart', (e) => {
      const t = e.touches[0]; if (!t) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (t.clientX - r.left) + 'px');
      el.style.setProperty('--my', (t.clientY - r.top) + 'px');
      el.style.setProperty('--near', 1); el.classList.add('active');
    }, { passive: true });
    el.addEventListener('touchend', () => { el.style.setProperty('--near', 0); el.classList.remove('active'); });
  }
  initBorderGlow(cjBack, { edgeSensitivity: 30, glowColor: '40 80 80', glowRadius: 40, glowIntensity: 1.0, borderRadius: 28, colors: ['#c084fc', '#f472b6', '#38bdf8'] });
  initBorderGlow(cjCommit, { edgeSensitivity: 30, glowColor: '40 80 80', glowRadius: 40, glowIntensity: 1.0, borderRadius: 28, colors: ['#c084fc', '#f472b6', '#38bdf8'] });

  // ===================================================================
  //  SCROLL MASK TRANSITION  (card → 字卡「开始造字」 → 下一个页面)
  // ===================================================================
  const scrollMask = document.getElementById('scrollMask');
  const smChar = document.getElementById('smChar');
  const NEXT_PAGE = 'index.html';
  let scrollTransitioning = false;

  function startScrollTransition(item) {
    if (scrollTransitioning) return;
    scrollTransitioning = true;
    RainFX.stop();
    // 跳转瞬间即切换背景音乐：喜悦类→立即播 xiyue（缓入，无延迟）；其余→古琴续播（不中断）
    try {
      const JOY = ['xiyue', 'anxin', 'qidai', 'zhenfen'];
      const emo = (item && (item.file || '')) ? String(item.file).replace(/^.*\//, '').replace(/\.png$/i, '') : '';
      window.__zizaojiPendingEmotion = emo; // 供 emotionBgmKey() 在 AppState 初始化前即时识别情绪
      if (window.AudioEngine && !window.__zizaojiMuted) {
        // 喜悦类：先停开场古琴，再切到 xiyue；其余情绪保留古琴续播
        if (JOY.indexOf(emo) >= 0 && window.narvBgm) {
          try { window.narvBgm.pause(); window.narvBgm.currentTime = 0; } catch (e) {}
        }
        try { AudioEngine.unlock(); } catch (e) {}
        try { AudioEngine.pageBgm('lab'); } catch (e) {} // 立即按情绪切换：古琴续播 或 xiyue 起播
      }
    } catch (ebgm) {}
    if (smChar) smChar.textContent = item ? item.title : '字';
    scrollMask.classList.add('active');
    void scrollMask.offsetWidth; // force reflow so the fade transition runs
    scrollMask.classList.add('show');
    // 先变黑：等遮罩完全覆盖画面后，再跳转到下一个页面
    // 跳转前记录主页背景音乐(home-guqin)的播放进度，主程序加载后从同一位置续播，做到「不中断」。
    // 注意：只要曲子已经播到一定进度（currentTime>0）就记录，不再要求「正在播放」——
    // 否则在自动播放被拦截 / 用户中途静音后恢复等场景下 narvBgm 处于 paused 状态，
    // 进度不会被保存，主程序就会从 0 重新开始（即用户听到的「断奏 / 中断」）。
    try {
      if (narvBgm && !isNaN(narvBgm.currentTime) && narvBgm.currentTime > 0) {
        sessionStorage.setItem('zizaoji_bgm_pos', String(narvBgm.currentTime));
      }
    } catch (e2) {}
    // 记录用户选择的情绪卡片（如 anxin.png），主程序据此随机切换后续所有页面背景
    try { if (item && item.file) sessionStorage.setItem('zizaoji_emotion', item.file); } catch (e3) {}
    setTimeout(() => { enterMainApp(item); }, 1150);
  }

  // ===================================================================
  //  OPENING GATE  (river bg + glass-cursor writing 字)
  // ===================================================================
  const opening = document.getElementById('opening');
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d', { alpha: true });
  const guide = document.getElementById('guide');
  const hint = document.getElementById('hint');
  const successRing = document.getElementById('successRing');
  const successText = document.getElementById('successText');

  let W = window.innerWidth;
  let H = window.innerHeight;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  const trail = [];
  const TRAIL_LIFE = 28;
  const TRAIL_INTERVAL = 2;
  let lastTrailX = 0, lastTrailY = 0;
  let pointer = { x: W / 2, y: H / 2 };
  let isDown = false;
  const strokes = [];
  let currentStroke = null;

  // 字 — normalized template (0..1 within char box). Cursive-friendly merged path.
  const templateMerged = [
    { x: 0.50, y: 0.10 }, { x: 0.50, y: 0.17 },
    { x: 0.22, y: 0.27 }, { x: 0.50, y: 0.27 }, { x: 0.74, y: 0.35 },
    { x: 0.34, y: 0.47 }, { x: 0.66, y: 0.47 }, { x: 0.60, y: 0.61 },
    { x: 0.50, y: 0.47 }, { x: 0.50, y: 0.75 }, { x: 0.58, y: 0.70 },
    { x: 0.30, y: 0.79 }, { x: 0.72, y: 0.79 }
  ];

  function charBox() {
    const size = Math.min(W, H) * 0.55;
    return { cx: W / 2, cy: H / 2, size, x0: W / 2 - size / 2, y0: H / 2 - size / 2 };
  }
  function normToScreen(pt) {
    const b = charBox();
    return { x: b.x0 + pt.x * b.size, y: b.y0 + pt.y * b.size };
  }
  function screenToNorm(pt) {
    const b = charBox();
    return { x: (pt.x - b.x0) / b.size, y: (pt.y - b.y0) / b.size };
  }

  function onDown(e) {
    if (opening.classList.contains('done')) return;
    isDown = true;
    const p = getPos(e);
    pointer.x = p.x; pointer.y = p.y;
    currentStroke = [{ x: p.x, y: p.y, t: performance.now() }];
    addTrail(p.x, p.y, true);
  }
  function onMove(e) {
    const p = getPos(e);
    pointer.x = p.x; pointer.y = p.y;
    if (isDown && currentStroke) currentStroke.push({ x: p.x, y: p.y, t: performance.now() });
    addTrail(p.x, p.y, false);
  }
  function onUp() {
    if (!isDown) return;
    isDown = false;
    if (currentStroke && currentStroke.length > 4) {
      strokes.push(currentStroke);
      evaluate();
    }
    currentStroke = null;
  }
  function getPos(e) {
    if (e.touches && e.touches.length) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }

  canvas.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove, { passive: false });
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
  canvas.addEventListener('touchstart', (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });

  document.getElementById('clearBtn').addEventListener('click', () => {
    strokes.length = 0;
    currentStroke = null;
    failCount = 0;
    guide.classList.remove('glow');
    hint.textContent = '以光标为笔，在虚空中书写「字」字，即可入字';
    hint.style.color = 'rgba(245,240,230,0.5)';
    enterBtn.classList.remove('show');
  });

  const enterBtn = document.getElementById('enterBtn');
  enterBtn.addEventListener('click', () => {
    if (!transitioned) { transitioned = true; dismissOpening(); }
  });

  function addTrail(x, y, force) {
    if (!force) {
      const dx = x - lastTrailX, dy = y - lastTrailY;
      if (dx * dx + dy * dy < TRAIL_INTERVAL * TRAIL_INTERVAL) return;
    }
    lastTrailX = x; lastTrailY = y;
    trail.push({ x, y, r: 10 + Math.random() * 4, age: 0, life: TRAIL_LIFE });
  }

  let failCount = 0;

  function evaluate() {
    if (strokes.length < 1) return;

    let allPts = [];
    let totalLen = 0;
    for (const st of strokes) {
      for (let i = 0; i < st.length; i++) {
        allPts.push(st[i]);
        if (i > 0) totalLen += Math.hypot(st[i].x - st[i - 1].x, st[i].y - st[i - 1].y);
      }
    }

    const b = charBox();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of allPts) {
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    }
    const w = maxX - minX, h = maxY - minY;
    const aspect = w / Math.max(h, 1);
    const ovX = Math.max(0, Math.min(maxX, b.x0 + b.size) - Math.max(minX, b.x0)) / Math.max(1, b.size);
    const ovY = Math.max(0, Math.min(maxY, b.y0 + b.size) - Math.max(minY, b.y0)) / Math.max(1, b.size);
    const coverage = ovX * ovY;

    let topCount = 0, botCount = 0;
    for (const p of allPts) {
      const ny = (p.y - b.y0) / b.size;
      if (ny < 0.42) topCount++;
      else if (ny > 0.58) botCount++;
    }
    const n = allPts.length;
    const topCover = topCount / n;
    const botCover = botCount / n;

    // Template similarity — merged path accepts both separated & cursive writing
    const userMerged = resample(allPts, 64);
    const tplMerged = resample(templateMerged.map(p => normToScreen(p)), 64);
    const sim = strokeSimilarity(userMerged, tplMerged);

    const lenOK = totalLen > b.size * 0.5;
    const aspectOK = aspect > 0.32 && aspect < 2.4;
    const regionOK = topCover > 0.06 && botCover > 0.06;
    const covOK = coverage > 0.18;

    const pass = sim > 0.5 && lenOK && aspectOK && regionOK && covOK && strokes.length >= 1;

    if (pass) {
      onSuccess();
    } else {
      failCount++;
      guide.classList.remove('glow');
      if (sim > 0.42) {
        hint.textContent = '已近字形，再润一笔使之成「字」';
      } else if (failCount >= 2) {
        hint.innerHTML = '笔迹未成 · 可点右上「入境」直接进入';
        enterBtn.classList.add('show');
      } else {
        hint.textContent = '笔迹未成，请依虚影再写一次「字」';
      }
      hint.style.color = 'rgba(200,160,120,0.85)';
    }
  }

  function resample(pts, n) {
    if (pts.length < 2) return pts;
    const out = [pts[0]];
    let total = 0;
    for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    if (total === 0) return pts;
    const step = total / (n - 1);
    let cur = 0;
    let i = 1;
    while (out.length < n && i < pts.length) {
      const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      if (cur + d >= step) {
        const t = (step - cur) / d;
        out.push({ x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t });
        pts.splice(i - 1, 1);
        pts[i - 1] = out[out.length - 1];
        cur = 0;
      } else { cur += d; i++; }
    }
    while (out.length < n) out.push(pts[pts.length - 1]);
    return out;
  }

  function strokeSimilarity(a, b) {
    const na = normalizeStroke(a);
    const nb = normalizeStroke(b);
    let sum = 0;
    for (let i = 0; i < na.length; i++) {
      const dx = na[i].x - nb[i].x;
      const dy = na[i].y - nb[i].y;
      sum += Math.exp(-(dx * dx + dy * dy) * 4);
    }
    return sum / na.length;
  }
  function normalizeStroke(pts) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of pts) {
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    }
    const w = Math.max(maxX - minX, 0.001);
    const h = Math.max(maxY - minY, 0.001);
    const s = Math.max(w, h);
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    return pts.map(p => ({ x: (p.x - cx) / s, y: (p.y - cy) / s }));
  }

  let transitioned = false;
  function onSuccess() {
    if (transitioned) return;
    transitioned = true;
    guide.classList.add('glow');
    hint.textContent = '字已成，入境中…';
    hint.style.color = 'var(--gold)';

    canvas.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);

    successRing.classList.add('open');
    successText.classList.add('show');

    setTimeout(() => { dismissOpening(); }, 900);
  }

  // Reveal the 3D gallery in-place (no cross-file navigation)
  function dismissOpening() {
    opening.classList.add('done');
    canvas.style.display = 'none';
    setTimeout(() => { opening.style.display = 'none'; }, 1500);
    playNarrative();
  }

  // ---------- Render loop for glass cursor + ink ----------
  let renderRunning = true;
  function render() {
    if (!renderRunning) return;
    ctx.clearRect(0, 0, W, H);
    drawGlassDisk(pointer.x, pointer.y);

    for (let i = trail.length - 1; i >= 0; i--) {
      const p = trail[i];
      p.age++;
      if (p.age >= p.life) { trail.splice(i, 1); continue; }
    }
    drawTrail();
    drawInk();
    if (opening.classList.contains('done')) { renderRunning = false; return; }
    requestAnimationFrame(render);
  }

  function drawGlassDisk(x, y) {
    const r = 34;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const g = ctx.createRadialGradient(x, y, r * 0.25, x, y, r);
    g.addColorStop(0, 'rgba(245,240,230,0.18)');
    g.addColorStop(0.5, 'rgba(245,240,230,0.06)');
    g.addColorStop(1, 'rgba(245,240,230,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();

    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = 'blur(6px)';
    const g2 = ctx.createRadialGradient(x, y, 0, x, y, r * 0.7);
    g2.addColorStop(0, 'rgba(245,240,230,0.10)');
    g2.addColorStop(1, 'rgba(245,240,230,0)');
    ctx.fillStyle = g2;
    ctx.beginPath(); ctx.arc(x, y, r * 0.7, 0, Math.PI * 2); ctx.fill();
    ctx.filter = 'none';
    ctx.restore();
  }

  function drawTrail() {
    if (trail.length < 2) return;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 0; i < trail.length - 1; i++) {
      const a = trail[i], b = trail[i + 1];
      const life = 1 - a.age / a.life;
      const width = 2 + life * 10;
      ctx.globalCompositeOperation = 'screen';
      ctx.strokeStyle = `rgba(230, 220, 200, ${0.12 * life})`;
      ctx.lineWidth = width;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();

      ctx.globalCompositeOperation = 'source-over';
      const g = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, width * 1.2);
      g.addColorStop(0, `rgba(245,240,230,${0.22 * life})`);
      g.addColorStop(1, 'rgba(245,240,230,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(a.x, a.y, width * 1.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawInk() {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = 18;
    ctx.shadowColor = 'rgba(201, 168, 86, 0.55)';
    const all = [...strokes];
    if (currentStroke) all.push(currentStroke);
    for (const stroke of all) {
      if (stroke.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        const p = stroke[i], prev = stroke[i - 1];
        const mx = (prev.x + p.x) / 2, my = (prev.y + p.y) / 2;
        ctx.quadraticCurveTo(prev.x, prev.y, mx, my);
      }
      ctx.lineTo(stroke[stroke.length - 1].x, stroke[stroke.length - 1].y);
      ctx.strokeStyle = 'rgba(245, 240, 230, 0.88)';
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(201, 168, 86, 0.55)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
    ctx.restore();
  }

  // ===================================================================
  //  BOOT
  // ===================================================================
  initGallery();   // 构建 3D 漂浮画廊（情绪长廊）：有机浮动节点 + 拖拽惯性 + Z 轴聚焦
  render();        // runs glass-cursor drawing loop for the opening
  requestAnimationFrame(starLoop);
  
})();


// ===================================================================
//  开场 H5 (画廊 / 叙事 / 入场)  →  主程序 (六书实验室 / 工坊 / 海报)
// ===================================================================
function enterMainApp(item) {
  try {
    var emo = (item && (item.file || '')) ? String(item.file).replace(/^.*\//, '').replace(/\.png$/i, '') : '';
    sessionStorage.setItem('zizaoji_emotion', emo);
  } catch (e) {}
  // 仅「喜悦类」情绪才停止开场古琴（因为主程序要切到 xiyue）；
  // 其余情绪沿用古琴续播，避免跳转瞬间古琴断奏 / 重启。
  try {
    const JOY = ['xiyue', 'anxin', 'qidai', 'zhenfen'];
    if (JOY.indexOf(emo) >= 0 && window.narvBgm) { window.narvBgm.pause(); window.narvBgm.currentTime = 0; }
  } catch (e2) {}
  document.body.classList.remove('h5-mode');
  if (window.ZizaojiApp) { window.ZizaojiApp.start(); }
}

/* ===== [2] 主程序 ===== */
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
    currentPage: 'lab',
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
    posterBg: localStorage.getItem('posterBg') || 'xuanzhi',
    emotion: '' // 用户开场页选中的情绪卡片（如 'anxin'），用于驱动后续页面背景随机切换
  };

  // ===== 工具函数 =====
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // ===== 《字造集》配乐 / 音效系统 =====
  // 音乐开关状态持久化：开关同时控制背景音乐与交互音效（开场页与主页共用此状态）。
  // 所有背景音乐均来自 media/bgm 目录。
  window.__zizaojiMuted = localStorage.getItem('zizaoji_music_muted') === '1';
  // 音量统一按设计表的 dB 建议值换算为 HTMLAudio 的线性音量。
  const AudioEngine = (() => {
    const base = 'media/';
    // 背景音乐只有两轨：古琴(home-guqin) 与 喜悦(xiyue)。
    // 古琴不在此处登记——统一复用开场 H5 已创建的 window.narvBgm 单例（见 getAudio），
    // AudioEngine 不再持有独立的 home-guqin 实例，避免「双古琴」叠加 / 重启。
    const tracks = {
      bgmJoy: 'bgm/xiyue.mp3',
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
      story: -10, intro: -10,
      loading: -2, lab: -4, ability: -8, workshop: -2,
      analysis: -6, meaning: -5, charcard: -5, certify: -5,
      poster: -5, collection: -6
    };
    const bgmByPage = {
      loading: 'bgmHome', story: 'bgmHome', intro: 'bgmHome', lab: 'bgmHome',
      ability: 'bgmHome', workshop: 'bgmHome',
      analysis: 'bgmHome', meaning: 'bgmHome',
      // 默认统一使用 home-guqin 作为背景音乐，切换页面不中断；喜悦类情绪由 emotionBgmKey() 改为 xiyue
      charcard: 'bgmHome', certify: 'bgmHome',
      poster: 'bgmHome', collection: 'bgmHome'
    };
    // 选中以下情绪卡片时，背景音乐切换为 xiyue.mp3（喜悦曲风），其余情绪沿用 home-guqin
    const joyEmotions = ['xiyue', 'anxin', 'qidai', 'zhenfen'];
    function emotionBgmKey() {
      // 优先用主程序 AppState.emotion；跳转瞬间（AppState 尚未初始化）用 __zizaojiPendingEmotion 即时识别情绪
      const emo = (AppState.emotion || window.__zizaojiPendingEmotion || '').replace(/\.png$/i, '');
      return joyEmotions.indexOf(emo) >= 0 ? 'bgmJoy' : 'bgmHome';
    }
    const audioCache = {};
    let currentBgm = null;
    let currentBgmKey = null;
    let unlocked = false;
    const pending = [];
    const now = () => Date.now();
    // 全局音效增益：所有交互音效统一提高
    const sfxBoost = 8;

    function dbToVolume(db) { return Math.max(0, Math.min(1, Math.pow(10, db / 20))); }
    function getAudio(key) {
      // 古琴类页面键（bgmHome / collection / meaning / poster）全部复用开场 window.narvBgm 单例，
      // 不新建 AudioEngine 实例；真正独立的背景音乐只有 xiyue（bgmJoy）。
      if (key === 'bgmHome' || key === 'bgmCollection' || key === 'bgmMeaning' || key === 'bgmPoster') {
        if (!window.narvBgm) {
          const a = new Audio(base + 'bgm/home-guqin.mp3');
          a.loop = true; a.volume = 0.6; a.preload = 'auto';
          try { a.load(); } catch(e) {}
          window.narvBgm = a;
        }
        return window.narvBgm;
      }
      if (!audioCache[key]) {
        const a = new Audio(base + tracks[key]);
        a.preload = 'auto';
        try { a.load(); } catch(e) {}
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
    // 手机端：每次用户交互时检查并恢复被暂停的BGM
    function ensureBgmRunning() {
      if (window.__zizaojiMuted) return;
      if (!unlocked) { unlock(); return; }
      if (currentBgm && currentBgm.paused && currentBgmKey) {
        currentBgm.volume = dbToVolume(currentBgm._zDb ?? -20);
        playWithRetry(currentBgm);
      }
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
    // 带重试的音频播放：play()失败时等待canplay后重试，确保BGM能播出来
    function playWithRetry(a) {
      const doPlay = () => {
        const p = a.play();
        if (p && p.catch) {
          p.catch(() => {
            // 播放失败（通常是音频未加载完成），等待canplay后重试
            const onReady = () => { a.play().catch(() => {}); };
            a.addEventListener('canplay', onReady, { once: true });
            // 兜底：1.5秒后强制重试
            setTimeout(() => {
              a.removeEventListener('canplay', onReady);
              if (a.paused) a.play().catch(() => {});
            }, 1500);
          });
        }
      };
      doPlay();
    }
    function startBgm(key, db, immediate, fadeMs=500) {
      const a = getAudio(key);
      const target = dbToVolume(db);
      a.loop = true;
      a._zDb = db;
      // 相同BGM且正在播放：只调音量
      if (currentBgm === a && !a.paused) {
        if (Math.abs(a.volume - target) > 0.01) fadeTo(a, target, fadeMs);
        return;
      }
      // 相同BGM但被暂停了（手机端常见）：恢复播放
      if (currentBgm === a && a.paused) {
        a.volume = immediate ? target : 0;
        playWithRetry(a);
        if (!immediate) fadeTo(a, target, fadeMs);
        return;
      }
      if (currentBgm && currentBgm !== a) {
        const old = currentBgm;
        fadeTo(old, 0, 450, () => { try { old.pause(); old.currentTime = 0; } catch(e) {} });
      }
      currentBgm = a;
      currentBgmKey = key;
      a.volume = immediate ? target : 0;
      playWithRetry(a);
      if (!immediate) fadeTo(a, target, fadeMs);
    }
    function pageBgm(pageId) {
      if (window.__zizaojiMuted) return;
      // 手机端保障：页面切换时若BGM被暂停则恢复
      if (unlocked && currentBgm && currentBgm.paused && currentBgmKey) {
        currentBgm.volume = dbToVolume(currentBgm._zDb ?? -20);
        playWithRetry(currentBgm);
      }
      const key0 = bgmByPage[pageId];
      // 配置为 null 的页面不播放背景音乐，停止当前BGM
      if (key0 === null) {
        fadeBgmOut(400);
        return;
      }
      const key = key0 ? emotionBgmKey() : 'bgmHome';
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
      // 选中喜悦类情绪时沿用 xiyue 背景音乐，其余沿用 home-guqin
      const key = emotionBgmKey();
      const db = styleId === 'minimal' ? -12 : (styleId === 'modern' ? -11 : -10);
      if (!unlocked) { currentBgmKey = key; currentBgm = getAudio(key); currentBgm._zDb = db; return; }
      startBgm(key, db, false);
    }
    // 仅预载独立的 xiyue 音轨；古琴复用开场已加载的 window.narvBgm，无需重复预载
    ['bgmJoy'].forEach(k => {
      try { const a = getAudio(k); a.preload = 'auto'; a.load(); } catch(e) {}
    });
    return { unlock, pageBgm, playSfx, fadeBgmOut, setMeaningStyle, getAudio, setMuted, toggleMuted, isMuted, ensureBgmRunning };
  })();
  window.AudioEngine = AudioEngine;

  // 浏览器自动播放策略：首次用户操作后立即解锁，并补播需要的交互声。
  // 手机端额外保障：每次交互都检查BGM是否被暂停，若暂停则恢复。
  ['pointerdown','touchstart','keydown'].forEach(evt =>
    document.addEventListener(evt, () => AudioEngine.ensureBgmRunning(), { passive: true })
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

  // ===== 造字能力值 · 三角雷达图（图案动效）=====
  const RADAR = {
    cx: 100, cy: 100, R: 78,
    axes: [
      { ux: 0,      uy: -1,   name: '构形能力', dx: 0,    dy: 16, anchor: 'middle' },
      { ux: 0.8660, uy: 0.5,  name: '意义联想', dx: 13,   dy: 4,  anchor: 'end' },
      { ux: -0.8660,uy: 0.5,  name: '结构意识', dx: -13,  dy: 4,  anchor: 'start' }
    ]
  };
  const SVGNS = 'http://www.w3.org/2000/svg';
  let radarBuilt = false;
  let radarEls = null;
  let radarRAF = 0;
  function radarPoint(axis, r) {
    return { x: RADAR.cx + axis.ux * r, y: RADAR.cy + axis.uy * r };
  }
  function buildRadar() {
    const wrap = document.getElementById('abilityRadarWrap');
    if (!wrap) return;
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('viewBox', '0 0 200 200');
    svg.setAttribute('class', 'radar-svg');
    // 同心三角网格
    [0.34, 0.67, 1].forEach((f, ri) => {
      const pts = RADAR.axes.map(a => {
        const p = radarPoint(a, RADAR.R * f);
        return p.x.toFixed(1) + ',' + p.y.toFixed(1);
      }).join(' ');
      const poly = document.createElementNS(SVGNS, 'polygon');
      poly.setAttribute('points', pts);
      poly.setAttribute('class', 'radar-ring' + (ri === 2 ? ' radar-ring-outer' : ''));
      svg.appendChild(poly);
    });
    // 三条轴线
    RADAR.axes.forEach(a => {
      const p = radarPoint(a, RADAR.R);
      const line = document.createElementNS(SVGNS, 'line');
      line.setAttribute('x1', RADAR.cx); line.setAttribute('y1', RADAR.cy);
      line.setAttribute('x2', p.x.toFixed(1)); line.setAttribute('y2', p.y.toFixed(1));
      line.setAttribute('class', 'radar-axis');
      svg.appendChild(line);
    });
    // 数据多边形
    const poly = document.createElementNS(SVGNS, 'polygon');
    poly.setAttribute('points', RADAR.cx + ',' + RADAR.cy + ' ' + RADAR.cx + ',' + RADAR.cy + ' ' + RADAR.cx + ',' + RADAR.cy);
    poly.setAttribute('class', 'radar-poly');
    poly.setAttribute('id', 'ability-poly');
    poly.style.fillOpacity = '0';
    svg.appendChild(poly);
    // 轴名 + 分数（分数固定置于轴名下，与轴名等距，三轴一致）
    const verts = [];
    const valIds = ['ability-structure-val', 'ability-association-val', 'ability-design-val'];
    const LABEL_R = RADAR.R + 15;
    const NAME_GAP = 15; // 轴名 → 分数的统一间距（viewBox 单位）
    RADAR.axes.forEach((a, i) => {
      // 数据墨点（随动画从中心生长到数据位）
      const dot = document.createElementNS(SVGNS, 'circle');
      dot.setAttribute('r', '3.6'); dot.setAttribute('class', 'radar-dot');
      dot.setAttribute('cx', RADAR.cx); dot.setAttribute('cy', RADAR.cy);
      svg.appendChild(dot);
      // 轴名
      const lp = radarPoint(a, LABEL_R);
      const nameY = lp.y + (a.uy < 0 ? -3 : 4);
      const nm = document.createElementNS(SVGNS, 'text');
      nm.setAttribute('class', 'radar-axisname');
      nm.setAttribute('x', lp.x.toFixed(1));
      nm.setAttribute('y', nameY.toFixed(1));
      nm.setAttribute('text-anchor', a.anchor);
      nm.textContent = a.name;
      svg.appendChild(nm);
      // 分数（与轴名垂直等距 NAME_GAP，三轴一致）
      const txt = document.createElementNS(SVGNS, 'text');
      txt.setAttribute('class', 'radar-val');
      txt.setAttribute('id', valIds[i]);
      txt.setAttribute('x', lp.x.toFixed(1));
      txt.setAttribute('y', (nameY + NAME_GAP).toFixed(1));
      txt.setAttribute('text-anchor', a.anchor);
      txt.textContent = '0';
      svg.appendChild(txt);
      verts.push({ dot, txt, axis: a });
    });
    wrap.appendChild(svg);
    radarEls = { poly, verts };
    radarBuilt = true;
  }
  function animateRadar(scores) {
    if (!radarEls) return;
    const radii = [scores.structure, scores.association, scores.design].map(v => RADAR.R * v / 100);
    if (radarRAF) cancelAnimationFrame(radarRAF);
    const dur = 1050, t0 = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 3);
    function frame(now) {
      const t = Math.min(1, (now - t0) / dur);
      const k = ease(t);
      const pts = radarEls.verts.map((v, i) => {
        const r = radii[i] * k;
        const p = radarPoint(v.axis, r);
        v.dot.setAttribute('cx', p.x.toFixed(1));
        v.dot.setAttribute('cy', p.y.toFixed(1));
        return p.x.toFixed(1) + ',' + p.y.toFixed(1);
      });
      radarEls.poly.setAttribute('points', pts.join(' '));
      radarEls.poly.style.fillOpacity = (0.2 * k).toFixed(3);
      if (t < 1) radarRAF = requestAnimationFrame(frame);
      else radarRAF = 0;
    }
    radarRAF = requestAnimationFrame(frame);
  }

  // ===== 情绪驱动的背景（固定）=====
  // 用户开场页选中的情绪卡片决定背景图：跳转后所有页面统一使用对应的专属背景图（非随机）。
  // 注意：卡片图 benshang.png 对应的背景文件是 beishangbg.png（拼写差异），故用映射表显式对应。
  const EMOTION_BG_MAP = {
    anxin:    'anxinbg.png',
    benshang: 'beishangbg.png',
    fennu:    'fennubg.png',
    gudu:     'gudubg.png',
    kongju:   'kongjubg.png',
    qidai:    'qidaibg.png',
    xiyue:    'xiyuebg.png',
    zhenfen:  'zhenfenbg.png'
  };

  function getEmotionBg() {
    const emo = (AppState.emotion || '').replace(/\.png$/i, '');
    if (emo && EMOTION_BG_MAP[emo]) {
      return 'images/' + EMOTION_BG_MAP[emo];
    }
    return 'images/paper-bg.png'; // 兜底：未选情绪时用水墨宣纸
  }

  // ====== 悲伤：贯穿全程的细雨（全局 canvas，内容之上、不挡交互）======
  // 仅当情绪为「悲伤」时运行；挂在 #app 根、全屏覆盖，切换页面不销毁，天然贯穿所有页面。
  const SadRain = (function () {
    let canvas = null, ctx = null, raf = 0, drops = [], w = 0, h = 0, on = false;
    const reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function makeDrop(rand) {
      return {
        x: Math.random() * w,
        y: rand ? Math.random() * h : -40,
        len: 12 + Math.random() * 26,
        sp: 3.8 + Math.random() * 5.2,
        a: 0.22 + Math.random() * 0.30,
        drift: 0.5 + Math.random() * 0.9
      };
    }
    function resize() {
      if (!canvas) return;
      w = canvas.width = Math.floor(window.innerWidth);
      h = canvas.height = Math.floor(window.innerHeight);
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      const n = Math.max(32, Math.round(window.innerWidth * window.innerHeight / 6000));
      drops = [];
      for (let i = 0; i < n; i++) drops.push(makeDrop(true));
    }
    function frame() {
      if (!on || !ctx) return;
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1.1;
      for (const d of drops) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(190,205,228,' + d.a + ')';
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.drift * 2, d.y + d.len);
        ctx.stroke();
        d.y += d.sp;
        d.x += 0.18;
        if (d.y > h + 24) { d.y = -24; d.x = Math.random() * w; }
      }
      raf = requestAnimationFrame(frame);
    }
    function init() {
      if (canvas) return;
      canvas = document.createElement('canvas');
      canvas.className = 'sad-rain';
      const app = document.getElementById('app') || document.body;
      app.appendChild(canvas);
      ctx = canvas.getContext('2d');
      resize();
      window.addEventListener('resize', resize);
    }
    return {
      show() {
        if (reduceMotion) return; // 尊重减弱动态偏好
        init();
        if (on) return;
        on = true;
        canvas.classList.add('on');
        raf = requestAnimationFrame(frame);
      },
      hide() {
        on = false;
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        if (canvas) { canvas.classList.remove('on'); ctx && ctx.clearRect(0, 0, w, h); }
      }
    };
  })();

  function applyEmotionBackground() {
    const page = document.getElementById('page-' + (AppState.currentPage || 'lab'));
    if (!page) return;
    const url = getEmotionBg();
    // 宣纸暖色蒙版（0.5，略低于此前 0.55，让情绪氛围更透出）：统一宣纸调性、提升墨色文字对比度
    page.style.backgroundImage =
      'linear-gradient(rgba(247,243,234,0.5), rgba(247,243,234,0.5)), url("' + url + '")';
    page.style.backgroundSize = 'cover';
    page.style.backgroundPosition = 'center';
    page.style.backgroundRepeat = 'no-repeat';
    page.style.backgroundColor = 'transparent';
    // 情绪会呼吸 + 情绪温度：
    //  · .emotion-fx      背景氛围层（内容之下）
    //  · .emotion-fx-top  前景签名层（内容之上、边缘可见）
    let fx = page.querySelector(':scope > .emotion-fx');
    if (!fx) {
      fx = document.createElement('div');
      fx.className = 'emotion-fx';
      page.insertBefore(fx, page.firstChild);
    }
    let fxTop = page.querySelector(':scope > .emotion-fx-top');
    if (!fxTop) {
      fxTop = document.createElement('div');
      fxTop.className = 'emotion-fx-top';
      page.appendChild(fxTop);
    }
    const emo = (AppState.emotion || '').replace(/\.png$/i, '');
    const key = EMOTION_BG_MAP[emo] ? emo : 'none';
    fx.className = 'emotion-fx fx-' + key;
    fxTop.className = 'emotion-fx-top fx-' + key;
    // 悲伤：全局细雨贯穿所有页面（仅悲伤时运行，其余情绪关闭）
    if (key === 'benshang') SadRain.show(); else SadRain.hide();
    if (!fx.dataset.built) {
      buildEmotionParticles(fx, fxTop, key);
      fx.dataset.built = '1';
    }
  }

  // 为需要粒子的情绪注入少量 DOM：
  //  · 花瓣/飞鸟 → 背景层 .emotion-fx（位于内容之下）
  //  · 五种情绪签名视觉 + 大环境光晕 → 前景层 .emotion-fx-top（位于内容之上、边缘可见）
  function buildEmotionParticles(fx, fxTop, emo) {
    fx.querySelectorAll('.petal, .bird').forEach(n => n.remove());
    fxTop.querySelectorAll('.anxin-bamboo, .anxin-mote, .benshang-ink, .qidai-line, .qidai-cloud, .qidai-spark, .gudu-moon, .gudu-star, .gudu-vignette, .kongju-wisp, .fx-ambience').forEach(n => n.remove());
    function addAmbience(side) {
      const a = document.createElement('span');
      a.className = 'fx-ambience' + (side ? ' ' + side : '');
      fxTop.appendChild(a);
      return a;
    }
    if (emo === 'xiyue') {
      for (let i = 0; i < 9; i++) {
        const p = document.createElement('span');
        p.className = 'petal';
        const s = 0.7 + Math.random() * 0.7;
        p.style.left = (Math.random() * 100).toFixed(2) + '%';
        p.style.width = p.style.height = (10 * s).toFixed(0) + 'px';
        p.style.setProperty('--drift', (Math.random() * 120 - 60).toFixed(0) + 'px');
        p.style.animationDuration = (7 + Math.random() * 6).toFixed(2) + 's';
        p.style.animationDelay = (-Math.random() * 12).toFixed(2) + 's';
        fx.appendChild(p);
      }
    } else if (emo === 'zhenfen') {
      for (let i = 0; i < 7; i++) {
        const b = document.createElement('span');
        b.className = 'bird';
        const s = 0.8 + Math.random() * 0.6;
        b.style.left = (Math.random() * 100).toFixed(2) + '%';
        b.style.width = (16 * s).toFixed(0) + 'px';
        b.style.height = (8 * s).toFixed(0) + 'px';
        b.style.setProperty('--drift', (Math.random() * 80 - 40).toFixed(0) + 'px');
        b.style.animationDuration = (9 + Math.random() * 6).toFixed(2) + 's';
        b.style.animationDelay = (-Math.random() * 14).toFixed(2) + 's';
        fx.appendChild(b);
      }
    } else if (emo === 'anxin') {
      addAmbience();
      const bL = document.createElement('span'); bL.className = 'anxin-bamboo left'; fxTop.appendChild(bL);
      const bR = document.createElement('span'); bR.className = 'anxin-bamboo right'; fxTop.appendChild(bR);
      // 安睡光尘：集中在两侧边缘列上升的暖绿光点
      for (let i = 0; i < 24; i++) {
        const m = document.createElement('span');
        m.className = 'anxin-mote';
        m.style.left = (Math.random() < 0.5 ? (2 + Math.random() * 13) : (85 + Math.random() * 13)).toFixed(2) + '%';
        m.style.bottom = (-12 - Math.random() * 40).toFixed(0) + 'px';
        const sz = 5 + Math.random() * 6;
        m.style.width = m.style.height = sz.toFixed(0) + 'px';
        m.style.animationDuration = (10 + Math.random() * 9).toFixed(2) + 's';
        m.style.animationDelay = (-Math.random() * 18).toFixed(2) + 's';
        fxTop.appendChild(m);
      }
    } else if (emo === 'benshang') {
      addAmbience();
      const ink = document.createElement('span'); ink.className = 'benshang-ink'; fxTop.appendChild(ink);
    } else if (emo === 'qidai') {
      addAmbience();
      const line = document.createElement('span'); line.className = 'qidai-line'; fxTop.appendChild(line);
      const cloud = document.createElement('span'); cloud.className = 'qidai-cloud'; fxTop.appendChild(cloud);
      // 上升萤火：自下而上漂起的米金微光（期待）
      for (let i = 0; i < 22; i++) {
        const sp = document.createElement('span');
        sp.className = 'qidai-spark';
        sp.style.left = (Math.random() * 100).toFixed(2) + '%';
        sp.style.setProperty('--drift', (Math.random() * 80 - 40).toFixed(0) + 'px');
        const sz = 5 + Math.random() * 5;
        sp.style.width = sp.style.height = sz.toFixed(0) + 'px';
        sp.style.animationDuration = (8 + Math.random() * 7).toFixed(2) + 's';
        sp.style.animationDelay = (-Math.random() * 16).toFixed(2) + 's';
        fxTop.appendChild(sp);
      }
    } else if (emo === 'gudu') {
      addAmbience();
      // 孤月 + 疏星 + 隔离暗角（孤独）
      const moon = document.createElement('span'); moon.className = 'gudu-moon'; fxTop.appendChild(moon);
      for (let i = 0; i < 16; i++) {
        const st = document.createElement('span');
        st.className = 'gudu-star';
        st.style.left = (Math.random() * 100).toFixed(2) + '%';
        st.style.top = (Math.random() * 100).toFixed(2) + '%';
        st.style.animationDuration = (4 + Math.random() * 6).toFixed(2) + 's';
        st.style.animationDelay = (-Math.random() * 11).toFixed(2) + 's';
        fxTop.appendChild(st);
      }
      const vig = document.createElement('span'); vig.className = 'gudu-vignette'; fxTop.appendChild(vig);
    } else if (emo === 'kongju') {
      addAmbience('left'); addAmbience('right');
      // 两侧边缘缓慢游移的大冷雾（恐惧的不安）
      for (let i = 0; i < 6; i++) {
        const w = document.createElement('span');
        w.className = 'kongju-wisp ' + (i % 2 ? 'right' : 'left');
        w.style.top = (8 + Math.random() * 78).toFixed(0) + '%';
        w.style.animationDuration = (11 + Math.random() * 9).toFixed(2) + 's';
        w.style.animationDelay = (-Math.random() * 14).toFixed(2) + 's';
        fxTop.appendChild(w);
      }
    }
    // 一次性绑定全局交互（安心触摸水波 / 恐惧远处光闪 + 偶尔 1px 抖动）
    setupEmotionInteractions();
  }

  // 全局交互：仅绑定一次；尊重 prefers-reduced-motion
  function setupEmotionInteractions() {
    if (window.__zizaojiEmotionFx) return;
    window.__zizaojiEmotionFx = true;
    const reduce = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    // 安心：用户触摸哪里，哪里冒出一圈水波（扩散后消失）
    let lastRipple = 0;
    document.addEventListener('pointerdown', function (e) {
      const emo = (AppState.emotion || '').replace(/\.png$/i, '');
      if (emo !== 'anxin') return;
      const now = Date.now();
      if (now - lastRipple < 220) return;   // 节流，避免连点刷屏
      lastRipple = now;
      const page = document.getElementById('page-' + (AppState.currentPage || 'lab'));
      const fx = page && page.querySelector(':scope > .emotion-fx-top');
      if (!fx) return;
      const rect = page.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      for (let i = 0; i < 3; i++) {
        const r = document.createElement('span');
        r.className = 'anxin-ripple';
        r.style.left = x + 'px';
        r.style.top = y + 'px';
        r.style.animationDelay = (i * 0.5).toFixed(2) + 's';
        fx.appendChild(r);
        r.addEventListener('animationend', function () { r.remove(); });
      }
    });

    // 恐惧：每隔 ~6 秒，远处出现一次极淡的光闪 + 汉字极短 1px 偏移
    setInterval(function () {
      const emo = (AppState.emotion || '').replace(/\.png$/i, '');
      if (emo !== 'kongju') return;
      const page = document.getElementById('page-' + (AppState.currentPage || 'lab'));
      const fx = page && page.querySelector(':scope > .emotion-fx-top');
      if (!fx) return;
      const light = document.createElement('span');
      light.className = 'kongju-light';
      if (Math.random() < 0.5) { light.style.left = (Math.random() * 22).toFixed(0) + '%'; }
      else { light.style.right = (Math.random() * 22).toFixed(0) + '%'; }
      light.style.top = (18 + Math.random() * 52).toFixed(0) + '%';
      fx.appendChild(light);
      light.addEventListener('animationend', function () { light.remove(); });
      // 极克制的 1px 抖动（160ms 后即复位，不要一直抖）
      page.classList.add('kongju-jitter');
      setTimeout(function () { page.classList.remove('kongju-jitter'); }, 160);
    }, 6200);
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
          analysis:['analysis','让我把这个字的故事记下来。'],
          meaning:['meaning','每一个字，都有它自己的故事。'],
          charcard:['charcard','我把它记下来了！'],
          collection:['collection','每一个字，都有属于自己的故事哦。']
          };
          if(xuanMap[pageId]){
            XuanXuan.show(...xuanMap[pageId]);
          }else{
            // 不在映射内的页面（造字人格、海报、释义、能力值、加载等）隐藏玄玄，避免残留遮挡画面
            const xuanEl=document.getElementById('xuanxuan');
            if(xuanEl) xuanEl.style.display='none';
          }
       }
       AudioEngine.pageBgm(pageId);
      // 触发页面初始化
      try {
        if (pageInit[pageId]) pageInit[pageId]();
      } catch(e) {
        console.error('页面初始化错误:', pageId, e);
      }
      // 根据开场情绪卡片，固定使用对应的专属背景图（所有页面一致）
      try { applyEmotionBackground(); } catch(e) { console.error('背景切换错误:', e); }
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
      // 雷达图生长动画
      if (!radarBuilt) buildRadar();
      animateRadar(finalScores);
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
      // 确保海报脚本已加载后再生成海报与渲染背景切换（懒加载，不阻塞首屏）
      ensurePosterScripts().then(() => {
        generatePoster();
        renderBgSwitcher();
      });
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
      voiceAudio = new Audio('media/voice.mp3');
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
      // 输入用户名后进入六书实验室
      inkTransition(() => {
        navigateTo('lab');
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
      { img: 'images/sun-real.svg' },
      { img: 'images/sun-oracle.svg' },
      { img: 'images/sun-seal.svg' },
      { img: 'images/sun-day.svg' }
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
      // 场景三：认识偏旁 —— 点木/火时玄玄变形并解说
      if (window.XuanXuan) XuanXuan.transform(id);
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

    // 至少两个构件才能完成造字（单构件禁止进入下一页）
    $('#btn-generate').disabled = comps.length < 2;
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
      if (AppState.currentChar.components.length < 2) {
        showToast('请选择两个构件，再完成造字');
        // 场景四：组合失败 —— 玄玄安慰而不是提示错误
        if (window.XuanXuan) XuanXuan.comfort();
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

    // 优先显示用户造出的完整新字图像，兜底显示构件名称拼接
    const modalChar = $('#modalCharacter');
    const glyph = AppState.createdGlyph || JSON.parse(sessionStorage.getItem('createdGlyph') || 'null');
    const glyphImage = (glyph && glyph.image) || AppState.currentChar.glyphImage;
    if (glyphImage) {
      modalChar.innerHTML = `<img src="${glyphImage}" alt="新造字" style="max-width:160px;max-height:160px;object-fit:contain;display:block;margin:0 auto;">`;
    } else {
      modalChar.textContent = charName;
    }
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

    // 释义（逐字浮现：拆成 span，由 CSS .cc-inkch 按 animation-delay 依次晕开）
    const meaningEl = document.getElementById('charcard-meaning');
    if (meaningEl) {
      meaningEl.textContent = '';
      const text = char.meaning || '心有所向，便是此刻。';
      Array.from(text).forEach((ch, i) => {
        const sp = document.createElement('span');
        sp.className = 'cc-inkch';
        sp.style.animationDelay = (0.62 + i * 0.035).toFixed(3) + 's';
        sp.textContent = ch;
        meaningEl.appendChild(sp);
      });
    }

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
    $('#certify-back-name').textContent = personality.name;
    const card = document.getElementById('certify-card');
    if (card) card.classList.remove('flipped');   // 重新进入时回到正面
     [0,1,2,3,4].forEach((i) => setTimeout(() => AudioEngine.playSfx('chime', -17, 300, 0.95 + i*0.08), 220 + i*240));
     setTimeout(() => AudioEngine.playSfx('success', -9, 1500), 1550);
  }

  function initCertify() {
    $('#certify-continue-btn').addEventListener('click', () => {
      // 保存到字造集
      saveCurrentChar();
      inkTransition(() => navigateTo('poster'));
    });

    // 吊牌（Lanyard）效果：点击翻面 + 指针视差倾斜
    const card = document.getElementById('certify-card');
    if (card) card.addEventListener('click', () => card.classList.toggle('flipped'));
    initLanyardParallax();
  }

  // 指针视差：让吊牌随光标做 3D 倾斜（映射 Lanyard 的 transform/视差手感）
  function initLanyardParallax() {
    const page = document.getElementById('page-certify');
    const tilt = document.getElementById('lanyard-tilt');
    if (!page || !tilt) return;
    const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce()) return;
    const onMove = (e) => {
      if (page.style.display === 'none' || reduce()) return;
      const dx = (e.clientX / window.innerWidth - 0.5) * 2;   // -1..1
      const dy = (e.clientY / window.innerHeight - 0.5) * 2;
      tilt.style.setProperty('--ry', (dx * 12).toFixed(2) + 'deg');
      tilt.style.setProperty('--rx', (-dy * 9).toFixed(2) + 'deg');
    };
    const reset = () => { tilt.style.setProperty('--ry', '0deg'); tilt.style.setProperty('--rx', '0deg'); };
    window.addEventListener('pointermove', onMove, { passive: true });
    page.addEventListener('pointerleave', reset);
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
  // 海报相关脚本（poster.generator.js，已内联合成背景图）在页面加载时不再同步引入，
  // 避免 6.8MB 内嵌图片阻塞首屏。这里按需/后台懒加载，进入海报页前确保已就绪。
  let _posterScriptsPromise = null;
  function loadScriptOnce(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[data-poster-src="' + src + '"]')) return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.dataset.posterSrc = src;
      s.onload = () => resolve();
      s.onerror = () => {
        // 加载失败时移除该元素，避免下次被误判为“已加载”而无法重试
        if (s.parentNode) s.parentNode.removeChild(s);
        reject(new Error('脚本加载失败: ' + src));
      };
      document.body.appendChild(s);
    });
  }
  function ensurePosterScripts() {
    if (!_posterScriptsPromise) {
      // poster.generator.js 已内联合成背景图（ZZJ_EMBEDDED_IMAGES），只需加载一个文件
      _posterScriptsPromise = loadScriptOnce('js/poster.generator.js')
        .catch(err => { _posterScriptsPromise = null; throw err; });
    }
    return _posterScriptsPromise;
  }

  async function generatePoster() {
    await ensurePosterScripts();
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

  // ===== 我的字造集 · Reel Gallery 引擎（还原 React Bits Reel Gallery 效果） =====
  // 倾斜的多行字卡卷轴：随滚动/拖拽横向滑动，含自动漂移、逐行速度差、相邻行反向、
  // 静止去色 + 光标聚光、边缘淡出、外侧卷轴变暗缩小。
  const REEL = {
    rows: 5,            // 卷轴行数
    rowHeight: 84,      // 每张字卡高度(px)
    rowGap: 14,
    itemGap: 14,
    plateAspect: 0.92,  // 字卡宽/高
    radius: 12,
    tilt: 7,            // 整叠倾斜角度(deg) —— 对应 React Bits 的 tilt
    arch: 46,           // 外侧卷轴后退深度(px) —— 对应 arch
    speed: 1,
    speedVariance: 0.5, // 各行速度差
    alternate: true,    // 相邻行反向滑动
    autoScroll: 18,     // 自动漂移 px/秒
    inertia: 0.92,      // 惯性衰减
    grayscale: 0.5,     // 静止去色
    focusRadius: 200,   // 鼠标聚光半径
    fade: 0.12,
    dim: 0.32,          // 外侧卷轴变暗
    taper: 0.12,        // 外侧卷轴缩小
    minPlatesPerReel: 8 // 每行最少字卡数(不足则复制铺满)
  };

  let reelRAF = null, reelVel = 0, reelState = [], reelLast = 0;
  let reelDragging = false, reelDownX = 0, reelLastX = 0, reelMoved = 0, reelDownPlate = null;

  function plateHTML(char, idx) {
    // 未点击前只展示「用户造的字」+「造字人格」，不显示风格名
    return `<div class="reel-plate" data-index="${idx}">
      <div class="reel-glyph">${renderCollectionGlyph(char)}</div>
      <div class="reel-tag">${escapeHtml(char.personality?.name || '造字师')}</div>
    </div>`;
  }

  function renderCollection() {
    const grid = $('#collection-grid');
    stopReelGallery();
    if (AppState.collection.length === 0) {
      grid.className = 'collection-grid collection-empty-wrap';
      grid.innerHTML = `
        <div class="collection-empty">
          <div class="icon">字</div>
          <div>还没有创造的字</div>
          <div style="font-size:12px;margin-top:8px;opacity:0.6">开始造第一个字吧</div>
        </div>`;
      return;
    }
    grid.className = 'collection-grid reel-gallery';
    const cards = AppState.collection;
    const rows = REEL.rows;
    // 字卡按行轮流分配，保证每一行都至少分到一张（字少时复制铺满）
    const reelsBase = Array.from({ length: rows }, () => []);
    if (cards.length >= rows) {
      cards.forEach((c, i) => reelsBase[i % rows].push(c));
    } else {
      for (let r = 0; r < rows; r++) reelsBase[r].push(cards[r % cards.length]);
    }
    let html = '<div class="reel-stack" id="reel-stack">';
    for (let r = 0; r < rows; r++) {
      let base = reelsBase[r].slice();
      while (base.length < REEL.minPlatesPerReel) base = base.concat(reelsBase[r]);
      const copyCount = Math.round(base.length / reelsBase[r].length);
      const plates = base.map(c => plateHTML(c, cards.indexOf(c))).join('');
      html += `<div class="reel" data-reel="${r}" data-copy="${copyCount}">${plates}</div>`;
    }
    html += '</div>';
    grid.innerHTML = html;
    bindReelHandlers(grid);
    startReelGallery(grid);
  }

  function bindReelHandlers(grid) {
    if (grid.dataset.reelReady) return;
    grid.dataset.reelReady = '1';
    grid.addEventListener('wheel', (e) => {
      e.preventDefault();
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      reelVel += d * 0.18;
    }, { passive: false });
    grid.addEventListener('pointerdown', (e) => {
      reelDragging = true;
      reelDownX = e.clientX; reelLastX = e.clientX;
      reelMoved = 0; reelVel = 0;
      reelDownPlate = e.target.closest('.reel-plate');
    });
    window.addEventListener('pointermove', (e) => {
      if (reelDragging) {
        const dx = e.clientX - reelLastX;
        reelLastX = e.clientX;
        reelVel += dx * 0.6;
        reelMoved += Math.abs(dx);
      }
      updateReelFocus(e.clientX, e.clientY);
    });
    window.addEventListener('pointerup', () => {
      if (reelDragging && reelMoved < 6 && reelDownPlate) {
        const idx = parseInt(reelDownPlate.dataset.index);
        if (!isNaN(idx)) {
          AudioEngine.playSfx('chime', -16, 300);
          showCharDetail(idx);
        }
      }
      reelDragging = false; reelDownPlate = null;
    });
  }

  function updateReelFocus(px, py) {
    if (AppState.currentPage !== 'collection') return;
    const plates = document.querySelectorAll('#collection-grid .reel-plate');
    for (const p of plates) {
      const rct = p.getBoundingClientRect();
      const cx = rct.left + rct.width / 2, cy = rct.top + rct.height / 2;
      const d = Math.hypot(px - cx, py - cy);
      if (d < REEL.focusRadius) p.classList.add('focus'); else p.classList.remove('focus');
    }
  }

  function startReelGallery(grid) {
    stopReelGallery();
    const reelEls = Array.from(grid.querySelectorAll('.reel'));
    const rows = reelEls.length;
    if (!rows) return;
    const center = (rows - 1) / 2;
    reelState = reelEls.map((el, r) => {
      const copyCount = parseFloat(el.dataset.copy) || 1;
      const baseWidth = el.scrollWidth / copyCount;
      const dist = center ? Math.abs(r - center) / center : 0;
      const z = -REEL.arch * dist;
      const s = 1 - REEL.taper * dist;
      const op = 1 - REEL.dim * dist;
      el.style.opacity = op;
      const dir = (REEL.alternate && r % 2) ? -1 : 1;
      const sp = REEL.speed * (1 + REEL.speedVariance * (center ? (r - center) / center : 0));
      return {
        el, base: baseWidth,
        auto: -Math.random() * baseWidth,
        user: 0,
        es: sp * dir,
        z, s
      };
    });
    reelLast = performance.now();
    reelRAF = requestAnimationFrame(reelTick);
  }

  function stopReelGallery() {
    if (reelRAF) { cancelAnimationFrame(reelRAF); reelRAF = null; }
  }

  function reelTick(now) {
    if (AppState.currentPage !== 'collection') { reelRAF = null; return; }
    const dt = Math.min(0.05, (now - reelLast) / 1000) || 0;
    reelLast = now;
    for (const r of reelState) {
      r.auto += REEL.autoScroll * r.es * dt;
      r.user += reelVel * r.es;
      let x = r.auto + r.user;
      let w = ((x % r.base) + r.base) % r.base;
      r.el.style.transform = `translate3d(${-w}px,0,${r.z}px) scale(${r.s})`;
    }
    reelVel *= REEL.inertia;
    if (Math.abs(reelVel) < 0.005) reelVel = 0;
    reelRAF = requestAnimationFrame(reelTick);
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
    XuanXuan.hide(); // 字卡详情打开时隐藏玄玄
  }

  function initCollection() {
    $('#btn-collection-new').addEventListener('click', () => {
      resetCurrentChar();
      inkTransition(() => navigateTo('workshop'));
    });

    $('#detail-close').addEventListener('click', () => {
      $('#detail-modal').classList.remove('show');
      if (XuanXuan._el) XuanXuan._el.style.display = 'block'; // 关闭详情恢复玄玄
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
        if (XuanXuan._el) XuanXuan._el.style.display = 'block'; // 关闭详情恢复玄玄
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

    // 读取开场页选中的情绪卡片（如 anxin），驱动后续页面背景随机切换
    try { AppState.emotion = (sessionStorage.getItem('zizaoji_emotion') || '').replace(/\.png$/i, ''); } catch (e) {}

    // 初始化各模块（每个都独立try-catch，防止一个失败影响全部）
    const initFns = [initNameInput, initAbility, initWorkshop, initMeaning, initCharCard, initCertify, initPoster, initCollection, initTopBar];
    initFns.forEach(fn => {
      try { fn(); } catch(e) { console.error('初始化失败:', fn.name, e); }
    });

    // 直接以「六书实验室」为首页（已移除开场页与首页）
    try {
      navigateTo('lab');
    } catch(e) {
      console.error('导航失败:', e);
      // 兜底：直接显示六书实验室
      document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
      const lab = document.getElementById('page-lab');
      if (lab) lab.style.display = 'flex';
    }

    // 背景音乐切换已在开场跳转瞬间（startScrollTransition）完成：
    // 喜悦类→立即播 xiyue（缓入）；其余→古琴(window.narvBgm) 续播不中断。
    // 此处再确认一次（兜底），保证主程序加载后音轨状态正确。
    if (!window.__zizaojiMuted) {
      try { AudioEngine.unlock(); } catch (e) {}
      try { AudioEngine.pageBgm('lab'); } catch (e) {}
    }

    // 应用可交互后即后台预载海报脚本（6.8MB 内嵌图片不阻塞首屏，且到海报页时通常已就绪）。
    // 不等待 window.load——音频等资源会拖慢 load 事件，而首屏交互(DCL)才是用户感知的加载完成点。
    setTimeout(() => { try { ensurePosterScripts(); } catch(e) {} }, 2000);
  }

  // 对外暴露主程序入口：由开场 H5（画廊 → 开始造字）调用，而非自动启动
  window.ZizaojiApp = {
    start: init,
    navigateTo: navigateTo,
    setEmotion: function (e) { AppState.emotion = e; },
    getState: function () { return AppState; }
  };

  // 调试/直达入口：?app=1 跳过开场叙事，直接进入六书实验室
  if (location.search.indexOf('app=1') >= 0) {
    document.body.classList.remove('h5-mode');
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }
})();

