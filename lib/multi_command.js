class MultiCommand {
  constructor(server, command, args) {
    this.server = server
    this.command = command
    this.args = args
    this.reply = undefined
  }

  setReply(reply) {
    this.reply = reply
  }
}

module.exports = MultiCommand