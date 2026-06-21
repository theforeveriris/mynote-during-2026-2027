(function() {
  window.MarkdownPreview = window.MarkdownPreview || {};
  window.MarkdownPreview.renderers = window.MarkdownPreview.renderers || {};
  
  function render() {
    if (typeof katex === 'undefined' || typeof renderMathInElement === 'undefined') {
      console.error('KaTeX library is not loaded');
      return;
    }
    
    const markdownBody = document.querySelector('.markdown-body');
    if (!markdownBody) return;
    
    // 先处理所有 katex-block div 中的纯文本 LaTeX
    const katexBlocks = markdownBody.querySelectorAll('.katex-block');
    katexBlocks.forEach(block => {
      const latex = block.textContent.trim();
      if (latex) {
        try {
          // 清空 block 然后用 katex.render 重新渲染
          block.textContent = '';
          katex.render(latex, block, {
            displayMode: true,
            throwOnError: false,
            trust: true,
            strict: false
          });
        } catch (e) {
          console.error('KaTeX block rendering error:', e);
        }
      }
    });
    
    // 然后用 renderMathInElement 处理剩余的行内公式
    try {
      renderMathInElement(markdownBody, {
        delimiters: [
          {left: '$$', right: '$$', display: true},
          {left: '$', right: '$', display: false}
        ],
        ignoredTags: ['pre', 'code', 'script', 'style'],
        throwOnError: false,
        trust: true,
        strict: false
      });
    } catch (error) {
      console.error('KaTeX rendering error:', error);
    }
  }
  
  window.MarkdownPreview.renderers.katex = {
    render
  };
})();
