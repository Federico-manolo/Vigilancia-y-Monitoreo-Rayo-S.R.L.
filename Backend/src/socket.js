// socket.js
const { Server } = require('socket.io');

let io;

function initSockets(server) {
    io = new Server(server, {
        cors: {
            origin: '*', // ajustar según origen real del frontend
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        console.log('Nuevo cliente conectado:', socket.id);

        socket.on('disconnect', () => {
            console.log('Cliente desconectado:', socket.id);
        });
    });
}

function getIO() {
    if (!io) {
        throw new Error('Sockets no inicializados!');
    }
    return io;
}

module.exports = { initSockets, getIO };
