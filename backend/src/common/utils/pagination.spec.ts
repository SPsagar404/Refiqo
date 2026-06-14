import { paginate, toSkipTake } from './pagination';

describe('pagination utils', () => {
  it('toSkipTake computes offset from page/limit', () => {
    expect(toSkipTake(1, 20)).toEqual({ skip: 0, take: 20 });
    expect(toSkipTake(3, 10)).toEqual({ skip: 20, take: 10 });
  });

  it('paginate builds the { items, meta } envelope', () => {
    const result = paginate([1, 2, 3], 45, 2, 20);
    expect(result.items).toEqual([1, 2, 3]);
    expect(result.meta).toEqual({ page: 2, limit: 20, total: 45, totalPages: 3 });
  });

  it('paginate reports at least one page even when empty', () => {
    expect(paginate([], 0, 1, 20).meta.totalPages).toBe(1);
  });
});
