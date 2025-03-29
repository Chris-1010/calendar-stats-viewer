import { JSX, useEffect, useState } from "react";
import { calendarService } from "../services/GoogleCalendarService";
import { CalendarEvent } from "../types/google-calendar";
import { AlignJustify as DescriptionIcon } from "lucide-react";

interface CalendarEventsProps {
	userEmail: string | null,
	searchQuery?: string;
}

const formatEventTime = (startDateTime: string, endDateTime: string): JSX.Element => {
	// Parse dates while preserving the timezone
	const startDate = new Date(startDateTime);
	const endDate = new Date(endDateTime);
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
};

export function CalendarEvents({ userEmail, searchQuery }: CalendarEventsProps) {
	const [events, setEvents] = useState<CalendarEvent[]>([]);
	const [clickedEvent, setClickedEvent] = useState<CalendarEvent | null>(null);
	const [totalTime, setTotalTime] = useState<{ hours: number; minutes: number } | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const displayDescription = (event: CalendarEvent) => {
		clickedEvent && clickedEvent.id === event.id ? setClickedEvent(null) : setClickedEvent(event);
	};

	useEffect(() => {
		const fetchEvents = async () => {
			try {
				setLoading(true);

				if (searchQuery) {
					const events = await calendarService.getEvents(searchQuery);

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
		return <div className="error">{error} Sign Out and Back In</div>;
	}

	if (searchQuery && events.length === 0) {
		return <div>No events found for {searchQuery}</div>;
	}

	return (
		<div className="calendar-events">
			{searchQuery && (
				<div className="events-details">
					<div className="events-stats">
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
					{clickedEvent && (
						<div className="clickedEventDetails">
							<a href={`${clickedEvent.link}${userEmail ? `&authuser=${userEmail}` : ''}`}>{clickedEvent.summary}</a>
							<div className="event-time">
								{clickedEvent.start.dateTime
									? formatEventTime(clickedEvent.start.dateTime, clickedEvent.end.dateTime as string)
									: clickedEvent.start.date}
							</div>
							{clickedEvent.duration !== undefined && (
								<div className="event-duration">
									{clickedEvent.duration.hours == 24
										? "All Day"
										: clickedEvent.duration.hours > 0
										? ` ${clickedEvent.duration.hours} hour${clickedEvent.duration.hours == 1 ? "" : "s"}`
										: ""}
									{clickedEvent.duration.minutes > 0
										? ` ${clickedEvent.duration.minutes} minute${clickedEvent.duration.minutes == 1 ? "" : "s"}`
										: ""}
								</div>
							)}
							<div className="event-description">
								<h3>Description</h3>
								<p>{clickedEvent.description}</p>
							</div>
						</div>
					)}
				</div>
			)}

			<ul className="events-list">
				{events.map((event) => (
					<li
						key={event.id}
						className={`event-item ${clickedEvent && clickedEvent.id === event.id ? "toggled" : ""}`}
						onClick={event.description ? () => displayDescription(event) : undefined}
					>
						<a href={event.description ? undefined : `${event.link}${userEmail ? `&authuser=${userEmail}` : ''}`} className="event-summary">{event.summary}</a>
						<div className="event-time">
							{event.start.dateTime ? formatEventTime(event.start.dateTime, event.end.dateTime as string) : event.start.date}
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
						{event.description ? (
							<div className="descBrief">
								<DescriptionIcon />
								{event.description.length} characters
							</div>
						) : (
							""
						)}
					</li>
				))}
			</ul>
		</div>
	);
}
