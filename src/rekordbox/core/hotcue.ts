/* eslint-disable comma-dangle */
import { Cue } from "./cue";
import { CueColor, hotCueCharToNum, numToHotCueChar, XMLSerializable } from "../misc/lib";
import { IPositionMark } from "../xml-types/tracks";

export class HotCue extends Cue implements XMLSerializable<IPositionMark> {
	public color: CueColor = { red: 40, green: 226, blue: 20 };

	constructor (
		start: number,
		public num = 0,
	) {
		super("hotcue", start);
	}

	getLetter (): string {
		return numToHotCueChar(this.num);
	}

	setLetter (char: string): void {
		this.num = hotCueCharToNum(char);
	}

	serialize (): IPositionMark {
		return {
			Name: this.name,
			Num: String(this.num),
			Start: String(this.start),
			Type: "0",
			Red: String(this.color.red),
			Green: String(this.color.green),
			Blue: String(this.color.blue)
		};
	}
}
