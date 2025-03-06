import SparkMD5 from 'spark-md5'
import { FILE_SIZE_UNIT } from '@/constants/upload'

addEventListener('message', function (e) {
  getFileMd5(e.data)
})

function getFileMd5(file) {
  // 获取文件切分方法，兼容不同浏览器
  const blobSilce = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice
  // 按照10M的chunk进行切分
  const chunkSize = 10 * FILE_SIZE_UNIT * FILE_SIZE_UNIT
  // 获取切块的数量，向上取整
  const chunkNums = Math.ceil(file.raw.size / chunkSize)

  let currentChunk = 0
  // 获取SparkMD5实例
  const spark = new SparkMD5.ArrayBuffer()
  // 获取文件读取实例，用于分片读取MD5信息  使用切片是考虑到大文件切片处理会不容易出错  直接获取MD5可能会卡顿等
  const fileReader = new FileReader()
  // 获取文件分片后计算MD5
  fileReader.onload = function (e) {
    spark.append(e.target.result)
    currentChunk++
    if (currentChunk < chunkNums) {
      loadNext()
    } else {
      postMessage({
        type: 'success',
        message: {
          file,
          md5: spark.end(),
        },
      })
    }
  }
  // 文件分片解析失败后报错
  fileReader.onerror = function (e) {
    postMessage({
      type: 'error',
      message: e,
    })
  }

  function loadNext() {
    const start = currentChunk * chunkSize
    const end = start + chunkSize >= file.raw.size ? file.raw.size : start + chunkSize
    fileReader.readAsArrayBuffer(blobSilce.call(file.raw, start, end))
  }

  loadNext()
}
