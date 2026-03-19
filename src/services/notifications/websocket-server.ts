// websocket-server.ts
// TEMPORARILY DISABLED - socket.io not installed
// TODO: Install socket.io if real-time notifications are needed
// import { Server } from 'socket.io';
import { NotificationPayload } from './index';
import { logger } from '../../lib/logger';

// const io = new Server(3001, {
//     cors: { origin: '*' },
// });

// Export empty function to maintain compatibility
export const emitNotification = (notification: NotificationPayload) => {
    logger.info('[WebSocket] Disabled - notification not sent:', { notification });
    // io.to(notification.clientId).emit('notification', notification);
};

// io.on('connection', socket => {
//     const clientId = socket.handshake.query.clientId as string;
//     if (clientId) {
//         socket.join(clientId);
//     }
// });
