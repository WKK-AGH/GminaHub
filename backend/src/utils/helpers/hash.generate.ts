import { hashPassword } from '@/utils/helpers/hash.helper';

async function main() {
    const password = process.argv[2];
    const count = Number(process.argv[3] ?? 1);

    if (!password) {
        console.error('Podaj hasło jako argument, np.:');
        console.error('   npx tsx src/hash.generate.ts "password123" 3');
        process.exit(1);
    }

    if (!Number.isInteger(count) || count < 1) {
        console.error('Liczba wygenerowań musi być liczbą całkowitą >= 1');
        process.exit(1);
    }

    console.log(`Hasło: ${password}`);
    console.log(`Liczba hashy: ${count}\n`);

    for (let i = 1; i <= count; i++) {
        const hash = await hashPassword(password);
        console.log(`[${i}] ${hash}`);
    }
}

main();
