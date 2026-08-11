# QA 报告：六关最终版本

## 范围与方法

- 依据：`GAME_SPEC.md`。
- 日期：2026-08-12。
- 对象：`index.html`、`style.css`、`game.js`、`assets/`。
- 方法：`node --check game.js`、`git diff --check`、最小 DOM/Canvas VM 烟测、Edge headless 截图目视检查及素材目视检查。
- 本轮覆盖 `game.js` 的关卡背景映射、后段砖量、球体绘制与砖块边框，并复核 `GAME_SPEC.md`、素材和 Edge 截图。

## 最终验证

| 用例 | 复现步骤 | 预期 | 实际 | 结果 |
|---|---|---|---|---|
| 背景顺序 | 进入选关并查看第 1-6 关卡片/启动各关 | 前两关依次使用 `level-03.jpg`、`level-05.jpg`；明显复杂遮挡背景在后段 | `LEVELS` 顺序为 level-03、level-05、level-04、scene-moonlit、scene-gala、level-06；`reorder-level1.png`/`reorder-level2.png` 显示前两关对应背景，后段使用更复杂场景 | 通过 |
| 关卡砖块数 | 启动 `?level=1..6&autoplay`，统计 `state.bricks.length` | 所有布局坐标有效；后 3 关相较上一版本有所增加 | 当前为 48、46、44、28、32、30；上一轮后 3 关为 24、28、26，当前每关增加 4 块；特殊砖坐标均命中实际砖格 | 通过（相对上一版） |
| 特殊砖坐标 | 各关检查 `rainbowBricks`/`powerupBricks` 与生成砖格 | 每关 3 彩虹砖、1-2 火力砖，坐标有效 | VM 逐关验证：彩虹均 3；火力为 1、2、1、1、2、1，所有坐标都映射到 `state.bricks` | 通过 |
| 球绘制与双球逻辑 | 启动后观察球；激活 MULTI_BALL 后调用绘制并令一球掉落 | 球有立体高光、暗部和拖尾；绘制不改变碰撞状态；单球掉落不扣生命 | `drawBall` 使用径向渐变、暗色外圈、三层拖尾和高光点；VM `draw()` 后 2 球状态不变，移除一球后仍有 1 球且生命不变 | 通过 |
| 砖块绘制层次 | 启动第 1 关观察普通/特殊砖 | 顶部亮边、底部暗边，特殊砖仍可由符号识别 | `drawBrick` 使用纵向 sheen（顶部亮、底部暗）、阴影和上下描边；`reorder-level1.png` 可见立体边缘与彩虹/闪电符号 | 通过 |
| 选关文字 | 进入选关查看 6 张卡片 | 不显示 layoutName/“布局”文字 | `card.innerHTML` 仅关名、难度和锁定状态；`reorder-select.png` 未见布局文字 | 通过 |
| 素材角落 | 查看 `assets/level-03.jpg` 至 `level-06.jpg` 四角及边缘 | 无角落 Logo、版权条或截图 UI | 四张 JPEG 目视未见角落 Logo、版权条或截图界面元素 | 通过 |
| 核心回归 | 开始、计分、失球、胜负、暂停、重开 | 既有核心循环不回归 | `node --check`、VM 状态路径及 Edge 截图均通过 | 通过 |

## 静态验证

- `node --check game.js`：通过，退出码 0。
- `git diff --check`：通过，退出码 0，仅有换行符转换提示。
- VM：6 关布局数、特殊砖有效性、双球绘制纯度与单球掉落生命处理通过。

## 截图证据

- [reorder-select.png](qa-artifacts/reorder-select.png)：前两关顺序、关卡缩略图和锁定状态。
- [reorder-level1.png](qa-artifacts/reorder-level1.png)：第 1 关 `level-03` 背景、居中砖阵、顶部/底部砖边缘和球高光拖尾。
- [reorder-level2.png](qa-artifacts/reorder-level2.png)：第 2 关 `level-05` 背景与不同砖阵。
- [reorder-level5.png](qa-artifacts/reorder-level5.png)：后段复杂场景、环形布局和特殊砖。
- [reorder-level6.png](qa-artifacts/reorder-level6.png)：第 6 关混合多区布局与后段背景。
- [adjusted-select.png](qa-artifacts/adjusted-select.png)：选关卡片无布局文字的补充证据。

## 问题与限制

- P0：未发现。
- P1：未发现已复现的功能阻塞。
- P2：当前后 3 关砖块绝对数（28/32/30）仍低于前 3 关（48/46/44），但相较上一版各增加 4 块。若验收语义是“相较上一版增加”，已满足；若要求后 3 关绝对多于前 3 关，则需重新定义布局数量。
- P2：真实 iOS/Android 触控、长时间稳定性、音频策略和多 DPR 尚未验证；Edge headless 截图不能完全替代实机试玩。

## 结论

最新版本已核实前两关背景顺序、后段复杂背景、六关砖阵及特殊砖坐标、球和砖块的立体绘制层次；无已复现 P0/P1。剩余为 P2 的关卡数量语义确认和真实设备验证限制。
