# Code Citations

- CORS setup examples inspired by:
  - [Servidor-node-mysql/corsOptions.ts (CaioMMendes)](https://github.com/CaioMMendes/Servidor-node-mysql/blob/67bf7163f5debbaebebe864677e10586255da08f/src/config/corsOptions.ts)
  - [unity-spark-server/app.js (mursalinmirme)](https://github.com/mursalinmirme/unity-spark-server/blob/8c94d3575419856135501fa11c609eb3cc41600f/src/app.js)

#### Example (from those projects):

```js
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5176",
      "http://localhost:5177"
    ],
    credentials: true,
  })
);
```

## Additional Licenses

- https://github.com/CaioMMendes/Servidor-node-mysql
- https://github.com/mursalinmirme/unity-spark-server
