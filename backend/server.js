const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 8080 });

server.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('message', (message) => {
    const parsedMessage = JSON.parse(message);

    // Broadcast the message to all clients except the sender
    server.clients.forEach((client) => {
      if (client !== socket && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(parsedMessage));
      }
    });
  });

  socket.on('close', () => console.log('Client disconnected'));
});

console.log('WebSocket server running on ws://localhost:8080');
