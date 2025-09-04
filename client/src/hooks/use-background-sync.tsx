import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createGfpPlan, updateGfpPlan, type GfpPlan } from '@/lib/api';
import type { GfpCreate, GfpUpdate } from '@shared/schema';

interface QueuedOperation {
  id: string;
  type: 'create' | 'update';
  data: GfpCreate | (GfpUpdate & { planId: string });
  timestamp: number;
  retries: number;
}

const STORAGE_KEY = 'gfp-sync-queue';
const MAX_RETRIES = 3;

export function useBackgroundSync() {
  const [queue, setQueue] = useState<QueuedOperation[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const queryClient = useQueryClient();

  // Load queue from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedQueue = JSON.parse(stored);
        setQueue(parsedQueue);
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
    }
  }, []);

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }, [queue]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Process queue when coming back online
      processQueue();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Process the sync queue
  const processQueue = useCallback(async () => {
    if (!isOnline || isProcessing || queue.length === 0) {
      return;
    }

    setIsProcessing(true);

    try {
      const updatedQueue = [...queue];
      
      for (let i = 0; i < updatedQueue.length; i++) {
        const operation = updatedQueue[i];
        
        try {
          if (operation.type === 'create') {
            const result = await createGfpPlan(operation.data as GfpCreate);
            // Remove successful operation from queue
            updatedQueue.splice(i, 1);
            i--; // Adjust index since we removed an item
            
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['gfp-plans'] });
            
          } else if (operation.type === 'update') {
            const updateData = operation.data as GfpUpdate & { planId: string };
            const { planId, ...updatePayload } = updateData;
            const result = await updateGfpPlan(planId, updatePayload);
            
            // Remove successful operation from queue
            updatedQueue.splice(i, 1);
            i--; // Adjust index since we removed an item
            
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['gfp-plans'] });
          }
        } catch (error) {
          console.error('Failed to sync operation:', error);
          
          // Increment retry count
          operation.retries++;
          
          // Remove operation if max retries exceeded
          if (operation.retries >= MAX_RETRIES) {
            updatedQueue.splice(i, 1);
            i--; // Adjust index since we removed an item
            console.error('Max retries exceeded for operation:', operation);
          }
        }
      }
      
      setQueue(updatedQueue);
    } finally {
      setIsProcessing(false);
    }
  }, [isOnline, isProcessing, queue, queryClient]);

  // Add operation to queue
  const queueOperation = useCallback((
    type: 'create' | 'update',
    data: GfpCreate | (GfpUpdate & { planId: string })
  ) => {
    const operation: QueuedOperation = {
      id: `${type}-${Date.now()}-${Math.random()}`,
      type,
      data,
      timestamp: Date.now(),
      retries: 0,
    };

    setQueue(prev => [...prev, operation]);

    // Try to process immediately if online
    if (isOnline) {
      setTimeout(processQueue, 100);
    }

    return operation.id;
  }, [isOnline, processQueue]);

  // Queue a create operation
  const queueCreate = useCallback((data: GfpCreate) => {
    return queueOperation('create', data);
  }, [queueOperation]);

  // Queue an update operation
  const queueUpdate = useCallback((planId: string, data: GfpUpdate) => {
    return queueOperation('update', { ...data, planId });
  }, [queueOperation]);

  // Clear queue (useful for testing or manual cleanup)
  const clearQueue = useCallback(() => {
    setQueue([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Get queue status
  const getQueueStatus = useCallback(() => {
    return {
      pending: queue.length,
      processing: isProcessing,
      online: isOnline,
    };
  }, [queue.length, isProcessing, isOnline]);

  return {
    queueCreate,
    queueUpdate,
    clearQueue,
    getQueueStatus,
    isOnline,
    isProcessing,
    pendingOperations: queue.length,
  };
}