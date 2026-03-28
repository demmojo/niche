import { getTotalPages, getNextPage, getPrevPage } from '../utils/pagination';
import { describe, it, expect } from 'vitest';

describe('pagination logic', () => {
  describe('getTotalPages', () => {
    it('should return 1 for 0 items', () => {
      expect(getTotalPages(0, 10)).toBe(1);
    });
    
    it('should return 1 for items <= itemsPerPage', () => {
      expect(getTotalPages(5, 10)).toBe(1);
      expect(getTotalPages(10, 10)).toBe(1);
    });

    it('should return 2 for items > itemsPerPage', () => {
      expect(getTotalPages(11, 10)).toBe(2);
      expect(getTotalPages(19, 10)).toBe(2);
    });
  });

  describe('getNextPage', () => {
    it('should return next page if not at end', () => {
      expect(getNextPage(1, 3)).toBe(2);
    });

    it('should not exceed total pages', () => {
      expect(getNextPage(3, 3)).toBe(3);
    });
  });

  describe('getPrevPage', () => {
    it('should return previous page if not at start', () => {
      expect(getPrevPage(3)).toBe(2);
    });

    it('should not go below 1', () => {
      expect(getPrevPage(1)).toBe(1);
      expect(getPrevPage(0)).toBe(1);
    });
  });
});
