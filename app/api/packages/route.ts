import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const packages = await prisma.coinPackage.findMany({
      where: {
        is_active: true
      },
      orderBy: {
        price: 'asc'
      }
    });

    // Transform data to match frontend format
    const transformedPackages = packages.map(pkg => ({
      id: pkg.id,
      name: pkg.name,
      coins: pkg.coins_amount,
      bonus: pkg.bonus_coins,
      price: Number(pkg.price),
      popular: pkg.is_popular,
      tag: pkg.description || '',
      color: pkg.color || '#FFFFFF'
    }));

    return NextResponse.json(transformedPackages);
  } catch (error) {
    console.error('Error fetching packages:', error);
    return new NextResponse(JSON.stringify({ error: "Failed to fetch packages" }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
