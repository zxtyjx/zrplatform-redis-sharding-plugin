/*
 * @Descripttion: 
 * @version: 
 * @Author: zhaoxiang
 * @Date: 2019-11-14 09:45:18
 * @LastEditors  : zhaoxiang
 * @LastEditTime : 2019-12-27 10:36:01
 */
const RedisSharding = require('../lib')

const redisSharding = new RedisSharding(
  JSON.parse("[{\"host\":\"192.168.175.12\",\"port\":13318},{\"host\":\"192.168.175.13\",\"port\":43102}]")
);

const client = redisSharding.getProxy()

async function test() {
  console.log(1);
  // await client.lpush('testlist', 'bar', '1')
  // console.log(1);
  // await client.lpush('testlist', 'bar2')
  // console.log(1);
  // await client.lrange('testlist', 0, 10)
  // console.log(1);
  await client.set('test1')
  // console.log(1);
  // await client.set('test2', 'bar2')
  // console.log(1);
  // await client.set('test3', 'bar2')
  // console.log(1);
  // await client.set('test4', 'bar2')
  // console.log(1);
  client.destroyAllClients();
}

test();