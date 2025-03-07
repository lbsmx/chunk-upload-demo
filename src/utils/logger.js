// src/utils/logger.js

/**
 * 日志工具类
 */
class Logger {
  constructor(container) {
    // 确保能获取到日志容器
    setTimeout(() => {
      // 初始化逻辑
      this.container = document.querySelector(container)
    }, 1000)
  }

  /**
   * 格式化时间为 HH:MM:SS 格式
   * @param {Date} date - 日期对象
   * @returns {string} 格式化后的时间字符串
   */
  formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${hours}:${minutes}:${seconds}`
  }

  /**
   * 输出日志，包含时间戳前缀
   * @param {string} message - 日志消息
   */
  log(message) {
    const timestamp = this.formatTime(new Date())
    this.container.innerHTML += `<p>[${timestamp}] ${message}</p>`
  }

  /**
   * 输出错误日志，包含时间戳前缀
   * @param {string} message - 错误消息
   */
  error(message) {
    const timestamp = this.formatTime(new Date())
    this.container.innerHTML += `<p style="color: red;">[${timestamp}] ${message}</p>`
  }

  /**
   * 输出警告日志，包含时间戳前缀
   * @param {string} message - 警告消息
   */
  warn(message) {
    const timestamp = this.formatTime(new Date())
    this.container.innerHTML += `<p style="color: orange;">[${timestamp}] ${message}</p>`
  }

  /**
   * 输出信息日志，包含时间戳前缀
   * @param {string} message - 信息消息
   */
  info(message) {
    const timestamp = this.formatTime(new Date())
    this.container.innerHTML += `<p style="color: blue;">[${timestamp}] ${message}</p>`
  }
}

// 创建 Logger 实例
const logger = new Logger('.log-output')

export default logger
