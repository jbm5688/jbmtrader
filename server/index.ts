import express from 'express';
import { registerRoutes } from './routes';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

registerRoutes(app).then(() => {
  if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  }
});

export default app;
