const database = require('./index.js').database;

const getByLimitAndOffset = async (limit, offset) => {
	// language=PostgreSQL
	return database.any(
		'select id, source, start_date, start_time, end_date, end_time, name, backlink, location, price, genre ' +
			'from events ' +
			'order by start_date desc, name, source ' +
			'limit ${limit} ' +
			'offset ${offset}',
		{
			limit: limit,
			offset: offset,
		},
	);
};

const getAllBySource = async (source) => {
	// language=PostgreSQL
	return database.any(
		'select id, source, start_date, start_time, end_date, end_time, name, backlink, location, price, genre ' +
			'from events ' +
			'where source = ${source} ' +
			'order by start_date desc, name, source',
		{
			source: source,
		},
	);
};

const insert = async (event) => {
	// language=PostgreSQL
	return database.none(
		`
        insert into events (source, start_date, start_time, end_date, end_time, name, backlink, location, price, genre)
        values ($(source), $(start_date), $(start_time), $(end_date), $(end_time), $(name),
                $(backlink), $(location), $(price), $(genre))
		`,
		event,
	);
};

module.exports = {
	getByLimitAndOffset,
	getAllBySource,
	insert,
};
