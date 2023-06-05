require('dotenv').config();

const express = require('express');
const database = require('pg-promise')()(process.env.DATABASE_URL);

const app = express();
const port = 3000;

const pg = require('pg');
pg.types.setTypeParser(pg.types.builtins.DATE, (stringValue) => {
	return stringValue;
});

app.get('/', (request, response) => {
	response.sendStatus(200);
});

app.get('/v1/events', async (request, response) => {
	const queryOffset = request.query.offset || null;

	const events = await database.any('select * from events');

	response.json({
		events: events.map((event) => ({
			id: event.id,
			source: event.source,
			start: {
				date: event.start_date,
				time: event.start_time || null,
			},
			end: {
				date: event.end_date || null,
				time: event.end_time || null,
			},
			name: event.name,
			backlink: event.backlink,
			location: event.location,
			price: event.price,
			genre: event.genre.map((genre) => genre.toLowerCase()),
		})),
		nextOffset: null,
		previousOffset: queryOffset,
	});
});

// Handle 404
app.use((req, res, next) => {
	res.sendStatus(404);
});

app.listen(port, () => {
	console.log(`App running on port ${port}.`);
});
