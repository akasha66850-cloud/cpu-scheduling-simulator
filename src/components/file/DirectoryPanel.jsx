import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Folder, File as FileIcon, ChevronRight, Plus, Trash2, Home, CornerUpLeft } from 'lucide-react'
import useFileStore from '@/store/useFileStore'

// Helper to find folder by ID
const findFolder = (tree, id) => {
  if (tree.id === id && tree.type === 'folder') return tree
  if (tree.children) {
    for (let child of tree.children) {
      const found = findFolder(child, id)
      if (found) return found
    }
  }
  return null
}

export default function DirectoryPanel() {
  const { directoryTree, currentPath, navigate, createFolder, allocateFile, deleteFile, moveFile } = useFileStore()
  const [newFolderName, setNewFolderName] = useState('')
  const [newFileName, setNewFileName] = useState('')
  const [newFileSize, setNewFileSize] = useState('4')
  const [showFolderInput, setShowFolderInput] = useState(false)
  const [showFileInput, setShowFileInput] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const currentFolderId = currentPath[currentPath.length - 1]
  const currentFolder = findFolder(directoryTree, currentFolderId) || directoryTree

  // Build breadcrumbs
  const breadcrumbs = currentPath.map(id => findFolder(directoryTree, id)).filter(Boolean)

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return
    createFolder(newFolderName)
    setNewFolderName('')
    setShowFolderInput(false)
  }

  const handleCreateFile = async () => {
    if (!newFileName.trim()) return
    setErrorMsg('')
    try {
      await allocateFile(newFileName, newFileSize)
      setNewFileName('')
      setShowFileInput(false)
    } catch (e) {
      setErrorMsg(e.message)
    }
  }

  const handleDragStart = (e, fileId) => {
     e.dataTransfer.setData("fileId", fileId)
  }

  const handleDrop = (e, targetFolderId) => {
     e.preventDefault()
     const fileId = e.dataTransfer.getData("fileId")
     if (fileId && targetFolderId && currentFolderId !== targetFolderId) {
        moveFile(fileId, targetFolderId)
     }
  }

  return (
    <div className="bg-surface border border-border rounded-[8px] flex flex-col h-[500px] shadow-xl">
       {/* Header / Breadcrumbs */}
       <div className="p-4 border-b border-border bg-base rounded-t-xl flex items-center gap-2 overflow-x-auto whitespace-nowrap">
          <button onClick={() => navigate('root')} className="text-text-muted hover:text-text-primary transition-colors">
             <Home className="w-4 h-4" />
          </button>
          {breadcrumbs.map((b, i) => (
             <React.Fragment key={b.id}>
                <ChevronRight className="w-4 h-4 text-text-muted" />
                <button 
                  onClick={() => navigate(b.id)} 
                  className={`text-sm ${i === breadcrumbs.length - 1 ? 'text-text-primary font-bold' : 'text-text-muted hover:text-text-primary'}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, b.id)}
                >
                   {b.name}
                </button>
             </React.Fragment>
          ))}
       </div>

       {/* Toolbar */}
       <div className="p-3 border-b border-border flex gap-2">
          {currentPath.length > 1 && (
             <button onClick={() => navigate('up')} className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1">
                <CornerUpLeft className="w-3 h-3" /> Up
             </button>
          )}
          <button onClick={() => { setShowFileInput(true); setShowFolderInput(false) }} className="btn-primary px-3 py-1.5 text-xs flex items-center gap-1">
             <Plus className="w-3 h-3" /> File
          </button>
          <button onClick={() => { setShowFolderInput(true); setShowFileInput(false) }} className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1">
             <Plus className="w-3 h-3" /> Folder
          </button>
       </div>

       {/* Inputs */}
       <AnimatePresence>
          {showFolderInput && (
             <motion.div initial={{height:0, opacity:0}} animate={{height:'auto', opacity:1}} exit={{height:0, opacity:0}} className="p-3 bg-elevated border-b border-border-muted flex gap-2">
                <input autoFocus type="text" value={newFolderName} onChange={e=>setNewFolderName(e.target.value)} placeholder="Folder Name" className="flex-1 bg-surface border border-border-muted rounded px-3 py-1 text-sm text-text-primary" onKeyDown={e => e.key === 'Enter' && handleCreateFolder()} />
                <button onClick={handleCreateFolder} className="btn-primary px-3 py-1 text-xs">Add</button>
             </motion.div>
          )}
          {showFileInput && (
             <motion.div initial={{height:0, opacity:0}} animate={{height:'auto', opacity:1}} exit={{height:0, opacity:0}} className="p-3 bg-elevated border-b border-border-muted flex flex-col gap-2">
                <div className="flex gap-2">
                  <input autoFocus type="text" value={newFileName} onChange={e=>setNewFileName(e.target.value)} placeholder="File Name" className="flex-1 bg-surface border border-border-muted rounded px-3 py-1 text-sm text-text-primary" />
                  <input type="number" min="1" value={newFileSize} onChange={e=>setNewFileSize(e.target.value)} className="w-20 bg-surface border border-border-muted rounded px-3 py-1 text-sm text-text-primary" title="Size in blocks" />
                  <button onClick={handleCreateFile} className="btn-primary px-3 py-1 text-xs">Add</button>
                </div>
                {errorMsg && <div className="text-red text-xs font-bold">{errorMsg}</div>}
             </motion.div>
          )}
       </AnimatePresence>

       {/* File List */}
       <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <AnimatePresence>
             {currentFolder.children.map(node => (
                <motion.div 
                   key={node.id}
                   layout
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, scale: 0.9 }}
                   className={`flex items-center justify-between p-3 rounded-[5px] border border-border transition-colors ${node.type === 'folder' ? 'bg-elevated hover:bg-elevated cursor-pointer' : 'bg-surface shadow-sm'}`}
                   draggable={node.type === 'file'}
                   onDragStart={(e) => handleDragStart(e, node.id)}
                   onDragOver={(e) => { if(node.type === 'folder') e.preventDefault() }}
                   onDrop={(e) => { if(node.type === 'folder') handleDrop(e, node.id) }}
                   onClick={() => node.type === 'folder' && navigate(node.id)}
                >
                   <div className="flex items-center gap-3">
                      {node.type === 'folder' ? (
                         <Folder className="w-5 h-5 text-orange" />
                      ) : (
                         <div className="w-6 h-6 rounded flex items-center justify-center" style={{backgroundColor: `${node.color}20`}}>
                            <FileIcon className="w-4 h-4" style={{color: node.color}} />
                         </div>
                      )}
                      <div>
                         <div className="text-sm font-semibold text-text-primary">{node.name}</div>
                         {node.type === 'file' && <div className="text-xs text-text-muted">{node.size} Blocks</div>}
                      </div>
                   </div>
                   
                   {node.type === 'file' && (
                      <button onClick={(e) => { e.stopPropagation(); deleteFile(node.id); }} className="p-1.5 text-text-muted hover:text-red hover:bg-red-400/10 rounded transition-colors">
                         <Trash2 className="w-4 h-4" />
                      </button>
                   )}
                </motion.div>
             ))}
             {currentFolder.children.length === 0 && (
                <div className="text-center text-text-muted text-sm mt-8">Directory is empty</div>
             )}
          </AnimatePresence>
       </div>
    </div>
  )
}
