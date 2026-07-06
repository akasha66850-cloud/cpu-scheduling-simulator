import { create } from 'zustand'
import { runFileAlgorithm } from '../utils/fileAlgorithms'

const generateId = () => Math.random().toString(36).substr(2, 9)

const initialState = {
  diskSize: 32,
  diskBlocks: Array(32).fill(null), // null = free, object = { fileId, type: 'data'|'index', next: -1 }
  files: {}, // id -> { id, name, size, blocks: [], indexBlock: -1, color }
  directoryTree: {
    id: 'root',
    name: '/',
    type: 'folder',
    children: []
  },
  currentPath: ['root'], // array of folder IDs
  selectedAlgorithm: 'contiguous',
  metrics: {
    usedBlocks: 0,
    freeBlocks: 32,
    maxContiguous: 32,
    externalFrag: 0,
    internalFrag: 0,
    avgFileSize: 0
  },
  history: [], // For step-by-step
  historyIndex: -1,
  colors: ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e']
}

// Helper to deep clone directory tree
const cloneTree = (tree) => JSON.parse(JSON.stringify(tree))

// Helper to find a folder by ID
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

// Helper to remove a node by ID
const removeNode = (tree, id) => {
  if (!tree.children) return false
  const idx = tree.children.findIndex(c => c.id === id)
  if (idx !== -1) {
    tree.children.splice(idx, 1)
    return true
  }
  for (let child of tree.children) {
    if (removeNode(child, id)) return true
  }
  return false
}

const useFileStore = create((set, get) => ({
  ...initialState,

  setDiskSize: (size) => {
    set({
      diskSize: size,
      diskBlocks: Array(size).fill(null),
      files: {},
      directoryTree: { id: 'root', name: '/', type: 'folder', children: [] },
      currentPath: ['root'],
      metrics: { ...initialState.metrics, freeBlocks: size, maxContiguous: size },
      history: [],
      historyIndex: -1
    })
  },

  setAlgorithm: (algo) => set({ selectedAlgorithm: algo }),

  navigate: (folderId) => {
    const { currentPath, directoryTree } = get()
    if (folderId === 'up') {
      if (currentPath.length > 1) {
        set({ currentPath: currentPath.slice(0, -1) })
      }
    } else if (folderId === 'root') {
      set({ currentPath: ['root'] })
    } else {
      const folder = findFolder(directoryTree, folderId)
      if (folder) {
        set({ currentPath: [...currentPath, folderId] })
      }
    }
  },

  createFolder: (name) => {
    const { directoryTree, currentPath } = get()
    const newTree = cloneTree(directoryTree)
    const currentFolderId = currentPath[currentPath.length - 1]
    const parent = findFolder(newTree, currentFolderId)
    
    if (parent) {
      parent.children.push({
        id: 'folder_' + generateId(),
        name,
        type: 'folder',
        children: []
      })
      
      const nextState = { directoryTree: newTree }
      get()._saveHistory(nextState)
      set(nextState)
    }
  },

  allocateFile: async (name, size) => {
    const state = get()
    // C++ expects blocks as 0 (free) or 1 (used)
    const blocksInt = state.diskBlocks.map(b => b === null ? 0 : 1)
    
    const payload = {
      action: "allocate",
      algo: state.selectedAlgorithm,
      size: parseInt(size),
      blocks: blocksInt
    }

    try {
      const result = await runFileAlgorithm(payload)
      if (!result.success) {
         throw new Error(result.error || "Allocation failed")
      }

      const fileId = 'file_' + generateId()
      const color = state.colors[Object.keys(state.files).length % state.colors.length]
      
      const newDiskBlocks = [...state.diskBlocks]
      const fileObj = {
        id: fileId,
        name,
        size: parseInt(size),
        blocks: result.allocated_indices,
        indexBlock: result.index_block !== undefined ? result.index_block : -1,
        color
      }

      // Update disk blocks
      if (state.selectedAlgorithm === 'contiguous') {
         result.allocated_indices.forEach(idx => {
            newDiskBlocks[idx] = { fileId, type: 'data', next: -1 }
         })
      } 
      else if (state.selectedAlgorithm === 'linked') {
         result.allocated_indices.forEach((idx, i) => {
            const nextIdx = i < result.allocated_indices.length - 1 ? result.allocated_indices[i+1] : -1
            newDiskBlocks[idx] = { fileId, type: 'data', next: nextIdx }
         })
      }
      else if (state.selectedAlgorithm === 'indexed') {
         newDiskBlocks[result.index_block] = { fileId, type: 'index', next: -1 }
         result.allocated_indices.forEach(idx => {
            newDiskBlocks[idx] = { fileId, type: 'data', next: -1 }
         })
      }

      const newTree = cloneTree(state.directoryTree)
      const currentFolderId = state.currentPath[state.currentPath.length - 1]
      const parent = findFolder(newTree, currentFolderId)
      
      if (parent) {
         parent.children.push(fileObj)
      }

      const newFiles = { ...state.files, [fileId]: fileObj }
      
      // Internal Fragmentation: blocks are fixed size. Let's assume block size = 1KB for simulation purposes,
      // but in this model 1 size unit = 1 block, so internal frag is 0 unless we define it differently.
      // We'll leave it as 0 for this discrete block simulation.
      
      const fileCount = Object.keys(newFiles).length
      const avgFileSize = Object.values(newFiles).reduce((sum, f) => sum + f.size, 0) / fileCount

      const nextState = {
         diskBlocks: newDiskBlocks,
         files: newFiles,
         directoryTree: newTree,
         metrics: {
            usedBlocks: state.diskSize - result.free_count,
            freeBlocks: result.free_count,
            maxContiguous: result.max_contiguous,
            externalFrag: result.external_frag,
            internalFrag: 0,
            avgFileSize
         }
      }

      get()._saveHistory(nextState)
      set(nextState)
      return true
    } catch (err) {
      console.error(err)
      throw err
    }
  },

  deleteFile: async (fileId) => {
    const state = get()
    const file = state.files[fileId]
    if (!file) return

    let blocksToFree = [...file.blocks]
    if (file.indexBlock !== -1) {
       blocksToFree.push(file.indexBlock)
    }

    const blocksInt = state.diskBlocks.map(b => b === null ? 0 : 1)
    const payload = {
      action: "free",
      algo: state.selectedAlgorithm,
      size: 0,
      blocks: blocksInt,
      free_blocks: blocksToFree
    }

    try {
      const result = await runFileAlgorithm(payload)
      if (!result.success) throw new Error("Free failed")

      const newDiskBlocks = [...state.diskBlocks]
      blocksToFree.forEach(idx => { newDiskBlocks[idx] = null })

      const newTree = cloneTree(state.directoryTree)
      removeNode(newTree, fileId)

      const newFiles = { ...state.files }
      delete newFiles[fileId]

      const fileCount = Object.keys(newFiles).length
      const avgFileSize = fileCount > 0 ? Object.values(newFiles).reduce((sum, f) => sum + f.size, 0) / fileCount : 0

      const nextState = {
         diskBlocks: newDiskBlocks,
         files: newFiles,
         directoryTree: newTree,
         metrics: {
            usedBlocks: state.diskSize - result.free_count,
            freeBlocks: result.free_count,
            maxContiguous: result.max_contiguous,
            externalFrag: result.external_frag,
            internalFrag: 0,
            avgFileSize
         }
      }

      get()._saveHistory(nextState)
      set(nextState)
    } catch (err) {
      console.error(err)
    }
  },

  moveFile: (fileId, targetFolderId) => {
    const state = get()
    const newTree = cloneTree(state.directoryTree)
    
    // Find the file object in the tree
    let fileObjToMove = null;
    const findAndExtract = (tree) => {
        if (!tree.children) return false
        const idx = tree.children.findIndex(c => c.id === fileId)
        if (idx !== -1) {
            fileObjToMove = tree.children[idx]
            tree.children.splice(idx, 1)
            return true
        }
        for (let child of tree.children) {
            if (findAndExtract(child)) return true
        }
        return false
    }
    
    if (findAndExtract(newTree) && fileObjToMove) {
        const target = findFolder(newTree, targetFolderId)
        if (target) {
            target.children.push(fileObjToMove)
            
            const nextState = { directoryTree: newTree }
            get()._saveHistory(nextState)
            set(nextState)
        }
    }
  },

  resetDisk: () => {
    const size = get().diskSize
    set({
      diskBlocks: Array(size).fill(null),
      files: {},
      directoryTree: { id: 'root', name: '/', type: 'folder', children: [] },
      currentPath: ['root'],
      metrics: { ...initialState.metrics, freeBlocks: size, maxContiguous: size },
      history: [],
      historyIndex: -1
    })
  },

  // --- Step-by-Step History Management ---
  _saveHistory: (newStateSnippet) => {
    const state = get()
    // Snap full necessary state
    const snapshot = {
       diskBlocks: newStateSnippet.diskBlocks || state.diskBlocks,
       files: newStateSnippet.files || state.files,
       directoryTree: newStateSnippet.directoryTree || state.directoryTree,
       metrics: newStateSnippet.metrics || state.metrics
    }
    
    let newHistory = state.history.slice(0, state.historyIndex + 1)
    if (newHistory.length === 0) {
       // Push initial state first
       newHistory.push({
          diskBlocks: state.diskBlocks,
          files: state.files,
          directoryTree: state.directoryTree,
          metrics: state.metrics
       })
    }
    newHistory.push(snapshot)
    
    // Optional: save to localStorage if desired, but we can just keep in memory for steps
    set({ history: newHistory, historyIndex: newHistory.length - 1 })
  },

  stepForward: () => {
     const state = get()
     if (state.historyIndex < state.history.length - 1) {
        const nextIdx = state.historyIndex + 1
        const snap = state.history[nextIdx]
        set({
           historyIndex: nextIdx,
           diskBlocks: snap.diskBlocks,
           files: snap.files,
           directoryTree: snap.directoryTree,
           metrics: snap.metrics
        })
     }
  },

  stepBackward: () => {
     const state = get()
     if (state.historyIndex > 0) {
        const prevIdx = state.historyIndex - 1
        const snap = state.history[prevIdx]
        set({
           historyIndex: prevIdx,
           diskBlocks: snap.diskBlocks,
           files: snap.files,
           directoryTree: snap.directoryTree,
           metrics: snap.metrics
        })
     }
  }

}))

export default useFileStore
