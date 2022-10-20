
module.exports = io => {
  io.on('connection', socket => {
    console.log(`a user connected (id: ${socket.id})`)

    socket.on('public-message', message => {
      console.log(socket.id, ': ', message)
      io.emit('public-message', socket.id, message)
    })

    socket.on('private-message', (anotherSocketId, message) => {
      console.log(`${socket.id} PM ${anotherSocketId}: ${message}`)
      io.to(anotherSocketId).emit('private-message', anotherSocketId, message)
    })
  })
}
