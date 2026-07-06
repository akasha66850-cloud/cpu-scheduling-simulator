export function calculateMetrics(blocks, processResults, steps, totalSearchSteps) {
    let allocatedCount = 0;
    let failedCount = 0;
    let internalFragmentation = 0;
    let totalFreeSpace = 0;
    let largestFreeBlock = 0;
    let totalMemory = 0;
    let usedMemory = 0;

    for (const pr of processResults) {
        if (pr.isAllocated) allocatedCount++;
        else failedCount++;
    }

    for (const b of blocks) {
        totalMemory += b.size;
        if (b.isAllocated) {
            internalFragmentation += b.internalFrag;
            usedMemory += (b.size - b.internalFrag);
        } else {
            totalFreeSpace += b.size;
            if (b.size > largestFreeBlock) largestFreeBlock = b.size;
        }
    }

    const externalFragmentation = totalFreeSpace - largestFreeBlock;

    const successRate = processResults.length === 0 ? 0 : (allocatedCount / processResults.length) * 100.0;
    const memoryUtilization = totalMemory > 0 ? (usedMemory / totalMemory) * 100.0 : 0;
    const avgSearchSteps = processResults.length === 0 ? 0 : totalSearchSteps / processResults.length;

    const finalBlocks = blocks.map(b => ({
        id: b.id,
        size: b.size,
        isAllocated: b.isAllocated,
        internalFrag: b.internalFrag,
        processId: b.isAllocated ? b.processId : null
    }));

    const finalProcesses = processResults.map(p => ({
        id: p.id,
        size: p.size,
        isAllocated: p.isAllocated,
        internalFrag: p.internalFrag,
        blockId: p.isAllocated ? p.blockId : null
    }));

    const formattedSteps = steps.map(s => ({
        processId: s.processId,
        success: s.success,
        searchSteps: s.searchSteps,
        blocksState: s.blocksState.map(b => ({
            id: b.id,
            size: b.size,
            isAllocated: b.isAllocated,
            internalFrag: b.internalFrag,
            processId: b.isAllocated ? b.processId : null
        })),
        blockId: s.success ? s.blockId : null
    }));

    return {
        steps: formattedSteps,
        finalBlocks: finalBlocks,
        processResults: finalProcesses,
        metrics: {
            successRate,
            internalFragmentation,
            externalFragmentation,
            memoryUtilization,
            avgSearchSteps,
            allocatedCount,
            failedCount
        }
    };
}

export async function runMemoryAlgorithm(payload) {
    const { algorithm, blocks: inputBlocks, processes: inputProcesses } = payload;
    
    // Deep clone to avoid mutating store inputs directly
    const blocks = inputBlocks.map(b => ({
        id: b.id,
        size: b.size,
        isAllocated: false,
        processId: null,
        internalFrag: 0
    }));

    const processes = inputProcesses.map(p => ({
        id: p.id,
        size: p.size,
        isAllocated: false,
        blockId: null,
        internalFrag: 0
    }));

    const steps = [];
    let totalSearchSteps = 0;

    if (algorithm === "FirstFit" || algorithm === "firstFit") {
        for (const p of processes) {
            let searchSteps = 0;
            let allocated = false;
            for (let i = 0; i < blocks.length; i++) {
                searchSteps++;
                if (!blocks[i].isAllocated && blocks[i].size >= p.size) {
                    blocks[i].isAllocated = true;
                    blocks[i].processId = p.id;
                    blocks[i].internalFrag = blocks[i].size - p.size;

                    p.isAllocated = true;
                    p.blockId = blocks[i].id;
                    p.internalFrag = blocks[i].internalFrag;

                    allocated = true;
                    steps.push({ processId: p.id, blockId: blocks[i].id, success: true, searchSteps, blocksState: JSON.parse(JSON.stringify(blocks)) });
                    break;
                }
            }
            if (!allocated) {
                steps.push({ processId: p.id, blockId: null, success: false, searchSteps, blocksState: JSON.parse(JSON.stringify(blocks)) });
            }
            totalSearchSteps += searchSteps;
        }
    } 
    else if (algorithm === "BestFit" || algorithm === "bestFit") {
        for (const p of processes) {
            let searchSteps = 0;
            let bestIdx = -1;
            let minFrag = -1;

            for (let i = 0; i < blocks.length; i++) {
                searchSteps++;
                if (!blocks[i].isAllocated && blocks[i].size >= p.size) {
                    const frag = blocks[i].size - p.size;
                    if (minFrag === -1 || frag < minFrag) {
                        minFrag = frag;
                        bestIdx = i;
                    }
                }
            }

            if (bestIdx !== -1) {
                blocks[bestIdx].isAllocated = true;
                blocks[bestIdx].processId = p.id;
                blocks[bestIdx].internalFrag = blocks[bestIdx].size - p.size;

                p.isAllocated = true;
                p.blockId = blocks[bestIdx].id;
                p.internalFrag = blocks[bestIdx].internalFrag;

                steps.push({ processId: p.id, blockId: blocks[bestIdx].id, success: true, searchSteps, blocksState: JSON.parse(JSON.stringify(blocks)) });
            } else {
                steps.push({ processId: p.id, blockId: null, success: false, searchSteps, blocksState: JSON.parse(JSON.stringify(blocks)) });
            }
            totalSearchSteps += searchSteps;
        }
    }
    else if (algorithm === "WorstFit" || algorithm === "worstFit") {
        for (const p of processes) {
            let searchSteps = 0;
            let worstIdx = -1;
            let maxFrag = -1;

            for (let i = 0; i < blocks.length; i++) {
                searchSteps++;
                if (!blocks[i].isAllocated && blocks[i].size >= p.size) {
                    const frag = blocks[i].size - p.size;
                    if (frag > maxFrag) {
                        maxFrag = frag;
                        worstIdx = i;
                    }
                }
            }

            if (worstIdx !== -1) {
                blocks[worstIdx].isAllocated = true;
                blocks[worstIdx].processId = p.id;
                blocks[worstIdx].internalFrag = blocks[worstIdx].size - p.size;

                p.isAllocated = true;
                p.blockId = blocks[worstIdx].id;
                p.internalFrag = blocks[worstIdx].internalFrag;

                steps.push({ processId: p.id, blockId: blocks[worstIdx].id, success: true, searchSteps, blocksState: JSON.parse(JSON.stringify(blocks)) });
            } else {
                steps.push({ processId: p.id, blockId: null, success: false, searchSteps, blocksState: JSON.parse(JSON.stringify(blocks)) });
            }
            totalSearchSteps += searchSteps;
        }
    }
    else if (algorithm === "NextFit" || algorithm === "nextFit") {
        let lastAllocatedIdx = 0;
        for (const p of processes) {
            let searchSteps = 0;
            let allocated = false;
            let startIdx = lastAllocatedIdx;

            for (let i = 0; i < blocks.length; i++) {
                searchSteps++;
                const idx = (startIdx + i) % blocks.length;
                if (!blocks[idx].isAllocated && blocks[idx].size >= p.size) {
                    blocks[idx].isAllocated = true;
                    blocks[idx].processId = p.id;
                    blocks[idx].internalFrag = blocks[idx].size - p.size;

                    p.isAllocated = true;
                    p.blockId = blocks[idx].id;
                    p.internalFrag = blocks[idx].internalFrag;

                    allocated = true;
                    lastAllocatedIdx = idx;
                    steps.push({ processId: p.id, blockId: blocks[idx].id, success: true, searchSteps, blocksState: JSON.parse(JSON.stringify(blocks)) });
                    break;
                }
            }
            if (!allocated) {
                steps.push({ processId: p.id, blockId: null, success: false, searchSteps, blocksState: JSON.parse(JSON.stringify(blocks)) });
            }
            totalSearchSteps += searchSteps;
        }
    }

    return calculateMetrics(blocks, processes, steps, totalSearchSteps);
}
