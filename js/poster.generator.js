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
      image: 'assets/images/Background_RicePaper.png'
    },
    shanshui: {
      name: '山水',
      image: 'assets/images/Background_Landscape.png'
    },
    yunwen: {
      name: '云纹',
      image: 'assets/images/Background_CloudPattern.png'
    },
    zhuying: {
      name: '竹影',
      image: 'assets/images/Background_BambooShadow.png'
    },
    yinzhang: {
      name: '印章',
      image: 'assets/images/Background_Seal.png'
    },
    moji: {
      name: '墨迹',
      image: 'assets/images/Background_InkWash.png'
    }
  };

  // 预加载图片缓存
  const imageCache = {};
  // 背景持久化：从localStorage读取，默认宣纸
  let currentBgId = localStorage.getItem('posterBg') || 'xuanzhi';
  // 请求ID，确保只有最新的generate请求能更新Canvas
  let generateReqId = 0;

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      if (imageCache[src]) {
        resolve(imageCache[src]);
        return;
      }
      // 用fetch+blob方式加载图片，确保Canvas不被污染且能正常加载
      fetch(src)
        .then(response => response.blob())
        .then(blob => {
          const objectUrl = URL.createObjectURL(blob);
          const img = new Image();
          img.onload = () => {
            imageCache[src] = img;
            URL.revokeObjectURL(objectUrl);
            resolve(img);
          };
          img.onerror = (e) => {
            URL.revokeObjectURL(objectUrl);
            console.error('图片加载失败:', src, e);
            reject(new Error('图片加载失败: ' + src));
          };
          img.src = objectUrl;
        })
        .catch(e => {
          console.error('fetch图片失败:', src, e);
          // fetch失败时回退到普通Image加载
          const img = new Image();
          img.onload = () => {
            imageCache[src] = img;
            resolve(img);
          };
          img.onerror = (err) => {
            console.error('图片加载失败:', src, err);
            reject(new Error('图片加载失败: ' + src));
          };
          img.src = src;
        });
    });
  }

  // 设置当前背景并持久化
  function setBackground(bgId) {
    if (backgrounds[bgId]) {
      currentBgId = bgId;
      localStorage.setItem('posterBg', bgId);
    }
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

    // 1. 绘制背景图
    try {
      const bgImg = await loadImage(bg.image);
      if (reqId !== generateReqId) return; // 已有新的请求，中止
      ctx.drawImage(bgImg, 0, 0, W, H);
    } catch(e) {
      if (reqId !== generateReqId) return;
      console.error('背景图加载失败，使用纯色兜底:', bg.image, e);
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
      console.error('未找到新造字的最终图像 glyphImage');
      ctx.fillStyle = '#999';
      ctx.font = '40px "Noto Serif SC", serif';
      ctx.textAlign = 'center';
      ctx.fillText('（新造字）', W/2, H * 0.38);
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
    if (window.AudioEngine) window.AudioEngine.playSfx('seal', -8, 800);
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
      const sealImg = await loadImage('assets/images/seal-zizaoji.png');
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
  async function saveAsImage(canvas, fileName) {
    const name = fileName || '字造集_海报.png';
    try {
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((result) => result ? resolve(result) : reject(new Error('Canvas生成图片失败')), 'image/png');
      });

      // 电脑端：优先使用原生文件保存窗口；不支持时再走标准下载。
      if (window.showSaveFilePicker && !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName: name,
            types: [{ description: 'PNG 图片', accept: { 'image/png': ['.png'] } }]
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          return true;
        } catch (e) {
          // 用户取消保存窗口时直接结束；其他兼容性问题继续走下载兜底。
          if (e && e.name === 'AbortError') return false;
          console.warn('原生文件保存不可用，改用浏览器下载:', e);
        }
      }

      const url = URL.createObjectURL(blob);
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

      // 手机端优先调用系统分享/“存储到文件”等能力，避免部分手机浏览器不执行 download 属性。
      if (isMobile && navigator.share && window.File) {
        try {
          const file = new File([blob], name, { type: 'image/png' });
          if (!navigator.canShare || navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: '字造集海报' });
            URL.revokeObjectURL(url);
            return true;
          }
        } catch (e) {
          if (e && e.name === 'AbortError') {
            URL.revokeObjectURL(url);
            return false;
          }
          console.warn('手机系统分享不可用，改用下载/新页兜底:', e);
        }
      }

      // 标准浏览器下载：电脑 Chrome/Edge/Firefox 及支持 download 的手机浏览器。
      const link = document.createElement('a');
      link.download = name;
      link.href = url;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();

      // 某些内置浏览器会忽略 download；给出同一图片的新页面作为最终兜底，用户可长按/右键保存。
      if (isMobile) {
        setTimeout(() => {
          try {
            const opened = window.open(url, '_blank');
            if (!opened) console.warn('浏览器阻止了新窗口兜底');
          } catch (e) {
            console.warn('图片新页兜底失败:', e);
          }
        }, 350);
      }
      setTimeout(() => URL.revokeObjectURL(url), isMobile ? 15000 : 1500);
      return true;
    } catch (e) {
      console.error('海报保存失败:', e);
      alert('海报保存失败：' + (e.message || e) + '\n请重试。');
      return false;
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
