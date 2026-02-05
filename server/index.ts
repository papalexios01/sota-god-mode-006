import express from "express";
import { registerRoutes } from "./routes";

const app = express();
app.use(express.json({ limit: "10mb" }));

const corsMiddleware = (_req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "authorization, x-client-info, apikey, content-type, x-neuronwriter-key");
  if (_req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
};

app.use(corsMiddleware);
registerRoutes(app);

const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[Server] API server running on port ${PORT}`);
});
