import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ConfigService } from '@nestjs/config';
import express from 'express';

async function bootstrap() {
  const server = express();

  // ✅ OPTIONS preflight ДО всего
  server.options('*', (req, res) => {
    const origin = req.headers.origin ?? '';
    const allowed = [
      /^https:\/\/grant-trorntoncrm.*\.vercel\.app$/,
      /^http:\/\/localhost:\d+$/,
    ];
    if (!origin || allowed.some((r) => r.test(origin))) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-api-key');
    }
    res.sendStatus(200);
  });

  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.enableCors({
    origin: (origin, callback) => {
      const allowed = [
        /^https:\/\/grant-trorntoncrm.*\.vercel\.app$/,
        /^http:\/\/localhost:\d+$/,
      ];
      if (!origin || allowed.some((r) => r.test(origin))) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3000;

  await app.listen(port);
  console.log(`🚀 Backend started on port ${port}`);
}

bootstrap();