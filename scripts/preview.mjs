import { preview } from "vite";

const server = await preview();
server.printUrls();

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => server.httpServer.close(() => process.exit(0)));
}
