import { RXScript } from "../shared";

export const script: RXScript = {
	returnsLibrary: true,
	run: async (library) => {
		library
			.getTracks()
			.forEach((track) => track.getCues().cloneHotCuesToMemoryCues());
		return library;
	},
};
