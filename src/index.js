require('dotenv').config();

const express = require('express');
const cors = require('cors');
const eventsDao = require('./database/events');

const app = express();
const port = 3000;

app.use(cors());

app.get('/', (request, response) => {
	response.sendStatus(200);
});

app.get('/v1/events', async (request, response) => {
	const queryOffset = request.query.offset || 0;
	const queryLimit = request.query.limit || 100;

	const events = await eventsDao.getByLimitAndOffset(queryLimit, queryOffset);

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
			genre: event.genre ? event.genre : [],
		})),
		nextOffset: events.length > 0 ? queryOffset + events.length : null,
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
