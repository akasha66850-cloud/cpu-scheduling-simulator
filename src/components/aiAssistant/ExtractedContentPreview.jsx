import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Image as ImageIcon, FileWarning, X, ChevronDown, ChevronRight, Check } from 'lucide-react'
import useAiAssistantStore from '../../store/useAiAssistantStore'

export default function ExtractedContentPreview() {
  const { stagedFiles, removeStagedFile, updateStagedFileText } = useAiAssistantStore()

  if (stagedFiles.length === 0) return null

  return (
    <div className="px-3 pb-2 flex flex-col gap-2">
      <AnimatePresence>
        {stagedFiles.map(file => (
          <StagedFileItem key={file.id} file={file} remove={() => removeStagedFile(file.id)} update={(text) => updateStagedFileText(file.id, text, file.status)} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function StagedFileItem({ file, remove, update }) {
  const [expanded, setExpanded] = useState(false)
  const isImage = file.type?.startsWith('image/')
  const Icon = isImage ? ImageIcon : FileText

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      className="bg-[#1e2535] border border-[#2a3441] rounded-md overflow-hidden flex flex-col text-xs"
    >
      <div className="flex items-center justify-between p-2">
        <button 
          onClick={() => setExpanded(!expanded)} 
          disabled={file.status !== 'success'}
          className="flex flex-1 items-center gap-2 overflow-hidden hover:opacity-80 transition-opacity text-left disabled:cursor-default"
        >
          {file.status === 'extracting' ? (
             <div className="w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin shrink-0" />
          ) : file.status === 'error' ? (
             <FileWarning className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
             <Icon className="w-4 h-4 text-accent shrink-0" />
          )}
          
          <div className="flex-1 min-w-0 flex flex-col">
            <span className="font-medium text-[#e2e8f0] truncate">{file.name}</span>
            <span className="text-[10px] text-[#94a3b8] truncate">
              {file.status === 'extracting' ? 'Extracting text...' : 
               file.status === 'error' ? (file.extractedText || 'Extraction failed') : 
               'Text extracted (click to view)'}
            </span>
          </div>

          {file.status === 'success' && (
            <div className="text-[#64748b] ml-2">
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
          )}
        </button>

        <button 
          onClick={remove}
          className="p-1 ml-2 text-[#64748b] hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      <AnimatePresence>
        {expanded && file.status === 'success' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-[#2a3441] bg-[#161b27]"
          >
            <div className="p-2">
              <div className="text-[10px] text-[#94a3b8] mb-1 flex justify-between items-center">
                <span>Extracted Content (You can edit this before sending):</span>
              </div>
              <textarea
                value={file.extractedText}
                onChange={(e) => update(e.target.value)}
                className="w-full h-32 bg-[#0f1117] border border-[#1e2535] rounded p-2 text-[#e2e8f0] font-mono text-[10px] resize-y focus:outline-none focus:border-accent"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
