import * as pulumi from "@pulumi/pulumi";
import * as cloudflare from "@pulumi/cloudflare";

// Configuration
const config = new pulumi.Config();
const domain = config.get("domain") || "dev.greater.website";
const isProd = pulumi.getStack() === "prod";

// Create a simple Worker script first
const workerScript = new cloudflare.WorkerScript("greater-worker", {
    name: `greater-${pulumi.getStack()}`,
    content: `
export default {
  async fetch(request, env, ctx) {
    return new Response('Greater Client - Coming Soon!', {
      headers: { 'Content-Type': 'text/plain' },
    });
  },
};
    `,
    module: true,
});

// Export the worker URL
export const workerUrl = pulumi.interpolate`https://${workerScript.name}.workers.dev`;