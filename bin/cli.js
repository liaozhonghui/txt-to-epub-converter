#!/usr/bin/env node

const { program } = require('commander');
const path = require('path');
const fs = require('fs');
const { convertTxtToEpub } = require('../lib');

program
  .name('txt2epub')
  .description('将 TXT 小说文件转换为 EPUB 电子书格式')
  .version('1.0.0');

program
  .option('-f, --file <path>', '输入的 TXT 文件路径 (必需)')
  .option('-o, --output <path>', '输出的 EPUB 文件路径 (可选，默认基于输入文件名)')
  .option('-t, --title <title>', '书籍标题 (可选，默认基于文件名)')
  .option('-a, --author <author>', '作者名称 (可选，默认为"未知作者")')
  .option('-m, --maker <maker>', '制作者名称 (必需)')
  .option('-c, --cover <path>', '封面图片路径 (可选)')
  .option('-d, --description <desc>', '书籍描述 (可选)')
  .option('--ad-keywords <keywords>', '广告关键词，用逗号分隔 (可选，不传则不过滤广告)')
  .option('--verbose', '显示详细输出信息')
  .parse();

const options = program.opts();

// 验证必需的参数
if (!options.file) {
  console.error('❌ 错误: 必须指定输入文件路径 (-f, --file)');
  console.log('\n使用示例:');
  console.log('  txt2epub -f novel.txt -a "作者名" -t "书名" -m "制作者"');
  console.log('  txt2epub --file novel.txt --author "作者名" --title "书名" --maker "制作者" --cover cover.jpg');
  process.exit(1);
}

if (!options.maker) {
  console.error('❌ 错误: 必须指定制作者名称 (-m, --maker)');
  console.log('\n使用示例:');
  console.log('  txt2epub -f novel.txt -a "作者名" -t "书名" -m "制作者"');
  console.log('  txt2epub --file novel.txt --author "作者名" --title "书名" --maker "制作者"');
  process.exit(1);
}

// 检查输入文件是否存在
const inputFile = path.resolve(options.file);
if (!fs.existsSync(inputFile)) {
  console.error(`❌ 错误: 输入文件不存在: ${inputFile}`);
  process.exit(1);
}

// 获取文件基本信息
const fileInfo = path.parse(inputFile);
const defaultTitle = fileInfo.name.replace(/[-_]/g, ' ');

// 设置默认值
const convertOptions = {
  inputFile: inputFile,
  outputFile: options.output || path.join(fileInfo.dir, `${fileInfo.name}.epub`),
  title: options.title || defaultTitle,
  author: options.author || '未知作者',
  maker: options.maker,
  description: options.description
};

// 处理广告关键词参数
if (options.adKeywords) {
  convertOptions.adKeywords = options.adKeywords.split(',').map(keyword => keyword.trim()).filter(keyword => keyword.length > 0);
}

// 添加封面（如果指定）
if (options.cover) {
  const coverPath = path.resolve(options.cover);
  if (fs.existsSync(coverPath)) {
    convertOptions.cover = coverPath;
  } else {
    console.warn(`⚠️  警告: 封面文件不存在: ${coverPath}`);
  }
}

// 显示转换信息
console.log('🚀 准备开始转换...\n');
console.log('📖 转换配置:');
console.log(`   输入文件: ${convertOptions.inputFile}`);
console.log(`   输出文件: ${convertOptions.outputFile}`);
console.log(`   书籍标题: ${convertOptions.title}`);
console.log(`   作者: ${convertOptions.author}`);
console.log(`   制作者: ${convertOptions.maker}`);
if (convertOptions.cover) {
  console.log(`   封面图片: ${convertOptions.cover}`);
}
if (convertOptions.description) {
  console.log(`   书籍描述: ${convertOptions.description}`);
}
if (convertOptions.adKeywords && convertOptions.adKeywords.length > 0) {
  console.log(`   广告关键词: ${convertOptions.adKeywords.join(', ')}`);
  console.log(`   广告过滤: 启用`);
} else {
  console.log(`   广告过滤: 禁用`);
}
console.log('');

// 执行转换
async function main() {
  try {
    const result = await convertTxtToEpub(convertOptions);
    
    if (result.success) {
      console.log('🎉 转换完成！');
      console.log(`📂 输出文件: ${result.outputFile}`);
      
      // 显示文件大小
      if (fs.existsSync(result.outputFile)) {
        const stats = fs.statSync(result.outputFile);
        const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
        console.log(`📏 文件大小: ${fileSizeMB} MB`);
      }
      
      console.log('\n✨ 使用提示:');
      console.log('   - 可以在任何支持 EPUB 格式的电子书阅读器中打开');
      console.log('   - 推荐阅读器: Adobe Digital Editions, Calibre, Apple Books 等');
    }
    
  } catch (error) {
    console.error('\n❌ 转换失败:', error.message);
    
    if (options.verbose) {
      console.error('\n详细错误信息:');
      console.error(error.stack);
    }
    
    console.log('\n💡 解决建议:');
    console.log('   1. 检查输入文件是否为有效的 UTF-8 编码的 TXT 文件');
    console.log('   2. 确保文件包含章节标题（如：第一章、第二章等）');
    console.log('   3. 检查输出目录是否有写入权限');
    console.log('   4. 使用 --verbose 参数查看详细错误信息');
    
    process.exit(1);
  }
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('\n💥 程序发生未预期的错误:');
  console.error(error.message);
  if (options.verbose) {
    console.error(error.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n💥 Promise 被拒绝:');
  console.error(reason);
  process.exit(1);
});

// 运行主函数
main();