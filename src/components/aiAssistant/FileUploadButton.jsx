import { useRef } from 'react'
import { Paperclip, Loader2 } from 'lucide-react'
import useAiAssistantStore from '../../store/useAiAssistantStore'
import { extractTextFromFile } from '../../utils/fileExtraction'

export default function FileUploadButton() {
  const fileInputRef = useRef(null)
  const { addStagedFile, updateStagedFileText, isExtracting, setExtracting } = useAiAssistantStore()

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit to 10MB
    if (file.size > 10 * 1024 * 1024) {
      alert("File too large. Please select a file under 10MB.")
      return
    }

    const fileId = Date.now().toString()
    
    // Stage file with extracting status
    addStagedFile({
      id: fileId,
      name: file.name,
      type: file.type,
      status: 'extracting',
      extractedText: ''
    })

    setExtracting(true)

    try {
      const text = await extractTextFromFile(file)
      updateStagedFileText(fileId, text, 'success')
    } catch (err) {
      updateStagedFileText(fileId, err.message, 'error')
    } finally {
      setExtracting(false)
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp, application/pdf, text/plain, text/csv, .md"
      />
      <button 
        onClick={() => fileInputRef.current?.click()}
        disabled={isExtracting}
        title="Attach file (PDF, Image, Text)"
        className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors border ${
          isExtracting 
            ? 'bg-elevated border-border text-text-muted cursor-not-allowed'
            : 'bg-[#0f1117] border-[#1e2535] text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1e2535] cursor-pointer'
        }`}
      >
        {isExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
      </button>
    </div>
  )
}
