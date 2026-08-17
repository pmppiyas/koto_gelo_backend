import { Controller, Get } from '@nestjs/common';
import { UserService } from '#app/modules/user/user.service.js';

@Controller({
  path: 'user',
  version: '1',
})
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
