## Calendar Sync

Existing code:
1. Google auth login is implemented using Google Auth API (do not change its flow).
2. Calendar Sync is implemented using Google Calendar API. yatr-webfront/src/server/services/google-calendar.ts
3. Fetch events is implemented using Google Calendar API. yatr-webfront/src/server/api/routers/helm.ts
4. Calendar Sync is triggered when a user creates a new event.

Planning: (Do deep research on calendar sync and implement it)

1. Read all the codebase and understand the existing code.
2. Create schema to store calendar sync data and access tokens.
3. Create utils to handle calendar sync.
4. The google login should store the access token in the database server side. 
5. The calendar sync and fetch events is in yatr-webfront/src/app/(admin)/helm/my-yachts/profile/[id]/page.tsx Fetched events should be filtered an show only yatr events. 
6. The calendar sync should be triggered when a normal user successfully books a yacht through the booking process. I have created a test button to create event same as booking process in yatr-webfront/src/components/pages/booking/index.tsx add the updated code to create event on test button also so we can test it locally.
7. While creating event if the yatch is owned by helm then the event should be created for helm and admin also if the helm user's calendar sync is enabled and add any yatr specific keyword to filter events in the fetched events api.
8. If the helm user's calendar sync is enabled and the yatch is owned by helm then the calendar event should be created for helm and admin both.
9. If the admin's calendar sync is enabled and helm user's calendar sync is disabled and the yatch is owned by helm then the calendar event should be created for admin only.
10. If the admin's calendar sync is disabled and helm user's calendar sync is enabled and the yatch is owned by helm then the calendar event should be created for helm only.
11. If the admin's calendar sync is enabled and the yatch is owned by admin then the calendar event should be created for admin only.

12. 