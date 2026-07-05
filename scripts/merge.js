#!/usr/bin/env node
const { execSync } = require('child_process');

function run(cmd, options = {}) {
    console.log(`\n$ ${cmd}`);
    try {
        execSync(cmd, { stdio: 'inherit', ...options });
        return true;
    } catch (err) {
        console.error(`Błąd przy: ${cmd}`);
        return false;
    }
}

function getCurrentBranch() {
    try {
        return execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    } catch (err) {
        console.error(
            'Nie udało się pobrać aktualnego brancha. Upewnij się, że jesteś w repozytorium git.',
        );
        process.exit(1);
    }
}

function checkCleanWorkingTree() {
    try {
        const status = execSync('git status --porcelain').toString();
        if (status.trim()) {
            console.error('Masz niezatwierdzone zmiany w drzewie roboczym:');
            console.error(status);
            console.error('Zacomituj lub stashuj zmiany przed uruchomieniem skryptu.');
            process.exit(2);
        }
    } catch (err) {
        console.error('Nie udało się sprawdzić statusu GIT.');
        process.exit(1);
    }
}

const defaultTargets = ['backend', 'database', 'feature', 'frontend', 'main'];
const args = process.argv.slice(2);
let targets = defaultTargets;
let dryRun = false;

if (args.length) {
    dryRun = args.includes('--dry-run') || args.includes('-n');
    const filtered = args.filter((a) => a !== '--dry-run' && a !== '-n');
    if (filtered.length) {
        if (filtered.length === 1 && filtered[0].includes(',')) {
            targets = filtered[0]
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
        } else {
            targets = filtered;
        }
    }
}

const current = getCurrentBranch();
console.log(`Aktualny branch: ${current}`);

checkCleanWorkingTree();

const results = [];
for (const target of targets) {
    if (target === current) {
        console.log(`Pomijam ${target} - to jest aktualny branch`);
        results.push({ target, status: 'skipped' });
        continue;
    }

    console.log(`\nMerguje ${current} do ${target}...`);
    if (dryRun) {
        console.log('(dry-run) git switch', target);
        console.log('(dry-run) git merge', current);
        console.log('(dry-run) git push origin', target);
        results.push({ target, status: 'dry-run' });
        continue;
    }

    if (!run(`git switch ${target}`)) {
        results.push({ target, status: 'switch-failed' });
        continue;
    }
    if (!run(`git merge ${current}`)) {
        results.push({ target, status: 'merge-failed' });
        continue;
    }
    if (!run(`git push origin ${target}`)) {
        results.push({ target, status: 'push-failed' });
        continue;
    }

    results.push({ target, status: 'ok' });
}

console.log(`\nWracam na ${current}...`);
if (!dryRun) run(`git switch ${current}`);

console.log('\nPodsumowanie:');
for (const r of results) console.log(`- ${r.target}: ${r.status}`);
console.log('\nGotowe.');
