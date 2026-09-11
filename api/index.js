// Vercel serverless entry: invokes the Express app per request.
// Local dev is unchanged (run `node server.js` / `npm start`).
const app = require('../server');

module.exports = app;
