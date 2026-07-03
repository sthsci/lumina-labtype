import { describe, it, expect } from 'vitest';
import { canonicalUrl, joinBase, routerBasename } from './basePath';

describe('joinBase', () => {
  it('joins a project subpath with a route', () => {
    expect(joinBase('/academic_personality/', '/result')).toBe('/academic_personality/result');
    expect(joinBase('/academic_personality/', 'result')).toBe('/academic_personality/result');
  });

  it('works at the domain root', () => {
    expect(joinBase('/', '/result')).toBe('/result');
  });

  it('collapses duplicate slashes', () => {
    expect(joinBase('/base//', '//x')).toBe('/base/x');
  });
});

describe('routerBasename', () => {
  it('strips the trailing slash for a subpath', () => {
    expect(routerBasename('/academic_personality/')).toBe('/academic_personality');
  });
  it('returns / for the domain root', () => {
    expect(routerBasename('/')).toBe('/');
  });
});

describe('canonicalUrl', () => {
  it('builds an absolute site URL under a subpath', () => {
    expect(canonicalUrl('https://user.github.io', '/academic_personality/')).toBe(
      'https://user.github.io/academic_personality/',
    );
  });
});
