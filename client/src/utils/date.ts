const formStrs = ["Y", "M", "d", "D", "h", "m", "s", "ms"];

export const months = [
    "Января",
    "Февраля",
    "Марта",
    "Апреля",
    "Мая",
    "Июня",
    "Июля",
    "Августа",
    "Сентября",
    "Октября",
    "Ноября",
    "Декабря",
];

export const weekDayNames = [
    "Понедельник",
    "Вторник",
    "Среда",
    "Четверг",
    "Пятница",
    "Суббота",
    "Воскресенье",
]

export const parseDate = (dateStr: string | Date, format: string): string => {
    if (typeof dateStr !== "object" ? !isNaN(Date.parse(dateStr)) : dateStr) {
        const date = new Date(dateStr);
        for (const str of formStrs) {
            const match = format.match(RegExp(`${str}+`));

            if (match) {
                const ms = match[0];
                switch (str) {
                    case "Y": {
                        if (ms.length === 4 || ms.length === 2) {
                            if (ms.length === 4) {
                                format = format.replace(
                                    /Y+/i,
                                    String(date.getFullYear())
                                );
                            } else {
                                format = format.replace(
                                    /Y+/i,
                                    String(date.getFullYear() % 100)
                                );
                            }
                        } else {
                            throw new Error("Year must be 2 or 4 length");
                        }
                        break;
                    }
                    case "M": {
                        if (ms.length === 2) {
                            if (format.match(RegExp(`${str}+n`))) {
                                format = format.replace(
                                    /M+n/i,
                                    date.getMonth() < 10
                                        ? '0' + String(date.getMonth() + 1)
                                        : String(date.getMonth() + 1)
                                );
                            } else {
                                format = format.replace(
                                    /M+/i,
                                    String(months[date.getMonth()])
                                );
                            }
                        } else {
                            throw new Error("Month must be 2 length");
                        }
                        break;
                    }
                    case "d": {
                        if (ms.length === 1) {
                            format = format.replace(
                                /d+/i,
                                String(date.getDate())
                            );
                        } else if (ms.length === 2) {
                            format = format.replace(
                                /d+/i,
                                date.getDate() < 10
                                    ? '0' + String(date.getDate())
                                    : String(date.getDate())
                            );
                        } else {
                            throw new Error("Day must be 2 or 1 length");
                        }
                        break;
                    }
                    case "D": {
                        if (ms.length === 1) {
                            format = format.replace(
                                /D+/i,
                                weekDayNames[date.getDay()]
                            );
                        } else {
                            throw new Error("Day must be 1 length");
                        }
                        break;
                    }
                    case "h": {
                        if (ms.length === 2) {
                            format = format.replace(
                                /h+/i,
                                date.getHours() < 10
                                    ? '0' + String(date.getHours())
                                    : String(date.getHours())
                            );
                        } else {
                            throw new Error("Hours must be 2 length");
                        }
                        break;
                    }
                    case "m": {
                        if (ms.length === 2) {

                            format = format.replace(
                                /m+/i,
                                date.getMinutes() < 10
                                    ? '0' + String(date.getMinutes())
                                    : String(date.getMinutes())
                            );
                        } else {
                            throw new Error("Minutes must be 2 length");
                        }
                        break;
                    }
                    case "s": {
                        if (ms.length === 2) {
                            format = format.replace(
                                /s+/i,
                                date.getSeconds() < 10
                                    ? '0' + String(date.getSeconds())
                                    : String(date.getSeconds())
                            );
                        } else {
                            throw new Error("Seconds must be 2 length");
                        }
                        break;
                    }
                    case "ms": {
                        if (ms.length === 4) {
                            format = format.replace(
                                /ms+/i,
                                date.getMilliseconds() < 1000
                                    ? new Array({ length: 4 - String(date.getMilliseconds()).length }, () => "0").join("") + String(date.getMilliseconds())
                                    : String(date.getMilliseconds())
                            );
                        } else {
                            throw new Error("Minutes must be 4 length");
                        }
                        break;
                    }
                }
            }
        }
        return format;
    } else {
        throw new Error("Date str must be date iso string");
    }
};
