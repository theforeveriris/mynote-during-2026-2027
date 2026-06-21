(function() {
  window.MarkdownPreview = window.MarkdownPreview || {};

  const { dom, state, CONFIG } = window.MarkdownPreview;

  async function loadMarkdownFile(path) {
    try {
      // 立即更新 URL，提供即时反馈
      const { router } = window.MarkdownPreview;
      if (router && router.updateHash) {
        router.updateHash(path);
      }

      window.MarkdownPreview.ui.updateProgress(30);
      const response = await fetch(path);

      if (window.MarkdownPreview.debug && window.MarkdownPreview.debug.incrementApiCalls) {
        window.MarkdownPreview.debug.incrementApiCalls();
      }

      if (!response.ok) {
        throw new Error('Failed to load markdown file');
      }
      window.MarkdownPreview.ui.updateProgress(60);
      const markdown = await response.text();
      window.MarkdownPreview.ui.updateProgress(100);
      state.currentFilePath = path;
      renderMarkdown(markdown, path);
      extractAndRenderIndex(markdown);
      updateEditButton(path);
      updateBreadcrumbs(path);
      setupHeadingNavigation();
    } catch (error) {
      console.error('Error loading markdown:', error);
      dom.markdownContent.innerHTML = '<div class="welcome-state"><p class="welcome-text">无法加载文件</p></div>';
      setTimeout(() => window.MarkdownPreview.ui.updateProgress(0), 300);
    }
  }

  function parseFrontmatter(markdown) {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*/;
    const match = markdown.match(frontmatterRegex);

    if (!match) {
      return { frontmatter: {}, content: markdown };
    }

    const frontmatterStr = match[1];
    const content = markdown.substring(match[0].length);

    const frontmatter = {};
    const lines = frontmatterStr.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const colonIndex = trimmed.indexOf(':');
      if (colonIndex > 0) {
        const key = trimmed.substring(0, colonIndex).trim();
        let value = trimmed.substring(colonIndex + 1).trim();

        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.substring(1, value.length - 1);
        }

        frontmatter[key] = value;
      }
    }

    return { frontmatter, content };
  }

  function calculateReadingTime(text) {
    const englishWords = text.match(/[a-zA-Z]+/g) || [];
    const englishCount = englishWords.reduce((sum, word) => sum + word.length, 0);
    const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
    const chineseCount = chineseChars.length;

    const englishMinutes = englishCount / 200;
    const chineseMinutes = chineseCount / 400;

    return Math.ceil(englishMinutes + chineseMinutes);
  }

  function processGitHubAlerts(markdownText) {
    const alertTypes = {
      'NOTE': { icon: 'ℹ️', class: 'alert-note', title: 'Note' },
      'IMPORTANT': { icon: '💡', class: 'alert-important', title: 'Important' },
      'WARNING': { icon: '⚠️', class: 'alert-warning', title: 'Warning' },
      'TIP': { icon: '💡', class: 'alert-tip', title: 'Tip' },
      'CAUTION': { icon: '⚠️', class: 'alert-caution', title: 'Caution' }
    };

    let processed = markdownText;
    let result = '';
    const lines = markdownText.split('\n');
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const alertMatch = line.match(/^> \[!([A-Z]+)\](.*)$/);

      if (alertMatch) {
        const alertType = alertTypes[alertMatch[1]];
        if (alertType) {
          const alertContentLines = [];
          i++;

          while (i < lines.length && (lines[i].startsWith('> ') || lines[i].trim() === '')) {
            if (lines[i].trim() === '') {
              alertContentLines.push('');
            } else {
              alertContentLines.push(lines[i].substring(2));
            }
            i++;
          }

          const alertContent = alertContentLines.join('\n').trim();
          const parsedContent = marked.parse(alertContent, { breaks: true, gfm: true });

          result += `<div class="alert ${alertType.class}">
            <div class="alert-header">
              <span class="alert-icon">${alertType.icon}</span>
              <span class="alert-title">${alertType.title}</span>
            </div>
            <div class="alert-content">${parsedContent}</div>
          </div>\n`;
        } else {
          result += line + '\n';
          i++;
        }
      } else {
        result += line + '\n';
        i++;
      }
    }

    return result;
  }

  function protectLaTeXBlocks(markdownText) {
    const latexBlocks = [];
    let index = 0;

    const processed = markdownText.replace(/\$\$[\s\S]*?\$\$/g, (match) => {
      const placeholder = `LATEXPROTECT_${index}_`;
      const lines = match.split('\n');
      const cleanedLines = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (i === 0) {
          cleanedLines.push(line.replace(/^\$\$\s*/, ''));
        } else if (i === lines.length - 1) {
          cleanedLines.push(line.replace(/\s*\$\$$/, ''));
        } else {
          cleanedLines.push(line.replace(/^    /, ''));
        }
      }
      const cleanedBlock = cleanedLines.join('\n').trim();
      latexBlocks.push(cleanedBlock);
      index++;
      return placeholder;
    });

    return { processed, latexBlocks };
  }

  function processImages(container) {
    const images = container.querySelectorAll('img');

    images.forEach(img => {
      img.setAttribute('loading', 'lazy');

      const src = img.getAttribute('src') || '';
      const filename = src.split('/').pop() || 'image';
      const alt = img.getAttribute('alt') || filename;

      img.onerror = function() {
        this.onerror = null;
        this.style.display = 'none';

        const placeholder = document.createElement('div');
        placeholder.className = 'image-placeholder';
        placeholder.innerHTML = `
          <div class="placeholder-icon">🖼️</div>
          <div class="placeholder-text">${alt}</div>
          <div class="placeholder-filename">${filename}</div>
        `;

        this.parentNode.insertBefore(placeholder, this);
      };
    });

    const galleryImages = container.querySelectorAll('img');
    if (galleryImages.length < 2) return;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = container.innerHTML;

    const paragraphs = Array.from(tempDiv.querySelectorAll('p'));
    const allElements = Array.from(tempDiv.childNodes);
    const galleryGroups = [];
    let currentGroup = [];

    allElements.forEach((node, index) => {
      if (node.nodeName === 'P') {
        const imgs = node.querySelectorAll('img');
        if (imgs.length > 0 && node.textContent.trim() === '') {
          currentGroup.push(...Array.from(imgs));

          const nextNode = allElements[index + 1];
          if (!nextNode || nextNode.nodeName !== 'P' || nextNode.querySelectorAll('img').length === 0) {
            if (currentGroup.length >= 2) {
              galleryGroups.push([...currentGroup]);
            }
            currentGroup = [];
          }
        } else {
          if (currentGroup.length >= 2) {
            galleryGroups.push([...currentGroup]);
          }
          currentGroup = [];
        }
      } else {
        if (currentGroup.length >= 2) {
          galleryGroups.push([...currentGroup]);
        }
        currentGroup = [];
      }
    });

    if (currentGroup.length >= 2) {
      galleryGroups.push([...currentGroup]);
    }

    galleryGroups.forEach(group => {
      if (group.length < 2) return;

      const firstImg = group[0];
      const parentP = firstImg.closest('p');
      if (!parentP) return;

      const galleryDiv = document.createElement('div');
      galleryDiv.className = 'image-gallery';

      group.forEach(img => {
        galleryDiv.appendChild(img.cloneNode(true));
      });

      parentP.replaceWith(galleryDiv);
    });

    container.innerHTML = tempDiv.innerHTML;
  }

  function renderMarkdown(markdown, currentPath = '') {
    const { frontmatter, content } = parseFrontmatter(markdown);

    if (frontmatter.title) {
      document.title = frontmatter.title + ' | ' + (CONFIG.repo || 'Markdown Preview');
    } else {
      const titleMatch = content.match(/^#\s+(.+)$/m);
      if (titleMatch) {
        document.title = titleMatch[1] + ' | ' + (CONFIG.repo || 'Markdown Preview');
      } else {
        document.title = CONFIG.repo || 'Markdown Preview';
      }
    }

    state.currentFrontmatter = frontmatter;

    const { processed: alertProcessed, latexBlocks } = protectLaTeXBlocks(content);
    const processedContent = processGitHubAlerts(alertProcessed);
    let html = marked.parse(processedContent, {
      breaks: true,
      gfm: true
    });

    html = html.replace(/LATEXPROTECT_(\d+)_/g, (match, idx) => {
      const latex = latexBlocks[parseInt(idx)];
      return `<div class="katex-block">${latex}</div>`;
    });

    const plainText = content.replace(/[#*`\[\]()_{}]/g, '').replace(/\n+/g, ' ').trim();
    const readingTime = calculateReadingTime(plainText);
    const readingTimeHtml = `<div class="reading-time">预计阅读 ${readingTime} 分钟</div>`;

    const headingMatch = html.match(/<h1[^>]*>/);
    let finalHtml;
    if (headingMatch) {
      const insertIndex = headingMatch.index + headingMatch[0].length;
      finalHtml = html.slice(0, insertIndex) + readingTimeHtml + html.slice(insertIndex);
    } else {
      finalHtml = readingTimeHtml + html;
    }

    dom.markdownContent.innerHTML = finalHtml;

    document.querySelectorAll('.markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4, .markdown-body h5, .markdown-body h6').forEach(heading => {
      const text = heading.textContent;
      const id = text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '');
      heading.id = id;
    });

    document.querySelectorAll('.markdown-body pre').forEach(pre => {
      pre.addEventListener('click', () => {
        window.MarkdownPreview.ui.copyCodeToClipboard(pre);
      });
    });

    interceptLinks(currentPath);

    processImages(dom.markdownContent);

    setTimeout(async () => {
      console.log('[Markdown] Starting render cycle');
      await renderWithPlugins();
      console.log('[Markdown] Plugins rendered, calling other renderers');
      window.MarkdownPreview.renderers.apexcharts.render();
      window.MarkdownPreview.renderers.diff.render();
      window.MarkdownPreview.renderers.mermaid.render();
      window.MarkdownPreview.renderers.plantuml.render();
      window.MarkdownPreview.renderers.embedded.render();
      window.MarkdownPreview.renderers.katex.render();
      console.log('[Markdown] Render cycle complete');
    }, 100);

    renderDocNavigation(currentPath);
  }

  function renderDocNavigation(currentPath) {
    if (!currentPath || !state.fileTreeData) return;

    const { prev, next } = window.MarkdownPreview.fileTree.getAdjacentFiles(currentPath);
    if (!prev && !next) return;

    const existingNav = dom.markdownContent.querySelector('.doc-navigation');
    if (existingNav) existingNav.remove();

    const navHtml = `
      <div class="doc-navigation">
        ${prev ? `<a href="#/${prev.path}" data-path="${prev.path}" class="nav-link">← ${prev.name}</a>` : ''}
        ${next ? `<a href="#/${next.path}" data-path="${next.path}" class="nav-link">${next.name} →</a>` : ''}
      </div>
    `;

    dom.markdownContent.insertAdjacentHTML('beforeend', navHtml);

    dom.markdownContent.querySelectorAll('.doc-navigation .nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const path = link.dataset.path;
        loadMarkdownFile(path);
        window.MarkdownPreview.fileTree.highlightFileInSidebar(path);
      });
    });
  }

  async function renderWithPlugins() {
    console.log('[Plugins] renderWithPlugins called');
    const plugins = window.MarkdownPreview.plugins;
    if (!plugins || typeof plugins.find !== 'function') {
      console.log('[Plugins] Plugins not available');
      return;
    }

    const allPres = document.querySelectorAll('.markdown-body pre');
    console.log('[Plugins] Found pre elements:', allPres.length);

    // 从后往前遍历，防止替换前面的元素后导致索引失效
    for (let i = allPres.length - 1; i >= 0; i--) {
      const pre = allPres[i];
      const codeElement = pre.querySelector('code');
      if (!codeElement) continue;

      const classList = codeElement.className;
      const languageMatch = classList ? classList.match(/language-(\S+)/) : null;
      const language = languageMatch ? languageMatch[1] : '';
      const code = codeElement.textContent.trim();

      console.log('[Plugins] Checking code block, language:', language);

      const plugin = plugins.find(code, language);
      if (plugin) {
        console.log('[Plugins] Found plugin for language:', language, 'plugin:', plugin.name);
        try {
          const container = document.createElement('div');
          container.className = `plugin-rendered plugin-${plugin.name}`;
          pre.parentNode.replaceChild(container, pre);
          plugin.render(code, container);
          console.log('[Plugins] Successfully rendered plugin:', plugin.name);
        } catch (error) {
          console.error(`Plugin ${plugin.name} render error:`, error);
        }
      }
    }
  }

  function interceptLinks(currentPath) {
    document.querySelectorAll('.markdown-body a').forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (!href) return;

        if (href.endsWith('.md')) {
          e.preventDefault();

          let targetPath = href;
          if (!href.startsWith('/') && currentPath) {
            const currentDir = currentPath.split('/').slice(0, -1).join('/');
            targetPath = currentDir ? `${currentDir}/${href}` : href;
            targetPath = simplifyPath(targetPath);
          }

          if (targetPath.startsWith('/')) {
            targetPath = targetPath.substring(1);
          }

          loadMarkdownFile(targetPath);
          window.MarkdownPreview.fileTree.highlightFileInSidebar(targetPath);
        }
      });
    });
  }

  function simplifyPath(path) {
    const parts = path.split('/');
    const result = [];
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part === '..') {
        result.pop();
      } else if (part !== '.' && part !== '') {
        result.push(part);
      }
    }
    return result.join('/');
  }

  function extractAndRenderIndex(markdown) {
    state.currentHeadings = [];
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    let match;

    while ((match = headingRegex.exec(markdown)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '');
      state.currentHeadings.push({ level, text, id });
    }

    renderIndex();
  }

  function renderIndex() {
    dom.indexTree.innerHTML = '';

    if (state.currentHeadings.length === 0) {
      dom.indexTree.innerHTML = '<div class="index-item" style="color: var(--color-text-muted);">当前文件无目录</div>';
      return;
    }

    state.currentHeadings.forEach((heading, index) => {
      const item = document.createElement('a');
      item.className = 'index-item';
      item.href = '#' + heading.id;
      item.textContent = heading.text;
      item.style.paddingLeft = (20 + (heading.level - 1) * 16) + 'px';
      item.dataset.id = heading.id;

      item.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.getElementById(heading.id);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        setActiveIndexItem(item);
      });

      dom.indexTree.appendChild(item);
    });
  }

  function setActiveIndexItem(item) {
    document.querySelectorAll('.index-item.active').forEach(el => {
      el.classList.remove('active');
    });
    item.classList.add('active');
  }

  function updateEditButton(path) {
    if (!dom.editPageBtn || !dom.pageHeader) return;

    if (!path) {
      dom.pageHeader.style.display = 'none';
      dom.editPageBtn.style.display = 'none';
      return;
    }

    dom.pageHeader.style.display = 'flex';
    dom.editPageBtn.style.display = 'flex';

    const editUrl = `https://github.com/${CONFIG.owner}/${CONFIG.repo}/edit/main/${path}`;
    dom.editPageBtn.href = editUrl;
  }

  function updateBreadcrumbs(path) {
    if (!dom.pageBreadcrumbs) return;

    dom.pageBreadcrumbs.innerHTML = '';

    if (!path) return;

    const parts = path.split('/');

    const rootCrumb = document.createElement('span');
    rootCrumb.className = 'breadcrumb-item';
    rootCrumb.textContent = CONFIG.repo || 'Docs';
    rootCrumb.style.cursor = 'pointer';
    rootCrumb.style.color = 'var(--color-accent-purple-deep)';
    rootCrumb.addEventListener('click', () => {
      dom.markdownContent.innerHTML = '<div class="welcome-state"><p class="welcome-text">选择一个文件开始阅读</p></div>';
      state.currentFilePath = '';
      window.history.replaceState(null, '', window.location.pathname);
      dom.pageHeader.style.display = 'none';
    });
    dom.pageBreadcrumbs.appendChild(rootCrumb);

    let currentPath = '';
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part) continue;

      const separator = document.createElement('span');
      separator.textContent = '/';
      separator.style.margin = '0 4px';
      separator.style.color = 'var(--color-text-muted)';
      dom.pageBreadcrumbs.appendChild(separator);

      currentPath = currentPath ? currentPath + '/' + part : part;

      const crumb = document.createElement('span');
      crumb.className = 'breadcrumb-item';

      if (i === parts.length - 1) {
        crumb.textContent = part.replace('.md', '');
        crumb.style.color = 'var(--color-text)';
        crumb.style.fontWeight = '500';
      } else {
        crumb.textContent = part;
        crumb.style.color = 'var(--color-accent-purple-deep)';
        crumb.style.cursor = 'pointer';
      }

      dom.pageBreadcrumbs.appendChild(crumb);
    }
  }

  function setupHeadingNavigation() {
    if (!dom.markdownContent) return;

    const oldHeadings = dom.markdownContent.querySelectorAll('.heading-clickable');
    oldHeadings.forEach(h => {
      h.classList.remove('heading-clickable');
      h.style.cursor = '';
    });

    const headings = dom.markdownContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(heading => {
      heading.classList.add('heading-clickable');
      heading.style.cursor = 'pointer';
      heading.style.position = 'relative';

      heading.addEventListener('mouseenter', () => {
        heading.style.borderLeft = '3px solid var(--color-accent-purple)';
        heading.style.paddingLeft = '8px';
        heading.style.marginLeft = '-11px';
      });

      heading.addEventListener('mouseleave', () => {
        heading.style.borderLeft = '';
        heading.style.paddingLeft = '';
        heading.style.marginLeft = '';
      });

      heading.addEventListener('click', () => {
        const id = heading.id;
        if (id) {
          window.location.hash = '#' + id;

          const indexItems = dom.indexTree.querySelectorAll('.index-item');
          indexItems.forEach(item => {
            if (item.dataset.id === id) {
              setActiveIndexItem(item);
            }
          });
        }
      });
    });
  }

  window.MarkdownPreview.markdown = {
    loadMarkdownFile,
    renderMarkdown,
    interceptLinks,
    simplifyPath,
    extractAndRenderIndex,
    renderIndex,
    setActiveIndexItem,
    updateEditButton,
    parseFrontmatter,
    updateBreadcrumbs,
    setupHeadingNavigation,
    calculateReadingTime,
    renderWithPlugins
  };
})();
