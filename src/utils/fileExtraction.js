import * as pdfjsLib from 'pdfjs-dist'
import Tesseract from 'tesseract.js'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

export async function extractTextFromFile(file) {
  if (!file) throw new Error("No file provided")

  const fileType = file.type

  if (fileType === 'application/pdf') {
    return await extractTextFromPDF(file)
  } else if (fileType.startsWith('image/')) {
    return await extractTextFromImage(file)
  } else if (fileType === 'text/plain' || fileType === 'text/csv' || file.name.endsWith('.md')) {
    return await file.text()
  } else {
    throw new Error(`Unsupported file type: ${fileType}`)
  }
}

async function extractTextFromPDF(file) {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise
    
    let fullText = ''
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map(item => item.str).join(' ')
      fullText += `--- Page ${i} ---\n${pageText}\n\n`
    }
    
    const result = fullText.trim()
    if (!result) {
      throw new Error("No text found. If this is a scanned document, please upload it as an image.")
    }
    
    return result
  } catch (err) {
    console.error("PDF Extraction Error:", err)
    throw new Error(`PDF Error: ${err.message || err.toString()}`)
  }
}

async function extractTextFromImage(file) {
  try {
    const worker = await Tesseract.createWorker('eng')
    
    // Pass the File object directly instead of ObjectURL
    const { data: { text } } = await worker.recognize(file)
    
    await worker.terminate()
    
    return text.trim()
  } catch (err) {
    console.error("OCR Error:", err)
    throw new Error(`OCR Error: ${err.message || err.toString()}`)
  }
}
