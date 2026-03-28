/**
 * 添加测试书籍脚本
 * 用于手动添加一本有章节内容的测试书籍
 */

import { db, type Book, type Chapter } from '../src/db';

async function addTestBook() {
  console.log('[测试] 开始添加测试书籍...');

  // 创建测试书籍
  const testBook: Book = {
    id: 999,
    title: 'TTS 测试文档',
    author: '系统',
    status: 'completed',
    cover: undefined,
    description: '这是一本用于测试 TTS 功能的测试书籍，包含多个章节和充足的文本内容。',
    source: 'test',
    sourceId: 'tts-test',
    createTime: Date.now(),
    updateTime: Date.now(),
  };

  // 创建测试章节
  const testChapters: Chapter[] = [
    {
      id: 'test-chapter-1',
      bookId: 999,
      title: '第一章：TTS 功能介绍',
      order: 0,
      content: `
        <h2>第一章：TTS 功能介绍</h2>
        <p>欢迎使用小说阅读器的听书功能！本功能可以将文字转换为语音，让您在忙碌的时候也能"听"小说。</p>
        <p>TTS（Text-to-Speech）技术是一种将文本转换为语音的技术。我们的阅读器使用了浏览器自带的 Web Speech API，无需额外的服务即可实现语音朗读功能。</p>
        <p>使用听书功能非常简单：</p>
        <ol>
          <li>打开任意一本书籍</li>
          <li>点击右上角的菜单按钮</li>
          <li>选择"🎵 听书模式"</li>
          <li>点击"开始朗读"按钮</li>
        </ol>
        <p>您还可以在 TTS 控制面板中调整语速、音调和选择不同的语音。祝您使用愉快！</p>
      `,
      createTime: Date.now(),
    },
    {
      id: 'test-chapter-2',
      bookId: 999,
      title: '第二章：功能特性',
      order: 1,
      content: `
        <h2>第二章：功能特性</h2>
        <p>我们的 TTS 功能具有以下特性：</p>
        <h3>1. 多语音支持</h3>
        <p>系统会自动检测可用的语音，并优先选择中文语音。您可以在设置中选择喜欢的语音。</p>
        <h3>2. 语速调节</h3>
        <p>支持 0.5 倍到 2.0 倍的语速调节，找到最适合您的朗读速度。</p>
        <h3>3. 音调调节</h3>
        <p>支持 0 到 2 的音调调节，改变声音的高低。</p>
        <h3>4. 定时关闭</h3>
        <p>支持 15 分钟、30 分钟、60 分钟的定时关闭功能，适合睡前听书。</p>
        <h3>5. 进度跟踪</h3>
        <p>实时显示朗读进度，让您了解当前朗读位置。</p>
      `,
      createTime: Date.now(),
    },
    {
      id: 'test-chapter-3',
      bookId: 999,
      title: '第三章：使用技巧',
      order: 2,
      content: `
        <h2>第三章：使用技巧</h2>
        <p>以下是一些使用 TTS 功能的技巧：</p>
        <ul>
          <li><strong>选择合适的语音：</strong>不同的语音有不同的音色，选择您听起来最舒适的语音。</li>
          <li><strong>调整适当的语速：</strong>刚开始可以使用正常语速（1.0x），然后根据习惯调整。</li>
          <li><strong>使用定时关闭：</strong>睡前听书时，设置定时关闭可以避免整夜播放。</li>
          <li><strong>后台播放：</strong>切换到其他应用时，TTS 会继续播放，不影响其他操作。</li>
        </ul>
        <p>希望这些技巧能帮助您更好地使用听书功能！如果您有任何建议或反馈，欢迎告诉我们。</p>
        <p>祝您阅读愉快！📖🎵</p>
      `,
      createTime: Date.now(),
    },
  ];

  try {
    // 删除旧的测试书籍（如果存在）
    await db.books.where('id').equals(999).delete();
    
    // 添加书籍
    await db.books.add(testBook);
    console.log('[测试] 测试书籍已添加');

    // 添加章节
    for (const chapter of testChapters) {
      await db.chapters.add(chapter);
    }
    console.log('[测试] 测试章节已添加');

    console.log('[测试] 测试书籍添加完成！');
    console.log('[测试] 书籍 ID: 999');
    console.log('[测试] 章节数:', testChapters.length);
  } catch (error) {
    console.error('[测试] 添加测试书籍失败:', error);
    throw error;
  }
}

// 执行
addTestBook().catch(console.error);
