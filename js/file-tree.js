(function() {
  window.MarkdownPreview = window.MarkdownPreview || {};
  
  const { dom, state, CONFIG, search } = window.MarkdownPreview;
  
  async function loadFileTree() {
    try {
      // 首先尝试加载预构建的文件树
      const prebuiltUrl = './data/file-tree.json';
      let response = await fetch(prebuiltUrl);
      
      if (window.MarkdownPreview.debug && window.MarkdownPreview.debug.incrementApiCalls) {
        window.MarkdownPreview.debug.incrementApiCalls();
      }
      
      if (response.ok) {
        console.log('✅ 使用预构建的文件树');
        if (window.MarkdownPreview.debug && window.MarkdownPreview.debug.incrementCacheHits) {
          window.MarkdownPreview.debug.incrementCacheHits();
        }
        state.fileTreeData = await response.json();
        renderFileTree(state.fileTreeData);
        onFilesLoaded();
        return;
      } else {
        console.log('⚠️ 预构建文件不存在，使用 GitHub API');
        // 回退到 GitHub API
        await loadFileTreeFromGitHubAPI();
      }
    } catch (error) {
      console.error('⚠️ 加载预构建文件树失败，使用 GitHub API:', error);
      await loadFileTreeFromGitHubAPI();
    }
  }
  
  async function loadFileTreeFromGitHubAPI() {
    try {
      const apiUrl = `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/git/trees/main?recursive=1`;
      const response = await fetch(apiUrl);
      
      if (window.MarkdownPreview.debug && window.MarkdownPreview.debug.incrementApiCalls) {
        window.MarkdownPreview.debug.incrementApiCalls();
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch file tree from GitHub API: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      state.fileTreeData = buildTreeFromFlatList(data.tree);
      renderFileTree(state.fileTreeData);
      onFilesLoaded();
    } catch (error) {
      console.error('Error loading file tree:', error);
      dom.fileTree.innerHTML = '<div class="file-item" style="color: var(--color-text-muted);">无法加载文件列表，请检查网络或手动配置</div>';
    }
  }
  
  function buildTreeFromFlatList(tree) {
    const root = [];
    const map = {};
    
    tree.forEach(item => {
      if (item.type === 'blob' && item.path.endsWith('.md')) {
        const parts = item.path.split('/');
        let currentLevel = root;
        let pathSoFar = '';
        
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          if (i === parts.length - 1) {
            currentLevel.push({
              name: part,
              type: 'file',
              path: item.path
            });
          } else {
            pathSoFar = pathSoFar ? `${pathSoFar}/${part}` : part;
            let existingFolder = map[pathSoFar];
            if (!existingFolder) {
              existingFolder = {
                name: part,
                type: 'folder',
                children: []
              };
              map[pathSoFar] = existingFolder;
              currentLevel.push(existingFolder);
            }
            currentLevel = existingFolder.children;
          }
        }
      }
    });
    
    function sortTree(items) {
      items.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
      
      items.forEach(item => {
        if (item.type === 'folder' && item.children) {
          sortTree(item.children);
        }
      });
    }
    sortTree(root);
    return root;
  }
  
  function renderFileTree(files, container = dom.fileTree, level = 0) {
    files.forEach((item, index) => {
      if (item.type === 'folder') {
        const folderEl = document.createElement('div');
        folderEl.className = 'folder-item';
        folderEl.innerHTML = `
          <svg class="folder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 18l6-6-6-6"/>
          </svg>
          <span>${item.name}</span>
        `;
        
        const childrenEl = document.createElement('div');
        childrenEl.className = 'folder-children';
        
        folderEl.addEventListener('click', () => {
          folderEl.classList.toggle('expanded');
          childrenEl.classList.toggle('expanded');
        });
        
        container.appendChild(folderEl);
        renderFileTree(item.children || [], childrenEl, level + 1);
        container.appendChild(childrenEl);
        
        if (level === 0) {
          childrenEl.classList.add('expanded');
          folderEl.classList.add('expanded');
        }
      } else if (item.type === 'file' && item.name.endsWith('.md')) {
        const fileEl = document.createElement('a');
        fileEl.className = 'file-item';
        fileEl.href = '#';
        fileEl.textContent = item.name.replace('.md', '');
        fileEl.dataset.path = item.path;
        
        fileEl.addEventListener('click', (e) => {
          e.preventDefault();
          window.MarkdownPreview.markdown.loadMarkdownFile(item.path);
          setActiveFile(fileEl);
          closeSidebarOnMobile();
        });
        
        container.appendChild(fileEl);
      }
    });
  }
  
  function setActiveFile(fileEl) {
    document.querySelectorAll('.file-item.active').forEach(el => {
      el.classList.remove('active');
    });
    fileEl.classList.add('active');
  }
  
  function highlightFileInSidebar(path) {
    const fileItems = document.querySelectorAll('.file-item');
    fileItems.forEach(el => {
      if (el.dataset.path === path) {
        setActiveFile(el);
      }
    });
  }
  
  function toggleSidebar() {
    dom.sidebar.classList.toggle('open');
    dom.sidebarOverlay.classList.toggle('active');
  }
  
  function closeSidebar() {
    dom.sidebar.classList.remove('open');
    dom.sidebarOverlay.classList.remove('active');
  }
  
  function closeSidebarOnMobile() {
    if (window.innerWidth <= 768) {
      closeSidebar();
    }
  }
  
  function onFilesLoaded() {
    setTimeout(() => {
      if (search && search.buildIndex) search.buildIndex();
    }, 500);
    setTimeout(() => {
      if (window.MarkdownPreview.router && window.MarkdownPreview.router.onFileTreeLoaded) {
        window.MarkdownPreview.router.onFileTreeLoaded();
      }
    }, 100);
  }
  
  function getAllFilesInDFSOrder(files = state.fileTreeData) {
    const result = [];
    
    function traverse(items) {
      for (const item of items) {
        if (item.type === 'file' && item.name.endsWith('.md')) {
          result.push({ name: item.name.replace('.md', ''), path: item.path });
        } else if (item.type === 'folder' && item.children) {
          traverse(item.children);
        }
      }
    }
    
    traverse(files);
    return result;
  }
  
  function getAdjacentFiles(currentPath) {
    const allFiles = getAllFilesInDFSOrder();
    const currentIndex = allFiles.findIndex(f => f.path === currentPath);
    
    if (currentIndex === -1) {
      return { prev: null, next: null };
    }
    
    return {
      prev: currentIndex > 0 ? allFiles[currentIndex - 1] : null,
      next: currentIndex < allFiles.length - 1 ? allFiles[currentIndex + 1] : null
    };
  }

  window.MarkdownPreview.fileTree = {
    loadFileTree,
    loadFileTreeFromGitHubAPI,
    buildTreeFromFlatList,
    renderFileTree,
    setActiveFile,
    highlightFileInSidebar,
    toggleSidebar,
    closeSidebar,
    closeSidebarOnMobile,
    onFilesLoaded,
    getAllFilesInDFSOrder,
    getAdjacentFiles
  };
})();
