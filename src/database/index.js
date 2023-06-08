require('dotenv').config();

const pg = require('pg');

pg.types.setTypeParser(pg.types.builtins.DATE, (stringValue) => {
	return stringValue;
});

const db = require('pg-promise')()(process.env.DATABASE_URL);

module.exports = {
	database: db,
};
