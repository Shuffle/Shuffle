export const getTimeZoneAbbreviation = (tzName = Intl.DateTimeFormat().resolvedOptions().timeZone) => {
    try {
        const formatter = new Intl.DateTimeFormat("en", {
            timeZone: tzName,
            timeZoneName: "short",
        });

        const timeZonePart = formatter.formatToParts().find(part => part.type === "timeZoneName")?.value;

        // Remove offset formats like "GMT+5:30" and keep known abbreviations
        return timeZonePart.startsWith("GMT") ? tzName : timeZonePart;
    } catch (error) {
        return "Unknown Timezone";
    }
};


export const formatLocalTime = (utcTimestamp) => {
    const date = new Date(utcTimestamp + "Z"); // Ensure UTC handling

    // Convert to local time and extract values
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Ensure 2-digit month
    const day = String(date.getDate()).padStart(2, "0"); // Ensure 2-digit day
    const hours = String(date.getHours()).padStart(2, "0"); // 24-hour format
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

