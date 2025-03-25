const WebSocket = require("ws");

function initTicketSocket(server) {
    const wss = new WebSocket.Server({ server });

    wss.on("connection", (ws) => {
        ws.on("message", (message) => {
            const data = JSON.parse(message);
            if (data.type === "UPDATE_TICKETS") {
                ws.send(JSON.stringify({ type: "TICKET_UPDATE", availableTickets: data.count }));
            }
        });
    });
}

module.exports = initTicketSocket;