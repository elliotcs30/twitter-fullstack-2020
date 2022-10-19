'use strict'
module.exports = (sequelize, DataTypes) => {
  const Chatpublic = sequelize.define('Chatpublic', {
    User_id: DataTypes.INTEGER,
    content: DataTypes.STRING
  }, {
    underscored: true
  })
  Chatpublic.associate = function (models) {
    Chatpublic.belongsTo(models.User)
  }
  return Chatpublic
}
