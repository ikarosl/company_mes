import { Controller, Get } from '@nestjs/common';
import { sum } from '@company/utils';

@Controller()
export class AppController {
  @Get('health')
  health() {
    return { status: 'ok', sample: sum(1, 2) };
  }
}
