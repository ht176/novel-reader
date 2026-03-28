/**
 * TTS (Text-to-Speech) 服务
 * 支持 Web Speech API 和云端 TTS 引擎
 * 
 * 功能：
 * - 文本转语音朗读
 * - 播放控制（播放/暂停/停止）
 * - 语速、音调调节
 * - 多语音支持
 * - 定时关闭
 */

export interface TTSVoice {
  name: string;
  lang: string;
  voiceURI: string;
  localService: boolean;
  default: boolean;
}

export interface TTSConfig {
  rate: number; // 语速 0.1 - 10 (默认 1)
  pitch: number; // 音调 0 - 2 (默认 1)
  volume: number; // 音量 0 - 1 (默认 1)
  voice: SpeechSynthesisVoice | null;
}

export interface TTSEventCallbacks {
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
  onBoundary?: (charIndex: number, name: string) => void;
}

class TTSService {
  private synthesis: SpeechSynthesis | null = null;
  private utterance: SpeechSynthesisUtterance | null = null;
  private isPaused: boolean = false;
  private currentText: string = '';
  private currentIndex: number = 0;
  private config: TTSConfig = {
    rate: 1,
    pitch: 1,
    volume: 1,
    voice: null,
  };
  private timerId: number | null = null;
  private callbacks: TTSEventCallbacks | null = null;

  constructor() {
    // 检查浏览器支持
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
    }
  }

  /**
   * 检查是否支持 TTS
   */
  isSupported(): boolean {
    return this.synthesis !== null;
  }

  /**
   * 获取可用的语音列表
   */
  async getVoices(): Promise<TTSVoice[]> {
    if (!this.synthesis) return [];

    return new Promise((resolve) => {
      // 有些浏览器需要等待 voiceschanged 事件
      const loadVoices = () => {
        const voices = this.synthesis!.getVoices();
        if (voices.length > 0) {
          resolve(
            voices.map((voice) => ({
              name: voice.name,
              lang: voice.lang,
              voiceURI: voice.voiceURI,
              localService: voice.localService,
              default: voice.default,
            }))
          );
        } else {
          // 等待 voiceschanged 事件
          this.synthesis!.onvoiceschanged = () => {
            loadVoices();
          };
          // 超时处理
          setTimeout(() => resolve([]), 1000);
        }
      };

      loadVoices();
    });
  }

  /**
   * 获取中文语音列表
   */
  async getChineseVoices(): Promise<TTSVoice[]> {
    const voices = await this.getVoices();
    return voices.filter(
      (voice) => voice.lang.startsWith('zh') || voice.lang.startsWith('cn')
    );
  }

  /**
   * 设置配置
   */
  setConfig(config: Partial<TTSConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取当前配置
   */
  getConfig(): TTSConfig {
    return { ...this.config };
  }

  /**
   * 设置事件回调
   */
  setCallbacks(callbacks: TTSEventCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * 朗读文本
   */
  speak(text: string, callbacks?: TTSEventCallbacks): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        const error = new Error('浏览器不支持 TTS');
        reject(error);
        callbacks?.onError?.(error);
        return;
      }

      // 停止当前的朗读
      this.stop();

      if (callbacks) {
        this.callbacks = callbacks;
      }

      this.currentText = text;
      this.currentIndex = 0;
      this.isPaused = false;

      // 创建朗读实例
      this.utterance = new SpeechSynthesisUtterance(text);

      // 应用配置
      this.utterance.rate = this.config.rate;
      this.utterance.pitch = this.config.pitch;
      this.utterance.volume = this.config.volume;

      // 设置语音
      if (this.config.voice) {
        this.utterance.voice = this.config.voice;
      } else {
        // 自动选择中文语音
        const voices = this.synthesis.getVoices();
        const zhVoice = voices.find(
          (v) => v.lang.startsWith('zh') || v.lang.startsWith('cn')
        );
        if (zhVoice) {
          this.utterance.voice = zhVoice;
          this.config.voice = zhVoice;
        }
      }

      // 事件监听
      this.utterance.onstart = () => {
        console.log('[TTS] 开始朗读');
        this.callbacks?.onStart?.();
      };

      this.utterance.onpause = () => {
        console.log('[TTS] 已暂停');
        this.isPaused = true;
        this.callbacks?.onPause?.();
      };

      this.utterance.onresume = () => {
        console.log('[TTS] 已继续');
        this.isPaused = false;
        this.callbacks?.onResume?.();
      };

      this.utterance.onend = () => {
        console.log('[TTS] 朗读结束');
        this.currentIndex = text.length;
        this.callbacks?.onEnd?.();
        resolve();
      };

      this.utterance.onerror = (event) => {
        console.error('[TTS] 朗读错误:', event);
        const error = new Error(`TTS 错误：${event.error}`);
        this.callbacks?.onError?.(error);
        reject(error);
      };

      this.utterance.onboundary = (event) => {
        if (event.name === 'word' || event.name === 'sentence') {
          this.currentIndex = event.charIndex;
          this.callbacks?.onBoundary?.(event.charIndex, event.name);
        }
      };

      // 开始朗读
      console.log('[TTS] 开始朗读，文本长度:', text.length);
      this.synthesis.speak(this.utterance);
    });
  }

  /**
   * 暂停朗读
   */
  pause(): void {
    if (!this.synthesis || this.synthesis.paused) return;
    
    console.log('[TTS] 暂停朗读');
    this.synthesis.pause();
    this.isPaused = true;
  }

  /**
   * 继续朗读
   */
  resume(): void {
    if (!this.synthesis || !this.isPaused) return;
    
    console.log('[TTS] 继续朗读');
    this.synthesis.resume();
    this.isPaused = false;
  }

  /**
   * 停止朗读
   */
  stop(): void {
    if (!this.synthesis) return;

    console.log('[TTS] 停止朗读');
    this.synthesis.cancel();
    this.utterance = null;
    this.isPaused = false;
    this.currentIndex = 0;

    // 清除定时器
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * 检查是否正在朗读
   */
  isSpeaking(): boolean {
    return this.synthesis?.speaking ?? false;
  }

  /**
   * 检查是否已暂停
   */
  isSpeakingPaused(): boolean {
    return this.synthesis?.paused ?? false;
  }

  /**
   * 设置定时关闭
   * @param minutes 多少分钟后关闭
   */
  setSleepTimer(minutes: number): void {
    // 清除之前的定时器
    if (this.timerId) {
      clearTimeout(this.timerId);
    }

    const milliseconds = minutes * 60 * 1000;
    console.log(`[TTS] 设置定时关闭：${minutes}分钟 (${milliseconds}ms)`);

    this.timerId = window.setTimeout(() => {
      console.log('[TTS] 定时关闭触发');
      this.stop();
    }, milliseconds);
  }

  /**
   * 取消定时关闭
   */
  cancelSleepTimer(): void {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
      console.log('[TTS] 取消定时关闭');
    }
  }

  /**
   * 获取当前朗读位置
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * 获取当前朗读进度 (0-1)
   */
  getProgress(): number {
    if (!this.currentText || this.currentText.length === 0) {
      return 0;
    }
    return this.currentIndex / this.currentText.length;
  }

  /**
   * 跳转到指定位置
   * @param index 字符索引
   */
  seek(index: number): void {
    if (!this.currentText || index < 0 || index >= this.currentText.length) {
      return;
    }

    this.currentIndex = index;
    
    // 从指定位置重新开始朗读
    const remainingText = this.currentText.substring(index);
    this.speak(remainingText);
  }

  /**
   * 分段朗读长文本
   * @param text 完整文本
   * @param chunkSize 每段大小（字符数）
   */
  async speakInChunks(text: string, chunkSize: number = 1000): Promise<void> {
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.substring(i, i + chunkSize));
    }

    for (let i = 0; i < chunks.length; i++) {
      if (i > 0) {
        // 等待一小段时间再读下一段
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      
      const chunk = chunks[i];
      if (chunk) {
        await this.speak(chunk);
      }
    }
  }
}

// 导出单例
export const ttsService = new TTSService();

// 导出工具函数
export const isTTSSupported = () => ttsService.isSupported();
export const getAvailableVoices = () => ttsService.getVoices();
export const getChineseVoices = () => ttsService.getChineseVoices();
