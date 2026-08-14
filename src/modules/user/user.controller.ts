import { Controller, Get } from '@nestjs/common';
import { UserService } from 'src/modules/user/user.service';

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
