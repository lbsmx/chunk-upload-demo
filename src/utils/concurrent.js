/**
 * 实现一个并发池类
 * 在同一时间内仅支持指定数量的异步任务执行
 * 同时支持在实例外部对异步任务进行成功/失败处理
 */
class ConcurrentPool {
  constructor(size) {
    this.size = size
    this.pool = []
    this.runningNum = 0
  }

  /**
   * 实现add方法
   */
  add(task) {
    return new Promise((resolve, reject) => {
      this.pool.push({
        task,
        resolve,
        reject,
      })
      this.run()
    })
  }

  /**
   * 实现run方法
   */
  run() {
    // 当运行池数量大于最大限制时或者pool数量为空时return
    if (this.runningNum >= this.size || this.pool.length === 0) return

    const { task, resolve, reject } = this.pool.shift()
    this.runningNum++
    task()
      .then(resolve)
      .catch(reject)
      .finally(() => {
        this.runningNum--
        this.run()
      })
  }
}

export default ConcurrentPool
