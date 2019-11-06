const RedisSharding = require('../lib')

const redisSharding = new RedisSharding(
  ['127.0.0.1:16379', '127.0.0.1:16380']
);

const client = redisSharding.getClient()

async function test() {
  console.log(1);
  await client.lpush('testlist', 'bar')
  console.log(1);
  await client.lpush('testlist', 'bar2')
  console.log(1);
  await client.lrange('testlist', 0, 10)
  console.log(1);
  await client.set('test1', 'bar2')
  console.log(1);
  await client.set('test2', 'bar2')
  console.log(1);
  await client.set('test3', 'bar2')
  console.log(1);
  await client.set('test4', 'bar2')
  console.log(1);
  client.destroyAllClients();
}

test();