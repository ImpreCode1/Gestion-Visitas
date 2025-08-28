import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function seed() {
  console.log('🌱 Seeding database...')

  await prisma.reglaAprobador.createMany({
    data: [
      { tipo: 'LOCAL', ciudad: "Bogotá" },
      { tipo: 'NACIONAL', ciudad: null },
    ],
    skipDuplicates: true, // 👈 evita errores si ya existe
  })

  console.log('✅ Seeding completado!')
}
