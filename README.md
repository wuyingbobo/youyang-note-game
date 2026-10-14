# ♪ 悠扬五线谱识谱游戏

帮助孩子建立谱面位置、琴键位置和实际音高之间的对应关系。

## 游戏内容

- 认识音符、音程与和弦，配合鼓励和朗读卡片。
- 找琴键时播放对应音高，正确音符在谱面显示或高亮。
- 和弦练习第二步只需找齐三个指定白键，顺序不限。
- 和弦第一步答对后可重复点按听和弦，再通过按钮进入第二步。
- 标题旁可切换声音开关；小屏幕键盘支持左右滑动，超出屏幕时显示滑动提示。
- 保留蓝白视觉、朗读字体和字号；根据可见屏幕高度调整留白和练习排列。
- 音组按钮保留编号，在括号中补充乐理名称，例如“第4组（小字一组）· C4—B4”。题目、答案、谱面提示和朗读中的具体音名按传统乐理写法区分大小写与音组，例如 C、c、c¹、c²、c³；跨组音也使用实际音组标记。钢琴键盘标签保留 C2、C3、C4、C5、C6 这类大写字母加数字的写法，方便直观定位，两种标记对应同一个实际音高。现代和弦记号保留 C、Dm、C/E 等大写字母写法。
- 练习区按浏览器当前可见高度分配空间；空间不足时收紧导航与留白，将继续按钮保留在朗读卡右侧，朗读字体和字号保持不变。手机和弦第二步使用独立的排列规则：朗读卡在练习区上方，竖屏乐谱在完整宽度的键盘上方，听和弦与音程说明独占一行；较宽或较矮的屏幕将乐谱放在键盘左侧。
- 小屏手机的三个模块统一把乐谱放在答案或键盘上方；朗读卡用满练习区宽度并减少留白，键盘高度为76像素。“提示”显示为短按钮，完整功能名称保留在无障碍标签中。朗读字体和字号保留。
- 紧凑布局中，学习记录入口位于顶部；和弦音程说明展开为浮层，避免把练习页面向下撑长。
- 页面在题目变化、答题反馈、窗口缩放及手机地址栏高度变化后，重新测量内容并选择合适布局。页面不会用裁切内容来伪装成一屏。

## 运行与发布

游戏是完整的静态页面，不需要安装依赖或启动后端。打开 `index.html` 即可运行。

GitHub Pages 发布目录：`main` 分支的根目录。`.nojekyll` 用于直接发布静态文件。

## 验证

使用 Node.js 运行：

```sh
node tests/audit-fixes.cjs
node tests/viewport-fit.cjs
node tests/panels.cjs
node tests/audio-levels.cjs
node tests/chord-layout-states.cjs /tmp/chord-layout-states.json
node tests/phone-layout-states.cjs /tmp/phone-layout-states.json
```

测试覆盖题目判定、任意顺序找琴键、音高映射、传统音名大小写与组别、跨组题目与朗读格式、现代和弦记号、音频恢复与取消、重复点击、声音开关，以及手机滚动和键盘溢出提示的状态逻辑。

这些测试使用 DOM 模拟。视口测试向适配逻辑提供尺寸和元素矩形，检查超出屏幕、遮挡、布局选择以及窗口/地址栏变化后的重新测量；它不等同于实际浏览器排版测试。真实手机的排版、触摸滑动和可听音效仍未完成真机验证。

另有静态 CSS 规则检查，使用真实答题逻辑生成的界面状态核对选择器优先级、键盘所在行、横向滚动声明、朗读字体及修改范围。它不计算浏览器最终像素位置。先安装测试依赖，再使用修改前的 HTML 作为比较基线：

```sh
python -m pip install -r tests/css-test-requirements.txt
git show 0c0037f3b2356481e98f356d067a8ff16d7d1fdf:index.html > /tmp/chord-before.html
python tests/mobile-chord-css.py /tmp/chord-layout-states.json /tmp/chord-before.html
git show c15be252878fa100e2bc2d4877aaad700489849e:index.html > /tmp/practice-before.html
python tests/phone-practice-css.py /tmp/phone-layout-states.json /tmp/practice-before.html
```

学习进度保存在当前页面内，刷新后会重新开始。
