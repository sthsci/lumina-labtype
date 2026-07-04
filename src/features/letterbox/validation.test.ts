import { describe, expect, it } from 'vitest';
import { emptyQuestionDraft, emptyTypeDraft } from './types';
import { contentHash, mapAnswerScale, validateQuestionSuggestion, validateTypeSuggestion } from './validation';

describe('letterbox validation', () => {
  const validType = {
    ...emptyTypeDraft,
    proposedName: '冷冻盒考古学家',
    proposedCode: 'BOX7',
    summary: '总能在冻存盒里找到别人以为已经消失的样本。',
    behaviourExample: '当大家都说那管旧抗体找不到时，他们会拿出三年前的标签照片和一张手绘冻存盒地图。',
    distinctionFromExisting: '这不是单纯的版本控制或流程管理，而是一种对实体样本历史的异常敏感。',
  };

  const validQuestion = {
    ...emptyQuestionDraft,
    questionText: '当对照组出现一个无法解释的小峰时，我会优先重复实验，而不是立刻建立一个新机制。',
    rationale: '它能区分先验证实验稳定性的人，和先寻找新解释的人。',
    intendedDistinction: '区分重复性优先、机制探索优先，以及对异常点的容忍方式。',
    answerFormat: 'five_point_agreement' as const,
  };

  it('maps a valid type suggestion to a trimmed Supabase payload', () => {
    const result = validateTypeSuggestion({ ...validType, proposedName: '  冷冻盒考古学家  ' }, 'zh-CN', 'REPRO');
    expect(result.ok).toBe(true);
    expect(result.value).toMatchObject({
      locale: 'zh-CN',
      proposed_code: 'BOX7',
      proposed_name: '冷冻盒考古学家',
      current_type: null,
      app_version: '1.0.0',
    });
    expect(result.value?.content_hash).toMatch(/^fnv1a_/);
  });

  it('maps a valid question suggestion with answer scale metadata', () => {
    const result = validateQuestionSuggestion({ ...validQuestion, attachType: true }, 'en', 'PIPELINE');
    expect(result.ok).toBe(true);
    expect(result.value).toMatchObject({
      locale: 'en',
      answer_format: 'five_point_agreement',
      scale_min: 1,
      scale_max: 5,
      current_type: 'PIPELINE',
    });
  });

  it('rejects malformed, punctuation-only and excessive content', () => {
    expect(validateTypeSuggestion({ ...validType, proposedName: '<b>bad</b>' }, 'zh-CN', null).errors.proposedName).toBe('html');
    expect(validateTypeSuggestion({ ...validType, summary: '！！！' }, 'zh-CN', null).errors.summary).toBe('punctuation');
    expect(validateQuestionSuggestion({ ...validQuestion, questionText: 'x'.repeat(700) }, 'zh-CN', null).errors.questionText).toBe('tooLong');
  });

  it('rejects honeypot submissions', () => {
    expect(validateQuestionSuggestion({ ...validQuestion, honeypot: 'http://spam.test' }, 'zh-CN', null).errors.honeypot).toBe('honeypot');
  });

  it('normalizes duplicate hashes and answer scale ranges', () => {
    const a = validateTypeSuggestion(validType, 'zh-CN', null).value!;
    const b = validateTypeSuggestion({ ...validType, behaviourExample: ` ${validType.behaviourExample}   ` }, 'zh-CN', null).value!;
    expect(a.content_hash).toBe(b.content_hash);
    expect(contentHash({ x: 'one' })).toBe(contentHash({ x: 'one' }));
    expect(mapAnswerScale('seven_point_agreement')).toEqual({ min: 1, max: 7 });
    expect(mapAnswerScale('forced_choice')).toEqual({ min: null, max: null });
  });
});
