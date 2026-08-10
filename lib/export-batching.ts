/**
 * Dynamic batch size calculation for export operations
 * Ensures meaningful progress updates and responsive cancellation
 */

export interface BatchConfig {
  batchSize: number;
  totalBatches: number;
}

/**
 * Calculate dynamic batch size based on total row count
 * - Small datasets (<= 1,000): single batch for efficiency
 * - Medium datasets (1,000 - 50,000): ~1,000-2,000 rows per batch for frequent checkpoints
 * - Large datasets (> 50,000): ~5,000-10,000 rows per batch to balance overhead
 */
export function calculateDynamicBatchSize(total: number): BatchConfig {
  if (total <= 1000) {
    // Single batch for tiny exports - no meaningful progress to show
    return {
      batchSize: total,
      totalBatches: 1
    };
  }

  if (total <= 50000) {
    // Medium datasets: aim for ~10-20 batches for smooth progress
    const targetBatches = Math.max(10, Math.min(20, Math.ceil(total / 1000)));
    const batchSize = Math.ceil(total / targetBatches);
    return {
      batchSize: Math.max(1000, Math.min(2000, batchSize)),
      totalBatches: targetBatches
    };
  }

  // Large datasets: aim for ~10-20 batches with larger chunks
  const targetBatches = Math.max(10, Math.min(20, Math.ceil(total / 5000)));
  const batchSize = Math.ceil(total / targetBatches);
  return {
    batchSize: Math.max(5000, Math.min(10000, batchSize)),
    totalBatches: targetBatches
  };
}
