const { spawnSync } = require('child_process');
const os = require('os');
const path = require('path');

function run(command, args, options = {}) {
    let result;

    if (process.platform === 'win32') {
        // Na Windows: konstruuj pojedynczy command string z shell: true
        const fullCommand = [command, ...args]
            .map((arg) => (arg.includes(' ') ? `"${arg}"` : arg))
            .join(' ');
        result = spawnSync(fullCommand, {
            stdio: 'inherit',
            shell: true,
            ...options,
        });
    } else {
        // Na innych systemach: użyj args array z shell: false (bezpieczniej)
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
    console.log('\n> Instalowanie zależności w root...');
    if (!run('npm', ['install'])) {
        throw new Error('Instalacja zależności w root nie powiodła się.');
    }

    console.log('\n> Instalowanie zależności w frontend...');
    if (!run('npm', ['install', '--prefix', 'frontend'])) {
        throw new Error('Instalacja zależności w frontend nie powiodła się.');
    }

    console.log('\n> Instalowanie zależności w backend...');
    if (!run('npm', ['install', '--prefix', 'backend'])) {
        throw new Error('Instalacja zależności w backend nie powiodła się.');
    }
}

function installDockerDesktopWindows() {
    if (commandExists('winget')) {
        return run('winget', ['install', '--id', 'Docker.DockerDesktop', '-e']);
    }

    console.warn(
        'Nie znaleziono winget. Proszę zainstalować Docker Desktop ręcznie z https://www.docker.com/get-started',
    );
    return false;
}

function installDockerMac() {
    if (commandExists('brew')) {
        return run('brew', ['install', '--cask', 'docker']);
    }

    console.warn(
        'Nie znaleziono Homebrew. Proszę zainstalować Docker ręcznie lub zainstalować Homebrew i spróbować ponownie.',
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

    console.warn('Nieznany system Linux. Proszę zainstalować Docker ręcznie.');
    return false;
}

function installDocker() {
    console.log('\n> Sprawdzanie instalacji Docker i Docker Compose...');

    if (hasDocker() && hasDockerCompose()) {
        console.log('Docker i Docker Compose są już zainstalowane.');
        return true;
    }

    console.log('Docker lub Docker Compose nie są zainstalowane. Próbuję zainstalować...');

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
        console.warn('\nAutomatyczna instalacja Docker nie powiodła się.');
        console.warn(
            'Proszę zainstalować Docker i Docker Compose ręcznie: https://www.docker.com/get-started',
        );
        return false;
    }

    if (!hasDocker() || !hasDockerCompose()) {
        console.warn('\nDocker został zainstalowany, ale nie udało się potwierdzić wersji.');
        console.warn('Sprawdź, czy Docker działa poprawnie i spróbuj ponownie.');
        return false;
    }

    console.log('Docker i Docker Compose zostały zainstalowane pomyślnie.');
    return true;
}

function installVscodeExtensions() {
    console.log('\n> Sprawdzanie instalacji rozszerzeń VS Code...');

    if (!commandExists('code')) {
        console.warn('VS Code nie jest zainstalowany lub nie jest dostępny w PATH.');
        console.warn(
            'Proszę zainstalować VS Code i dodać go do PATH, aby zainstalować rozszerzenia.',
        );
        return false;
    }

    try {
        const extensionsPath = path.join(__dirname, '..', '.vscode', 'extensions.json');
        const extensionsData = require(extensionsPath);

        if (!extensionsData.recommendations || !Array.isArray(extensionsData.recommendations)) {
            console.warn('Nie znaleziono rekomendacji rozszerzeń w .vscode/extensions.json');
            return false;
        }

        console.log(
            `Znaleziono ${extensionsData.recommendations.length} rekomendowanych rozszerzeń.`,
        );

        let installed = 0;
        let failed = 0;

        for (const extension of extensionsData.recommendations) {
            console.log(`Instalowanie rozszerzenia: ${extension}...`);
            if (run('code', ['--install-extension', extension, '--force'])) {
                installed++;
            } else {
                console.warn(`Nie udało się zainstalować rozszerzenia: ${extension}`);
                failed++;
            }
        }

        console.log(`Zainstalowano ${installed} rozszerzeń. Niepowodzeń: ${failed}.`);
        return failed === 0;
    } catch (error) {
        console.warn('Błąd podczas instalacji rozszerzeń VS Code:', error.message);
        return false;
    }
}

function main() {
    try {
        installDependencies();
        installDocker();
        installVscodeExtensions();
        console.log('\n> Inicjalizacja zakończona.');
    } catch (error) {
        console.error('\nBłąd podczas inicjalizacji:', error.message || error);
        process.exit(1);
    }
}

main();
