# 视觉与实现约定
参考：design-concept.png。用户指定暖白底、明黄色、圆角浅卡片、左侧栏＋双栏＋底部示例。
背景 #faf9f5，主色 #ffd84d，文字 #292c30，次级 #858790，边框 #eeece6；侧栏 200px，主区 26px padding，左栏约 380px，圆角 20px。
字体：系统中文 PingFang SC / Microsoft YaHei；英文与数字使用 ui-rounded。标题 34px，分区 19px，正文 13px。
控件图标：lucide 18px、1.7px 描边；黄色实心主按钮；浅色 secondary。
实现偏差：纠正生成概念图里不准确的品牌规格，采用 Perler Standard / Artkal S / Hama Midi；示例及主图纸用可编辑像素数据绘制；不虚构更多示例入口。
装饰插画：public/assets/bead-daisy.png，内置 ImageGen 生成。Prompt：transparent handmade fuse-bead daisy, creamy petals, golden center, sage stem, peach butterfly, soft warm daylight, no text。概念生成完整 prompt 见聊天记录。
