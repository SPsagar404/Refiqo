import { paginationQuerySchema, parseSort } from './common.schema';

describe('parseSort', () => {
  const allowed = ['createdAt', 'name'];

  it('falls back to default when no sort given', () => {
    expect(parseSort(undefined, allowed)).toEqual([{ createdAt: 'desc' }]);
  });

  it('parses descending (-) and ascending fields', () => {
    expect(parseSort('-createdAt,name', allowed)).toEqual([{ createdAt: 'desc' }, { name: 'asc' }]);
  });

  it('ignores fields not in the allowlist', () => {
    expect(parseSort('password,-createdAt', allowed)).toEqual([{ createdAt: 'desc' }]);
  });
});

describe('paginationQuerySchema', () => {
  it('coerces strings and applies defaults', () => {
    const parsed = paginationQuerySchema.parse({ page: '2', limit: '5' });
    expect(parsed).toMatchObject({ page: 2, limit: 5 });
  });

  it('caps limit at 100', () => {
    expect(() => paginationQuerySchema.parse({ limit: '500' })).toThrow();
  });
});
