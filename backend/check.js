const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('postgres://postgres:postgres@localhost:5432/nutrivisionai', {dialect: 'postgres', logging: false});
sequelize.query('SELECT id, name, height, weight FROM "Users"').then(res => { console.log(res[0]); process.exit(0); }).catch(console.error);
