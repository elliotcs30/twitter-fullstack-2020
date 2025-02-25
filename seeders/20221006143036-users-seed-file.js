'use strict'
const bcrypt = require('bcryptjs')
const faker = require('faker')
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const userSeed = Array.from({ length: 5 }).map((_, i) => ({
      name: `user${i + 1}`,
      email: `user${i + 1}@example.com`,
      password: bcrypt.hashSync('12345678', bcrypt.genSaltSync(10), null),
      account: `user${i + 1}`,
      avatar: `https://loremflickr.com/150/150/cat/?lock=${i}`,
      cover: `https://loremflickr.com/630/200/landscape/?lock=${i}`,
      introduction: faker.lorem.text().substring(0, 140),
      role: 'user',
      created_at: new Date(),
      updated_at: new Date()
    }))
    await queryInterface.bulkInsert('Users', [{
      name: 'root',
      email: 'root@example.com',
      password: await bcrypt.hashSync('12345678', bcrypt.genSaltSync(10), null),
      account: 'root',
      role: 'admin',
      created_at: new Date(),
      updated_at: new Date()
    }, ...userSeed], {})
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', null, {})
  }
}
