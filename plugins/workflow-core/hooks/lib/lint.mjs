// =============================================================================
// lint.mjs — 寫入檔案後，用專案既有的 linter 檢查
//
// - JS／TS／Vue → ESLint：從檔案目錄往上找最近的設定檔與 eslint 套件，
//   不帶 -c，讓 ESLint 自己讀設定（支援 monorepo 與 ESLint 9 flat config）
// - Python → ruff（優先）或 flake8：往上找 venv，支援 bin/ 與 Windows 的 Scripts/
// - 找不到 linter、設定錯誤或 linter 自己當掉都靜默放行，不干擾工作
// =============================================================================

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

const JS_FILE = /\.(js|ts|cjs|mjs|cts|mts|jsx|tsx|vue)$/;
const TEST_FILE = /\.(test|spec)\.|[\\/]__tests__[\\/]|[\\/]tests?[\\/]/;
const ESLINT_CONFIGS = [
	'eslint.config.js', 'eslint.config.mjs', 'eslint.config.cjs', 'eslint.config.ts', 'eslint.config.mts', 'eslint.config.cts',
	'.eslintrc.js', '.eslintrc.cjs', '.eslintrc.json', '.eslintrc.yml', '.eslintrc.yaml', '.eslintrc',
];
const MAX_LINES = 30;

// - 從 start 往上找，回傳第一個讓 match 成立的目錄。
function findUp(start, match) {
	let directory = start;
	for (;;) {
		const found = match(directory);
		if (found) return found;
		const parent = dirname(directory);
		if (parent === directory) return null;
		directory = parent;
	}
}

function run(command, args, cwd) {
	const result = spawnSync(command, args, { cwd, encoding: 'utf8', timeout: 60_000, maxBuffer: 8 * 1024 * 1024 });
	if (result.error) return null;
	return { status: result.status, output: `${result.stdout ?? ''}${result.stderr ?? ''}`.trim() };
}

const truncate = (text) => text.split('\n').slice(0, MAX_LINES).join('\n');

function lintJavaScript(filePath) {
	const configDirectory = findUp(dirname(filePath), (directory) => (ESLINT_CONFIGS.some((name) => existsSync(join(directory, name))) ? directory : null));
	if (!configDirectory) return null;
	const eslint = findUp(configDirectory, (directory) => {
		const bin = join(directory, 'node_modules', 'eslint', 'bin', 'eslint.js');
		return existsSync(bin) ? bin : null;
	});
	if (!eslint) return null;
	const result = run(process.execPath, [eslint, '--quiet', filePath], configDirectory);
	// @ exit 1 = 有 lint 錯誤；exit 2 = 設定或執行錯誤，不是程式問題，不回報
	if (!result || result.status !== 1 || !result.output) return null;
	return `ESLint 發現問題：${filePath}\n${truncate(result.output)}`;
}

function findPythonTool(filePath, name) {
	const local = findUp(dirname(filePath), (directory) => {
		for (const venv of ['.venv', 'venv', 'env']) {
			for (const candidate of [join(directory, venv, 'bin', name), join(directory, venv, 'Scripts', `${name}.exe`)]) {
				if (existsSync(candidate)) return candidate;
			}
		}
		return null;
	});
	return local ?? name;
}

function lintPython(filePath) {
	for (const [name, args] of [['ruff', ['check', '--quiet']], ['flake8', []]]) {
		const result = run(findPythonTool(filePath, name), [...args, filePath], dirname(filePath));
		if (!result) continue;
		if (result.status === 0 || !result.output) return null;
		return `${name} 發現問題：${filePath}\n${truncate(result.output)}`;
	}
	return null;
}

/**
 * @returns {string | null} lint 問題；null 代表沒有問題或無法檢查
 */
export function lintFile(filePath) {
	if (!filePath || !existsSync(filePath) || TEST_FILE.test(filePath)) return null;
	if (JS_FILE.test(filePath)) return lintJavaScript(filePath);
	if (filePath.endsWith('.py')) return lintPython(filePath);
	return null;
}
