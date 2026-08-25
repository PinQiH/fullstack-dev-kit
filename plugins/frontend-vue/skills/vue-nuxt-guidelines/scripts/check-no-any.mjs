import fs from 'fs';
import path from 'path';

const SRC_DIR = path.resolve(process.cwd(), 'src');

if (!fs.existsSync(SRC_DIR)) {
  console.log(`[SKIPPED] Directory not found: ${SRC_DIR}`);
  process.exit(0);
}

let anyCount = 0;

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (file !== '__tests__' && file !== 'node_modules') {
        scanDirectory(fullPath);
      }
    } else if (file.endsWith('.ts') && !file.endsWith('.spec.ts') && !file.endsWith('.test.ts')) {
      checkFile(fullPath);
    }
  }
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const relativePath = path.relative(process.cwd(), filePath);
  
  lines.forEach((line, index) => {
    // 簡單的 regex 檢查 `: any` 或 `as any`，排除註解行
    if (!line.trim().startsWith('//')) {
      if (/:\s*any\b/.test(line) || /\bas\s+any\b/.test(line)) {
        console.warn(`[WARNING] ${relativePath}:${index + 1} -> 發現 'any' 型別使用`);
        console.warn(`    ${line.trim()}`);
        anyCount++;
      }
    }
  });
}

console.log('--- 掃描 TypeScript any 使用 ---');
scanDirectory(SRC_DIR);

if (anyCount > 0) {
  console.log(`\n⚠️ 總計發現 ${anyCount} 個 'any'。請逐步替換為 'unknown' 或定義明確型別。`);
} else {
  console.log('\n✅ 恭喜！開發原始碼中沒有發現任何 any！🎉');
}
