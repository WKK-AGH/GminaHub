import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../../utils/helpers/hash.helper';

const prisma = new PrismaClient();

async function main() {
    console.log('Rozpoczęto seedowanie bazy danych...');

    const adminRole = await prisma.role.upsert({
        where: { name: 'ADMINISTRATOR' },
        update: {},
        create: { name: 'ADMINISTRATOR' },
    });

    await prisma.role.upsert({
        where: { name: 'PRZEWODNICZACY' },
        update: {},
        create: { name: 'PRZEWODNICZACY' },
    });

    await prisma.role.upsert({
        where: { name: 'RADNY' },
        update: {},
        create: { name: 'RADNY' },
    });

    console.log('Role zostały zsynchronizowane.');

    const defaultAdminLogin = 'admin';
    const hashedPassword = await hashPassword('Admin123!');
    const adminUser = await prisma.user.upsert({
        where: { login: defaultAdminLogin },
        update: {},
        create: {
            login: defaultAdminLogin,
            password: hashedPassword,
            firstName: 'Główny',
            lastName: 'Administrator',
            roleId: adminRole.id,
        },
    });

    console.log(`Utworzono domyślne konto administratora (Login: ${adminUser.login})`);
    console.log('Seedowanie zakończone sukcesem.');
}

main()
    .catch((e) => {
        console.error('Błąd podczas seedowania bazy danych:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
