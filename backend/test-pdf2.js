import { createRequire } from 'module';
import fs from 'fs';
const req = createRequire(import.meta.url);
const { PDFParse } = req('pdf-parse');
const parser = new PDFParse();
const buf = fs.readFileSync('/Users/mac/Documents/Amrita AIE sem 5/Software/version2/backend/test-pdf.js'); // any file just to test
console.log('PDFParse type:', typeof PDFParse);
