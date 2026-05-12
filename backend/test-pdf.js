import { createRequire } from 'module';
const req = createRequire(import.meta.url);
const pdfParse = req('pdf-parse');
console.log(typeof pdfParse, typeof pdfParse.default);
