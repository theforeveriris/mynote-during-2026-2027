(function() {
  window.MarkdownPreview = window.MarkdownPreview || {};
  
  window.MarkdownPreview.state = {
    fileTreeData: [],
    currentMode: 'files',
    currentFilePath: '',
    currentHeadings: [],
    currentFrontmatter: {}
  };
})();
