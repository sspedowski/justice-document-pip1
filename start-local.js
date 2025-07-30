const { spawn } = require("child_process");

console.log("🚀 Starting Justice Dashboard locally...");

const server = spawn("node", ["server.js"], { cwd: "./justice-server", stdio: "inherit" });
const client = spawn("npm", ["run", "dev"], { cwd: "./justice-dashboard", stdio: "inherit" });

process.on("SIGINT", () => {
  console.log("\n🛑 Stopping...");
  server.kill();
  client.kill();
});
