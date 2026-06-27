import pkg from 'xlsx';
const { readFile, utils } = pkg;
// import { join } from 'path';
// import { fileURLToPath } from 'url';
// import { dirname } from 'path';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

const workbook = readFile('dipack_prompts_com_nome_linha.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = utils.sheet_to_json(worksheet);

console.log(JSON.stringify(data, null, 2));
