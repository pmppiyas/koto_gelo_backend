import { Body, Controller, Post } from '@nestjs/common';

import { AuthService } from '#app/modules/auth/auth.service.js';
import { signupSchema } from '#app/modules/auth/schemas/signup.schema.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() body: unknown) {
    const data = signupSchema.parse(body);

    return this.authService.signup(data);
  }
}
