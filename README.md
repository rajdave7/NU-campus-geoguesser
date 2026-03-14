Northwestern GeoGuessr — Backend Setup
=======================================

Each Lambda function lives in its own folder. To deploy any of them:

1. cd into the function folder
2. npm install
3. zip -r function.zip index.js node_modules package.json
4. Upload the zip to AWS Lambda via the console (Code → Upload from .zip)
5. Set environment variables in Lambda → Configuration → Environment variables:
     DB_HOST      = your RDS endpoint
     DB_USER      = your MySQL username
     DB_PASSWORD  = your MySQL password
     S3_BUCKET    = northwestern-geoguesser-photos  (upload Lambda only)

Lambda Functions
----------------
photo-upload/        POST /photos/upload
get-random-photo/    GET  /photos/random
submit-guess/        POST /guess
get-leaderboard/     GET  /leaderboard
create-user/         POST /users

All functions are connected to the same API Gateway (HTTP API) and share
the same RDS MySQL instance (database: northwestern_geoguessr).

Database
--------
Run the SQL in schema.sql against your RDS MySQL instance using MySQL
Workbench to create the users, photos, and game_sessions tables.