import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const __dirname = import.meta.dirname;

function run(command, args, options = {}) {
    let result;

    if (process.platform === 'win32') {
        const fullCommand = [command, ...args]
            .map((arg) => (arg.includes(' ') ? `"${arg}"` : arg))
            .join(' ');
        result = spawnSync(fullCommand, {
            stdio: 'inherit',
            shell: true,
            ...options,
        });
    } else {
        result = spawnSync(command, args, {
            stdio: 'inherit',
            shell: false,
            ...options,
        });
    }

    if (result.error) {
        throw result.error;
    }

    return result.status === 0;
}

function commandExists(command) {
    let result;

    if (process.platform === 'win32') {
        result = spawnSync(`${command} --version`, {
            stdio: 'ignore',
            shell: true,
        });
    } else {
        result = spawnSync(command, ['--version'], {
            stdio: 'ignore',
            shell: false,
        });
    }

    return result.status === 0;
}

function checkAndFixAudit(prefix = null) {
    const args = ['audit'];
    if (prefix) {
        args.push('--prefix', prefix);
    }

    let auditCheck;
    if (process.platform === 'win32') {
        const fullCommand = ['npm', ...args]
            .map((arg) => (arg.includes(' ') ? `"${arg}"` : arg))
            .join(' ');

        auditCheck = spawnSync(fullCommand, { stdio: 'pipe', shell: true });
    } else {
        auditCheck = spawnSync('npm', args, { stdio: 'pipe', shell: false });
    }

    const output = auditCheck.stdout ? auditCheck.stdout.toString() : '';

    if (output.includes('vulnerabilities') && !output.includes('0 vulnerabilities')) {
        const target = prefix ? `w ${prefix}` : 'w root';
        console.log(
            '\x1b[33m%s\x1b[0m',
            `> Wykryto podatnosci ${target}. Uruchamianie npm audit fix...\n`,
        );

        const fixArgs = ['audit', 'fix'];
        if (prefix) {
            fixArgs.push('--prefix', prefix);
        }

        run('npm', fixArgs);
    }
}

function hasDocker() {
    return commandExists('docker');
}

function hasDockerCompose() {
    return (
        (commandExists('docker') && run('docker', ['compose', 'version'], { stdio: 'ignore' })) ||
        commandExists('docker-compose')
    );
}

function installDependencies() {
    console.log('\x1b[34m%s\x1b[0m', '\n> Instalowanie zaleznosci w root...');
    if (!run('npm', ['install'])) {
        throw new Error('Instalacja zaleznosci w root nie powiodla sie.');
    }
    checkAndFixAudit();

    console.log('\x1b[34m%s\x1b[0m', '\n> Instalowanie zaleznosci w frontend...');
    if (!run('npm', ['install', '--prefix', 'frontend'])) {
        throw new Error('Instalacja zaleznosci w frontend nie powiodla sie.');
    }
    checkAndFixAudit('frontend');

    console.log('\x1b[34m%s\x1b[0m', '\n> Instalowanie zaleznosci w backend...');
    if (!run('npm', ['install', '--prefix', 'backend'])) {
        throw new Error('Instalacja zaleznosci w backend nie powiodla sie.');
    }
    checkAndFixAudit('backend');
}

function installDockerDesktopWindows() {
    if (commandExists('winget')) {
        return run('winget', ['install', '--id', 'Docker.DockerDesktop', '-e']);
    }

    console.log(
        '\x1b[31m%s\x1b[0m',
        'Nie znaleziono winget. Proszę zainstalować Docker Desktop ręcznie z https://www.docker.com/get-started\n',
    );
    return false;
}

function installDockerMac() {
    if (commandExists('brew')) {
        return run('brew', ['install', '--cask', 'docker']);
    }

    console.log(
        '\x1b[31m%s\x1b[0m',
        'Nie znaleziono Homebrew. Proszę zainstalować Docker ręcznie lub zainstalować Homebrew i spróbować ponownie.\n',
    );
    return false;
}

function installDockerLinux() {
    if (commandExists('apt-get')) {
        return (
            run('sudo', ['apt-get', 'update']) &&
            run('sudo', ['apt-get', 'install', '-y', 'docker.io', 'docker-compose-plugin'])
        );
    }

    if (commandExists('dnf')) {
        return run('sudo', ['dnf', 'install', '-y', 'docker', 'docker-compose-plugin']);
    }

    if (commandExists('yum')) {
        return run('sudo', ['yum', 'install', '-y', 'docker', 'docker-compose-plugin']);
    }

    if (commandExists('pacman')) {
        return run('sudo', ['pacman', '-Syu', 'docker', 'docker-compose']);
    }

    console.log(
        '\x1b[31m%s\x1b[0m',
        'Nieznany system Linux. Proszę zainstalować Docker ręcznie.\n',
    );
    return false;
}

function installDocker() {
    console.log('\x1b[34m%s\x1b[0m', '\n> Sprawdzanie instalacji Docker i Docker Compose...\n');

    if (hasDocker() && hasDockerCompose()) {
        console.log('Docker i Docker Compose są już zainstalowane.\n');
        return true;
    }

    console.log('Docker lub Docker Compose nie są zainstalowane. Próbuję zainstalować...\n');

    const platform = os.platform();
    let installed = false;

    if (platform === 'win32') {
        installed = installDockerDesktopWindows();
    } else if (platform === 'darwin') {
        installed = installDockerMac();
    } else {
        installed = installDockerLinux();
    }

    if (!installed) {
        console.log('\x1b[31m%s\x1b[0m', '\nAutomatyczna instalacja Docker nie powiodła się.\n');
        console.log(
            '\x1b[31m%s\x1b[0m',
            'Proszę zainstalować Docker i Docker Compose ręcznie: https://www.docker.com/get-started\n',
        );
        return false;
    }

    if (!hasDocker() || !hasDockerCompose()) {
        console.log(
            '\x1b[31m%s\x1b[0m',
            '\nDocker został zainstalowany, ale nie udało się potwierdzić wersji.\n',
        );
        console.log(
            '\x1b[31m%s\x1b[0m',
            'Sprawdź, czy Docker działa poprawnie i spróbuj ponownie.\n',
        );
        return false;
    }

    console.log('Docker i Docker Compose zostały zainstalowane pomyślnie.\n');
    return true;
}

function installVscodeExtensions() {
    console.log('\x1b[34m%s\x1b[0m', '\n> Sprawdzanie instalacji rozszerzeń VS Code...\n');

    if (!commandExists('code')) {
        console.log(
            '\x1b[34m%s\x1b[0m',
            'VS Code nie jest zainstalowany lub nie jest dostępny w PATH.\n',
        );
        console.log(
            '\x1b[34m%s\x1b[0m',
            'Proszę zainstalować VS Code i dodać go do PATH, aby zainstalować rozszerzenia.\n',
        );
        return false;
    }

    try {
        const extensionsPath = path.join(__dirname, '..', '.vscode', 'extensions.json');
        const extensionsData = JSON.parse(fs.readFileSync(extensionsPath, 'utf8'));

        if (!extensionsData.recommendations || !Array.isArray(extensionsData.recommendations)) {
            console.log(
                '\x1b[34m%s\x1b[0m',
                'Nie znaleziono rekomendacji rozszerzeń w .vscode/extensions.json\n',
            );
            return false;
        }

        const extensions = extensionsData.recommendations;
        console.log(
            '\x1b[36m%s\x1b[0m',
            `Znaleziono ${extensions.length} rekomendowanych rozszerzeń. Rozpoczynanie instalacji zbiorczej...\n`,
        );

        const args = [];
        for (const extension of extensions) {
            args.push('--install-extension', extension);
        }
        args.push('--force');

        const success = run('code', args, {
            env: { ...process.env, NODE_OPTIONS: '--no-deprecation' },
        });

        if (success) {
            console.log('Wszystkie rozszerzenia zostały pomyślnie zainstalowane.\n');
            return true;
        } else {
            console.log('\x1b[34m%s\x1b[0m', 'Wystąpił problem podczas instalacji rozszerzeń.\n');
            return false;
        }
    } catch (error) {
        console.log(
            '\x1b[34m%s\x1b[0m',
            'Błąd podczas instalacji rozszerzeń VS Code:\n',
            error.message,
        );
        return false;
    }
}

function main() {
    try {
        installDependencies();
        installDocker();
        installVscodeExtensions();
        console.log('\x1b[34m%s\x1b[0m', '\n> Inicjalizacja zakończona.\n');
    } catch (error) {
        console.error('\x1b[31m%s\x1b[0m', '\nBłąd podczas inicjalizacji:', error.message || error);
        process.exit(1);
    }
}

main();
