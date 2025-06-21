/**
 * WebSocket streaming implementation for instances that require WebSocket connections
 * (e.g., lesser.host)
 */

import { secureAuthClient } from '@/lib/auth/secure-client';

export interface WebSocketStreamOptions {
  instance: string;
  stream: 'user' | 'public' | 'hashtag' | 'list';
  params?: Record<string, string>;
  onMessage: (event: MessageEvent) => void;
  onError?: (error: Event | Error) => void;
  onClose?: (event: CloseEvent) => void;
  onOpen?: (event: Event) => void;
}

export class WebSocketStream {
  private ws: WebSocket | null = null;
  private reconnectTimeout: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private maxReconnectDelay = 30000; // Max 30 seconds
  private heartbeatInterval: number | null = null;
  private options: WebSocketStreamOptions;
  private isManualClose = false;

  constructor(options: WebSocketStreamOptions) {
    this.options = options;
  }

  async connect(websocketUrl?: string): Promise<void> {
    try {
      this.isManualClose = false;
      
      // Get access token
      const token = await secureAuthClient.getToken(this.options.instance);
      if (!token) {
        throw new Error('No access token available');
      }

      let url: string;
      
      if (websocketUrl) {
        // Use the provided WebSocket URL (from lesser.host response)
        url = websocketUrl;
      } else {
        // Construct standard Mastodon WebSocket URL
        const wsProtocol = this.options.instance.startsWith('https') ? 'wss' : 'ws';
        const baseUrl = this.options.instance.replace(/^https?:\/\//, '');
        url = `${wsProtocol}://${baseUrl}/api/v1/streaming`;
        
        const params = new URLSearchParams({
          access_token: token.access_token,
          stream: this.options.stream,
          ...this.options.params
        });
        
        url += '?' + params.toString();
      }

      console.log('[WebSocket] Connecting to:', url);
      
      this.ws = new WebSocket(url);
      
      this.ws.onopen = (event) => {
        console.log('[WebSocket] Connected');
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.startHeartbeat();
        this.options.onOpen?.(event);
      };

      this.ws.onmessage = (event) => {
        try {
          // Parse the WebSocket message
          const data = JSON.parse(event.data);
          
          // Handle ping/pong for keepalive
          if (data.type === 'ping') {
            this.ws?.send(JSON.stringify({ type: 'pong' }));
            return;
          }
          
          // Convert WebSocket format to SSE format for compatibility
          if (data.event) {
            const sseEvent = new MessageEvent(data.event, {
              data: JSON.stringify(data.payload)
            });
            this.options.onMessage(sseEvent);
          }
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
          this.options.onError?.(error as Error);
        }
      };

      this.ws.onerror = (event) => {
        console.error('[WebSocket] Error:', event);
        this.options.onError?.(event);
      };

      this.ws.onclose = (event) => {
        console.log('[WebSocket] Closed:', event.code, event.reason);
        this.stopHeartbeat();
        this.options.onClose?.(event);
        
        // Attempt reconnection if not manually closed
        if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect(websocketUrl);
        }
      };
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
      this.options.onError?.(error as Error);
      
      // Schedule reconnection on initial connection failure
      if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect(websocketUrl);
      }
    }
  }

  private scheduleReconnect(websocketUrl?: string): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );

    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);

    this.reconnectTimeout = window.setTimeout(() => {
      this.reconnectAttempts++;
      this.connect(websocketUrl);
    }, delay);
  }

  private startHeartbeat(): void {
    // Send ping every 30 seconds to keep connection alive
    this.heartbeatInterval = window.setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  disconnect(): void {
    this.isManualClose = true;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

/**
 * Check if an instance requires WebSocket streaming by attempting SSE first
 */
export async function checkStreamingMethod(instance: string, stream: string): Promise<{
  method: 'sse' | 'websocket';
  websocketUrl?: string;
}> {
  try {
    const token = await secureAuthClient.getToken(instance);
    if (!token) {
      return { method: 'sse' }; // Default to SSE if no token
    }

    const baseUrl = instance.startsWith('http') ? instance : `https://${instance}`;
    const url = `${baseUrl}/api/v1/streaming/${stream}?access_token=${token.access_token}`;

    // Try to fetch with a short timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(url, {
      headers: {
        'Accept': 'text/event-stream',
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // Check if response indicates WebSocket is required
    if (!response.ok && response.headers.get('content-type')?.includes('application/json')) {
      const data = await response.json();
      if (data.error?.includes('WebSocket') && data.websocket_url) {
        return {
          method: 'websocket',
          websocketUrl: data.websocket_url
        };
      }
    }

    // If we get here, SSE should work
    return { method: 'sse' };
  } catch (error) {
    console.log('[Streaming] Error checking streaming method:', error);
    // Default to SSE on error
    return { method: 'sse' };
  }
}