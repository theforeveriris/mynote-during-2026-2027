// Theme Manager - 主题管理系统

(function() {
  const STORAGE_KEY = 'md-preview-theme';
  const CUSTOM_CSS_KEY = 'md-preview-custom-css';
  
  let currentTheme = 'default';
  let customCSSLink = null;

  // 初始化主题系统
  function init() {
    // 加载保存的主题
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    if (savedTheme) {
      setTheme(savedTheme, false);
    }

    // 加载自定义 CSS
    loadCustomCSS();

    // 绑定设置面板中的主题选择器
    bindSettingsPanel();
  }

  // 设置主题
  function setTheme(themeId, save = true) {
    const validThemes = ['default', 'github-light', 'github-dark', 'notion', 'arc', 'dracula', 'nord'];
    if (!validThemes.includes(themeId)) {
      console.warn(`Theme ${themeId} not found`);
      return;
    }

    currentTheme = themeId;
    document.documentElement.setAttribute('data-theme', themeId);
    
    if (save) {
      localStorage.setItem(STORAGE_KEY, themeId);
    }

    // 触发主题切换事件
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: themeId } }));
    
    console.log(`Theme changed to: ${themeId}`);
  }

  // 获取当前主题
  function getCurrentTheme() {
    return currentTheme;
  }

  // 加载自定义 CSS
  function loadCustomCSS(url) {
    // 移除旧的 custom CSS
    if (customCSSLink) {
      customCSSLink.remove();
      customCSSLink = null;
    }

    if (!url) {
      // 从 localStorage 加载
      url = localStorage.getItem(CUSTOM_CSS_KEY);
    }

    if (url) {
      customCSSLink = document.createElement('link');
      customCSSLink.rel = 'stylesheet';
      customCSSLink.href = url;
      document.head.appendChild(customCSSLink);
      console.log(`Custom CSS loaded: ${url}`);
    }
  }

  // 设置自定义 CSS
  function setCustomCSS(url) {
    localStorage.setItem(CUSTOM_CSS_KEY, url);
    loadCustomCSS(url);
  }

  // 清除自定义 CSS
  function clearCustomCSS() {
    localStorage.removeItem(CUSTOM_CSS_KEY);
    if (customCSSLink) {
      customCSSLink.remove();
      customCSSLink = null;
    }
  }

  // 绑定设置面板
  function bindSettingsPanel() {
    const themeSelect = document.getElementById('themeSelect');
    const customCSSInput = document.getElementById('customCSSInput');

    if (themeSelect) {
      // 设置当前值
      themeSelect.value = currentTheme;
      
      // 监听变化
      themeSelect.addEventListener('change', (e) => {
        setTheme(e.target.value);
      });
    }

    if (customCSSInput) {
      // 设置当前值
      const savedCSS = localStorage.getItem(CUSTOM_CSS_KEY);
      if (savedCSS) {
        customCSSInput.value = savedCSS;
      }
      
      // 回车应用
      customCSSInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const url = e.target.value.trim();
          if (url) {
            setCustomCSS(url);
          } else {
            clearCustomCSS();
          }
        }
      });
    }
  }

  // 导出到全局
  window.MarkdownPreview = window.MarkdownPreview || {};
  window.MarkdownPreview.themes = {
    init: init,
    setTheme: setTheme,
    getCurrentTheme: getCurrentTheme,
    setCustomCSS: setCustomCSS,
    clearCustomCSS: clearCustomCSS
  };

  // 自动初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
