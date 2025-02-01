// auth.js
const auth0 = new Auth0Client({
    domain: 'dev-bv8qwtkgzlety263.us.auth0.com', // Your Auth0 domain
    client_id: 'iuw5VrLAZldpEmaU14tAqqbgf0U8AkWl', // Your Auth0 client ID
    redirect_uri: window.location.origin, // Redirect to the current page
    audience: 'https://api.egyptianmemehub.com', // Your Auth0 API audience
  });