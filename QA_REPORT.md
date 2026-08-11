# QA 报告

## 检查范围

- 依据：`GAME_SPEC.md`。
- 检查日期：2026-08-12。
- 检查对象：`index.html`、`style.css`、`game.js`、`assets/`。
- 方法：`node --check game.js`、`git diff --check`、最小 DOM/Canvas VM 烟测、Edge headless 截图、源码路径核对和截图目视检查。
- 本轮只更新本报告与 `qa-artifacts/` 截图，没有修改游戏源码。

## 验证结果

| 用例 | 复现步骤 | 预期 | 实际 | 结果 |
|---|---|---|---|---|
| 首屏/开始 | 打开页面，点击“开始游戏”或按 Enter | 菜单可见；开始后球自动运动，显示 3 条生命和 0 分 | `redesign-menu.png` 未生成，使用既有 `menu.png`；VM 开始路径进入 `PLAYING`，生命 3、分数 0 | 通过 |
| 核心循环/计分 | 开始后让球碰撞普通砖和彩虹砖 | 砖块只消失一次；普通砖 +50，彩虹砖 +150 | VM 碰撞路径和 `onBrickHit` 通过，`alive` 防止重复计分 | 通过 |
| 三枚彩虹砖 | 观察初始布局并依次击破 3 枚彩虹砖 | 每局正好 3 枚；阶段依次为 1/2/3 | 固定位置集合生成 3 枚；VM 依次命中后 `stage=3` | 通过 |
| stage0/1/2/3 马赛克 | 使用 `?autoplay=1&stage=0..3` 预览 | 每增加一阶段按顺序少一块真实像素马赛克 | `redesign-stage0-scene1-final.png` 显示 3 块；`redesign-stage1-scene1.png` 显示 2 块；`redesign-stage2-scene1.png` 显示 1 块；`redesign-stage3-scene1.png` 全部解除；HUD 分别显示封印完整、第一重解锁、第二重解锁、全部解锁 | 通过 |
| 背景切换 | 点击 HUD 背景按钮或按 B | 两个场景循环切换，分数、生命、阶段和遮罩阶段保持 | `redesign-stage3-scene1.png` 与 `redesign-stage3-scene2.png` 为不同场景；VM `cycleScene()` 从 0 切到 1 | 通过 |
| 失球/胜负 | 令球越过底边；重复至生命归零；清空全部砖块 | 每次扣 1 生命并复位；0 生命失败；清空砖块胜利，结束态停止更新 | VM 检查 `LIFE_LOST`、`GAME_OVER`、`WON` 与结束层、最终分数路径 | 通过 |
| 暂停 | 游戏中按 Space/P/Esc 或暂停按钮 | 球、挡板和计时冻结；恢复后继续 | `update()` 仅在 `PLAYING` 调用 `movePaddle`，暂停分支不推进游戏对象；焦点移至继续按钮 | 通过 |
| 重开 | 游戏中按 R，或在暂停/结束层点击重新开始 | 恢复初始砖块、3 生命、0 分、stage0 | VM `resetGame()` 后状态和布局恢复 | 通过 |
| 移动端输入 | 使用 375px 截图检查布局；触控按下并拖动挡板 | 无横向滚动；拖动持续控制挡板 | `redesign-mobile-375-final.png` 无横向滚动；源码设置 `touch-action: none`、`setPointerCapture`/`releasePointerCapture`，移动按钮为 44px | 通过（真实设备触控未验证） |
| 文字核对 | 搜索游戏源码并目视检查截图 | 彩虹砖不出现“目标”文字 | `rg` 在游戏文件中未发现该词；彩虹砖使用闪光符号，截图未见“目标” | 通过 |

## 静态与运行验证

- `node --check game.js`：通过，退出码 0。
- `git diff --check`：通过，退出码 0；仅有换行符转换提示。
- VM 烟测：通过菜单、开始、48 块布局、彩虹砖数量/阶段、场景切换、暂停冻结、触控坐标、失球和重开路径。
- Edge headless：成功生成 stage0/1/2/3、双场景和移动端截图；未在真实 iOS/Android 设备上执行触控试玩。

## 最终截图证据

- [menu.png](qa-artifacts/menu.png)：首屏开始层、HUD、操作提示。
- [redesign-stage0-scene1-final.png](qa-artifacts/redesign-stage0-scene1-final.png)：场景 1、3 枚彩虹砖、stage0 三块错开布局马赛克。
- [redesign-stage1-scene1.png](qa-artifacts/redesign-stage1-scene1.png)：场景 1、stage1 两块马赛克、HUD 第一重解锁。
- [redesign-stage2-scene1.png](qa-artifacts/redesign-stage2-scene1.png)：场景 1、stage2 一块马赛克、HUD 第二重解锁。
- [redesign-stage3-scene1.png](qa-artifacts/redesign-stage3-scene1.png)：场景 1、stage3 全部马赛克解除。
- [redesign-stage3-scene2.png](qa-artifacts/redesign-stage3-scene2.png)：场景 2、stage3 全部马赛克解除，证明背景切换。
- [redesign-mobile-375-final.png](qa-artifacts/redesign-mobile-375-final.png)：窄屏 HUD、44px 控件和最终游戏区布局。

## 限制

- Edge headless 已可用并已生成截图，但 headless 截图不能替代真实浏览器中的控制台巡检、长时间试玩和真实 iOS/Android 触控验证。
- 移动端截图显示 HUD 在 375px 下换成两行，当前未见横向滚动；仍建议在真实设备复测焦点、指针捕获、音效和不同 DPR。

## 结论

当前版本核心验收路径无已复现的 P0/P1 阻塞问题。开始、核心循环、计分、三枚彩虹砖阶段、stage0/1/2/3 马赛克、背景切换、失球/胜负、暂停、重开、移动端布局和“目标”文字约束均有代码或最终截图证据支持。
