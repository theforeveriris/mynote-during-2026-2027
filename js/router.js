(function() {
  window.MarkdownPreview = window.MarkdownPreview || {};
  
  let isUpdating = false;
  let pendingHash = null;
  
  function initRouter() {
    window.addEventListener('hashchange', handleHashChange);
    if (window.location.hash && window.location.hash.length > 2) {
      pendingHash = window.location.hash;
    }
  }
  
  function onFileTreeLoaded() {
    const { markdown, fileTree } = window.MarkdownPreview;
    if (pendingHash) {
      loadFromHash(pendingHash);
      pendingHash = null;
    } else {
      loadFromHash();
    }
  }
  
  function loadFromHash(hash = null) {
    const targetHash = hash || window.location.hash;
    if (!targetHash || targetHash.length < 2) return;
    
    let path = decodeURIComponent(targetHash.substring(1));
    if (path.startsWith('/')) {
      path = path.substring(1);
    }
    
    if (path && path.endsWith('.md')) {
      const { markdown, fileTree } = window.MarkdownPreview;
      isUpdating = true;
      markdown.loadMarkdownFile(path).catch(() => {
        console.warn('Failed to load document from URL');
      });
      fileTree.highlightFileInSidebar(path);
      setTimeout(() => isUpdating = false, 100);
    }
  }
  
  function handleHashChange() {
    if (isUpdating) return;
    loadFromHash();
  }
  
  function updateHash(path) {
    if (!path || isUpdating) return;
    const hash = '#/' + path;
    if (window.location.hash !== hash) {
      isUpdating = true;
      window.history.replaceState(null, '', hash);
      setTimeout(() => isUpdating = false, 100);
    }
  }
  
  window.MarkdownPreview.router = {
    init: initRouter,
    updateHash,
    onFileTreeLoaded
  };
})();
