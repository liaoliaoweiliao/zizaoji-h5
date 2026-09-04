# MEMORY.md - 字造集

## 项目概览
- 名称：《字造集》—— 基于汉字构形美学与六书逻辑的汉字文化互动共创 H5。
- 关键文件：`F:\新建文件夹 (3)\zizaoji4_final_xuanxuan_audio_button\zizaoji4_final_xuanxuan_audio_button\zizao.html`（单文件 H5 开场页 / 入口）。**它与 `index.html` 同目录（兄弟文件）**，因此滚动遮罩跳转的 `NEXT_PAGE` 为相对路径 `'index.html'`（不是深层路径）。`index.html` 即「下一个页面」——造字主程序（六书实验室/工坊/释义/海报等），由开场页点字卡「开始造字」经滚动遮罩跳转进入。
- `index.html` 入口已改为**直接进「六书实验室」(page-lab)**：已删除 page-story(首页) 与 page-intro(开场页) 区块，main.js 的 init() 改 `navigateTo('lab')`，兜底与 name 提交也指向 lab，并从 initFns 移除 initStory/initIntro。
- 素材：本应同目录 8 张水墨情绪图（anxin/benshang/fennu/gudu/kongju/qidai/xiyue/zhenfen.png）与 kaichangbeijingtu.jpg；**当前工作区内这些图片均缺失**，画廊卡片与开场背景走 `img-missing` 汉字标签兜底（功能正常，仅无照片）。如需照片需把图放回 zizao.html 同目录。
- 开场 6 步叙事页(narrative)右上角已加声音按钮 `#narvSound`，用 `assets/icons/sound-icon.svg`，控制 `assets/audio/bgm/home-guqin.mp3`（默认静音，点按开启，离开叙事时暂停）。

## 技术约定
- 不依赖 React Bits Pro 等付费组件时，优先使用原生 HTML/CSS/JS 实现等效动效，便于直接预览与移动部署。
- H5 交互模式：沉浸式东方 3D 无限画廊（8 图×9 份=72 卡片漂浮节点，非网格/非瀑布流，四层 Z-depth 错落分布，大量负空间）。
  - 拖拽/滑动：虚拟摄像机 X/Y 双向无限循环漫游；松手有惯性并缓慢减速（INERTIA_DECAY 0.93）。
  - 鼠标移动：细微 camera parallax（按深度加权，近景偏移更多）。
  - 双指捏合：整体缩放（viewScale 0.45–3.2）+ 双指平移。
  - Hover（桌面）：轻微放大、提亮、浮现汉字标签。
  - 点击：该卡片沿 Z 轴向用户靠近并平滑移到屏幕中心放大成为焦点大图，周围卡片保留为景深背景（轻虚化/压暗），文字以 Scroll Mask 揭示；关闭飞回。
  - 开场：黑屏逐句浮现「看见境→感受意→游字→触字→入字」后淡出进入画廊。
  - 有机感：每张卡片带正弦 bob 与轻微旋转抖动；空闲时镜头极缓自动漂移。
