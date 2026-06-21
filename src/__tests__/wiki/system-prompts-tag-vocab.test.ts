import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from '../../wiki/system-prompts';
import type { LLMWikiSettings } from '../../types';

// Issue #85 v6 / Phase 1.3: buildSystemPrompt should inject the active tag
// vocabulary section so user-defined Custom tags are respected by all
// ingestion paths, not just lint paths.

function makeSettings(overrides: Partial<LLMWikiSettings> = {}): LLMWikiSettings {
  return {
    wikiFolder: 'wiki',
    wikiLanguage: 'en',
    extractionGranularity: 'standard',
    customEntityTags: '',
    customConceptTags: '',
    tagVocabularyMode: 'default',
    ...overrides,
  } as LLMWikiSettings;
}

describe('buildSystemPrompt — tag vocabulary injection (Phase 1.3)', () => {
  it('includes tag vocabulary section in default mode', async () => {
    const settings = makeSettings();
    const prompt = await buildSystemPrompt(settings, async () => undefined, 'entity');
    expect(prompt).toBeDefined();
    expect(prompt).toContain('Active Tag Vocabulary');
    expect(prompt).toContain('Entity types');
    expect(prompt).toContain('Concept types');
    // Default mode should include built-in tags
    expect(prompt).toContain('person');
    expect(prompt).toContain('theory');
  });

  it('includes user-defined custom tags when tagVocabularyMode=custom', async () => {
    const settings = makeSettings({
      tagVocabularyMode: 'custom',
      customEntityTags: 'Kardiologie, Immunologie, Neurologie',
      customConceptTags: 'Medizin, Diagnostik',
    });
    const prompt = await buildSystemPrompt(settings, async () => undefined, 'entity');
    expect(prompt).toBeDefined();
    expect(prompt).toContain('Kardiologie');
    expect(prompt).toContain('Immunologie');
    expect(prompt).toContain('Neurologie');
    expect(prompt).toContain('Medizin');
  });

  it('does NOT include duplicate tag vocab section when already present', async () => {
    // Defensive: if caller already prepended the section, don't double up.
    const settings = makeSettings();
    const prompt = await buildSystemPrompt(
      settings,
      async () => 'PREVIOUS TAG VOCAB SECTION',
      'entity'
    );
    // Count occurrences of "Active Tag Vocabulary"
    const matches = (prompt ?? '').match(/Active Tag Vocabulary/g);
    expect(matches?.length).toBe(1);
  });

  it('returns prompt even when schemaContext is undefined', async () => {
    const settings = makeSettings();
    // No schema context — but tag vocab section should still appear
    const prompt = await buildSystemPrompt(settings, async () => undefined, 'entity');
    expect(prompt).toBeDefined();
    expect(prompt).toContain('Active Tag Vocabulary');
  });
});