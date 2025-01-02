import { NextResponse } from "next/server";
import { prismaClient } from "@/lib/prisma";

export async function GET() {
  try {
    // Get all active packages ordered by price
    const packages = await prismaClient.coinPackage.findMany({
      where: {
        active: true
      },
      orderBy: {
        price: 'asc'
      }
    });

    if (!packages || packages.length === 0) {
      return NextResponse.json([]);
    }

    // Transform the packages to match the expected format
    const transformedPackages = packages.map(pkg => ({
      id: pkg.id,
      name: pkg.name,
      coins: pkg.coins,
      bonus: pkg.bonus,
      price: Number(pkg.price),
      tag: pkg.tag,
      color: pkg.color || '#FFFFFF'
    }));

    return NextResponse.json(transformedPackages);
    
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch packages" }, 
      { status: 500 }
    );
  }
}
