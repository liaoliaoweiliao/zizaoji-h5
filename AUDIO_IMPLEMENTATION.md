# 《字造集》配乐音效严格嵌入说明

本版本依据《《字造集》配乐音效设计总表.xlsx》逐项接入现有 H5 工程。

## 已接入
- P00 Loading：home-guqin；冷知识 select-chime；进入首页 brush-move。
- P01 首页/序章：home-guqin；问号 select-chime；开始造字/页面转场 brush-move。
- P02 六书实验室：collection；象形时间轴 brush-move/chime；会意拖拽 brush-move、接近 pitch-up chime、成功 create-success；指事拖拽 brush-move、成功 create-success。
- P03 能力值：collection，5 秒淡入；能力值首次出现 chime；进度条首尾 brush；完成 create-success。
- P04 造字工坊：collection；构件选择/拖拽/比例调整/组合反馈；日/月/山/水/火/木/土元素声音；接近其他构件时触发关系音效；布局完成 create-success。
- P05 造字解析：collection；六书构件逐步出现 brush；关键解释 chime。
- P06 意义页面：meaning-story；Classical / Modern / Minimal 分别按表调整 BGM 与提示音音高。
- P07 汉字卡片：create-success；poster-theme。
- P08 认证页：poster-theme；星级逐颗不同音高；“造字资格”核心成功音。
- P09 海报生成：poster-theme；生成时 brush；印章落下 seal；完成 create-success。
- P10 我的字集：home-guqin；收藏点击 chime；删除 wooden sound；返回转场 brush。

## 声音参数
表内 dB 建议值按 `10^(dB/20)` 转换为网页音量；短音效按表内目标时长自动截断，避免原始素材过长；循环 BGM 使用 loop。

## 浏览器自动播放
遵循浏览器 autoplay 限制：首次用户操作后解锁音频。解锁前触发的首屏提示音会排队补播；BGM 在首次用户操作后开始。

## 说明
原工程当前没有独立的“知识题正确/错误”交互节点，因此表中该节点无法凭空绑定到不存在的 DOM 事件；其余现有页面/交互节点均已按表接入。
