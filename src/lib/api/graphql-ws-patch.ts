/**
 * Patch the browser WebSocket constructor so our GraphQL client can
 * successfully negotiate with the Lesser API Gateway.
 *
 * The gateway does not select the `graphql-transport-ws` subprotocol
 * that the `graphql-ws` client requests by default, so the browser
 * connection is rejected before the handshake completes. The Node
 * harness succeeds because it omits any subprotocol. To mirror that
 * behaviour we strip the protocol hint while preserving every other
 * part of the native WebSocket implementation.
 */

let patched = false;

export function ensureGraphQLWebSocketCompatibility(): void {
  if (patched) return;
  if (typeof window === 'undefined') return;

  const NativeWebSocket = window.WebSocket;
  if (!NativeWebSocket) return;

  class GreaterWebSocket extends NativeWebSocket {
    constructor(url: string | URL, protocols?: string | string[]) {
      // Drop the graphql-transport-ws protocol; the gateway only uses the
      // token-bearing query string and does not accept that subprotocol.
      let sanitizedProtocols: string | string[] | undefined;

      if (protocols) {
        const shouldDrop = (value: string) =>
          value?.toLowerCase() === 'graphql-transport-ws';

        if (Array.isArray(protocols)) {
          const filtered = protocols.filter((value) => !shouldDrop(value));
          sanitizedProtocols = filtered.length > 0 ? filtered : undefined;
        } else if (!shouldDrop(protocols)) {
          sanitizedProtocols = protocols;
        }
      }

      // Native WebSocket accepts URL objects; convert to string for safety.
      const targetUrl = typeof url === 'string' ? url : url.toString();
      super(targetUrl, sanitizedProtocols);
    }
  }

  window.WebSocket = GreaterWebSocket as typeof window.WebSocket;
  patched = true;
}
