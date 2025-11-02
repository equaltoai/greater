import * as pulumi from "@pulumi/pulumi";
import * as cloudflare from "@pulumi/cloudflare";

// Configuration
const stackName = pulumi.getStack();
const config = new pulumi.Config();
const domain = config.get("domain") || `${stackName}.greater.website`;

// Create a simple Worker script first
const workerScript = new cloudflare.WorkerScript("greater-worker", {
    name: `greater-${stackName}`,
    content: `
export default {
  async fetch(request, env, ctx) {
    return new Response('Greater Client - Coming Soon for ${domain}!', {
      headers: { 'Content-Type': 'text/plain' },
    });
  },
};
    `,
    module: true,
});

// Export the worker URL
export const workerUrl = pulumi.interpolate`https://${workerScript.name}.workers.dev`;
