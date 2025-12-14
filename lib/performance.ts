export interface PerformanceMetrics {
  operation: string
  startTime: number
  endTime?: number
  duration?: number
  metadata?: Record<string, unknown>
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []

  start(operation: string, metadata?: Record<string, unknown>): PerformanceMetrics {
    const metric: PerformanceMetrics = {
      operation,
      startTime: Date.now(),
      metadata,
    }
    this.metrics.push(metric)
    return metric
  }

  end(metric: PerformanceMetrics): void {
    metric.endTime = Date.now()
    metric.duration = metric.endTime - metric.startTime
  }

  getMetrics(): PerformanceMetrics[] {
    return this.metrics
  }

  getSummary(): Record<string, unknown> {
    const completed = this.metrics.filter((m) => m.duration !== undefined)
    const totalDuration = completed.reduce((sum, m) => sum + (m.duration || 0), 0)
    const avgDuration = completed.length > 0 ? totalDuration / completed.length : 0

    return {
      totalOperations: this.metrics.length,
      completedOperations: completed.length,
      totalDuration: `${(totalDuration / 1000).toFixed(2)}s`,
      avgDuration: `${(avgDuration / 1000).toFixed(2)}s`,
      operations: completed.map((m) => ({
        operation: m.operation,
        duration: `${((m.duration || 0) / 1000).toFixed(2)}s`,
        metadata: m.metadata,
      })),
    }
  }

  meetsTarget(targetMs: number): boolean {
    const completed = this.metrics.filter((m) => m.duration !== undefined)
    return completed.every((m) => (m.duration || 0) <= targetMs)
  }
}
