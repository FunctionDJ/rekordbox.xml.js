export interface ITrack {
	TrackID: string
	/** *Name of track* */
	Name: string
	Artist: string
	/** *Name of composer (or producer)* */
	Composer: string
	Album: string
	Grouping: string
	Genre: string
	/**
	 * *Type of audio file*
	 *
	 * E.g. "MP3 File", "WAV File", "M4A File"
	 */
	Kind: string
	/**
	 * *Size of audio file*
	 *
	 * *Unit: Octet*
	 */
	Size: string
	/**
	 * *Duration of track*
	 *
	 * *Unit: Second (without decimal numbers)*
	 */
	TotalTime: string
	/** *Order number of the disc of the album* */
	DiscNumber: string
	/** *Order number of the track in the album* */
	TrackNumber: string
	Year: string
	/** *Unit: Second (without decimal numbers)* */
	AverageBpm: string
	/** *Format: `yyyy-mm-dd`* */
	DateModified?: string
	/** *Format: `yyyy-mm-dd`* */
	DateAdded: string
	/** *Unit: Kbps* */
	BitRate: string
	/** *Unit: Hertz* */
	SampleRate: string
	Comments: string
	PlayCount: string
	/** *Format: `yyyy-mm-dd`* */
	LastPlayed?: string
	Rating: string
	/**
	 * *encoded as an URI; expected media to be located in `file://localhost/`*
	 */
	Location: string
	Remixer: string
	/** *Tonality (Kind of musical key)* */
	Tonality: string
	Label: string
	Mix: string
	/**
	 * *Colour for track grouping*
	 *
	 * *RGB format (3 bytes)*
	 *
	 * *rekordbox : Rose(0xFF007F), Red(0xFF0000), Orange(0ｘFFA500), Lemon(0xFFFF00), Green(0x00FF00), Turquoise(0x25FDE9), Blue(0x0000FF), Violet(0x660099)*
	 */
	Colour?: string
	TEMPO?: ITempo[]
	POSITION_MARK?: any[]
}

export interface ITempo {
	/**
	 * *Start position of grid*
	 *
	 * *Unit : Second (with decimal numbers)*
	 */
	Inizio: string
	/** *Unit : Second (with decimal numbers)* */
	Bpm: string
	/**
	 * *Kind of musical meter*
	 *
	 * *ex. 3/4, 4/4, 7/8…*
	 */
	Metro: string
	/**
	 * *Beat number in the bar*
	 *
	 * *If the value of "Metro" is 4/4, the value should be 1, 2, 3 or 4.*
	 */
	Battito: string
}

export interface IPositionMark {
	Name: string
	/** *Cue = `"0"`, Fade-In = `"1"`, Fade-Out = `"2"`, Load = `"3"`, Loop = `"4"`* */
	Type: string
	/** *Unit : Second (with decimal numbers) */
	Start: string
	/**
	 * *Unit : Second (with decimal numbers)*
	 *
	 * Only on loops i think, not on Hot Cues, Memory Cues etc.
	 */
	End?: string
	/**
	 * *Number for identification of the position mark*
	 *
	 * *rekordbox : Hot Cue A, B, C : `"0"`, `"1"`, `"2"`; Memory Cue : `"-1"`*
	 */
	Num: string
	/** Only on Hot Cues (Num !== `-1`) */
	Red?: string
	/** Only on Hot Cues (Num !== `-1`) */
	Green?: string
	/** Only on Hot Cues (Num !== `-1`) */
	Blue?: string
}
