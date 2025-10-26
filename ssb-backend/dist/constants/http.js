export const API_PREFIX = "/api/v1";
export const RESPONSE_OK = { success: true };
export const HTTP_METHODS = {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    PATCH: 'PATCH',
    DELETE: 'DELETE',
    OPTIONS: 'OPTIONS',
};
export const RESPONSE_HEADERS = {
    CONTENT_TYPE: 'Content-Type',
    AUTHORIZATION: 'Authorization',
    CACHE_CONTROL: 'Cache-Control',
    ETAG: 'ETag',
    LAST_MODIFIED: 'Last-Modified',
    X_TOTAL_COUNT: 'X-Total-Count',
    X_PAGE_COUNT: 'X-Page-Count',
    X_CURRENT_PAGE: 'X-Current-Page',
    X_PER_PAGE: 'X-Per-Page',
    X_RATE_LIMIT_REMAINING: 'X-RateLimit-Remaining',
    X_RATE_LIMIT_RESET: 'X-RateLimit-Reset',
};
export const CONTENT_TYPES = {
    JSON: 'application/json',
    FORM_DATA: 'multipart/form-data',
    URL_ENCODED: 'application/x-www-form-urlencoded',
    TEXT_PLAIN: 'text/plain',
    TEXT_HTML: 'text/html',
    IMAGE_JPEG: 'image/jpeg',
    IMAGE_PNG: 'image/png',
    IMAGE_GIF: 'image/gif',
    APPLICATION_PDF: 'application/pdf',
    APPLICATION_EXCEL: 'application/vnd.ms-excel',
    APPLICATION_CSV: 'text/csv',
};
export const CACHE_CONTROL = {
    NO_CACHE: 'no-cache',
    NO_STORE: 'no-store',
    PRIVATE: 'private',
    PUBLIC: 'public',
    MAX_AGE: (seconds) => `max-age=${seconds}`,
    MUST_REVALIDATE: 'must-revalidate',
    PROXY_REVALIDATE: 'proxy-revalidate',
};
export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
    MIN_LIMIT: 1,
};
export const SORT_OPTIONS = {
    ASC: 'asc',
    DESC: 'desc',
    DEFAULT_SORT_BY: 'id',
    DEFAULT_SORT_ORDER: 'asc',
};
export const FILE_UPLOAD = {
    MAX_FILE_SIZE: 5 * 1024 * 1024,
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
    ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    ALLOWED_SPREADSHEET_TYPES: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
};
export const RATE_LIMIT = {
    WINDOW_MS: 15 * 60 * 1000,
    MAX_REQUESTS: 100,
    SKIP_SUCCESSFUL_REQUESTS: false,
    SKIP_FAILED_REQUESTS: false,
};
//# sourceMappingURL=http.js.map