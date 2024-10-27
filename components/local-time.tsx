"use client";

export const LocalTime = ({ timeString }: { timeString: string }) => {
  const formatUTCDateToLocalWithAMPM = (utcDateString: string) => {
    // Parse the UTC date string into a Date object
    utcDateString = utcDateString + "Z";
    const utcDate = new Date(utcDateString);

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
    return utcDate.toLocaleString("en-US", options);
  };

  return <>{formatUTCDateToLocalWithAMPM(timeString)}</>;
};
