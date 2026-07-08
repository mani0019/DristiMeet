let IS_PROD = false;
const server = IS_PROD ?
    "https://your-deployed-backend-url.com" :
    "http://localhost:8080"

export default server;