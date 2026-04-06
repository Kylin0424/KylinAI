import express from "express";
import cors from "cors";
import novelRouter from "../src/routes/novel";
import characterRouter from "../src/routes/character";
import searchRouter from "../src/routes/search";
import usageRouter from "../src/routes/usage";

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/v1/novel', novelRouter);
app.use('/api/v1/character', characterRouter);
app.use('/api/v1/search', searchRouter);
app.use('/api/v1/usage', usageRouter);

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

export default app;
