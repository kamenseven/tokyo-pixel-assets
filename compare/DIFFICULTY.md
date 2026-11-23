# 难度排序（形态学难度，非单纯尺寸）

定义（`tokyo/difficulty.py`）：对全部资产计算
- `sr` 表面体素/总体素 —— 镂空/桁架/细构件越高（实心盒子低）
- `cv` 逐层面积变异系数 —— 收分/异形/上大下小越高
- `size` 体素数、`h` 层数
- 排除高度 < 60px 的扁平小件（草坪/绿篱等）
- score = 0.30·z(sr) + 0.20·z(cv) + 0.30·z(log体素) + 0.20·z(log层数)

| # | 资产 | score | sr | cv | 层数 | 体素 |
|---|---|---|---|---|---|---|
| 1 | landmarks/10_diet_building 国会 | +1.02 | 0.14 | 1.66 | 789 | 11.5M |
| 2 | japan/29_akashi_bridge 明石大桥 | +1.01 | 0.34 | 2.62 | 303 | 0.70M |
| 3 | japan/30_atomic_dome 原爆穹顶 | +0.94 | 0.37 | 2.19 | 302 | 0.86M |
| 4 | landmarks/02_skytree 晴空塔 | +0.86 | 0.16 | 1.96 | 953 | 1.02M |
| 5 | landmarks/01_tokyo_tower 东京塔 | +0.72 | 0.14 | 1.85 | 670 | 1.39M |
| 6 | japan/12_horyuji 法隆寺 | +0.72 | 0.21 | 1.89 | 307 | 2.91M |
| 7 | landmarks/09_tokyo_station 东京站 | +0.64 | 0.11 | 1.27 | 381 | 19.2M |
| 8 | more/19_airport 机场 | +0.55 | 0.03 | 1.02 | 499 | 30.0M |
| 9 | japan/13_itsukushima 严岛神社 | +0.54 | 0.26 | 1.88 | 195 | 1.38M |
| 10 | landmarks/11_big_sight 国际展示场 | +0.53 | 0.07 | 0.96 | 381 | 30.9M |
| 11 | landmarks/12_rainbow_bridge 彩虹桥 | +0.52 | 0.28 | 1.98 | 194 | 0.79M |
| 12 | more/12_museum 美术馆 | +0.50 | 0.34 | 1.30 | 181 | 2.00M |
| 13 | 19_gas-station 加油站 | +0.43 | 0.40 | 1.99 | 112 | 0.30M |
| 14 | japan/28_kanazawa_tsuzumi 金泽鼓门 | +0.43 | 0.29 | 1.79 | 165 | 0.89M |
| 15 | japan/20_tsutenkaku 通天阁 | +0.43 | 0.48 | 1.88 | 164 | 0.06M |
| 16 | more/07_budokan 武道馆 | +0.38 | 0.02 | 0.82 | 369 | 35.2M |
| 17 | 18_tower-mansion 塔楼公寓 | +0.36 | 0.03 | 0.39 | 650 | 19.8M |
| 18 | more/18_parking 立体车库 | +0.35 | 0.21 | 1.05 | 207 | 5.00M |
| 19 | extra/27_ferris_wheel 摩天轮 | +0.33 | 0.55 | 1.03 | 192 | 0.07M |
| 20 | japan/02_osaka 大阪城 | +0.30 | 0.05 | 0.74 | 456 | 10.5M |

## 对比图
- `tokyo/compare/old_top20.png` —— 旧方法（自由 Python kit）top20
- `tokyo/compare/compare_top20.png` —— 旧 vs 新（recipe + asset_tool）逐项并排

## 结论（20/20 已用新方法重做）

全部 20 个用 **recipe JSON + asset_tool（含新合并的 ops_extra）** 重做，脚本 `tokyo/recipes/new_*.json`，产物 `tokyo/compare/new/<name>/`（含 viewer.html/slices.png/render.png/old_32.png）。**全部 thin_warns = []**。

| 判定 | 资产 | 说明 |
|---|---|---|
| **新方法明显更好** | 摩天轮、明石大桥、彩虹桥、晴空塔、机场、立体车库 | 摩天轮旧版是 29px 薄片→新版有轮缘/辐条/吊舱/A架；两座桥旧版悬索是直线→新版真悬链+吊杆；晴空塔更细密；机场出现曲面屋顶壳；车库有开敞层+车 |
| **基本持平（可互换）** | 东京塔、国会、原爆穹顶、东京站、Big Sight、美术馆、加油站、金泽鼓门、通天阁、塔楼公寓、法隆寺、严岛神社、大阪城 | 新方法复现了形制；差异多在细节密度（旧版手调更"有机"，新版更规整） |
| **新方法略弱（缺 op）** | 武道馆 | 八面体是 box2 阶梯近似，没有真正的多边形 op；钟形顶缺 cone/多面壳 op |

## 需要补的 op（下一轮）
1. `prism(n, ...)` 正多边形棱柱/锥（八面体、六角塔）——修武道馆/六角堂。
2. `cone(c, r, h)` / `faceted_hood` 锥形/多面钟形顶。
3. `torus(...)` 圆环体（摩天轮轮缘、拱环）。
4. `cable(p0, p1, sag, r)` 悬链线（悬索桥主缆）。
5. `truss(...)` 真桁架（镂空塔，替代"实心锥+xbrace 贴花"）。
6. `polygon_ring` / 任意截面放样（异形平面）。

## 单位坑（已修）
- recipe 顶层 `decals` 坐标默认**像素**；加 `"units":"m"` 才按米（其他 op / windows 一直是米）。已在 asset_tool 与文档修正。
- `direct` 管线渲染相机看 **+y** 面（与 kit 的 front=+y 一致），摆件方向别搞反。
- carve 会把顶棚下的空地（如加油站前庭）当视觉外壳填实 → 稀疏/镂空资产用 `direct`。
