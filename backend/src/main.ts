import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { join } from "path";
import { AppModule } from "./app.module";
import { env } from "./config/env";
import { setupSwagger } from "./config/swagger";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useWebSocketAdapter(new IoAdapter(app));
  app.enableCors({ origin: env.corsOrigin, credentials: true });
  app.useStaticAssets(join(process.cwd(), "uploads"), {
    prefix: "/api/uploads/files/",
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: false,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  setupSwagger(app);

  await app.listen(env.port);

  console.log(`\n======================================================`);
  console.log(`🚨 Safety Circle Emergency Backend running on port ${env.port}`);
  console.log(`📡 WebSocket Gateway ready on ws://localhost:${env.port}`);
  console.log(`🩺 Health check: http://localhost:${env.port}/health`);
  console.log(`📘 Swagger UI: http://localhost:${env.port}/api/docs`);
  console.log(`🔐 Auth system: Ready (JWT + OTP + RBAC + PIN verification)`);
  console.log(`======================================================\n`);
}

void bootstrap();
