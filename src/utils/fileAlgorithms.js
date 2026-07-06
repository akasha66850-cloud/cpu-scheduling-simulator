export async function runFileAlgorithm(payload) {
    const { action, algo, size, blocks: inputBlocks, free_blocks } = payload;
    const blocks = [...(inputBlocks || [])];
    const totalBlocks = blocks.length;
    
    let allocatedIndices = [];
    let indexBlock = -1;
    let success = false;
    let errorMsg = "";

    if (action === "allocate") {
        const needed = size;
        
        if (algo === "contiguous") {
            let bestStart = -1;
            let currentStart = -1;
            let currentLength = 0;
            
            for (let i = 0; i < totalBlocks; i++) {
                if (blocks[i] === 0) {
                    if (currentLength === 0) currentStart = i;
                    currentLength++;
                    if (currentLength === needed) {
                        bestStart = currentStart;
                        break;
                    }
                } else {
                    currentLength = 0;
                }
            }
            
            if (bestStart !== -1) {
                success = true;
                for (let i = 0; i < needed; i++) {
                    allocatedIndices.push(bestStart + i);
                    blocks[bestStart + i] = 1;
                }
            } else {
                errorMsg = "Not enough contiguous free space.";
            }
        } 
        else if (algo === "linked") {
            for (let i = 0; i < totalBlocks && allocatedIndices.length < needed; i++) {
                if (blocks[i] === 0) {
                    allocatedIndices.push(i);
                    blocks[i] = 1;
                }
            }
            
            if (allocatedIndices.length === needed) {
                success = true;
            } else {
                for (const idx of allocatedIndices) blocks[idx] = 0;
                allocatedIndices = [];
                errorMsg = "Not enough total free space.";
            }
        }
        else if (algo === "indexed") {
            for (let i = 0; i < totalBlocks && allocatedIndices.length < needed + 1; i++) {
                if (blocks[i] === 0) {
                    allocatedIndices.push(i);
                    blocks[i] = 1;
                }
            }
            
            if (allocatedIndices.length === needed + 1) {
                success = true;
                indexBlock = allocatedIndices[0];
                allocatedIndices.shift();
            } else {
                for (const idx of allocatedIndices) blocks[idx] = 0;
                allocatedIndices = [];
                errorMsg = "Not enough total free space (including index block).";
            }
        }
    } 
    else if (action === "free") {
        if (free_blocks) {
            for (const idx of free_blocks) {
                if (idx >= 0 && idx < totalBlocks) {
                    blocks[idx] = 0;
                }
            }
        }
        success = true;
    }

    let freeCount = 0;
    let maxContiguous = 0;
    let currentContig = 0;
    
    for (let i = 0; i < totalBlocks; i++) {
        if (blocks[i] === 0) {
            freeCount++;
            currentContig++;
            if (currentContig > maxContiguous) {
                maxContiguous = currentContig;
            }
        } else {
            currentContig = 0;
        }
    }
    
    let externalFrag = 0.0;
    if (freeCount > 0) {
        externalFrag = (1.0 - (maxContiguous / freeCount)) * 100.0;
    }

    return {
        success,
        error: success ? undefined : errorMsg,
        allocated_indices: allocatedIndices,
        index_block: indexBlock,
        free_count: freeCount,
        max_contiguous: maxContiguous,
        external_frag: externalFrag
    };
}
