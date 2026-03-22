/**
 * 文件解析服务
 * 
 * 功能：
 * 1. 解析 TXT 文件，智能分章
 * 2. 解析 EPUB 文件，提取章节
 * 
 * 使用示例：
 * ```typescript
 * const parser = new FileParserService();
 * 
 * // 解析 TXT
 * const txtBook = await parser.parseTxt(file);
 * 
 * // 解析 EPUB
 * const epubBook = await parser.parseEpub(file);
 * ```
 */

import type { Book, Chapter } from '@/db';

/**
 * 解析后的书籍数据结构
 */
export interface ParsedBook {
  book: Partial<Book>;
  chapters: Chapter[];
  content: string; // 原始文件内容或路径
}

/**
 * 文件解析服务类
 */
export class FileParserService {
  /**
   * 章节标题正则表达式
   * 支持多种格式：
   * - 第一章 xxx
   * - 第 1 章 xxx
   * - Chapter 1: xxx
   * - 一、xxx
   * - 楔子、序章、尾声等
   */
  private chapterRegex = /^(第 [一二三四五六七八九十百千\d]+章|Chapter\s+\d+|[一二三四五六七八九十]+、|楔子 | 序章 | 尾声 | 番外|后记)/i;

  /**
   * 解析 TXT 文件
   * 
   * 逻辑说明：
   * 1. 读取文件内容
   * 2. 按行分割
   * 3. 使用正则匹配章节标题
   * 4. 将每个章节的内容分组
   * 
   * @param file - TXT 文件对象
   * @returns 解析后的书籍数据
   */
  async parseTxt(file: File): Promise<ParsedBook> {
    console.log('[Parser] 开始解析 TXT 文件:', file.name);
    
    // 读取文件内容
    const content = await this.readFileAsText(file);
    
    // 按行分割
    const lines = content.split(/\r?\n/);
    
    // 分章
    const chapters: Chapter[] = [];
    let currentChapter: Chapter | null = null;
    let currentContent: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = (lines[i] ?? '').trim();
      
      // 检测是否为章节标题
      if (this.chapterRegex.test(line)) {
        // 保存上一章节
        if (currentChapter) {
          currentChapter.content = currentContent.join('\n');
          currentChapter.wordCount = currentChapter.content.length;
          chapters.push(currentChapter);
        }
        
        // 创建新章节
        currentChapter = {
          bookId: 0, // 临时值，保存时会被替换
          title: line,
          order: chapters.length,
          wordCount: 0,
          createdAt: Date.now()
        };
        currentContent = [];
      } else if (currentChapter && line) {
        // 收集章节内容（跳过空行）
        currentContent.push(line);
      }
    }
    
    // 保存最后一章
    if (currentChapter) {
      currentChapter.content = currentContent.join('\n');
      currentChapter.wordCount = currentChapter.content.length;
      chapters.push(currentChapter);
    }
    
    console.log(`[Parser] TXT 解析完成，共 ${chapters.length} 章`);
    
    // 从文件名提取书名（可选）
    const bookName = file.name.replace(/\.txt$/i, '');
    
    return {
      book: {
        title: bookName,
        author: '未知',
        status: 'reading',
        totalChapters: chapters.length,
        localPath: file.name,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      chapters,
      content: '' // 内容已分散到各章节，不保留完整文本节省空间
    };
  }

  /**
   * 解析 EPUB 文件
   * 
   * 逻辑说明：
   * 1. EPUB 本质是 ZIP 压缩包
   * 2. 解压后解析 OPF 文件获取元数据
   * 3. 解析 NCX 或 NAV 文件获取目录
   * 4. 提取各章节 HTML 内容
   * 
   * @param file - EPUB 文件对象
   * @returns 解析后的书籍数据
   */
  async parseEpub(file: File): Promise<ParsedBook> {
    console.log('[Parser] 开始解析 EPUB 文件:', file.name);
    
    try {
      // 注意：浏览器环境解析 EPUB 需要额外库
      // 这里提供简化版本，实际项目建议使用 @vitebook/epub-parser 或类似库
      
      // 使用 JSZip 解压 EPUB 文件
      const JSZip = (await import('jszip')).default;
      const zip = await JSZip.loadAsync(file);
      
      // 查找 OPF 文件（元数据）
      const opfPath = await this.findOpfFile(zip);
      
      if (!opfPath) {
        throw new Error('未找到 EPUB 元数据文件');
      }
      
      // 读取 OPF 文件
      const opfContent = await zip.file(opfPath)?.async('text');
      if (!opfContent) {
        throw new Error('无法读取 OPF 文件');
      }
      
      // 解析元数据（简化版）
      const title = this.extractXmlTag(opfContent, 'dc:title') || file.name.replace(/\.epub$/i, '');
      const author = this.extractXmlTag(opfContent, 'dc:creator') || '未知';
      
      // 查找并解析目录文件
      const chapters = await this.parseEpubChapters(zip, opfPath);
      
      console.log(`[Parser] EPUB 解析完成，共 ${chapters.length} 章`);
      
      return {
        book: {
          title,
          author,
          status: 'reading',
          totalChapters: chapters.length,
          localPath: file.name,
          coverUrl: await this.extractCover(zip, opfPath),
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        chapters,
        content: ''
      };
      
    } catch (error) {
      console.error('[Parser] EPUB 解析失败:', error);
      throw new Error(`EPUB 解析失败：${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 读取文件为文本
   * 
   * @param file - 文件对象
   * @param encoding - 编码（默认 UTF-8）
   * @returns 文件内容字符串
   */
  private async readFileAsText(file: File, encoding: string = 'utf-8'): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('读取文件失败'));
        }
      };
      
      reader.onerror = () => reject(new Error('读取文件失败'));
      
      // 尝试不同编码
      reader.readAsText(file, encoding);
    });
  }

  /**
   * 在 ZIP 中查找 OPF 文件
   * 
   * @param zip - JSZip 实例
   * @returns OPF 文件路径
   */
  private async findOpfFile(zip: any): Promise<string | null> {
    // 首先查找 container.xml
    const containerFile = zip.file('META-INF/container.xml');
    if (containerFile) {
      const content = await containerFile.async('text');
      const rootfilePath = this.extractXmlAttribute(content, 'full-path');
      if (rootfilePath) {
        return rootfilePath;
      }
    }
    
    // 回退：查找第一个 .opf 文件
    const opfFiles = Object.keys(zip.files).filter(path => path.endsWith('.opf'));
    return opfFiles[0] || null;
  }

  /**
   * 解析 EPUB 章节
   * 
   * @param zip - JSZip 实例
   * @param opfPath - OPF 文件路径
   * @returns 章节列表
   */
  private async parseEpubChapters(zip: any, opfPath: string): Promise<Chapter[]> {
    const chapters: Chapter[] = [];
    
    // TODO: 实现完整的 EPUB 目录解析
    // 这里提供简化版本
    
    // 查找所有 HTML/XHTML 文件作为章节
    const htmlFiles = Object.keys(zip.files).filter(
      path => path.endsWith('.html') || path.endsWith('.xhtml') || path.endsWith('.htm')
    );
    
    for (let i = 0; i < htmlFiles.length; i++) {
      const path = htmlFiles[i];
      const content = await zip.file(path)?.async('text');
      
      if (content) {
        // 提取标题
        const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : `第 ${i + 1} 章`;
        
        chapters.push({
          bookId: 0, // 临时值，保存时会被替换
          title,
          url: path,
          content: content,
          order: i,
          wordCount: content.length,
          createdAt: Date.now()
        });
      }
    }
    
    return chapters;
  }

  /**
   * 提取 EPUB 封面
   * 
   * @param zip - JSZip 实例
   * @param opfPath - OPF 文件路径
   * @returns 封面图片 Base64 或 URL
   */
  private async extractCover(zip: any, opfPath: string): Promise<string | undefined> {
    // TODO: 实现封面提取
    return undefined;
  }

  /**
   * 从 XML 中提取标签内容
   * 
   * @param xml - XML 字符串
   * @param tagName - 标签名
   * @returns 标签内容
   */
  private extractXmlTag(xml: string, tagName: string): string | null {
    const regex = new RegExp(`<${tagName}[^>]*>([^<]+)</${tagName}>`, 'i');
    const match = xml.match(regex);
    return match?.[1]?.trim() ?? null;
  }

  /**
   * 从 XML 中提取属性值
   * 
   * @param xml - XML 字符串
   * @param attributeName - 属性名
   * @returns 属性值
   */
  private extractXmlAttribute(xml: string, attributeName: string): string | null {
    const regex = new RegExp(`${attributeName}="([^"]+)"`, 'i');
    const match = xml.match(regex);
    return match?.[1] ?? null;
  }
}

// 导出单例
export const parser = new FileParserService();
