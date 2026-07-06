export function runFIFO(refs, frameCount) {
    const frames = [];
    const queue = [];
    const steps = [];
    let pageFaults = 0;
    let pageHits = 0;

    for (const page of refs) {
        let isHit = false;
        let evicted = null;
        let hasEvicted = false;

        if (frames.includes(page)) {
            isHit = true;
            pageHits++;
        } else {
            pageFaults++;
            if (frames.length < frameCount) {
                frames.push(page);
                queue.push(page);
            } else {
                evicted = queue.shift();
                hasEvicted = true;
                const index = frames.indexOf(evicted);
                if (index !== -1) {
                    frames[index] = page;
                }
                queue.push(page);
            }
        }
        steps.push({ page, isHit, evicted: hasEvicted ? evicted : null, frames: [...frames] });
    }

    const faultRate = refs.length === 0 ? 0 : (pageFaults / refs.length) * 100.0;
    const hitRate = refs.length === 0 ? 0 : (pageHits / refs.length) * 100.0;

    return { steps, metrics: { pageFaults, pageHits, faultRate, hitRate } };
}

export function runLRU(refs, frameCount) {
    const frames = [];
    const lruQueue = [];
    const steps = [];
    let pageFaults = 0;
    let pageHits = 0;

    for (const page of refs) {
        let isHit = false;
        let evicted = null;
        let hasEvicted = false;

        if (frames.includes(page)) {
            isHit = true;
            pageHits++;
            const idx = lruQueue.indexOf(page);
            if (idx !== -1) lruQueue.splice(idx, 1);
            lruQueue.push(page);
        } else {
            pageFaults++;
            if (frames.length < frameCount) {
                frames.push(page);
                lruQueue.push(page);
            } else {
                evicted = lruQueue.shift();
                hasEvicted = true;
                const index = frames.indexOf(evicted);
                if (index !== -1) {
                    frames[index] = page;
                }
                lruQueue.push(page);
            }
        }
        steps.push({ page, isHit, evicted: hasEvicted ? evicted : null, frames: [...frames] });
    }

    const faultRate = refs.length === 0 ? 0 : (pageFaults / refs.length) * 100.0;
    const hitRate = refs.length === 0 ? 0 : (pageHits / refs.length) * 100.0;

    return { steps, metrics: { pageFaults, pageHits, faultRate, hitRate } };
}

export function runOptimal(refs, frameCount) {
    const frames = [];
    const steps = [];
    let pageFaults = 0;
    let pageHits = 0;

    for (let i = 0; i < refs.length; i++) {
        const page = refs[i];
        let isHit = false;
        let evicted = null;
        let hasEvicted = false;

        if (frames.includes(page)) {
            isHit = true;
            pageHits++;
        } else {
            pageFaults++;
            if (frames.length < frameCount) {
                frames.push(page);
            } else {
                let farthest = i;
                let pageToEvict = -1;
                let foundEvictTarget = false;

                for (const f of frames) {
                    let usedLater = false;
                    for (let j = i + 1; j < refs.length; j++) {
                        if (refs[j] === f) {
                            usedLater = true;
                            if (j > farthest) {
                                farthest = j;
                                pageToEvict = f;
                            }
                            break;
                        }
                    }
                    if (!usedLater) {
                        pageToEvict = f;
                        foundEvictTarget = true;
                        break;
                    }
                }

                if (!foundEvictTarget && pageToEvict === -1) {
                    pageToEvict = frames[0];
                }

                evicted = pageToEvict;
                hasEvicted = true;
                const index = frames.indexOf(evicted);
                if (index !== -1) {
                    frames[index] = page;
                }
            }
        }
        steps.push({ page, isHit, evicted: hasEvicted ? evicted : null, frames: [...frames] });
    }

    const faultRate = refs.length === 0 ? 0 : (pageFaults / refs.length) * 100.0;
    const hitRate = refs.length === 0 ? 0 : (pageHits / refs.length) * 100.0;

    return { steps, metrics: { pageFaults, pageHits, faultRate, hitRate } };
}

export function runSecondChance(refs, frameCount) {
    const frames = [];
    const referenceBits = [];
    const steps = [];
    let pageFaults = 0;
    let pageHits = 0;
    let pointer = 0;

    for (const page of refs) {
        let isHit = false;
        let evicted = null;
        let hasEvicted = false;

        const idx = frames.indexOf(page);
        if (idx !== -1) {
            isHit = true;
            pageHits++;
            referenceBits[idx] = 1;
        } else {
            pageFaults++;
            if (frames.length < frameCount) {
                frames.push(page);
                referenceBits.push(0);
            } else {
                while (true) {
                    if (referenceBits[pointer] === 0) {
                        evicted = frames[pointer];
                        hasEvicted = true;
                        frames[pointer] = page;
                        referenceBits[pointer] = 0;
                        pointer = (pointer + 1) % frameCount;
                        break;
                    } else {
                        referenceBits[pointer] = 0;
                        pointer = (pointer + 1) % frameCount;
                    }
                }
            }
        }
        steps.push({ page, isHit, evicted: hasEvicted ? evicted : null, frames: [...frames] });
    }

    const faultRate = refs.length === 0 ? 0 : (pageFaults / refs.length) * 100.0;
    const hitRate = refs.length === 0 ? 0 : (pageHits / refs.length) * 100.0;

    return { steps, metrics: { pageFaults, pageHits, faultRate, hitRate } };
}

export function detectBeladyAnomaly(refs) {
    const maxFrames = 8;
    const results = [];
    let hasAnomaly = false;

    const prevFaults = Array(maxFrames + 1).fill(0);

    for (let frames = 1; frames <= maxFrames; frames++) {
        const out = runFIFO(refs, frames);
        const faults = out.metrics.pageFaults;
        let isAnomaly = false;

        if (frames > 1) {
            if (faults > prevFaults[frames - 1]) {
                isAnomaly = true;
                hasAnomaly = true;
            }
        }
        
        prevFaults[frames] = faults;

        results.push({
            frames: frames,
            faults: faults,
            isAnomaly: isAnomaly
        });
    }

    return {
        data: results,
        hasAnomaly: hasAnomaly
    };
}

export function parseRefs(refStr) {
    return refStr
        .replace(/[^0-9,\s]/g, '')
        .split(/[,\s]+/)
        .filter(s => s !== '')
        .map(Number);
}

export async function runPageAlgorithm(payload) {
    const { algorithm, referenceString, frameCount } = payload;
    const refs = parseRefs(referenceString);
    
    let result;
    if (algorithm === 'FIFO') {
        result = runFIFO(refs, frameCount);
        result.belady = detectBeladyAnomaly(refs);
    } else if (algorithm === 'LRU') {
        result = runLRU(refs, frameCount);
    } else if (algorithm === 'Optimal') {
        result = runOptimal(refs, frameCount);
    } else if (algorithm === 'SecondChance') {
        result = runSecondChance(refs, frameCount);
    } else {
        throw new Error(`Unknown algorithm: ${algorithm}`);
    }

    return result;
}
