/**
 * 书源导入工具
 * 
 * 从 https://bitbucket.org/xiu2/yuedu/raw/master/shuyuan 导入书源
 * 
 * 使用方法：
 * ```bash
 * npm run import-sources
 * ```
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface LegadoSource {
  bookSourceName: string;
  bookSourceUrl: string;
  bookSourceType?: number;
  enabled?: boolean;
  ruleSearch?: any;
  ruleBookInfo?: any;
  ruleToc?: any;
  ruleContent?: any;
  selectors?: any;
  [key: string]: any;
}

interface BookSource {
  id: number;
  name: string;
  bookSourceUrl: string;
  searchUrl?: string;
  bookSourceType?: number;
  enabled: boolean;
  ruleSearch?: any;
  ruleBookInfo?: any;
  ruleToc?: any;
  ruleContent?: any;
  selectors?: any;
}

/**
 * 从 URL 获取书源数据
 */
async function fetchSources(url: string): Promise<LegadoSource[]> {
  console.log(`📥 正在获取书源：${url}`);
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const sources = await response.json();
    console.log(`✅ 成功获取 ${sources.length} 个书源`);
    return sources;
  } catch (error) {
    console.error('❌ 获取书源失败:', error);
    throw error;
  }
}

/**
 * 将 Legado 格式转换为项目格式
 */
function convertSource(source: LegadoSource, index: number): BookSource {
  return {
    id: Date.now() + index,
    name: source.bookSourceName || `书源${index + 1}`,
    bookSourceUrl: source.bookSourceUrl,
    searchUrl: source.searchUrl || `${source.bookSourceUrl}/search?keyword={keyword}`,
    bookSourceType: source.bookSourceType || 0,
    enabled: source.enabled !== false,
    ruleSearch: source.ruleSearch,
    ruleBookInfo: source.ruleBookInfo,
    ruleToc: source.ruleToc,
    ruleContent: source.ruleContent,
    selectors: source.selectors
  };
}

/**
 * 验证书源
 */
function validateSource(source: BookSource): boolean {
  if (!source.name || !source.bookSourceUrl) {
    return false;
  }
  
  if (!source.bookSourceUrl.match(/^https?:\/\//)) {
    return false;
  }
  
  // 至少需要有 ruleSearch 或 selectors 之一
  if (!source.ruleSearch && !source.selectors) {
    console.warn(`⚠️  书源 "${source.name}" 缺少搜索规则`);
  }
  
  return true;
}

/**
 * 保存书源到文件
 */
function saveSources(sources: BookSource[], outputPath: string) {
  const json = JSON.stringify(sources, null, 2);
  fs.writeFileSync(outputPath, json, 'utf-8');
  console.log(`💾 已保存书源到：${outputPath}`);
}

/**
 * 主函数
 */
async function main() {
  const sourceUrl = 'https://bitbucket.org/xiu2/yuedu/raw/master/shuyuan';
  const outputPath = path.join(__dirname, '../../imported-sources.json');
  
  console.log('🚀 开始导入书源...\n');
  
  try {
    // 1. 获取书源
    const legadoSources = await fetchSources(sourceUrl);
    
    // 2. 转换格式
    const convertedSources = legadoSources.map((source, index) => {
      const converted = convertSource(source, index);
      const valid = validateSource(converted);
      
      if (valid) {
        console.log(`✅ ${index + 1}. ${converted.name} - ${converted.bookSourceUrl}`);
      } else {
        console.log(`❌ ${index + 1}. ${converted.name} - 验证失败`);
      }
      
      return converted;
    });
    
    // 3. 过滤有效书源
    const validSources = convertedSources.filter(validateSource);
    
    console.log(`\n📊 统计:`);
    console.log(`   总书源数：${legadoSources.length}`);
    console.log(`   有效书源：${validSources.length}`);
    console.log(`   无效书源：${legadoSources.length - validSources.length}`);
    
    // 4. 保存
    if (validSources.length > 0) {
      saveSources(validSources, outputPath);
      
      console.log('\n✨ 书源导入完成！');
      console.log(`📁 输出文件：${outputPath}`);
      console.log('\n💡 提示：可以在书源管理页面导入此文件');
    } else {
      console.log('\n⚠️  没有有效的书源');
    }
    
  } catch (error) {
    console.error('\n❌ 导入失败:', error);
    process.exit(1);
  }
}

// 运行
main();
