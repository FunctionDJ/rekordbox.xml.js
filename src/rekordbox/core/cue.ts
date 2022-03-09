import { HotCue } from "./hotcue";
import { MemoryCue } from "./memorycue";

type CueType = "hotcue" | "memorycue";

export abstract class Cue {
	constructor (
		private readonly type: CueType,
		public start: number,
		/** Cue "comment" in Rekordbox */
		public name: string = ""
	) {}

	getType (): CueType {
		return this.type;
	}

	isHotCue (): this is HotCue {
		return this.type === "hotcue";
	}

	isMemoryCue (): this is MemoryCue {
		return this.type === "memorycue";
	}
}
