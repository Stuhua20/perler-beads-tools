# 色盘数据与来源

每品牌选择 32 个常用普通实色，构成本工具基础色盘；不表示某款官方套装，也不是品牌完整目录。

## 数据来源

- 项目：https://github.com/maxcleme/beadcolors
- 版本：`f97ff4283d03cef5cd7e1071a86f5892e0c0c61b`（2026-10-24 读取 HEAD）。
- 许可：MIT，见 THIRD_PARTY_LICENSES.txt。每条颜色保留原数据 contributor。
- RGB 为社区近似屏幕参考，尚未进行实体色卡测色，不能称为官方 RGB。
- Perler 使用完整商品编号；Artkal 使用 S 系列编号；Hama 去掉社区数据前缀 H，显示品牌数字色号。图纸另使用 A01 等短编号，对照清单购买或分拣。

- perler: https://github.com/maxcleme/beadcolors/blob/f97ff4283d03cef5cd7e1071a86f5892e0c0c61b/raw/perler.csv
  原始文件 SHA256：`757aae3e0553ed3a74db691cf930ea3e27eed47d038c5cc74bcef71acf3d24d0`
- hama: https://github.com/maxcleme/beadcolors/blob/f97ff4283d03cef5cd7e1071a86f5892e0c0c61b/raw/hama.csv
  原始文件 SHA256：`878ba9aa8bfb9da57b99dd4f524d757b8e165bd9d14fdb0e59831a5cbbb9c5de`
- artkal: https://github.com/maxcleme/beadcolors/blob/f97ff4283d03cef5cd7e1071a86f5892e0c0c61b/raw/artkal_s.csv
  原始文件 SHA256：`490d0994e7657e24f3efaab6af47b5beefe0f50ef188f29f0ef132f9534ab4a1`

## 品牌参考

- Perler 官方单色商品目录：https://perler.com/collections/shop-by-color
- Artkal S-5mm 官方色表与 RGB 下载入口：https://www.artkalfusebeads.com/pages/s-color-chart
- Hama：https://www.hama.dk/ （此前官方 PDF 链接在读取时返回 404，不能将社区 RGB 标注为官方核验）。

已完成代码有效性、唯一性、普通实色筛选和来源追溯。未完成逐色实体测量及每个 SKU 的实时库存核验。色卡参考弹窗与导出文件均保留近似颜色提示。

后续校准应维持 code 不变，更新 RGB、来源和版本，并使用肤色、灰阶、相邻近似色样张回归。
