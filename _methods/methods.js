module.exports = {
    currentYearRange() {
		const currDate = new Date();
		const month = currDate.getUTCMonth() + 1;
		const year = currDate.getUTCFullYear();
		if (month < 9) {
			return this.constructYearRange(year - 1);
		} else {
            return this.constructYearRange(year);
		}
	},
	constructYearRange(Year) {
		return Year + ' - ' + (Year + 1);
	},
	getDatabaseName(YearRange) {
		return YearRange.substring(0, YearRange.indexOf(' '));
	},
    user() {
        return 'security';
    },
    data() {
        return 'meta';
    }
}