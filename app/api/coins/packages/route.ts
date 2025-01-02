import { NextResponse, NextRequest } from "next/server";
import { auth } from "@clerk/nextjs";
import { prismaClient } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type ColorMapType = {
  [key: string]: string;
};

const colorMap: ColorMapType = {
  'เริ่มต้น': '#A8E6CF',
  'Basic': '#DCE775',
  'ยอดนิยม': '#FFAB40',
  'ดีลพิเศษ': '#CFD8DC',
  'ขายดีที่สุด': '#FFD700',
  'Platinum': '#E5E4E2',
  'Diamond': '#42A5F5',
  'Ultimate': '#212121'
};

export async function GET() {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // ดึงแพ็คเกจที่มีอยู่
    try {
      const packages = await prismaClient.coinPackage.findMany({
        orderBy: {
          price: 'asc'
        }
      });

      console.log('Existing packages:', packages);

      // ถ้าไม่มีแพ็คเกจหรือไม่มีสี ให้อัพเดทสี
      const needsColorUpdate = !packages.length || packages.some(pkg => !pkg.color);
      
      if (needsColorUpdate) {
        // อัพเดทสีให้กับแพ็คเกจที่มีอยู่
        for (const pkg of packages) {
          if (!pkg.color && pkg.tag && pkg.tag in colorMap) {
            await prismaClient.coinPackage.update({
              where: { id: pkg.id },
              data: { color: colorMap[pkg.tag] }
            });
          }
        }

        // ดึงข้อมูลใหม่หลังอัพเดท
        const updatedPackages = await prismaClient.coinPackage.findMany({
          orderBy: {
            price: 'asc'
          }
        });

        return NextResponse.json({ packages: updatedPackages });
      }

      if (!packages || packages.length === 0) {
        // ถ้าไม่มีแพ็คเกจในฐานข้อมูล ให้สร้างแพ็คเกจเริ่มต้น
        const defaultPackages = [
          {
            name: 'Starter Pack',
            price: new Prisma.Decimal(50),
            coins: 51,
            bonus: 1,
            tag: 'เริ่มต้น',
            color: '#A8E6CF'
          },
          {
            name: 'Basic Pack',
            price: new Prisma.Decimal(100),
            coins: 102,
            bonus: 2,
            tag: 'Basic',
            color: '#DCE775'
          },
          {
            name: 'Bronze Pack',
            price: new Prisma.Decimal(500),
            coins: 515,
            bonus: 15,
            tag: 'ยอดนิยม',
            color: '#FFAB40'
          },
          {
            name: 'Silver Pack',
            price: new Prisma.Decimal(1000),
            coins: 1040,
            bonus: 40,
            tag: 'ดีลพิเศษ',
            color: '#CFD8DC'
          },
          {
            name: 'Gold Pack',
            price: new Prisma.Decimal(2000),
            coins: 2100,
            bonus: 100,
            tag: 'ขายดีที่สุด',
            color: '#FFD700'
          },
          {
            name: 'Platinum Pack',
            price: new Prisma.Decimal(3000),
            coins: 3180,
            bonus: 180,
            tag: 'Platinum',
            color: '#E5E4E2'
          },
          {
            name: 'Diamond Pack',
            price: new Prisma.Decimal(5000),
            coins: 5350,
            bonus: 350,
            tag: 'Diamond',
            color: '#42A5F5'
          },
          {
            name: 'Ultimate Pack',
            price: new Prisma.Decimal(10000),
            coins: 10800,
            bonus: 800,
            tag: 'Ultimate',
            color: '#212121'
          }
        ];

        // สร้างแพ็คเกจเริ่มต้นในฐานข้อมูล
        await prismaClient.coinPackage.createMany({
          data: defaultPackages
        });

        return NextResponse.json({ packages: defaultPackages });
      }

      return NextResponse.json({ packages });
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to fetch or create packages" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in /api/coins/packages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prismaClient.$disconnect();
  }
}

export async function PUT(req: NextRequest) {
  try {
    const packages = await prismaClient.coinPackage.findMany();
    
    // อัพเดทแพ็คเกจที่มีอยู่แล้ว
    const defaultPackages = [
      {
        name: 'Starter Pack',
        price: new Prisma.Decimal(50),
        coins: 51,
        bonus: 1,
        tag: 'เริ่มต้น',
        color: '#A8E6CF'
      },
      {
        name: 'Basic Pack',
        price: new Prisma.Decimal(100),
        coins: 102,
        bonus: 2,
        tag: 'Basic',
        color: '#DCE775'
      },
      {
        name: 'Bronze Pack',
        price: new Prisma.Decimal(500),
        coins: 515,
        bonus: 15,
        tag: 'ยอดนิยม',
        color: '#FFAB40'
      },
      {
        name: 'Silver Pack',
        price: new Prisma.Decimal(1000),
        coins: 1040,
        bonus: 40,
        tag: 'ดีลพิเศษ',
        color: '#CFD8DC'
      },
      {
        name: 'Gold Pack',
        price: new Prisma.Decimal(2000),
        coins: 2100,
        bonus: 100,
        tag: 'ขายดีที่สุด',
        color: '#FFD700'
      },
      {
        name: 'Platinum Pack',
        price: new Prisma.Decimal(3000),
        coins: 3180,
        bonus: 180,
        tag: 'Platinum',
        color: '#E5E4E2'
      },
      {
        name: 'Diamond Pack',
        price: new Prisma.Decimal(5000),
        coins: 5350,
        bonus: 350,
        tag: 'Diamond',
        color: '#42A5F5'
      },
      {
        name: 'Ultimate Pack',
        price: new Prisma.Decimal(10000),
        coins: 10800,
        bonus: 800,
        tag: 'Ultimate',
        color: '#212121'
      }
    ];

    for (const pkg of packages) {
      const defaultPkg = defaultPackages.find(d => d.name === pkg.name);
      if (defaultPkg) {
        await prismaClient.coinPackage.update({
          where: { id: pkg.id },
          data: {
            color: defaultPkg.color
          }
        });
      }
    }

    return NextResponse.json({ message: 'Packages updated successfully' });
  } catch (error) {
    console.error('Error updating packages:', error);
    return NextResponse.json({ error: 'Failed to update packages' }, { status: 500 });
  }
}
