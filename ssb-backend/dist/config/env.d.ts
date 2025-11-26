interface Config {
    port: number;
    nodeEnv: string;
    database: {
        host: string;
        user: string;
        password: string;
        name: string;
    };
    jwt: {
        secret: string;
        refreshSecret: string;
        expiresIn: string;
        refreshExpiresIn: string;
    };
    frontend: {
        origin: string | string[];
    };
    socket: {
        corsOrigin: string;
    };
    websocket: {
        enabled: boolean;
    };
    api: {
        prefix: string;
    };
    logging: {
        level: string;
        file: string;
    };
    rateLimit: {
        windowMs: number;
        maxRequests: number;
    };
    upload: {
        maxFileSize: number;
        path: string;
    };
    email?: {
        host: string;
        port: number;
        user: string;
        password: string;
    };
    redis?: {
        host: string;
        port: number;
        password?: string;
    };
    monitoring?: {
        sentryDsn?: string;
    };
}
declare const config: Config;
export default config;
//# sourceMappingURL=env.d.ts.map