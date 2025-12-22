"use client";

export const LocalTime = ({
  timeString,
}: {
  timeString: string | number | null;
}) => {
  const formatUTCDateToLocalWithAMPM = (
    dateValue: string | number | null,
  ) => {
    // Handle null or undefined dates
    if (!dateValue) {
      return "Never refreshed";
    }

    try {
      if (typeof dateValue === "number") {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) {
          return "Invalid date";
        }

        return date.toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
          second: "numeric",
          hour12: true,
        });
      }

      // Parse the date string - handle both formats:
      // 1. UTC without timezone: "2025-05-30 04:29:06.218196" (needs Z appended)
      // 2. With timezone: "2025-05-30 04:29:06.218196+00" (already complete)
      let dateToUse = dateValue;

      // If the string doesn't contain timezone info, add Z for UTC
      if (!dateValue.includes("+") && !dateValue.includes("Z")) {
        dateToUse = dateValue + "Z";
      }

      const date = new Date(dateToUse);

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }

      // Extract the local time components with AM/PM notation
      const options = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: true, // This will include the AM/PM notation
      } as const;

      // Format the date according to the local time zone with AM/PM
      return date.toLocaleString("en-US", options);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  return <>{formatUTCDateToLocalWithAMPM(timeString)}</>;
};
