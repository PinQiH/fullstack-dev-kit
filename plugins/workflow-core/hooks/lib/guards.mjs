// =============================================================================
// guards.mjs — PreToolUse 的純函式檢查（不碰檔案系統，方便測試）
//
// - 機密檔：讀、寫、搜尋、shell 指令引用
// - 高風險指令：force push、刪除遠端分支、reset --hard、rm -rf、DROP TABLE
// - 寫入內容：疑似 API Key、JWT、AWS Key、私鑰、hardcode 密碼
// =============================================================================

import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { parseCommand, commandOf, nestedScript, normalizeName } from './shell.mjs';

// @ `.env.example` 等範本檔只放鍵名，需要能讀，才能列出鍵名請使用者填值。
const ENV_TEMPLATE = /^\.env\.(example|sample|template|dist|defaults?|schema)(\..*)?$/;
const SECRET_NAMES = new Set([
	'.netrc', '.pgpass', 'credentials', 'credentials.json', '.credentials.json',
	'secrets.json', 'secret.json', 'secrets.yaml', 'secrets.yml',
]);

// - 只看檔名判斷是否為機密檔。
export function isSecretPath(path) {
	const base = String(path ?? '').split(/[\\/]/).pop().replace(/[:,]+$/, '').toLowerCase();
	if (!base) return false;
	if (base === '.env' || base === '.envrc') return true;
	if (base.startsWith('.env.')) return !ENV_TEMPLATE.test(base);
	if (/\.(pem|key|pfx|p12)$/.test(base)) return true;
	if (/^id_(rsa|ed25519|ecdsa|dsa)$/.test(base)) return true;
	return SECRET_NAMES.has(base);
}

// - 展開一層大括號：`{.env,.env.local}` → 兩個候選。
function expandBraces(pattern) {
	const match = pattern.match(/\{([^{}]*)\}/);
	if (!match) return [pattern];
	return match[1].split(',').flatMap((option) => expandBraces(pattern.replace(match[0], option)));
}

// - 判斷 glob pattern 是否在找機密檔。
export function isSecretGlob(pattern) {
	const text = String(pattern ?? '').replace(/\\/g, '/').toLowerCase();
	if (!text) return false;
	return expandBraces(text).some((candidate) => {
		const last = candidate.split('/').pop();
		if (isSecretPath(last)) return true;
		if (ENV_TEMPLATE.test(last)) return false;
		if (/^\.env/.test(last) || /\*\.env(\*|$)/.test(last)) return true;
		if (/id_(rsa|ed25519|ecdsa|dsa)/.test(last)) return true;
		if (/^\*?(credentials|secrets?)(\.|\*|$)/.test(last)) return true;
		return /\.(pem|key|pfx|p12)\*?$/.test(last);
	});
}

// - 判斷 shell token 是否引用機密檔（含 `fs.readFileSync('.env')` 這類寫法）。
function secretInToken(token) {
	return String(token).split(/[\s=(),'"`<>;|{}[\]]+/).some((piece) => {
		if (!piece) return false;
		if (/[*?]/.test(piece)) return isSecretGlob(piece);
		return isSecretPath(piece);
	});
}

// @ 只列出檔名、不讀內容的指令，引用 .env 也放行。
const LISTING = new Set(['ls', 'dir', 'test', '[', '[[', 'stat', 'file', 'test-path', 'get-childitem', 'gci']);
// @ 只輸出字串的指令：只檢查重新導向的目標（`echo x > .env`）。
const PRINTING = new Set(['echo', 'printf', 'write-host', 'write-output', 'write-error', 'write-information']);
// @ 搜尋指令的 pattern 不是檔名（`grep ".env" README.md`）。
const SEARCHING = new Set(['grep', 'egrep', 'fgrep', 'rg', 'ag', 'ack', 'findstr', 'select-string', 'sls']);
const SEARCH_VALUE_FLAGS = new Set(['-A', '-B', '-C', '-m', '--max-count', '-g', '--glob', '-t', '--type', '-f', '--file', '-Path', '-Include', '-Exclude']);
// @ 這些參數的值是說明文字（commit 訊息、PR 內文），不是檔名。
const MESSAGE_FLAGS = new Set(['-m', '--message', '--body', '-b', '--title', '-t', '--notes']);
const DB_CLIENTS = new Set(['psql', 'pgcli', 'mysql', 'mycli', 'mariadb', 'sqlite3', 'sqlcmd', 'invoke-sqlcmd', 'mongosh', 'mongo', 'clickhouse-client', 'cockroach']);
const DESTRUCTIVE_SQL = /\b(drop\s+(table|database|schema)|truncate\s+(table\s+)?[\w"`[]|dropdatabase\s*\()/i;
const RM_NAMES = new Set(['rm', 'remove-item', 'ri', 'del', 'erase', 'rd', 'rmdir']);
const CD_NAMES = new Set(['cd', 'chdir', 'pushd', 'set-location', 'sl']);
const DANGEROUS_TARGETS = new Set(['', '~', '.', '..', '*', '/*', '~/*', './*', 'src', './src', '$home', '$pwd', '${pwd}', '$(pwd)', 'c:', 'c:/*']);

// - 找出段落中需要檢查的參數。
function tokensToCheck(name, args) {
	const redirects = args.filter((_, index) => args[index - 1] === '>' || args[index - 1] === '<');
	if (LISTING.has(name) || PRINTING.has(name)) return redirects;
	const checked = [];
	let patternSeen = false;
	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (MESSAGE_FLAGS.has(arg)) {
			i++;
			continue;
		}
		if ([...MESSAGE_FLAGS].some((flag) => flag.startsWith('--') && arg.startsWith(`${flag}=`))) continue;
		if (SEARCHING.has(name)) {
			if (arg === '-e' || arg === '--regexp' || /^-pattern$/i.test(arg)) {
				patternSeen = true;
				i++;
				continue;
			}
			if (SEARCH_VALUE_FLAGS.has(arg)) {
				checked.push(args[++i] ?? '');
				continue;
			}
			if (!arg.startsWith('-') && arg !== '>' && arg !== '<' && !patternSeen) {
				patternSeen = true;
				continue;
			}
		}
		checked.push(arg);
	}
	return checked;
}

// - 拆出 git 的全域參數（`-C path`、`-c key=value`）與子指令。
export function parseGit(args) {
	let i = 0;
	let directory = null;
	while (i < args.length && args[i].startsWith('-')) {
		const arg = args[i];
		if (arg === '-C') {
			directory = args[i + 1];
			i += 2;
		} else if (['-c', '--git-dir', '--work-tree', '--namespace'].includes(arg)) i += 2;
		else i++;
	}
	return { sub: args[i] ?? '', rest: args.slice(i + 1), directory };
}

const shortFlag = (arg, letter) => /^-[a-zA-Z]+$/.test(arg) && arg.includes(letter);

function checkGit(rest, sub) {
	if (sub === 'push') {
		if (rest.some((arg) => arg === '--force' || shortFlag(arg, 'f') || (arg.startsWith('+') && arg.length > 1))) {
			return 'git push --force 可能覆蓋他人的遠端提交，屬於破壞性操作。需要時請改用 --force-with-lease，或請使用者手動執行。';
		}
		if (rest.some((arg) => arg === '--delete' || shortFlag(arg, 'd') || (arg.startsWith(':') && arg.length > 1))) {
			return '偵測到刪除遠端分支的指令（git push --delete 或 git push origin :branch），此操作不可逆。';
		}
	}
	if (sub === 'reset' && rest.includes('--hard')) {
		return 'git reset --hard 會永久丟棄未提交的變更，請先確認工作區已備份。';
	}
	return null;
}

function checkRemove(name, args, flavor) {
	if (!RM_NAMES.has(name)) return null;
	if (flavor === 'bash' && name !== 'rm') return null;
	const recursive = args.some((arg) => arg === '--recursive' || shortFlag(arg, 'r') || shortFlag(arg, 'R')
		|| (/^-r/i.test(arg) && '-recurse'.startsWith(arg.toLowerCase())));
	if (!recursive) return null;
	const target = args.find((arg) => {
		if (arg.startsWith('-')) return false;
		const normalized = arg.replace(/\\/g, '/').toLowerCase().replace(/\/+$/, '');
		return DANGEROUS_TARGETS.has(normalized);
	});
	return target === undefined ? null : `偵測到高風險的遞迴刪除（目標：${target}），可能影響整個專案或系統目錄。`;
}

function changeDirectory(current, args) {
	if (args.includes('-')) return current;
	const target = args.find((arg) => !arg.startsWith('-'));
	if (target === undefined || target === '~') return homedir();
	return resolve(current, target.replace(/^~(?=[\\/])/, homedir()));
}

/**
 * 分析 Bash／PowerShell 指令。
 * @returns {{ reason: string } | { commits: { cwd: string, all: boolean }[] }}
 */
export function analyzeShell(command, { flavor = 'bash', cwd = process.cwd() } = {}) {
	const segments = parseCommand(command, flavor);
	const pipelines = new Map();
	const commits = [];
	let directory = cwd;

	for (const segment of segments) {
		const { name, args } = commandOf(segment.tokens);
		if (!name) continue;

		// > 機密檔引用（巢狀 shell 的內層指令另外分析，外層只看重新導向）
		const nested = nestedScript(segment);
		const candidates = nested ? args.filter((_, index) => args[index - 1] === '>' || args[index - 1] === '<') : tokensToCheck(name, args);
		const isGitCheckIgnore = name === 'git' && parseGit(args).sub === 'check-ignore';
		const secret = isGitCheckIgnore ? undefined : candidates.find(secretInToken);
		if (secret !== undefined) {
			return { reason: `禁止透過指令讀取或寫入機密檔（${secret}）。需要環境變數時，請列出鍵名、格式與檔案位置，由使用者自行填寫。` };
		}

		if (name === 'git') {
			const { sub, rest, directory: gitDirectory } = parseGit(args);
			const reason = checkGit(rest, sub);
			if (reason) return { reason };
			if (sub === 'commit' && !rest.some((arg) => arg === '--no-verify' || arg === '-n' || arg === '--dry-run')) {
				const all = rest.some((arg) => arg === '--all' || shortFlag(arg, 'a'));
				commits.push({ cwd: gitDirectory ? resolve(directory, gitDirectory) : directory, all });
			}
		}

		const removeReason = checkRemove(name, args, segment.flavor);
		if (removeReason) return { reason: removeReason };

		if (CD_NAMES.has(name)) directory = changeDirectory(directory, args);

		// > SQL 只在資料庫用戶端參與的管線中才算數；單純搜尋字串不擋
		const entry = pipelines.get(segment.pipeline) ?? { database: false, text: [] };
		if (segment.tokens.some((token) => DB_CLIENTS.has(normalizeName(token)))
			|| (name === 'typeorm' && args.includes('query'))
			|| (name === 'prisma' && args.includes('execute'))) entry.database = true;
		entry.text.push(segment.tokens.join(' '));
		pipelines.set(segment.pipeline, entry);
	}

	for (const { database, text } of pipelines.values()) {
		if (database && DESTRUCTIVE_SQL.test(text.join(' '))) {
			return { reason: '偵測到資料庫破壞性指令（DROP / TRUNCATE），禁止自動執行。' };
		}
	}
	return { commits };
}

// @ 值本身看起來是範例或變數引用時不算機密。
const PLACEHOLDER = /fake|dummy|example|placeholder|changeme|change-me|your[_-]|xxx|sample|test|<[^>]*>|\$\{|process\.env|import\.meta\.env|os\.environ/i;
const TEST_PATH = /(^|[\\/])(tests?|__tests__|__mocks__|mocks?|fixtures?)[\\/]|\.(test|spec)\.|mock/i;
const SECRET_RULES = [
	{ pattern: /\b(api[_-]?key|apikey)\s*[:=]\s*['"]?[A-Za-z0-9_-]{20,}/gi, message: '疑似 API Key 字串', skipInTests: false },
	{ pattern: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, message: '疑似 JWT Token', skipInTests: true },
	{ pattern: /AKIA[A-Z0-9]{16}/g, message: '疑似 AWS Access Key ID', skipInTests: false },
	{ pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g, message: '疑似私鑰（PEM 格式）', skipInTests: false, always: true },
	{ pattern: /\bpassword\s*[:=]\s*['"][^'"\n]{6,}['"]/gi, message: '疑似 hardcode 密碼', skipInTests: true, skipInDocs: true },
];

/**
 * 掃描即將寫入的內容。
 * @returns {string[]} 發現的問題；空陣列代表沒問題
 */
export function scanSecrets(content, filePath = '') {
	const text = String(content ?? '');
	if (!text || /\.(png|jpe?g|gif|ico|woff2?|ttf|lock|xsd|jsonl|svg)$/i.test(filePath)) return [];
	const inTests = TEST_PATH.test(filePath);
	const inDocs = /\.(md|mdx|txt|rst)$/i.test(filePath);
	const findings = [];
	for (const rule of SECRET_RULES) {
		if ((rule.skipInTests && inTests) || (rule.skipInDocs && inDocs)) continue;
		const hit = [...text.matchAll(rule.pattern)].some((match) => rule.always || !PLACEHOLDER.test(match[0]));
		if (hit) findings.push(rule.message);
	}
	return findings;
}

/**
 * 依工具類型分派檢查。
 * @returns {{ reason?: string, commits?: { cwd: string, all: boolean }[] }}
 */
export function checkToolUse(toolName, input = {}, cwd = process.cwd()) {
	switch (toolName) {
		case 'Bash':
			return analyzeShell(input.command, { flavor: 'bash', cwd });
		case 'PowerShell':
			return analyzeShell(input.command, { flavor: 'powershell', cwd });
		case 'Read':
			return isSecretPath(input.file_path) ? { reason: `禁止讀取機密檔案（${input.file_path}）。需要特定環境變數時，請向使用者詢問。` } : {};
		case 'Glob':
		case 'Grep':
			if (isSecretGlob(input.pattern && toolName === 'Glob' ? input.pattern : '') || isSecretGlob(input.glob) || isSecretPath(input.path)) {
				return { reason: '禁止搜尋或列出機密檔案（.env、私鑰、憑證）。即使不讀內容，路徑本身也屬敏感資訊。' };
			}
			return {};
		case 'Write':
		case 'Edit':
		case 'MultiEdit':
		case 'NotebookEdit': {
			const filePath = input.file_path ?? input.notebook_path ?? '';
			if (isSecretPath(filePath)) {
				return { reason: `禁止寫入機密檔案（${filePath}）。請列出需要的鍵名與格式，由使用者自行填寫。` };
			}
			const content = [input.content, input.new_string, input.new_source, ...(input.edits ?? []).map((edit) => edit.new_string)]
				.filter((value) => typeof value === 'string').join('\n');
			const findings = scanSecrets(content, filePath);
			if (findings.length > 0) {
				return { reason: `寫入內容含有${findings.join('、')}（${filePath}）。請改用環境變數（例如 process.env.XXX）；若是測試假資料，請在值中加上 fake、example 等明顯標記。` };
			}
			return {};
		}
		default:
			return {};
	}
}
