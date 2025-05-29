import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

function createGitHubPackage() {
  const output = fs.createWriteStream('jbmtrader-github.zip');
  const archive = archiver('zip', {
    zlib: { level: 9 }
  });

  output.on('close', function() {
    console.log('✅ Pacote criado: jbmtrader-github.zip (' + archive.pointer() + ' bytes)');
    console.log('📁 Pronto para upload no GitHub!');
  });

  archive.on('error', function(err) {
    throw err;
  });

  archive.pipe(output);

  // Arquivos principais
  const filesToInclude = [
    'README.md',
    'LICENSE', 
    'GITHUB_SETUP.md',
    '.gitignore',
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    'vite.config.ts',
    'tailwind.config.ts',
    'postcss.config.js',
    'drizzle.config.ts',
    'components.json'
  ];

  // Adicionar arquivos principais
  filesToInclude.forEach(file => {
    if (fs.existsSync(file)) {
      archive.file(file, { name: file });
    }
  });

  // Adicionar pastas importantes
  const foldersToInclude = [
    'client',
    'server', 
    'shared',
    'electron'
  ];

  foldersToInclude.forEach(folder => {
    if (fs.existsSync(folder)) {
      archive.directory(folder, folder);
    }
  });

  archive.finalize();
}

createGitHubPackage();