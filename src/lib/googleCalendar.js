/**
 * Google Calendar — Helper Utility
 * 
 * Generates a Google Calendar "Add Event" URL for appointment bookings.
 * This uses the public Google Calendar URL scheme — no API key required.
 * Users click the link → Google Calendar opens with pre-filled event details.
 *
 * For server-side calendar creation (e.g., auto-adding events for CAs),
 * you would use the Google Calendar API with a service account.
 */

const TOPIC_LABELS = {
  "income-tax": "Income Tax Filing",
  "gst": "GST Registration/Filing",
  "company": "Company Incorporation",
  "audit": "Audit & Compliance",
  "advisory": "Tax Advisory",
  "other": "General Consultation",
};

const TYPE_LABELS = {
  video: "Video Call (Google Meet)",
  phone: "Phone Call",
  in_person: "In Person — GMR & Associates Office, Gurgaon",
};

/**
 * Parse a 12-hour time string (e.g. "2:30 PM") to { hours, minutes } in 24h format.
 */
function parseTime12h(timeStr) {
  const [time, period] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return { hours, minutes };
}

/**
 * Format a Date to Google Calendar's required format: YYYYMMDDTHHmmss
 */
function toGCalDatetime(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${y}${m}${d}T${h}${min}00`;
}

/**
 * Build a Google Calendar event URL.
 *
 * @param {Object}  opts
 * @param {string}  opts.date       – "YYYY-MM-DD"
 * @param {string}  opts.time       – "2:30 PM"
 * @param {string}  opts.type       – "video" | "phone" | "in_person"
 * @param {string}  opts.topic      – topic key
 * @param {string}  [opts.notes]    – additional notes
 * @param {string}  [opts.userName] – client name
 * @param {number}  [opts.durationMinutes] – default 30
 * @returns {string} Google Calendar URL
 */
export function buildGoogleCalendarUrl({
  date,
  time,
  type,
  topic,
  notes = "",
  userName = "",
  durationMinutes = 30,
}) {
  const topicLabel = TOPIC_LABELS[topic] || topic || "Consultation";
  const typeLabel = TYPE_LABELS[type] || type;
  const title = `CA Consultation — ${topicLabel}`;

  // Build start/end datetimes
  const { hours, minutes } = parseTime12h(time);
  const start = new Date(date);
  start.setHours(hours, minutes, 0, 0);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const startStr = toGCalDatetime(start);
  const endStr = toGCalDatetime(end);

  // Build description
  const descLines = [
    `📋 Consultation Type: ${typeLabel}`,
    `📌 Topic: ${topicLabel}`,
    userName ? `👤 Client: ${userName}` : "",
    notes ? `📝 Notes: ${notes}` : "",
    "",
    "GMR & Associates — Chartered Accountants",
    "📞 +91-124-4577891",
    "🌐 https://gmrassociates.in",
  ].filter(Boolean);

  const description = descLines.join("\n");

  // Location
  let location = "";
  if (type === "in_person") {
    location = "GMR & Associates, Sector 44, Gurgaon, Haryana 122003";
  } else if (type === "video") {
    location = "Google Meet (link will be shared)";
  } else {
    location = "Phone Call";
  }

  // Build the URL
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${startStr}/${endStr}`,
    details: description,
    location,
    ctz: "Asia/Kolkata",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Build a .ics file content string for download (works with Apple Calendar, Outlook, etc.)
 */
export function buildIcsContent({
  date,
  time,
  type,
  topic,
  notes = "",
  userName = "",
  durationMinutes = 30,
}) {
  const topicLabel = TOPIC_LABELS[topic] || topic || "Consultation";
  const typeLabel = TYPE_LABELS[type] || type;
  const title = `CA Consultation — ${topicLabel}`;

  const { hours, minutes } = parseTime12h(time);
  const start = new Date(date);
  start.setHours(hours, minutes, 0, 0);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  // Convert to UTC for ICS format
  const toIcsUtc = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  let location = "";
  if (type === "in_person") location = "GMR & Associates, Sector 44, Gurgaon, Haryana";
  else if (type === "video") location = "Google Meet (link will be shared)";
  else location = "Phone Call";

  const description = [
    `Consultation Type: ${typeLabel}`,
    `Topic: ${topicLabel}`,
    userName ? `Client: ${userName}` : "",
    notes ? `Notes: ${notes}` : "",
    "GMR & Associates — Chartered Accountants",
  ].filter(Boolean).join("\\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GMR Associates//Appointments//EN",
    "BEGIN:VEVENT",
    `DTSTART:${toIcsUtc(start)}`,
    `DTEND:${toIcsUtc(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    "STATUS:CONFIRMED",
    `UID:${Date.now()}@gmrassociates.in`,
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Appointment Reminder",
    "END:VALARM",
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Appointment in 1 hour",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/**
 * Download an .ics file to the user's device.
 */
export function downloadIcsFile(opts) {
  const content = buildIcsContent(opts);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `gmr-appointment-${opts.date}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
