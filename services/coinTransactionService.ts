import { prismaClient } from '@/lib/prisma';
import { CoinTransactionType, CoinTransactionReason, CoinTransactionStatus } from '@prisma/client';

export class CoinTransactionService {
  // เพิ่มเหรียญ
  static async addCoins(
    userId: string,
    amount: number,
    reason: CoinTransactionReason,
    description?: string,
    metadata?: any
  ) {
    return await prismaClient.$transaction(async (tx) => {
      // ดึงข้อมูลผู้ใช้
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { coins: true }
      });

      if (!user) throw new Error('User not found');

      const newBalance = user.coins + amount;

      // อัพเดทจำนวนเหรียญของผู้ใช้
      await tx.user.update({
        where: { id: userId },
        data: { coins: newBalance }
      });

      // สร้างรายการธุรกรรม
      const transaction = await tx.coinTransaction.create({
        data: {
          userId,
          amount,
          balance: newBalance,
          type: CoinTransactionType.CREDIT,
          reason,
          description,
          metadata,
          status: CoinTransactionStatus.COMPLETED
        }
      });

      return transaction;
    });
  }

  // ลดเหรียญ
  static async deductCoins(
    userId: string,
    amount: number,
    reason: CoinTransactionReason,
    description?: string,
    metadata?: any
  ) {
    return await prismaClient.$transaction(async (tx) => {
      // ดึงข้อมูลผู้ใช้
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { coins: true }
      });

      if (!user) throw new Error('User not found');
      if (user.coins < amount) throw new Error('Insufficient coins');

      const newBalance = user.coins - amount;

      // อัพเดทจำนวนเหรียญของผู้ใช้
      await tx.user.update({
        where: { id: userId },
        data: { coins: newBalance }
      });

      // สร้างรายการธุรกรรม
      const transaction = await tx.coinTransaction.create({
        data: {
          userId,
          amount: -amount,  // ใส่เครื่องหมายลบเพื่อแสดงว่าเป็นการลดเหรียญ
          balance: newBalance,
          type: CoinTransactionType.DEBIT,
          reason,
          description,
          metadata,
          status: CoinTransactionStatus.COMPLETED
        }
      });

      return transaction;
    });
  }

  // ดึงประวัติธุรกรรม
  static async getTransactionHistory(
    clerkId: string,
    page: number = 1,
    limit: number = 10
  ) {
    const skip = (page - 1) * limit;

    console.log('Finding user with clerkId:', clerkId);
    // หา userId จากตาราง User ก่อน
    const user = await prismaClient.user.findUnique({
      where: { clerkId }
    });

    console.log('Found user:', user);

    if (!user) {
      console.log('User not found');
      return {
        transactions: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0
        }
      };
    }

    console.log('Finding transactions for userId:', user.id);
    const [transactions, total] = await Promise.all([
      prismaClient.coinTransaction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          amount: true,
          type: true,
          reason: true,
          description: true,
          status: true,
          createdAt: true,
          balance: true
        }
      }),
      prismaClient.coinTransaction.count({
        where: { userId: user.id }
      })
    ]);

    console.log('Found transactions:', transactions);
    console.log('Total transactions:', total);

    return {
      transactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}
