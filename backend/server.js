// Redirect to backend, start server when called directly
const app = require("../justice-server/server.js");
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Justice server listening on port ${PORT}`);
});
