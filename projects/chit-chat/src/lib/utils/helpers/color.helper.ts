export class ColorHelper {
	public static isColorLight = (color: any) => {
		var red: number, green: number, blue: number, hsp: number;

		if (color.match(/^rgb/)) {
			color = color.match(
				/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/
			);

			red = color[1];
			green = color[2];
			blue = color[3];
		} else {
			color = +(
				'0x' +
				color.slice(1).replace(color.length < 5 && /./g, '$&$&')
			);

			red = color >> 16;
			green = (color >> 8) & 255;
			blue = color & 255;
		}

		hsp = Math.sqrt(
			0.299 * (red * red) +
				0.587 * (green * green) +
				0.114 * (blue * blue)
		);

		return hsp > 150;
	};
}
