export class DateHelper {
	public static isDifferentDay = (
		date1: Date,
		date2: Date
	): boolean => {
		return !DateHelper.isSameDay(date1, date2);
	};

	public static isSameDay = (date1: Date, date2: Date): boolean => {
		return (
			date1.getFullYear() === date2.getFullYear() &&
			date1.getMonth() === date2.getMonth() &&
			date1.getDate() === date2.getDate()
		);
	};
}
