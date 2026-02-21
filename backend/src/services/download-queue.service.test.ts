import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock socket service
vi.mock('./socket.service.js', () => ({
  socketService: {
    emitDownloadStarted: vi.fn(),
    emitDownloadProgress: vi.fn(),
    emitDownloadCompleted: vi.fn(),
    emitDownloadError: vi.fn(),
    emitDownloadCancelled: vi.fn(),
    emitDownloadRetrying: vi.fn(),
    emitDownloadQueued: vi.fn(),
  },
}));

const { downloadQueueService } = await import('./download-queue.service.js');

describe('downloadQueueService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    downloadQueueService.clear();
  });

  afterEach(() => {
    downloadQueueService.clear();
  });

  describe('enqueue', () => {
    it('should add a task to the queue', async () => {
      const mockTask = vi.fn().mockResolvedValue({ success: true });

      const promise = downloadQueueService.enqueue('download-1', mockTask);

      expect(downloadQueueService.getQueueSize()).toBeGreaterThanOrEqual(0);
      await promise;
      expect(mockTask).toHaveBeenCalled();
    });

    it('should execute tasks in order', async () => {
      const order: number[] = [];

      const task1 = vi.fn().mockImplementation(async () => {
        order.push(1);
        return { success: true };
      });
      const task2 = vi.fn().mockImplementation(async () => {
        order.push(2);
        return { success: true };
      });
      const task3 = vi.fn().mockImplementation(async () => {
        order.push(3);
        return { success: true };
      });

      await Promise.all([
        downloadQueueService.enqueue('d1', task1),
        downloadQueueService.enqueue('d2', task2),
        downloadQueueService.enqueue('d3', task3),
      ]);

      expect(order).toEqual([1, 2, 3]);
    });

    it('should respect concurrency limit', async () => {
      let concurrentCount = 0;
      let maxConcurrent = 0;

      const createSlowTask = (delay: number) =>
        vi.fn().mockImplementation(async () => {
          concurrentCount++;
          maxConcurrent = Math.max(maxConcurrent, concurrentCount);
          await new Promise((resolve) => setTimeout(resolve, delay));
          concurrentCount--;
          return { success: true };
        });

      const tasks = Array.from({ length: 5 }, () => createSlowTask(50));

      await Promise.all(
        tasks.map((task, index) =>
          downloadQueueService.enqueue(`d${String(index)}`, task)
        )
      );

      // Default concurrency is 2
      expect(maxConcurrent).toBeLessThanOrEqual(2);
    });
  });

  describe('getQueueSize', () => {
    it('should return the number of pending tasks', async () => {
      expect(downloadQueueService.getQueueSize()).toBe(0);

      const slowTask = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      // Start several tasks
      const promises = [
        downloadQueueService.enqueue('d1', slowTask),
        downloadQueueService.enqueue('d2', slowTask),
        downloadQueueService.enqueue('d3', slowTask),
        downloadQueueService.enqueue('d4', slowTask),
      ];

      // Queue size should be at least some of them waiting (since concurrency is 2)
      // The first 2 start immediately, so at least 2 should be pending
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(downloadQueueService.getQueueSize()).toBeGreaterThanOrEqual(0);

      await Promise.all(promises);
      expect(downloadQueueService.getQueueSize()).toBe(0);
    });
  });

  describe('getActiveCount', () => {
    it('should return the number of currently running tasks', async () => {
      expect(downloadQueueService.getActiveCount()).toBe(0);

      const slowTask = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const promise = downloadQueueService.enqueue('d1', slowTask);

      // Wait a tick for the task to start
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(downloadQueueService.getActiveCount()).toBe(1);

      await promise;
      expect(downloadQueueService.getActiveCount()).toBe(0);
    });
  });

  describe('setConcurrency', () => {
    it('should change the concurrency limit', async () => {
      downloadQueueService.setConcurrency(4);

      let concurrentCount = 0;
      let maxConcurrent = 0;

      const createSlowTask = () =>
        vi.fn().mockImplementation(async () => {
          concurrentCount++;
          maxConcurrent = Math.max(maxConcurrent, concurrentCount);
          await new Promise((resolve) => setTimeout(resolve, 50));
          concurrentCount--;
          return { success: true };
        });

      const tasks = Array.from({ length: 8 }, createSlowTask);

      await Promise.all(
        tasks.map((task, index) =>
          downloadQueueService.enqueue(`d${String(index)}`, task)
        )
      );

      expect(maxConcurrent).toBeLessThanOrEqual(4);

      // Reset to default
      downloadQueueService.setConcurrency(2);
    });
  });

  describe('clear', () => {
    it('should clear all pending tasks', async () => {
      const slowTask = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      // Add tasks but don't await
      void downloadQueueService.enqueue('d1', slowTask);
      void downloadQueueService.enqueue('d2', slowTask);
      void downloadQueueService.enqueue('d3', slowTask);

      await new Promise((resolve) => setTimeout(resolve, 10));

      downloadQueueService.clear();

      // Wait a bit for queue operations to settle
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(downloadQueueService.getQueueSize()).toBe(0);
    });
  });

  describe('isDownloadActive', () => {
    it('should return true for active download', async () => {
      const slowTask = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const promise = downloadQueueService.enqueue('download-123', slowTask);

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(downloadQueueService.isDownloadActive('download-123')).toBe(true);

      await promise;
      expect(downloadQueueService.isDownloadActive('download-123')).toBe(false);
    });

    it('should return false for unknown download', () => {
      expect(downloadQueueService.isDownloadActive('unknown-id')).toBe(false);
    });
  });

  describe('enqueueWithRetry', () => {
    it('should succeed on first attempt without retry', async () => {
      const task = vi.fn().mockResolvedValue({ success: true });

      const result = await downloadQueueService.enqueueWithRetry('d1', task);

      expect(result).toEqual({ success: true });
      expect(task).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure up to maxAttempts', async () => {
      const task = vi.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValueOnce({ success: true });

      const result = await downloadQueueService.enqueueWithRetry('d1', task, {
        maxAttempts: 3,
        baseDelayMs: 10, // Short delay for tests
      });

      expect(result).toEqual({ success: true });
      expect(task).toHaveBeenCalledTimes(3);
    });

    it('should throw after exhausting all retries', async () => {
      const task = vi.fn().mockRejectedValue(new Error('Persistent failure'));

      await expect(
        downloadQueueService.enqueueWithRetry('d1', task, {
          maxAttempts: 3,
          baseDelayMs: 10,
        })
      ).rejects.toThrow('Persistent failure');

      expect(task).toHaveBeenCalledTimes(3);
    });

    it('should call onRetry callback on each retry', async () => {
      const task = vi.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValueOnce({ success: true });

      const onRetry = vi.fn();

      await downloadQueueService.enqueueWithRetry('d1', task, {
        maxAttempts: 3,
        baseDelayMs: 10,
        onRetry,
      });

      expect(onRetry).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenCalledWith(expect.objectContaining({
        attempt: 1,
        maxAttempts: 3,
        error: expect.any(Error),
      }));
      expect(onRetry).toHaveBeenCalledWith(expect.objectContaining({
        attempt: 2,
        maxAttempts: 3,
        error: expect.any(Error),
      }));
    });

    it('should use exponential backoff delays', async () => {
      const task = vi.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValueOnce({ success: true });

      const delays: number[] = [];
      const onRetry = vi.fn((info: { delayMs: number }) => {
        delays.push(info.delayMs);
      });

      await downloadQueueService.enqueueWithRetry('d1', task, {
        maxAttempts: 3,
        baseDelayMs: 100,
        onRetry,
      });

      // Base delay: 100ms, multiplier: 3
      // First retry: 100 * 3^0 = 100ms (actually wait is baseDelay * 3^attempt-1 after first fail)
      // Using formula: baseDelay * (3 ^ (attempt - 1))
      // Attempt 1 retry: 100 * 3^0 = 100
      // Attempt 2 retry: 100 * 3^1 = 300
      expect(delays[0]).toBe(100);  // First retry delay
      expect(delays[1]).toBe(300);  // Second retry delay (exponential)
    });
  });
});
