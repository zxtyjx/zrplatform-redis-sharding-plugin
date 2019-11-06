# ZRPlatform-Redis-Sharding-Plugin
为zrplatform提供redis客户端分片插件


### 使用示例:

**1、引用**:

```ts
import RedisSharding from 'zrplatform-redis-sharding-plugin';
const sharding = new Sharding(
  [
    { host: '127.0.0.1', port: '16379' ,password: 'masterkey1234'},
    { host: '127.0.0.1', port: '16380' ,password: 'masterkey123'},
  ]
)

const client = sharding.getProxy();

````

**2、使用**:

```ts
  await client.set('a1', 'foo1')
  await client.set('b1', 'foo2')
  await client.set('c1', 'foo3')
  await client.set('d1', 'foo4')

  await client.get('a1')
  await client.get('b1')
  await client.get('c1')
  await client.get('d1')
```

**3、事务使用**:
  >由于Redis事务不支持回滚,只支持放弃当前事务命令，所以客户端分片插件虽然提供了事务功能，但是不建议在较重场景下使用，仅作为参考。

```ts
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
```

**3、关闭所有客户端连接**:

```ts
  client.destroyAllClients();
```