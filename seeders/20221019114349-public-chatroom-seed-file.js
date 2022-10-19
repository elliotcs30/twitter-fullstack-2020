'use strict'
const faker = require('faker')
const { User } = require('../models')
module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const chats = []
      // 建立隨機內容的對話
      for (let i = 0; i < 10; i++) {
        const user = await User.findAll({ where: { role: 'user' }, raw: true })
        const date = new Date(2022, 10, 19, Math.ceil(Math.random() * 3), Math.ceil(Math.random() * 60), 0)
        chats.push({
          user_id: user[Math.floor(i / 10)].id,
          content: faker.lorem.sentence(Math.floor(Math.random() * 11) + 5).slice(0, 140),
          created_at: date,
          updated_at: date
        })
      }
      await queryInterface.bulkInsert('Chatpublics', chats)
    } catch (error) {
      console.log(error)
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.bulkDelete('Chatpublics', {})
    } catch (error) {
      console.log(error)
    }
  }
}
