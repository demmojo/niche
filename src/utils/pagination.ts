/**
 *
 */
export function getTotalPages(
  totalItems: number,
  itemsPerPage: number,
): number {
  return Math.max(1, Math.ceil(totalItems / itemsPerPage));
}

/**
 *
 */
export function getNextPage(currentPage: number, totalPages: number): number {
  return Math.min(totalPages, currentPage + 1);
}

/**
 *
 */
export function getPrevPage(currentPage: number): number {
  return Math.max(1, currentPage - 1);
}
