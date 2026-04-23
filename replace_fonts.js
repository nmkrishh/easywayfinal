/* global require */
const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.css')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
const newFont = '-apple-system, BlinkMacSystemFont, sans-serif';
let count = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  content = content.replace(/'Syne',\s*sans-serif/g, newFont);
  content = content.replace(/'DM Sans',\s*sans-serif/g, newFont);
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    count++;
    console.log('Updated ' + file);
  }
});

console.log('Total files updated: ' + count);
