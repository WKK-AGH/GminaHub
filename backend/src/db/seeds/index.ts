// import { PrismaClient } from '@prisma/client';
// import { hashPassword } from '../../utils/helpers/hash.helper';

// const prisma = new PrismaClient();

// async function main() {
//     console.log('Rozpoczęto seedowanie bazy danych...');

//     const adminRole = await prisma.role.upsert({
//         where: { name: 'ADMIN' },
//         update: {},
//         create: { name: 'ADMIN' },
//     });

//     await prisma.role.upsert({
//         where: { name: 'CHAIRPERSON' },
//         update: {},
//         create: { name: 'CHAIRPERSON' },
//     });

//     await prisma.role.upsert({
//         where: { name: 'MEMBER' },
//         update: {},
//         create: { name: 'MEMBER' },
//     });

//     console.log('Role zostały zsynchronizowane.');

//     const defaultAdminLogin = 'admin';
//     const hashedPassword = await hashPassword('Admin123!');
//     const adminUser = await prisma.user.upsert({
//         where: { firstName: defaultAdminLogin },
//         update: {},
//         create: {
//             passwordHash: hashedPassword,
//             firstName: 'Główny',
//             lastName: 'ADMIN',
//             roleId: adminRole.id,
//         },
//     });

//     console.log(`Utworzono domyślne konto administratora (Login: ${adminUser.login})`);
//     console.log('Seedowanie zakończone sukcesem.');
// }

// main()
//     .catch((e) => {
//         console.error('Błąd podczas seedowania bazy danych:', e);
//         process.exit(1);
//     })
//     .finally(async () => {
//         await prisma.$disconnect();
//     });
