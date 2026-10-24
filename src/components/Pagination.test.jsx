import { describe, expect, it } from 'vitest';
import { pageWindow } from './Pagination.jsx';

describe('pageWindow', () => {
  it('lists every page when there are seven or fewer', () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('keeps the first pages together near the start', () => {
    expect(pageWindow(1, 20)).toEqual([1, 2, 3, 4, null, 20]);
    expect(pageWindow(3, 20)).toEqual([1, 2, 3, 4, null, 20]);
  });

  it('shows the neighbours of a page in the middle, with gaps either side', () => {
    expect(pageWindow(10, 20)).toEqual([1, null, 9, 10, 11, null, 20]);
  });

  it('keeps the last pages together near the end', () => {
    expect(pageWindow(20, 20)).toEqual([1, null, 17, 18, 19, 20]);
    expect(pageWindow(18, 20)).toEqual([1, null, 17, 18, 19, 20]);
  });

  it('never leaves a gap of a single page', () => {
    // 1 … 3 would hide only page 2, so the window shows it instead.
    expect(pageWindow(4, 20)).toEqual([1, 2, 3, 4, 5, null, 20]);
  });
});
