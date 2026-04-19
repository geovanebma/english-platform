import fs from 'fs';
import path from 'path';

const appRoot = path.resolve(process.cwd());
const sourceFile = path.resolve(appRoot, '..', '..', 'wiki-100k.txt');
const targetFile = path.resolve(appRoot, 'src', 'data', 'word-bank.generated.json');

const raw = fs.readFileSync(sourceFile, 'utf8');
const words = raw
  .split(/\r?\n/)
  .map((line) => line.trim().toLowerCase())
  .filter((line) => line && !line.startsWith('#!comment:'))
  .filter((line, index, list) => list.indexOf(line) === index);

fs.writeFileSync(targetFile, JSON.stringify(words), 'utf8');
console.log(JSON.stringify({ total: words.length, targetFile }, null, 2));
