import { RXScript } from "../shared";

export const script: RXScript = {
	returnsLibrary: true,
	run: async library => {
		for (const track of library.getTracks()) {
			const cues = track.getCues();

			const dropHotCue = cues.getHotCues().find(cue => cue.getLetter() === "E");
			const beatLength = track.getBeatgrid().getBeatLength();

			if (dropHotCue?.start === undefined || beatLength === null) {
				continue;
			}

			for (const offset of [-2, -1, 1, 2, 3]) {
				const memCueOffset = offset * 16 * beatLength;
				cues.createMemoryCue(dropHotCue.start + memCueOffset);
			}
		}

		return library;
	}
};
