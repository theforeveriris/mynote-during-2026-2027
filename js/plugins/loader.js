(function() {
  console.log('[PluginLoader] Loading...');
  window.MarkdownPreview = window.MarkdownPreview || {};
  
  const pluginRegistry = new Map();
  console.log('[PluginLoader] Plugin system initialized');
  
  function registerPlugin(plugin) {
    console.log('[PluginLoader] registerPlugin called, plugin:', plugin);
    if (!plugin.name) {
      console.error('Plugin must have a name property');
      return false;
    }
    
    if (typeof plugin.test !== 'function') {
      console.error(`Plugin ${plugin.name} must have a test function`);
      return false;
    }
    
    if (typeof plugin.render !== 'function') {
      console.error(`Plugin ${plugin.name} must have a render function`);
      return false;
    }
    
    pluginRegistry.set(plugin.name, plugin);
    console.log(`[PluginLoader] Plugin registered: ${plugin.name}`);
    console.log('[PluginLoader] Current registry:', Array.from(pluginRegistry.keys()));
    return true;
  }
  
  function unregisterPlugin(name) {
    return pluginRegistry.delete(name);
  }
  
  function getPlugin(name) {
    return pluginRegistry.get(name);
  }
  
  function getAllPlugins() {
    return Array.from(pluginRegistry.values());
  }
  
  function findPlugin(code, language) {
    for (const plugin of pluginRegistry.values()) {
      try {
        if (plugin.test(code, language)) {
          return plugin;
        }
      } catch (e) {
        console.error(`Plugin ${plugin.name} test error:`, e);
      }
    }
    return null;
  }
  
  async function loadPlugin(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load plugin: ${response.status}`);
      }
      
      const code = await response.text();
      const blob = new Blob([code], { type: 'application/javascript' });
      const moduleUrl = URL.createObjectURL(blob);
      
      const module = await import(moduleUrl);
      const plugin = module.default || module;
      
      registerPlugin(plugin);
      return plugin;
    } catch (error) {
      console.error(`Failed to load plugin from ${url}:`, error);
      return null;
    }
  }
  
  async function autoLoadPlugins() {
    console.log('[Plugins] Starting auto-load');
    try {
      const response = await fetch('plugins/');
      if (!response.ok) {
        console.warn('[Plugins] Directory fetch failed:', response.status);
        return;
      }
      
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const links = doc.querySelectorAll('a[href$=".js"]');
      
      console.log('[Plugins] Found plugin files:', links.length);
      
      const loadPromises = [];
      links.forEach(link => {
        const href = link.getAttribute('href');
        if (href) {
          console.log('[Plugins] Loading:', href);
          loadPromises.push(loadPlugin('plugins/' + href));
        }
      });
      
      if (loadPromises.length > 0) {
        await Promise.allSettled(loadPromises);
        console.log(`[Plugins] Loaded ${pluginRegistry.size} plugins from plugins/ directory`);
        console.log('[Plugins] Available plugins:', Array.from(pluginRegistry.keys()));
      }
    } catch (error) {
      console.warn('[Plugins] Auto plugin loading skipped:', error.message);
    }
  }

  window.MarkdownPreview.plugins = {
    register: registerPlugin,
    unregister: unregisterPlugin,
    get: getPlugin,
    getAll: getAllPlugins,
    find: findPlugin,
    load: loadPlugin,
    autoLoad: autoLoadPlugins,
    _registry: pluginRegistry
  };
})();
