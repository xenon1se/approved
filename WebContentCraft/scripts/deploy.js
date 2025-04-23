const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Verifica versione Node.js
const requiredNodeVersion = '14.0.0';
const currentVersion = process.version;
if (currentVersion < requiredNodeVersion) {
  console.error(`Errore: Node.js versione ${requiredNodeVersion} o superiore richiesta. Versione attuale: ${currentVersion}`);
  process.exit(1);
}

// Directory di output per il deploy
const deployDir = path.join(__dirname, '../deploy');
const outputFile = path.join(deployDir, 'deploy.zip');

// Funzione per verificare l'esistenza di un file/directory
function checkPathExists(path, isDirectory = false) {
  try {
    const stats = fs.statSync(path);
    return isDirectory ? stats.isDirectory() : stats.isFile();
  } catch (err) {
    return false;
  }
}

// Funzione per creare la directory se non esiste
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Directory creata: ${dir}`);
  }
}

// Funzione per normalizzare i percorsi
function normalizePath(filePath) {
  return path.normalize(path.join(process.cwd(), filePath));
}

// Verifica e crea la directory deploy
ensureDirectoryExists(deployDir);

// Verifica l'esistenza dei file necessari
const requiredPaths = [
  { path: 'dist', isDirectory: true },
  { path: 'client/dist', isDirectory: true },
  { path: 'package.json', isDirectory: false },
  { path: 'package-lock.json', isDirectory: false }
];

for (const { path: filePath, isDirectory } of requiredPaths) {
  const normalizedPath = normalizePath(filePath);
  if (!checkPathExists(normalizedPath, isDirectory)) {
    throw new Error(`File/directory richiesto non trovato: ${normalizedPath}`);
  }
}

// Crea un file ZIP con gestione della memoria
const output = fs.createWriteStream(outputFile);
const archive = archiver('zip', {
  zlib: { level: 9 }, // Massima compressione
  highWaterMark: 1024 * 1024 // Buffer di 1MB per gestione memoria
});

// Imposta timeout per operazioni lunghe (30 minuti)
const timeout = setTimeout(() => {
  console.error('Timeout: operazione di creazione archivio troppo lunga');
  process.exit(1);
}, 30 * 60 * 1000);

// Gestione eventi dell'archivio
output.on('close', () => {
  clearTimeout(timeout);
  const size = archive.pointer();
  console.log(`File di deploy creato con successo: ${outputFile}`);
  console.log(`Dimensione totale: ${size} bytes (${(size / 1024 / 1024).toFixed(2)} MB)`);
  
  // Verifica integrità dell'archivio
  try {
    fs.accessSync(outputFile, fs.constants.R_OK);
    console.log('Verifica integrità archivio completata con successo');
  } catch (err) {
    console.error('Errore durante la verifica dell\'archivio:', err);
    process.exit(1);
  }
});

archive.on('error', (err) => {
  clearTimeout(timeout);
  console.error('Errore durante la creazione dell\'archivio:', err);
  process.exit(1);
});

archive.on('warning', (err) => {
  if (err.code === 'ENOENT') {
    console.warn('Avviso:', err);
  } else {
    clearTimeout(timeout);
    throw err;
  }
});

archive.on('progress', (progress) => {
  console.log(`Progresso: ${progress.entries.processed} file processati`);
});

archive.pipe(output);

// Aggiungi i file necessari con gestione errori
try {
  // Aggiungi i file con percorsi normalizzati
  archive.directory(normalizePath('dist'), 'dist');
  archive.directory(normalizePath('client/dist'), 'client/dist');
  archive.file(normalizePath('package.json'), { name: 'package.json' });
  archive.file(normalizePath('package-lock.json'), { name: 'package-lock.json' });

  // Aggiungi il file .htaccess per la configurazione di Apache
  const htaccessContent = `
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
`;
  archive.append(htaccessContent, { name: '.htaccess' });

  // Aggiungi le istruzioni di deploy generiche
  const instructions = `
ISTRUZIONI PER IL DEPLOY:

1. Estrai il contenuto dell'archivio nella directory di destinazione
2. Esegui i seguenti comandi nel terminale:
   cd /percorso/della/directory
   npm install --production
   npm start

3. Configura il server web (Apache/Nginx) per:
   - Servire i file statici dalla directory dist
   - Inoltrare le richieste API al server Node.js
   - Configurare il rewrite per il routing lato client

4. Configura le variabili d'ambiente:
   - Crea un file .env nella root del progetto
   - Imposta le variabili necessarie (vedi .env.example)

5. Verifica che l'applicazione sia accessibile all'indirizzo configurato

Note:
- Assicurati che Node.js sia installato sul server
- Verifica che tutte le porte necessarie siano aperte
- Configura il firewall se necessario
- Imposta i permessi corretti per i file e le directory
`;
  archive.append(instructions, { name: 'DEPLOY_INSTRUCTIONS.txt' });

  archive.finalize();
} catch (err) {
  clearTimeout(timeout);
  console.error('Errore durante l\'aggiunta dei file all\'archivio:', err);
  process.exit(1);
} 