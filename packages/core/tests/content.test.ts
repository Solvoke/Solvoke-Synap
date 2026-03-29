/**
 * 工具函数测试 — 内容处理
 */
import { describe, it, expect } from 'vitest';

import { extractCodeBlocks, truncateContent, countCodeBlocks } from '../src/utils/content.js';

describe('extractCodeBlocks', () => {
  it('should 提取单个代码块', () => {
    const content = '一些文本\n```typescript\nconst x = 1;\n```\n更多文本';
    const blocks = extractCodeBlocks(content);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]!.language).toBe('typescript');
    expect(blocks[0]!.code).toBe('const x = 1;');
    expect(blocks[0]!.startIndex).toBe(5); // "一些文本\n" 后面
  });

  it('should 提取多个代码块', () => {
    const content = [
      '第一段代码：',
      '```python',
      'print("hello")',
      '```',
      '第二段代码：',
      '```javascript',
      'console.log("hello");',
      '```',
    ].join('\n');
    const blocks = extractCodeBlocks(content);
    expect(blocks).toHaveLength(2);
    expect(blocks[0]!.language).toBe('python');
    expect(blocks[1]!.language).toBe('javascript');
  });

  it('should 处理无语言标记的代码块', () => {
    const content = '前文\n```\nplain code\n```\n后文';
    const blocks = extractCodeBlocks(content);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]!.language).toBe('');
    expect(blocks[0]!.code).toBe('plain code');
  });

  it('should 处理多行代码块', () => {
    const content = '```typescript\nline1\nline2\nline3\n```';
    const blocks = extractCodeBlocks(content);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]!.code).toBe('line1\nline2\nline3');
  });

  it('should 返回空数组（无代码块）', () => {
    const content = '这是一段普通文本，没有代码块。';
    expect(extractCodeBlocks(content)).toEqual([]);
  });

  it('should 返回空数组（空字符串）', () => {
    expect(extractCodeBlocks('')).toEqual([]);
  });
});

describe('truncateContent', () => {
  it('should 不截断短文本', () => {
    const short = '短文本';
    expect(truncateContent(short)).toBe(short);
  });

  it('should 截断长文本并添加省略号', () => {
    const long = 'a'.repeat(300);
    const result = truncateContent(long);
    expect(result).toHaveLength(203); // 200 + "..."
    expect(result.endsWith('...')).toBe(true);
  });

  it('should 支持自定义长度', () => {
    const text = 'abcdefghij'; // 10 字符
    expect(truncateContent(text, 5)).toBe('abcde...');
    expect(truncateContent(text, 10)).toBe(text); // 恰好等于不截断
  });

  it('should 处理空字符串', () => {
    expect(truncateContent('')).toBe('');
  });
});

describe('countCodeBlocks', () => {
  it('should 计算代码块数量', () => {
    const content = '```js\ncode1\n```\n文本\n```py\ncode2\n```';
    expect(countCodeBlocks(content)).toBe(2);
  });

  it('should 返回 0（无代码块）', () => {
    expect(countCodeBlocks('普通文本')).toBe(0);
  });

  it('should 返回 0（空字符串）', () => {
    expect(countCodeBlocks('')).toBe(0);
  });
});
