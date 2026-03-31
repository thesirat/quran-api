// Vercel catch-all entry point — delegates all requests to the Hono app.
import app from "../src/index.js";

export default app.fetch;
