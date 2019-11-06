const RedisSharding = require('./lib')

async function init(options){
  if(!options){
    return {}
  }

  const redisSharding = new RedisSharding(options)
  return redisSharding.getProxy()
}

module.exports = init