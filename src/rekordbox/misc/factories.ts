import { HotCue } from "../core/hotcue";
import { MemoryCue } from "../core/memorycue";
import { IPositionMark } from "../xml-types/tracks";

export const createCueFromXML = (data: IPositionMark): HotCue|MemoryCue => {
	const start = Number.parseFloat(data.Start);

	if (data.Num === "-1") {
		const memCue = new MemoryCue(start);
		memCue.name = data.Name;
		return memCue;
	}

	const hotCue = new HotCue(start, Number.parseInt(data.Num, 10));
	hotCue.name = data.Name;

	if (data.Red !== undefined) {
		hotCue.color.red = Number.parseInt(data.Red, 10);
	}

	if (data.Green !== undefined) {
		hotCue.color.green = Number.parseInt(data.Green, 10);
	}

	if (data.Blue !== undefined) {
		hotCue.color.blue = Number.parseInt(data.Blue, 10);
	}

	return hotCue;
};
