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
      '<img id="xuan-img" alt="玄玄" src="' + this.base + 'assets/xuanxuan/' + this.POSES.base + '">' +
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
    return this.base + 'assets/xuanxuan/' + (this.POSES[pose] || this.POSES.base);
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
