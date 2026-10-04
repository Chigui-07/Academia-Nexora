self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "Academia Nexora";
  const options = {
    body: data.body || "Tienes una nueva actividad en Academia Nexora.",
    data: {
      url: data.url || "https://chigui-07.github.io/Academia-Nexora/",
    },
    tag: data.url || "academia-nexora",
    renotify: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "https://chigui-07.github.io/Academia-Nexora/";

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    });

    for (const client of windows) {
      if ("navigate" in client) {
        await client.navigate(targetUrl);
      }
      if ("focus" in client) {
        return client.focus();
      }
    }

    if (self.clients.openWindow) {
      return self.clients.openWindow(targetUrl);
    }

    return undefined;
  })());
});
