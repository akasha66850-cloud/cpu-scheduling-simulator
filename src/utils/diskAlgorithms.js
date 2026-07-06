export function computeMetrics(sequence, requests, reversals = 0) {
    let totalDistance = 0;
    const distances = [];
    
    for (let i = 0; i < sequence.length - 1; i++) {
        const dist = Math.abs(sequence[i + 1] - sequence[i]);
        totalDistance += dist;
        if (requests.includes(sequence[i + 1])) {
            distances.push(dist);
        }
    }

    const avgSeekTime = totalDistance;
    const throughput = totalDistance === 0 ? "0.0000" : (requests.length / totalDistance).toFixed(4);
    
    let cumDistance = 0;
    const responseTimes = [];
    for (let i = 0; i < sequence.length - 1; i++) {
        cumDistance += Math.abs(sequence[i + 1] - sequence[i]);
        if (requests.includes(sequence[i + 1])) {
            responseTimes.push(cumDistance);
        }
    }
    
    const avgResponseTime = responseTimes.length === 0 ? "0.00" : 
        (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(2);

    const meanDist = distances.length === 0 ? 0.0 : distances.reduce((a, b) => a + b, 0) / distances.length;
    let varSum = 0;
    for(const d of distances) {
        varSum += (d - meanDist) * (d - meanDist);
    }
    const variance = distances.length === 0 ? "0.00" : (varSum / distances.length).toFixed(2);

    return {
        totalDistance,
        avgSeekTime,
        throughput,
        avgResponseTime,
        variance,
        reversals
    };
}

export function fcfs(queue, head) {
    const sequence = [head, ...queue];
    
    const steps = [];
    for (let i = 0; i < queue.length; i++) {
        const remaining = queue.slice(i + 1);
        steps.push({
            current: sequence[i],
            next: sequence[i+1],
            distance: Math.abs(sequence[i+1] - sequence[i]),
            queueRemaining: remaining,
            type: "seek"
        });
    }

    return { sequence, steps, metrics: computeMetrics(sequence, queue) };
}

export function sstf(queue, head) {
    const sequence = [head];
    const steps = [];
    
    let current = head;
    const remaining = [...queue];

    while (remaining.length > 0) {
        let shortestIdx = 0;
        let minDiff = 1e9;
        for (let i = 0; i < remaining.length; i++) {
            const diff = Math.abs(remaining[i] - current);
            if (diff < minDiff) {
                minDiff = diff;
                shortestIdx = i;
            }
        }

        const next = remaining[shortestIdx];
        remaining.splice(shortestIdx, 1);
        
        steps.push({
            current: current,
            next: next,
            distance: minDiff,
            queueRemaining: [...remaining],
            type: "seek"
        });
        
        sequence.push(next);
        current = next;
    }

    return { sequence, steps, metrics: computeMetrics(sequence, queue) };
}

export function scan(queue, head, diskSize, direction) {
    const sequence = [head];
    const steps = [];
    
    let current = head;
    const remaining = [...queue];
    let reversals = 0;

    const left = remaining.filter(req => req < head).sort((a, b) => b - a);
    const right = remaining.filter(req => req >= head).sort((a, b) => a - b);

    let runSequence = [];
    if (direction === "down") {
        if (left.length > 0) {
            runSequence = [...left, 0, ...right];
        } else {
            runSequence = right;
        }
    } else {
        if (right.length > 0) {
            runSequence = [...right, diskSize - 1, ...left];
        } else {
            runSequence = left;
        }
    }

    let currDir = direction;
    for (const next of runSequence) {
        if (next === 0 && currDir === "down") {
            reversals++;
            currDir = "up";
        } else if (next === diskSize - 1 && currDir === "up") {
            reversals++;
            currDir = "down";
        }

        const idx = remaining.indexOf(next);
        if (idx !== -1) remaining.splice(idx, 1);
        
        const type = (next === 0 || next === diskSize - 1) ? "boundary" : "seek";
        steps.push({
            current: current,
            next: next,
            distance: Math.abs(next - current),
            queueRemaining: [...remaining],
            type: type
        });

        sequence.push(next);
        current = next;
    }

    return { sequence, steps, metrics: computeMetrics(sequence, queue, reversals) };
}

export function cscan(queue, head, diskSize, direction) {
    const sequence = [head];
    const steps = [];
    
    let current = head;
    const remaining = [...queue];

    const left = remaining.filter(req => req < head).sort((a, b) => a - b);
    const right = remaining.filter(req => req >= head).sort((a, b) => a - b);

    let runSequence = [];
    if (direction === "up") {
        if (left.length > 0) {
            runSequence = [...right, diskSize - 1, 0, ...left];
        } else {
            runSequence = right;
        }
    } else {
        const leftDown = remaining.filter(req => req < head).sort((a, b) => b - a);
        const rightDown = remaining.filter(req => req >= head).sort((a, b) => b - a);
        if (rightDown.length > 0) {
            runSequence = [...leftDown, 0, diskSize - 1, ...rightDown];
        } else {
            runSequence = leftDown;
        }
    }

    for (const next of runSequence) {
        const idx = remaining.indexOf(next);
        if (idx !== -1) remaining.splice(idx, 1);
        
        const type = (next === 0 || next === diskSize - 1) ? "jump" : "seek";
        steps.push({
            current: current,
            next: next,
            distance: Math.abs(next - current),
            queueRemaining: [...remaining],
            type: type
        });

        sequence.push(next);
        current = next;
    }

    return { sequence, steps, metrics: computeMetrics(sequence, queue, 0) };
}

export function look(queue, head, direction) {
    const sequence = [head];
    const steps = [];
    
    let current = head;
    const remaining = [...queue];
    let reversals = 0;

    const left = remaining.filter(req => req < head).sort((a, b) => b - a);
    const right = remaining.filter(req => req >= head).sort((a, b) => a - b);

    let runSequence = [];
    if (direction === "down") {
        runSequence = [...left, ...right];
        if (left.length > 0 && right.length > 0) reversals++;
    } else { // 'up'
        runSequence = [...right, ...left];
        if (left.length > 0 && right.length > 0) reversals++;
    }

    for (const next of runSequence) {
        const idx = remaining.indexOf(next);
        if (idx !== -1) remaining.splice(idx, 1);
        
        steps.push({
            current: current,
            next: next,
            distance: Math.abs(next - current),
            queueRemaining: [...remaining],
            type: "seek"
        });

        sequence.push(next);
        current = next;
    }

    return { sequence, steps, metrics: computeMetrics(sequence, queue, reversals) };
}

export function clook(queue, head, direction) {
    const sequence = [head];
    const steps = [];
    
    let current = head;
    const remaining = [...queue];

    const left = remaining.filter(req => req < head).sort((a, b) => a - b);
    const right = remaining.filter(req => req >= head).sort((a, b) => a - b);

    let runSequence = [];
    if (direction === "up") {
        runSequence = [...right, ...left];
    } else {
        const leftDown = remaining.filter(req => req < head).sort((a, b) => b - a);
        const rightDown = remaining.filter(req => req >= head).sort((a, b) => b - a);
        runSequence = [...leftDown, ...rightDown];
    }

    for (const next of runSequence) {
        const idx = remaining.indexOf(next);
        if (idx !== -1) remaining.splice(idx, 1);
        
        steps.push({
            current: current,
            next: next,
            distance: Math.abs(next - current),
            queueRemaining: [...remaining],
            type: "seek"
        });

        sequence.push(next);
        current = next;
    }

    return { sequence, steps, metrics: computeMetrics(sequence, queue, 0) };
}

export async function runDiskAlgorithm(payload) {
    const { algorithm, head, diskSize, direction, queue } = payload;

    let result;
    if (algorithm === "fcfs") result = fcfs(queue, head);
    else if (algorithm === "sstf") result = sstf(queue, head);
    else if (algorithm === "scan") result = scan(queue, head, diskSize, direction);
    else if (algorithm === "cscan") result = cscan(queue, head, diskSize, direction);
    else if (algorithm === "look") result = look(queue, head, direction);
    else if (algorithm === "clook") result = clook(queue, head, direction);
    else throw new Error("Unknown algorithm");

    return result;
}
