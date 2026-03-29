import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'

// Reuse the same worker as PDFReader
GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

export interface PDFMetadata {
  title: string | null
  author: string | null
}

/**
 * Extracts embedded metadata (Title, Author) from a PDF file client-side.
 * Returns null fields if metadata is absent or extraction fails.
 * Does not upload or send the file anywhere.
 */
export async function extractPDFMetadata(file: File): Promise<PDFMetadata> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await getDocument({ data: arrayBuffer }).promise
    const { info } = await pdf.getMetadata()

    const raw = info as Record<string, unknown>
    const title = typeof raw.Title === 'string' && raw.Title.trim()
      ? raw.Title.trim()
      : null
    const author = typeof raw.Author === 'string' && raw.Author.trim()
      ? raw.Author.trim()
      : null

    await pdf.destroy()
    return { title, author }
  } catch {
    return { title: null, author: null }
  }
}
