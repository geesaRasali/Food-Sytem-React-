const orderClients = new Set();

export const registerOrderClient = (res) => {
  orderClients.add(res);

  res.write("event: ready\n");
  res.write(`data: ${JSON.stringify({ success: true })}\n\n`);

  res.on("close", () => {
    orderClients.delete(res);
  });
};

export const emitOrderUpdate = (order) => {
  const payload = `data: ${JSON.stringify({ success: true, order })}\n\n`;

  for (const client of orderClients) {
    client.write(payload);
  }
};
