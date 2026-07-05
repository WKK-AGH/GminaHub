const { execSync, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const postgresDir = path.join(__dirname, '..', 'postgres');
const targetDataDir = path.join(postgresDir, 'data');
const initSqlDir = path.join(postgresDir, 'init');
const versionFilePath = path.join(targetDataDir, 'PG_VERSION');
const logFilePath = path.join(postgresDir, 'database.log');

const pgBinDir = `C:\\Program Files\\PostgreSQL\\18\\bin`;
const initdbPath = `"${path.join(pgBinDir, 'initdb.exe')}"`;
const pgCtlPath = `"${path.join(pgBinDir, 'pg_ctl.exe')}"`;
const psqlPath = `"${path.join(pgBinDir, 'psql.exe')}"`;

console.log('\x1b[34m%s\x1b[0m', '> Sprawdzanie, czy PostgreSQL działa w tle...\n');
try {
    const taskList = execSync('tasklist /FI "IMAGENAME eq postgres.exe"', { encoding: 'utf8' });

    if (taskList.includes('postgres.exe')) {
        console.log('Wykryto działający proces postgres.exe. Zamykanie...\n');
        execSync('taskkill /f /im postgres.exe', { stdio: 'ignore' });
        console.log('\x1b[32m%s\x1b[0m', 'SUKCES: Poprzedni proces został zamknięty.\n');

        execSync('timeout /t 1 /nobreak', { stdio: 'ignore' });
    } else {
        console.log('Brak aktywnych procesów postgres.exe.\n');
    }
} catch (err) {
    console.log(
        '\x1b[36m%s\x1b[0m',
        'Nie udało się sprawdzić procesów lub brak uprawnień, kontynuuję...\n',
    );
}

const isFirstRun = !fs.existsSync(versionFilePath);

if (!fs.existsSync(targetDataDir)) {
    fs.mkdirSync(targetDataDir, { recursive: true });
}

if (isFirstRun) {
    console.log('\x1b[34m%s\x1b[0m', '> Inicjalizowanie nowego klastra w postgres/data...\n');
    try {
        execSync(`${initdbPath} -D "${targetDataDir}" -E UTF8 --locale=C -U postgres`);
        console.log('\x1b[32m%s\x1b[0m', 'SUKCES: Klaster zainicjalizowany.\n');

        const hbaPath = path.join(targetDataDir, 'pg_hba.conf');
        if (fs.existsSync(hbaPath)) {
            let hbaContent = fs.readFileSync(hbaPath, 'utf8');
            hbaContent = hbaContent.replace(
                /127\.0\.0\.1\/32\s+scram-sha-256/g,
                '127.0.0.1/32            trust',
            );
            hbaContent = hbaContent.replace(
                /::1\/128\s+scram-sha-256/g,
                '::1/128                 trust',
            );
            fs.writeFileSync(hbaPath, hbaContent, 'utf8');
            console.log(
                '\x1b[36m%s\x1b[0m',
                'Skonfigurowano autoryzację typu "trust" dla localhost.\n',
            );
        }
    } catch (error) {
        console.error('\x1b[31m%s\x1b[0m', `BLAD: Podczas initdb: ${error.message}`);
        process.exit(1);
    }
}

console.log('\x1b[34m%s\x1b[0m', '> Uruchamianie PostgreSQL...\n');
const startCommand = `${pgCtlPath} start -D "${targetDataDir}" -l "${logFilePath}"`;

exec(startCommand, (error) => {
    if (error) {
        console.error('\x1b[31m%s\x1b[0m', `BLAD: Serwer zgłosił problem przy starcie.`);
        if (fs.existsSync(logFilePath)) {
            console.log('\n--- TREŚĆ SERVER.LOG ---');
            console.log(fs.readFileSync(logFilePath, 'utf8'));
            console.log('------------------------\n');
        }
    }
});

console.log('\x1b[34m%s\x1b[0m', '> Wysłano żądanie uruchomienia do pg_ctl.\n');

if (isFirstRun && fs.existsSync(initSqlDir)) {
    console.log(
        '\x1b[33m%s\x1b[0m',
        '> Oczekiwanie 2 sekundy na pełne uruchomienie bazy danych...\n',
    );

    setTimeout(() => {
        console.log(
            '\x1b[34m%s\x1b[0m',
            '> Szukanie skryptów inicjalizacyjnych w postgres/init...\n',
        );
        const sqlFiles = fs
            .readdirSync(initSqlDir)
            .filter((file) => file.endsWith('.sql'))
            .sort();

        if (sqlFiles.length === 0) {
            console.log('Nie znaleziono plików .sql w folderze init.\n');
            return;
        }

        console.log(`Znaleziono pliki do wykonania: ${sqlFiles.join(', ')}\n`);

        sqlFiles.forEach((file) => {
            const fullSqlPath = path.join(initSqlDir, file);
            console.log('\x1b[34m%s\x1b[0m', `> Wykonywanie: ${file}...\n`);
            try {
                execSync(
                    `${psqlPath} -U postgres -d postgres -f "${fullSqlPath}" -v ON_ERROR_STOP=1`,
                    { stdio: 'ignore' },
                );
                console.log('\x1b[32m%s\x1b[0m', `SUKCES: Zakończono sukcesem: ${file}\n`);
            } catch (sqlError) {
                console.error('\x1b[31m%s\x1b[0m', `BLAD: Podczas wykonywania pliku ${file}.\n`);
                process.exit(1);
            }
        });

        console.log(
            '\x1b[32m%s\x1b[0m',
            '\nSUKCES: Wszystkie skrypty inicjalizacyjne zostały wykonane.\n',
        );
    }, 2000);
} else if (!isFirstRun) {
    console.log('\x1b[36m%s\x1b[0m', 'Baza była już zainicjalizowana. Pomijam folder init.\n');
}
