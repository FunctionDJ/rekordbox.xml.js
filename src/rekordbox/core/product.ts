import { XMLSerializable } from "../misc/lib";
import { IProduct } from "../xml-types/rekordbox-xml";

export class Product implements XMLSerializable<IProduct> {
	constructor (
		public version: string,
		public name = "rekordbox",
		public company = "AlphaTheta"
	) {}

	fillFromXML (data: IProduct): void {
		this.version = data.Version;
		this.name = data.Name;
		this.company = data.Company;
	}

	static createFromXML (data: IProduct): Product {
		return new Product(
			data.Version,
			data.Name,
			data.Company
		);
	}

	serialize (): IProduct {
		return {
			Company: "AlphaTheta",
			Name: "rekordbox",
			Version: this.version
		};
	}
}
