import { readFileSync, readdirSync, existsSync, statSync, realpathSync } from 'node:fs';
import { dirname, resolve, relative, sep, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

// @ 僅驗證本 repo 的封裝契約，不取代平台官方 schema 與實際載入測試。
const root = realpathSync(resolve(process.argv[2] ?? resolve(dirname(fileURLToPath(import.meta.url)), '..')));
const failures = [];
const check = (condition, message) => {
	if (!condition) failures.push(message);
};
const read = (path) => readFileSync(resolve(root, path), 'utf8').replace(/\r\n/g, '\n');
const json = (path) => JSON.parse(read(path));
const directories = (path) => readdirSync(resolve(root, path), { withFileTypes: true })
	.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();

// - 驗證路徑限制與檔案存在，避免錯把工作區外的資源當成可攜封裝。
function checkPath(base, target, label, directory = false) {
	const resolved = resolve(base, target);
	const path = existsSync(resolved) ? realpathSync(resolved) : resolved;
	const local = relative(root, path);
	const inside = !isAbsolute(local) && local !== '..' && !local.startsWith('..' + sep);
	check(inside, `${label}：資源必須位於 repository 內`);
	check(inside && existsSync(path) && (directory ? statSync(path).isDirectory() : statSync(path).isFile()), `${label}：找不到資源 ${target}`);
}

// - 只解析本 kit 使用的純量與折行 frontmatter；其他 YAML 語法交由官方驗證器。
function field(frontmatter, key) {
	const match = frontmatter.match(new RegExp(`^${key}:[ \\t]*([^\\n]*)(?:\\n((?:[ \\t]+[^\\n]*(?:\\n|$))*))?`, 'm'));
	if (!match) return '';
	const value = /^[>|][-+]?$/.test(match[1]) ? (match[2] ?? '').trim() : match[1].trim();
	return value.replace(/^(['"])(.*)\1$/, '$2').trim();
}

try {
	const claude = json('.claude-plugin/marketplace.json');
	const codex = json('.agents/plugins/marketplace.json');
	const names = directories('plugins');
	check(claude.name === codex.name, '兩個 marketplace 名稱不一致');
	for (const [platform, marketplace] of [['Claude', claude], ['Codex', codex]]) {
		check(JSON.stringify(marketplace.plugins.map((plugin) => plugin.name).sort()) === JSON.stringify(names), `${platform} marketplace 的 plugin 清單與目錄不一致或重複`);
	}
	let skillCount = 0;
	for (const name of names) {
		const base = `plugins/${name}`;
		const claudePlugin = json(`${base}/.claude-plugin/plugin.json`);
		const codexPlugin = json(`${base}/.codex-plugin/plugin.json`);
		const claudeEntry = claude.plugins.find((entry) => entry.name === name);
		const codexEntry = codex.plugins.find((entry) => entry.name === name);
		check(claudePlugin.name === name && codexPlugin.name === name, `${name}：manifest 名稱不一致`);
		check(claudeEntry?.source === `./${base}`, `${name}：Claude source 不一致`);
		check(codexEntry?.source?.source === 'local' && codexEntry.source.path === `./${base}`, `${name}：Codex source 不一致`);
		check(claudeEntry?.version === claudePlugin.version, `${name}：Claude 版本不一致`);
		check(typeof codexPlugin.version === 'string' && codexPlugin.version.split('+')[0] === claudePlugin.version, `${name}：跨平台基礎版本不一致`);
		check(codexPlugin.skills === './skills/', `${name}：Codex 必須使用共用 skills 目錄`);
		const skills = directories(`${base}/skills`);
		check(skills.length > 0, `${name}：沒有 skill`);
		for (const skill of skills) {
			const path = `${base}/skills/${skill}/SKILL.md`;
			const content = read(path);
			const frontmatter = content.match(/^---\n([\s\S]*?)\n---(?:\n|$)/)?.[1] ?? '';
			check(field(frontmatter, 'name') === skill && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(skill) && skill.length <= 64, `${path}：name 與目錄不一致或格式錯誤`);
			const description = field(frontmatter, 'description');
			check(description.length > 0 && description.length <= 1024, `${path}：缺少有效 description`);
			// @ 檢查入口的相對 Markdown 檔案連結；不驗證網路網址與 heading anchor。
			const prose = content.replace(/^([ \t]*)(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1\2[ \t]*$/gm, '');
			for (const link of prose.matchAll(/\[[^\]\n]+\]\(([^\s)]+)\)/g)) {
				const target = link[1].split('#')[0];
				if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target)) continue;
				checkPath(resolve(root, dirname(path)), decodeURIComponent(target), path);
			}
			skillCount++;
			console.log(`${name}/${skill}：${content.trimEnd().split('\n').length} 行，${Buffer.byteLength(content, 'utf8')} bytes`);
		}
		const hooksPath = `${base}/hooks/hooks.json`;
		if (existsSync(resolve(root, hooksPath))) {
			for (const groups of Object.values(json(hooksPath).hooks)) {
				for (const group of groups) {
					for (const hook of group.hooks) {
						if (hook.type !== 'command') continue;
						const match = hook.command.match(/^\$\{CLAUDE_PLUGIN_ROOT\}\/([^\s]+)$/);
						check(Boolean(match), `${hooksPath}：不支援的 hook command 格式`);
						if (match) checkPath(resolve(root, base), match[1], hooksPath);
					}
				}
			}
		}
	}
	if (failures.length === 0) console.log(`驗證通過：${names.length} plugins、${skillCount} skills、marketplace 與 hook 路徑。`);
} catch (error) {
	failures.push(`無法完成驗證：${error.message}`);
}

if (failures.length > 0) {
	for (const failure of failures) console.error(failure);
	process.exitCode = 1;
}
