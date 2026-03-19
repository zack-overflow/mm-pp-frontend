// Base server URL
// In local dev we return an empty base URL so requests go through CRA's proxy.

const url = window.location.origin;

let BASE_SERVER_URL;

if (url === 'https://mm-pp-frontend.onrender.com') {
    BASE_SERVER_URL = 'https://mm-pp-app.onrender.com';
} else if (url === 'https://pikap-march-madness.onrender.com') {
    BASE_SERVER_URL = 'https://mm-pp-app.onrender.com/pk';
} else {
    BASE_SERVER_URL = '';
}

export default BASE_SERVER_URL;
