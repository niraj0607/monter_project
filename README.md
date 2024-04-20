Software Requirements:
- node.js (v20.10.0)
- npm (v10.2.3)
- Postman
- MongoDB Community Version
- MongoDB Compass

Node modules:
- express
- mongoose
- jsonwebtoken
- bcryptjs
- nodemailer
- dotenv
  
Step 0: Make sure MongoDB Client is up <br>
Step 1: Setup environment variables in .env file (MONGO_URI, EMAIL, EMAIL_PASSWORD, JWT_SECRET) <br>
Step 2: Start the server in your local machine using the command - 'npm run start' <br>
Step 3. Register new user using the Register API call - 'localhost:3000/api/users/register' <br>
Step 4: Verify user by providing otp in Verify API call - 'localhost:3000/api/users/verify' <br>
Step 5: Login using user credentials by Login API call - 'localhost:3000/api/users/login' (Copy JWT token from response) <br>
Step 6: Retrieve user information using the JWT token - 'localhost:3000/api/users/user-info' <br>
