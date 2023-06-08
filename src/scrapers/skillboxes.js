const fetch = require('node-fetch-commonjs');
const eventsDao = require('../database/events');

const SOURCE = 'skillboxes';

const fetchEvents = async () => {
	const apiEvents = [];

	let resultsPage = 1;
	let hasMoreResults = true;
	while (hasMoreResults) {
		const response = await fetch(
			'https://www.skillboxes.com/servers/v1/api/event-new/get-event',
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					opcode: 'search',
					page: resultsPage,
					city: 9,
					default_city: 9,
				}),
			},
		);
		const json = await response.json();

		apiEvents.push(...json.items);
		resultsPage++;
		hasMoreResults = json.next;
	}

	const psEvents = apiEvents.map((event) => convertEvent(event));

	const storedEvents = await eventsDao.getAllBySource(SOURCE);
	const storedEventsBacklinks = storedEvents.map((event) => event.backlink);

	return psEvents.filter((event) => {
		return !storedEventsBacklinks.includes(event.backlink);
	});
};

const update = async () => {
	const events = await fetchEvents();

	for (const event of events) {
		await eventsDao.insert(event);
	}

	console.log(`Inserted ${events.length} events from ${SOURCE}.`);
};

const monthNameToNumber = (monthName) => {
	switch (monthName.toLowerCase().slice(0, 3)) {
		case 'jan':
			return '01';
		case 'feb':
			return '02';
		case 'mar':
			return '03';
		case 'apr':
			return '04';
		case 'may':
			return '05';
		case 'jun':
			return '06';
		case 'jul':
			return '07';
		case 'aug':
			return '08';
		case 'sep':
			return '09';
		case 'oct':
			return '10';
		case 'nov':
			return '11';
		case 'dec':
			return '12';
	}
};

const parseDates = (apiEvent) => {
	if (/^\d+\w* \w+,? \d+$/.test(apiEvent.event_date)) {
		// has no end date
		const dateParts = apiEvent.event_date.split(/\s+/);
		const dayNumber = parseInt(dateParts[0].replaceAll(/\D/g));
		const monthString = dateParts[1].toLowerCase().slice(0, 3);
		const yearNumber = parseInt(dateParts[2]);

		const year = yearNumber.toString().padStart(4, '0');
		const month = monthNameToNumber(monthString);
		const day = dayNumber.toString().padStart(2, '0');
		return {
			startDate: `${year}-${month}-${day}`,
			endDate: null,
		};
	} else if (/^\d+\w* \w+,? [-&] \d+\w* \w+ \d+$/.test(apiEvent.event_date)) {
		// has start and end date
		const dateParts = apiEvent.event_date.split(/\s+/);
		const dayStartNumber = parseInt(dateParts[0].replaceAll(/\D/g));
		const monthStartString = dateParts[1].toLowerCase().slice(0, 3);
		const dayEndNumber = parseInt(dateParts[3].replaceAll(/\D/g));
		const monthEndString = dateParts[4].toLowerCase().slice(0, 3);
		const yearNumber = parseInt(dateParts[5]);

		const year = yearNumber.toString().padStart(4, '0');
		const monthStart = monthNameToNumber(monthStartString);
		const dayStart = dayStartNumber.toString().padStart(2, '0');
		const monthEnd = monthNameToNumber(monthEndString);
		const dayEnd = dayEndNumber.toString().padStart(2, '0');
		return {
			startDate: `${year}-${monthStart}-${dayStart}`,
			endDate: `${year}-${monthEnd}-${dayEnd}`,
		};
	} else {
		return {
			startDate: null,
			endDate: null,
		};
	}
};

const parseTimes = (apiEvent) => {
	if (/^\d\d:\d\d [AP]M$/.test(apiEvent.event_time)) {
		const timeHours = parseInt(
			apiEvent.event_time.split(/\s+/)[0].split(':')[0],
		);
		const timeMinutes = parseInt(
			apiEvent.event_time.split(/\s+/)[0].split(':')[1],
		);
		const timePeriod = apiEvent.event_time.split(/\s+/)[1];

		const hourNumber = timePeriod === 'AM' ? timeHours : timeHours + 12;
		const hour = hourNumber.toString().padStart(2, '0');
		const minute = timeMinutes.toString().padStart(2, '0');

		return {
			startTime: `${hour}:${minute}`,
			endTime: null,
		};
	} else {
		return {
			startTime: null,
			endTime: null,
		};
	}
};

const parsePrice = (apiEvent) => {
	const currency = apiEvent.converted_min_price_data.currency;

	if (currency === 'INR') {
		const amountMin = apiEvent.converted_min_price_data.converted_amount;
		const amountMax = apiEvent.converted_max_price_data.converted_amount;

		if (amountMin === amountMax) {
			return amountMin;
		} else {
			return `${amountMax} - ${amountMin}`;
		}
	} else {
		const amountMin = apiEvent.converted_min_price_data.converted_amount;
		const amountMax = apiEvent.converted_max_price_data.converted_amount;

		const currencySymbol = apiEvent.converted_min_price_data.currency_symbol;
		if (amountMin === amountMax) {
			return `${currencySymbol} ${amountMin}`;
		} else {
			return `${currencySymbol} ${amountMax} - ${amountMin}`;
		}
	}
};

const convertEvent = (apiEvent) => {
	const dates = parseDates(apiEvent);
	const times = parseTimes(apiEvent);

	return {
		source: 'skillboxes',
		start_date: dates.startDate,
		start_time: times.startTime,
		end_date: dates.endDate,
		end_time: times.endTime,
		name: apiEvent.event_name,
		backlink: `https://www.skillboxes.com/events/${apiEvent.slug}`,
		location: `${apiEvent.venue_name}, ${apiEvent.venue_address}`,
		price: parsePrice(apiEvent),
		genre: [apiEvent.category.toLowerCase()],
	};
};

module.exports = {
	source: SOURCE,
	update,
};
