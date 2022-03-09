const nodeId3 = require('node-id3').Promise;
const path = require("path");
const {getXml} = require("../lib");

const fsFriendlify = something => something.replaceAll(/[\/\\]/g, ", ");

(async () => {
	const rbxXml = await getXml();
	const tracks = rbxXml.DJ_PLAYLISTS.COLLECTION[0].TRACK;

	for (const track of tracks.slice(0, 10)) {
		const location = track.$.Location;
		const [, filepath] = /^file:\/\/localhost\/(.+)$/.exec(location);
		const shouldLocation = decodeURIComponent(filepath);
		const {ext} = path.parse(shouldLocation);
		const id3 = await nodeId3.read(shouldLocation);

		const trackNumber = id3.trackNumber ? fsFriendlify(id3.trackNumber).padStart(2, "0") + " " : "";

		const fsFriendlyArtist = fsFriendlify(id3.artist);
		const friendlyAlbumArtist = fsFriendlify(id3.performerInfo);
		console.log(JSON.stringify(fsFriendlyArtist), " -> ", JSON.stringify(fsFriendlyArtist));

		const newShouldLocation = path.join(
			"D:", "Library", friendlyAlbumArtist,
			`${trackNumber}${fsFriendlyArtist} - ${id3.title}${ext}`
		);

		if (newShouldLocation !== shouldLocation) {
			console.log("New: " + newShouldLocation);
		}
	}
})();
