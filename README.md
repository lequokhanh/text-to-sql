# How to run spring boot application
1. Prerequisites
    - Java 17
    - Maven

2. Clone the repository
    ```bash
    git clone https://github.com/lequokhanh/text-to-sql-sml.git
   ```
3. Build the project
    ```bash
    mvn clean package
    ```
4. Run the project
    ```bash
    java -jar target/demo-0.0.1-SNAPSHOT.jar
    ```
   
5. Open Postman and paste curl command below to test the API
    ```bash
    curl --location 'localhost:8080/db/connect' \
    --header 'Content-Type: application/json' \
    --data '{
      "url": "jdbc:postgresql://localhost:5432/mydatabase",
      "username": "myuser",
      "password": "mypassword",
      "dbType": "postgresql"
    }'
    ```
   or
   ```bash
   curl --location 'localhost:8080/db/connect' \
    --header 'Content-Type: application/json' \
    --data '{
    "url": "jdbc:mysql://localhost:3307/test_springboot",
    "username": "lequo",
    "password": "123456",
    "dbType": "mysql"
    }'
