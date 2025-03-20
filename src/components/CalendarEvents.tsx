import { useEffect, useState } from "react";
import { calendarService } from "../services/GoogleCalendarService";
import { CalendarEvent } from "../types/google-calendar";

interface CalendarEventsProps {
	searchEventName?: string;
}

export function CalendarEvents({ searchEventName }: CalendarEventsProps) {
	const [events, setEvents] = useState<CalendarEvent[]>([]);
	const [totalHours, setTotalHours] = useState<number | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchEvents = async () => {
			try {
				setLoading(true);

				if (searchEventName) {
					const events = await calendarService.getEvents(searchEventName, 100);
					setEvents(events);
					let sum = 0;
					for (const e of events) {
						if (e.duration) {
							sum += e.duration;
						}
					}
					setTotalHours(parseFloat(sum.toFixed(2)));
				}

				setError(null);
			} catch (err) {
				setError("Error loading calendar events. Please try again.");
				console.error(err);
			} finally {
				setLoading(false);
			}
		};

		fetchEvents();
	}, [searchEventName]);

	if (loading) {
		return <div>Loading calendar events...</div>;
	}

	if (error) {
		return <div className="error">{error}</div>;
	}

	if (events.length === 0) {
		return <div>No upcoming events found in your calendar.</div>;
	}

	return (
		<div className="calendar-events">
			<h2>Upcoming Events</h2>

			{searchEventName && (
				<div className="event-stats">
					<h3>Stats for "{searchEventName}"</h3>
					<p>Total hours: {totalHours !== null ? `${totalHours} hours` : "Calculating..."}</p>
				</div>
			)}

			<ul className="events-list">
				{events.map((event) => (
					<li key={event.id} className="event-item">
						<div className="event-summary">{event.summary}</div>
						<div className="event-time">{event.start.dateTime ? new Date(event.start.dateTime).toLocaleString() : event.start.date}</div>
						{event.duration !== undefined && <div className="event-duration">{event.duration} hours</div>}
					</li>
				))}
			</ul>
		</div>
	);
}
