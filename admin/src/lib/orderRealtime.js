export const createOrderEventSource = (url, token, onOrderUpdate) => {
  if (!url || typeof window === "undefined" || !window.EventSource) {
    return null;
  }

  const streamUrl = token
    ? `${url}/api/order/stream?token=${encodeURIComponent(token)}`
    : `${url}/api/order/stream`;

  const source = new EventSource(streamUrl);

  source.addEventListener("message", (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data?.success && data?.order) {
        onOrderUpdate?.(data.order);
      }
    } catch (error) {
      console.error("Failed to parse order stream event:", error);
    }
  });

  return source;
};
