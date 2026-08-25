import fs from 'fs';
import path from 'path';

const SRC_DIR = path.resolve(process.cwd(), 'src/service');

if (!fs.existsSync(SRC_DIR)) {
  console.log(`[SKIPPED] Directory not found: ${SRC_DIR}`);
  process.exit(0);
}

let hasErrors = false;
let hasWarnings = false;

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else if (file.endsWith('.js') || file.endsWith('.ts')) {
      checkFile(fullPath);
    }
  }
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(process.cwd(), filePath);
  
  // 1. 偵測 export default
  if (/export\s+default\s+/.test(content)) {
    console.error(`[ERROR] ${relativePath}: 禁止使用 export default，應使用具名匯出 (Named Export)`);
    hasErrors = true;
  }

  // 2. 偵測函式不符合 get/post/put/delete 開頭
  const exportFuncRegex = /export\s+(async\s+)?function\s+([a-zA-Z0-9_]+)/g;
  let match;
  while ((match = exportFuncRegex.exec(content)) !== null) {
    const funcName = match[2];
    if (!/^(get|post|put|delete)/.test(funcName)) {
      console.warn(`[WARNING] ${relativePath}: 函式 '${funcName}' 命名不符合 get/post/put/delete 開頭規範`);
      hasWarnings = true;
    }
    
    // 3. 偵測 JSDoc
    // 反向尋找函式宣告前的 JSDoc
    const beforeFunc = content.substring(0, match.index);
    if (!/\/\*\*[\s\S]*?\*\//.test(beforeFunc.slice(-300))) {
      console.warn(`[WARNING] ${relativePath}: 函式 '${funcName}' 缺少 JSDoc (需包含 @param 與 @returns)`);
      hasWarnings = true;
    }
  }
  
  // 檢查 class 形式的 export
  const exportClassFuncRegex = /static\s+(async\s+)?([a-zA-Z0-9_]+)\s*\(/g;
  while ((match = exportClassFuncRegex.exec(content)) !== null) {
    const funcName = match[2];
    if (!/^(get|post|put|delete|fetch)/.test(funcName)) { // fetch 保留作為特例
      console.warn(`[WARNING] ${relativePath}: 靜態方法 '${funcName}' 命名不符合 get/post/put/delete 開頭規範`);
      hasWarnings = true;
    }
  }
}

console.log('--- 掃描 Service 結構與規範 ---');
scanDirectory(SRC_DIR);

if (hasErrors) {
  console.error('\n❌ 掃描失敗：發現違反強制規範的項目。');
  process.exit(1);
} else if (hasWarnings) {
  console.log('\n⚠️ 掃描完成：發現部分警告，建議抽空修正。');
} else {
  console.log('\n✅ 掃描完美通過！🎉');
}
