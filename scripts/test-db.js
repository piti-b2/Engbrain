const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
})

async function main() {
  try {
    // Test the database connection
    const result = await prisma.$queryRaw`SELECT 1 as result`
    console.log('Database connection successful:', result)

    // Test user table
    const userCount = await prisma.user.count()
    console.log('Number of users:', userCount)

  } catch (error) {
    console.error('Database connection failed:', error)
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    })
  } finally {
    await prisma.$disconnect()
  }
}

main()
