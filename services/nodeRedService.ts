
import { APP_CONFIG } from '../constants';
import { NodeRedPayload } from '../types';

type MessageCallback = (data: NodeRedPayload | NodeRedPayload[]) => void;
type StatusCallback = (status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR') => void;
type ErrorCallback = (error: string) => void;

class NodeRedService {
  private ws: WebSocket | null = null;
  private reconnectTimeout: number | null = null;
  private url: string;
  
  // Stored callbacks
  private onMessage: MessageCallback | null = null;
  private onStatusChange: StatusCallback | null = null;
  private onError: ErrorCallback | null = null;

  constructor() {
    this.url = APP_CONFIG.WS_URL;
  }

  public connect(onMessage: MessageCallback, onStatusChange: StatusCallback, onError?: ErrorCallback) {
    this.onMessage = onMessage;
    this.onStatusChange = onStatusChange;
    this.onError = onError || null;

    if (this.ws?.readyState === WebSocket.OPEN) {
      onStatusChange('CONNECTED');
    } else {
      this.initWebSocket();
    }

    return () => this.disconnect();
  }

  public updateConnectionConfig(url: string, onMessage?: MessageCallback, onStatusChange?: StatusCallback) {
    if (onMessage) this.onMessage = onMessage;
    if (onStatusChange) this.onStatusChange = onStatusChange;
    
    if (this.url === url && this.ws?.readyState === WebSocket.OPEN) return;
    
    this.url = url;
    this.disconnect();
    this.initWebSocket();
  }

  private initWebSocket() {
    if (this.ws) {
        this.ws.onclose = null;
        this.ws.onerror = null;
        this.ws.onmessage = null;
        this.ws.close();
    }

    this.onStatusChange?.('CONNECTING');

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('[WS] Connected to Node-RED');
        this.onStatusChange?.('CONNECTED');
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.onMessage?.(data);
        } catch (e) {
          console.error('[WS] JSON Parse error');
          this.onError?.('JSON Parse Error');
        }
      };

      this.ws.onclose = () => {
        this.onStatusChange?.('DISCONNECTED');
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.onStatusChange?.('ERROR');
        this.onError?.('Connection Error');
      };

    } catch (e) {
      this.onStatusChange?.('ERROR');
      this.onError?.('Connection Failed');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (!this.reconnectTimeout) {
      this.reconnectTimeout = window.setTimeout(() => {
        this.initWebSocket();
      }, 5000);
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.onclose = null; 
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
}

export const nodeRedService = new NodeRedService();
