import { useEffect, useState } from "react";
import { calendarService } from "../services/GoogleCalendarService";
import { CalendarEvent } from "../types/google-calendar";

interface CalendarEventsProps {
	searchQuery?: string;
}

export function CalendarEvents({ searchQuery }: CalendarEventsProps) {
	const [events, setEvents] = useState<CalendarEvent[]>([]);
	const [totalTime, setTotalTime] = useState<{ hours: number; minutes: number } | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchEvents = async () => {
			try {
				setLoading(true);

				if (searchQuery) {
					const events = await calendarService.getEvents(searchQuery);
					console.log(events);

					setEvents(events);
					let totalMinutes = 0; // Cumulative total of minutes, to be converted after
					for (const e of events) {
						if (e.duration) {
							totalMinutes += e.duration.hours * 60 + e.duration.minutes;
						}
					}
					setTotalTime({ hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 });
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
	}, [searchQuery]);

	if (loading) {
		return <div>Loading calendar events...</div>;
	}

	if (error) {
		return <div className="error">{error}</div>;
	}

	if (events.length === 0) {
		return <div>No events found for {searchQuery}</div>;
	}

	return (
		<div className="calendar-events">
			{searchQuery && (
				<div className="event-stats">
					<h3>
						Stats for <strong>{searchQuery}</strong>
					</h3>
					<table>
						<tbody>
							<tr>
								<th>Events</th>
								<td>{events.length}</td>
							</tr>
							<tr>
								<th>Total Time</th>
								<td>
									{totalTime !== null
										? totalTime.hours > 0
											? ` ${totalTime.hours} hour${totalTime.hours == 1 ? "" : "s"}`
											: ""
										: "Calculating..."}{" "}
									{totalTime !== null
										? totalTime.minutes > 0
											? ` ${totalTime.minutes} minute${totalTime.minutes == 1 ? "" : "s"}`
											: ""
										: "Calculating..."}
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			)}

			<ul className="events-list">
				{events.map((event) => (
					<li key={event.id} className="event-item">
						<div className="event-summary">{event.summary}</div>
						<div className="event-time">
							{event.start.dateTime
								? (() => {
										// Parse dates while preserving the timezone
										const startDate = new Date(event.start.dateTime);
										const endDate = new Date(event.end.dateTime as string);
										const currentYear = new Date().getFullYear();

										// Format helpers
										const formatTime = (date: Date) => {
											const hours = date.getHours() % 12 || 12;
											const minutes = date.getMinutes();
											const ampm = date.getHours() >= 12 ? "pm" : "am";
											return `${hours}${minutes > 0 ? ":" + String(minutes).padStart(2, "0") : ""}${ampm}`;
										};

										const formatDate = (date: Date) => {
											const showYear = date.getFullYear() !== currentYear;
											return date.toLocaleDateString("en-US", {
												month: "short",
												day: "numeric",
												year: showYear ? "numeric" : undefined,
											});
										};

										// Check if same day
										const sameDay = startDate.toDateString() === endDate.toDateString();

										return (
											<>
												{formatDate(startDate)} {formatTime(startDate)} — {!sameDay ? `${formatDate(endDate)} ` : ""}
												{formatTime(endDate)}
											</>
										);
								  })()
								: event.start.date}
						</div>
						{event.duration !== undefined && (
							<div className="event-duration">
								{event.duration.hours == 24
									? "All Day"
									: event.duration.hours > 0
									? ` ${event.duration.hours} hour${event.duration.hours == 1 ? "" : "s"}`
									: ""}
								{event.duration.minutes > 0 ? ` ${event.duration.minutes} minute${event.duration.minutes == 1 ? "" : "s"}` : ""}
							</div>
						)}
					</li>
				))}
			</ul>
		</div>
	);
}
