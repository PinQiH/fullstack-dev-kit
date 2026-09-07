import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, relative, isAbsolute, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const validator = fileURLToPath(new URL('./validate-plugins.mjs', import.meta.url));
const skill = 'plugins/demo/skills/example/SKILL.md';
const entry = '---\nname: example\ndescription: >\n  範例規範與適用範圍。\n---\n';

// - 建立最小封裝，驗證子程序的成功與失敗狀態。
function runFixture(change = () => {}) {
	const temporaryRoot = resolve(tmpdir());
	const root = mkdtempSync(join(temporaryRoot, 'plugin validation '));
	const write = (path, content) => {
		mkdirSync(dirname(join(root, path)), { recursive: true });
		writeFileSync(join(root, path), typeof content === 'string' ? content : JSON.stringify(content));
	};
	try {
		write('.claude-plugin/marketplace.json', { name: 'kit', plugins: [{ name: 'demo', source: './plugins/demo', version: '1.0.0' }] });
		write('.agents/plugins/marketplace.json', { name: 'kit', plugins: [{ name: 'demo', source: { source: 'local', path: './plugins/demo' } }] });
		write('plugins/demo/.claude-plugin/plugin.json', { name: 'demo', version: '1.0.0' });
		write('plugins/demo/.codex-plugin/plugin.json', { name: 'demo', version: '1.0.0+codex.test', skills: './skills/' });
		write(skill, entry + '\n[參考](reference.md)\n');
		write('plugins/demo/skills/example/reference.md', '# 參考\n');
		write('plugins/demo/hooks/hooks.json', { hooks: { SessionStart: [{ hooks: [{ type: 'command', command: '${CLAUDE_PLUGIN_ROOT}/hooks/start.sh' }] }] } });
		write('plugins/demo/hooks/start.sh', '#!/usr/bin/env bash\nexit 0\n');
		change(write);
		return spawnSync(process.execPath, [validator, root], { encoding: 'utf8', cwd: temporaryRoot });
	} finally {
		// !! 只清除本測試建立且位於系統暫存目錄內的 fixture。
		const local = relative(temporaryRoot, root);
		assert.ok(!isAbsolute(local) && !local.startsWith('..' + sep) && local.startsWith('plugin validation '));
		rmSync(root, { recursive: true, force: true });
	}
}

test('01. 有效封裝 - 支援中文、折行 description、含空白路徑及不同 cwd', () => {
	const result = runFixture();
	assert.equal(result.status, 0, result.stderr);
	assert.match(result.stdout, /1 plugins、1 skills/);
});

test('02. 程式範例連結 - 不應把 fenced code 當成實際資源', () => {
	const result = runFixture(write => write(skill, entry + '\n~~~md\n[範例](missing.md)\n~~~\n'));
	assert.equal(result.status, 0, result.stderr);
});

const failures = [
	['03. Marketplace 重複項目 - 應拒絕', write => write('.claude-plugin/marketplace.json', { name: 'kit', plugins: [{ name: 'demo' }, { name: 'demo' }] }), /清單.*重複/],
	['04. 跨平台版本漂移 - 應拒絕', write => write('plugins/demo/.codex-plugin/plugin.json', { name: 'demo', version: '2.0.0', skills: './skills/' }), /基礎版本不一致/],
	['05. 空白 description - 不得把下一個欄位當成內容', write => write(skill, '---\ndescription:\nname: example\n---\n'), /description/],
	['06. 參考資料遺失 - 應指出失效連結', write => write(skill, entry + '[細節](missing.md)\n'), /missing\.md/],
	['07. Hook 腳本遺失 - 應拒絕', write => write('plugins/demo/hooks/hooks.json', { hooks: { SessionStart: [{ hooks: [{ type: 'command', command: '${CLAUDE_PLUGIN_ROOT}/hooks/missing.sh' }] }] } }), /missing\.sh/],
	['08. 損壞的 JSON - 應以非零狀態結束', write => write('.claude-plugin/marketplace.json', '{'), /無法完成驗證/],
	['09. 跨出封裝的相對路徑 - 應拒絕', write => write(skill, entry + '[外部檔案](../../../../../outside.md)\n'), /repository 內/],
];
for (const [name, change, expected] of failures) {
	test(name, () => {
		const result = runFixture(change);
		assert.equal(result.status, 1);
		assert.match(result.stderr, expected);
	});
}
