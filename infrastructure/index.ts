import * as pulumi from "@pulumi/pulumi";
import * as cloudflare from "@pulumi/cloudflare";

// Get configuration
const config = new pulumi.Config();
const domain = config.require("domain");
const environment = config.require("environment");
const isProd = environment === "production";

// Get the zone ID - you'll need to set this
const zoneId = config.require("zoneId");

// Create KV namespaces
const sessionKV = new cloudflare.WorkersKvNamespace("session-kv", {
    accountId: config.require("accountId"),
    title: `greater-sessions-${environment}`,
});

const cacheKV = new cloudflare.WorkersKvNamespace("cache-kv", {
    accountId: config.require("accountId"),
    title: `greater-cache-${environment}`,
});

const offlineKV = new cloudflare.WorkersKvNamespace("offline-kv", {
    accountId: config.require("accountId"),
    title: `greater-offline-${environment}`,
});

// Create R2 buckets for media storage
const mediaBucket = new cloudflare.R2Bucket("media-bucket", {
    accountId: config.require("accountId"),
    name: `greater-media-${environment}`,
    location: "auto",
});

const staticBucket = new cloudflare.R2Bucket("static-bucket", {
    accountId: config.require("accountId"),
    name: `greater-static-${environment}`,
    location: "auto",
});

// Create Worker script
const workerScript = new cloudflare.WorkerScript("greater-worker", {
    accountId: config.require("accountId"),
    name: `greater-${environment}`,
    content: pulumi.interpolate`
// This will be replaced with the actual worker bundle during deployment
addEventListener('fetch', event => {
    event.respondWith(new Response('Greater Client - ${environment}'))
})
    `,
    kvNamespaceBindings: [
        {
            name: "SESSION",
            namespaceId: sessionKV.id,
        },
        {
            name: "CACHE",
            namespaceId: cacheKV.id,
        },
        {
            name: "OFFLINE",
            namespaceId: offlineKV.id,
        },
    ],
    r2BucketBindings: [
        {
            name: "MEDIA",
            bucketName: mediaBucket.name,
        },
        {
            name: "STATIC",
            bucketName: staticBucket.name,
        },
    ],
    plainTextBindings: [
        {
            name: "ENVIRONMENT",
            text: environment,
        },
    ],
    secretTextBindings: [
        {
            name: "SENTRY_DSN",
            text: config.getSecret("sentryDsn") || "",
        },
    ],
    compatibilityDate: "2025-06-17",
    compatibilityFlags: ["nodejs_compat"],
});

// Create Worker route
const workerRoute = new cloudflare.WorkerRoute("greater-route", {
    zoneId: zoneId,
    pattern: `${domain}/*`,
    scriptName: workerScript.name,
});

// Create DNS records
const rootDns = new cloudflare.Record("root-dns", {
    zoneId: zoneId,
    name: domain.replace(/\.greater\.website$/, ""), // Just the subdomain part or @ for root
    type: "A",
    value: "192.2.0.1", // Cloudflare Workers proxy IP
    proxied: true,
});

const wwwDns = new cloudflare.Record("www-dns", {
    zoneId: zoneId,
    name: `www.${domain.replace(/\.greater\.website$/, "")}`,
    type: "CNAME",
    value: domain,
    proxied: true,
});

// Page Rules for caching
const cacheRule = new cloudflare.PageRule("cache-rule", {
    zoneId: zoneId,
    target: `${domain}/_astro/*`,
    priority: 1,
    actions: {
        cacheLevel: "cache_everything",
        edgeCacheTtl: 86400, // 1 day
        browserCacheTtl: 3600, // 1 hour
    },
});

// WAF rules
const rateLimitRule = new cloudflare.RateLimit("api-rate-limit", {
    zoneId: zoneId,
    threshold: 100,
    period: 60,
    match: {
        request: {
            urlPattern: `${domain}/api/*`,
            methods: ["POST", "PUT", "DELETE"],
        },
    },
    action: {
        mode: "challenge",
    },
});

// D1 Database for analytics (optional)
const analyticsDb = new cloudflare.D1Database("analytics-db", {
    accountId: config.require("accountId"),
    name: `greater-analytics-${environment}`,
});

// Durable Objects namespace for real-time features
const realtimeNamespace = new cloudflare.WorkersDurableObjectNamespace("realtime-namespace", {
    accountId: config.require("accountId"),
    name: `greater-realtime-${environment}`,
    className: "RealtimeCoordinator",
    scriptName: workerScript.name,
});

// Export important values
export const workerUrl = pulumi.interpolate`https://${domain}`;
export const sessionKvId = sessionKV.id;
export const cacheKvId = cacheKV.id;
export const offlineKvId = offlineKV.id;
export const mediaBucketName = mediaBucket.name;
export const staticBucketName = staticBucket.name;
export const analyticsDbId = analyticsDb.id;
export const realtimeNamespaceId = realtimeNamespace.id;