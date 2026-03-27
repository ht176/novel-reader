/**
 * 书源功能测试
 * 
 * 测试已导入的书源是否能正常工作
 */

import { CrawlerService } from '../src/services/crawler';
import type { BookSource } from '../src/db';

// 测试用的书源（从导入的文件中选取）
const testSources: BookSource[] = [
  {
    id: 1,
    name: '起点中文',
    bookSourceUrl: 'https://www.qidian.com',
    searchUrl: 'https://www.qidian.com/search?keyword={keyword}',
    bookSourceType: 0,
    enabled: true,
    ruleSearch: {
      bookList: '.book-list li',
      name: '.book-title',
      author: '.book-author',
      bookUrl: 'a'
    }
  },
  {
    id: 2,
    name: '69 书吧',
    bookSourceUrl: 'https://69shuba.cx',
    searchUrl: 'https://69shuba.cx/modules/article/search.php?q={keyword}',
    bookSourceType: 0,
    enabled: true
  }
];

async function testSearch(source: BookSource, keyword: string) {
  console.log(`\n🔍 测试书源：${source.name}`);
  console.log(`   关键词：${keyword}`);
  
  const crawler = new CrawlerService();
  
  try {
    const results = await crawler.search(source, keyword);
    console.log(`   ✅ 搜索成功，找到 ${results.length} 本书`);
    
    if (results.length > 0) {
      console.log(`   📖 第一本：${results[0].title} - ${results[0].author}`);
    }
    
    return true;
  } catch (error) {
    console.log(`   ❌ 搜索失败：${error instanceof Error ? error.message : '未知错误'}`);
    return false;
  }
}

async function main() {
  console.log('🧪 开始测试书源功能...\n');
  console.log('⚠️  注意：由于网络环境和 CORS 限制，部分书源可能无法访问\n');
  
  const testKeyword = '诡秘之主';
  let success = 0;
  let failed = 0;
  
  for (const source of testSources) {
    const result = await testSearch(source, testKeyword);
    if (result) {
      success++;
    } else {
      failed++;
    }
    
    // 延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 测试结果:');
  console.log(`   成功：${success}`);
  console.log(`   失败：${failed}`);
  console.log(`   总计：${testSources.length}`);
  
  if (success > 0) {
    console.log('\n✨ 部分书源工作正常！');
  } else {
    console.log('\n⚠️  所有书源测试失败，可能需要：');
    console.log('   1. 检查网络连接');
    console.log('   2. 配置 CORS 代理');
    console.log('   3. 更新书源规则');
  }
}

main().catch(console.error);
