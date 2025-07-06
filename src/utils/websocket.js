import { useState, useEffect, useRef } from 'react';

export function useWebSocket() {
  const [ws, setWs] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    connect();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (ws) {
        ws.close();
      }
    };
  }, []);

  const connect = async () => {
    try {
      // Fetch server configuration to get the correct WebSocket URL
      let wsBaseUrl;
      try {
        const configResponse = await fetch('/api/config');
        const config = await configResponse.json();
        wsBaseUrl = config.wsUrl;
        
        // If the config returns localhost but we're not on localhost, use current host
        if (wsBaseUrl.includes('localhost') && !window.location.hostname.includes('localhost')) {
          console.warn('Config returned localhost, using current host instead');
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          // Use the proxied WebSocket through the same port as the frontend
          wsBaseUrl = `${protocol}//${window.location.host}`;
        }
        
        // Ensure WebSocket protocol matches page protocol
        if (window.location.protocol === 'https:' && wsBaseUrl.startsWith('ws:')) {
          wsBaseUrl = wsBaseUrl.replace('ws:', 'wss:');
        }
      } catch (error) {
        console.warn('Could not fetch server config, falling back to proxy');
        // When config fails, use the proxied WebSocket path
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        wsBaseUrl = `${protocol}//${window.location.host}`;
      }
      
      const wsUrl = `${wsBaseUrl}/ws`;
      const websocket = new WebSocket(wsUrl);

      websocket.onopen = () => {
        setIsConnected(true);
        setWs(websocket);
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setMessages(prev => [...prev, data]);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      websocket.onclose = () => {
        setIsConnected(false);
        setWs(null);
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  };

  const sendMessage = (message) => {
    if (ws && isConnected) {
      ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected');
    }
  };

  return {
    ws,
    sendMessage,
    messages,
    isConnected
  };
}