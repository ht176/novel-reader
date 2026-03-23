/**
 * 书源爬虫服务（支持两种格式）
 * 
 * 功能：
 * 1. 根据书源配置搜索书籍
 * 2. 获取书籍详情
 * 3. 获取章节列表
 * 4. 获取章节内容
 * 
 * 支持格式：
 * - 本项目格式：selectors 配置
 * - 阅读 APP（Legado）格式：ruleSearch, ruleBookInfo 等
 * 
 * 注意：由于浏览器 CORS 限制，可能需要后端代理或使用浏览器插件
 */

import * as cheerio from 'cheerio';
import type { BookSource, SourceSelectors, Book, Chapter, LegadoRule, LegadoBookRule } from '@/db';

/**
 * 搜索结果接口
 */
export interface SearchResult {
  title: string;
  author: string;
  coverUrl?: string;
  url: string;
  sourceId: number;
  sourceName: string;
  description?: string;
}

/**
 * 爬虫服务类
 * 
 * 使用示例：
 * ```typescript
 * const crawler = new CrawlerService();
 * 
 * // 搜索书籍
 * const results = await crawler.search(source, '诡秘之主');
 * 
 * // 获取章节列表
 * const chapters = await crawler.getChapters(source, bookUrl);
 * 
 * // 获取章节内容
 * const content = await crawler.getContent(source, chapterUrl);
 * ```
 */
export class CrawlerService {
  /**
   * 默认请求头
   * 模拟浏览器请求，避免被反爬
   */
  private defaultHeaders: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Referer': ''
  };

  /**
   * 根据书源搜索书籍
   * 
   * @param source - 书源配置
   * @param keyword - 搜索关键词
   * @returns 搜索结果列表
   * @throws {Error} 当书源不可用或解析失败时抛出错误
   * 
   * 逻辑说明：
   * 1. 替换搜索 URL 中的关键词占位符
   * 2. 发送 HTTP 请求获取 HTML
   * 3. 使用 cheerio 解析 HTML
   * 4. 根据选择器提取书籍信息（支持两种格式）
   */
  async search(source: BookSource, keyword: string): Promise<SearchResult[]> {
    try {
      // 替换 URL 中的关键词
      const searchUrl = source.searchUrl.replace('{keyword}', encodeURIComponent(keyword));
      
      // 发送请求
      const html = await this.fetchHtml(searchUrl, source.baseUrl || source.bookSourceUrl);
      
      // 解析 HTML
      const $ = cheerio.load(html);
      
      // 提取搜索结果（支持两种格式）
      const results: SearchResult[] = [];
      const baseUrl = source.baseUrl || source.bookSourceUrl || '';
      
      if (source.ruleSearch) {
        // 阅读 APP（Legado）格式
        results.push(...this.parseLegadoSearchResults($, source, baseUrl));
      } else if (source.selectors) {
        // 本项目格式
        results.push(...this.parseStandardSearchResults($, source, baseUrl));
      } else {
        throw new Error('书源缺少选择器配置');
      }
      
      console.log(`[Crawler] 搜索 "${keyword}" 获得 ${results.length} 条结果`);
      return results;
      
    } catch (error) {
      console.error(`[Crawler] 搜索失败:`, error);
      throw new Error(`书源 "${source.name}" 搜索失败：${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 解析标准格式的搜索结果
   */
  private parseStandardSearchResults($: cheerio.CheerioAPI, source: BookSource, baseUrl: string): SearchResult[] {
    const results: SearchResult[] = [];
    const selectors = source.selectors!;
    
    $(selectors.searchResults).each((_, element) => {
      const title = $(element).find(selectors.bookTitle).text().trim();
      const author = $(element).find(selectors.bookAuthor).text().trim();
      
      // 跳过无效结果
      if (!title || !author) return;
      
      const coverUrl = $(element).find(selectors.bookCover).attr('src');
      const url = this.resolveUrl($(element).find(selectors.bookUrl).attr('href'), baseUrl);
      
      results.push({
        title,
        author,
        coverUrl: coverUrl ? this.resolveUrl(coverUrl, baseUrl) : undefined,
        url,
        sourceId: source.id!,
        sourceName: source.name,
        description: $(element).find('.description').text().trim() || undefined
      });
    });
    
    return results;
  }

  /**
   * 解析阅读 APP（Legado）格式的搜索结果
   */
  private parseLegadoSearchResults($: cheerio.CheerioAPI, source: BookSource, baseUrl: string): SearchResult[] {
    const results: SearchResult[] = [];
    const rule = source.ruleSearch!;
    
    // 解析书籍列表
    $(rule.bookList).each((_, element) => {
      const title = $(element).find(rule.name).text().trim();
      const author = $(element).find(rule.author).text().trim();
      
      // 跳过无效结果
      if (!title || !author) return;
      
      const coverUrl = $(element).find(rule.coverUrl).attr('src');
      const url = this.resolveUrl($(element).find(rule.bookUrl).attr('href'), baseUrl);
      const intro = rule.intro ? $(element).find(rule.intro).text().trim() : undefined;
      
      results.push({
        title,
        author,
        coverUrl: coverUrl ? this.resolveUrl(coverUrl, baseUrl) : undefined,
        url,
        sourceId: source.id!,
        sourceName: source.name,
        description: intro
      });
    });
    
    return results;
  }

  /**
   * 获取书籍详情
   * 
   * @param source - 书源配置
   * @param bookUrl - 书籍详情页 URL
   * @returns 书籍信息
   */
  async getBookDetail(source: BookSource, bookUrl: string): Promise<Partial<Book>> {
    try {
      const baseUrl = source.baseUrl || source.bookSourceUrl || '';
      const html = await this.fetchHtml(bookUrl, baseUrl);
      const $ = cheerio.load(html);
      
      // 支持两种格式
      if (source.ruleBookInfo) {
        return this.parseLegadoBookDetail($, source, baseUrl);
      } else if (source.selectors) {
        return this.parseStandardBookDetail($, source, baseUrl);
      } else {
        throw new Error('书源缺少选择器配置');
      }
    } catch (error) {
      console.error('[Crawler] 获取书籍详情失败:', error);
      throw error;
    }
  }

  /**
   * 解析标准格式的书籍详情
   */
  private parseStandardBookDetail($: cheerio.CheerioAPI, source: BookSource, baseUrl: string): Partial<Book> {
    const selectors = source.selectors!;
    return {
      title: $(selectors.bookTitle).text().trim(),
      author: $(selectors.bookAuthor).text().trim(),
      coverUrl: this.resolveUrl($(selectors.bookCover).attr('src'), baseUrl),
      description: $('.description').text().trim()
    };
  }

  /**
   * 解析阅读 APP（Legado）格式的书籍详情
   */
  private parseLegadoBookDetail($: cheerio.CheerioAPI, source: BookSource, baseUrl: string): Partial<Book> {
    const rule = source.ruleBookInfo!;
    return {
      title: $(rule.name).text().trim(),
      author: $(rule.author).text().trim(),
      coverUrl: this.resolveUrl($(rule.coverUrl).attr('src'), baseUrl),
      description: $(rule.intro).text().trim()
    };
  }

  /**
   * 获取章节列表
   * 
   * @param source - 书源配置
   * @param chapterListUrl - 章节列表页 URL
   * @returns 章节列表（按顺序）
   * 
   * 逻辑说明：
   * 1. 获取章节列表页 HTML
   * 2. 解析所有章节链接
   * 3. 按 DOM 顺序返回（通常已经是正序）
   * 4. 支持两种格式
   */
  async getChapters(source: BookSource, chapterListUrl: string): Promise<Chapter[]> {
    try {
      const baseUrl = source.baseUrl || source.bookSourceUrl || '';
      const html = await this.fetchHtml(chapterListUrl, baseUrl);
      const $ = cheerio.load(html);
      
      // 支持两种格式
      if (source.ruleToc) {
        return this.parseLegadoChapters($, source, baseUrl);
      } else if (source.selectors) {
        return this.parseStandardChapters($, source, baseUrl);
      } else {
        throw new Error('书源缺少选择器配置');
      }
    } catch (error) {
      console.error('[Crawler] 获取章节列表失败:', error);
      throw error;
    }
  }

  /**
   * 解析标准格式的章节列表
   */
  private parseStandardChapters($: cheerio.CheerioAPI, source: BookSource, baseUrl: string): Chapter[] {
    const selectors = source.selectors!;
    const chapters: Chapter[] = [];
    
    $(selectors.chapters).each((index, element) => {
      const title = $(element).find(selectors.chapterTitle).text().trim();
      const url = $(element).find(selectors.chapterUrl).attr('href');
      
      if (!title || !url) return;
      
      chapters.push({
        bookId: 0,
        title,
        url: this.resolveUrl(url, baseUrl),
        order: index,
        wordCount: 0,
        createdAt: Date.now()
      });
    });
    
    console.log(`[Crawler] 获取到 ${chapters.length} 个章节`);
    return chapters;
  }

  /**
   * 解析阅读 APP（Legado）格式的章节列表
   */
  private parseLegadoChapters($: cheerio.CheerioAPI, source: BookSource, baseUrl: string): Chapter[] {
    const rule = source.ruleToc!;
    const chapters: Chapter[] = [];
    
    $(rule.chapterList).each((index, element) => {
      const title = $(element).find(rule.chapterName).text().trim();
      const url = $(element).find(rule.chapterUrl).attr('href');
      
      if (!title || !url) return;
      
      chapters.push({
        bookId: 0,
        title,
        url: this.resolveUrl(url, baseUrl),
        order: index,
        wordCount: 0,
        createdAt: Date.now()
      });
    });
    
    console.log(`[Crawler] 获取到 ${chapters.length} 个章节`);
    return chapters;
  }

  /**
   * 获取章节内容
   * 
   * @param source - 书源配置
   * @param chapterUrl - 章节内容页 URL
   * @returns 章节内容（HTML 或纯文本）
   */
  async getContent(source: BookSource, chapterUrl: string): Promise<string> {
    try {
      const html = await this.fetchHtml(chapterUrl, source.baseUrl || source.bookSourceUrl);
      const $ = cheerio.load(html);
      
      // 支持两种格式
      let content: string | undefined;
      
      if (source.ruleContent) {
        content = this.parseLegadoContent($, source.ruleContent);
      } else if (source.selectors) {
        content = $(source.selectors.content).html() || undefined;
      } else {
        throw new Error('书源缺少选择器配置');
      }
      
      if (!content) {
        throw new Error('无法解析章节内容');
      }
      
      return content;
      
    } catch (error) {
      console.error('[Crawler] 获取章节内容失败:', error);
      throw error;
    }
  }

  /**
   * 解析阅读 APP（Legado）格式的章节内容
   */
  private parseLegadoContent($: cheerio.CheerioAPI, rule: { content: string, replace?: string[] }): string {
    const content = $(rule.content).html();
    
    if (!content) {
      return '';
    }
    
    // 应用替换规则（如果有）
    if (rule.replace && rule.replace.length > 0) {
      let processed = content;
      for (const replaceRule of rule.replace) {
        // 简单的字符串替换，复杂规则需要更高级的解析
        processed = processed.replace(new RegExp(replaceRule, 'g'), '');
      }
      return processed;
    }
    
    return content;
  }

  /**
   * 发送 HTTP 请求获取 HTML
   * 
   * 注意：浏览器环境受 CORS 限制，可能需要代理
   * 
   * @param url - 请求 URL
   * @param referer - Referer 头
   * @returns HTML 字符串
   */
  private async fetchHtml(url: string, referer?: string): Promise<string> {
    const headers = {
      ...this.defaultHeaders,
      'Referer': referer || ''
    };

    // 浏览器环境使用 fetch
    const response = await fetch(url, {
      method: 'GET',
      headers,
      mode: 'cors' // 可能需要改为 'no-cors' 或使用代理
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.text();
  }

  /**
   * 将相对 URL 转换为绝对 URL
   * 
   * @param url - 可能是相对或绝对 URL
   * @param baseUrl - 基础 URL
   * @returns 绝对 URL
   */
  private resolveUrl(url: string | undefined, baseUrl: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // 处理相对路径
    const base = new URL(baseUrl);
    if (url.startsWith('/')) {
      return `${base.protocol}//${base.host}${url}`;
    }
    
    return `${base.protocol}//${base.host}${base.pathname}/${url}`;
  }
}

// 导出单例
export const crawler = new CrawlerService();
