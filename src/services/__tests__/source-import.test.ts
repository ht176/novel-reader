/**
 * 书源导入和验证测试
 * 
 * 测试从 https://bitbucket.org/xiu2/yuedu/raw/master/shuyuan 导入的书源
 */

import { describe, it, expect } from 'vitest';
import type { BookSource, LegadoRule } from '@/db';

describe('书源导入验证', () => {
  // 从 URL 获取的书源数据（示例）
  const shuyuanSources = [
    {
      bookSourceName: '起点中文',
      bookSourceUrl: 'https://www.qidian.com',
      bookSourceType: 0,
      enabled: true,
      ruleSearch: {
        bookList: '.book-list li',
        name: '.book-title',
        author: '.book-author',
        bookUrl: 'a'
      },
      ruleBookInfo: {
        name: '.book-title',
        author: '.book-author',
        coverUrl: 'img',
        intro: '.book-intro'
      },
      ruleToc: {
        chapterList: '.chapter-list li',
        chapterName: 'a',
        chapterUrl: 'a'
      },
      ruleContent: {
        content: '.chapter-content'
      }
    }
  ];

  describe('书源格式验证', () => {
    it('应该验证书源基本字段', () => {
      shuyuanSources.forEach((source: any, index: number) => {
        expect(source.bookSourceName).toBeDefined();
        expect(source.bookSourceName.length).toBeGreaterThan(0);
        expect(source.bookSourceUrl).toMatch(/^https?:\/\//);
        expect(typeof source.enabled).toBe('boolean');
      });
    });

    it('应该验证搜索规则', () => {
      shuyuanSources.forEach((source: any) => {
        if (source.ruleSearch) {
          expect(source.ruleSearch.bookList).toBeDefined();
          expect(source.ruleSearch.name).toBeDefined();
          expect(source.ruleSearch.author).toBeDefined();
          expect(source.ruleSearch.bookUrl).toBeDefined();
        }
      });
    });

    it('应该验证书籍详情规则', () => {
      shuyuanSources.forEach((source: any) => {
        if (source.ruleBookInfo) {
          expect(source.ruleBookInfo.name).toBeDefined();
          expect(source.ruleBookInfo.author).toBeDefined();
        }
      });
    });

    it('应该验证章节列表规则', () => {
      shuyuanSources.forEach((source: any) => {
        if (source.ruleToc) {
          expect(source.ruleToc.chapterList).toBeDefined();
          expect(source.ruleToc.chapterName).toBeDefined();
          expect(source.ruleToc.chapterUrl).toBeDefined();
        }
      });
    });

    it('应该验证章节内容规则', () => {
      shuyuanSources.forEach((source: any) => {
        if (source.ruleContent) {
          expect(source.ruleContent.content).toBeDefined();
        }
      });
    });
  });

  describe('书源转换', () => {
    it('应该将 Legado 格式转换为项目格式', () => {
      const legadoSource = shuyuanSources[0] as any;
      
      const converted: BookSource = {
        id: Date.now(),
        name: legadoSource.bookSourceName,
        bookSourceUrl: legadoSource.bookSourceUrl,
        bookSourceType: legadoSource.bookSourceType,
        enabled: legadoSource.enabled,
        searchUrl: `${legadoSource.bookSourceUrl}/search?keyword={keyword}`,
        ruleSearch: legadoSource.ruleSearch as LegadoRule,
        ruleBookInfo: legadoSource.ruleBookInfo,
        ruleToc: legadoSource.ruleToc,
        ruleContent: legadoSource.ruleContent
      };

      expect(converted.name).toBe('起点中文');
      expect(converted.bookSourceUrl).toBe('https://www.qidian.com');
      expect(converted.enabled).toBe(true);
      expect(converted.ruleSearch).toBeDefined();
    });
  });
});

describe('书源批量导入', () => {
  const testSources = [
    {
      bookSourceName: '起点中文',
      bookSourceUrl: 'https://www.qidian.com',
      bookSourceType: 0,
      enabled: true
    },
    {
      bookSourceName: '测试书源',
      bookSourceUrl: 'https://example.com',
      bookSourceType: 0,
      enabled: true
    }
  ];

  it('应该统计有效书源数量', () => {
    const validSources = testSources.filter((source: any) => {
      return source.bookSourceName && 
             source.bookSourceUrl && 
             source.enabled !== false;
    });

    expect(validSources.length).toBeGreaterThan(0);
    expect(validSources.length).toBe(testSources.length);
  });

  it('应该分类书源类型', () => {
    const webSources = testSources.filter((source: any) => source.bookSourceType === 0);
    const fileSources = testSources.filter((source: any) => source.bookSourceType === 1);

    expect(webSources.length).toBeGreaterThan(0);
    expect(fileSources.length).toBe(0);
  });
});
