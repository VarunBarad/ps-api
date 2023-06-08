const cron = require('node-cron');
const scrappers = {
	skillboxes: require('./skillboxes'),
};

const updateSource = async (source) => {
	try {
		await source.update();
	} catch (error) {
		console.error(`Error in ${source.source} source: ${error}`);
	}
};

const startUpdates = () => {
	cron.schedule('0 * * * *', async () => {
		for (const source of Object.values(scrappers)) {
			await updateSource(source);
		}
	});
};

module.exports = {
	startUpdates,
};
