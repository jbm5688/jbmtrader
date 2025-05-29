import type { Express } from "express";

export function setupHealthCheck(app: Express) {
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        database: 'connected',
        payPerGain: 'active',
        brokers: ['iq-option', 'quotex', 'avalon']
      }
    });
  });
}