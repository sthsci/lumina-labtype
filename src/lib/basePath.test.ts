import { describe, it, expect } from 'vitest';
import { canonicalUrl, joinBase, routerBasename } from './basePath';

describe('joinBase', () => {
  it('joins a project subpath with a route', () => {
    expect(joinBase('/lumina-labtype/', '/result')).toBe('/lumina-labtype/result');
    expect(joinBase('/lumina-labtype/', 'result')).toBe('/lumina-labtype/result');
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
    expect(routerBasename('/lumina-labtype/')).toBe('/lumina-labtype');
  });
  it('returns / for the domain root', () => {
    expect(routerBasename('/')).toBe('/');
  });
});

describe('canonicalUrl', () => {
  it('builds an absolute site URL under a subpath', () => {
    expect(canonicalUrl('https://user.github.io', '/lumina-labtype/')).toBe(
      'https://user.github.io/lumina-labtype/',
    );
  });
});
