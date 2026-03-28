<template>
  <div class="tts-control">
    <!-- TTS 控制按钮 -->
    <button 
      class="tts-toggle" 
      @click="toggleTTS"
      :class="{ active: isSpeaking }"
      :title="isSpeaking ? '停止朗读' : '开始朗读'"
    >
      {{ isSpeaking ? '🔊' : '🔇' }}
    </button>

    <!-- TTS 控制面板 -->
    <transition name="slide-up" appear>
      <div v-if="showTTSPanel" class="tts-panel">
        <div class="tts-panel-header">
          <h4>🎵 听书模式</h4>
          <button class="btn-icon" @click="showTTSPanel = false" aria-label="关闭">✕</button>
        </div>

        <div class="tts-panel-body">
          <!-- 播放控制 -->
          <div class="tts-controls">
            <button 
              class="tts-btn" 
              @click="togglePlay"
              :disabled="!hasContent"
            >
              {{ isPaused ? '▶️' : '⏸️' }}
            </button>
            <button 
              class="tts-btn" 
              @click="stop"
              :disabled="!isSpeaking"
            >
              ⏹️
            </button>
          </div>

          <!-- 语速调节 -->
          <div class="tts-setting">
            <label>
              <span>🐌 语速</span>
              <span class="setting-value">{{ config.rate.toFixed(1) }}x</span>
            </label>
            <input 
              type="range" 
              min="0.5" 
              max="2" 
              step="0.1"
              v-model.number="config.rate"
              @input="updateConfig"
              class="tts-slider"
            />
          </div>

          <!-- 音调调节 -->
          <div class="tts-setting">
            <label>
              <span>🎼 音调</span>
              <span class="setting-value">{{ config.pitch.toFixed(1) }}</span>
            </label>
            <input 
              type="range" 
              min="0" 
              max="2" 
              step="0.1"
              v-model.number="config.pitch"
              @input="updateConfig"
              class="tts-slider"
            />
          </div>

          <!-- 语音选择 -->
          <div class="tts-setting">
            <label>
              <span>🗣️ 语音</span>
            </label>
            <select 
              v-model="selectedVoiceURI"
              @change="updateVoice"
              class="tts-select"
            >
              <option v-for="voice in chineseVoices" :key="voice.voiceURI" :value="voice.voiceURI">
                {{ voice.name }} ({{ voice.lang }})
              </option>
            </select>
          </div>

          <!-- 定时关闭 -->
          <div class="tts-setting">
            <label>
              <span>⏰ 定时关闭</span>
            </label>
            <div class="tts-timer-buttons">
              <button 
                v-for="min in [15, 30, 60]" 
                :key="min"
                @click="setSleepTimer(min)"
                :class="{ active: sleepTimer === min }"
                class="tts-timer-btn"
              >
                {{ min }}分钟
              </button>
              <button 
                @click="cancelSleepTimer"
                :class="{ active: sleepTimer === null }"
                class="tts-timer-btn"
              >
                关闭
              </button>
            </div>
          </div>

          <!-- 进度显示 -->
          <div v-if="isSpeaking" class="tts-progress">
            <div class="progress-info">
              <span>📖 朗读进度</span>
              <span>{{ Math.round(progress * 100) }}%</span>
            </div>
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: `${progress * 100}%` }"
              />
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue';
import { ttsService, type TTSVoice } from '@/services/tts';

// Props
interface Props {
  content: string | undefined;
  chapterTitle?: string;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  (e: 'highlight', index: number): void;
}>();

// 状态
const isSpeaking = ref(false);
const isPaused = ref(false);
const showTTSPanel = ref(false);
const hasContent = computed(() => props.content && props.content.length > 0);

// 配置
const config = reactive({
  rate: 1,
  pitch: 1,
  volume: 1,
});

// 语音
const chineseVoices = ref<TTSVoice[]>([]);
const selectedVoiceURI = ref<string>('');

// 定时关闭
const sleepTimer = ref<number | null>(null);

// 进度
const progress = ref(0);

// 检查 TTS 支持
const isSupported = computed(() => ttsService.isSupported());

// 加载可用语音
onMounted(async () => {
  if (!isSupported.value) {
    console.warn('[TTS] 浏览器不支持 TTS');
    return;
  }

  try {
    const voices = await ttsService.getChineseVoices();
    chineseVoices.value = voices;
    
    // 设置默认语音
    if (voices.length > 0) {
      const defaultVoice = voices.find(v => v.default) || voices[0];
      if (defaultVoice) {
        selectedVoiceURI.value = defaultVoice.voiceURI;
        await updateVoice();
      }
    }
  } catch (error) {
    console.error('[TTS] 加载语音失败:', error);
  }
});

// 更新配置
const updateConfig = () => {
  ttsService.setConfig({
    rate: config.rate,
    pitch: config.pitch,
    volume: config.volume,
  });
};

// 更新语音
const updateVoice = async () => {
  if (!selectedVoiceURI.value) return;
  
  const voices = await ttsService.getVoices();
  const voice = voices.find(v => v.voiceURI === selectedVoiceURI.value);
  if (voice) {
    // 需要获取原始的 SpeechSynthesisVoice 对象
    const allVoices = window.speechSynthesis.getVoices();
    const originalVoice = allVoices.find(v => v.voiceURI === voice.voiceURI);
    if (originalVoice) {
      ttsService.setConfig({ voice: originalVoice });
    }
  }
};

// 切换 TTS 面板
const toggleTTS = () => {
  if (!isSupported.value) {
    alert('❌ 您的浏览器不支持 TTS 功能\n\n建议使用 Chrome、Edge 或 Safari 浏览器');
    return;
  }

  if (isSpeaking.value) {
    stop();
  } else {
    showTTSPanel.value = true;
    if (hasContent.value && !isSpeaking.value) {
      start();
    }
  }
};

// 开始朗读
const start = () => {
  if (!hasContent.value) return;

  // 提取纯文本（去除 HTML 标签）
  const text = extractText(props.content || '');
  
  ttsService.setCallbacks({
    onStart: () => {
      isSpeaking.value = true;
      isPaused.value = false;
    },
    onPause: () => {
      isPaused.value = true;
    },
    onResume: () => {
      isPaused.value = false;
    },
    onEnd: () => {
      isSpeaking.value = false;
      isPaused.value = false;
      progress.value = 0;
    },
    onError: (error) => {
      console.error('[TTS] 朗读错误:', error);
      isSpeaking.value = false;
      alert(`❌ TTS 错误：${error.message}`);
    },
    onBoundary: (charIndex) => {
      progress.value = ttsService.getProgress();
      // TODO: 高亮当前朗读的句子
      // emit('highlight', charIndex);
    },
  });

  ttsService.speak(text).catch(err => {
    console.error('[TTS] 朗读失败:', err);
  });
};

// 暂停/继续
const togglePlay = () => {
  if (isPaused.value) {
    ttsService.resume();
  } else {
    ttsService.pause();
  }
};

// 停止
const stop = () => {
  ttsService.stop();
  isSpeaking.value = false;
  isPaused.value = false;
  progress.value = 0;
};

// 设置定时关闭
const setSleepTimer = (minutes: number) => {
  sleepTimer.value = minutes;
  ttsService.setSleepTimer(minutes);
};

// 取消定时关闭
const cancelSleepTimer = () => {
  sleepTimer.value = null;
  ttsService.cancelSleepTimer();
};

// 提取纯文本（去除 HTML 标签）
const extractText = (html: string | undefined): string => {
  if (!html) return '';
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
};

// 监听内容变化
watch(() => props.content, () => {
  if (isSpeaking.value) {
    stop();
    setTimeout(start, 100);
  }
});

// 清理
onUnmounted(() => {
  stop();
});
</script>

<style scoped>
.tts-control {
  position: relative;
}

.tts-toggle {
  font-size: 1.5rem;
  padding: 8px;
  border-radius: 50%;
  background: var(--bg-secondary);
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.tts-toggle:hover {
  background: var(--bg-tertiary);
}

.tts-toggle.active {
  background: var(--accent-color);
  color: white;
}

/* 控制面板 */
.tts-panel {
  position: absolute;
  bottom: 60px;
  right: 10px;
  width: 300px;
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  overflow: hidden;
}

.tts-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
}

.tts-panel-header h4 {
  margin: 0;
  font-size: 1rem;
}

.tts-panel-body {
  padding: 16px;
  max-height: 400px;
  overflow-y: auto;
}

/* 播放控制 */
.tts-controls {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 20px;
}

.tts-btn {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: none;
  background: var(--accent-color);
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.tts-btn:hover:not(:disabled) {
  transform: scale(1.1);
}

.tts-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 设置项 */
.tts-setting {
  margin-bottom: 16px;
}

.tts-setting label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.setting-value {
  color: var(--accent-color);
  font-weight: 500;
}

.tts-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: var(--bg-tertiary);
  outline: none;
  -webkit-appearance: none;
}

.tts-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--accent-color);
  cursor: pointer;
}

.tts-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.9rem;
}

/* 定时按钮 */
.tts-timer-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.tts-timer-btn {
  padding: 6px 8px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.tts-timer-btn.active {
  background: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
}

/* 进度条 */
.tts-progress {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.85rem;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent-color);
  transition: width 0.3s;
}

/* 动画 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
