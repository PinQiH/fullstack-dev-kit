// =============================================================================
// commit-review.mjs — git commit 前要求自我審查
//
// 機制：
//   - 第一次 commit → 阻擋，列出 staged 變更與審查清單
//   - Claude 審查完畢後建立標記檔，標記檔放在 .git 內，不會被 commit
//   - 標記檔比所有 staged 檔案都新 → 放行並刪除標記
//   - staged 新增行含 debugger → 一律阻擋
// =============================================================================

import { spawnSync } from 'node:child_process';
import { existsSync, statSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';

const FLAG_NAME = 'claude-review-done';
const CODE_FILE = /\.(js|ts|jsx|tsx|mjs|cjs|vue|py|go)$/;
const SKIPPED_FILE = /\.(test|spec)\.|__tests__|(^|\/)package-lock\.json$|\.lock$/;

function git(cwd, args) {
	const result = spawnSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
	return result.status === 0 ? result.stdout : null;
}

const mtime = (path) => (existsSync(path) ? statSync(path).mtimeMs : 0);

// - 掃描新增行：debugger 阻擋，console.log 只提示。
function scanAddedLines(diff) {
	const blockers = [];
	const notices = [];
	let file = '';
	let line = 0;
	for (const row of diff.split('\n')) {
		if (row.startsWith('+++ ')) {
			file = row.replace(/^\+\+\+ (b\/)?/, '');
			continue;
		}
		const hunk = row.match(/^@@ -\d+(?:,\d+)? \+(\d+)/);
		if (hunk) {
			line = Number(hunk[1]);
			continue;
		}
		if (!row.startsWith('+') || !CODE_FILE.test(file) || SKIPPED_FILE.test(file)) continue;
		const code = row.slice(1);
		if (/^\s*debugger\s*;?\s*$/.test(code)) blockers.push(`${file}:${line}`);
		else if (/console\.(log|debug|dir|trace)\s*\(|print\(["']DEBUG/.test(code)) notices.push(`${file}:${line}`);
		line++;
	}
	return { blockers, notices };
}

/**
 * 檢查一次 git commit 是否已完成自我審查。
 * @param {{ cwd: string, all: boolean }} commit
 * @returns {string | null} 阻擋原因；null 代表放行
 */
export function reviewCommit({ cwd, all }) {
	const top = git(cwd, ['rev-parse', '--show-toplevel'])?.trim();
	if (!top) return null;
	const flagPath = git(top, ['rev-parse', '--git-path', FLAG_NAME])?.trim();
	if (!flagPath) return null;
	const flag = resolve(top, flagPath);

	// > `git commit -a` 會一併提交已追蹤檔案的修改
	let base = ['diff', '--cached'];
	if (all && git(top, ['rev-parse', '--verify', '--quiet', 'HEAD']) !== null) base = ['diff', 'HEAD'];
	const files = (git(top, [...base, '--name-only', '-z']) ?? '').split('\0').filter(Boolean);
	if (files.length === 0) {
		if (existsSync(flag)) unlinkSync(flag);
		return null;
	}

	const { blockers, notices } = scanAddedLines(git(top, [...base, '-U0', '--no-color']) ?? '');
	if (blockers.length > 0) {
		return [
			'staged 變更含有 debugger，請移除後重新 git add 再 commit：',
			...blockers.map((place) => `  - ${place}`),
		].join('\n');
	}

	const newest = Math.max(...files.map((file) => mtime(resolve(top, file))));
	if (existsSync(flag)) {
		const reviewed = mtime(flag) >= newest;
		unlinkSync(flag);
		if (reviewed) return null;
	}

	const stat = (git(top, [...base, '--stat']) ?? '').trimEnd();
	return [
		`commit 前請先完成自我審查（共 ${files.length} 個檔案）：`,
		stat,
		'',
		...(notices.length > 0 ? ['注意：新增了 console.log（不阻擋，確認是否要保留）：', ...notices.map((place) => `  - ${place}`), ''] : []),
		'審查清單：',
		'1. 安全性：SQL 參數化、XSS 跳脫、沒有 hardcode 的機密資訊',
		'2. 正確性：錯誤處理完整、沒有空的 catch、已處理 edge case',
		'3. 效能：沒有 N+1 查詢、沒有不必要的同步阻塞',
		'4. 可維護性：命名清楚、沒有殘留的 debug 輸出、註解符合 Todo-Tree 格式',
		'',
		'先向使用者回報審查發現，再建立標記檔並重新 commit：',
		`  Bash：touch "${flag}"`,
		`  PowerShell：New-Item -ItemType File -Force -Path "${flag}" | Out-Null`,
	].join('\n');
}
