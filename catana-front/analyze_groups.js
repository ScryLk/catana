import pkg from 'xlsx';
const { readFile, utils } = pkg;

const workbook = readFile('dipack_prompts_com_nome_linha.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = utils.sheet_to_json(worksheet);

const groups = {};
data.forEach(item => {
    const key = item.LinhaDipack;
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
});

console.log("Total items:", data.length);
console.log("Unique LinhaDipack groups:", Object.keys(groups).length);
console.log("Groups:", Object.keys(groups));

// Peek at a few from each group to see if they look like size variants
Object.keys(groups).forEach(key => {
    console.log(`\nGroup: ${key} (Count: ${groups[key].length})`);
    // Show first 2 items
    console.log(groups[key].slice(0, 2).map(i => `${i.CodigoPrincipal} - ${i.PesoPrincipal}`).join(', '));
});
