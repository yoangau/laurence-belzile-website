import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ContentSchema, type Content } from '../../src/content/schema';

const sample = (): Content => JSON.parse(readFileSync('fixtures/content.sample.json', 'utf8')) as Content;

describe('content schema', () => {
  it('accepts the sample fixture', () => {
    expect(ContentSchema.safeParse(sample()).success).toBe(true);
  });

  it('rejects duplicate ids', () => {
    const content = sample();
    content.works.push(content.works[0]!);
    const result = ContentSchema.safeParse(content);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/double/);
  });

  it('requires a price for available works', () => {
    const content = sample();
    const artwork = content.works.find((w) => w.kind === 'artwork')!;
    Object.assign(artwork, { availability: 'available', price: undefined });
    expect(ContentSchema.safeParse(content).success).toBe(false);
  });

  it('rejects unknown photographers', () => {
    const content = sample();
    content.works[0]!.images[0]!.credit = 'nobody';
    expect(ContentSchema.safeParse(content).success).toBe(false);
  });
});
