import { AppService } from '#app/app.service.js';
import { Controller, Get } from '@nestjs/common';

@Controller({
  version: '1',
})
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
