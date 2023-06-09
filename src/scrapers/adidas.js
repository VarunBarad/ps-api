const fetch = require('node-fetch-commonjs');
const eventsDao = require('../database/events');

const SOURCE = 'adidas';

const fetchEvents = async () => {
	const response = await fetch(
		'https://adidasrunners.adidas.com/api/events?community=bengaluru',
		{
			method: 'GET',
			headers: { 'Content-Type': 'application/json' },
		},
	);
	const json = await response.json();
	const apiEvents = json.data;

	return apiEvents.map((event) => convertEvent(event));
};

const hasSameData = (event1, event2) => {
	return (
		event1.start_date === event2.start_date &&
		event1.start_time === event2.start_time &&
		event1.end_date === event2.end_date &&
		event1.end_time === event2.end_time &&
		event1.name === event2.name &&
		event1.backlink === event2.backlink &&
		event1.location === event2.location &&
		event1.price === event2.price &&
		checkArrayEquality(event1.genre, event2.genre)
	);
};

const checkArrayEquality = (array1, array2) => {
	if (array1.length !== array2.length) {
		return false;
	}

	for (const index in array1) {
		if (array1[index] !== array2[index]) {
			return false;
		}
	}

	return true;
};

const update = async () => {
	const fetchedEvents = await fetchEvents();

	const storedEvents = await eventsDao.getAllBySource(SOURCE);
	let countNewEvents = 0;
	let countUpdatedEvents = 0;
	for (const fetchedEvent of fetchedEvents) {
		const matchingStoredEvent = storedEvents.find((storedEvent) => {
			return storedEvent.backlink === fetchedEvent.backlink;
		});

		if (!matchingStoredEvent) {
			// store a new entry
			await eventsDao.insert(fetchedEvent);
			countNewEvents++;
		} else if (!hasSameData(fetchedEvent, matchingStoredEvent)) {
			// update the entry
			await eventsDao.update(matchingStoredEvent.id, fetchedEvent);
			countUpdatedEvents++;
		} else {
			// no need to process this event
		}
	}

	console.log(
		`Inserted ${countNewEvents} and Updated ${countUpdatedEvents} events from ${SOURCE}.`,
	);
};

const convertEvent = (apiEvent) => {
	return {
		source: SOURCE,
		start_date: apiEvent.date,
		start_time: apiEvent.timeStart,
		end_date: null,
		end_time: apiEvent.timeEnd,
		name: apiEvent.title,
		backlink: `https://adidasrunners.adidas.com/community/bengaluru/event/${apiEvent.slug}`,
		location: `${apiEvent.location.name} (${apiEvent.location.url})`,
		price: null,
		genre: [],
	};
};

module.exports = {
	source: SOURCE,
	update,
};
