export function calculateNeed(allocation, maxDemand) {
    const numProcesses = allocation.length;
    const numResources = allocation[0].length;
    const need = Array.from({ length: numProcesses }, () => Array(numResources).fill(0));
    
    for (let i = 0; i < numProcesses; i++) {
        for (let j = 0; j < numResources; j++) {
            need[i][j] = Math.max(0, maxDemand[i][j] - allocation[i][j]);
        }
    }
    return need;
}

export function checkSafety(allocation, maxDemand, available) {
    const numProcesses = allocation.length;
    const numResources = available.length;
    const need = calculateNeed(allocation, maxDemand);
    
    const work = [...available];
    const finish = Array(numProcesses).fill(false);
    const safeSequence = [];
    const steps = [];

    steps.push({
        type: "init",
        work: [...work],
        finish: [...finish],
        safeSequence: [...safeSequence],
        message: "Initialize Work = Available, Finish = false for all processes."
    });

    let count = 0;
    while (count < numProcesses) {
        let found = false;
        for (let p = 0; p < numProcesses; p++) {
            if (!finish[p]) {
                let canAllocate = true;
                for (let j = 0; j < numResources; j++) {
                    if (need[p][j] > work[j]) {
                        canAllocate = false;
                        break;
                    }
                }

                if (canAllocate) {
                    for (let j = 0; j < numResources; j++) {
                        work[j] += allocation[p][j];
                    }
                    finish[p] = true;
                    safeSequence.push(p);
                    found = true;
                    count++;

                    steps.push({
                        type: "process_finish",
                        process: p,
                        work: [...work],
                        finish: [...finish],
                        safeSequence: [...safeSequence],
                        message: `P${p} Need <= Work. P${p} finishes and releases its allocation.`
                    });
                    break;
                } else {
                    steps.push({
                        type: "process_fail",
                        process: p,
                        work: [...work],
                        finish: [...finish],
                        safeSequence: [...safeSequence],
                        message: `P${p} Need > Work. Cannot fulfill request.`
                    });
                }
            }
        }
        if (!found) break;
    }

    const isSafe = (count === numProcesses);

    if (!isSafe) {
        steps.push({
            type: "unsafe",
            work: [...work],
            finish: [...finish],
            safeSequence: [...safeSequence],
            message: "Unsafe state detected. Cannot find a safe sequence."
        });
    }

    return {
        isSafe,
        safeSequence,
        steps,
        need,
        metrics: {
            isSafe,
            safeSequenceLength: safeSequence.length,
            processesFinished: count
        }
    };
}

export function requestResources(pid, requestVector, allocation, maxDemand, available) {
    const need = calculateNeed(allocation, maxDemand);
    const steps = [];

    let isValidNeed = true;
    for (let j = 0; j < requestVector.length; j++) {
        if (requestVector[j] > need[pid][j]) {
            isValidNeed = false; break;
        }
    }
    
    steps.push({
        step: 1,
        success: isValidNeed,
        message: `Check Request <= Need for P${pid}`
    });
    
    if (!isValidNeed) {
        return {
            success: false,
            reason: "Request exceeds maximum claim.",
            steps
        };
    }

    let isAvailable = true;
    for (let j = 0; j < requestVector.length; j++) {
        if (requestVector[j] > available[j]) {
            isAvailable = false; break;
        }
    }

    steps.push({
        step: 2,
        success: isAvailable,
        message: "Check Request <= Available"
    });

    if (!isAvailable) {
        return {
            success: false,
            reason: "Resources not available, process must wait.",
            steps
        };
    }

    const testAvailable = [...available];
    const testAllocation = allocation.map(row => [...row]);
    
    for (let j = 0; j < requestVector.length; j++) {
        testAvailable[j] -= requestVector[j];
        testAllocation[pid][j] += requestVector[j];
    }

    const safetyResult = checkSafety(testAllocation, maxDemand, testAvailable);
    
    steps.push({
        step: 3,
        success: safetyResult.isSafe,
        message: `Hypothetical Safety Check: ${safetyResult.isSafe ? "SAFE" : "UNSAFE"}`,
        safetySteps: safetyResult.steps
    });

    if (safetyResult.isSafe) {
        return {
            success: true,
            reason: "Request granted safely.",
            steps,
            newAvailable: testAvailable,
            newAllocation: testAllocation
        };
    } else {
        return {
            success: false,
            reason: "Request denied. Would lead to unsafe state.",
            steps
        };
    }
}

export function runDetection(allocation, request, available) {
    const numProcesses = allocation.length;
    const numResources = available.length;
    
    const work = [...available];
    const finish = Array(numProcesses).fill(false);
    const steps = [];

    for (let i = 0; i < numProcesses; i++) {
        let hasAllocation = false;
        for (let j = 0; j < numResources; j++) {
            if (allocation[i][j] > 0) {
                hasAllocation = true;
                break;
            }
        }
        finish[i] = !hasAllocation;
    }

    steps.push({
        type: "init",
        work: [...work],
        finish: [...finish],
        message: "Initialize Work = Available. Finish[i] = false if Allocation > 0, else true."
    });

    let progress = true;
    while (progress) {
        progress = false;
        for (let p = 0; p < numProcesses; p++) {
            if (!finish[p]) {
                let canSatisfy = true;
                for (let j = 0; j < numResources; j++) {
                    if (request[p][j] > work[j]) {
                        canSatisfy = false;
                        break;
                    }
                }

                if (canSatisfy) {
                    for (let j = 0; j < numResources; j++) {
                        work[j] += allocation[p][j];
                    }
                    finish[p] = true;
                    progress = true;

                    steps.push({
                        type: "reduce",
                        process: p,
                        work: [...work],
                        finish: [...finish],
                        message: `P${p} Request <= Work. P${p} completes and releases resources.`
                    });
                    break;
                }
            }
        }
    }

    const deadlockedProcesses = [];
    for (let i = 0; i < numProcesses; i++) {
        if (!finish[i]) {
            deadlockedProcesses.push(i);
        }
    }

    const isDeadlocked = deadlockedProcesses.length > 0;
    
    let msg = "";
    if (isDeadlocked) {
        msg = `System is DEADLOCKED. Processes involved: ${deadlockedProcesses.map(p => `P${p}`).join(", ")}`;
    } else {
        msg = "System is SAFE. No deadlocks detected.";
    }

    steps.push({
        type: "result",
        isDeadlocked,
        deadlockedProcesses,
        message: msg
    });

    return {
        isDeadlocked,
        deadlockedProcesses,
        steps,
        metrics: {
            deadlockCount: deadlockedProcesses.length,
            isDeadlocked,
            totalProcesses: numProcesses
        }
    };
}

export function runPreventionHoldWait(allocation, request) {
    const numProcesses = allocation.length;
    const steps = [];
    
    let isValid = true;
    const violations = [];

    steps.push({
        type: "init",
        message: "Checking Hold and Wait Condition: Processes with Allocation > 0 cannot have Request > 0."
    });

    for (let p = 0; p < numProcesses; p++) {
        let hasAllocation = false;
        let hasRequest = false;
        for (const val of allocation[p]) if (val > 0) hasAllocation = true;
        for (const val of request[p]) if (val > 0) hasRequest = true;

        if (hasAllocation && hasRequest) {
            isValid = false;
            violations.push(p);
            steps.push({
                type: "violation",
                process: p,
                message: `P${p} VIOLATES rule. It currently holds resources and is requesting more.`
            });
        } else if (hasRequest) {
            steps.push({
                type: "valid",
                process: p,
                message: `P${p} COMPLIES. It requests resources but currently holds none.`
            });
        } else {
            steps.push({
                type: "valid",
                process: p,
                message: `P${p} COMPLIES. It holds resources but requests none.`
            });
        }
    }

    let msg = "";
    if (isValid) {
        msg = "System complies with Hold and Wait Prevention.";
    } else {
        msg = `System violates Hold and Wait Prevention (Processes: ${violations.map(p => `P${p}`).join(", ")}).`;
    }

    steps.push({
        type: "result",
        isValid,
        violations,
        message: msg
    });

    return {
        isValid,
        violations,
        steps,
        metrics: {
            overhead: 20,
            safetyGuarantee: isValid ? 100 : 0,
            starvationRisk: 100
        }
    };
}

export function runPreventionCircularWait(allocation, request) {
    const numProcesses = allocation.length;
    const numResources = allocation[0].length;
    const steps = [];
    
    let isValid = true;
    const violations = [];

    steps.push({
        type: "init",
        message: "Checking Circular Wait Condition: Processes holding R(i) can only request R(j) where j > i."
    });

    for (let p = 0; p < numProcesses; p++) {
        let highestAllocIndex = -1;
        for (let j = numResources - 1; j >= 0; j--) {
            if (allocation[p][j] > 0) {
                highestAllocIndex = j;
                break;
            }
        }

        if (highestAllocIndex === -1) {
            steps.push({
                type: "valid",
                process: p,
                message: `P${p} COMPLIES. Holds no resources, can request any.`
            });
            continue;
        }

        let processViolates = false;
        const violatingResources = [];
        for (let j = 0; j <= highestAllocIndex; j++) {
            if (request[p][j] > 0) {
                processViolates = true;
                violatingResources.push(j);
            }
        }

        if (processViolates) {
            isValid = false;
            violations.push(p);
            const resStr = violatingResources.join(", R");
            steps.push({
                type: "violation",
                process: p,
                message: `P${p} VIOLATES rule. Holds R${highestAllocIndex} but requests R${resStr}.`
            });
        } else {
            steps.push({
                type: "valid",
                process: p,
                message: `P${p} COMPLIES. Holds R${highestAllocIndex} and only requests resources with higher index.`
            });
        }
    }

    let msg = "";
    if (isValid) {
        msg = "System complies with Circular Wait Prevention.";
    } else {
        msg = `System violates Circular Wait Prevention (Processes: ${violations.map(p => `P${p}`).join(", ")}).`;
    }

    steps.push({
        type: "result",
        isValid,
        violations,
        message: msg
    });

    return {
        isValid,
        violations,
        steps,
        metrics: {
            overhead: 10,
            safetyGuarantee: isValid ? 100 : 0,
            starvationRisk: 20
        }
    };
}

export function runRecoveryTerminate(allocationStr, requestStr, availableStr) {
    const allocation = allocationStr.map(row => [...row]);
    const request = requestStr.map(row => [...row]);
    const available = [...availableStr];

    const steps = [];
    const terminated = [];
    
    let detect = runDetection(allocation, request, available);
    
    let msg = "";
    if (detect.isDeadlocked) {
        msg = `Initial state is DEADLOCKED. Involved: ${detect.deadlockedProcesses.map(p => `P${p}`).join(", ")}`;
    } else {
        msg = "Initial state is SAFE. No recovery needed.";
    }

    steps.push({
        type: "detect",
        isDeadlocked: detect.isDeadlocked,
        deadlockedProcesses: detect.deadlockedProcesses,
        message: msg
    });

    while (detect.isDeadlocked) {
        const dps = detect.deadlockedProcesses;
        const victim = Math.max(...dps); // Pick highest PID
        
        for (let j = 0; j < available.length; j++) {
            available[j] += allocation[victim][j];
            allocation[victim][j] = 0;
            request[victim][j] = 0;
        }
        
        terminated.push(victim);

        steps.push({
            type: "terminate",
            victim: victim,
            work: [...available],
            message: `Terminated P${victim}. Resources released to Available pool.`
        });

        detect = runDetection(allocation, request, available);
        
        if (detect.isDeadlocked) {
            msg = `Still DEADLOCKED. Involved: ${detect.deadlockedProcesses.map(p => `P${p}`).join(", ")}`;
        } else {
            msg = "System is now SAFE. Deadlock broken.";
        }

        steps.push({
            type: "detect",
            isDeadlocked: detect.isDeadlocked,
            deadlockedProcesses: detect.deadlockedProcesses,
            message: msg
        });
    }

    return {
        steps,
        terminated,
        metrics: {
            terminatedCount: terminated.length,
            overhead: terminated.length * 10,
            safetyGuarantee: 100,
            starvationRisk: 80
        }
    };
}

export function runRecoveryPreempt(allocationStr, requestStr, availableStr) {
    const allocation = allocationStr.map(row => [...row]);
    const request = requestStr.map(row => [...row]);
    const available = [...availableStr];

    const steps = [];
    const preempted = [];
    
    let detect = runDetection(allocation, request, available);
    
    let msg = "";
    if (detect.isDeadlocked) {
        msg = `Initial state is DEADLOCKED. Involved: ${detect.deadlockedProcesses.map(p => `P${p}`).join(", ")}`;
    } else {
        msg = "Initial state is SAFE. No recovery needed.";
    }

    steps.push({
        type: "detect",
        isDeadlocked: detect.isDeadlocked,
        deadlockedProcesses: detect.deadlockedProcesses,
        message: msg
    });

    while (detect.isDeadlocked) {
        const dps = detect.deadlockedProcesses;
        const victim = Math.max(...dps);
        
        for (let j = 0; j < available.length; j++) {
            if (allocation[victim][j] > 0) {
                available[j] += allocation[victim][j];
                request[victim][j] += allocation[victim][j];
                allocation[victim][j] = 0;
            }
        }
        
        preempted.push(victim);

        steps.push({
            type: "preempt",
            victim: victim,
            work: [...available],
            message: `Preempted resources from P${victim}. It is rolled back and must request them again.`
        });

        detect = runDetection(allocation, request, available);
        
        if (detect.isDeadlocked) {
            msg = `Still DEADLOCKED. Involved: ${detect.deadlockedProcesses.map(p => `P${p}`).join(", ")}`;
        } else {
            msg = "System is now SAFE. Deadlock broken.";
        }

        steps.push({
            type: "detect",
            isDeadlocked: detect.isDeadlocked,
            deadlockedProcesses: detect.deadlockedProcesses,
            message: msg
        });
    }

    return {
        steps,
        preempted,
        metrics: {
            preemptedCount: preempted.length,
            overhead: preempted.length * 5,
            safetyGuarantee: 100,
            starvationRisk: 90
        }
    };
}

export async function runDeadlockAlgorithm(payload) {
    const { action } = payload;
    let result;
    
    if (action === "checkSafety") {
        result = checkSafety(payload.allocation, payload.maxDemand, payload.available);
    } else if (action === "requestResources") {
        result = requestResources(payload.pid, payload.requestVector, payload.allocation, payload.maxDemand, payload.available);
    } else if (action === "runDetection") {
        result = runDetection(payload.allocation, payload.request, payload.available);
    } else if (action === "runPreventionHoldWait") {
        result = runPreventionHoldWait(payload.allocation, payload.request);
    } else if (action === "runPreventionCircularWait") {
        result = runPreventionCircularWait(payload.allocation, payload.request);
    } else if (action === "runRecoveryTerminate") {
        result = runRecoveryTerminate(payload.allocation, payload.request, payload.available);
    } else if (action === "runRecoveryPreempt") {
        result = runRecoveryPreempt(payload.allocation, payload.request, payload.available);
    } else {
        throw new Error("Unknown action");
    }

    return result;
}
