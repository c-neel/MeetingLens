/**
 * Utility functions for Google Calendar integration and iCal (.ics) file creation
 */

/**
 * Formats a Date and Time into YYYYMMDDTHHmmssZ format for calendar URLs and iCal files
 */
function formatCalendarDateTime(dateStr, timeStr = '09:00', durationMinutes = 60) {
  const [year, month, day] = (dateStr || new Date().toISOString().split('T')[0]).split('-').map(Number);
  const [hours, minutes] = (timeStr || '09:00').split(':').map(Number);

  const start = new Date(Date.UTC(year, month - 1, day, hours, minutes));
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const toIsoStr = (d) => d.toISOString().replace(/-|:|\.\d+/g, '');

  return {
    startIso: toIsoStr(start),
    endIso: toIsoStr(end),
    startDateObj: start,
    endDateObj: end
  };
}

/**
 * Builds a direct Google Calendar event creation URL
 */
export function buildGoogleCalendarUrl({
  title,
  description = '',
  location = 'Online Meeting',
  startDate,
  startTime = '10:00',
  durationMinutes = 60,
  guestEmail = ''
}) {
  const { startIso, endIso } = formatCalendarDateTime(startDate, startTime, durationMinutes);

  const baseUrl = 'https://calendar.google.com/calendar/render';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title || 'Assigned Task Deadline',
    details: description,
    location: location,
    dates: `${startIso}/${endIso}`
  });

  if (guestEmail && guestEmail.includes('@')) {
    params.append('add', guestEmail);
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Generates and triggers a 1-click download of a standard .ics iCalendar file
 */
export function downloadIcsFile({
  title,
  description = '',
  location = 'Online Meeting',
  startDate,
  startTime = '10:00',
  durationMinutes = 60,
  guestEmail = ''
}) {
  const { startIso, endIso } = formatCalendarDateTime(startDate, startTime, durationMinutes);
  const cleanTitle = (title || 'Task Deadline').replace(/\n/g, ' ');
  const cleanDesc = (description || '').replace(/\n/g, '\\n');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MeetAI Assistant//NONSGML Event//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@meetai.app`,
    `DTSTAMP:${startIso}`,
    `DTSTART:${startIso}`,
    `DTEND:${endIso}`,
    `SUMMARY:${cleanTitle}`,
    `DESCRIPTION:${cleanDesc}`,
    `LOCATION:${location}`,
    guestEmail ? `ATTENDEE;ROLE=REQ-PARTICIPANT;RSVP=TRUE:mailto:${guestEmail}` : '',
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${cleanTitle.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
