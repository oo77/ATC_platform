function isoToMySqlDatetime(isoString) {
  const datePart = isoString.substring(0, 10);
  const timePart = isoString.substring(11, 19);
  return `${datePart} ${timePart}`;
}
function dateToLocalIso(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}
function dateToLocalIsoString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}
function formatDateOnly(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function formatDateForDisplay(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year ?? 2e3, (month ?? 1) - 1, day ?? 1);
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

export { formatDateForDisplay as a, dateToLocalIso as b, dateToLocalIsoString as d, formatDateOnly as f, isoToMySqlDatetime as i };
//# sourceMappingURL=timeUtils.mjs.map
