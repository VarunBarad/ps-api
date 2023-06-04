const express = require('express');
const app = express();
const port = 3000;

app.get('/v1/events', (request, response) => {
	const queryOffset = request.query.offset || null;

	response.json({
		events: [],
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
