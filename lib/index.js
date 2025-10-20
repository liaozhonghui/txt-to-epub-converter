const fs = require('fs');
const path = require('path');
const EPub = require('epub-gen');

/**
 * TXT 转 EPUB 转换器
 * @class TxtToEpubConverter
 */
class TxtToEpubConverter {
    constructor(options = {}) {
        this.options = {
            filterAds: options.adKeywords && options.adKeywords.length > 0,
            adKeywords: options.adKeywords || [],
            cssStyle: this.getDefaultCSS(),
            ...options
        };
    }

    /**
     * 获取默认 CSS 样式
     * @returns {string} CSS 样式字符串
     */
    getDefaultCSS() {
        return `
            body {
                font-family: "Microsoft YaHei", "宋体", "SimSun", serif;
                line-height: 1.8;
                text-align: justify;
                color: #333;
                margin: 0;
                padding: 20px;
            }
            p {
                margin: 1em 0;
                text-indent: 2em;
            }
            h1, h2, h3 {
                text-align: center;
                margin: 2em 0 1em 0;
                font-weight: bold;
            }
            h1 {
                font-size: 2em;
                color: #2c3e50;
            }
            h2 {
                font-size: 1.5em;
                color: #34495e;
            }
            table {
                width: 100%;
                margin: 1em 0;
            }
            td {
                vertical-align: top;
            }
        `;
    }

    /**
     * 读取并处理文本文件
     * @param {string} filePath 文件路径
     * @returns {string} 处理后的文本内容
     */
    processTextFile(filePath) {
        console.log('📖 读取文本文件:', filePath);
        
        if (!fs.existsSync(filePath)) {
            throw new Error(`文件不存在: ${filePath}`);
        }

        let content = fs.readFileSync(filePath, 'utf-8');
        
        // 移除 BOM 标记（如果存在）
        if (content.charCodeAt(0) === 0xFEFF) {
            content = content.substring(1);
            console.log('   ✓ 已移除 BOM 标记');
        }
        
        // 按行分割并过滤广告内容
        if (this.options.filterAds) {
            console.log('🔍 过滤广告内容');
            const lines = content.split('\n');
            const filteredLines = lines.filter(line => {
                return !this.options.adKeywords.some(keyword => line.includes(keyword));
            });
            
            const filteredCount = lines.length - filteredLines.length;
            console.log(`   ✓ 已过滤 ${filteredCount} 行广告内容`);
            
            content = filteredLines.join('\n');
        }
        
        return content;
    }

    /**
     * 中文数字转阿拉伯数字
     * @param {string} chinese 中文数字字符串
     * @returns {number|null} 转换后的数字
     */
    chineseNumeralToNumber(chinese) {
        if (!chinese || typeof chinese !== 'string') return null;
        
        const map = {零:0, 一:1, 二:2, 三:3, 四:4, 五:5, 六:6, 七:7, 八:8, 九:9, 两:2};
        const unitMap = {十:10, 百:100, 千:1000, 万:10000, 亿:100000000};

        // 如果已经是阿拉伯数字字符串，直接返回
        if (/^\d+$/.test(chinese)) return parseInt(chinese, 10);

        let result = 0;
        let section = 0;
        let number = 0;

        for (let i = 0; i < chinese.length; i++) {
            const ch = chinese[i];
            if (ch in map) {
                number = map[ch];
            } else if (ch in unitMap) {
                const unit = unitMap[ch];
                if (unit >= 10000) {
                    section = (section + number) * unit;
                    result += section;
                    section = 0;
                } else {
                    section += (number || 1) * unit;
                }
                number = 0;
            } else {
                number = 0;
            }
        }

        return result + section + (number || 0);
    }

    /**
     * 将文本分割成章节
     * @param {string} content 文本内容
     * @returns {Array} 章节数组
     */
    splitIntoChapters(content) {
        console.log('📑 分割和处理章节');
        const chapters = [];
        const lines = content.split('\n');
        
        let currentChapter = null;
        let currentContent = [];
        
        for (const line of lines) {
            // 匹配章节标题（如：第一章、第二章等）
            const chapterMatch = line.match(/^第([零一二三四五六七八九十百千万两亿\d]+)章(?:\s*(.*))?/);
            
            if (chapterMatch) {
                // 保存上一章节
                if (currentChapter) {
                    const chapterData = currentContent.join('\n').trim();
                    chapters.push({
                        title: currentChapter,
                        data: chapterData.length > 0 ? chapterData : '(本章暂无内容)'
                    });
                }
                
                // 解析并规范化章节序号
                const chineseNum = chapterMatch[1];
                const suffix = chapterMatch[2] ? chapterMatch[2].trim() : '';
                const arabic = this.chineseNumeralToNumber(chineseNum);
                if (arabic !== null && !isNaN(arabic)) {
                    currentChapter = `第${arabic}章${suffix ? ' ' + suffix : ''}`.trim();
                } else {
                    currentChapter = line.trim();
                }
                currentContent = [];
            } else {
                if (currentChapter) {
                    currentContent.push(line);
                }
            }
        }
        
        // 添加最后一章
        if (currentChapter) {
            const chapterData = currentContent.join('\n').trim();
            chapters.push({
                title: currentChapter,
                data: chapterData.length > 0 ? chapterData : '(本章暂无内容)'
            });
        }
        
        console.log(`   ✓ 识别到 ${chapters.length} 个章节`);
        
        // 去除重复章节
        const uniqueChapters = this.removeDuplicateChapters(chapters);
        
        return uniqueChapters;
    }

    /**
     * 提取文本前N个非特殊字符
     * @param {string} text 文本
     * @param {number} n 字符数量
     * @returns {string} 提取的字符
     */
    getFirstNChars(text, n = 5) {
        const cleaned = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
        return cleaned.substring(0, n);
    }

    /**
     * 去除重复章节
     * @param {Array} chapters 章节数组
     * @returns {Array} 去重后的章节数组
     */
    removeDuplicateChapters(chapters) {
        console.log('🔧 去除重复章节');
        
        const chapterMap = new Map();
        const chapterNumberPattern = /^第(\d+)章/;
        
        // 按章节号分组
        for (const chapter of chapters) {
            const match = chapter.title.match(chapterNumberPattern);
            if (match) {
                const num = parseInt(match[1], 10);
                if (!chapterMap.has(num)) {
                    chapterMap.set(num, []);
                }
                chapterMap.get(num).push(chapter);
            }
        }
        
        const uniqueChapters = [];
        let removedCount = 0;
        
        for (const [num, chapterList] of chapterMap.entries()) {
            if (chapterList.length === 1) {
                uniqueChapters.push(chapterList[0]);
            } else {
                const kept = [chapterList[0]];
                
                for (let i = 1; i < chapterList.length; i++) {
                    const current = chapterList[i];
                    const currentFirst5 = this.getFirstNChars(current.data);
                    
                    let isDuplicate = false;
                    for (const keptChapter of kept) {
                        const keptFirst5 = this.getFirstNChars(keptChapter.data);
                        if (currentFirst5 === keptFirst5 && currentFirst5.length > 0) {
                            isDuplicate = true;
                            removedCount++;
                            break;
                        }
                    }
                    
                    if (!isDuplicate) {
                        kept.push(current);
                    }
                }
                
                uniqueChapters.push(...kept);
            }
        }
        
        // 按章节号排序
        uniqueChapters.sort((a, b) => {
            const matchA = a.title.match(chapterNumberPattern);
            const matchB = b.title.match(chapterNumberPattern);
            if (matchA && matchB) {
                return parseInt(matchA[1], 10) - parseInt(matchB[1], 10);
            }
            return 0;
        });
        
        console.log(`   ✓ 去除 ${removedCount} 个重复章节`);
        console.log(`   ✓ 最终章节数: ${uniqueChapters.length}`);
        
        return uniqueChapters;
    }

    /**
     * 转换为 HTML 格式
     * @param {string} text 文本内容
     * @returns {string} HTML 格式内容
     */
    convertToHtml(text) {
        const paragraphs = text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => `<p>${line}</p>`)
            .join('\n');
        
        return paragraphs;
    }

    /**
     * 计算总字数
     * @param {Array} chapters 章节数组
     * @returns {number} 总字数
     */
    countTotalWords(chapters) {
        let totalWords = 0;
        for (const chapter of chapters) {
            const words = chapter.data.replace(/\s/g, '');
            totalWords += words.length;
        }
        return totalWords;
    }

    /**
     * 生成封面页 HTML
     * @param {string} title 书名
     * @param {string} author 作者
     * @returns {string} 封面页 HTML
     */
    generateCoverPage(title, author) {
        return `
            <div style="text-align: center; padding: 50px 20px; height: 100vh; display: flex; flex-direction: column; justify-content: center;">
                <h1 style="font-size: 3em; margin-bottom: 0.5em; color: #2c3e50;">${title}</h1>
                <p style="font-size: 1.5em; color: #7f8c8d; margin-top: 0;">${author} 著</p>
                <div style="margin-top: 3em; font-size: 1.2em; color: #95a5a6;">
                    <p>一部精彩小说</p>
                    <p>享受阅读时光</p>
                </div>
            </div>
        `;
    }

    /**
     * 生成版权信息页 HTML
     * @param {string} title 书名
     * @param {string} author 作者
     * @param {string} maker 制作者
     * @param {number} totalChapters 总章节数
     * @param {number} totalWords 总字数
     * @returns {string} 版权信息页 HTML
     */
    generateCopyrightPage(title, author, maker, totalChapters, totalWords) {
        const currentDate = new Date().toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        return `
            <div style="padding: 40px; line-height: 2; color: #2c3e50;">
                <h2 style="text-align: center; margin-bottom: 2em; color: #34495e;">图书信息</h2>
                
                <div style="max-width: 600px; margin: 0 auto;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="border-bottom: 1px solid #ecf0f1;">
                            <td style="padding: 15px 10px; font-weight: bold; width: 120px;">书名</td>
                            <td style="padding: 15px 10px;">${title}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #ecf0f1;">
                            <td style="padding: 15px 10px; font-weight: bold;">作者</td>
                            <td style="padding: 15px 10px;">${author}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #ecf0f1;">
                            <td style="padding: 15px 10px; font-weight: bold;">章节总数</td>
                            <td style="padding: 15px 10px;">${totalChapters} 章</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #ecf0f1;">
                            <td style="padding: 15px 10px; font-weight: bold;">总字数</td>
                            <td style="padding: 15px 10px;">${totalWords.toLocaleString()} 字</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #ecf0f1;">
                            <td style="padding: 15px 10px; font-weight: bold;">制作者</td>
                            <td style="padding: 15px 10px;">${maker}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #ecf0f1;">
                            <td style="padding: 15px 10px; font-weight: bold;">制作工具</td>
                            <td style="padding: 15px 10px;">txt-to-epub-converter</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #ecf0f1;">
                            <td style="padding: 15px 10px; font-weight: bold;">制作日期</td>
                            <td style="padding: 15px 10px;">${currentDate}</td>
                        </tr>
                        <tr>
                            <td style="padding: 15px 10px; font-weight: bold;">格式</td>
                            <td style="padding: 15px 10px;">EPUB 3.0</td>
                        </tr>
                    </table>
                    
                    <div style="margin-top: 3em; padding: 20px; background-color: #f8f9fa; border-left: 4px solid #3498db;">
                        <h3 style="margin-top: 0; color: #2980b9;">制作说明</h3>
                        <p style="text-indent: 2em; line-height: 1.8;">
                            本电子书使用 txt-to-epub-converter 工具制作，已自动过滤广告信息，
                            优化排版格式，力求为读者提供良好的阅读体验。
                        </p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 转换 TXT 文件为 EPUB
     * @param {Object} options 转换选项
     * @param {string} options.inputFile 输入文件路径
     * @param {string} options.outputFile 输出文件路径
     * @param {string} options.title 书名
     * @param {string} options.author 作者
     * @param {string} options.maker 制作者
     * @param {Array} [options.adKeywords] 广告关键词列表
     * @param {string} [options.cover] 封面图片路径
     * @param {string} [options.description] 书籍描述
     * @returns {Promise} 转换结果
     */
    async convertTxtToEpub(options) {
        const {
            inputFile,
            outputFile,
            title,
            author,
            maker,
            adKeywords,
            cover,
            description
        } = options;

        if (!inputFile || !outputFile || !title || !author || !maker) {
            throw new Error('缺少必要参数: inputFile, outputFile, title, author, maker');
        }

        try {
            console.log('╔═══════════════════════════════════════════════════════════════╗');
            console.log('║           TXT 转 EPUB 转换工具                               ║');
            console.log('╚═══════════════════════════════════════════════════════════════╝\n');
            
            // 如果传入了自定义广告关键词，更新配置
            if (adKeywords && adKeywords.length > 0) {
                this.options.adKeywords = adKeywords;
                this.options.filterAds = true;
            } else {
                this.options.filterAds = false;
            }
            
            // 处理文本文件
            const processedContent = this.processTextFile(inputFile);
            
            // 分割章节
            const chapters = this.splitIntoChapters(processedContent);
            
            if (chapters.length === 0) {
                throw new Error('未找到章节，请检查文件格式');
            }
            
            // 计算总字数
            const totalWords = this.countTotalWords(chapters);
            
            // 准备章节内容
            const epubChapters = [
                // 封面页
                {
                    title: '封面',
                    data: this.generateCoverPage(title, author),
                    excludeFromToc: true,
                    beforeToc: true
                },
                // 版权信息页
                {
                    title: '图书信息',
                    data: this.generateCopyrightPage(title, author, maker, chapters.length, totalWords)
                },
                // 正文章节
                ...chapters.map(chapter => ({
                    title: chapter.title,
                    data: this.convertToHtml(chapter.data)
                }))
            ];
            
            // 创建 EPUB 配置
            const epubOption = {
                title,
                author,
                publisher: 'txt-to-epub-converter',
                description: description || `共 ${chapters.length} 章，约 ${Math.round(totalWords / 10000)} 万字`,
                lang: 'zh',
                tocTitle: '目录',
                content: epubChapters,
                css: this.options.cssStyle
            };

            // 添加封面图片
            if (cover && fs.existsSync(cover)) {
                epubOption.cover = cover;
                console.log('📷 已添加封面图片:', cover);
            }
            
            console.log('📚 生成 EPUB 文件...');
            await new EPub(epubOption, outputFile).promise;
            
            console.log('\n╔═══════════════════════════════════════════════════════════════╗');
            console.log('║                  ✅ 转换成功完成！                            ║');
            console.log('╚═══════════════════════════════════════════════════════════════╝\n');
            console.log('📚 书籍信息:');
            console.log(`   书名: ${title}`);
            console.log(`   作者: ${author}`);
            console.log(`   章节: ${chapters.length} 章`);
            console.log(`   字数: ${totalWords.toLocaleString()} 字 (约 ${Math.round(totalWords / 10000)} 万字)`);
            console.log(`\n📁 输出文件: ${outputFile}`);
            
            if (fs.existsSync(outputFile)) {
                const fileSize = (fs.statSync(outputFile).size / 1024 / 1024).toFixed(2);
                console.log(`💾 文件大小: ${fileSize} MB\n`);
            }
            
            return {
                success: true,
                outputFile,
                chapters: chapters.length,
                totalWords,
                message: '转换成功完成'
            };
            
        } catch (error) {
            console.error('\n❌ 转换过程中出现错误：', error.message);
            throw error;
        }
    }
}

/**
 * 便捷转换函数
 * @param {Object} options 转换选项
 * @returns {Promise} 转换结果
 */
async function convertTxtToEpub(options) {
    const converter = new TxtToEpubConverter();
    return await converter.convertTxtToEpub(options);
}

module.exports = {
    TxtToEpubConverter,
    convertTxtToEpub
};