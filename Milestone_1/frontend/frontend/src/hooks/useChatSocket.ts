import { useState, useEffect, useRef, useCallback } from 'react';

const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

export interface ChatMessage {
  _id?: string;
  temp_id?: string;
  sender_id: number | string;
  receiver_id: number | string;
  message_text: string;
  status: string;
  created_at: string;
}

export function useChatSocket(token: string | null | undefined, contactId: number | string | null | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [totalUnread, setTotalUnread] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const shouldReconnectRef = useRef(false);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Track active contactId without triggering reconnects
  const activeContactIdRef = useRef(contactId);
  useEffect(() => {
    activeContactIdRef.current = contactId;
  }, [contactId]);


  // Fetch history whenever contactId changes
  useEffect(() => {
    if (!token || !contactId) {
      setMessages([]);
      return;
    }
    const fetchHistory = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/chat/history/${contactId}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.error('Failed to fetch chat history:', err);
      }
    };
    fetchHistory();
  }, [token, contactId]);

  // Fetch initial unread counts
  useEffect(() => {
    if (!token) return;
    const fetchUnread = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/chat/unread`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setUnreadCounts(data.counts_by_sender || {});
          setTotalUnread(data.total_unread || 0);
        }
      } catch (err) {
        console.error('Failed to fetch unread counts:', err);
      }
    };
    fetchUnread();
  }, [token]);


  // Single persistent WS connection per token — does NOT reconnect on contactId change
  useEffect(() => {
    if (!token) return;

    shouldReconnectRef.current = true;

    const connect = () => {
      if (!shouldReconnectRef.current) return;
      if (socketRef.current && socketRef.current.readyState < WebSocket.CLOSING) {
        return; // already open or connecting
      }

      const ws = new WebSocket(`${WEBSOCKET_URL}/api/ws/chat?token=${token}`);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.action === 'new_message') {
            const msg = data.message;
            setMessages((prev) => {
              if (prev.find(m => m._id === msg._id)) return prev;
              return [...prev, msg];
            });
            // Auto-mark read if we are currently viewing this conversation
            if (socketRef.current?.readyState === WebSocket.OPEN) {
              const currentContactId = activeContactIdRef.current;
              if (currentContactId && msg.sender_id === parseInt(String(currentContactId))) {
                socketRef.current.send(JSON.stringify({ action: 'mark_read', contact_id: currentContactId }));
              } else {
                // Increment unread count if we are not viewing this contact
                setUnreadCounts(prev => {
                  const newCounts = { ...prev };
                  const senderStr = String(msg.sender_id);
                  newCounts[senderStr] = (newCounts[senderStr] || 0) + 1;
                  return newCounts;
                });
                setTotalUnread(prev => prev + 1);
              }
            }
          } else if (data.action === 'message_delivered') {
            setMessages((prev) =>
              prev.map(m => m.temp_id === data.temp_id ? { ...data.message, status: 'delivered' } : m)
            );
          } else if (data.action === 'messages_read') {
            const readBy = data.by_user_id ?? data.contact_id;
            setMessages((prev) =>
              prev.map(m => {
                // Only flip status on messages WE sent (sender_id is -1 optimistic or our own id)
                const senderIsContact = String(m.sender_id) === String(readBy);
                if (!senderIsContact) return { ...m, status: 'read' };
                return m;
              })
            );
          }
        } catch (err) {
          console.error('WebSocket message parsing error:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        socketRef.current = null;
        if (shouldReconnectRef.current) {
          reconnectTimerRef.current = setTimeout(connect, 4000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setIsConnected(false);
    };
  }, [token]); // intentionally only depends on token

  // When contactId changes while connected, send mark_read for the new contact
  useEffect(() => {
    if (contactId && socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ action: 'mark_read', contact_id: contactId }));
      
      // Clear unread count for this contact
      setUnreadCounts(prev => {
        const newCounts = { ...prev };
        const senderStr = String(contactId);
        if (newCounts[senderStr]) {
          setTotalUnread(t => Math.max(0, t - newCounts[senderStr]));
          newCounts[senderStr] = 0;
        }
        return newCounts;
      });
    }
  }, [contactId]);

  const sendMessage = useCallback((text: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    if (!contactId || !text.trim()) return;

    const tempId = `temp_${Date.now()}`;
    const newMsg: ChatMessage = {
      temp_id: tempId,
      sender_id: -1,
      receiver_id: parseInt(String(contactId)),
      message_text: text,
      status: 'sending',
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, newMsg]);

    socketRef.current.send(JSON.stringify({
      action: 'send_message',
      contact_id: contactId,
      text,
      temp_id: tempId,
    }));
  }, [contactId]);

  return { messages, isConnected, sendMessage, unreadCounts, totalUnread };
}
