import { createCueFromXML } from "../misc/factories";
import { HotCue } from "./hotcue";
import { addSafe, removeSafe, XMLSerializable } from "../misc/lib";
import { MemoryCue } from "./memorycue";
import { Track } from "./track";
import { IPositionMark } from "../xml-types/tracks";

export class Cues implements XMLSerializable<IPositionMark[]> {
	private cues: Array<HotCue|MemoryCue> = [];
	private readonly tracks: Set<Track> = new Set();

	registerTrack (track: Track): void {
		addSafe(this.tracks, track);
	}

	getTracks (): Track[] {
		return Array.from(this.tracks);
	}

	isInTrack (track: Track): boolean {
		return this.tracks.has(track);
	}

	unregisterTrack (track: Track): void {
		removeSafe(this.tracks, track);
	}

	constructor (track?: Track) {
		if (track !== undefined) {
			this.registerTrack(track);
		}
	}

	serialize (): IPositionMark[] {
		return this.cues.map(c => c.serialize());
	}

	fillFromXML (data: IPositionMark[]): void {
		this.cues = data.map(createCueFromXML);
	}

	createHotCue (): void {}
	createMemoryCue (start: number): void {
		const memoryCue = new MemoryCue(start);
		this.cues.push(memoryCue);
	}

	hasCues (): boolean {
		return this.cues.length !== 0;
	}

	getHotCues (): HotCue[] {
		return this.cues.filter(c => c.isHotCue()) as HotCue[];
	}

	hasHotCues (): boolean {
		return this.getHotCues().length !== 0;
	}

	getMemoryCues (): MemoryCue[] {
		return this.cues.filter(c => c.isMemoryCue());
	}

	hasMemoryCues (): boolean {
		return this.getMemoryCues().length !== 0;
	}

	cloneMemoryCuesToHotCues (): void {}

	removeHotCues (): void {}

	removeMemoeryCues (): void {}
}
