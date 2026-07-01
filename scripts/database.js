const { execSync, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// 1. Definicje ścieżek
const postgresDir = path.join(__dirname, '..', 'postgres');
const targetDataDir = path.join(postgresDir, 'data');
const initSqlDir = path.join(postgresDir, 'init');
const versionFilePath = path.join(targetDataDir, 'PG_VERSION');
const logFilePath = path.join(postgresDir, 'server.log');

// 2. Ścieżki do binariów PostgreSQL 18
const pgBinDir = `C:\\Program Files\\PostgreSQL\\18\\bin`;
const initdbPath = `"${path.join(pgBinDir, 'initdb.exe')}"`;
const pgCtlPath = `"${path.join(pgBinDir, 'pg_ctl.exe')}"`;
const psqlPath = `"${path.join(pgBinDir, 'psql.exe')}"`;

// 3. AUTOMATYCZNE ZABIJANIE ISTNIEJĄCEGO PROCESU POSTGRES
console.log('\x1b[33m%s\x1b[0m', 'STATUS: Sprawdzanie, czy PostgreSQL działa w tle...');
try {
    // Sprawdzamy listę zadań w Windows pod kątem procesu postgres.exe
    const taskList = execSync('tasklist /FI "IMAGENAME eq postgres.exe"', { encoding: 'utf8' });

    if (taskList.includes('postgres.exe')) {
        console.log(
            '\x1b[36m%s\x1b[0m',
            'INFO: Wykryto działający proces postgres.exe. Zamykanie...',
        );
        execSync('taskkill /f /im postgres.exe', { stdio: 'ignore' });
        console.log('\x1b[32m%s\x1b[0m', 'SUKCES: Poprzedni proces został zamknięty.');

        // Krótka pauza na zwolnienie portu przez system Windows
        execSync('timeout /t 1 /nobreak', { stdio: 'ignore' });
    } else {
        console.log('\x1b[36m%s\x1b[0m', 'INFO: Brak aktywnych procesów postgres.exe.');
    }
} catch (err) {
    console.log(
        '\x1b[36m%s\x1b[0m',
        'INFO: Nie udało się sprawdzić procesów lub brak uprawnień, kontynuuję...',
    );
}

const isFirstRun = !fs.existsSync(versionFilePath);

if (!fs.existsSync(targetDataDir)) {
    fs.mkdirSync(targetDataDir, { recursive: true });
}

// 4. Inicjalizacja klastra bazy danych
if (isFirstRun) {
    console.log('\x1b[33m%s\x1b[0m', 'STATUS: Inicjalizowanie nowego klastra w postgres/data...');
    try {
        execSync(`${initdbPath} -D "${targetDataDir}" -E UTF8 --locale=C -U postgres`);
        console.log('\x1b[32m%s\x1b[0m', 'SUKCES: Klaster zainicjalizowany.');

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
                'INFO: Skonfigurowano autoryzację typu "trust" dla localhost.',
            );
        }
    } catch (error) {
        console.error('\x1b[31m%s\x1b[0m', `BLAD: Podczas initdb: ${error.message}`);
        process.exit(1);
    }
}

// 5. Uruchomienie serwera
console.log('\x1b[33m%s\x1b[0m', 'STATUS: Uruchamianie PostgreSQL...');
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

console.log('\x1b[33m%s\x1b[0m', 'STATUS: Wysłano żądanie uruchomienia do pg_ctl.');

// 6. WYKONYWANIE PLIKÓW SQL
if (isFirstRun && fs.existsSync(initSqlDir)) {
    console.log(
        '\x1b[33m%s\x1b[0m',
        'STATUS: Oczekiwanie 2 sekundy na pełne uruchomienie bazy danych...',
    );

    setTimeout(() => {
        console.log(
            '\x1b[33m%s\x1b[0m',
            'STATUS: Szukanie skryptów inicjalizacyjnych w postgres/init...',
        );
        const sqlFiles = fs
            .readdirSync(initSqlDir)
            .filter((file) => file.endsWith('.sql'))
            .sort();

        if (sqlFiles.length === 0) {
            console.log('\x1b[36m%s\x1b[0m', 'INFO: Nie znaleziono plików .sql w folderze init.');
            return;
        }

        console.log(
            '\x1b[36m%s\x1b[0m',
            `INFO: Znaleziono pliki do wykonania: ${sqlFiles.join(', ')}`,
        );

        sqlFiles.forEach((file) => {
            const fullSqlPath = path.join(initSqlDir, file);
            console.log('\x1b[33m%s\x1b[0m', `STATUS: Wykonywanie: ${file}...`);
            try {
                execSync(
                    `${psqlPath} -U postgres -d postgres -f "${fullSqlPath}" -v ON_ERROR_STOP=1`,
                    { stdio: 'ignore' },
                );
                console.log('\x1b[32m%s\x1b[0m', `SUKCES: Zakończono sukcesem: ${file}`);
            } catch (sqlError) {
                console.error('\x1b[31m%s\x1b[0m', `BLAD: Podczas wykonywania pliku ${file}.`);
                process.exit(1);
            }
        });

        console.log(
            '\x1b[32m%s\x1b[0m',
            'SUKCES: Wszystkie skrypty inicjalizacyjne zostały wykonane.',
        );
    }, 2000);
} else if (!isFirstRun) {
    console.log('\x1b[36m%s\x1b[0m', 'INFO: Baza była już zainicjalizowana. Pomijam folder init.');
}
