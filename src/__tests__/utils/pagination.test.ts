import { describe, it, expect } from "vitest";
import {
  getTotalPages,
  getNextPage,
  getPrevPage,
} from "../../utils/pagination";

describe("Pagination Utils", () => {
  describe("getTotalPages", () => {
    it("calculates total pages correctly", () => {
      expect(getTotalPages(10, 5)).toBe(2);
      expect(getTotalPages(11, 5)).toBe(3);
      expect(getTotalPages(0, 5)).toBe(1); // At least 1 page
      expect(getTotalPages(5, 10)).toBe(1);
    });
  });

  describe("getNextPage", () => {
    it("returns the next page without exceeding total pages", () => {
      expect(getNextPage(1, 5)).toBe(2);
      expect(getNextPage(5, 5)).toBe(5);
      expect(getNextPage(6, 5)).toBe(5);
    });
  });

  describe("getPrevPage", () => {
    it("returns the previous page without dropping below 1", () => {
      expect(getPrevPage(2)).toBe(1);
      expect(getPrevPage(5)).toBe(4);
      expect(getPrevPage(1)).toBe(1);
      expect(getPrevPage(0)).toBe(1);
    });
  });
});
