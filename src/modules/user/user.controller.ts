import { Controller, Get } from '@nestjs/common';
import { UserService } from '#app/modules/user/user.service.js';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getMe() {
    return {
      success: true,
      message: 'Self inforetrieved successfully',
      data: 'OK',
    };
  }
}
