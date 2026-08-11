# QA 报告：六关扩展版

## 范围与方法

- 依据：`GAME_SPEC.md`。
- 日期：2026-08-12。
- 对象：`index.html`、`style.css`、`game.js`、`assets/`。
- 检查：`node --check game.js`、`git diff --check`、最小 DOM/Canvas VM 烟测、Edge headless 截图目视检查和源码路径核对。
- 本轮只更新本报告，未修改游戏源码。

## 验证结果

| 用例 | 复现步骤 | 预期 | 实际 | 结果 |
|---|---|---|---|---|
| 标题与选关 | 打开页面，点击“进入选关”或按 Enter | 进入 LEVEL_SELECT，显示 6 个关卡按钮；首关可选，其余显示锁定 | `expansion-menu.png` 显示入口；`expansion-level-select-thumbs.png` 显示 6 张卡片，仅第 1 关“可挑战”，第 2-6 关“未解锁” | 通过 |
| 解锁持久化 | 通关第 N 关，刷新后重新进入选关 | `localStorage` 保留下一关解锁；已解锁关可重玩 | `showEnd(true)` 调用 `setUnlockedLevel(level+1)`，选关读取 `slime-unlocked-level`；按钮 disabled/aria-label 同步表达锁定 | 通过（VM/源码路径） |
| 六套布局 | 依次启动 `?level=1..6&autoplay` | 6 关砖阵不同，仍使用 960×540 逻辑坐标 | VM 统计砖块数为 48、46、44、24、28、26；对应 `rectangle/symmetry/center-hole/stairs/ring/mixed` 六种布局；level3/6 截图可见不同阵型 | 通过 |
| 每关特殊砖 | 观察各关初始布局 | 每关正好 3 枚彩虹砖、1-2 枚火力砖，均有符号 | VM 逐关统计：1关 3+1、2关 3+2、3关 3+1、4关 3+1、5关 3+2、6关 3+1；截图中彩虹砖为 ✦、火力砖为闪电符号 | 通过 |
| stage0-4 | 使用 `?level=1&autoplay&stage=0` 和 `stage=4`，再按正常流程清空 | stage0 显示 4/4 未解除；前三枚彩虹砖依次进入 1/2/3；清空所有砖后 stage4/4、胜利 | `expansion-level1-stage0.png` 显示 0/4 和 4 块马赛克；`expansion-level1-stage4.png` 显示 4/4；`onBrickHit` 仅在所有砖块 `alive=false` 时设 `stage=4` | 通过（stage4 截图为调试参数预览） |
| MULTI_BALL | 击破火力砖→挡板接住下落闪电→令一球越过底边→再令另一球越过底边 | 接住后变为 2 球；单球掉落不扣生命；两球均掉落才扣 1 生命并恢复单球；每关只生效一次 | VM：激活后 `balls.length=2`、`multiBall=true`；移除一球时生命仍为 3；移除第二球后生命为 2、进入 `LIFE_LOST`、恢复单球 | 通过 |
| 核心循环/计分 | 让球碰撞普通、火力和彩虹砖 | 分别 +50/+100/+150，单块只计分一次 | `onBrickHit` 设置 `alive=false` 后按砖类型计分；VM 碰撞路径通过 | 通过 |
| 失球/胜负/重开 | 令球落底，重复至生命归零；按 R 或结束层“重玩本关” | 单球或双球按规则扣生命；0 生命失败；清空全部砖胜利；重开恢复 3 生命/0 分/0 阶段/单球 | VM 检查 `LIFE_LOST`、`GAME_OVER`、`WON`、`resetGame()` 路径；结束层显示最终分数并解锁下一关 | 通过 |
| 暂停与返回选关 | 游戏中按 Space/P/Esc 或“关卡”按钮 | 暂停冻结球、挡板、增益物和计时；B/关卡按钮进入选关；Esc 从选关返回标题 | `update()` 只在 PLAYING 推进，选关状态为 LEVEL_SELECT；键盘分支覆盖 Space/P/Esc/B | 通过（源码/VM） |
| level-03 背景 | 打开 `?level=3&autoplay` | 使用 `assets/level-03.jpg` | `expansion-level3.png` 显示 level-03 场景及对应 4 块马赛克 | 通过 |
| 移动端选关/操作 | 375px 查看选关并检查触控路径 | 选关 2 列；极窄屏 1 列；按钮至少 44px；画布无横向滚动并支持 pointer capture | `expansion-mobile-final.png` 显示 2 列六关卡且未溢出；CSS 设置 44px 控件、360px 以下单列；Canvas 设置 `touch-action:none` 与 pointer capture | 通过（真实设备触控未验证） |

## 静态验证

- `node --check game.js`：通过，退出码 0。
- `git diff --check`：通过，退出码 0（仅换行符转换提示）。
- 资源核对：6 个背景文件均存在，包括 `assets/level-03.jpg` 至 `level-06.jpg`。
- 游戏源码中未发现“目标”文字；特殊砖使用闪光/闪电符号。

## 截图证据

- [expansion-menu.png](qa-artifacts/expansion-menu.png)：标题层与 HUD。
- [expansion-level-select-thumbs.png](qa-artifacts/expansion-level-select-thumbs.png)：桌面六关选关与锁定状态、缩略图。
- [expansion-level1-stage0.png](qa-artifacts/expansion-level1-stage0.png)：第 1 关 stage0、3 彩虹砖和 1 火力砖。
- [expansion-level1-stage4.png](qa-artifacts/expansion-level1-stage4.png)：第 1 关 stage4/4 调试预览。
- [expansion-level3.png](qa-artifacts/expansion-level3.png)：第 3 关新 `level-03` 背景与中心空洞布局。
- [expansion-level6.png](qa-artifacts/expansion-level6.png)：第 6 关混合多区布局。
- [expansion-mobile-final.png](qa-artifacts/expansion-mobile-final.png)：375px 选关层，2 列且无溢出。

## 问题、严重程度与限制

- P0：未发现。
- P1：未发现已复现的功能阻塞。
- P2：未生成独立的 MULTI_BALL 截图；复现步骤为第 1 关击破橙色火力砖、接住下落闪电后观察 HUD/双球。该路径已由 VM 验证，发布前建议补拍实机证据。
- P2：Edge headless 已生成扩展版截图，但未在真实 iOS/Android 设备执行触控、长时间稳定性、音频策略和多 DPR 验证；移动端截图不能完全替代真实设备试玩。
- `stage=4` 截图通过 URL 调试参数直接预览，正常玩法仍要求清空全部砖块后才进入 stage4。

## 结论

六关、选关解锁、六种布局、每关 3 彩虹砖与 1-2 火力砖、stage0-4、level-03 背景、MULTI_BALL 双球生命处理、胜负重开和移动端选关均有源码、VM 或 `expansion-*` 截图证据。当前无已复现 P0/P1 阻塞；剩余为 P2 真实设备/截图补证限制。
