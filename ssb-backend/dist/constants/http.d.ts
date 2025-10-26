export declare const API_PREFIX = "/api/v1";
export declare const RESPONSE_OK: {
    readonly success: true;
};
export declare const HTTP_METHODS: {
    readonly GET: "GET";
    readonly POST: "POST";
    readonly PUT: "PUT";
    readonly PATCH: "PATCH";
    readonly DELETE: "DELETE";
    readonly OPTIONS: "OPTIONS";
};
export declare const RESPONSE_HEADERS: {
    readonly CONTENT_TYPE: "Content-Type";
    readonly AUTHORIZATION: "Authorization";
    readonly CACHE_CONTROL: "Cache-Control";
    readonly ETAG: "ETag";
    readonly LAST_MODIFIED: "Last-Modified";
    readonly X_TOTAL_COUNT: "X-Total-Count";
    readonly X_PAGE_COUNT: "X-Page-Count";
    readonly X_CURRENT_PAGE: "X-Current-Page";
    readonly X_PER_PAGE: "X-Per-Page";
    readonly X_RATE_LIMIT_REMAINING: "X-RateLimit-Remaining";
    readonly X_RATE_LIMIT_RESET: "X-RateLimit-Reset";
};
export declare const CONTENT_TYPES: {
    readonly JSON: "application/json";
    readonly FORM_DATA: "multipart/form-data";
    readonly URL_ENCODED: "application/x-www-form-urlencoded";
    readonly TEXT_PLAIN: "text/plain";
    readonly TEXT_HTML: "text/html";
    readonly IMAGE_JPEG: "image/jpeg";
    readonly IMAGE_PNG: "image/png";
    readonly IMAGE_GIF: "image/gif";
    readonly APPLICATION_PDF: "application/pdf";
    readonly APPLICATION_EXCEL: "application/vnd.ms-excel";
    readonly APPLICATION_CSV: "text/csv";
};
export declare const CACHE_CONTROL: {
    readonly NO_CACHE: "no-cache";
    readonly NO_STORE: "no-store";
    readonly PRIVATE: "private";
    readonly PUBLIC: "public";
    readonly MAX_AGE: (seconds: number) => string;
    readonly MUST_REVALIDATE: "must-revalidate";
    readonly PROXY_REVALIDATE: "proxy-revalidate";
};
export declare const PAGINATION: {
    readonly DEFAULT_PAGE: 1;
    readonly DEFAULT_LIMIT: 10;
    readonly MAX_LIMIT: 100;
    readonly MIN_LIMIT: 1;
};
export declare const SORT_OPTIONS: {
    readonly ASC: "asc";
    readonly DESC: "desc";
    readonly DEFAULT_SORT_BY: "id";
    readonly DEFAULT_SORT_ORDER: "asc";
};
export declare const FILE_UPLOAD: {
    readonly MAX_FILE_SIZE: number;
    readonly ALLOWED_IMAGE_TYPES: readonly ["image/jpeg", "image/png", "image/gif"];
    readonly ALLOWED_DOCUMENT_TYPES: readonly ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    readonly ALLOWED_SPREADSHEET_TYPES: readonly ["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
};
export declare const RATE_LIMIT: {
    readonly WINDOW_MS: number;
    readonly MAX_REQUESTS: 100;
    readonly SKIP_SUCCESSFUL_REQUESTS: false;
    readonly SKIP_FAILED_REQUESTS: false;
};
//# sourceMappingURL=http.d.ts.map