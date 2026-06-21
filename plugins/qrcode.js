// Simple QR Code Generator Plugin
// Uses external APIs with fallback to local simple QR-like visualization

(function() {
  console.log('[QRCode] Plugin script loading...');
  
  const plugin = {
    name: 'qrcode',
    description: 'QR Code generator',

    test: function(code, language) {
      console.log('[QRCode] test called, language:', language, 'code:', code.substring(0, 30));
      return language === 'qrcode';
    },

    render: function(code, container) {
      console.log('[QRCode] render called!');
      container.innerHTML = '';
      container.className = 'qrcode-container';
      container.style.margin = '1.5em 0';
      container.style.padding = '1.5em';
      container.style.background = 'var(--color-surface)';
      container.style.borderRadius = '12px';
      container.style.border = '1px solid var(--color-border)';
      container.style.textAlign = 'center';

      let data = code.trim();
      let size = 256;

      try {
        const parsed = JSON.parse(code);
        data = parsed.data || code;
        size = parsed.size || 256;
      } catch (e) {
        // Not JSON, use as raw text
      }

      // Create container for QR image
      const qrContainer = document.createElement('div');
      qrContainer.style.margin = '0 auto';
      qrContainer.style.width = size + 'px';
      qrContainer.style.height = size + 'px';
      qrContainer.style.display = 'inline-block';
      
      container.appendChild(qrContainer);
      
      // Try multiple QR APIs in sequence
      let apiIndex = 0;
      const apiEndpoints = [
        (d, s) => `https://api.qrserver.com/v1/create-qr-code/?size=${s}x${s}&data=${encodeURIComponent(d)}`,
        (d, s) => `https://chart.googleapis.com/chart?chs=${s}x${s}&cht=qr&chl=${encodeURIComponent(d)}`
      ];
      
      function tryNextApi() {
        if (apiIndex < apiEndpoints.length) {
          const img = document.createElement('img');
          img.src = apiEndpoints[apiIndex](data, size);
          img.style.width = size + 'px';
          img.style.height = size + 'px';
          img.style.display = 'block';
          
          img.onload = function() {
            qrContainer.innerHTML = '';
            qrContainer.appendChild(img);
          };
          
          img.onerror = function() {
            apiIndex++;
            tryNextApi();
          };
          
          // Start with loading indicator
          if (qrContainer.childNodes.length === 0) {
            drawFallbackQR(qrContainer, data, size);
          }
        }
      }
      
      // Start with fallback
      drawFallbackQR(qrContainer, data, size);
      
      // Try APIs
      tryNextApi();

      // Add content text below
      const textDiv = document.createElement('div');
      textDiv.style.marginTop = '1em';
      textDiv.style.color = 'var(--color-text-secondary)';
      textDiv.style.fontSize = '0.875em';
      textDiv.textContent = data.length > 100 ? data.substring(0, 97) + '...' : data;
      container.appendChild(textDiv);
    }
  };

  // Register the plugin - wait for plugins system to be ready
  console.log('[QRCode] Registering plugin...');
  window.MarkdownPreview = window.MarkdownPreview || {};
  window.MarkdownPreview.plugins = window.MarkdownPreview.plugins || {};
  
  function tryRegister() {
    if (window.MarkdownPreview.plugins && typeof window.MarkdownPreview.plugins.register === 'function') {
      console.log('[QRCode] Register function available, registering now');
      window.MarkdownPreview.plugins.register(plugin);
      console.log('[QRCode] Plugin registered!');
    } else {
      console.log('[QRCode] Register function NOT available, waiting...');
      setTimeout(tryRegister, 10);
    }
  }
  
  tryRegister();
})();

function drawFallbackQR(container, data, size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  canvas.style.display = 'block';
  container.innerHTML = '';
  container.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  const modules = 25;
  const moduleSize = size / modules;
  
  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  
  // Draw 3 position patterns
  drawPositionPattern(ctx, 0, 0, moduleSize);
  drawPositionPattern(ctx, modules - 7, 0, moduleSize);
  drawPositionPattern(ctx, 0, modules - 7, moduleSize);
  
  // Draw timing patterns
  for (let i = 8; i < modules - 8; i++) {
    if (i % 2 === 0) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(i * moduleSize, 6 * moduleSize, moduleSize, moduleSize);
      ctx.fillRect(6 * moduleSize, i * moduleSize, moduleSize, moduleSize);
    }
  }
  
  // Fill with random-looking but consistent data
  ctx.fillStyle = '#000000';
  const hash = simpleHash(data);
  for (let i = 0; i < modules; i++) {
    for (let j = 0; j < modules; j++) {
      // Skip position patterns and timing pattern
      if (isInPositionPattern(i, j, modules) || (i === 6 && j > 7 && j < modules - 8) || (j === 6 && i > 7 && i < modules - 8)) {
        continue;
      }
      
      // Pseudo-random based on data hash
      if ((hash(i, j) % 2) === 0) {
        ctx.fillRect(j * moduleSize, i * moduleSize, moduleSize, moduleSize);
      }
    }
  }
}

function drawPositionPattern(ctx, x, y, moduleSize) {
  // Outer square
  ctx.fillStyle = '#000000';
  ctx.fillRect(x * moduleSize, y * moduleSize, 7 * moduleSize, 7 * moduleSize);
  
  // Middle white
  ctx.fillStyle = '#ffffff';
  ctx.fillRect((x + 1) * moduleSize, (y + 1) * moduleSize, 5 * moduleSize, 5 * moduleSize);
  
  // Inner black
  ctx.fillStyle = '#000000';
  ctx.fillRect((x + 2) * moduleSize, (y + 2) * moduleSize, 3 * moduleSize, 3 * moduleSize);
}

function isInPositionPattern(i, j, modules) {
  // Top-left
  if (i < 7 && j < 7) return true;
  // Top-right
  if (i < 7 && j >= modules - 7 && j < modules) return true;
  // Bottom-left
  if (i >= modules - 7 && i < modules && j < 7) return true;
  return false;
}

function simpleHash(data) {
  // Create a simple hash function
  let h = 0;
  for (let i = 0; i < data.length; i++) {
    h = ((h << 5) - h) + data.charCodeAt(i);
    h = h & h; // Convert to 32bit integer
  }
  return function(i, j) {
    let val = h;
    val = ((val << 5) - val) + i;
    val = ((val << 5) - val) + j;
    return Math.abs(val);
  };
}
