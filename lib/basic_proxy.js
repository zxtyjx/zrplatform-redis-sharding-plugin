const redis = require('redis')
const bluebird = require('bluebird')

const LOG_LOABEL = '[REDIS SHARDING]'
const DISABLE_LOGGING = false
const NODE_EMV = process.env.NODE_EMV

bluebird.promisifyAll(redis.RedisClient.prototype)
bluebird.promisifyAll(redis.Multi.prototype)

// redis代理基类
class BasicProxy {
  constructor(redisConfig) {
    // redis连接客户端
    this.clients = {}
    // redis客户端配置
    this.redisConfig = redisConfig
  }

  /**
   * 日志处理
   */
  logHandle() {
    if (DISABLE_LOGGING) return

    arguments[0] = `${LOG_LOABEL} ${(arguments[0] || '')}`;
    if (NODE_EMV !== 'production') {
      console.log.apply(this, arguments)
    }
  }

  /**
   * 创建客户端
   * @param {*} server 
   */
  createClient(server) {
    return new Promise((resolve, reject) => {
      const redisConfig = this.redisConfig[server] || {}
      const client = redis.createClient(`redis://${server}`, redisConfig)
      client.on('connect', () => {
        this.logHandle(`连接服务器成功:${server}.`)
        resolve(client)
      })
      client.on('error', e => {
        this.logHandle(`连接服务器失败:${server},错误信息:${e}.`)
        reject(e)
      })
    })
  }

  /**
 * 关闭所有客户端的连接
 */
  destroyAllClients() {
    for (let server in this.clients) {
      try {
        this.clients[server].quit()
        this.logHandle(`退出客户端连接成功:${server}.`)
      } catch (e) {
        this.logHandle(`退出客户端连接失败:${server},错误信息:${e}.`)
      }
    }
  }
}

module.exports = BasicProxy