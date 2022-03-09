import { addSafe, removeSafe, XMLSerializable } from "../misc/lib";
import { Track } from "./track";
import { ITempo } from "../xml-types/tracks";

/**
 * @todo Right now this class is "read-only" because consistent and valid TEMPO logic
 * is a bit tricky. Methods for manipulating beatgrid information will follow at some point.
 */
export class Beatgrid implements XMLSerializable<ITempo[]> {
	private beatlength?: number;
	private bpm?: number;
	private gridAnchor?: number;
	private firstDownBeat?: number;

	private readonly tracks: Set<Track> = new Set();

	registerTrack (track: Track): void {
		addSafe(this.tracks, track);
	}

	/** Creates an array from the tracks that the beatgrid knows */
	getTracks (): Track[] {
		return Array.from(this.tracks);
	}

	isInTrack (track: Track): boolean {
		return this.tracks.has(track);
	}

	unregisterTrack (track: Track): void {
		removeSafe(this.tracks, track);
	}

	constructor (
		private readonly rawData: ITempo[] = [],
		track?: Track
	) {
		if (track !== undefined) {
			this.registerTrack(track);
		}
	}

	serialize (): ITempo[] {
		return this.rawData;
	}

	static createFromXML (data: ITempo[]): Beatgrid {
		const beatgrid = new this(data);
		beatgrid.fillFromXML(data);
		return beatgrid;
	}

	fillFromXML (data: ITempo[]): void {
		if (data.length === 1) {
			this.gridAnchor = Number.parseFloat(data[0].Inizio);
			this.bpm = Number.parseFloat(data[0].Bpm);
			this.beatlength = 60 / this.bpm;

			const beatOffset = (5 - Number.parseInt(data[0].Battito, 10)) % 4;
			this.firstDownBeat = this.gridAnchor + (beatOffset * this.beatlength);
			return;
		}

		const bpmSum = data.map(t => parseFloat(t.Bpm))
			.reduce((prev, cur) => prev + cur, 0);

		this.bpm = bpmSum / data.length;
	}

	getFirstDownBeat (): number|null {
		return this.firstDownBeat ?? null;
	}

	getBeatLength (): number|null {
		return this.beatlength ?? null;
	}

	getBpm (): number|null {
		return this.bpm ?? null;
	}
}
