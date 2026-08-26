/**
 * 字造集 - 海报生成器 poster.generator.js
 * 基于Canvas绘制国风海报
 */

const PosterGenerator = (function() {
  'use strict';

  // 海报背景配置 - 使用真实背景图
  const backgrounds = {
    xuanzhi: {
      name: '宣纸',
      image: window.ZZJ_EMBEDDED_IMAGES?.xuanzhi || 'assets/images/poster-bg-jpg/Background_RicePaper.jpg'
    },
    shanshui: {
      name: '山水',
      image: window.ZZJ_EMBEDDED_IMAGES?.shanshui || 'assets/images/poster-bg-jpg/Background_Landscape.jpg'
    },
    yunwen: {
      name: '云纹',
      image: window.ZZJ_EMBEDDED_IMAGES?.yunwen || 'assets/images/poster-bg-jpg/Background_CloudPattern.jpg'
    },
    zhuying: {
      name: '竹影',
      image: window.ZZJ_EMBEDDED_IMAGES?.zhuying || 'assets/images/poster-bg-jpg/Background_BambooShadow.jpg'
    },
    yinzhang: {
      name: '印章',
      image: window.ZZJ_EMBEDDED_IMAGES?.yinzhang || 'assets/images/poster-bg-jpg/Background_Seal.jpg'
    },
    moji: {
      name: '墨迹',
      image: window.ZZJ_EMBEDDED_IMAGES?.moji || 'assets/images/poster-bg-jpg/Background_InkWash.jpg'
    }
  };

  // 背景持久化：从localStorage读取，默认宣纸
  let currentBgId = localStorage.getItem('posterBg') || 'xuanzhi';
  // 请求ID，确保只有最新的generate请求能更新Canvas
  let generateReqId = 0;
  let lastGenerateData = null;
  let lastGenerateBgId = null;

  // 图片加载：统一先 fetch 成 Blob，再由 objectURL 绘制到 Canvas。
  // 这样即使部署在 GitHub Pages / 手机内置浏览器中，也不会因为图片资源
  // 的响应头或缓存策略导致 Canvas 被污染（Tainted canvas）。
  const imageCache = {};
  // 所有海报图片优先使用内嵌 data URL。data URL 不会污染 Canvas，且不受 GitHub Pages、手机内置浏览器缓存/跨域策略影响。
  async function loadImage(src) {
    if (imageCache[src]) return imageCache[src];
    const img = await loadImageElement(src);
    imageCache[src] = img;
    return img;
  }

  async function loadImageElement(src) {
    // Canvas 导出最容易在这里被污染：只要有一张跨源图片直接进入 Canvas，
    // 后续 toBlob()/toDataURL() 就会抛出 "Tainted canvases may not be exported"。
    // 项目内的图片全部先转换成 data/blob URL，再交给 Image 绘制，避免这个问题。
    const source = String(src || '');
    if (!source) throw new Error('图片地址为空');

    if (/^data:/i.test(source) || /^blob:/i.test(source)) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('图片加载失败: ' + source.slice(0, 120)));
        img.src = source;
      });
    }

    // 优先 fetch 为同源 Blob。Blob URL 绘制到 Canvas 后不会因为原始 URL 的
    // CORS/缓存响应头而污染 Canvas。
    try {
      const response = await fetch(new URL(source, document.baseURI).href, {
        mode: 'same-origin',
        credentials: 'same-origin',
        cache: 'force-cache'
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      try {
        return await new Promise((resolve, reject) => {
          const img = new Image();
          img.decoding = 'async';
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('Blob 图片加载失败'));
          img.src = objectUrl;
        });
      } catch (e) {
        URL.revokeObjectURL(objectUrl);
        throw e;
      }
    } catch (fetchError) {
      // 最后的兼容兜底：明确设置 crossOrigin，再尝试直接加载。
      return await new Promise((resolve, reject) => {
        const img = new Image();
        img.decoding = 'async';
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('图片加载失败: ' + source.slice(0, 120)));
        img.src = new URL(source, document.baseURI).href;
      });
    }
  }

  // 设置当前背景并持久化
  function setBackground(bgId) {
    if (backgrounds[bgId]) {
      currentBgId = bgId;
      lastGenerateBgId = bgId;
      localStorage.setItem('posterBg', bgId);
      return true;
    }
    return false;
  }

  /**
   * 生成海报（异步，加载背景图和印章图）
   * @param {Object} data - 造字数据，必须包含 glyphImage
   * @param {string|null} bgId - 背景ID，传null则使用当前设置的背景
   * @param {HTMLCanvasElement} canvas - 画布元素
   */
  async function generate(data, bgId, canvas) {
    if (window.AudioEngine) window.AudioEngine.playSfx('brush', -12, 1200);
    // 请求ID，确保只有最新的请求能更新Canvas
    const reqId = ++generateReqId;

    const ctx = canvas.getContext('2d');
    const W = 1080;
    const H = 1920;
    canvas.width = W;
    canvas.height = H;

    // 兼容多种调用方式：bgId传null则使用当前设置的背景
    const useBgId = bgId || currentBgId;
    const bg = backgrounds[useBgId] || backgrounds.xuanzhi;
    lastGenerateData = data ? { ...data } : {};
    lastGenerateBgId = useBgId;

    // 先更新可视层背景，保证点击缩略图后立即反馈；Canvas 生成完成后会再把同一背景写入像素。
    canvas.style.backgroundImage = `url(\"${new URL(bg.image, document.baseURI).href}\")`;
    canvas.style.backgroundSize = 'cover';
    canvas.style.backgroundPosition = 'center';
    canvas.style.backgroundRepeat = 'no-repeat';

    // 1. 绘制背景图
    try {
      const bgImg = await loadImage(bg.image);
      if (reqId !== generateReqId) return; // 已有新的请求，中止
      ctx.drawImage(bgImg, 0, 0, W, H);
    } catch(e) {
      if (reqId !== generateReqId) return;
      console.error('背景图加载失败:', bg.image, e);
      // 可视画布保留 CSS 背景；离屏导出画布必须明确失败，避免生成一张“看起来成功但没有背景”的海报。
      if (canvas.id !== 'poster-canvas') {
        throw new Error('背景图片加载失败：' + bg.name);
      }
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f0e6';
      ctx.fillRect(0, 0, W, H);
    }

    // 3. 绘制边框
    drawBorder(ctx, W, H);

    // 4. 绘制标题
    drawTitle(ctx, W, H);

    // 5. 绘制最终新造字（必须使用导出的glyphImage，不再重新绘制构件）
    if (!data.glyphImage) {
      if (reqId !== generateReqId) return;
      // 最终兜底：即使历史作品没有保存成品图，也至少把当前构件组合绘制到海报，
      // 不再显示“（新造字）”占位文字。
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#171614';
      const comps = Array.isArray(data.components) ? data.components : [];
      if (comps.length) {
        const labels = comps.map(c => c.name || c.char || '').filter(Boolean);
        ctx.font = '300px "Noto Serif SC", serif';
        ctx.fillText(labels.join(''), W / 2, H * 0.38);
      } else {
        ctx.fillStyle = '#999';
        ctx.font = '40px "Noto Serif SC", serif';
        ctx.fillText('新造字', W / 2, H * 0.38);
      }
      ctx.restore();
    } else {
      try {
        const glyphImg = await loadImage(data.glyphImage);
        if (reqId !== generateReqId) return;
        const drawSize = 420;
        const charY = H * 0.38;
        ctx.drawImage(glyphImg, W/2 - drawSize/2, charY - drawSize/2, drawSize, drawSize);
      } catch(e) {
        if (reqId !== generateReqId) return;
        console.error('新造字图像加载失败:', e);
        ctx.fillStyle = '#999';
        ctx.font = '40px "Noto Serif SC", serif';
        ctx.textAlign = 'center';
        ctx.fillText('（新造字）', W/2, H * 0.38);
      }
    }

    // 6. 绘制构件信息
    drawComponentInfo(ctx, W, H, data);

    // 7. 绘制释义
    drawInterpretation(ctx, W, H, data);

    // 8. 绘制造字人格
    drawPersonality(ctx, W, H, data);

    // 9. 绘制印章（使用真实印章图）
    if (window.AudioEngine) window.AudioEngine.playSfx('seal', -18, 800);
    await drawSeal(ctx, W, H);
    if (reqId !== generateReqId) return;

    // 10. 绘制落款
    drawSignature(ctx, W, H, data);

    // 11. 绘制声明
    drawDisclaimer(ctx, W, H);
  }

  function drawBackground(ctx, W, H, bg) {
    // 基础色
    ctx.fillStyle = bg.baseColor;
    ctx.fillRect(0, 0, W, H);

    // 宣纸纹理
    const gradient = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W*0.8);
    gradient.addColorStop(0, 'rgba(255,255,255,0.3)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.05)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // 噪点纹理
    ctx.save();
    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const r = Math.random() * 1.5;
      ctx.fillStyle = `rgba(139, 119, 89, ${Math.random() * 0.08})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawPattern(ctx, W, H, pattern) {
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = '#1a1a1a';
    ctx.fillStyle = '#1a1a1a';

    switch(pattern) {
      case 'mountain':
        // 远山
        ctx.beginPath();
        ctx.moveTo(0, H * 0.75);
        for (let x = 0; x <= W; x += 20) {
          const y = H * 0.75 - Math.sin(x * 0.01) * 60 - Math.sin(x * 0.005) * 40;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(W, H);
        ctx.lineTo(0, H);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 0.05;
        ctx.beginPath();
        ctx.moveTo(0, H * 0.82);
        for (let x = 0; x <= W; x += 20) {
          const y = H * 0.82 - Math.sin(x * 0.015 + 1) * 40 - Math.sin(x * 0.008) * 30;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(W, H);
        ctx.lineTo(0, H);
        ctx.closePath();
        ctx.fill();
        break;

      case 'cloud':
        // 云纹
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
          const cx = (i % 4) * (W/4) + W/8;
          const cy = Math.floor(i / 4) * (H/3) + H/6;
          drawCloud(ctx, cx, cy, 80);
        }
        break;

      case 'bamboo':
        // 竹影
        ctx.lineWidth = 3;
        for (let i = 0; i < 5; i++) {
          const bx = W * 0.1 + i * (W * 0.2);
          ctx.beginPath();
          ctx.moveTo(bx, 0);
          ctx.lineTo(bx + Math.sin(i) * 20, H);
          ctx.stroke();
          // 竹节
          for (let j = 0; j < 8; j++) {
            const by = j * (H/8) + 50;
            ctx.beginPath();
            ctx.ellipse(bx + Math.sin(i) * 20 * (by/H), by, 12, 4, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
          // 竹叶
          for (let j = 0; j < 4; j++) {
            const by = j * (H/4) + 100;
            const leafX = bx + Math.sin(i) * 20 * (by/H);
            ctx.beginPath();
            ctx.ellipse(leafX + 30, by, 35, 8, 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(leafX - 30, by + 20, 35, 8, -0.3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        break;

      case 'seal':
        // 印章纹
        for (let i = 0; i < 6; i++) {
          const sx = (i % 3) * (W/3) + W/6;
          const sy = Math.floor(i / 3) * (H/3) + H/4;
          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate((Math.random() - 0.5) * 0.3);
          ctx.globalAlpha = 0.06;
          ctx.fillStyle = '#b43232';
          ctx.fillRect(-50, -50, 100, 100);
          ctx.restore();
        }
        break;

      case 'ink':
        // 墨迹
        for (let i = 0; i < 5; i++) {
          const ix = Math.random() * W;
          const iy = Math.random() * H;
          const ir = 50 + Math.random() * 100;
          const grad = ctx.createRadialGradient(ix, iy, 0, ix, iy, ir);
          grad.addColorStop(0, 'rgba(26,26,26,0.15)');
          grad.addColorStop(0.5, 'rgba(26,26,26,0.05)');
          grad.addColorStop(1, 'rgba(26,26,26,0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(ix, iy, ir, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      default: // paper
        // 极简宣纸，不加额外纹样
        break;
    }
    ctx.restore();
  }

  function drawCloud(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r * 0.5, 0, Math.PI * 2);
    ctx.arc(x + r * 0.4, y - r * 0.1, r * 0.4, 0, Math.PI * 2);
    ctx.arc(x + r * 0.7, y, r * 0.35, 0, Math.PI * 2);
    ctx.arc(x - r * 0.4, y, r * 0.35, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawBorder(ctx, W, H) {
    ctx.save();
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 3;
    ctx.strokeRect(50, 50, W - 100, H - 100);
    ctx.lineWidth = 1;
    ctx.strokeRect(65, 65, W - 130, H - 130);
    ctx.restore();
  }

  function drawTitle(ctx, W, H) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#1a1a1a';

    // 主标题
    ctx.font = 'bold 56px "STKaiti", "KaiTi", "楷体", serif';
    ctx.fillText('字 造 集', W/2, 160);

    // 英文副标题
    ctx.font = '18px "Georgia", serif';
    ctx.fillStyle = '#6a6a6a';
    ctx.fillText('CHARACTER FORGE', W/2, 200);

    // 分隔线
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W/2 - 60, 230);
    ctx.lineTo(W/2 + 60, 230);
    ctx.stroke();

    ctx.restore();
  }

  function drawMainChar(ctx, W, H, data) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const charY = H * 0.38;
    const charSize = 380;

    // 注意：此函数已废弃，generate()中直接使用glyphImage绘制
    // 这里仅保留纯文字兜底，不再处理glyphImage（异步drawImage会导致绘制失败）
    if (data.components && data.components.length > 0) {
      drawCombinedChar(ctx, W/2, charY, charSize, data);
    } else {
      ctx.font = `${charSize}px "STKaiti", "KaiTi", "楷体", serif`;
      ctx.fillStyle = '#1a1a1a';
      ctx.fillText(data.charName || '字', W/2, charY);
    }

    ctx.restore();
  }

  function drawCombinedChar(ctx, cx, cy, size, data) {
    // 根据结构绘制组合字
    const structure = data.structure || 'left_right';
    const structureType = data.structureType || 'lr_standard';
    const comps = data.components || [];

    ctx.save();
    ctx.translate(cx, cy);

    if (comps.length === 1) {
      // 单构件
      drawComponentAt(ctx, comps[0], 0, 0, size, size, 'normal');
    } else if (comps.length >= 2) {
      if (structure === 'left_right') {
        // 左右结构
        const ratio = getStructureRatio(structureType);
        const leftW = size * ratio.left;
        const rightW = size * ratio.right;
        const gap = size * 0.03;
        const totalW = leftW + rightW + gap;
        const startX = -totalW / 2;

        drawComponentAt(ctx, comps[0], startX + leftW/2, 0, leftW * 0.9, size * 0.9, 'left');
        drawComponentAt(ctx, comps[1], startX + leftW + gap + rightW/2, 0, rightW * 0.9, size * 0.9, 'normal');
      } else if (structure === 'top_bottom') {
        // 上下结构
        const ratio = getStructureRatio(structureType);
        const topH = size * ratio.top;
        const bottomH = size * ratio.bottom;
        const gap = size * 0.03;
        const totalH = topH + bottomH + gap;
        const startY = -totalH / 2;

        drawComponentAt(ctx, comps[0], 0, startY + topH/2, size * 0.85, topH * 0.85, 'top');
        drawComponentAt(ctx, comps[1], 0, startY + topH + gap + bottomH/2, size * 0.85, bottomH * 0.85, 'normal');
      } else if (structure === 'enclosing') {
        // 包围结构
        drawComponentAt(ctx, comps[0], 0, 0, size * 0.95, size * 0.95, 'enclosing');
        drawComponentAt(ctx, comps[1], 0, size * 0.05, size * 0.55, size * 0.55, 'inside');
      } else {
        // 默认左右
        drawComponentAt(ctx, comps[0], -size*0.25, 0, size*0.45, size*0.9, 'left');
        drawComponentAt(ctx, comps[1], size*0.25, 0, size*0.45, size*0.9, 'normal');
      }
    }

    ctx.restore();
  }

  function getStructureRatio(type) {
    const ratios = {
      'lr_standard': { left: 0.5, right: 0.5 },
      'lr_narrow_wide': { left: 0.38, right: 0.62 },
      'lr_wide_narrow': { left: 0.62, right: 0.38 },
      'tb_balanced': { top: 0.5, bottom: 0.5 },
      'tb_narrow_wide': { top: 0.38, bottom: 0.62 },
      'tb_wide_narrow': { top: 0.62, bottom: 0.38 }
    };
    return ratios[type] || { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5 };
  }

  function drawComponentAt(ctx, comp, x, y, w, h, variant) {
    // 用文字绘制构件（SVG在canvas中绘制较复杂，用字体替代）
    ctx.save();
    ctx.translate(x, y);
    ctx.font = `${Math.min(w, h)}px "STKaiti", "KaiTi", "楷体", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1a1a1a';
    ctx.fillText(comp.name || comp.id || '?', 0, 0);
    ctx.restore();
  }

  function drawComponentInfo(ctx, W, H, data) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#3a3a3a';

    const y = H * 0.56;
    const comps = data.components || [];
    const compNames = comps.map(c => c.name).join(' + ');

    ctx.font = '24px "STKaiti", "KaiTi", "楷体", serif';
    ctx.fillText('我的构件：' + compNames, W/2, y);

    // 结构信息
    if (data.structureName) {
      ctx.font = '18px "STKaiti", "KaiTi", "楷体", serif';
      ctx.fillStyle = '#6a6a6a';
      ctx.fillText('构形：' + data.structureName, W/2, y + 35);
    }

    ctx.restore();
  }

  function drawInterpretation(ctx, W, H, data) {
    ctx.save();
    ctx.textAlign = 'center';

    const y = H * 0.64;
    const maxWidth = W * 0.7;

    // 标签
    ctx.font = '20px "STKaiti", "KaiTi", "楷体", serif';
    ctx.fillStyle = '#6a6a6a';
    ctx.fillText('—— 我的释义 ——', W/2, y);

    // 释义内容
    ctx.font = '28px "STKaiti", "KaiTi", "楷体", serif';
    ctx.fillStyle = '#1a1a1a';

    const meaning = data.meaning || data.userMeaning || '心有所向，月有所照。';
    const lines = wrapText(ctx, meaning, maxWidth);
    lines.forEach((line, i) => {
      ctx.fillText(line, W/2, y + 50 + i * 42);
    });

    ctx.restore();
  }

  function drawPersonality(ctx, W, H, data) {
    ctx.save();
    ctx.textAlign = 'center';

    const y = H * 0.78;

    // 人格标签
    if (data.personality) {
      ctx.font = 'bold 26px "STKaiti", "KaiTi", "楷体", serif';
      ctx.fillStyle = '#b43232';
      ctx.fillText('【' + data.personality.name + '】', W/2, y);

      ctx.font = '18px "STKaiti", "KaiTi", "楷体", serif';
      ctx.fillStyle = '#6a6a6a';
      ctx.fillText(data.personality.description || '', W/2, y + 32);
    }

    ctx.restore();
  }

  async function drawSeal(ctx, W, H) {
    ctx.save();
    const sx = W - 160;
    const sy = H - 320;
    const size = 100;

    ctx.translate(sx, sy);
    ctx.rotate(-0.08);

    try {
      const sealImg = await loadImage(window.ZZJ_EMBEDDED_IMAGES?.seal || 'assets/images/seal-zizaoji.png');
      ctx.globalAlpha = 0.92;
      ctx.drawImage(sealImg, -size/2, -size/2, size, size);
    } catch(e) {
      console.error('印章图片加载失败:', e);
      // 印章加载失败时不绘制红色方块兜底，保持干净
    }

    ctx.restore();
  }

  function drawSignature(ctx, W, H, data) {
    ctx.save();
    ctx.textAlign = 'center';

    const y = H * 0.88;
    const userName = data.userName || '字造师';
    const year = data.year || '2026';
    const index = data.charIndex || '第一个';

    ctx.font = '22px "STKaiti", "KaiTi", "楷体", serif';
    ctx.fillStyle = '#3a3a3a';
    ctx.fillText(`${year} · ${userName}的${index}汉字`, W/2, y);

    ctx.font = '14px "Georgia", serif';
    ctx.fillStyle = '#8a8a8a';
    ctx.fillText(`Created by ${userName}`, W/2, y + 28);

    ctx.restore();
  }

  function drawDisclaimer(ctx, W, H) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '14px "STKaiti", "KaiTi", "楷体", serif';
    ctx.fillStyle = '#9a9a9a';
    ctx.fillText('本字为用户创意生成作品，并非历史汉字', W/2, H - 90);
    ctx.restore();
  }

  function wrapText(ctx, text, maxWidth) {
    const lines = [];
    let currentLine = '';
    for (let char of text) {
      const testLine = currentLine + char;
      if (ctx.measureText(testLine).width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines.slice(0, 3); // 最多3行
  }

  /**
   * 保存海报为图片
   */
  function showMobilePosterSaver(blob, name, dataUrl) {
    // 手机端（尤其微信/QQ/部分内置浏览器）会拦截 <a download>。
    // 改为在当前页面打开一个可长按保存的海报预览层，并提供系统分享/保存按钮。
    const old = document.getElementById('zizaoji-poster-saver');
    if (old) old.remove();

    const url = URL.createObjectURL(blob);
    const overlay = document.createElement('div');
    overlay.id = 'zizaoji-poster-saver';
    overlay.style.cssText = [
      'position:fixed','inset:0','z-index:99999','background:rgba(20,20,20,.88)',
      'display:flex','flex-direction:column','align-items:center','justify-content:center',
      'padding:18px','box-sizing:border-box'
    ].join(';');

    const title = document.createElement('div');
    title.textContent = '海报已生成';
    title.style.cssText = 'color:#fff;font-size:20px;margin-bottom:8px;font-family:serif;';

    const tip = document.createElement('div');
    tip.textContent = '长按下方海报图片即可保存到手机';
    tip.style.cssText = 'color:rgba(255,255,255,.82);font-size:14px;margin-bottom:14px;text-align:center;';

    const img = document.createElement('img');
    // data URL 比 blob URL 更适合微信、QQ、部分国产浏览器的长按保存。
    // blob 仍保留给系统分享使用。
    img.src = dataUrl || url;
    img.alt = name;
    img.style.cssText = 'display:block;max-width:min(92vw,520px);max-height:68vh;width:auto;height:auto;object-fit:contain;border-radius:4px;box-shadow:0 8px 30px rgba(0,0,0,.35);-webkit-user-select:none;user-select:none;';
    img.setAttribute('draggable', 'false');

    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;gap:10px;margin-top:14px;flex-wrap:wrap;justify-content:center;';

    const shareBtn = document.createElement('button');
    shareBtn.textContent = '系统分享 / 保存';
    shareBtn.style.cssText = 'border:0;border-radius:24px;padding:11px 20px;background:#c73737;color:#fff;font-size:15px;';
    shareBtn.addEventListener('click', async () => {
      try {
        const file = new File([blob], name, { type:'image/png' });
        if (navigator.share && (!navigator.canShare || navigator.canShare({files:[file]}))) {
          await navigator.share({ files:[file], title:'字造集海报' });
          return;
        }
        alert('当前浏览器不支持系统保存，请长按海报图片保存。');
      } catch (e) {
        if (!e || e.name !== 'AbortError') {
          console.warn('系统分享失败，请长按图片保存:', e);
          alert('当前浏览器无法直接保存，请长按海报图片保存。');
        }
      }
    });

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '返回页面';
    closeBtn.style.cssText = 'border:1px solid rgba(255,255,255,.55);border-radius:24px;padding:10px 18px;background:transparent;color:#fff;font-size:15px;';
    closeBtn.addEventListener('click', () => {
      overlay.remove();
      URL.revokeObjectURL(url);
    });

    actions.appendChild(shareBtn);
    actions.appendChild(closeBtn);
    overlay.appendChild(title);
    overlay.appendChild(tip);
    overlay.appendChild(img);
    overlay.appendChild(actions);
    document.body.appendChild(overlay);
    return true;
  }

  /**
   * 保存海报为图片
   * 电脑：文件选择器/浏览器下载
   * 手机：不再触发容易被内置浏览器拦截的自动下载，改为可长按保存的预览层 + 系统分享
   */
  async function saveAsImage(canvas, fileName) {
    const name = fileName || '字造集_海报.png';
    try {
      // 永远从当前背景 + 最近一次海报数据重新生成离屏海报，避免屏幕 Canvas 状态与导出状态不同步。
      const exportCanvas = document.createElement('canvas');
      const exportData = lastGenerateData || {};
      const exportBgId = currentBgId || lastGenerateBgId || 'xuanzhi';
      await generate(exportData, exportBgId, exportCanvas);

      // 统一从安全加载的离屏 Canvas 导出 PNG。
      const blob = await exportCanvasBlob(exportCanvas);
      if (!blob || !blob.size) throw new Error('PNG 图片为空');
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error || new Error('PNG 读取失败'));
        reader.readAsDataURL(blob);
      });

      const isMobile = /Android|iPhone|iPad|iPod|HarmonyOS/i.test(navigator.userAgent);
      if (isMobile) {
        showMobilePosterSaver(blob, name, dataUrl);
        return 'mobile';
      }

      if (window.showSaveFilePicker) {
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName: name,
            types: [{ description:'PNG 图片', accept:{'image/png':['.png']} }]
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          return true;
        } catch (e) {
          if (e && e.name === 'AbortError') return false;
          console.warn('文件选择保存不可用，改用浏览器下载:', e);
        }
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 15000);
      return true;
    } catch (e) {
      console.error('海报保存失败:', e);
      alert('海报保存失败：' + (e.message || e));
      return false;
    }
  }

  function dataURLToBlob(dataUrl) {
    const parts = dataUrl.split(',');
    const mime = (parts[0].match(/:(.*?);/) || [,'image/png'])[1];
    const binary = atob(parts[1]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }

  function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
      if (!canvas) return reject(new Error('海报画布不存在'));
      try {
        canvas.toBlob(blob => {
          if (blob && blob.size) resolve(blob);
          else reject(new Error('Canvas 未生成有效 PNG'));
        }, 'image/png', 1);
      } catch (e) {
        reject(e);
      }
    });
  }

  async function exportCanvasBlob(canvas) {
    // 优先 toBlob；部分老旧手机浏览器 toBlob 实现不稳定，再回退到 toDataURL。
    try {
      return await canvasToBlob(canvas);
    } catch (blobError) {
      console.warn('Canvas.toBlob 失败，尝试 toDataURL:', blobError);
      try {
        const dataUrl = canvas.toDataURL('image/png');
        if (!dataUrl || dataUrl === 'data:,') throw new Error('PNG 数据为空');
        return dataURLToBlob(dataUrl);
      } catch (dataError) {
        const message = String(dataError?.message || dataError || '');
        if (/tainted|origin-clean|not be exported/i.test(message)) {
          throw new Error('海报中仍存在未安全加载的图片资源，请刷新页面后重新生成海报');
        }
        throw dataError;
      }
    }
  }

  /**
   * 获取背景列表
   */
  function getBackgrounds() {
    return Object.entries(backgrounds).map(([id, bg]) => ({
      id,
      name: bg.name,
      image: bg.image
    }));
  }

  return {
    generate,
    saveAsImage,
    getBackgrounds,
    setBackground
  };
})();
