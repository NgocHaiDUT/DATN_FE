import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/constants/Permission.enum';
import {
  CreatePayoutRequestDto,
  ProcessPayoutRequestDto,
  CreateBankAccountDto,
  VerifyBankAccountDto,
} from './dto/wallet.dto';

@ApiTags('Wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  // ----------------------------------------------------------
  // SELLER - Wallet
  // ----------------------------------------------------------

  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.VIEW_DASHBOARD)
  @Get('wallet/me')
  @ApiOperation({ summary: 'Xem số dư ví của seller' })
  getMyWallet(@Req() req: any) {
    return this.walletService.getWalletForSeller(req.user.userId);
  }

  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.VIEW_DASHBOARD)
  @Get('wallet/transactions')
  @ApiOperation({ summary: 'Lịch sử giao dịch ví' })
  getTransactions(@Req() req: any, @Query() query: any) {
    return this.walletService.getTransactions(
      req.user.userId,
      Number(query.page) || 1,
      Number(query.limit) || 20,
    );
  }

  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.VIEW_DASHBOARD)
  @Post('wallet/payout-request')
  @ApiOperation({ summary: 'Yêu cầu rút tiền về tài khoản ngân hàng' })
  requestPayout(@Req() req: any, @Body() dto: CreatePayoutRequestDto) {
    return this.walletService.requestPayout(req.user.userId, dto);
  }

  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.VIEW_DASHBOARD)
  @Get('wallet/payout-requests')
  @ApiOperation({ summary: 'Lịch sử yêu cầu rút tiền của seller' })
  getMyPayoutRequests(@Req() req: any, @Query() query: any) {
    return this.walletService.getMyPayoutRequests(req.user.userId, query);
  }

  // ----------------------------------------------------------
  // SELLER - Bank accounts
  // ----------------------------------------------------------

  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.VIEW_DASHBOARD)
  @Post('wallet/verify-bank-account')
  @ApiOperation({ summary: 'Xác minh số tài khoản ngân hàng qua VietQR' })
  verifyBankAccount(@Body() dto: VerifyBankAccountDto) {
    return this.walletService.verifyBankAccount(dto.bin, dto.accountNumber);
  }

  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.VIEW_DASHBOARD)
  @Get('wallet/bank-accounts')
  @ApiOperation({ summary: 'Danh sách tài khoản ngân hàng đã lưu' })
  getBankAccounts(@Req() req: any) {
    return this.walletService.getBankAccounts(req.user.userId);
  }

  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.VIEW_DASHBOARD)
  @Post('wallet/bank-accounts')
  @ApiOperation({ summary: 'Thêm tài khoản ngân hàng mới' })
  addBankAccount(@Req() req: any, @Body() dto: CreateBankAccountDto) {
    return this.walletService.addBankAccount(req.user.userId, dto);
  }

  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.VIEW_DASHBOARD)
  @Delete('wallet/bank-accounts/:id')
  @ApiOperation({ summary: 'Xóa tài khoản ngân hàng' })
  deleteBankAccount(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.walletService.deleteBankAccount(req.user.userId, id);
  }

  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.VIEW_DASHBOARD)
  @Patch('wallet/bank-accounts/:id/default')
  @ApiOperation({ summary: 'Đặt tài khoản ngân hàng làm mặc định' })
  setDefaultBankAccount(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.walletService.setDefaultBankAccount(req.user.userId, id);
  }

  // ----------------------------------------------------------
  // ADMIN
  // ----------------------------------------------------------

  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.MANAGE_USERS)
  @Get('admin/payout-requests')
  @ApiOperation({ summary: '[Admin] Danh sách yêu cầu rút tiền' })
  adminListPayouts(@Query() query: any) {
    return this.walletService.adminListPayoutRequests(query);
  }

  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.MANAGE_USERS)
  @Patch('admin/payout-requests/:id')
  @ApiOperation({ summary: '[Admin] Duyệt / từ chối yêu cầu rút tiền' })
  adminProcessPayout(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ProcessPayoutRequestDto,
  ) {
    return this.walletService.adminProcessPayout(id, dto);
  }

  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.MANAGE_USERS)
  @Get('admin/platform-revenue')
  @ApiOperation({ summary: '[Admin] Doanh thu nền tảng (hoa hồng)' })
  adminPlatformRevenue(@Query() query: any) {
    return this.walletService.adminGetPlatformRevenue(query);
  }
}
