import { describe, it, expect } from 'vitest';
import { normalizeLLMPath, normalizeWikiLinkContent } from '../../core/prompt-builders';

describe('normalizeLLMPath', () => {
  it('returns path unchanged when already has correct wikiFolder prefix', () => {
    expect(normalizeLLMPath('mywiki/entities/foo.md', 'mywiki')).toBe('mywiki/entities/foo.md');
  });

  it('replaces "wiki/" prefix with user wikiFolder', () => {
    const result = normalizeLLMPath('wiki/entities/llm.md', 'mywiki');
    expect(result).toBe('mywiki/entities/llm.md');
  });

  it('replaces "wiki/" prefix with user wikiFolder when wikiFolder is nested', () => {
    const result = normalizeLLMPath('wiki/entities/llm.md', 'docs/kb');
    expect(result).toBe('docs/kb/entities/llm.md');
  });

  it('prepends wikiFolder when path is bare relative (no wiki/ prefix)', () => {
    const result = normalizeLLMPath('entities/llm.md', 'mywiki');
    expect(result).toBe('mywiki/entities/llm.md');
  });

  it('returns path unchanged when path is empty string', () => {
    expect(normalizeLLMPath('', 'mywiki')).toBe('');
  });

  it('handles path that starts with a non-wiki prefix (not "wiki/" nor wikiFolder)', () => {
    const result = normalizeLLMPath('other/entities/foo.md', 'mywiki');
    expect(result).toBe('mywiki/other/entities/foo.md');
  });

  it('handles path without .md extension', () => {
    const result = normalizeLLMPath('wiki/entities/foo', 'mywiki');
    expect(result).toBe('mywiki/entities/foo');
  });
});

describe('normalizeWikiLinkContent', () => {
  it('replaces [[wiki/ with [[custom/ when wikiFolder is custom', () => {
    const input = 'See [[wiki/entities/llm|LLM]] for details.';
    const expected = 'See [[custom/entities/llm|LLM]] for details.';
    expect(normalizeWikiLinkContent(input, 'custom')).toBe(expected);
  });

  it('preserves [[wiki/ links when wikiFolder is "wiki"', () => {
    const input = 'See [[wiki/entities/llm|LLM]] for details.';
    expect(normalizeWikiLinkContent(input, 'wiki')).toBe(input);
  });

  it('does not alter non-wiki-link references', () => {
    const input = 'See [[other/entities/llm|LLM]] for details.';
    expect(normalizeWikiLinkContent(input, 'custom')).toBe(input);
  });

  it('handles multiple wiki-links in the same content', () => {
    const input = '[[wiki/entities/a]] and [[wiki/concepts/b|B]]';
    const expected = '[[mywiki/entities/a]] and [[mywiki/concepts/b|B]]';
    expect(normalizeWikiLinkContent(input, 'mywiki')).toBe(expected);
  });

  it('handles content with no wiki-links', () => {
    const input = 'Just some plain text.';
    expect(normalizeWikiLinkContent(input, 'custom')).toBe(input);
  });

  it('replaces wiki/ in [[wiki/sources/foo]] too', () => {
    const input = 'From [[wiki/sources/paper|Paper]]';
    const expected = 'From [[custom/sources/paper|Paper]]';
    expect(normalizeWikiLinkContent(input, 'custom')).toBe(expected);
  });

  it('is idempotent — already normalized content stays unchanged', () => {
    const input = 'See [[custom/entities/llm|LLM]] for details.';
    expect(normalizeWikiLinkContent(input, 'custom')).toBe(input);
    // Double application
    expect(normalizeWikiLinkContent(input, 'custom')).toBe(normalizeWikiLinkContent(input, 'custom'));
  });
});
