// Base server URL

const url = window.location.origin;

let BASE_SERVER_URL;

if (url === 'https://mm-pp-frontend.onrender.com') {
    BASE_SERVER_URL = 'https://mm-pp-app.onrender.com/';
} else if (url === 'https://pikap-march-madness.onrender.com') {
    BASE_SERVER_URL = 'https://mm-pp-app.onrender.com/pk';
} else {
    BASE_SERVER_URL = 'http://127.0.0.1:5000';
}

export default BASE_SERVER_URL;
