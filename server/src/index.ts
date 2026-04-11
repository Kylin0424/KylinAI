import express from "express";
import cors from "cors";
import novelRouter from "./routes/novel";
import characterRouter from "./routes/character";
import searchRouter from "./routes/search";
import usageRouter from "./routes/usage";
import importRouter from "./routes/import";

// 超时中间件
const requestTimeout = 120000; // 120秒

const app = express();
const port = process.env.PORT || 9091;

// 超时处理中间件
const timeoutMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // 设置响应超时
  res.setTimeout(requestTimeout, () => {
    console.log('[TIMEOUT] Request timeout');
    if (!res.headersSent) {
      res.status(504).json({ error: '请求超时，请重试' });
    }
  });
  next();
};

// Middleware
app.use(cors());
app.use(timeoutMiddleware);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/v1/novel', novelRouter);
app.use('/api/v1/character', characterRouter);
app.use('/api/v1/search', searchRouter);
app.use('/api/v1/usage', usageRouter);
app.use('/api/v1/import', importRouter);

app.get('/api/v1/health', (req, res) => {
  console.log('Health check success');
  res.status(200).json({ status: 'ok' });
});


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}/`);
});
