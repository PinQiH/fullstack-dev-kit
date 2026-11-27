#!/usr/bin/env node
// =============================================================================
// dispatch.mjs — workflow-core 唯一的 hook 入口
//
// 依 hook_event_name 與 tool_name 分派檢查，stdin 的 JSON 只解析一次。
//   - SessionStart：輸出團隊技術標準
//   - PreToolUse：機密檔、高風險指令、寫入內容、commit 前自我審查
//   - PostToolUse：寫入後執行專案既有的 linter
//
// @ 阻擋採用官方 JSON 輸出（permissionDecision: deny），理由一定會傳給 Claude。
// @ 任何非預期錯誤都放行（fail-open），hook 壞掉不應卡住工作。
// =============================================================================

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkToolUse } from './lib/guards.mjs';
import { reviewCommit } from './lib/commit-review.mjs';
import { lintFile } from './lib/lint.mjs';

const here = dirname(fileURLToPath(import.meta.url));

function deny(reason) {
	process.stdout.write(JSON.stringify({
		hookSpecificOutput: {
			hookEventName: 'PreToolUse',
			permissionDecision: 'deny',
			permissionDecisionReason: `[workflow-core] ${reason}`,
		},
	}));
}

function preToolUse(event) {
	const result = checkToolUse(event.tool_name, event.tool_input ?? {}, event.cwd ?? process.cwd());
	if (result.reason) return deny(result.reason);
	for (const commit of result.commits ?? []) {
		const reason = reviewCommit(commit);
		if (reason) return deny(reason);
	}
}

function postToolUse(event) {
	const input = event.tool_input ?? {};
	const problem = lintFile(input.file_path ?? input.path);
	if (!problem) return;
	process.stdout.write(JSON.stringify({
		decision: 'block',
		reason: `[workflow-core] ${problem}\n請修正上述 lint 問題後再繼續。`,
	}));
}

try {
	const event = JSON.parse(readFileSync(0, 'utf8') || '{}');
	switch (event.hook_event_name) {
		case 'SessionStart':
			process.stdout.write(readFileSync(join(here, 'team-standards.md'), 'utf8'));
			break;
		case 'PreToolUse':
			preToolUse(event);
			break;
		case 'PostToolUse':
			postToolUse(event);
			break;
		default:
			break;
	}
} catch {
	// !! fail-open：解析或檢查失敗時放行
}
process.exitCode = 0;
