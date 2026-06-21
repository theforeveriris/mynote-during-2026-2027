#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'file-tree.json');

console.log('🔍 开始扫描 Markdown 文件...');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function buildTreeFromDirectory(dir, basePath = '') {
  const result = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  const folders = [];
  const files = [];
  
  // 分开处理文件和文件夹，以便排序
  items.forEach(item => {
    const itemPath = basePath ? `${basePath}/${item.name}` : item.name;
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      folders.push({ name: item.name, path: itemPath, fullPath });
    } else if (item.isFile() && item.name.endsWith('.md')) {
      files.push({ name: item.name, path: itemPath, fullPath });
    }
  });
  
  // 先处理文件夹
  folders.sort((a, b) => a.name.localeCompare(b.name));
  folders.forEach(folder => {
    const children = buildTreeFromDirectory(folder.fullPath, folder.path);
    if (children.length > 0) {
      result.push({
        name: folder.name,
        type: 'folder',
        children
      });
    }
  });
  
  // 再处理文件
  files.sort((a, b) => a.name.localeCompare(b.name));
  files.forEach(file => {
    result.push({
      name: file.name,
      type: 'file',
      path: file.path
    });
  });
  
  return result;
}

try {
  const rootDir = path.join(__dirname, '..');
  const fileTreeData = buildTreeFromDirectory(rootDir);
  
  // 输出 JSON 文件
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(fileTreeData, null, 2));
  
  console.log(`✅ 文件树构建成功！`);
  console.log(`📍 输出文件: ${OUTPUT_FILE}`);
  console.log(`📁 共找到 ${countFiles(fileTreeData)} 个 Markdown 文件`);
  
} catch (error) {
  console.error('❌ 构建文件树时出错:', error);
  process.exit(1);
}

function countFiles(tree) {
  let count = 0;
  tree.forEach(item => {
    if (item.type === 'file') {
      count++;
    } else if (item.type === 'folder' && item.children) {
      count += countFiles(item.children);
    }
  });
  return count;
}
