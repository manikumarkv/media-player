import PQueue from 'p-queue';

/**
 * Download Queue Service
 *
 * Manages concurrent downloads using a queue system with configurable concurrency.
 * This prevents system overload when downloading playlists with many videos.
 */

// Default concurrency: 2 simultaneous downloads
const DEFAULT_CONCURRENCY = 2;

// Track active download IDs
const activeDownloads = new Set<string>();

// Create the queue with default concurrency
const queue = new PQueue({ concurrency: DEFAULT_CONCURRENCY });

export type DownloadTask<T = unknown> = () => Promise<T>;

export interface RetryOptions {
  /**
   * Maximum number of retry attempts (including the first attempt)
   * Default: 3
   */
  maxAttempts?: number;

  /**
   * Base delay in milliseconds for exponential backoff
   * Default: 5000 (5 seconds)
   */
  baseDelayMs?: number;

  /**
   * Callback fired before each retry attempt
   */
  onRetry?: (info: {
    attempt: number;
    maxAttempts: number;
    delayMs: number;
    error: Error;
  }) => void;
}

// Default retry settings
const DEFAULT_RETRY_OPTIONS: Required<Omit<RetryOptions, 'onRetry'>> = {
  maxAttempts: 3,
  baseDelayMs: 5000, // 5 seconds base, so: 5s -> 15s -> 45s
};

// Exponential backoff multiplier
const BACKOFF_MULTIPLIER = 3;

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const downloadQueueService = {
  /**
   * Add a download task to the queue
   * @param downloadId - Unique identifier for tracking the download
   * @param task - Async function that performs the download
   * @returns Promise that resolves when the download completes
   */
  async enqueue<T>(downloadId: string, task: DownloadTask<T>): Promise<T> {
    activeDownloads.add(downloadId);

    try {
      const result = await queue.add(async () => {
        return task();
      });
      return result as T;
    } finally {
      activeDownloads.delete(downloadId);
    }
  },

  /**
   * Get the number of tasks waiting in the queue
   */
  getQueueSize(): number {
    return queue.size;
  },

  /**
   * Get the number of currently running tasks
   */
  getActiveCount(): number {
    return queue.pending;
  },

  /**
   * Set the concurrency limit
   * @param concurrency - Maximum number of concurrent downloads
   */
  setConcurrency(concurrency: number): void {
    queue.concurrency = concurrency;
  },

  /**
   * Get the current concurrency limit
   */
  getConcurrency(): number {
    return queue.concurrency;
  },

  /**
   * Clear all pending tasks from the queue
   * Note: This does not cancel currently running tasks
   */
  clear(): void {
    queue.clear();
    activeDownloads.clear();
  },

  /**
   * Check if a specific download is currently active (running or queued)
   * @param downloadId - The download ID to check
   */
  isDownloadActive(downloadId: string): boolean {
    return activeDownloads.has(downloadId);
  },

  /**
   * Pause the queue (no new tasks will start)
   */
  pause(): void {
    queue.pause();
  },

  /**
   * Resume the queue
   */
  resume(): void {
    queue.start();
  },

  /**
   * Check if the queue is paused
   */
  isPaused(): boolean {
    return queue.isPaused;
  },

  /**
   * Wait for all tasks to complete
   */
  async onIdle(): Promise<void> {
    await queue.onIdle();
  },

  /**
   * Add a download task to the queue with automatic retry on failure
   * Uses exponential backoff: baseDelay * (3 ^ (attempt - 1))
   * Default delays: 5s -> 15s -> 45s
   *
   * @param downloadId - Unique identifier for tracking the download
   * @param task - Async function that performs the download
   * @param options - Retry configuration options
   * @returns Promise that resolves when the download succeeds or all retries are exhausted
   */
  async enqueueWithRetry<T>(
    downloadId: string,
    task: DownloadTask<T>,
    options?: RetryOptions
  ): Promise<T> {
    const maxAttempts = options?.maxAttempts ?? DEFAULT_RETRY_OPTIONS.maxAttempts;
    const baseDelayMs = options?.baseDelayMs ?? DEFAULT_RETRY_OPTIONS.baseDelayMs;
    const onRetry = options?.onRetry;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await this.enqueue(downloadId, task);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // If this was the last attempt, throw the error
        if (attempt >= maxAttempts) {
          throw lastError;
        }

        // Calculate delay with exponential backoff
        const delayMs = baseDelayMs * Math.pow(BACKOFF_MULTIPLIER, attempt - 1);

        // Call the retry callback if provided
        if (onRetry) {
          onRetry({
            attempt,
            maxAttempts,
            delayMs,
            error: lastError,
          });
        }

        // Wait before retrying
        await sleep(delayMs);
      }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError ?? new Error('Unknown error during download');
  },
};
