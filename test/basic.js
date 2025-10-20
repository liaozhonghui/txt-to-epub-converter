const { convertTxtToEpub, TxtToEpubConverter } = require('../lib');

/**
 * 基本功能测试
 */
async function basicTest() {
  console.log('🧪 运行基本功能测试...\n');
  
  try {
    // 测试模块导入
    console.log('✅ 模块导入成功');
    
    // 测试转换器实例创建
    const converter = new TxtToEpubConverter();
    console.log('✅ 转换器实例创建成功');
    
    // 测试中文数字转换
    const testNum = converter.chineseNumeralToNumber('十二');
    if (testNum === 12) {
      console.log('✅ 中文数字转换功能正常');
    } else {
      throw new Error('中文数字转换失败');
    }
    
    console.log('\n🎉 所有基本测试通过！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  basicTest();
}

module.exports = { basicTest };