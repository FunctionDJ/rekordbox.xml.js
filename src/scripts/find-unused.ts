import { Track } from "../rekordbox/core/track";
import { asyncFilter, limitText } from "../rekordbox/misc/lib";
import { RXScript } from "../shared";

interface Bundle {
	foundDupe: Track;
	track: Track;
}

const trackHasUsefulStuff = (track: Track) =>
	track.getCues().getHotCues().length > 0 || track.comments.match(/\/\*.*\*\//);

export const script: RXScript = {
	returnsLibrary: false,
	run: async (lib) => {
		const missingTracks = await asyncFilter(lib.getTracks(), (track) =>
			track.missingFromDisk()
		);
		const missingTracksWithUsefulStuff =
			missingTracks.filter(trackHasUsefulStuff);

		const bundles = missingTracksWithUsefulStuff.reduce<Bundle[]>(
			(prev, track) => {
				const foundDupe = lib
					.getTracks()
					.find(
						(checkingTrack) =>
							checkingTrack.album === track.album &&
							checkingTrack.toString({ long: true }) ===
								track.toString({ long: true }) &&
							checkingTrack.getFileExtension().toLowerCase() ===
								track.getFileExtension().toLowerCase() &&
							checkingTrack.label === track.label &&
							checkingTrack.mix === track.mix &&
							checkingTrack.size === track.size &&
							!checkingTrack.equals(track)
					);

				if (foundDupe === undefined) {
					return prev;
				}

				if (trackHasUsefulStuff(foundDupe)) {
					return [
						...prev,
						{
							foundDupe,
							track,
						},
					];
				}

				return prev;

				// foundDupe.setCues(track.getCues());
				// foundDupe.setBeatgrid(track.getBeatgrid());
				// foundDupe.comments = track.comments;
			},
			[]
		);

		console.table(
			bundles.map((b) => ({
				"name": limitText(b.foundDupe.toString(), 40),
				"#HC": b.foundDupe.getCues().getHotCues().length,
				"comment": b.foundDupe.comments,
				"#pl [match]": b.foundDupe.getPlaylists().length,
				"#pl [miss]": b.track.getPlaylists().length,
			}))
		);
	},
};
