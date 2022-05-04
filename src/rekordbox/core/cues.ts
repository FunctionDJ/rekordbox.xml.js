import { createCueFromXML } from "../misc/factories";
import { HotCue } from "./hotcue";
import { addSafe, isBetween, removeSafe, XMLSerializable } from "../misc/lib";
import { MemoryCue } from "./memorycue";
import { Track } from "./track";
import { IPositionMark } from "../xml-types/tracks";
import { Cue } from "./cue";

export class Cues implements XMLSerializable<IPositionMark[]> {
	private cues: Array<HotCue | MemoryCue> = [];
	private readonly tracks: Set<Track> = new Set();

	static sortCuesByStartTime(cueA: Cue, cueB: Cue) {
		return cueA.start < cueB.start ? -1 : 0;
	}

	registerTrack(track: Track): void {
		addSafe(this.tracks, track);
	}

	getTracks(): Track[] {
		return Array.from(this.tracks);
	}

	isInTrack(track: Track): boolean {
		return this.tracks.has(track);
	}

	unregisterTrack(track: Track): void {
		removeSafe(this.tracks, track);
	}

	constructor(track?: Track) {
		if (track !== undefined) {
			this.registerTrack(track);
		}
	}

	serialize(): IPositionMark[] {
		return this.cues.map((c) => c.serialize());
	}

	fillFromXML(data: IPositionMark[]): void {
		this.cues = data.map(createCueFromXML);
	}

	createHotCue(): void {}
	createMemoryCue(start: number): void {
		const memoryCue = new MemoryCue(start);
		this.cues.push(memoryCue);
	}

	hasCues(): boolean {
		return this.cues.length !== 0;
	}

	getHotCues(): HotCue[] {
		return this.cues.filter((c) => c.isHotCue()) as HotCue[];
	}

	hasHotCues(): boolean {
		return this.getHotCues().length !== 0;
	}

	getMemoryCues(): MemoryCue[] {
		return this.cues.filter((c) => c.isMemoryCue());
	}

	hasMemoryCues(): boolean {
		return this.getMemoryCues().length !== 0;
	}

	/**
	 * **Warning**
	 * This might remove memory cues based on the `territoryInSeconds` parameter.
	 *
	 * Given a Hot Cue, if there is a Memory Cue that's +- `territoryInSeconds` apart from the Hot Cue,
	 * the Memory Cue will be removed. This is to prevent duplicate Hot and Memory Cues on top or very near to each other.
	 *
	 * The higher the parameter, the higher chance that a Memory Cue nearby will be "overwritten" with the Hot Cue's position.
	 *
	 * With `territoryInSeconds = 0` it will only ensure that there are no 2 Memory Cues on the exact same position.
	 *
	 * Purpose: Being able to see and also partially use
	 * all 8 Hot Cues (or more) on Pioneer gear with only 3 Hot Cue buttons,
	 * like the CDJ-2000nexus (1).
	 */
	cloneHotCuesToMemoryCues(territoryInSeconds = 0.1): void {
		const hotCues = this.getHotCues();

		const memoryCuesToKeep = this.getMemoryCues().filter((mem) => {
			const hotCueWhereThisMemCueIsInTerritor = hotCues.find((hc) =>
				isBetween(
					mem.start,
					hc.start - territoryInSeconds,
					hc.start + territoryInSeconds
				)
			);

			return hotCueWhereThisMemCueIsInTerritor === undefined;
		});

		const newMemoryCuesFromHotCues = hotCues.map(
			(hc) => new MemoryCue(hc.start)
		);
		const newMemoryCues = [
			...memoryCuesToKeep,
			...newMemoryCuesFromHotCues,
		].sort(Cues.sortCuesByStartTime);
		this.cues = [...hotCues, ...newMemoryCues];
	}

	removeHotCues(): void {}

	removeMemoryCues(): void {}
}
