export function euclideanDistance(a: number[], b: number[]) {
  if (a.length !== b.length) {
    throw new Error("Descriptor lengths do not match");
  }

  let sum = 0;

  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}

export function averageDistance(
  candidate: number[],
  samples: number[][]
): number {
  if (samples.length === 0) {
    return Infinity;
  }

  const distances = samples.map((sample) => euclideanDistance(candidate, sample));
  return Math.min(...distances);
}