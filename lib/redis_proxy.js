const BasicProxy = require('./basic_proxy')
const MultiCommand = require('./multi_command')

// redis事务代理类
class RedisProxy extends BasicProxy {
  constructor(hashring, redisConfig) {
    super(redisConfig)
    // 一致性哈希处理对象
    this.hashring = hashring
    // 事务处理redis服务器
    this.multis = {}
    // 需要执行的命令集合
    this.commands = []
    // 是否开启事务
    this.isMulti = false
  }

  /**
   * 存储待执行的redis事务命令
   * @param {*} server redis服务实例
   * @param {*} command redis命令
   * @param {*} args redis命令参数
   */
  _saveCommand(server, command, args) {
    this.commands.push(new MultiCommand(server, command, args))
  }

  /**
   * 处理redis服务实例的执行结果
   * @param {*} server redis服务实例
   * @param {*} replies 当前实例的执行结果集
   */
  _saveReplies(server, replies) {
    let saved = 0
    let len = replies.length
    replies = replies.reverse()
    for (let c of this.commands) {
      if (c.server === server) {
        const reply = replies.pop()
        c.setReply(reply === 'OK' ? server : reply)
        saved++
      }
    }
    return saved === len && replies.length === 0
  }

  /**
   * 获取所有的执行结果
   */
  _getAllReplies() {
    const replies = []
    this.commands.forEach((k, v) => {
      replies[v] = k.reply
    })
    return replies
  }

  /**
   * 根据传入的redis服务器对象，返回redis服务的事务实例
   * @param {*} server redis服务器对象
   */
  async _getMulti(server) {
    // 如果当前事务实例中已经存在该redis服务则直接返回该实例
    if (this.multis[server]) {
      return this.multis[server]
    } else if (this.clients[server]) {
      this.multis[server] = this.clients[server].multi()
      return this.multis[server]
    }
    // 创建redis客户端
    const client = await this.createClient(server)
    // 存储客户端
    this.clients[server] = client
    // 获取该客户端的事务处理实例
    this.multis[server] = client.multi()
    // 返回事务实例
    return this.multis[server]
  }

  /**
   * 执行redis命令
   * @param {*} callee redis 命令
   * @param {*} args redis 命令参数
   */
  async call(callee, args) {
    // exec
    if (callee === 'exec') throw new TypeError(`请使用execAsync命令处理事务,multi.${callee} is not a function, use multi.execAsync instead.`)
    // discard
    if (callee === 'discardAsync' || callee === 'discard') throw new Error('客户端分片Redis集群不支持命令关闭连接.')
    // 开启事务
    if (callee === 'multi') {
      this.isMulti = true;
      this.logHandle(`start multi OK`)
      return 'OK'
    }
    // 事务校验
    if (callee === 'execAsync' && !this.isMulti) throw new TypeError(`提交事务请先使用multi命令开启事务.`)
    if (callee === 'execAsync' && this.multis.length === 0) throw new TypeError(`提交事务请先添加需要执行的Redis命令.`)
    if (callee === 'execAsync') return await this._commitMultiCommand()
    else if (!this.isMulti) return await this._execClientCommand(callee, args)
    else if (this.isMulti) return await this._execMultiCommand(callee, args)
  }

  async _execMultiCommand(callee, args) {
    let server;
    try {
      // 根据传入Key参数使用一致性哈希算法获取redis服务对象
      server = this.hashring.get(args[0])
      // 获取redis服务的事务实例
      const multi = await this._getMulti(server)
      // 保存需要提交的事务命令
      this._saveCommand(server, callee, args)
      // 执行事务命令
      return multi[`${callee}`].apply(multi, args)
    } catch (error) {
      this._handleError(error, server, callee, args)
    }
  }

  async _execClientCommand(callee, args) {
    let server;
    try {
      server = this.hashring.get(args[0])
      let client;
      if (this.clients[server]) {
        client = this.clients[server]
      } else {
        client = await this.createClient(server)
        this.clients[server] = client
      }
      const reply = await client[`${callee}Async`].apply(client, args)
      this.logHandle(`reply by ${server} =>`, reply)
      return reply === 'OK' ? server : reply
    } catch (error) {
      this._handleError(error, server, callee, args)
    }
  }

  async _commitMultiCommand() {
    try {
      const p = []
      // 遍历所有事务实例进行事务提交
      for (let server in this.multis) {
        p.push(this.multis[server].execAsync().then(replies => {
          // 处理事务提交结果，并将结果更新到对应的command的结果属性中
          this.logHandle(`reply by ${server} =>`, replies)
          return this._saveReplies(server, replies)
        }))
      }
      // 获取提交结果
      await Promise.all(p)
      // 返回事务提交结果
      const reData = this._getAllReplies()
      // 清空事务数据
      this._clear()
      return reData
    } catch (error) {
      const servers = [];
      const args = [];
      for (let command in this.commands) {
        servers.push(command.server)
        args.push(command.args.join(':'))
      }
      // 清空事务数据
      this._clear()
      this._handleError(error, servers.join(','), 'execAsync', args.join(','))
    }
  }

  _handleError(e, server, callee, args) {
    const logText = `
      redis执行错误:
      服务器地址:${server}
      执行命令:${callee}
      参数:${JSON.stringify(args)}
      错误描述:${e.message}
    `;

    console.log('1');
    
    this.logHandle(logText)
    throw new TypeError(logText)
  }

  _clear() {
    this.multis = {}
    this.commands = []
    this.isMulti = false
  }
}

module.exports = RedisProxy