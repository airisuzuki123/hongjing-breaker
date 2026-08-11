# QA 报告：六关扩展版最终调整

## 范围与方法

- 依据：`GAME_SPEC.md`。
- 日期：2026-08-12。
- 对象：`index.html`、`style.css`、`game.js`、`assets/`。
- 方法：`node --check game.js`、`git diff --check`、最小 DOM/Canvas VM 烟测、Edge headless 截图和素材目视检查。
- 本轮覆盖 `game.js` 的砖阵几何、球体绘制与选关卡片文案，并复核第 3 至第 6 关素材裁切结果。

## 最终调整验证

| 项目 | 复现步骤 | 预期 | 实际 | 结果 |
|---|---|---|---|---|
| 砖阵水平居中 | 启动第 1 关，检查砖阵左右边距 | 砖阵在 960 宽逻辑画布中居中 | `totalWidth=760`，`left=(960-760)/2=100`，左右各余 100；`adjusted-level1.png` 目视确认 | 通过 |
| 球高光与拖尾 | 启动第 1 关并观察运动球；激活 MULTI_BALL 后绘制两球 | 高光和拖尾提升辨识度，不能改变碰撞或双球数量 | `drawBall()` 只读取球位置/速度并调用 Canvas 绘制；VM 激活后为 2 球，调用 `draw()` 后球对象不变；单球落底后仍留 1 球、生命维持 3 | 通过 |
| 选关卡片信息 | 进入选关，检查卡片副标题 | 卡片保留关名、难度、锁定状态和缩略图，不显示布局名称/“布局”文字 | `buildLevelCards()` 仅写入关名、难度与锁定状态；`adjusted-select.png` 未见布局名称或“布局”文字 | 通过 |
| level-03 至 level-06 素材 | 查看 4 张 `assets/level-0[3-6].jpg` 的四角与边缘 | 无角落 Logo、版权条或截图界面元素 | 已逐张目视检查，未见角落 Logo、版权条或截图 UI；页面使用这些本地 JPEG | 通过 |

## 核心扩展回归

- 六关选关：`expansion-level-select-thumbs.png` 显示 6 张卡片，首关可选、其余锁定；`localStorage` 路径在通关时解锁下一关。
- 六套布局：VM 砖块数依次为 48、46、44、24、28、26，对应基础矩形、左右对称、中心空洞、阶梯回廊、环形双层和混合多区。
- 特殊砖：每关均为 3 枚彩虹砖与 1-2 枚火力砖，且使用闪光/闪电符号；游戏源码中未发现“目标”文字。
- 四阶段马赛克：三枚彩虹砖推进 stage1-3；所有砖块清空时设置 stage4 并结算胜利。`expansion-level1-stage0.png` 与 `expansion-level1-stage4.png` 提供调试预览证据。
- MULTI_BALL：火力增益激活后复制为 2 球；任一球落底只移除该球；全部落底才扣 1 条生命并复位单球。VM 已复核该路径。
- 移动端：`expansion-mobile-final.png` 显示 2 列选关布局；CSS 在极窄屏切为单列，交互按钮最小 44px，Canvas 使用 `touch-action:none` 与 pointer capture。

## 静态验证

- `node --check game.js`：通过，退出码 0。
- `git diff --check`：通过，退出码 0，仅有换行符转换提示。
- VM：绘制后双球状态未被修改；单球掉落不扣生命，全部球掉落才扣生命。

## 截图证据

- [adjusted-level1.png](qa-artifacts/adjusted-level1.png)：居中的砖阵、球高光与拖尾、特殊砖和 4 块马赛克。
- [adjusted-select.png](qa-artifacts/adjusted-select.png)：带背景缩略图的六关卡片，无布局文字。
- [expansion-level-select-thumbs.png](qa-artifacts/expansion-level-select-thumbs.png)：桌面选关与锁定状态。
- [expansion-mobile-final.png](qa-artifacts/expansion-mobile-final.png)：移动端选关布局。
- [expansion-level3.png](qa-artifacts/expansion-level3.png)、[expansion-level6.png](qa-artifacts/expansion-level6.png)：第 3、6 关的布局与背景运行证据。

## 问题与限制

- P0：未发现。
- P1：未发现已复现的功能阻塞。
- P2：真实 iOS/Android 设备上的触控、长时间稳定性、音频策略和多 DPR 尚未验证。复现建议：在真实设备连续游玩并触发 MULTI_BALL，检查拖拽、双球、掉球和暂停。
- P2：当前没有独立的 MULTI_BALL 双球视觉截图；其逻辑已由 VM 验证，建议发布前补拍实机画面。

## 结论

最终三项调整未引入已复现回归：砖阵居中，球的视觉效果不改变双球逻辑，选关卡片不再显示布局文字，level-03 至 level-06 素材无角落 Logo、版权条或截图 UI。当前无已复现 P0/P1，剩余为 P2 真实设备与视觉补证限制。
