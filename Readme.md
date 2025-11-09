# NodeJS,Mongoose,Express Project in MVC Architecture

## MERN AUTH Backend

## About

- This is a Node application, developed using MVC pattern with Node.js, ExpressJS, and Mongoose.
- MongoDB database is used for data storage, with object modeling provided by Mongoose.

## Features

- **User Authentication**: Secure user authentication and authorization.

## Initial

1. Install all dependency
   `$ npm install`

2. Start development server
   `$ npm run dev`

### ENV

    ```
        PORT=5000
        MONGODB_URL=
        CORS_ORIGIN=*

        # API access (internal)
        API_KEY=your-secure-api-key

        # External API integration
        EXTERNAL_API_BASE_URL=https://external.api.example.com
        EXTERNAL_API_KEY=external-api-key-here

        ACCESS_TOKEN_SECRET = mern-task-upwork
        ACCESS_TOKEN_EXPIRY = 1d

        GOOGLE_CALLBACKURL=http://localhost:5000/auth/google/callback
        GOOGLE_ERRORURL=http://localhost:5000/auth/google/error
        GOOGLE_REDIRECTURL=http://localhost:3000/
        GOOGLE_CLIENTSECRET=
        GOOGLE_CLIENTID=
        GOOGLE_API_KEY=XXXXXXX
    ```

All backend routes under `/api/**` require the `x-api-key` header matching `API_KEY`.

Example curl:

```
curl -H "x-api-key: your-secure-api-key" http://localhost:5000/api/v1/dsa/health
```

Location proxy examples:

```
GET /api/v1/dsa/locations/search?q=Mumbai&lat=19.0760&lng=72.8777&radius=10
GET /api/v1/dsa/locations/{id}
```

## folder Structure

└───src
├───config  
 ├───controllers
│ └───userapp
│ └───v1/authController.js
├───db
| └───dbService.js
| └───index.js
├───middlewares
| └───auth.js
├───models
| └───user.model.js
├───routes
│ └───USERAPP/user.router.js
| └───common.js [google-auth-route]
├───services
| └───auth.service.js
└───utils
| ├───response
| └───validation
└───app.js
└───constant.js
└───index.js

## How to use generated APIs:

[Click here to visit documentation](https://documenter.getpostman.com/view/27961443/2sA3XTdKCm/ "API Documentation")
