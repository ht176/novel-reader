import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export type ThemeType = 'light' | 'dark' | 'sepia' | 'auto';

/**
 * 主题 Store
 * 
 * 功能：
 * 1. 管理全局主题设置
 * 2. 支持自动主题（根据系统设置）
 * 3. 持久化主题设置
 * 4. 动态应用主题到页面
 */
export const useThemeStore = defineStore('theme', () => {
  // 当前主题
  const currentTheme = ref<ThemeType>('auto');
  
  // 系统主题偏好
  const systemTheme = ref<'light' | 'dark'>('light');
  
  // 是否已初始化
  const initialized = ref(false);

  /**
   * 初始化主题
   */
  function initialize() {
    if (initialized.value) return;
    
    // 从 localStorage 加载主题设置
    const savedTheme = localStorage.getItem('app-theme') as ThemeType | null;
    if (savedTheme) {
      currentTheme.value = savedTheme;
    }
    
    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    systemTheme.value = mediaQuery.matches ? 'dark' : 'light';
    
    mediaQuery.addEventListener('change', (e) => {
      systemTheme.value = e.matches ? 'dark' : 'light';
      if (currentTheme.value === 'auto') {
        applyTheme(getEffectiveTheme());
      }
    });
    
    // 应用当前主题
    applyTheme(getEffectiveTheme());
    
    initialized.value = true;
  }

  /**
   * 获取实际应用的主题
   */
  function getEffectiveTheme(): 'light' | 'dark' | 'sepia' {
    if (currentTheme.value === 'auto') {
      return systemTheme.value;
    }
    return currentTheme.value;
  }

  /**
   * 设置主题
   */
  function setTheme(theme: ThemeType) {
    currentTheme.value = theme;
    localStorage.setItem('app-theme', theme);
    applyTheme(getEffectiveTheme());
  }

  /**
   * 应用主题到页面
   */
  function applyTheme(theme: 'light' | 'dark' | 'sepia') {
    const root = document.documentElement;
    
    // 添加过渡动画类
    root.classList.add('theme-transition');
    
    // 移除旧主题类
    root.classList.remove('theme-light', 'theme-dark', 'theme-sepia');
    
    // 添加新主题类
    root.classList.add(`theme-${theme}`);
    
    // 设置主题相关的 CSS 变量
    updateThemeVariables(theme);
    
    // 动画结束后移除过渡类（避免影响其他动画）
    setTimeout(() => {
      root.classList.remove('theme-transition');
    }, 300);
  }

  /**
   * 更新主题相关的 CSS 变量
   */
  function updateThemeVariables(theme: 'light' | 'dark' | 'sepia') {
    const root = document.documentElement;
    
    switch (theme) {
      case 'light':
        root.style.setProperty('--reader-bg', '#f5f5f5');
        root.style.setProperty('--reader-surface', '#ffffff');
        root.style.setProperty('--reader-text', '#212121');
        root.style.setProperty('--reader-text-secondary', '#757575');
        break;
      case 'dark':
        root.style.setProperty('--reader-bg', '#121212');
        root.style.setProperty('--reader-surface', '#1e1e1e');
        root.style.setProperty('--reader-text', '#e0e0e0');
        root.style.setProperty('--reader-text-secondary', '#aaaaaa');
        break;
      case 'sepia':
        root.style.setProperty('--reader-bg', '#f4ecd8');
        root.style.setProperty('--reader-surface', '#faf6eb');
        root.style.setProperty('--reader-text', '#5b4636');
        root.style.setProperty('--reader-text-secondary', '#8b7355');
        break;
    }
  }

  /**
   * 获取当前主题
   */
  function getCurrentTheme(): ThemeType {
    return currentTheme.value;
  }

  /**
   * 获取系统主题偏好
   */
  function getSystemTheme(): 'light' | 'dark' {
    return systemTheme.value;
  }

  return {
    // State
    currentTheme,
    systemTheme,
    initialized,
    
    // Actions
    initialize,
    setTheme,
    getEffectiveTheme,
    getCurrentTheme,
    getSystemTheme
  };
});