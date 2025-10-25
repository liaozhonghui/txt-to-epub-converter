# txt-to-epub-converter

[![npm version](https://badge.fury.io/js/txt-to-epub-converter.svg)](https://badge.fury.io/js/txt-to-epub-converter)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

一个功能强大的 TXT 小说文件转 EPUB 电子书转换器，支持自动章节识别、广告过滤和自定义样式。

## ✨ 特性

- 🚀 **智能章节识别** - 自动识别"第 X 章"格式的章节标题
- 🛡️ **广告过滤** - 自动过滤包含广告关键词的行
- 🎨 **优美排版** - 内置中文优化的 CSS 样式，支持自定义
- 📱 **标准兼容** - 生成标准 EPUB 3.0 格式，兼容各种阅读器
- 🔧 **CLI 工具** - 提供命令行工具，支持批量处理
- 📚 **API 支持** - 提供 JavaScript API，方便集成到其他项目
- 🌟 **封面支持** - 支持添加自定义封面图片
- 📖 **元数据完整** - 自动生成图书信息页和目录

## 📦 安装

### 全局安装（推荐）

```bash
npm install -g txt-to-epub-converter
```

### 本地安装

```bash
npm install txt-to-epub-converter
```

## 🚀 快速开始

### 命令行使用

```bash
# 完整参数示例
txt2epub -f input.txt -o output.epub -t "书籍标题" -a "作者名" -m "制作者名称" -c cover.jpg -d "书籍描述" --ad-keywords "广告词1,广告词2"

# 查看帮助
txt2epub --help
```

### API 使用

```javascript
const { convertTxtToEpub } = require("txt-to-epub-converter");

async function main() {
  try {
    const result = await convertTxtToEpub({
      inputFile: "your-novel.txt",
      outputFile: "output.epub",
      title: "书名",
      author: "作者名",
      maker: "制作者名称",
      cover: "cover.jpg",
      description: "书籍描述",
      adKeywords: ["广告词1", "广告词2"],
    });

    console.log("转换成功！", result);
  } catch (error) {
    console.error("转换失败：", error.message);
  }
}

main();
```

## 📖 命令行参数

| 参数            | 简写 | 必需 | 描述                           | 示例                            |
| --------------- | ---- | ---- | ------------------------------ | ------------------------------- |
| `--file`        | `-f` | ✅   | 输入的 TXT 文件路径            | `-f input.txt`                  |
| `--output`      | `-o` | ✅   | 输出的 EPUB 文件路径           | `-o output.epub`                |
| `--title`       | `-t` | ✅   | 书籍标题                       | `-t "书籍标题"`                 |
| `--author`      | `-a` | ✅   | 作者名称                       | `-a "作者名"`                   |
| `--maker`       | `-m` | ✅   | 制作者名称                     | `-m "制作者"`                   |
| `--cover`       | `-c` | ✅   | 封面图片路径                   | `-c cover.jpg`                  |
| `--description` | `-d` | ✅   | 书籍描述                       | `-d "书籍描述"`                 |
| `--ad-keywords` |      | ✅   | 广告关键词，用逗号分隔         | `--ad-keywords "广告词1,广告词2"` |

## 📚 API 文档

### convertTxtToEpub(options)

主要转换函数，将 TXT 文件转换为 EPUB 格式。

#### 参数

- `options` (Object) - 转换选项
  - `inputFile` (string) - 输入文件路径 **[必需]**
  - `outputFile` (string) - 输出文件路径 **[必需]**
  - `title` (string) - 书籍标题 **[必需]**
  - `author` (string) - 作者名称 **[必需]**
  - `maker` (string) - 制作者名称 **[必需]**
  - `cover` (string) - 封面图片路径 **[必需]**
  - `description` (string) - 书籍描述 **[必需]**
  - `adKeywords` (Array) - 广告关键词数组 **[必需]**

#### 返回值

Promise，解析为包含以下属性的对象：

- `success` (boolean) - 转换是否成功
- `outputFile` (string) - 输出文件路径
- `chapters` (number) - 章节数量
- `totalWords` (number) - 总字数
- `message` (string) - 结果消息

### TxtToEpubConverter 类

用于更高级的自定义转换。

```javascript
const { TxtToEpubConverter } = require("txt-to-epub-converter");

const converter = new TxtToEpubConverter({
  filterAds: true,
  adKeywords: ["KenShu.CC", "广告"],
  cssStyle: "/* 自定义 CSS */",
});

const result = await converter.convertTxtToEpub(options);
```

## 📝 文件格式要求

### TXT 文件格式

- **编码**: UTF-8 编码
- **章节标题**: 支持以下格式
  - `第一章 章节名称`
  - `第1章 章节名称`
  - `第十二章`
  - `第123章 标题`

### 支持的封面格式

- JPG/JPEG
- PNG
- GIF
- WebP

## 🛠️ 配置选项

### 广告过滤

默认不进行广告过滤。可以通过 `--ad-keywords` 参数指定要过滤的关键词：

```bash
# 过滤单个关键词
txt2epub -f input.txt -m "制作者" --ad-keywords "广告网站"

# 过滤多个关键词（用逗号分隔）
txt2epub -f input.txt -m "制作者" --ad-keywords "广告词1,广告词2,广告词3"
```

包含指定关键词的行将被自动过滤掉。

### 自定义样式

可以通过 `TxtToEpubConverter` 类的构造函数传入自定义 CSS：

```javascript
const converter = new TxtToEpubConverter({
  cssStyle: `
    body { 
      font-family: "楷体", serif; 
      line-height: 2; 
    }
    p { 
      text-indent: 2em; 
      margin: 1em 0; 
    }
  `,
});
```

## 🔧 开发

### 克隆项目

```bash
git clone https://github.com/yourusername/txt-to-epub-converter.git
cd txt-to-epub-converter
npm install
```

### 运行测试

```bash
npm test
```

### 查看示例

```bash
npm run example
```

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 📞 支持

如果您在使用过程中遇到问题，请：

1. 查看 [常见问题](#常见问题)
2. 搜索已有的 [Issues](https://github.com/yourusername/txt-to-epub-converter/issues)
3. 创建新的 Issue

## 📈 更新日志

### v1.0.0

- 🎉 首次发布
- ✨ 支持 TXT 转 EPUB
- ✨ 智能章节识别
- ✨ 广告过滤功能
- ✨ CLI 命令行工具
- ✨ 封面支持

## ❓ 常见问题

### Q: 转换后的 EPUB 文件章节不完整？

A: 请检查 TXT 文件的章节标题格式，确保使用"第 X 章"的格式。

### Q: 支持哪些 TXT 编码？

A: 目前只支持 UTF-8 编码，其他编码请先转换。

### Q: 可以批量转换多个文件吗？

A: 可以编写脚本调用 CLI 命令或使用 API 进行批量处理。

### Q: 生成的 EPUB 文件在某些阅读器上显示异常？

A: EPUB 文件符合标准格式，如有问题请检查阅读器兼容性或提交 Issue。

---

⭐ 如果这个项目对您有帮助，请给个 Star！
