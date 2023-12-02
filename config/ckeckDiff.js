const moment = require('moment');

module.exports = function (date1, date2) {
    const momentDate1 = moment(date1);
    const momentDate2 = moment(date2);

    const daysDifference = momentDate2.diff(momentDate1, 'days');

    return daysDifference;
}