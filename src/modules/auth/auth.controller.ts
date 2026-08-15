import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from '#app/modules/auth/auth.service.js';
import {
  type SignupInput,
  signupSchema,
} from '#app/modules/auth/schemas/signup.schema.js';
import {
  type SignInInput,
  signInSchema,
} from '#app/modules/auth/schemas/signin.schema.js';
import { ZodValidation } from '#app/common/pipe/ZodValidation.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body(new ZodValidation(signupSchema)) body: SignupInput) {
    const result = await this.authService.signup(body);

    return {
      success: true,
      message: 'Signup successfull!',
      data: result,
    };
  }

  @Post('signin')
  async signin(@Body(new ZodValidation(signInSchema)) body: SignInInput) {
    const result = await this.authService.signin(body);

    return {
      success: true,
      message: 'Signin successfull!',
      data: result,
    };
  }
}
