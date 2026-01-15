# 🔄 FEATURE SPEC 3: WEBSOCKET REAL-TIME UPDATES
**Priority:** 🟡 MEDIUM  
**Timeline:** 2-3 days (Week 2)  
**Dev:** Dev B  
**Status:** Ready to implement  

---

## 🎯 OBJECTIVE
Enable real-time updates across the application so users see form approvals, crew assignments, and status changes instantly without refreshing.

---

## 📋 REQUIREMENTS

### **Real-time Events**
```
1. FORM EVENTS
   - Form submitted → Assigned officer sees instantly
   - Form approved/rejected → Seafarer sees instantly
   - Form comment added → All viewers notified

2. CREW EVENTS
   - Crew joined vessel → Dashboard updates
   - Crew signed off → Dashboard updates
   - Assignment status changed → Stakeholders notified

3. DOCUMENT EVENTS
   - Document uploaded → Officer sees instantly
   - Document rejected → Seafarer sees instantly
   - Document expiry updated → Dashboard updates

4. SYSTEM EVENTS
   - Sync error → Admin sees instantly
   - Bulk operation progress → Admin sees real-time
   - Server status changes → All users notified
```

### **Functional Requirements**
```
FR-1: Real-time form status updates
  - User A approves form
  - User B sees update instantly (no refresh needed)
  
FR-2: Real-time crew movement
  - Crew marked as joined
  - Dashboard timeline updates instantly
  
FR-3: Connection management
  - Auto-reconnect on disconnect
  - Show connection status
  - Queue updates during offline
  
FR-4: Notification badges
  - Badge count updates in real-time
  - New form indicators
  - Pending approvals count
```

### **Non-Functional Requirements**
```
NFR-1: Performance
  - Message latency < 100ms
  - Max 1MB/s bandwidth per connection
  - Support 100+ concurrent connections
  
NFR-2: Reliability
  - 99.9% connection uptime
  - Auto-reconnect within 5 seconds
  - Message delivery guarantee (at-least-once)
  
NFR-3: Security
  - Authenticated connections only
  - Role-based message filtering
  - No sensitive data in logs
```

---

## 🏗️ TECHNICAL DESIGN

### **Technology Stack**
```
Library: Socket.io (with fallback to polling)
Server: Node.js (integrated with Next.js)
Client: React hooks
Storage: Redis (optional, for horizontal scaling)
```

### **Architecture**

```
Multiple clients connected
       ↓
Socket.io Server (Next.js API route)
       ↓
Event happens (form approved, etc.)
       ↓
Broadcast event to subscribed clients
       ↓
Clients receive & update UI
       ↓
Users see changes instantly
```

### **File Structure**
```
src/
  lib/
    websocket/
      manager.ts              # WebSocket server setup
      events.ts               # Event definitions
      auth.ts                 # WebSocket authentication
  hooks/
    useWebSocket.ts           # React hook for WebSocket
    useRealtimeUpdates.ts     # Custom hook for updates
  app/api/
    socket/
      route.ts                # Socket.io handler
  components/
    RealtimeStatus.tsx        # Connection status indicator
    NotificationBadge.tsx     # Real-time badges
```

---

## 💻 CODE TEMPLATES

### **1. WebSocket Server Setup**

```typescript
// src/lib/websocket/manager.ts

import { Server as HTTPServer } from 'http';
import { Socket, Server } from 'socket.io';
import { verifyToken } from '@/lib/auth';

let io: Server | null = null;

export function initializeWebSocket(httpServer: HTTPServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Middleware: authenticate connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const user = await verifyToken(token);
      if (!user) {
        return next(new Error('Invalid token'));
      }

      // Attach user to socket
      (socket as any).userId = user.id;
      (socket as any).userRole = user.role;

      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    console.log(`User ${userId} connected: ${socket.id}`);

    // Join user-specific room
    socket.join(`user:${userId}`);

    // Join role-specific room
    const userRole = (socket as any).userRole;
    socket.join(`role:${userRole}`);

    // Listen for disconnect
    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for ${userId}:`, error);
    });
  });

  return io;
}

export function getWebSocket(): Server {
  if (!io) {
    throw new Error('WebSocket not initialized');
  }
  return io;
}
```

### **2. WebSocket Event Handlers**

```typescript
// src/lib/websocket/events.ts

import { getWebSocket } from './manager';

export enum WebSocketEvent {
  // Form events
  FORM_SUBMITTED = 'form:submitted',
  FORM_APPROVED = 'form:approved',
  FORM_REJECTED = 'form:rejected',
  FORM_COMMENTED = 'form:commented',

  // Crew events
  CREW_JOINED = 'crew:joined',
  CREW_SIGNED_OFF = 'crew:signed_off',
  ASSIGNMENT_UPDATED = 'assignment:updated',

  // Document events
  DOCUMENT_UPLOADED = 'document:uploaded',
  DOCUMENT_REJECTED = 'document:rejected',
  DOCUMENT_EXPIRING = 'document:expiring',

  // System events
  SYNC_ERROR = 'system:sync_error',
  BULK_PROGRESS = 'system:bulk_progress',
}

interface WebSocketEventPayload {
  id: string;
  timestamp: Date;
  data: Record<string, any>;
}

export async function broadcastFormSubmitted(
  formId: string,
  assignedOfficerId: string,
  data: any
) {
  const io = getWebSocket();
  
  io.to(`user:${assignedOfficerId}`).emit(WebSocketEvent.FORM_SUBMITTED, {
    id: formId,
    timestamp: new Date(),
    data,
  } as WebSocketEventPayload);
}

export async function broadcastFormApproved(
  formId: string,
  seafarerId: string,
  data: any
) {
  const io = getWebSocket();
  
  io.to(`user:${seafarerId}`).emit(WebSocketEvent.FORM_APPROVED, {
    id: formId,
    timestamp: new Date(),
    data,
  } as WebSocketEventPayload);
}

export async function broadcastCrewJoined(
  seafarerId: string,
  assignmentId: string,
  data: any
) {
  const io = getWebSocket();
  
  // Broadcast to all CDMO/ADMIN users
  io.to('role:ADMIN').emit(WebSocketEvent.CREW_JOINED, {
    id: assignmentId,
    timestamp: new Date(),
    data,
  } as WebSocketEventPayload);

  io.to('role:CDMO').emit(WebSocketEvent.CREW_JOINED, {
    id: assignmentId,
    timestamp: new Date(),
    data,
  } as WebSocketEventPayload);
}

export async function broadcastSystemError(
  title: string,
  message: string
) {
  const io = getWebSocket();
  
  // Only to admins
  io.to('role:ADMIN').emit(WebSocketEvent.SYNC_ERROR, {
    id: `error-${Date.now()}`,
    timestamp: new Date(),
    data: { title, message },
  } as WebSocketEventPayload);
}

export async function broadcastBulkProgress(
  operationId: string,
  progress: number,
  total: number
) {
  const io = getWebSocket();
  
  // Only to admins
  io.to('role:ADMIN').emit(WebSocketEvent.BULK_PROGRESS, {
    id: operationId,
    timestamp: new Date(),
    data: { progress, total, percentage: Math.round((progress / total) * 100) },
  } as WebSocketEventPayload);
}
```

### **3. React Hook for WebSocket**

```typescript
// src/hooks/useWebSocket.ts

'use client';

import { useEffect, useCallback, useRef } from 'react';
import io, { Socket } from 'socket.io-client';

interface UseWebSocketOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

let globalSocket: Socket | null = null;

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Reuse existing connection
    if (globalSocket && globalSocket.connected) {
      socketRef.current = globalSocket;
      return;
    }

    try {
      const token = localStorage.getItem('token') || '';
      
      const socket = io(process.env.NEXT_PUBLIC_WS_URL || '', {
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity,
        transports: ['websocket', 'polling'],
      });

      socket.on('connect', () => {
        console.log('WebSocket connected');
        options.onConnect?.();
      });

      socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
        options.onDisconnect?.();
      });

      socket.on('error', (error) => {
        console.error('WebSocket error:', error);
        options.onError?.(new Error(error));
      });

      socketRef.current = socket;
      globalSocket = socket;
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      options.onError?.(error as Error);
    }

    return () => {
      // Don't close global socket on unmount
    };
  }, [options]);

  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const on = useCallback((event: string, callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, callback);
      }
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected || false,
    emit,
    on,
  };
}
```

### **4. Real-time Updates Hook**

```typescript
// src/hooks/useRealtimeUpdates.ts

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useWebSocket, WebSocketEvent } from '@/lib/websocket';

interface RealtimeUpdate {
  id: string;
  type: string;
  data: any;
  timestamp: Date;
}

export function useRealtimeUpdates(
  events: string[],
  onUpdate?: (update: RealtimeUpdate) => void
) {
  const { on } = useWebSocket();
  const [updates, setUpdates] = useState<RealtimeUpdate[]>([]);

  useEffect(() => {
    const unsubscribers = events.map(event =>
      on(event, (payload) => {
        const update: RealtimeUpdate = {
          id: payload.id,
          type: event,
          data: payload.data,
          timestamp: new Date(payload.timestamp),
        };

        setUpdates(prev => [update, ...prev].slice(0, 100));
        onUpdate?.(update);
      })
    );

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [events, on, onUpdate]);

  return { updates };
}
```

### **5. Integration with API Routes**

```typescript
// src/app/api/forms/[id]/approve/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/db';
import { broadcastFormApproved } from '@/lib/websocket/events';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const form = await prisma.form.update({
    where: { id: params.id },
    data: {
      status: 'APPROVED',
      approvedById: session.user.id,
      approvedAt: new Date(),
    },
    include: { seafarer: true },
  });

  // Broadcast real-time update
  await broadcastFormApproved(form.id, form.seafarerId, {
    formType: form.formType,
    status: form.status,
    approvedAt: form.approvedAt,
  });

  return NextResponse.json(form);
}
```

### **6. Component Using Real-time Updates**

```typescript
// src/components/FormQueue.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { WebSocketEvent } from '@/lib/websocket/events';

export function FormQueue() {
  const [forms, setForms] = useState([]);

  const { updates } = useRealtimeUpdates(
    [WebSocketEvent.FORM_SUBMITTED, WebSocketEvent.FORM_APPROVED],
    (update) => {
      // Update forms when real-time event comes in
      if (update.type === WebSocketEvent.FORM_SUBMITTED) {
        setForms(prev => [update.data, ...prev]);
      } else if (update.type === WebSocketEvent.FORM_APPROVED) {
        setForms(prev =>
          prev.map(form =>
            form.id === update.data.id
              ? { ...form, status: 'APPROVED' }
              : form
          )
        );
      }
    }
  );

  return (
    <div>
      <h2>Form Queue ({forms.length})</h2>
      {forms.map(form => (
        <div key={form.id} className="form-card">
          {form.formType} - {form.status}
        </div>
      ))}
    </div>
  );
}
```

---

## 🧪 TESTING CHECKLIST

### **Unit Tests**
```
[ ] WebSocket initialization
[ ] Event broadcasting
[ ] User authentication
[ ] Token verification
[ ] Role-based filtering
```

### **Integration Tests**
```
[ ] Client connects to WebSocket
[ ] Event received on client
[ ] Auto-reconnect works
[ ] Multiple clients receive same event
[ ] Disconnected client doesn't receive
```

### **Functional Tests**
```
[ ] Form approval broadcasts to seafarer
[ ] Crew joined broadcasts to dashboard
[ ] Real-time badges update
[ ] Connection indicator works
[ ] Offline queue works (optional)
```

### **Performance Tests**
```
[ ] Message latency < 100ms
[ ] 100 concurrent connections stable
[ ] No memory leaks
[ ] CPU usage reasonable
```

---

## 📦 DEPENDENCIES

```bash
npm install socket.io socket.io-client
```

---

## ⚙️ ENVIRONMENT SETUP

### **Add to `.env.local`**
```env
NEXT_PUBLIC_WS_URL=http://localhost:3000
```

---

## 📋 TASKS BREAKDOWN

**Day 1 (3 hours):**
- [ ] Setup Socket.io
- [ ] Create WebSocket manager
- [ ] Create event handlers

**Day 2 (3 hours):**
- [ ] Create React hook
- [ ] Create components
- [ ] Integrate with API routes

**Day 3 (1-2 hours):**
- [ ] Test with multiple clients
- [ ] Performance testing
- [ ] Create PR & code review

---

## ✅ ACCEPTANCE CRITERIA

- ✅ Real-time form updates
- ✅ Real-time crew updates
- ✅ Message latency < 100ms
- ✅ Auto-reconnect works
- ✅ 100+ concurrent connections
- ✅ No memory leaks

---

**Status: Ready to implement 🚀**
**Start: Jan 20, 2026**
**End: Jan 24, 2026**
