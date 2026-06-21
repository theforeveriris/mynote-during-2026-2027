(function() {
  window.MarkdownPreview = window.MarkdownPreview || {};
  
  const debugState = {
    apiCalls: 0,
    cacheHits: 0,
    startTime: null,
    enabled: false
  };
  
  function initDebug() {
    const urlParams = new URLSearchParams(window.location.search);
    const debugMode = urlParams.get('debug');
    
    if (debugMode === '1' || debugMode === 'true') {
      debugState.enabled = true;
      debugState.startTime = performance.now();
      showDebugPanel();
      setupDebugClose();
      updateRenderTime();
    }
  }
  
  function showDebugPanel() {
    const debugPanel = document.getElementById('debugPanel');
    if (debugPanel) {
      debugPanel.classList.remove('hidden');
    }
  }
  
  function setupDebugClose() {
    const closeBtn = document.getElementById('debugClose');
    const debugPanel = document.getElementById('debugPanel');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (debugPanel) {
          debugPanel.classList.add('hidden');
        }
      });
    }
  }
  
  function updateRenderTime() {
    if (!debugState.enabled) return;
    
    const elapsed = Math.round(performance.now() - debugState.startTime);
    const debugRenderTime = document.getElementById('debugRenderTime');
    if (debugRenderTime) {
      debugRenderTime.textContent = elapsed + 'ms';
    }
  }
  
  function incrementApiCalls() {
    if (!debugState.enabled) return;
    debugState.apiCalls++;
    updateDebugPanel();
  }
  
  function incrementCacheHits() {
    if (!debugState.enabled) return;
    debugState.cacheHits++;
  }
  
  function updateDebugPanel() {
    if (!debugState.enabled) return;
    
    const debugApiCalls = document.getElementById('debugApiCalls');
    const debugCacheHits = document.getElementById('debugCacheHits');
    
    if (debugApiCalls) {
      debugApiCalls.textContent = debugApiCalls.textContent.replace(/\d+ 次/, debugState.apiCalls + ' 次');
    }
    
    if (debugCacheHits) {
      debugCacheHits.textContent = debugState.cacheHits + ' / ' + debugState.apiCalls;
    }
  }
  
  window.MarkdownPreview.debug = {
    init: initDebug,
    incrementApiCalls,
    incrementCacheHits,
    updateRenderTime
  };
})();
