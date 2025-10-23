import { PaginationOptions, PaginatedResponse } from '../types/common.types';

/**
 * Pagination utilities for consistent handling of paginated queries
 */
export class PaginationUtil {
  /**
   * Default pagination settings
   */
  static readonly DEFAULT_PAGE = 1;
  static readonly DEFAULT_LIMIT = 20;
  static readonly MAX_LIMIT = 100;
  static readonly MIN_LIMIT = 1;

  /**
   * Normalize pagination options with defaults and validation
   */
  static normalizePaginationOptions(options: PaginationOptions = {}): Required<PaginationOptions> {
    const page = Math.max(options.page || this.DEFAULT_PAGE, 1);
    const limit = Math.min(
      Math.max(options.limit || this.DEFAULT_LIMIT, this.MIN_LIMIT),
      this.MAX_LIMIT,
    );

    return {
      page,
      limit,
      sortBy: options.sortBy || 'createdAt',
      sortOrder: options.sortOrder || 'desc',
    };
  }

  /**
   * Calculate skip value for database queries
   */
  static calculateSkip(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  /**
   * Calculate total pages from total items and limit
   */
  static calculateTotalPages(total: number, limit: number): number {
    return Math.ceil(total / limit);
  }

  /**
   * Create pagination metadata
   */
  static createPaginationMeta(
    page: number,
    limit: number,
    total: number,
  ): PaginatedResponse<any>['pagination'] {
    const totalPages = this.calculateTotalPages(total, limit);

    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  /**
   * Create a complete paginated response
   */
  static createPaginatedResponse<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
  ): PaginatedResponse<T> {
    return {
      data,
      pagination: this.createPaginationMeta(page, limit, total),
    };
  }

  /**
   * Validate pagination parameters
   */
  static validatePaginationParams(options: PaginationOptions): string[] {
    const errors: string[] = [];

    if (options.page !== undefined) {
      if (!Number.isInteger(options.page) || options.page < 1) {
        errors.push('Page must be a positive integer');
      }
    }

    if (options.limit !== undefined) {
      if (!Number.isInteger(options.limit) || options.limit < this.MIN_LIMIT) {
        errors.push(`Limit must be an integer >= ${this.MIN_LIMIT}`);
      }
      if (options.limit > this.MAX_LIMIT) {
        errors.push(`Limit must not exceed ${this.MAX_LIMIT}`);
      }
    }

    if (options.sortOrder !== undefined) {
      if (!['asc', 'desc'].includes(options.sortOrder)) {
        errors.push('Sort order must be "asc" or "desc"');
      }
    }

    return errors;
  }

  /**
   * Generate Prisma orderBy clause from sort options
   */
  static createOrderByClause(
    sortBy: string,
    sortOrder: 'asc' | 'desc',
    allowedSortFields?: string[],
  ): any {
    // Validate sort field if restrictions are provided
    if (allowedSortFields && !allowedSortFields.includes(sortBy)) {
      throw new Error(
        `Invalid sort field: ${sortBy}. Allowed fields: ${allowedSortFields.join(', ')}`,
      );
    }

    // Handle nested field sorting (e.g., "user.name")
    if (sortBy.includes('.')) {
      const parts = sortBy.split('.');
      const orderBy: any = {};
      let current = orderBy;

      for (let i = 0; i < parts.length - 1; i++) {
        current[parts[i]] = {};
        current = current[parts[i]];
      }

      current[parts[parts.length - 1]] = sortOrder;
      return orderBy;
    }

    // Simple field sorting
    return { [sortBy]: sortOrder };
  }

  /**
   * Create multiple sort clauses
   */
  static createMultipleOrderBy(
    sorts: Array<{ field: string; order: 'asc' | 'desc' }>,
    allowedSortFields?: string[],
  ): any[] {
    return sorts.map((sort) => this.createOrderByClause(sort.field, sort.order, allowedSortFields));
  }

  /**
   * Generate pagination links/info for API responses
   */
  static generatePaginationLinks(
    baseUrl: string,
    page: number,
    limit: number,
    totalPages: number,
    additionalParams?: Record<string, string>,
  ): {
    first: string;
    prev: string | null;
    next: string | null;
    last: string;
  } {
    const params = new URLSearchParams(additionalParams || {});
    params.set('limit', limit.toString());

    const buildUrl = (targetPage: number) => {
      params.set('page', targetPage.toString());
      return `${baseUrl}?${params.toString()}`;
    };

    return {
      first: buildUrl(1),
      prev: page > 1 ? buildUrl(page - 1) : null,
      next: page < totalPages ? buildUrl(page + 1) : null,
      last: buildUrl(totalPages),
    };
  }

  /**
   * Calculate pagination window for UI (e.g., showing "1 2 3 ... 8 9 10" around current page)
   */
  static calculatePaginationWindow(
    currentPage: number,
    totalPages: number,
    windowSize: number = 5,
  ): {
    pages: number[];
    showFirstEllipsis: boolean;
    showLastEllipsis: boolean;
  } {
    const halfWindow = Math.floor(windowSize / 2);
    let startPage = Math.max(1, currentPage - halfWindow);
    let endPage = Math.min(totalPages, currentPage + halfWindow);

    // Adjust window if near boundaries
    if (endPage - startPage + 1 < windowSize) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + windowSize - 1);
      } else {
        startPage = Math.max(1, endPage - windowSize + 1);
      }
    }

    const pages: number[] = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return {
      pages,
      showFirstEllipsis: startPage > 2,
      showLastEllipsis: endPage < totalPages - 1,
    };
  }

  /**
   * Create cursor-based pagination (for real-time data)
   */
  static createCursorPagination<T extends { id: string; createdAt: Date }>(
    items: T[],
    limit: number,
  ): {
    data: T[];
    hasNext: boolean;
    nextCursor: string | null;
  } {
    const hasNext = items.length > limit;
    const data = hasNext ? items.slice(0, limit) : items;
    const nextCursor =
      hasNext && data.length > 0
        ? Buffer.from(
            JSON.stringify({
              id: data[data.length - 1].id,
              createdAt: data[data.length - 1].createdAt.toISOString(),
            }),
          ).toString('base64')
        : null;

    return {
      data,
      hasNext,
      nextCursor,
    };
  }

  /**
   * Parse cursor for cursor-based pagination
   */
  static parseCursor(cursor: string): { id: string; createdAt: string } | null {
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  /**
   * Create Prisma where clause for cursor-based pagination
   */
  static createCursorWhereClause(cursor: string, orderBy: 'asc' | 'desc' = 'desc'): any {
    const parsed = this.parseCursor(cursor);
    if (!parsed) {
      return {};
    }

    const operator = orderBy === 'desc' ? 'lt' : 'gt';

    return {
      OR: [
        {
          createdAt: {
            [operator]: new Date(parsed.createdAt),
          },
        },
        {
          createdAt: new Date(parsed.createdAt),
          id: {
            [operator]: parsed.id,
          },
        },
      ],
    };
  }

  /**
   * Estimate total count for large datasets (faster than exact count)
   */
  static async estimateTotalCount(prismaModel: any, whereClause: any = {}): Promise<number> {
    // For small datasets, use exact count
    const sampleSize = 1000;
    const sample = await prismaModel.findMany({
      where: whereClause,
      take: sampleSize + 1,
      select: { id: true },
    });

    if (sample.length <= sampleSize) {
      return sample.length;
    }

    // For larger datasets, estimate based on table statistics
    // This is a simplified estimation - in production, you might use
    // database-specific features like PostgreSQL's table statistics
    const exactCount = await prismaModel.count({ where: whereClause });
    return exactCount;
  }

  /**
   * Create search pagination with filters
   */
  static createSearchPagination(
    searchQuery: string,
    filters: Record<string, any>,
    options: PaginationOptions,
  ): {
    where: any;
    orderBy: any;
    skip: number;
    take: number;
  } {
    const normalizedOptions = this.normalizePaginationOptions(options);

    // Build where clause with search and filters
    const where: any = { ...filters };

    if (searchQuery.trim()) {
      // This would be customized based on the specific model and searchable fields
      where.OR = [
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { description: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }

    return {
      where,
      orderBy: this.createOrderByClause(normalizedOptions.sortBy, normalizedOptions.sortOrder),
      skip: this.calculateSkip(normalizedOptions.page, normalizedOptions.limit),
      take: normalizedOptions.limit,
    };
  }

  /**
   * Merge multiple pagination responses (for federated queries)
   */
  static mergePaginatedResponses<T>(
    responses: PaginatedResponse<T>[],
    globalPage: number,
    globalLimit: number,
  ): PaginatedResponse<T> {
    // Combine all data
    const allData = responses.flatMap((response) => response.data);

    // Calculate global totals
    const totalItems = responses.reduce((sum, response) => sum + response.pagination.total, 0);

    // Apply global pagination to combined data
    const startIndex = (globalPage - 1) * globalLimit;
    const endIndex = startIndex + globalLimit;
    const paginatedData = allData.slice(startIndex, endIndex);

    return this.createPaginatedResponse(paginatedData, globalPage, globalLimit, totalItems);
  }
}
