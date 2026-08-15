import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filter/globalExceptionFilter.js';
import { GlobalResponseInterceptor } from './common/interceptor/response.interceptor.js';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalInterceptors(new GlobalResponseInterceptor());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
