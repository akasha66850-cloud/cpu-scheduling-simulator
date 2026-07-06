let prngState = 12345;

function xorshift32() {
    prngState ^= prngState << 13;
    prngState ^= prngState >>> 17;
    prngState ^= prngState << 5;
    return prngState >>> 0;
}

function randRange(min, max) {
    return min + (xorshift32() % (max - min + 1));
}

const Action = {
    COMPUTE_DONE: 0,
    CRITICAL_DONE: 1,
    MEAL_DONE: 2,
    PRODUCE_DONE: 3,
    CONSUME_DONE: 4,
    READ_DONE: 5,
    WRITE_DONE: 6
};

class PriorityQueue {
    constructor() {
        this.elements = [];
    }
    push(item) {
        this.elements.push(item);
        this.elements.sort((a, b) => a.t - b.t);
    }
    pop() {
        return this.elements.shift();
    }
    isEmpty() {
        return this.elements.length === 0;
    }
}

function computeGlobalMetrics(res, N) {
    let totalWait = 0;
    let totalSamples = 0;
    res.min_wait = 0xFFFFFFFF;
    
    let totalBusy = 0;
    for (const t of res.threads) {
        totalBusy += t.busy_time;
        for (const w of t.wait_samples) {
            totalWait += w;
            totalSamples++;
            if (w > res.max_wait) res.max_wait = w;
            if (w < res.min_wait) res.min_wait = w;
        }
    }
    
    if (totalSamples > 0) {
        res.avg_wait = totalWait / totalSamples;
        res.starvation_index = res.avg_wait > 0 ? (res.max_wait / res.avg_wait) : 1.0;
    } else {
        res.min_wait = 0;
    }
    
    if (res.elapsed_time > 0) {
        res.throughput = (res.total_ops / res.elapsed_time) * 1000.0;
        res.cpu_util = (totalBusy / (res.elapsed_time * N)) * 100.0;
    }
}

export function runMutex(numThreads, ops) {
    prngState = 12345;
    const res = {
        timeline: [],
        threads: Array.from({ length: numThreads }, (_, i) => ({ thread_id: i, wait_samples: [], busy_time: 0, idle_time: 0 })),
        total_ops: 0, throughput: 0, avg_wait: 0, max_wait: 0, min_wait: 0, starvation_index: 0, cpu_util: 0, context_switches: 0, deadlock_detected: false, elapsed_time: 0, contention_heatmap: []
    };
    
    const pq = new PriorityQueue();
    for (let i = 0; i < numThreads; i++) pq.push({ t: randRange(1, 10), thread_id: i, action: Action.COMPUTE_DONE });
    
    let mutexLocked = false;
    const waitQ = [];
    const waitStart = Array(numThreads).fill(0);
    const opsDone = Array(numThreads).fill(0);
    
    let currentTime = 0;
    let activeThread = -1;
    
    while (!pq.isEmpty()) {
        const ev = pq.pop();
        currentTime = ev.t;
        const tId = ev.thread_id;
        
        if (ev.action === Action.COMPUTE_DONE) {
            if (!mutexLocked) {
                mutexLocked = true;
                res.timeline.push({ time: currentTime, thread_id: tId, event_type: "acquire", resource_id: 0, wait_start: currentTime, wait_end: currentTime });
                pq.push({ t: currentTime + randRange(10, 20), thread_id: tId, action: Action.CRITICAL_DONE });
                if (activeThread !== tId) { res.context_switches++; activeThread = tId; }
            } else {
                waitStart[tId] = currentTime;
                waitQ.push(tId);
                res.timeline.push({ time: currentTime, thread_id: tId, event_type: "waiting", resource_id: 0, wait_start: currentTime, wait_end: 0 });
            }
        } else if (ev.action === Action.CRITICAL_DONE) {
            mutexLocked = false;
            opsDone[tId]++;
            res.total_ops++;
            res.threads[tId].busy_time += 15;
            res.timeline.push({ time: currentTime, thread_id: tId, event_type: "release", resource_id: 0, wait_start: 0, wait_end: 0 });
            
            if (opsDone[tId] < ops) pq.push({ t: currentTime + randRange(10, 30), thread_id: tId, action: Action.COMPUTE_DONE });
            
            if (waitQ.length > 0) {
                const nextT = waitQ.shift();
                const wStart = waitStart[nextT];
                res.threads[nextT].wait_samples.push(currentTime - wStart);
                mutexLocked = true;
                res.timeline.push({ time: currentTime, thread_id: nextT, event_type: "acquire", resource_id: 0, wait_start: wStart, wait_end: currentTime });
                pq.push({ t: currentTime + randRange(10, 20), thread_id: nextT, action: Action.CRITICAL_DONE });
                if (activeThread !== nextT) { res.context_switches++; activeThread = nextT; }
            }
        }
    }
    
    res.elapsed_time = currentTime;
    computeGlobalMetrics(res, numThreads);
    return res;
}

export function runSemaphore(numThreads, poolSize, ops) {
    prngState = 12345;
    const res = {
        timeline: [], threads: Array.from({ length: numThreads }, (_, i) => ({ thread_id: i, wait_samples: [], busy_time: 0, idle_time: 0 })),
        total_ops: 0, throughput: 0, avg_wait: 0, max_wait: 0, min_wait: 0, starvation_index: 0, cpu_util: 0, context_switches: 0, deadlock_detected: false, elapsed_time: 0, contention_heatmap: []
    };
    
    const pq = new PriorityQueue();
    for (let i = 0; i < numThreads; i++) pq.push({ t: randRange(1, 10), thread_id: i, action: Action.COMPUTE_DONE });
    
    let available = poolSize;
    const waitQ = [];
    const waitStart = Array(numThreads).fill(0);
    const opsDone = Array(numThreads).fill(0);
    
    let currentTime = 0;
    
    while (!pq.isEmpty()) {
        const ev = pq.pop();
        currentTime = ev.t;
        const tId = ev.thread_id;
        
        if (ev.action === Action.COMPUTE_DONE) {
            if (available > 0) {
                available--;
                const resId = poolSize - available;
                res.timeline.push({ time: currentTime, thread_id: tId, event_type: "acquire", resource_id: resId, wait_start: currentTime, wait_end: currentTime });
                pq.push({ t: currentTime + randRange(10, 25), thread_id: tId, action: Action.CRITICAL_DONE });
            } else {
                waitStart[tId] = currentTime;
                waitQ.push(tId);
                res.timeline.push({ time: currentTime, thread_id: tId, event_type: "waiting", resource_id: 0, wait_start: currentTime, wait_end: 0 });
            }
        } else if (ev.action === Action.CRITICAL_DONE) {
            available++;
            opsDone[tId]++;
            res.total_ops++;
            res.threads[tId].busy_time += 15;
            res.timeline.push({ time: currentTime, thread_id: tId, event_type: "release", resource_id: 0, wait_start: 0, wait_end: 0 });
            
            if (opsDone[tId] < ops) pq.push({ t: currentTime + randRange(10, 30), thread_id: tId, action: Action.COMPUTE_DONE });
            
            if (waitQ.length > 0 && available > 0) {
                const nextT = waitQ.shift();
                available--;
                const wStart = waitStart[nextT];
                res.threads[nextT].wait_samples.push(currentTime - wStart);
                const resId = poolSize - available;
                res.timeline.push({ time: currentTime, thread_id: nextT, event_type: "acquire", resource_id: resId, wait_start: wStart, wait_end: currentTime });
                pq.push({ t: currentTime + randRange(10, 25), thread_id: nextT, action: Action.CRITICAL_DONE });
                res.context_switches++;
            }
        }
    }
    
    res.elapsed_time = currentTime;
    computeGlobalMetrics(res, numThreads);
    return res;
}

export function runProducerConsumer(producers, consumers, bufferSize, items) {
    prngState = 12345;
    const numThreads = producers + consumers;
    const res = {
        timeline: [], threads: Array.from({ length: numThreads }, (_, i) => ({ thread_id: i, wait_samples: [], busy_time: 0, idle_time: 0 })),
        total_ops: 0, throughput: 0, avg_wait: 0, max_wait: 0, min_wait: 0, starvation_index: 0, cpu_util: 0, context_switches: 0, deadlock_detected: false, elapsed_time: 0, contention_heatmap: []
    };
    
    const pq = new PriorityQueue();
    for (let i = 0; i < producers; i++) pq.push({ t: randRange(1, 10), thread_id: i, action: Action.COMPUTE_DONE });
    for (let i = 0; i < consumers; i++) pq.push({ t: randRange(1, 10), thread_id: producers + i, action: Action.COMPUTE_DONE });
    
    let count = 0;
    const waitProd = [], waitCons = [];
    const waitStart = Array(numThreads).fill(0);
    const itemsDone = Array(numThreads).fill(0);
    
    const itemsPerProd = Math.ceil(items / producers);
    const itemsPerCons = Math.ceil(items / consumers);
    
    let currentTime = 0;
    let totalProduced = 0, totalConsumed = 0;
    
    while (!pq.isEmpty()) {
        const ev = pq.pop();
        currentTime = ev.t;
        const tId = ev.thread_id;
        const isProducer = tId < producers;
        
        if (ev.action === Action.COMPUTE_DONE) {
            if (isProducer) {
                if (count < bufferSize && totalProduced < items) {
                    count++; totalProduced++;
                    res.timeline.push({ time: currentTime, thread_id: tId, event_type: "produce", resource_id: count, wait_start: currentTime, wait_end: currentTime });
                    pq.push({ t: currentTime + randRange(5, 15), thread_id: tId, action: Action.PRODUCE_DONE });
                } else {
                    if (totalProduced < items) {
                        waitStart[tId] = currentTime;
                        waitProd.push(tId);
                        res.timeline.push({ time: currentTime, thread_id: tId, event_type: "waiting_full", resource_id: 0, wait_start: currentTime, wait_end: 0 });
                    }
                }
            } else {
                if (count > 0 && totalConsumed < items) {
                    res.timeline.push({ time: currentTime, thread_id: tId, event_type: "consume", resource_id: count, wait_start: currentTime, wait_end: currentTime });
                    count--; totalConsumed++;
                    pq.push({ t: currentTime + randRange(5, 15), thread_id: tId, action: Action.CONSUME_DONE });
                } else {
                    if (totalConsumed < items) {
                        waitStart[tId] = currentTime;
                        waitCons.push(tId);
                        res.timeline.push({ time: currentTime, thread_id: tId, event_type: "waiting_empty", resource_id: 0, wait_start: currentTime, wait_end: 0 });
                    }
                }
            }
        } else if (ev.action === Action.PRODUCE_DONE || ev.action === Action.CONSUME_DONE) {
            itemsDone[tId]++;
            res.total_ops++;
            res.threads[tId].busy_time += 10;
            res.timeline.push({ time: currentTime, thread_id: tId, event_type: isProducer ? "produce_done" : "consume_done", resource_id: count, wait_start: 0, wait_end: 0 });
            
            if (isProducer && itemsDone[tId] < itemsPerProd) pq.push({ t: currentTime + randRange(10, 30), thread_id: tId, action: Action.COMPUTE_DONE });
            else if (!isProducer && itemsDone[tId] < itemsPerCons) pq.push({ t: currentTime + randRange(10, 30), thread_id: tId, action: Action.COMPUTE_DONE });
            
            if (isProducer && waitCons.length > 0) {
                const nextT = waitCons.shift();
                const wStart = waitStart[nextT];
                res.threads[nextT].wait_samples.push(currentTime - wStart);
                res.timeline.push({ time: currentTime, thread_id: nextT, event_type: "consume", resource_id: count, wait_start: wStart, wait_end: currentTime });
                count--; totalConsumed++;
                pq.push({ t: currentTime + randRange(5, 15), thread_id: nextT, action: Action.CONSUME_DONE });
                res.context_switches++;
            } else if (!isProducer && waitProd.length > 0 && totalProduced < items) {
                const nextT = waitProd.shift();
                const wStart = waitStart[nextT];
                res.threads[nextT].wait_samples.push(currentTime - wStart);
                count++; totalProduced++;
                res.timeline.push({ time: currentTime, thread_id: nextT, event_type: "produce", resource_id: count, wait_start: wStart, wait_end: currentTime });
                pq.push({ t: currentTime + randRange(5, 15), thread_id: nextT, action: Action.PRODUCE_DONE });
                res.context_switches++;
            }
        }
    }
    
    res.elapsed_time = currentTime;
    computeGlobalMetrics(res, numThreads);
    return res;
}

export function runReaderWriter(readers, writers, ops, preference) {
    prngState = 12345;
    const numThreads = readers + writers;
    const res = {
        timeline: [], threads: Array.from({ length: numThreads }, (_, i) => ({ thread_id: i, wait_samples: [], busy_time: 0, idle_time: 0 })),
        total_ops: 0, throughput: 0, avg_wait: 0, max_wait: 0, min_wait: 0, starvation_index: 0, cpu_util: 0, context_switches: 0, deadlock_detected: false, elapsed_time: 0, contention_heatmap: []
    };
    
    const pq = new PriorityQueue();
    for (let i = 0; i < numThreads; i++) pq.push({ t: randRange(1, 10), thread_id: i, action: Action.COMPUTE_DONE });
    
    let activeReaders = 0;
    let writerActive = false;
    const waitRead = [], waitWrite = [];
    const waitStart = Array(numThreads).fill(0);
    const opsDone = Array(numThreads).fill(0);
    
    let currentTime = 0;
    
    while (!pq.isEmpty()) {
        const ev = pq.pop();
        currentTime = ev.t;
        const tId = ev.thread_id;
        const isReader = tId < readers;
        
        if (ev.action === Action.COMPUTE_DONE) {
            if (isReader) {
                let canRead = !writerActive;
                if (preference === 1 && waitWrite.length > 0) canRead = false;
                
                if (canRead) {
                    activeReaders++;
                    res.timeline.push({ time: currentTime, thread_id: tId, event_type: "read_start", resource_id: activeReaders, wait_start: currentTime, wait_end: currentTime });
                    pq.push({ t: currentTime + randRange(10, 20), thread_id: tId, action: Action.READ_DONE });
                } else {
                    waitStart[tId] = currentTime;
                    waitRead.push(tId);
                    res.timeline.push({ time: currentTime, thread_id: tId, event_type: "waiting_read", resource_id: 0, wait_start: currentTime, wait_end: 0 });
                }
            } else {
                if (!writerActive && activeReaders === 0) {
                    writerActive = true;
                    res.timeline.push({ time: currentTime, thread_id: tId, event_type: "write_start", resource_id: 0, wait_start: currentTime, wait_end: currentTime });
                    pq.push({ t: currentTime + randRange(15, 30), thread_id: tId, action: Action.WRITE_DONE });
                } else {
                    waitStart[tId] = currentTime;
                    waitWrite.push(tId);
                    res.timeline.push({ time: currentTime, thread_id: tId, event_type: "waiting_write", resource_id: 0, wait_start: currentTime, wait_end: 0 });
                }
            }
        } else if (ev.action === Action.READ_DONE || ev.action === Action.WRITE_DONE) {
            opsDone[tId]++;
            res.total_ops++;
            res.threads[tId].busy_time += 15;
            res.timeline.push({ time: currentTime, thread_id: tId, event_type: isReader ? "read_end" : "write_end", resource_id: 0, wait_start: 0, wait_end: 0 });
            
            if (isReader) activeReaders--;
            else writerActive = false;
            
            if (opsDone[tId] < ops) pq.push({ t: currentTime + randRange(10, 30), thread_id: tId, action: Action.COMPUTE_DONE });
            
            if (preference === 1) { // Writers preference
                if (waitWrite.length > 0 && !writerActive && activeReaders === 0) {
                    const nextT = waitWrite.shift();
                    const wStart = waitStart[nextT];
                    res.threads[nextT].wait_samples.push(currentTime - wStart);
                    writerActive = true;
                    res.timeline.push({ time: currentTime, thread_id: nextT, event_type: "write_start", resource_id: 0, wait_start: wStart, wait_end: currentTime });
                    pq.push({ t: currentTime + randRange(15, 30), thread_id: nextT, action: Action.WRITE_DONE });
                    res.context_switches++;
                } else if (waitWrite.length === 0 && waitRead.length > 0 && !writerActive) {
                    while (waitRead.length > 0) {
                        const nextT = waitRead.shift();
                        const wStart = waitStart[nextT];
                        res.threads[nextT].wait_samples.push(currentTime - wStart);
                        activeReaders++;
                        res.timeline.push({ time: currentTime, thread_id: nextT, event_type: "read_start", resource_id: activeReaders, wait_start: wStart, wait_end: currentTime });
                        pq.push({ t: currentTime + randRange(10, 20), thread_id: nextT, action: Action.READ_DONE });
                        res.context_switches++;
                    }
                }
            } else { // Readers preference
                if (waitRead.length > 0 && !writerActive) {
                    while (waitRead.length > 0) {
                        const nextT = waitRead.shift();
                        const wStart = waitStart[nextT];
                        res.threads[nextT].wait_samples.push(currentTime - wStart);
                        activeReaders++;
                        res.timeline.push({ time: currentTime, thread_id: nextT, event_type: "read_start", resource_id: activeReaders, wait_start: wStart, wait_end: currentTime });
                        pq.push({ t: currentTime + randRange(10, 20), thread_id: nextT, action: Action.READ_DONE });
                        res.context_switches++;
                    }
                } else if (activeReaders === 0 && !writerActive && waitWrite.length > 0) {
                    const nextT = waitWrite.shift();
                    const wStart = waitStart[nextT];
                    res.threads[nextT].wait_samples.push(currentTime - wStart);
                    writerActive = true;
                    res.timeline.push({ time: currentTime, thread_id: nextT, event_type: "write_start", resource_id: 0, wait_start: wStart, wait_end: currentTime });
                    pq.push({ t: currentTime + randRange(15, 30), thread_id: nextT, action: Action.WRITE_DONE });
                    res.context_switches++;
                }
            }
        }
    }
    
    res.elapsed_time = currentTime;
    computeGlobalMetrics(res, numThreads);
    return res;
}

export function runDining(n, meals) {
    prngState = 12345;
    const res = {
        timeline: [], threads: Array.from({ length: n }, (_, i) => ({ thread_id: i, wait_samples: [], busy_time: 0, idle_time: 0 })),
        total_ops: 0, throughput: 0, avg_wait: 0, max_wait: 0, min_wait: 0, starvation_index: 0, cpu_util: 0, context_switches: 0, deadlock_detected: false, elapsed_time: 0, contention_heatmap: []
    };
    
    const pq = new PriorityQueue();
    for (let i = 0; i < n; i++) pq.push({ t: randRange(1, 10), thread_id: i, action: Action.COMPUTE_DONE });
    
    const forkOwner = Array(n).fill(-1);
    const forkWait = Array.from({ length: n }, () => []);
    const waitStart = Array(n).fill(0);
    const mealsDone = Array(n).fill(0);
    const state = Array(n).fill(0); // 0=thinking, 1=hungry(waiting lower), 2=hungry(waiting higher), 3=eating
    const contentionMap = new Map();
    
    let currentTime = 0;
    
    while (!pq.isEmpty()) {
        const ev = pq.pop();
        currentTime = ev.t;
        const pId = ev.thread_id;
        
        const left = pId;
        const right = (pId + 1) % n;
        const firstFork = Math.min(left, right);
        const secondFork = Math.max(left, right);
        
        if (ev.action === Action.COMPUTE_DONE) {
            state[pId] = 1;
            waitStart[pId] = currentTime;
            res.timeline.push({ time: currentTime, thread_id: pId, event_type: "hungry", resource_id: 0, wait_start: currentTime, wait_end: 0 });
            
            if (forkOwner[firstFork] === -1) {
                forkOwner[firstFork] = pId;
                state[pId] = 2;
                if (forkOwner[secondFork] === -1) {
                    forkOwner[secondFork] = pId;
                    state[pId] = 3;
                    res.threads[pId].wait_samples.push(currentTime - waitStart[pId]);
                    res.timeline.push({ time: currentTime, thread_id: pId, event_type: "eat", resource_id: 0, wait_start: waitStart[pId], wait_end: currentTime });
                    pq.push({ t: currentTime + randRange(15, 30), thread_id: pId, action: Action.MEAL_DONE });
                } else {
                    forkWait[secondFork].push(pId);
                    const key = `${Math.min(pId, forkOwner[secondFork])},${Math.max(pId, forkOwner[secondFork])}`;
                    contentionMap.set(key, (contentionMap.get(key) || 0) + 1);
                }
            } else {
                forkWait[firstFork].push(pId);
                const key = `${Math.min(pId, forkOwner[firstFork])},${Math.max(pId, forkOwner[firstFork])}`;
                contentionMap.set(key, (contentionMap.get(key) || 0) + 1);
            }
        } else if (ev.action === Action.MEAL_DONE) {
            mealsDone[pId]++;
            res.total_ops++;
            res.threads[pId].busy_time += 20;
            state[pId] = 0;
            res.timeline.push({ time: currentTime, thread_id: pId, event_type: "think", resource_id: 0, wait_start: 0, wait_end: 0 });
            
            forkOwner[firstFork] = -1;
            forkOwner[secondFork] = -1;
            
            if (mealsDone[pId] < meals) pq.push({ t: currentTime + randRange(10, 30), thread_id: pId, action: Action.COMPUTE_DONE });
            
            for (const f of [firstFork, secondFork]) {
                if (forkWait[f].length > 0) {
                    const nextP = forkWait[f].shift();
                    forkOwner[f] = nextP;
                    
                    const nLeft = nextP;
                    const nRight = (nextP + 1) % n;
                    const nFirst = Math.min(nLeft, nRight);
                    const nSecond = Math.max(nLeft, nRight);
                    
                    if (state[nextP] === 1 && f === nFirst) {
                        state[nextP] = 2;
                        if (forkOwner[nSecond] === -1) {
                            forkOwner[nSecond] = nextP;
                            state[nextP] = 3;
                            res.threads[nextP].wait_samples.push(currentTime - waitStart[nextP]);
                            res.timeline.push({ time: currentTime, thread_id: nextP, event_type: "eat", resource_id: 0, wait_start: waitStart[nextP], wait_end: currentTime });
                            pq.push({ t: currentTime + randRange(15, 30), thread_id: nextP, action: Action.MEAL_DONE });
                            res.context_switches++;
                        } else {
                            forkWait[nSecond].push(nextP);
                            const key = `${Math.min(nextP, forkOwner[nSecond])},${Math.max(nextP, forkOwner[nSecond])}`;
                            contentionMap.set(key, (contentionMap.get(key) || 0) + 1);
                        }
                    } else if (state[nextP] === 2 && f === nSecond) {
                        state[nextP] = 3;
                        res.threads[nextP].wait_samples.push(currentTime - waitStart[nextP]);
                        res.timeline.push({ time: currentTime, thread_id: nextP, event_type: "eat", resource_id: 0, wait_start: waitStart[nextP], wait_end: currentTime });
                        pq.push({ t: currentTime + randRange(15, 30), thread_id: nextP, action: Action.MEAL_DONE });
                        res.context_switches++;
                    }
                }
            }
        }
    }
    
    for (const [key, count] of contentionMap.entries()) {
        const [p1, p2] = key.split(',').map(Number);
        res.contention_heatmap.push({ p1, p2, count });
    }
    
    res.elapsed_time = currentTime;
    computeGlobalMetrics(res, n);
    return res;
}

export async function runSyncAlgorithm(payload) {
    const { problem } = payload;
    let result;
    if (problem === "mutex") {
        result = runMutex(payload.threads || 3, payload.ops || 10);
    } else if (problem === "semaphore") {
        result = runSemaphore(payload.threads || 5, payload.poolSize || 2, payload.ops || 5);
    } else if (problem === "producerConsumer" || problem === "producer_consumer") {
        result = runProducerConsumer(payload.producers || 2, payload.consumers || 2, payload.bufferSize || 5, payload.items || 20);
    } else if (problem === "readerWriter" || problem === "reader_writer") {
        result = runReaderWriter(payload.readers || 3, payload.writers || 2, payload.ops || 5, payload.preference || 0);
    } else if (problem === "dining") {
        result = runDining(payload.philosophers || payload.n || 5, payload.meals || 5);
    } else {
        throw new Error("Unknown problem: " + problem);
    }
    return result;
}
