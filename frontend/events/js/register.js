const form = document.getElementById("registrationForm");

if (form) {
    const params  = new URLSearchParams(window.location.search);
    const eventId = parseInt(params.get("id")) || 1;
    const eventInput = document.getElementById("eventName");
    const eventDateInput = document.getElementById("eventDate");
    const venueInput     = document.getElementById("venue");

    // Pre-fill read-only event fields from the events data array
    const event = window.events ? events.find(e => e.id === eventId) : null;
    if (event) {
        if (eventInput)     { eventInput.value = event.title;  eventInput.setAttribute("readonly", "true"); }
        if (eventDateInput) { eventDateInput.value = event.date || ""; }
        if (venueInput)     { venueInput.value = event.venue || ""; }
    }

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const registration = {
            id:        "REG-" + Date.now(),
            eventId:   event ? event.id : eventId,
            name:      document.getElementById("name").value,
            email:     document.getElementById("email").value,
            phone:     document.getElementById("phone").value,
            country:   (document.getElementById("country") || {}).value || "",
            city:      (document.getElementById("city")    || {}).value || "",
            userType:  (document.getElementById("userType") || {}).value || "Student",
            experience:(document.getElementById("experience") || {}).value || "Beginner",
            event:     eventInput ? eventInput.value : "Yoga Session",
            eventDate: event ? event.date : new Date().toLocaleDateString(),
            venue:     event ? event.venue : "Pragya Hall",
            status:    "Registered",
            date:      new Date().toLocaleDateString(),
            assignedMentors: [],
            registeredAt: new Date().toISOString()
        };

        // Save registration
        let registrations = JSON.parse(localStorage.getItem("registrations") || "[]");
        registrations.push(registration);
        localStorage.setItem("registrations", JSON.stringify(registrations));

        // Save a local notification
        const currentUser = localStorage.getItem("userName") || "Gyan Prakash";
        const localNotifs = JSON.parse(localStorage.getItem("local_notifications") || "[]");
        localNotifs.push({
            _id: "notif_" + Date.now(),
            user: currentUser,
            title: "Event Registered Successfully",
            type: "event",
            content: `You have registered for ${registration.event} scheduled on ${registration.eventDate}.`,
            is_read: false,
            createdAt: new Date().toISOString()
        });
        localStorage.setItem("local_notifications", JSON.stringify(localNotifs));

        // Confirmation and redirect to Events page
        alert(`🎉 Registration successful for ${registration.event}!`);
        window.location.href = `Events.html?registered=true`;
    });
}