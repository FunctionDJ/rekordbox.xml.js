import { Cue } from "./cue";
import { XMLSerializable } from "../misc/lib";
import { IPositionMark } from "../xml-types/tracks";

export class MemoryCue extends Cue implements XMLSerializable<IPositionMark> {
	constructor (start: number) {
		super("memorycue", start);
	}

	serialize (): IPositionMark {
		return {
			Name: this.name,
			Num: "-1",
			Start: String(this.start),
			Type: "0"
		};
	}
}
