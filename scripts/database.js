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

const isFirstRun = !fs.existsSync(versionFilePath);

if (!fs.existsSync(targetDataDir)) {
    fs.mkdirSync(targetDataDir, { recursive: true });
}

// 3. Inicjalizacja klastra bazy danych
if (isFirstRun) {
    console.log('STATUS: Inicjalizowanie nowego klastra w postgres/data...');
    try {
        execSync(`${initdbPath} -D "${targetDataDir}" -E UTF8 --locale=C`);
        console.log('SUKCES: Klaster zainicjalizowany.');

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
            console.log('INFO: Skonfigurowano autoryzację typu "trust" dla localhost.');
        }
    } catch (error) {
        console.error(`BLAD: Podczas initdb: ${error.message}`);
        process.exit(1);
    }
}

// 4. Uruchomienie serwera (Zmienione na asynchroniczny exec)
console.log('STATUS: Uruchamianie PostgreSQL...');
const startCommand = `${pgCtlPath} start -D "${targetDataDir}" -l "${logFilePath}"`;

// Używamy standardowego exec bez blokowania pętli zdarzeń Node.js
exec(startCommand, (error) => {
    if (error) {
        console.error(`BLAD: Serwer zgłosił problem przy starcie.`);
        if (fs.existsSync(logFilePath)) {
            console.log('\n--- TREŚĆ SERVER.LOG ---');
            console.log(fs.readFileSync(logFilePath, 'utf8'));
            console.log('------------------------\n');
        }
    }
});

console.log('STATUS: Wysłano żądanie uruchomienia do pg_ctl.');

// 5. WYKONYWANIE PLIKÓW SQL (Czekamy 2 sekundy, aż proces wystartuje w tle)
if (isFirstRun && fs.existsSync(initSqlDir)) {
    console.log('STATUS: Oczekiwanie 2 sekundy na pełne uruchomienie bazy danych...');

    setTimeout(() => {
        console.log('STATUS: Szukanie skryptów inicjalizacyjnych w postgres/init...');
        const sqlFiles = fs
            .readdirSync(initSqlDir)
            .filter((file) => file.endsWith('.sql'))
            .sort();

        if (sqlFiles.length === 0) {
            console.log('INFO: Nie znaleziono plików .sql w folderze init.');
            return;
        }

        console.log(`INFO: Znaleziono pliki do wykonania: ${sqlFiles.join(', ')}`);

        sqlFiles.forEach((file) => {
            const fullSqlPath = path.join(initSqlDir, file);
            console.log(`STATUS: Wykonywanie: ${file}...`);
            try {
                execSync(
                    `${psqlPath} -U postgres -d postgres -f "${fullSqlPath}" -v ON_ERROR_STOP=1`,
                    { stdio: 'inherit' },
                );
                console.log(`SUKCES: Zakończono sukcesem: ${file}`);
            } catch (sqlError) {
                console.error(`BLAD: Podczas wykonywania pliku ${file}.`);
                process.exit(1);
            }
        });

        console.log('SUKCES: Wszystkie skrypty inicjalizacyjne zostały wykonane.');
    }, 2000);
} else if (!isFirstRun) {
    console.log('INFO: Baza była już zainicjalizowana. Pomijam folder init.');
}
