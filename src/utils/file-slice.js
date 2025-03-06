import SparkMD5 from 'spark-md5'

/**
 * 实现文件的切分上传
 * 同时支持重试机制
 * @param {*} file
 * @param {*} chunkSize
 */

export default function fileSlice(file, chunkSize, uploadFn, retry) {
  return new Promise((resolve, reject) => {
    // 获取文件切分方法，兼容不同浏览器
    const blobSilce = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice
    // 获取切块的数量，向上取整
    const chunkNums = Math.ceil(file.raw.size / chunkSize)

    let currentChunk = 0
    // 获取SparkMD5实例
    const spark = new SparkMD5.ArrayBuffer()
    // 获取文件读取实例，用于分片读取MD5信息  使用切片是考虑到大文件切片处理会不容易出错  直接获取MD5可能会卡顿等
    const fileReader = new FileReader()
    // 获取文件分片后计算MD5
    fileReader.onload = function (e) {
      // 清空arraybuffer
      spark.reset()
      spark.append(e.target.result)
      const currentChunkMd5 = spark.end()
      // 添加重试机制
      let retryTimes = retry
      async function handleUpload() {
        try {
          await uploadFn(e.target.result, currentChunkMd5)
          currentChunk++
          if (currentChunk < chunkNums) {
            loadNext()
          } else {
            file.status = 'success'
            const fileMd5List = JSON.parse(localStorage.getItem('fileMd5List')) || []
            localStorage.setItem('fileMd5List', JSON.stringify([...fileMd5List, file.md5]))
            // 触发resolve
            resolve()
          }
        } catch (error) {
          if (retryTimes > 0) {
            --retryTimes
            handleUpload()
          } else {
            // 注意！！！
            // 由于handleUpload函数用到了onload的函数参数，由此触发了闭包
            // 导致onload无法被正确销毁，因此要重置retryTimes
            retryTimes = retry
            file.status = 'error'
            // 当前分片上传失败后则不再上传后续分片
            reject(error)
          }
        }
      }
      handleUpload()
    }
    // 文件分片解析失败后报错
    fileReader.onerror = function (e) {
      console.log(e)
    }

    function loadNext() {
      const start = currentChunk * chunkSize
      const end = start + chunkSize >= file.raw.size ? file.raw.size : start + chunkSize
      fileReader.readAsArrayBuffer(blobSilce.call(file.raw, start, end))
    }

    loadNext()
  })
}
