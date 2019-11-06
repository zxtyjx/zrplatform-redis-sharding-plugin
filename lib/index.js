const HashRing = require('hashring')
const redis = require('redis')
const RedisProxy = require('./redis_proxy')

const shardingDefaultOptions = {
}

class Sharding {
  constructor(servers) {
    this.redisConfig = {}
    this.options = shardingDefaultOptions
    const hashringConfig = {}
    for (let config of servers) {
      // 拆分哈希配置和redis配置
      const { weight, vnodes, ...redisoptions } = config;
      const hostKey = `${redisoptions.host}:${redisoptions.port}`
      if (!hashringConfig[hostKey]) {
        hashringConfig[hostKey] = {
          weight, vnodes
        }
      }
      if (!this.redisConfig[hostKey]) {
        this.redisConfig[hostKey] = redisoptions
      }
    }
    this.hashring = new HashRing(hashringConfig)
  }

  get defaults() {
    return this.options
  }

  set defaults(options) {
    this.options = Object.assign({}, shardingDefaultOptions, options)
  }

  _getRedisMethods(obj) {
    const methods = []
    for (let i in obj) {
      if (obj.hasOwnProperty(i) && typeof obj[i] === 'function') {
        methods.push(i)
      }
    }
    return methods
  }

  _extend(proxy, suffix) {
    const methods = this._getRedisMethods(redis.Multi.prototype)
    for (let i of methods) {
      proxy[`${i}${suffix}`] = function () {
        return proxy.call(i, arguments)
      }
    }

    return proxy
  }

  getProxy() {
    const client = new RedisProxy(this.hashring, this.redisConfig)
    return this._extend(client, '')
  }

  getServer(key) {
    return this.hashring.get(key)
  }
}

module.exports = Sharding