import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
import fs from 'fs';

async function run() {
  try {
    // 1. Create a dummy PDF
    const doc = new jsPDF();
    doc.text("Hello world!", 10, 10);
    const pdfBuffer = doc.output('arraybuffer');

    // 2. Try to parse it with pdfjsLib
    const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
    const pdf = await loadingTask.promise;
    
    console.log("Num pages:", pdf.numPages);
    
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText;
    }
    
    console.log("Extracted text:", fullText);
  } catch (err) {
    console.error("Test failed:", err);
  }
}

run();
