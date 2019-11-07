const Sharding = require('../lib');

// const sharding = new Sharding({
//   '127.0.0.1:16379': { vnodes: 50, weight: 1 },
//   '127.0.0.1:16380': { vnodes: 50, weight: 100 }
// })

const sharding = new Sharding(
  [
    { host: '127.0.0.1', port: '16379' ,password: '***'},
    { host: '127.0.0.1', port: '16380' ,password: '***'},
  ]
)

const client = sharding.getProxy();

async function test() {
  await client.multi()
  await client.set('a1', 'foo1')
  await client.set('b1', 'foo2')
  await client.set('c1', 'foo3')
  await client.set('d1', 'foo4')

  await client.get('a1')
  await client.get('b1')
  await client.get('c1')
  await client.get('d1')

  const replies = await client.execAsync()
  console.log('replies', replies);


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

  await client.multi()
  await client.set('a', 'foo1')
  await client.set('b', 'foo2')
  await client.set('c', 'foo3')
  await client.set('d', 'foo4')

  await client.get('a')
  await client.get('b')
  await client.get('c')
  await client.get('d')

  const replies2 = await client.execAsync()
  console.log('replies2', replies2);
  client.destroyAllClients();
}

test();
