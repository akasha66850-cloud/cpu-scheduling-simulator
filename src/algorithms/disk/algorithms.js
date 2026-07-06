// Helper to compute standard metrics
function computeMetrics(sequence, requests, reversals = 0) {
  let totalDistance = 0
  let distances = []
  
  // Calculate distances between consecutive points in sequence
  for (let i = 0; i < sequence.length - 1; i++) {
    const dist = Math.abs(sequence[i + 1] - sequence[i])
    totalDistance += dist
    if (requests.includes(sequence[i + 1])) {
      distances.push(dist)
    }
  }

  const avgSeekTime = totalDistance // assuming 1ms per cylinder
  const throughput = totalDistance === 0 ? 0 : (requests.length / totalDistance).toFixed(4)
  
  // Response time: time from start until request is served.
  // We'll calculate the cumulative distance up to each request served.
  let cumDistance = 0
  let responseTimes = []
  for (let i = 0; i < sequence.length - 1; i++) {
    cumDistance += Math.abs(sequence[i + 1] - sequence[i])
    if (requests.includes(sequence[i + 1])) {
      responseTimes.push(cumDistance)
    }
  }
  const avgResponseTime = responseTimes.length > 0 
    ? (responseTimes.reduce((a,b) => a+b, 0) / responseTimes.length).toFixed(2)
    : 0

  // Variance of individual seek distances (fairness)
  const meanDist = distances.length > 0 ? distances.reduce((a,b)=>a+b,0)/distances.length : 0
  const variance = distances.length > 0 
    ? (distances.reduce((sq, n) => sq + Math.pow(n - meanDist, 2), 0) / distances.length).toFixed(2)
    : 0

  return {
    totalDistance,
    avgSeekTime,
    throughput,
    avgResponseTime,
    variance,
    reversals
  }
}

export function fcfs(queue, head) {
  const sequence = [head, ...queue]
  const steps = []
  
  for (let i = 0; i < queue.length; i++) {
    steps.push({
      current: sequence[i],
      next: sequence[i+1],
      distance: Math.abs(sequence[i+1] - sequence[i]),
      queueRemaining: queue.slice(i+1),
      type: 'seek'
    })
  }

  return {
    sequence,
    steps,
    metrics: computeMetrics(sequence, queue)
  }
}

export function sstf(queue, head) {
  const sequence = [head]
  const steps = []
  let current = head
  let remaining = [...queue]

  while (remaining.length > 0) {
    let shortestIdx = 0
    let minDiff = Infinity
    for (let i = 0; i < remaining.length; i++) {
      const diff = Math.abs(remaining[i] - current)
      if (diff < minDiff) {
        minDiff = diff
        shortestIdx = i
      }
    }

    const next = remaining[shortestIdx]
    remaining.splice(shortestIdx, 1)
    
    steps.push({
      current,
      next,
      distance: minDiff,
      queueRemaining: [...remaining],
      type: 'seek'
    })
    
    sequence.push(next)
    current = next
  }

  return {
    sequence,
    steps,
    metrics: computeMetrics(sequence, queue)
  }
}

export function scan(queue, head, diskSize, direction) {
  const sequence = [head]
  const steps = []
  let current = head
  let remaining = [...queue]
  let reversals = 0

  // Split into left and right
  let left = remaining.filter(req => req < head).sort((a,b) => b - a) // descending
  let right = remaining.filter(req => req >= head).sort((a,b) => a - b) // ascending

  let runSequence = []
  if (direction === 'down') {
    if (left.length > 0) {
      runSequence = [...left, 0, ...right]
    } else {
      runSequence = [...right]
    }
  } else { // 'up'
    if (right.length > 0) {
      runSequence = [...right, diskSize - 1, ...left]
    } else {
      runSequence = [...left]
    }
  }

  let currDir = direction
  for (const next of runSequence) {
    if (next === 0 && currDir === 'down') {
      reversals++
      currDir = 'up'
    } else if (next === diskSize - 1 && currDir === 'up') {
      reversals++
      currDir = 'down'
    }

    remaining = remaining.filter(r => r !== next)
    
    steps.push({
      current,
      next,
      distance: Math.abs(next - current),
      queueRemaining: [...remaining],
      type: (next === 0 || next === diskSize - 1) ? 'boundary' : 'seek'
    })

    sequence.push(next)
    current = next
  }

  return {
    sequence,
    steps,
    metrics: computeMetrics(sequence, queue, reversals)
  }
}

export function cscan(queue, head, diskSize, direction) {
  const sequence = [head]
  const steps = []
  let current = head
  let remaining = [...queue]

  let left = remaining.filter(req => req < head).sort((a,b) => a - b) // ascending!
  let right = remaining.filter(req => req >= head).sort((a,b) => a - b) // ascending

  let runSequence = []
  if (direction === 'up') {
    if (left.length > 0) {
      runSequence = [...right, diskSize - 1, 0, ...left]
    } else {
      runSequence = [...right]
    }
  } else {
    // down
    left = left.sort((a,b) => b - a)
    right = right.sort((a,b) => b - a)
    if (right.length > 0) {
      runSequence = [...left, 0, diskSize - 1, ...right]
    } else {
      runSequence = [...left]
    }
  }

  for (const next of runSequence) {
    remaining = remaining.filter(r => r !== next)
    
    steps.push({
      current,
      next,
      distance: Math.abs(next - current),
      queueRemaining: [...remaining],
      type: (next === 0 || next === diskSize - 1) ? 'jump' : 'seek'
    })

    sequence.push(next)
    current = next
  }

  return {
    sequence,
    steps,
    metrics: computeMetrics(sequence, queue, 0)
  }
}

export function look(queue, head, direction) {
  const sequence = [head]
  const steps = []
  let current = head
  let remaining = [...queue]
  let reversals = 0

  let left = remaining.filter(req => req < head).sort((a,b) => b - a) // descending
  let right = remaining.filter(req => req >= head).sort((a,b) => a - b) // ascending

  let runSequence = []
  if (direction === 'down') {
    runSequence = [...left, ...right]
    if (left.length > 0 && right.length > 0) reversals++
  } else { // 'up'
    runSequence = [...right, ...left]
    if (left.length > 0 && right.length > 0) reversals++
  }

  for (const next of runSequence) {
    remaining = remaining.filter(r => r !== next)
    
    steps.push({
      current,
      next,
      distance: Math.abs(next - current),
      queueRemaining: [...remaining],
      type: 'seek'
    })

    sequence.push(next)
    current = next
  }

  return {
    sequence,
    steps,
    metrics: computeMetrics(sequence, queue, reversals)
  }
}

export function clook(queue, head, direction) {
  const sequence = [head]
  const steps = []
  let current = head
  let remaining = [...queue]

  let left = remaining.filter(req => req < head).sort((a,b) => a - b) // ascending
  let right = remaining.filter(req => req >= head).sort((a,b) => a - b) // ascending

  let runSequence = []
  if (direction === 'up') {
    runSequence = [...right, ...left]
  } else {
    // down
    left = remaining.filter(req => req < head).sort((a,b) => b - a)
    right = remaining.filter(req => req >= head).sort((a,b) => b - a)
    runSequence = [...left, ...right]
  }

  for (const next of runSequence) {
    remaining = remaining.filter(r => r !== next)
    
    steps.push({
      current,
      next,
      distance: Math.abs(next - current),
      queueRemaining: [...remaining],
      type: 'seek'
    })

    sequence.push(next)
    current = next
  }

  return {
    sequence,
    steps,
    metrics: computeMetrics(sequence, queue, 0)
  }
}
