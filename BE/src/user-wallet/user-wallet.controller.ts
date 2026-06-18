import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
  Request,
  Res,
  Logger,
} from '@nestjs/common';
import { type Response } from 'express';
import { UserWalletService } from './user-wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';

@Controller('user-wallet')
export class UserWalletController {
  private readonly logger = new Logger(UserWalletController.name);

  constructor(
    private readonly userWalletService: UserWalletService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getWallet(@Request() req: any) {
    const userId = req.user.userId || req.user.id;
    return this.userWalletService.getWallet(userId);
  }

  @Get('transactions')
  @UseGuards(JwtAuthGuard)
  getTransactions(
    @Request() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const userId = req.user.userId || req.user.id;
    return this.userWalletService.getTransactions(
      userId,
      Number(page),
      Number(limit),
    );
  }

  @Post('topup')
  @UseGuards(JwtAuthGuard)
  async initiateTopup(@Request() req: any, @Body() body: { amount: number }) {
    const userId = req.user.userId || req.user.id;
    const ipAddr =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket?.remoteAddress ||
      '127.0.0.1';
    const paymentUrl = await this.userWalletService.initiateTopup(
      userId,
      body.amount,
      ipAddr,
    );
    return { success: true, paymentUrl };
  }

  @Get('topup-return')
  async topupReturn(
    @Query() query: Record<string, string>,
    @Res() res: Response,
  ) {
    this.logger.log(`VNPay topup return: ${JSON.stringify(query)}`);
    const result = await this.userWalletService.confirmTopup(query);
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';

    if (result.success) {
      res.redirect(`${frontendUrl}/profile?tab=wallet&topup=success`);
    } else {
      res.redirect(`${frontendUrl}/profile?tab=wallet&topup=fail`);
    }
  }

  @Get('topup-ipn')
  async topupIpn(@Query() query: Record<string, string>, @Res() res: Response) {
    this.logger.log(`VNPay topup IPN: ${JSON.stringify(query)}`);
    await this.userWalletService.confirmTopup(query);
    res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
  }
}
