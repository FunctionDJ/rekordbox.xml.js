import { log, logSuccess, logTime, logWarn } from "../logging";
import { Track } from "../rekordbox/core/track";
import { measure, partition } from "../rekordbox/misc/helpers";
import { RXScript } from "../shared";

log("Loading...");

export const script: RXScript = {
	returnsLibrary: true,
	run: async library => {
		log("Scanning...");

		const [scanTime, [withPos, withoutPos]] = await measure(async () => {
			const removals: Track[] = [];

			for (const track of library.getTracks()) {
				if (track.getPlaylistsReport().length === 0) {
					removals.push(track);
				}
			}

			return partition(removals, t => t.getCues().hasHotCues());
		});

		logTime(`Scan: ${scanTime}ms\n`);

		if (withPos.length === 0) {
			logSuccess("No missing tracks with cues");
		} else {
			logWarn("Missing tracks with cues:");
			withPos.forEach(t => {
				logWarn(t.toString());
			});
		}

		console.log(); // Linebreak

		logSuccess(`Deletable: ${withoutPos.length} tracks\n`);

		library.createPlaylist("clean", withoutPos);
		return library;
	}
};
