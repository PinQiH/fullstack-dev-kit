// =============================================================================
// shell.mjs — 把 Bash／PowerShell 指令拆成「段落 + token」
//
// @ 目的：讓檢查規則逐段比對實際執行的指令，而不是對整串文字跑正規式。
//   - `cd x && git commit`、`git -C x commit` 都能正確辨識
//   - 引號內的字串是單一 token，`grep "DROP TABLE"` 不會被當成 SQL
//   - heredoc 內文略過，不當成指令
// ?? 這不是完整的 shell parser，只處理 hook 判斷需要的語法。
// =============================================================================

const NESTED_BASH = new Set(['bash', 'sh', 'zsh', 'dash']);
const NESTED_POWERSHELL = new Set(['powershell', 'pwsh']);
const WRAPPERS = new Set(['sudo', 'env', 'command', 'builtin', 'exec', 'nohup', 'time', 'nice']);

// - 找出與 `(` 對應的 `)`，略過引號內容。
function matchParen(text, open) {
	let depth = 0;
	let quote = null;
	for (let i = open; i < text.length; i++) {
		const c = text[i];
		if (quote) {
			if (c === quote) quote = null;
			continue;
		}
		if (c === '"' || c === "'") quote = c;
		else if (c === '(') depth++;
		else if (c === ')' && --depth === 0) return i;
	}
	return text.length;
}

// - 讀取 heredoc 的結束標記（`<<EOF`、`<<'EOF'`、`<<-EOF`）。
function readHeredocDelimiter(text, start) {
	let i = start;
	while (text[i] === ' ' || text[i] === '\t') i++;
	const quote = text[i] === '"' || text[i] === "'" ? text[i] : null;
	if (quote) {
		const end = text.indexOf(quote, i + 1);
		const stop = end === -1 ? text.length : end;
		return { delimiter: text.slice(i + 1, stop), next: stop + 1 };
	}
	let delimiter = '';
	while (i < text.length && !/[\s;|&<>()]/.test(text[i])) delimiter += text[i++];
	return { delimiter: delimiter.replace(/\\/g, ''), next: i };
}

/**
 * 把一行指令拆成段落。
 * @param {string} command
 * @param {'bash'|'powershell'} flavor
 * @returns {{ tokens: string[], pipeline: number, flavor: string }[]}
 */
export function parseCommand(command, flavor = 'bash', counter = { pipeline: 0 }, depth = 0) {
	const segments = [];
	const substitutions = [];
	const heredocs = [];
	const text = String(command ?? '');
	const escape = flavor === 'powershell' ? '`' : '\\';
	let tokens = [];
	let buffer = '';
	let inToken = false;
	let pipeline = counter.pipeline++;

	const pushToken = () => {
		if (inToken) tokens.push(buffer);
		buffer = '';
		inToken = false;
	};
	const endSegment = (samePipeline) => {
		pushToken();
		if (tokens.length > 0) segments.push({ tokens, pipeline, flavor });
		tokens = [];
		if (!samePipeline) pipeline = counter.pipeline++;
	};

	let i = 0;
	while (i < text.length) {
		const c = text[i];
		if (c === "'") {
			const end = text.indexOf("'", i + 1);
			const stop = end === -1 ? text.length : end;
			buffer += text.slice(i + 1, stop);
			inToken = true;
			i = stop + 1;
			continue;
		}
		if (c === '"') {
			inToken = true;
			i++;
			while (i < text.length && text[i] !== '"') {
				if (text[i] === escape && i + 1 < text.length) {
					buffer += text[i + 1];
					i += 2;
					continue;
				}
				buffer += text[i++];
			}
			i++;
			continue;
		}
		if (c === escape) {
			// > 行尾跳脫 = 續行
			if (text[i + 1] === '\n') i += 2;
			else if (text[i + 1] === '\r' && text[i + 2] === '\n') i += 3;
			else {
				buffer += text[i + 1] ?? '';
				inToken = true;
				i += 2;
			}
			continue;
		}
		if (c === '\n') {
			endSegment(false);
			i++;
			// > 換行後依序略過 heredoc 內文
			while (heredocs.length > 0) {
				const { delimiter, stripTabs } = heredocs.shift();
				while (i < text.length) {
					const newline = text.indexOf('\n', i);
					const lineEnd = newline === -1 ? text.length : newline;
					let line = text.slice(i, lineEnd).replace(/\r$/, '');
					if (stripTabs) line = line.replace(/^\t+/, '');
					i = lineEnd + 1;
					if (line === delimiter) break;
				}
			}
			continue;
		}
		if (c === ' ' || c === '\t' || c === '\r') {
			pushToken();
			i++;
			continue;
		}
		if (c === '#' && !inToken) {
			const newline = text.indexOf('\n', i);
			i = newline === -1 ? text.length : newline;
			continue;
		}
		if (c === ';') {
			endSegment(false);
			i++;
			continue;
		}
		if (c === '&') {
			if (text[i + 1] === '&') {
				endSegment(false);
				i += 2;
			} else if (text[i + 1] === '>') {
				pushToken();
				tokens.push('>');
				i += text[i + 2] === '>' ? 3 : 2;
			} else if (flavor === 'powershell') {
				// > PowerShell 的 `&` 是呼叫運算子，不是背景執行
				pushToken();
				i++;
			} else {
				endSegment(false);
				i++;
			}
			continue;
		}
		if (c === '|') {
			if (text[i + 1] === '|') {
				endSegment(false);
				i += 2;
			} else {
				endSegment(true);
				i += text[i + 1] === '&' ? 2 : 1;
			}
			continue;
		}
		if (c === '$' && text[i + 1] === '(') {
			const end = matchParen(text, i + 1);
			substitutions.push(text.slice(i + 2, end));
			buffer += text.slice(i, end + 1);
			inToken = true;
			i = end + 1;
			continue;
		}
		if (c === '`' && flavor === 'bash') {
			const end = text.indexOf('`', i + 1);
			const stop = end === -1 ? text.length : end;
			substitutions.push(text.slice(i + 1, stop));
			buffer += text.slice(i, stop + 1);
			inToken = true;
			i = stop + 1;
			continue;
		}
		if (c === '(' || c === ')') {
			endSegment(false);
			i++;
			continue;
		}
		if (c === '<' && text[i + 1] === '<' && flavor === 'bash') {
			pushToken();
			if (text[i + 2] === '<') {
				// > here-string `<<<`：後面的字串是輸入資料
				tokens.push('<');
				i += 3;
				continue;
			}
			const stripTabs = text[i + 2] === '-';
			const { delimiter, next } = readHeredocDelimiter(text, i + (stripTabs ? 3 : 2));
			if (delimiter) heredocs.push({ delimiter, stripTabs });
			i = next;
			continue;
		}
		if (c === '>' || c === '<') {
			// > 重新導向：`2>` 的 2 也是獨立 token，不影響判斷
			pushToken();
			tokens.push(c === '>' ? '>' : '<');
			i++;
			while (text[i] === '>') i++;
			if (text[i] === '&') {
				i++;
				while (/[0-9-]/.test(text[i] ?? '')) i++;
			}
			continue;
		}
		buffer += c;
		inToken = true;
		i++;
	}
	endSegment(false);

	// > 命令替換 `$(...)` 與巢狀 shell 內的指令也要檢查
	if (depth < 4) {
		for (const inner of substitutions) segments.push(...parseCommand(inner, flavor, counter, depth + 1));
		for (const segment of [...segments]) {
			const nested = nestedScript(segment);
			if (nested) segments.push(...parseCommand(nested.script, nested.flavor, counter, depth + 1));
		}
	}
	return segments;
}

// - 正規化指令名稱：去路徑、去 .exe、轉小寫。
export function normalizeName(token) {
	return String(token).split(/[\\/]/).pop().toLowerCase().replace(/\.exe$/, '');
}

/**
 * 取得段落實際執行的指令名稱與參數，略過 `FOO=bar`、`sudo` 等前綴。
 * @returns {{ name: string, args: string[] }}
 */
export function commandOf(tokens) {
	let i = 0;
	while (i < tokens.length) {
		const token = tokens[i];
		if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(token)) {
			i++;
			continue;
		}
		const name = normalizeName(token);
		if (WRAPPERS.has(name)) {
			i++;
			while (i < tokens.length && tokens[i].startsWith('-')) i++;
			continue;
		}
		return { name, args: tokens.slice(i + 1) };
	}
	return { name: '', args: [] };
}

// - 辨識 `bash -c "..."`、`pwsh -Command "..."`、`eval "..."`，回傳內層指令。
export function nestedScript(segment) {
	const { name, args } = commandOf(segment.tokens);
	if (NESTED_BASH.has(name)) {
		const index = args.findIndex((arg) => /^-[a-z]*c[a-z]*$/i.test(arg));
		if (index !== -1 && args[index + 1] !== undefined) return { script: args[index + 1], flavor: 'bash' };
	}
	if (NESTED_POWERSHELL.has(name)) {
		const index = args.findIndex((arg) => /^-c(o(m(m(a(n(d)?)?)?)?)?)?$/i.test(arg));
		if (index !== -1 && args.length > index + 1) return { script: args.slice(index + 1).join(' '), flavor: 'powershell' };
	}
	if (name === 'eval' && args.length > 0) return { script: args.join(' '), flavor: segment.flavor };
	return null;
}
