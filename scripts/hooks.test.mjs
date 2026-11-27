import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, utimesSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, relative, isAbsolute, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { analyzeShell, checkToolUse, isSecretPath, isSecretGlob, scanSecrets } from '../plugins/workflow-core/hooks/lib/guards.mjs';
import { reviewCommit } from '../plugins/workflow-core/hooks/lib/commit-review.mjs';
import { lintFile } from '../plugins/workflow-core/hooks/lib/lint.mjs';

const dispatcher = fileURLToPath(new URL('../plugins/workflow-core/hooks/dispatch.mjs', import.meta.url));
const blocked = (command, flavor = 'bash') => Boolean(analyzeShell(command, { flavor, cwd: '/repo' }).reason);

// - 在系統暫存目錄建立 fixture，結束後只清除自己建立的目錄。
function withTemporary(run) {
	const temporaryRoot = resolve(tmpdir());
	const root = mkdtempSync(join(temporaryRoot, 'hook test '));
	try {
		return run(root);
	} finally {
		const local = relative(temporaryRoot, root);
		assert.ok(!isAbsolute(local) && !local.startsWith('..' + sep) && local.startsWith('hook test '));
		rmSync(root, { recursive: true, force: true });
	}
}

function dispatch(event) {
	const result = spawnSync(process.execPath, [dispatcher], { input: JSON.stringify(event), encoding: 'utf8' });
	assert.equal(result.status, 0, result.stderr);
	return result.stdout ? JSON.parse(result.stdout) : null;
}

test('01. 機密檔名 - .env 系列阻擋，範本檔放行', () => {
	for (const path of ['.env', '/a/b/.env.local', 'C:\\proj\\.env.production', 'id_rsa', 'server.pem', 'tls.key', 'secrets.json', '.envrc']) {
		assert.ok(isSecretPath(path), path);
	}
	for (const path of ['.env.example', '.env.sample', '.env.template', 'id_rsa.pub', 'env.ts', 'environment.ts', 'README.md']) {
		assert.ok(!isSecretPath(path), path);
	}
	assert.ok(isSecretGlob('**/.env*'));
	assert.ok(isSecretGlob('**/{.env,.env.local}'));
	assert.ok(isSecretGlob('**/*.pem'));
	assert.ok(!isSecretGlob('**/.env.example'));
	assert.ok(!isSecretGlob('**/*environment*'));
	assert.ok(!isSecretGlob('src/**/*.ts'));
});

test('02. Shell 讀寫機密檔 - Bash 與 PowerShell 都要擋', () => {
	for (const command of [
		'cat .env',
		'cd Cubi-KM && cat apps/api/.env',
		'grep API_KEY .env.local',
		'echo "KEY=1" >> .env',
		'cp .env.example .env',
		'node -e "console.log(require(\'fs\').readFileSync(\'.env\',\'utf8\'))"',
		'bash -c "cat .env"',
		'echo $(cat .env)',
		'cat ~/.ssh/id_rsa',
	]) {
		assert.ok(blocked(command), command);
	}
	for (const command of [
		'Get-Content .env',
		'gc .\\apps\\api\\.env',
		'Select-String -Path .env -Pattern KEY',
		'type .env.local',
		'Set-Content -Path .env -Value x',
		'pwsh -Command "Get-Content .env"',
	]) {
		assert.ok(blocked(command, 'powershell'), command);
	}
});

test('03. Shell 誤判 - 範本檔、搜尋字串、commit 訊息、列檔應放行', () => {
	for (const command of [
		'cat .env.example',
		'grep -rn ".env" README.md',
		'rg "\\.env" docs',
		'git commit -m "📃 docs: 說明 .env 設定方式"',
		'git commit -m "$(cat <<\'EOF\'\n說明 .env\nEOF\n)"',
		'ls -la .env',
		'test -f .env && echo ok',
		'echo "請在 .env 設定 API_KEY"',
		'git check-ignore .env',
		'cat <<EOF > notes.md\n請設定 .env\nEOF',
	]) {
		assert.ok(!blocked(command), command);
	}
	assert.ok(!blocked('Test-Path .env', 'powershell'));
});

test('04. Git 高風險指令 - force push、刪除遠端分支、reset --hard', () => {
	for (const command of [
		'git push --force',
		'git push -f origin main',
		'git push -uf origin feat',
		'git push origin +main',
		'git push origin :feature',
		'git push --delete origin feature',
		'git push -d origin feature',
		'cd Cubi-KM && git reset --hard origin/main',
		'git -C Cubi-KM reset --hard',
		'sh -c "git push --force"',
	]) {
		assert.ok(blocked(command), command);
	}
	assert.ok(blocked('git push --force origin main', 'powershell'));
	for (const command of [
		'git push origin HEAD:feature/issue-1',
		'git push -u origin fix/issue-12-login',
		'git push --force-with-lease origin feat',
		'git reset --soft HEAD~1',
		'git log --format=%B -1',
	]) {
		assert.ok(!blocked(command), command);
	}
});

test('05. 遞迴刪除與 SQL - 只擋危險目標與資料庫用戶端', () => {
	for (const command of ['rm -rf /', 'rm -rf ~', 'rm -rf .', 'rm -fr src/', 'sudo rm -rf /*']) {
		assert.ok(blocked(command), command);
	}
	assert.ok(blocked('Remove-Item -Recurse -Force C:\\', 'powershell'));
	for (const command of ['rm -rf node_modules', 'rm -rf dist build', 'rm -f src/a.ts']) {
		assert.ok(!blocked(command), command);
	}
	for (const command of [
		'psql -c "DROP TABLE users"',
		'echo "DROP DATABASE km" | mysql',
		'docker compose exec db psql -U app -c "TRUNCATE TABLE logs"',
	]) {
		assert.ok(blocked(command), command);
	}
	for (const command of ['grep -rn "DROP TABLE" migrations', 'rg "TRUNCATE" src']) {
		assert.ok(!blocked(command), command);
	}
});

test('06. Commit 偵測 - 各種寫法都要觸發審查', () => {
	const commits = (command, flavor = 'bash') => analyzeShell(command, { flavor, cwd: '/repo' }).commits;
	assert.deepEqual(commits('git commit -m "x"'), [{ cwd: '/repo', all: false }]);
	assert.deepEqual(commits('cd Cubi-KM && git add -A && git commit -m "x"'), [{ cwd: resolve('/repo', 'Cubi-KM'), all: false }]);
	assert.deepEqual(commits('git -C kmai commit -am "x"'), [{ cwd: resolve('/repo', 'kmai'), all: true }]);
	assert.deepEqual(commits('Set-Location Cubi-KM; git commit -m "x"', 'powershell'), [{ cwd: resolve('/repo', 'Cubi-KM'), all: false }]);
	assert.deepEqual(commits('git commit --no-verify -m "x"'), []);
	assert.deepEqual(commits('git log -1 --format=%B | npx commitlint'), []);
});

test('07. 寫入檢查 - 機密檔與機密內容', () => {
	assert.ok(checkToolUse('Write', { file_path: '/p/.env', content: 'A=1' }).reason);
	assert.ok(checkToolUse('Edit', { file_path: '/p/.env.local', old_string: 'a', new_string: 'b' }).reason);
	assert.ok(!checkToolUse('Write', { file_path: '/p/.env.example', content: 'API_KEY=\nDB_HOST=' }).reason);
	assert.ok(checkToolUse('Write', { file_path: '/p/src/aws.ts', content: 'const id = "AKIAABCDEFGHIJKLMNOP";' }).reason);
	assert.ok(checkToolUse('MultiEdit', { file_path: '/p/src/a.ts', edits: [{ old_string: 'x', new_string: 'const password = "hunter2!!";' }] }).reason);
	assert.ok(!checkToolUse('Write', { file_path: '/p/src/a.ts', content: 'const password = process.env.DB_PASSWORD;' }).reason);
	assert.ok(!checkToolUse('Write', { file_path: '/p/src/a.spec.ts', content: 'const password = "hunter2!!";' }).reason);
	assert.deepEqual(scanSecrets('apiKey: "fake-key-0000000000000000000"', '/p/src/a.ts'), []);
	assert.ok(checkToolUse('Read', { file_path: '/p/.env' }).reason);
	assert.ok(!checkToolUse('Read', { file_path: '/p/.env.example' }).reason);
	assert.ok(checkToolUse('Glob', { pattern: '**/.env*' }).reason);
	assert.ok(checkToolUse('Grep', { pattern: 'KEY', path: '/p/.env' }).reason);
	assert.ok(checkToolUse('Grep', { pattern: 'KEY', glob: '.env*' }).reason);
	assert.ok(!checkToolUse('Grep', { pattern: '\\.env', glob: '*.md' }).reason);
});

test('08. Dispatcher - 用官方 JSON 格式回傳 deny，放行時不輸出', () => {
	const output = dispatch({ hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'git push --force' }, cwd: tmpdir() });
	assert.equal(output.hookSpecificOutput.permissionDecision, 'deny');
	assert.match(output.hookSpecificOutput.permissionDecisionReason, /force/);
	assert.equal(dispatch({ hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'ls' }, cwd: tmpdir() }), null);
	const start = spawnSync(process.execPath, [dispatcher], { input: JSON.stringify({ hook_event_name: 'SessionStart' }), encoding: 'utf8' });
	assert.match(start.stdout, /團隊技術標準/);
	const broken = spawnSync(process.execPath, [dispatcher], { input: '{', encoding: 'utf8' });
	assert.equal(broken.status, 0);
});

test('09. Commit 自我審查 - 阻擋、標記後放行、debugger 一律阻擋', () => withTemporary((root) => {
	const git = (...args) => spawnSync('git', args, { cwd: root, encoding: 'utf8' });
	git('init', '-q');
	git('config', 'user.email', 'test@example.com');
	git('config', 'user.name', 'test');
	mkdirSync(join(root, 'src'));
	writeFileSync(join(root, 'src', 'a.ts'), 'export const a = 1;\nconsole.log(a);\n');
	git('add', '-A');

	const reason = reviewCommit({ cwd: join(root, 'src'), all: false });
	assert.match(reason, /自我審查/);
	assert.match(reason, /console\.log/);
	const flag = resolve(root, git('rev-parse', '--git-path', 'claude-review-done').stdout.trim());
	writeFileSync(flag, '');
	assert.equal(reviewCommit({ cwd: root, all: false }), null);
	assert.ok(!existsSync(flag), '放行後應刪除標記');

	// > 標記比 staged 檔案舊 → 重新要求審查
	writeFileSync(flag, '');
	utimesSync(flag, new Date(0), new Date(0));
	assert.match(reviewCommit({ cwd: root, all: false }), /自我審查/);

	writeFileSync(join(root, 'src', 'b.ts'), 'debugger;\n');
	git('add', '-A');
	writeFileSync(flag, '');
	assert.match(reviewCommit({ cwd: root, all: false }), /debugger/);
}));

test('10. Lint - monorepo 子目錄的 flat config 與 eslint 都找得到', () => withTemporary((root) => {
	const project = join(root, 'Cubi-KM');
	mkdirSync(join(project, 'node_modules', 'eslint', 'bin'), { recursive: true });
	mkdirSync(join(project, 'apps', 'web', 'src'), { recursive: true });
	writeFileSync(join(project, 'eslint.config.js'), 'export default [];\n');
	writeFileSync(join(project, 'node_modules', 'eslint', 'bin', 'eslint.js'),
		'const args = process.argv.slice(2);\nif (args.includes("-c")) { console.error("unexpected -c"); process.exit(2); }\nconsole.log(`${process.cwd()}|${args.at(-1)}: no-unused-vars`);\nprocess.exit(1);\n');
	const file = join(project, 'apps', 'web', 'src', 'App.vue');
	writeFileSync(file, '<template />\n');
	const problem = lintFile(file);
	assert.match(problem, /no-unused-vars/);
	assert.ok(problem.includes(`${project}|${file}`), problem);
	assert.equal(lintFile(join(project, 'apps', 'web', 'src', 'App.spec.ts')), null);
	const output = dispatch({ hook_event_name: 'PostToolUse', tool_name: 'Edit', tool_input: { file_path: file } });
	assert.equal(output.decision, 'block');
}));
