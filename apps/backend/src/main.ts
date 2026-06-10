import 'reflect-metadata';
import './env.js';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
};

void bootstrap();
