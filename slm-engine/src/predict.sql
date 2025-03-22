SELECT COUNT(DISTINCT Singer_ID) FROM singer_in_concert;
SELECT COUNT(Singer_ID) FROM singer_in_concert GROUP BY Singer_ID
SELECT Name, Country, Age FROM singer ORDER BY Age DESC;
SELECT Name, Country, Age FROM singer ORDER BY Age DESC;
SELECT AVG(Age) as Average_Age, MIN(Age) as Minimum_Age, MAX(Age) as Maximum_Age FROM singer WHERE Country = 'France'
SELECT AVG(Age) AS Average_Age, MIN(Age) AS Min_Age, MAX(Age) AS Max_Age FROM singer WHERE Country = 'France';
SELECT T1.Name, T1.`Song_release_year` FROM singer AS T1 WHERE (T1.Age) = ( SELECT MAX(T2.Age) FROM singer AS T2 );
SELECT Name, Song_release_year FROM singer WHERE Age = ( SELECT MIN(Age) FROM singer );
SELECT DISTINCT Country FROM singer WHERE Age > 20;
SELECT DISTINCT Country FROM singer WHERE Age > 20;
SELECT COUNT(singer.Country) AS Singer_Count, singer.Country FROM singer GROUP BY singer.Country
SELECT Country, COUNT(Singer_ID) AS Singer_Count FROM singer GROUP BY Country
SELECT s.Name, s.Song_Name FROM singer AS s INNER JOIN singer_in_concert AS sic ON s.Singer_ID = sic.Singer_ID WHERE s.Age > ( SELECT AVG(Age) FROM singer );
SELECT Song_Name FROM singer WHERE Age > ( SELECT AVG(Age) FROM singer )
SELECT Location, Name FROM stadium WHERE Capacity BETWEEN 5000 AND 10000;
SELECT T1.Location, T1.Name FROM stadium AS T1 WHERE 5000 <= T1.Capacity AND T1.Capacity <= 10000;
SELECT MAX(Capacity), AVG(Average) FROM stadium;
SELECT AVG(Capacity) AS Average_Capacity, MAX(Capacity) AS Maximum_Capacity FROM stadium;
SELECT Name, Capacity FROM stadium WHERE (Stadium_ID, Average) IN ( SELECT Stadium_ID, AVG(Average) as avg_attendance FROM concert JOIN stadium ON concert.Stadium_ID = stadium.Stadium_ID GROUP BY Stadium_ID );
SELECT Name, Capacity FROM stadium ORDER BY Average DESC LIMIT 1;
SELECT COUNT(concert_ID) FROM concert WHERE Year IN ('2014', '2015');
SELECT COUNT(concert_ID) FROM concert WHERE Year IN ('2014', '2015')
SELECT T1.Name, COUNT(T2.concert_ID) FROM stadium AS T1 INNER JOIN concert AS T2 ON T1.Stadium_ID = T2.Stadium_ID GROUP BY T1.Stadium_ID, T1.Name
SELECT s.Stadium_ID, COUNT(c.concert_ID) AS Concerts_Played FROM stadium s LEFT JOIN concert c ON s.Stadium_ID = c.Stadium_ID GROUP BY s.Stadium_ID
SELECT s.Name, s.Capacity FROM stadium s INNER JOIN concert c ON s.Stadium_ID = c.Stadium_ID WHERE YEAR >= 2014 GROUP BY s.Stadium_ID ORDER BY COUNT(c.concert_ID) DESC LIMIT 1
SELECT s.Name, s.Capacity FROM stadium s JOIN concert c ON s.Stadium_ID = c.Stadium_ID WHERE c.Year > '2013' GROUP BY s.Name, s.Capacity ORDER BY COUNT(c.concert_ID) DESC LIMIT 1;
SELECT MAX(T2.Year) FROM singer_in_concert AS T1 INNER JOIN concert AS T2 ON T1.concert_ID = T2.concert_ID GROUP BY T2.Year ORDER BY COUNT(*) DESC LIMIT 1
SELECT Year FROM concert GROUP BY Year ORDER BY COUNT(concert_ID) DESC LIMIT 1;
SELECT Name FROM stadium WHERE Stadium_ID NOT IN (SELECT Stadium_ID FROM concert);
SELECT Name FROM stadium WHERE Stadium_ID NOT IN (SELECT Stadium_ID FROM concert);
SELECT DISTINCT T1.Country FROM singer AS T1 INNER JOIN singer AS T2 ON T1.Country = T2.Country AND T1.Age > 40 INNER JOIN singer AS T3 ON T3.Country = T2.Country AND T3.Age < 30;
SELECT s.Name FROM stadium AS s LEFT JOIN concert AS c ON s.Stadium_ID = c.Stadium_ID WHERE c.Year IS NULL OR c.Year <> '2014';
SELECT Name FROM stadium WHERE Stadium_ID NOT IN ( SELECT Stadium_ID FROM concert WHERE Year = '2014' );
SELECT c.concert_Name, c.Theme, COUNT(si.singer_ID) AS Number_of_Singers FROM concert c JOIN singer_in_concert si ON c.concert_ID = si.concert_ID GROUP BY c.concert_Name, c.Theme;
SELECT T1.concert_Name , T1.Theme , COUNT(T3.Singer_ID) FROM concert AS T1 INNER JOIN singer_in_concert AS T2 ON T1.concert_ID = T2.concert_ID INNER JOIN singer AS T3 ON T2.Singer_ID = T3.Singer_ID GROUP BY T1.concert_Name , T1.Theme
SELECT Name, COUNT(concert_ID) AS `Number of Concerts` FROM singer_in_concert JOIN singer ON singer_in_concert.Singer_ID = singer.Singer_ID GROUP BY Singer_ID;
SELECT T1.Name, COUNT(T2.concert_ID) FROM singer AS T1 INNER JOIN singer_in_concert AS T2 ON T1.Singer_ID = T2.Singer_ID GROUP BY T1.Name;
SELECT s.Name FROM singer_in_concert sic INNER JOIN concert c ON sic.concert_ID = c.concert_ID INNER JOIN singer s ON sic.Singer_ID = s.Singer_ID WHERE c.Year = '2014'
SELECT Name FROM singer WHERE Singer_ID IN ( SELECT Singer_ID FROM singer_in_concert JOIN concert ON singer_in_concert.concert_ID = concert.concert_ID WHERE YEAR = '2014' )
SELECT T1.Name, T1.Country FROM singer AS T1 INNER JOIN singer_in_concert AS T2 ON T1.Singer_ID = T2.Singer_ID WHERE T1.Song_Name LIKE '%Hey%'
SELECT T1.Name, T1.Country FROM singer AS T1 JOIN singer AS T2 ON T1.Singer_ID = T2.Singer_ID AND T2.Song_Name LIKE '%Hey%';
SELECT s.Name, s.Location FROM stadium AS s INNER JOIN concert AS c ON s.Stadium_ID = c.Stadium_ID WHERE YEAR = '2014' INTERSECT SELECT s.Name, s.Location FROM stadium AS s INNER JOIN concert AS c ON s.Stadium_ID = c.Stadium_ID WHERE YEAR = '2015'
SELECT T1.Name, T1.Location FROM stadium AS T1 JOIN concert AS T2 ON T1.Stadium_ID = T2.Stadium_ID WHERE T2.Year IN ('2014', '2015') GROUP BY T1.Name, T1.Location HAVING COUNT(T2.concert_ID) > 1
SELECT COUNT(*) FROM concert c JOIN stadium s ON c.Stadium_ID = s.Stadium_ID WHERE Capacity = ( SELECT MAX(Capacity) FROM stadium );
SELECT COUNT(concert.concert_ID) AS num_concerts FROM concert JOIN stadium ON concert.Stadium_ID = stadium.Stadium_ID WHERE stadium.Capacity = ( SELECT Capacity FROM stadium ORDER BY Capacity DESC LIMIT 1 );
SELECT COUNT(*) FROM Pets WHERE weight > 10
SELECT COUNT(DISTINCT T2.StuID) FROM Pets AS T1 INNER JOIN Has_Pet AS T2 ON T1.PetID = T2.PetID WHERE weight > 10
SELECT MAX(T1.pet_age) FROM Pets AS T1 INNER JOIN Has_Pet AS T2 ON T1.PetID = T2.PetID INNER JOIN Student AS T3 ON T2.StuID = T3.StuID
SELECT MIN(weight) AS YoungestDogWeight FROM Pets WHERE PetType = 'dog';
SELECT P.PetType, MAX(P.weight) AS MaxWeight FROM Pets P JOIN Has_Pet HP ON P.PetID = HP.PetID GROUP BY P.PetType;
SELECT PetType, MAX(weight) FROM Pets GROUP BY PetType;
SELECT COUNT(*) FROM Student AS S JOIN Has_Pet AS HP ON S.StuID = HP.StuID WHERE S.Age > 20;
SELECT COUNT(DISTINCT p.PetID) FROM Pets p JOIN Has_Pet hp ON p.PetID = hp.PetID JOIN Student s ON hp.StuID = s.StuID WHERE s.Age > 20;
SELECT COUNT(*) FROM Student s JOIN Has_Pet hp ON s.StuID = hp.StuID JOIN Pets p ON hp.PetID = p.PetID WHERE s.Sex = 'F' AND p.PetType = 'dog';
SELECT COUNT(*) FROM Student AS s INNER JOIN Has_Pet AS hp ON s.StuID = hp.StuID INNER JOIN Pets AS p ON hp.PetID = p.PetID WHERE s.Sex = 'F' AND p.PetType = 'Dog';
SELECT COUNT(DISTINCT PetType) FROM Pets;
SELECT COUNT(DISTINCT PetType) FROM Pets
SELECT Fname FROM Student WHERE StuID IN ( SELECT StuID FROM Has_Pet WHERE PetID IN ( SELECT PetID FROM Pets WHERE PetType = 'cat' OR PetType = 'dog' ) );
SELECT DISTINCT Fname FROM Student WHERE StuID IN ( SELECT StuID FROM Has_Pet WHERE PetID IN ( SELECT PetID FROM Pets WHERE PetType = 'cat' OR PetType = 'dog' ) );
SELECT Fname FROM Student JOIN Has_Pet ON Student.StuID = Has_Pet.StuID JOIN Pets ON Has_Pet.PetID = Pets.PetID WHERE Pets.PetType IN ('cat', 'dog') GROUP BY Fname HAVING COUNT(DISTINCT Pets.PetType) = 2
SELECT DISTINCT S.Fname FROM Student S JOIN Has_Pet HP ON S.StuID = HP.StuID JOIN Pets P ON HP.PetID = P.PetID WHERE (P.PetType = 'Cat' AND P.PetType = 'Dog')
SELECT s.Lname, s.Fname, s.Age FROM Student s WHERE s.StuID NOT IN ( SELECT h.PetID FROM Has_Pet h JOIN Pets p ON h.PetID = p.PetID );
SELECT S.Fname, S.LName, S.Age FROM Student AS S WHERE S.StuID NOT IN ( SELECT HP.StuID FROM Has_Pet AS HP );
SELECT StuID FROM Student WHERE StuID NOT IN ( SELECT StuID FROM Has_Pet WHERE PetID IN ( SELECT PetID FROM Pets WHERE PetType = 'Cat' ) );
SELECT StuID FROM Student WHERE StuID NOT IN ( SELECT StuID FROM Has_Pet AS H JOIN Pets AS P ON H.PetID = P.PetID WHERE P.pet_type = 'cat' );
SELECT S.Fname, S.Age FROM Student AS S LEFT JOIN Has_Pet AS H ON S.StuID = H.StuID WHERE H.PetID NOT IN (SELECT P.PetID FROM Pets P WHERE P.PetType = 'Cat');
SELECT T1.Fname FROM Student AS T1 WHERE T1.StuID NOT IN ( SELECT T2.StuID FROM Has_Pet AS T2 JOIN Pets AS T3 ON T2.PetID = T3.PetID WHERE T3.PetType = 'cat' );
SELECT P.PetType, P.weight FROM Pets P JOIN Has_Pet HP ON P.PetID = HP.PetID JOIN Student S ON HP.StuID = S.StuID ORDER BY S.Age LIMIT 1
SELECT p.PetType, MIN(p.pet_age) AS age, MIN(p.weight) AS weight FROM Pets p JOIN Has_Pet hp ON p.PetID = hp.PetID;
SELECT p.PetID, p.weight FROM Pets AS p JOIN Has_Pet AS h ON p.PetID = h.PetID WHERE p.pet_age > 1;
SELECT P.PetID, P.weight FROM Pets P JOIN Has_Pet HP ON P.PetID = HP.PetID WHERE P.pet_age > 1;
SELECT PetType, AVG(pet_age) as average_age, MAX(pet_age) as max_age FROM Pets GROUP BY PetType;
SELECT p.PetType, AVG(p.pet_age) as avg_age, MAX(p.pet_age) as max_age FROM Pets p GROUP BY p.PetType;
SELECT AVG(P.weight) AS AverageWeight FROM Pets P JOIN Has_Pet HP ON P.PetID = HP.PetID;
SELECT AVG(p.weight) AS avg_weight, p.PetType FROM Pets p JOIN Has_Pet h ON p.PetID = h.PetID GROUP BY p.PetType
SELECT S.Fname, S.Age FROM Student AS S INNER JOIN Has_Pet AS HP ON S.StuID = HP.StuID;
SELECT DISTINCT Fname, Age FROM Student JOIN Has_Pet ON Student.StuID = Has_Pet.StuID;
SELECT DISTINCT H.PetID FROM Has_Pet AS H JOIN Student AS S ON H.StuID = S.StuID WHERE S.LName = 'Smith';
SELECT DISTINCT HP.PetID FROM Has_Pet HP JOIN Student S ON HP.StuID = S.StuID WHERE S.LName = 'Smith';
SELECT StuID, COUNT(*) FROM Has_Pet GROUP BY StuID
SELECT StuID, COUNT(PetID) AS PetCount FROM Has_Pet GROUP BY StuID;
SELECT s.Fname, s.Sex FROM Student s JOIN Has_Pet hp ON s.StuID = hp.StuID GROUP BY s.StuID HAVING COUNT(hp.PetID) > 1;
SELECT Fname, Sex FROM Student s WHERE StuID IN (SELECT StuID FROM Has_Pet GROUP BY StuID HAVING COUNT(*) > 1);
SELECT S.LName FROM Student S JOIN Has_Pet HP ON S.StuID = HP.StuID JOIN Pets P ON HP.PetID = P.PetID WHERE P.pet_age = 3;
SELECT S.LName FROM Student S JOIN Has_Pet HP ON S.StuID = HP.StuID JOIN Pets P ON HP.PetID = P.PetID WHERE P.pet_age = 3;
SELECT AVG(T1.Age) FROM Student T1 LEFT JOIN Has_Pet T2 ON T1.StuID = T2.StuID WHERE T2.PetID IS NULL;
SELECT AVG(Age) FROM Student WHERE StuID NOT IN (SELECT StuID FROM Has_Pet);
SELECT COUNT(*) FROM continents;
SELECT COUNT(ContId) FROM continents
SELECT c.ContId, c.Continent, COUNT(*) AS NumCountries FROM continents c JOIN countries co ON c.ContId = co.Continent GROUP BY c.ContId, c.Continent;
SELECT c.ContId, c.Continent, COUNT(*) as numCountries FROM continents c JOIN countries co ON c.ContId = co.Continent GROUP BY c.ContId;
SELECT COUNT(CountryId) FROM countries;
SELECT COUNT(CountryId) FROM countries;
SELECT C.Maker, C.Id, COUNT(M.Model) AS NumberOfModels FROM car_makers C INNER JOIN model_list M ON C.Id = M.Maker GROUP BY C.Maker, C.Id
SELECT cm.Id, cm.FullName, COUNT(ml.ModelId) AS NumberOfModels FROM car_makers cm JOIN model_list ml ON cm.Id = ml.Maker GROUP BY cm.Id, cm.FullName;
SELECT Horsepower FROM cars_data ORDER BY CAST(Horsepower AS INTEGER) ASC LIMIT 1;
SELECT Model FROM car_names WHERE MakeId = ( SELECT MakeId FROM cars_data ORDER BY Horsepower LIMIT 1 );
SELECT T3.Model FROM cars_data AS T1 JOIN car_makers AS T2 ON T1.Id = ( SELECT Maker FROM model_list WHERE ModelId = T2.id ) JOIN model_list AS T3 ON T3.Maker = T2.Id AND T3.ModelId = ( SELECT ModelId FROM cars_data WHERE Weight < AVG(Weight) GROUP BY Id HAVING AVG(Weight) > 0 );
SELECT T2.Model FROM car_makers AS T1 JOIN model_list AS T2 ON T1.Id = T2.Maker JOIN cars_data AS T3 ON T2.ModelId = T3.Id WHERE T3.Weight < ( SELECT AVG(Weight) FROM cars_data );
SELECT T1.Maker FROM car_makers AS T1 INNER JOIN model_list AS T2 ON T1.Id = T2.Maker INNER JOIN cars_data AS T3 ON T2.ModelId = T3.Id WHERE T3.Year = 1970 GROUP BY T1.Maker HAVING COUNT(T1.Maker) > 0
SELECT DISTINCT T1.Maker FROM car_makers AS T1 INNER JOIN cars_data AS T2 ON T1.Id = T2.Id WHERE T2.Year = 1970
SELECT c.Maker, c.Year FROM cars_data c JOIN car_makers ON c.Maker = car_makers.Maker WHERE c.Year = (SELECT MIN(Year) FROM cars_data);
SELECT T1.Maker FROM car_makers AS T1 JOIN cars_data AS T2 ON T1.Id = 0 -- this join will not work as expected WHERE T2.Year = (SELECT MIN(Year) FROM cars_data);
SELECT DISTINCT Model FROM model_list WHERE Maker IN ( SELECT Maker FROM cars_data WHERE Year > 1980 );
SELECT DISTINCT M.Model FROM model_list AS M INNER JOIN cars_data AS C ON M.ModelId = 0;
SELECT c.Continent, COUNT(DISTINCT cm.Maker) AS CarMakerCount FROM continents c JOIN countries co ON c.ContId = co.Continent JOIN car_makers cm ON co.CountryName = cm.Country GROUP BY c.Continent;
SELECT c.Continent, COUNT(cm.Maker) AS TotalMakers FROM continents c INNER JOIN car_makers cm ON TRUE -- assuming there's no direct relationship between ContId and Id columns GROUP BY c.Continent;
SELECT CountryName FROM countries WHERE CountryId = ( SELECT CountryId FROM car_makers GROUP BY Country ORDER BY COUNT(Country) DESC LIMIT 1 );
SELECT CountryName FROM countries JOIN car_makers ON countries.CountryId = car_makers.Country GROUP BY CountryName ORDER BY COUNT(Maker) DESC LIMIT 1;
SELECT COUNT(model_list.ModelId), car_makers.FullName FROM model_list INNER JOIN car_makers ON model_list.Maker = car_makers.Id GROUP BY car_makers.FullName
SELECT m.Id, m.FullName, COUNT(ml.ModelId) AS CarModels FROM car_makers m JOIN model_list ml ON m.Id = ml.Maker GROUP BY m.Id, m.FullName;
SELECT Accelerate FROM cars_data AS cd INNER JOIN car_names AS cn ON cd.MakeId = cn.MakeId WHERE cn.Model = 'amc hornet sportabout (sw)';
SELECT t2.Accelerate FROM car_names AS t1 INNER JOIN cars_data AS t2 ON t1.Model = 'AMC Hornet Sportabout (SW)' AND t2.MakeId = t1.MakeId WHERE t1.Model LIKE '%(SW)';
SELECT COUNT(Id) FROM car_makers WHERE Country = 'France'
SELECT COUNT(Id) FROM car_makers WHERE Country = 'France';
SELECT COUNT(DISTINCT m.Model) FROM model_list m JOIN car_makers c ON m.Maker = c.Id WHERE c.Country = 'USA'
SELECT COUNT(*) FROM cars_data AS cd INNER JOIN car_makers AS cm ON cd.Id = cm.Id WHERE cm.Country = 'United States';
SELECT AVG(CAST(REPLACE(MPG, 'mpg', '') AS REAL)) FROM cars_data WHERE Cylinders = 4;
SELECT AVG(T2.MPG) FROM cars_data AS T1 INNER JOIN model_list AS T2 ON T1.Id = T2.ModelId WHERE T1.Cylinders = 4
SELECT MIN(T1.Weight) FROM cars_data AS T1 INNER JOIN car_makers AS T2 ON T1.Year = 1974 AND T1.Cylinders = 8
SELECT MIN(Weight) FROM cars_data WHERE Cylinders = 8 AND Year = 1974;
SELECT DISTINCT m.Maker, ml.Model FROM car_makers AS m INNER JOIN model_list AS ml ON m.Id = ml.Maker;
SELECT DISTINCT T1.Maker, T2.Model FROM car_makers AS T1 INNER JOIN model_list AS T2 ON T1.Id = T2.Maker;
SELECT c.CountryName, c.CountryId FROM countries c JOIN car_makers cm ON c.CountryName = cm.Country GROUP BY c.CountryId HAVING COUNT(cm.Id) > 0
SELECT c.CountryId, c.CountryName FROM countries c JOIN car_makers cm ON c.CountryName = cm.Country GROUP BY c.CountryId;
SELECT COUNT(Id) FROM cars_data WHERE Horsepower > 150
SELECT COUNT(Id) FROM cars_data WHERE Horsepower > 150
SELECT AVG(Weight) FROM cars_data GROUP BY Year;
SELECT AVG(T1.Weight), T1.Year FROM cars_data AS T1 GROUP BY T1.Year;
SELECT DISTINCT T1.CountryName FROM countries AS T1 INNER JOIN car_makers AS T2 ON T1.CountryName = T2.Country WHERE T1.Continent = 1 AND T2.FullName IN ( SELECT CountryName FROM countries WHERE Continent = 1 GROUP BY CountryName HAVING COUNT(T2.Maker) >= 3 );
SELECT c.CountryName FROM countries c JOIN car_makers m ON c.CountryId = m.Country GROUP BY c.CountryName HAVING COUNT(m.Maker) >= 3;
SELECT T1.MakeId, MAX(T2.Horsepower), T1.Model FROM car_names AS T1 INNER JOIN cars_data AS T2 ON T1.Model = T2.MPG WHERE T2.Cylinders = 3 GROUP BY T1.Model HAVING COUNT(DISTINCT T2.Id) >= ALL ( SELECT COUNT(*) FROM model_list AS T3 WHERE T2.Model = T3.Model )
SELECT T1.FullName, T2.Horsepower FROM car_makers AS T1 INNER JOIN model_list AS T2 ON T1.Id = T2.Maker INNER JOIN cars_data AS T3 ON T2.ModelId = T3.Id WHERE T3.Cylinders = 3 ORDER BY CAST(REPLACE(T3.Horsepower, 'hp', '') AS INTEGER) DESC LIMIT 1
SELECT m.Model FROM cars_data c JOIN model_list ml ON c.Id = ml.ModelId JOIN car_makers cm ON ml.Maker = cm.Id WHERE c.MPG = ( SELECT MAX(MPG) FROM cars_data );
SELECT T2.Model FROM cars_data AS T1 INNER JOIN car_names AS T2 ON T1.MPG = T2.MakeId;
SELECT CAST(SUM(CAST(REPLACE(Horsepower, 'hp', '') AS REAL)) AS REAL) / COUNT(Id) FROM cars_data WHERE Year < 1980;
SELECT AVG(CAST(Horsepower AS REAL)) FROM cars_data WHERE Year < 1980
SELECT AVG(T2.Edispl) FROM model_list AS T1 INNER JOIN cars_data AS T2 ON T1.ModelId = T2.Id WHERE T1.Maker = (SELECT Id FROM car_makers WHERE FullName = 'Volvo')
SELECT AVG(t2.Edispl) FROM model_list AS t1 INNER JOIN cars_data AS t2 ON t1.ModelId = t2.Id WHERE t1.Maker = (SELECT Id FROM car_makers WHERE FullName = 'VOLVO')
SELECT MAX(Accelerate) FROM cars_data GROUP BY Cylinders
SELECT MAX(Accelerate) AS MaxAccelerate FROM cars_data GROUP BY Cylinders;
SELECT Model FROM model_list WHERE Maker = ( SELECT Maker FROM model_list GROUP BY Maker ORDER BY COUNT(Maker) DESC LIMIT 1 );
SELECT Model FROM model_list GROUP BY Model ORDER BY COUNT(ModelId) DESC LIMIT 1;
SELECT COUNT(*) FROM cars_data WHERE Cylinders > 4;
SELECT COUNT(Id) FROM cars_data WHERE Cylinders > 4
SELECT COUNT(Id) FROM cars_data WHERE Year = 1980;
SELECT COUNT(*) FROM cars_data WHERE Year = 1980;
SELECT COUNT(*) FROM model_list AS m JOIN car_makers AS c ON m.Maker = c.Id WHERE c.FullName = 'American Motor Company'
SELECT COUNT(*) FROM cars_data INNER JOIN car_makers ON cars_data.`Year` = 0 AND car_makers.Maker = 'American Motor Company'
SELECT FullName, Id FROM car_makers WHERE Id IN ( SELECT Maker FROM model_list GROUP BY Maker HAVING COUNT(*) > 3 );
SELECT T1.Id, T1.Maker FROM car_makers AS T1 JOIN model_list AS T2 ON T1.Id = T2.Maker GROUP BY T1.Id, T1.Maker HAVING COUNT(T2.ModelId) > 3;
SELECT DISTINCT C.Model FROM cars_data AS C INNER JOIN car_makers AS M ON C.Maker = M.Id WHERE (M.FullName = 'General Motors') OR (C.Weight > 3500);
SELECT T1.Model FROM model_list AS T1 INNER JOIN car_makers AS T2 ON T1.Maker = T2.Id WHERE (T2.Maker LIKE 'General Motors' OR cars_data.Weight > 3500)
SELECT YEAR FROM cars_data WHERE Weight BETWEEN 3000 AND 4000;
SELECT DISTINCT YEAR FROM cars_data WHERE Weight < 4000 OR Weight > 3000;
SELECT Horsepower FROM cars_data ORDER BY Accelerate DESC LIMIT 1;
SELECT Horsepower FROM cars_data WHERE Accelerate = ( SELECT MAX(Accelerate) FROM cars_data );
SELECT T2.Cylinders FROM car_makers AS T1 INNER JOIN cars_data AS T2 ON T1.Maker = T2.ModelId AND T1.FullName = 'Volvo' ORDER BY T2.Accelerate ASC LIMIT 1;
SELECT T2.Cylinders FROM model_list AS T1 INNER JOIN cars_data AS T2 ON T1.ModelId = T2.Id WHERE T1.Maker = ( SELECT Maker FROM car_makers WHERE FullName = 'Volvo' ) AND T2.Accelerate = ( SELECT MIN(Accelerate) FROM cars_data );
SELECT COUNT(*) FROM cars_data WHERE Accelerate > ( SELECT MAX(CAST(SUBSTR(Horsepower, 1, LENGTH(Horsepower) - 3) AS REAL)) FROM cars_data );
SELECT COUNT(*) FROM cars_data WHERE Accelerate > ( SELECT MAX(CAST(SUBSTR(Horsepower, 1, INSTR(Horsepower, ' ') - 1) AS REAL)) FROM cars_data );
SELECT COUNT(DISTINCT c.CountryId) FROM countries c INNER JOIN car_makers m ON c.CountryName = m.Country GROUP BY c.CountryId HAVING COUNT(m.Id) > 2
SELECT COUNT(CountryId) FROM countries JOIN car_makers ON countries.CountryName = car_makers.Country GROUP BY car_makers.Country HAVING COUNT(car_makers.Maker) > 2;
SELECT COUNT(Id) FROM cars_data WHERE Cylinders > 6;
SELECT COUNT(Id) FROM cars_data WHERE Cylinders > 6
SELECT T1.Model FROM model_list AS T1 INNER JOIN cars_data AS T2 ON T1.ModelId = T2.Id WHERE T2.Cylinders = 4 ORDER BY CAST(REPLACE(T2.Horsepower, 'hp', '') AS INT) DESC LIMIT 1
SELECT T1.Model FROM car_names AS T1 INNER JOIN model_list AS T2 ON T1.MakeId = T2.Maker WHERE T2.ModelId IN ( SELECT ModelId FROM model_list WHERE Cylinders = 4 ) ORDER BY Horsepower DESC LIMIT 1
SELECT cm.Id AS makeid, cm.FullName FROM car_makers cm JOIN cars_data cd ON cm.Id = cd.MakerID WHERE Horsepower > ( SELECT MIN(Horsepower) FROM cars_data ) AND Cylinders <= 3;
SELECT T3.Id, T3.Maker FROM cars_data AS T1 JOIN model_list AS T2 ON T1.Id = T2.ModelId JOIN car_makers AS T3 ON T2.Maker = T3.Id WHERE T1.Horsepower < '100' AND T1.Cylinders > 4;
SELECT MAX(CAST(MPG AS REAL)) FROM cars_data WHERE Cylinders = 8 OR Year < 1980;
SELECT MAX(MPG) FROM cars_data WHERE Cylinders = 8 OR Year < 1980;
SELECT DISTINCT c1.Model FROM car_makers c2 JOIN cars_data c1 ON c1.Maker = c2.Id WHERE c1.Weight < 3500 AND c2.Id != (SELECT Id FROM car_makers WHERE FullName = 'Ford Motor Company');
SELECT T2.Model FROM cars_data AS T1 JOIN model_list AS T2 ON T1.Id = T2.ModelId JOIN car_makers AS T3 ON T2.Maker = T3.Id WHERE T1.Weight < 3500 AND T3.FullName NOT LIKE '%Ford Motor Company%';
SELECT T2.CountryName FROM car_makers AS T1 LEFT JOIN countries AS T2 ON T1.Country = T2.CountryId WHERE T1.Maker IS NULL;
SELECT c.CountryName FROM countries c WHERE c.CountryId NOT IN (SELECT cm.Country FROM car_makers cm)
SELECT m.Id, m.Maker FROM car_makers AS m GROUP BY m.Id, m.Maker HAVING COUNT(DISTINCT ml.ModelId) >= 2 AND COUNT(DISTINCT m.Id) > 3;
SELECT cm.Id, cm.Maker FROM car_makers cm JOIN model_list ml ON cm.Id = ml.Maker GROUP BY cm.Id, cm.Maker HAVING COUNT(ml.ModelId) >= 2 AND SUM(cds.Year * 12 + (SELECT MAX(Year) FROM cars_data)) > 3
SELECT c.CountryId, c.CountryName FROM countries AS c INNER JOIN car_makers AS cm ON c.CountryName = cm.Country WHERE (SELECT COUNT(*) FROM car_makers WHERE Country = c.CountryName) > 3 UNION SELECT c.CountryId, c.CountryName FROM countries AS c INNER JOIN cars_data AS cd ON c.CountryName = ( SELECT Country FROM car_makers WHERE Maker = 'Fiat' ) GROUP BY c.CountryId, c.CountryName;
SELECT c.CountryId, c.CountryName FROM countries c WHERE c.CountryId IN ( SELECT cm.Country FROM car_makers cm GROUP BY cm.Country HAVING COUNT(cm.Id) > 3 ) OR EXISTS ( SELECT 1 FROM model_list ml JOIN cars_data cd ON ml.ModelId = cd.ModelId WHERE ml.Maker IN (SELECT Id FROM car_makers WHERE Maker LIKE 'Fiat') AND c.CountryName = ml.Country );
SELECT T2.Country FROM airlines AS T1 INNER JOIN flights AS T2 ON T1.uid = T2.Airline WHERE T1.Airline = 'JetBlue Airways'
SELECT Country FROM airlines WHERE Airline = 'JetBlue Airways'
SELECT T2.Abbreviation FROM airlines AS T1 INNER JOIN flights AS T2 ON T1.uid = T2.Airline WHERE T1.Airline = 'JetBlue Airways'
SELECT Abbreviation FROM airlines WHERE Airline = 'Jetblue Airways'
SELECT T1.Airline, T1.Abbreviation FROM airlines AS T1 WHERE T1.Country = 'USA';
SELECT T1.Airline, T1.Abbreviation FROM airlines AS T1 WHERE T1.Country = 'USA';
SELECT AirportCode, AirportName FROM airports WHERE City = 'Anthony'
SELECT T2.AirportCode, T2.AirportName FROM airports AS T1 INNER JOIN airlines AS T2 ON T1.Country = T2.Country WHERE T1.City = 'Anthony';
SELECT COUNT(*) FROM airlines
SELECT COUNT(uid) FROM airlines;
SELECT COUNT(uid) FROM airports;
SELECT COUNT(DISTINCT AirportCode) FROM airports
SELECT COUNT(flightno) FROM flights;
SELECT COUNT(*) FROM flights
SELECT Airline FROM airlines WHERE Abbreviation = 'UAL'
SELECT Airline FROM airlines WHERE Abbreviation = 'UAL';
SELECT COUNT(*) FROM airlines WHERE Country = 'USA';
SELECT COUNT(DISTINCT uid) FROM airlines WHERE Country = 'USA'
SELECT T2.City, T2.Country FROM airports AS T1 INNER JOIN airlines AS T2 ON T1.CountryAbbrev = T2.Abbreviation WHERE T1.AirportName = 'Alton Airport';
SELECT airports.City, airports.Country FROM airports WHERE AirportName = 'Alton airport';
SELECT AirportName FROM airports WHERE AirportCode = 'AKO';
SELECT AirportName FROM airports WHERE AirportCode = 'AKO';
SELECT T2.AirportName FROM airports AS T1 INNER JOIN airlines AS T2 ON T1.Country = T2.Country WHERE T1.City LIKE 'Aberdeen'
SELECT AirportName FROM airports WHERE City = 'Aberdeen';
SELECT COUNT(*) FROM flights JOIN airports ON SourceAirport = AirportCode WHERE City = 'APG'












SELECT COUNT(*) FROM flights JOIN airports AS dest ON dest.AirportCode = flights.DestAirport JOIN airlines AS ua ON ua.uid = flights.Airline JOIN airports AS asy ON asy.AirportCode = 'ASY' WHERE ua.Abbreviation = 'UA';
SELECT COUNT(f.flightno) FROM flights f JOIN airlines a ON f.airline = a.uid WHERE a.Airline = 'United Airlines' AND f.SourceAirport = 'AHD';
SELECT COUNT(*) FROM flights f JOIN airports a ON f.SourceAirport = a.AirportCode JOIN airlines ai ON f.Airline = ai.uid WHERE ai.Abbreviation = 'UA' AND a.City = 'AHD';
SELECT COUNT(flights.FlightNo) FROM flights JOIN airports ON flights.DestAirport = airports.AirportCode WHERE airports.City = 'Aberdeen' AND airlines.Abbreviation = 'UA';
SELECT COUNT(*) FROM flights AS T1 INNER JOIN airports AS T2 ON T1.DestAirport = T2.AirportCode INNER JOIN airlines AS T3 ON T1.Airline = T3.uid WHERE T2.City = 'Aberdeen' AND T3.Abbreviation = 'UA';
SELECT T3.City FROM flights AS T1 INNER JOIN airports AS T2 ON T1.DestAirport = T2.AirportCode INNER JOIN airports AS T3 ON T1.SourceAirport = T3.AirportCode GROUP BY T3.City ORDER BY COUNT(T1.FlightNo) DESC LIMIT 1
SELECT t3.City FROM flights AS t1 JOIN airports AS t2 ON t1.SourceAirport = t2.AirportCode JOIN airlines AS t3 ON t1.Airline = t3.uid WHERE t2.CountryAbbrev NOT IN ('US', 'CA') AND t1.DestAirport = ( SELECT DestAirport FROM flights AS t5 JOIN airports AS t6 ON t5.DestAirport = t6.AirportCode GROUP BY t6.City ORDER BY COUNT(t5.FlightNo) DESC LIMIT 1 )
SELECT T2.City FROM flights AS T1 JOIN airports AS T2 ON T1.SourceAirport = T2.AirportCode GROUP BY T2.City ORDER BY COUNT(T1.FlightNo) DESC LIMIT 1;
SELECT T2.City FROM flights AS T1 INNER JOIN airports AS T2 ON T1.SourceAirport = T2.AirportCode GROUP BY T2.City ORDER BY COUNT(T1.SourceAirport) DESC LIMIT 1
SELECT T1.AirportCode FROM airports AS T1 INNER JOIN flights AS T2 ON T1.City = T2.SourceAirport GROUP BY T1.AirportCode ORDER BY COUNT(T2.FlightNo) DESC LIMIT 1;
SELECT T3.AirportCode FROM flights AS T1 JOIN airports AS T2 ON T1.SourceAirport = T2.City OR T1.DestAirport = T2.City JOIN airports AS T3 ON T1.SourceAirport = T3.City OR T1.DestAirport = T3.City AND T3.AirportName = (SELECT AirportName FROM airports WHERE City IN (T1.SourceAirport, T1.DestAirport) GROUP BY AirportName ORDER BY COUNT(City) DESC LIMIT 1);
SELECT T2.AirportCode FROM airports AS T1 JOIN flights AS T2 ON T1.AirportName = T2.DestAirport GROUP BY T2.SourceAirport ORDER BY COUNT(T2.FlightNo) ASC LIMIT 1;
SELECT t3.AirportName FROM flights AS t1 JOIN airports AS t2 ON t1.DestAirport = t2.AirportCode JOIN airports AS t3 ON t1.SourceAirport = t3.AirportCode GROUP BY t3.AirportName ORDER BY COUNT(t1.FlightNo) LIMIT 1
SELECT Airline FROM airlines GROUP BY Airline ORDER BY COUNT(flights.Airline) DESC LIMIT 1;
SELECT Airline FROM airlines AS a INNER JOIN flights AS f ON a.uid = f.Airline GROUP BY Airline ORDER BY COUNT(DestAirport) DESC LIMIT 1;
SELECT T1.Abbreviation, T1.Country FROM airlines AS T1 INNER JOIN flights AS T2 ON T1.uid = T2.Airline GROUP BY T1.uid ORDER BY COUNT(T2.FlightNo) ASC LIMIT 1
SELECT T.Abbreviation, T.Country FROM airlines AS T INNER JOIN ( SELECT Airline, COUNT(*) AS numFlights FROM flights GROUP BY Airline ) AS F ON T.uid = F.Airline WHERE numFlights = ( SELECT MIN(numFlights) FROM ( SELECT Airline, COUNT(*) AS numFlights FROM flights GROUP BY Airline ) );
SELECT DISTINCT T1.Airline FROM airlines AS T1 JOIN flights AS T2 ON T1.uid = T2.Airline WHERE T2.SourceAirport = 'AHD';
SELECT DISTINCT T2.Airline FROM flights AS T1 INNER JOIN airlines AS T2 ON T1.Airline = T2.uid WHERE T1.SourceAirport = 'AHD';
SELECT T2.Airline FROM flights AS T1 INNER JOIN airlines AS T2 ON T1.Airline = T2.uid WHERE T1.DestAirport = 'AHD';
SELECT DISTINCT T2.Airline FROM flights AS T1 INNER JOIN airlines AS T2 ON T1.Airline = T2.uid WHERE T1.DestAirport = 'AHD'
SELECT T2.Airline FROM airports AS T1 INNER JOIN flights AS T2 ON T1.City = T2.DestAirport WHERE T1.AirportCode = 'APG' INTERSECT SELECT T2.Airline FROM airports AS T1 INNER JOIN flights AS T2 ON T1.City = T2.SourceAirport WHERE T1.AirportCode = 'CVO';
SELECT T3.Airline FROM flights AS T1 JOIN airports AS T2 ON T1.SourceAirport = T2.AirportCode JOIN airlines AS T3 ON T1.Airline = T3.uid WHERE T2.AirportName IN ('APG', 'CVO')
SELECT DISTINCT T1.Airline FROM flights AS T2 INNER JOIN airlines AS T1 ON T1.uid = T2.Airline WHERE T2.SourceAirport = 'CVO' AND T2.SourceAirport <> 'APG'
SELECT T1.Airline FROM airlines AS T1 INNER JOIN flights AS T2 ON T1.uid = T2.Airline WHERE T2.SourceAirport = 'CVO' AND T2.DestAirport != 'APG'
SELECT T1.Airline FROM airlines AS T1 INNER JOIN flights AS T2 ON T1.uid = T2.Airline GROUP BY T1.Airline HAVING COUNT(T2.FlightNo) >= 10;
SELECT T2.Airline FROM flights AS T1 JOIN airlines AS T2 ON T1.Airline = T2.uid GROUP BY T2.Airline HAVING COUNT(T1.FlightNo) >= 10;
SELECT Airline FROM flights GROUP BY Airline HAVING COUNT(flightno) < 200;
SELECT a.Airline FROM airlines a JOIN flights f ON a.uid = f.Airline GROUP BY a.Airline HAVING COUNT(f.FlightNo) < 200;
SELECT T2.FlightNo FROM airlines AS T1 INNER JOIN flights AS T2 ON T1.uid = T2.Airline WHERE T1.Airline = 'United Airlines';
SELECT FlightNo FROM flights JOIN airlines ON flights.Airline = airlines.uid WHERE airlines.Abbreviation = 'UA';
SELECT T3.FlightNo FROM airports AS T1 JOIN flights AS T2 ON T2.SourceAirport = T1.AirportCode JOIN airlines AS T3 ON T3.uid = T2.Airline WHERE T1.AirportName = 'APG';
SELECT T1.FlightNo FROM flights AS T1 INNER JOIN airports AS T2 ON T1.SourceAirport = T2.AirportCode WHERE T2.City = 'APG' AND T1.DestAirport IS NULL;
SELECT T3.FlightNo FROM flights AS T1 INNER JOIN airports AS T2 ON T1.DestAirport = T2.AirportCode INNER JOIN airports AS T3 ON T1.SourceAirport = T3.AirportCode WHERE T2.AirportName LIKE 'APG';
SELECT T2.FlightNo FROM flights AS T1 INNER JOIN airports AS T2 ON T1.SourceAirport = T2.AirportCode WHERE T2.AirportName = 'APG';
SELECT T1.FlightNo FROM flights AS T1 JOIN airports AS T2 ON T2.AirportCode = SUBSTR(T1.SourceAirport, 3)
SELECT DISTINCT T2.FlightNo FROM airports AS T1 JOIN flights AS T2 ON T1.City = 'Aberdeen' AND T2.SourceAirport = T1.AirportCode;
SELECT DISTINCT t2.FlightNo FROM flights AS t1 INNER JOIN airports AS t2 ON t1.DestAirport = t2.City WHERE t2.City = 'Aberdeen';
SELECT DISTINCT f.FlightNo FROM flights AS f JOIN airports AS a ON f.DestAirport = a.AirportCode WHERE a.City = 'Aberdeen';
SELECT COUNT(*) FROM flights AS f INNER JOIN airports AS a ON f.DestAirport = a.AirportCode WHERE a.City IN ('Aberdeen', 'Abilene')
SELECT COUNT(flightno) FROM flights AS T1 INNER JOIN airports AS T2 ON T1.sourceairport = T2.airportcode WHERE T2.city IN ('Aberdeen', 'Abilene')
SELECT AirportName FROM airports WHERE City NOT IN ( SELECT SourceAirport FROM flights UNION SELECT DestAirport FROM flights )
SELECT DISTINCT AirportName FROM airports WHERE AirportCode NOT IN ( SELECT SourceAirport FROM flights UNION SELECT DestAirport FROM flights );
SELECT COUNT(*) FROM employee
SELECT COUNT(*) FROM employee
SELECT Name FROM employee ORDER BY Age ASC;
SELECT Name FROM employee ORDER BY Age ASC;
SELECT City, COUNT(Employee_ID) AS Number_of_Employees FROM employee GROUP BY City;
SELECT City, COUNT(Employee_ID) FROM employee GROUP BY City;
SELECT T1.City FROM employee AS T1 INNER JOIN hiring AS T2 ON T1.Employee_ID = T2.Employee_ID WHERE T1.Age < 30 GROUP BY T1.City HAVING COUNT(T1.City) > 1
SELECT City FROM employee WHERE Age < 30 GROUP BY City HAVING COUNT(Employee_ID) > 1
SELECT COUNT(*) as shop_count, Location FROM shop GROUP BY Location;
SELECT Location, COUNT(Shop_ID) AS Number_of_shops FROM shop GROUP BY Location;
SELECT T1.Manager_name, T2.District FROM shop AS T1 INNER JOIN employee AS T2 ON T1.Shop_ID = ( SELECT Shop_ID FROM shop ORDER BY Number_products DESC LIMIT 1 )
SELECT T1.Manager_name, T2.District FROM shop AS T1 INNER JOIN shop AS T2 ON T1.Shop_ID = T2.Shop_ID WHERE T2.Number_products = ( SELECT MAX(Number_products) FROM shop )
SELECT MIN(Number_products) AS Min_Products, MAX(Number_products) AS Max_Products FROM shop;
SELECT MIN(Number_products) AS Min_Products, MAX(Number_products) AS Max_Products FROM shop;
SELECT Name, Location, District FROM shop ORDER BY Number_products DESC;
SELECT Name, Location, District FROM shop ORDER BY Number_products DESC;
SELECT Name FROM shop WHERE Number_products > ( SELECT AVG(Number_products) FROM shop );
SELECT Name FROM shop WHERE Number_products > ( SELECT AVG(Number_products) FROM shop );
SELECT T1.Name FROM employee AS T1 INNER JOIN evaluation AS T2 ON T1.Employee_ID = T2.Employee_ID GROUP BY T1.Name ORDER BY COUNT(T2.Employee_ID) DESC LIMIT 1;
SELECT Name FROM employee WHERE Employee_ID = ( SELECT Employee_ID FROM evaluation GROUP BY Employee_ID ORDER BY COUNT(Employee_ID) DESC LIMIT 1 );
SELECT Name FROM employee WHERE Employee_ID = ( SELECT E.Employee_ID FROM evaluation E ORDER BY E.Bonus DESC LIMIT 1 );
SELECT T2.Name FROM evaluation AS T1 INNER JOIN employee AS T2 ON T2.Employee_ID = T1.Employee_ID ORDER BY T1.Bonus DESC LIMIT 1
SELECT e.Name FROM employee e WHERE e.Employee_ID NOT IN ( SELECT Employee_ID FROM evaluation );
SELECT Name FROM employee WHERE Employee_ID NOT IN ( SELECT Employee_ID FROM evaluation );
SELECT T1.Name FROM shop AS T1 JOIN hiring AS T2 ON T1.Shop_ID = T2.Shop_ID GROUP BY T2.Shop_ID ORDER BY COUNT(T2.Employee_ID) DESC LIMIT 1;
SELECT T2.Name FROM employee AS T1 JOIN shop AS T2 ON T1.City = T2.Location GROUP BY T2.Name ORDER BY COUNT(T1.Employee_ID) DESC LIMIT 1;
SELECT s.Name FROM shop s WHERE s.Shop_ID NOT IN ( SELECT h.Shop_ID FROM hiring h );
SELECT T2.Name FROM employee AS T1 LEFT JOIN shop AS T2 ON T1.Employee_ID IS NULL AND T2.Shop_ID = T1.Shop_ID;
SELECT s.Name AS Shop_Name, COUNT(h.Employee_ID) AS Number_of_Employees FROM hiring h INNER JOIN shop s ON h.Shop_ID = s.Shop_ID GROUP BY s.Name;
SELECT s.Name AS shop_name, COUNT(e.Employee_ID) AS employee_count FROM hiring h JOIN shop s ON h.Shop_ID = s.Shop_ID GROUP BY s.Name;
SELECT SUM(Bonus) FROM evaluation;
SELECT SUM(Bonus) AS Total_Bonus FROM evaluation;
SELECT h.Shop_ID, e.Name AS Employee_Name, e.Age, e.City, h.Start_from, h.Is_full_time FROM employee e JOIN hiring h ON e.Employee_ID = h.Employee_ID;
SELECT h.Shop_ID, e.Name AS Employee_Name, h.Start_from, h.Is_full_time, e.City AS Employee_City FROM hiring h JOIN employee e ON h.Employee_ID = e.Employee_ID;
SELECT DISTINCT District FROM shop WHERE Number_products < 3000 INTERSECT SELECT DISTINCT District FROM shop WHERE Number_products > 10000
SELECT DISTINCT T1.District FROM shop AS T1 INNER JOIN shop AS T2 ON T1.District = T2.District WHERE T1.Number_products < 3000 AND T2.Number_products > 10000
SELECT COUNT(DISTINCT Location) FROM shop;
SELECT COUNT(DISTINCT Location) AS num_distinct_locations FROM shop
SELECT COUNT(Document_ID) FROM Documents;
SELECT COUNT(Document_ID) FROM Documents
SELECT Document_ID, Document_Name, Document_Description FROM Documents
SELECT d.Document_ID, d.Document_Name, d.Document_Description FROM Documents d;
SELECT DISTINCT T1.Document_Name, T1.Template_ID FROM Documents AS T1 WHERE T1.Document_Description LIKE '%w%';
SELECT d.Document_Name, d.Template_ID FROM Documents d WHERE d.Document_Description LIKE '%w%';
SELECT Document_ID, Template_ID, Document_Description FROM Documents WHERE Document_Name = 'Robbin CV';
SELECT d.Document_ID, t.Template_ID, d.Document_Description FROM Documents AS d INNER JOIN Templates AS t ON d.Template_ID = t.Template_ID WHERE d.Document_Name = 'Robbin CV';
SELECT COUNT(DISTINCT t.Template_ID) FROM Templates t;
SELECT COUNT(Template_ID) FROM Templates GROUP BY Template_ID;
SELECT COUNT(DISTINCT Document_ID) FROM Documents JOIN Templates ON Documents.Template_ID = Templates.Template_ID WHERE Templates.Template_Type_Code = 'PPT';
SELECT COUNT(DISTINCT d.Document_ID) FROM Documents d INNER JOIN Templates t ON d.Template_ID = t.Template_ID INNER JOIN Ref_Template_Types rtt ON t.Template_Type_Code = rtt.Template_Type_Code WHERE rtt.Template_Type_Description = 'PPT';
SELECT Template_ID, COUNT(Document_ID) FROM Documents GROUP BY Template_ID;
SELECT T.Template_ID, COUNT(D.Document_ID) AS Total_Usage_Count FROM Templates T JOIN Documents D ON T.Template_ID = D.Template_ID GROUP BY T.Template_ID;
SELECT T.Template_ID, T.Template_Type_Code FROM Templates T JOIN Documents D ON T.Template_ID = D.Template_ID GROUP BY T.Template_ID, T.Template_Type_Code ORDER BY COUNT(D.Document_ID) DESC LIMIT 1;
SELECT t.Template_ID, tt.Template_Type_Code FROM Templates t JOIN Ref_Template_Types tt ON t.Template_Type_Code = tt.Template_Type_Code GROUP BY t.Template_ID, tt.Template_Type_Code ORDER BY COUNT(DISTINCT d.Document_ID) DESC LIMIT 1;
SELECT T1.Template_ID FROM Templates AS T1 JOIN Documents AS T2 ON T1.Template_ID = T2.Template_ID GROUP BY T1.Template_ID HAVING COUNT(T2.Document_ID) > 1
SELECT Template_ID FROM Templates t JOIN Documents d ON t.Template_ID = d.Template_ID GROUP BY t.Template_ID HAVING COUNT(d.Document_ID) > 1
SELECT DISTINCT T.Template_ID FROM Templates T LEFT JOIN Documents D ON T.Template_ID = D.Template_ID WHERE D.Template_ID IS NULL;
SELECT T1.Template_ID FROM Templates AS T1 WHERE T1.Template_ID NOT IN ( SELECT Template_ID FROM Documents );
SELECT COUNT(Template_ID) FROM Templates
SELECT COUNT(Template_ID) FROM Templates
SELECT T1.Template_ID, T1.Version_Number, T1.Template_Type_Code FROM Templates AS T1;
SELECT Templates.Template_ID, Templates.Version_Number, Templates.Template_Type_Code FROM Templates;
SELECT DISTINCT Template_Type_Code FROM Templates;
SELECT DISTINCT Template_Type_Code FROM Ref_Template_Types;
SELECT T.Template_ID FROM Templates T INNER JOIN Ref_Template_Types RTT ON T.Template_Type_Code = RTT.Template_Type_Code WHERE RTT.Template_Type_Code IN ('PP', 'PPT');
SELECT Template_ID FROM Templates WHERE Template_Type_Code = 'PP' OR Template_Type_Code = 'PPT'
SELECT COUNT(Template_ID) FROM Templates WHERE Template_Type_Code = 'CV'
SELECT COUNT(Template_ID) FROM Templates JOIN Ref_Template_Types ON Templates.Template_Type_Code = Ref_Template_Types.Template_Type_Code WHERE Ref_Template_Types.Template_Type_Description = 'CV';
SELECT T1.Version_Number, T1.Template_Type_Code FROM Templates AS T1 INNER JOIN Ref_Template_Types ON T1.Template_Type_Code = Ref_Template_Types.Template_Type_Code WHERE T1.Version_Number > 5;
SELECT T1.Template_Type_Code FROM Templates AS T1 JOIN Ref_Template_Types AS T2 ON T1.Template_Type_Code = T2.Template_Type_Code WHERE T1.Version_Number > 5;
SELECT t1.Template_Type_Code, COUNT(t2.Template_ID) as Number_of_Templates FROM Ref_Template_Types AS t1 LEFT JOIN Templates AS t2 ON t1.Template_Type_Code = t2.Template_Type_Code GROUP BY t1.Template_Type_Code;
SELECT tt.Template_Type_Code, COUNT(t.Template_ID) as Template_Count FROM Ref_Template_Types tt JOIN Templates t ON tt.Template_Type_Code = t.Template_Type_Code GROUP BY tt.Template_Type_Code;
SELECT Template_Type_Code FROM Ref_Template_Types ORDER BY COUNT(Template_ID) DESC LIMIT 1;
SELECT Template_Type_Code FROM Ref_Template_Types WHERE Template_Type_Code = ( SELECT Template_Type_Code FROM Templates GROUP BY Template_Type_Code ORDER BY COUNT(*) DESC LIMIT 1 );
SELECT DISTINCT Template_Type_Code FROM Ref_Template_Types AS a LEFT JOIN Templates AS b ON a.Template_Type_Code = b.Template_Type_Code GROUP BY Template_Type_Code HAVING COUNT(Template_ID) < 3;
SELECT DISTINCT Template_Type_Code FROM Ref_Template_Types WHERE Template_Type_Code NOT IN ( SELECT Template_Type_Code FROM Templates GROUP BY Template_Type_Code HAVING COUNT(Template_ID) >= 3 );
SELECT MIN(T1.Version_Number), T1.Template_Type_Code FROM Templates T1 JOIN Ref_Template_Types T2 ON T1.Template_Type_Code = T2.Template_Type_Code;
SELECT T1.Template_Type_Code FROM Ref_Template_Types AS T1 INNER JOIN Templates AS T2 ON T1.Template_Type_Code = T2.Template_Type_Code WHERE (T2.Version_Number, T1.Template_Type_Code) IN ( SELECT Version_Number, Template_Type_Code FROM Templates GROUP BY Version_Number, Template_Type_Code HAVING MIN(Version_Number) );
SELECT t.Template_Type_Code FROM Templates t JOIN Documents d ON t.Template_ID = d.Template_ID WHERE d.Document_Name = 'Data base';
SELECT T2.Template_Type_Code FROM Documents D JOIN Templates T ON D.Template_ID = T.Template_ID JOIN Ref_Template_Types T2 ON T.Template_Type_Code = T2.Template_Type_Code WHERE D.Document_Name = 'Data base'
SELECT d.Document_Name FROM Documents d JOIN Templates t ON d.Template_ID = t.Template_ID WHERE t.Template_Type_Code = 'BK';
SELECT d.Document_Name FROM Documents d JOIN Templates t ON d.Template_ID = t.Template_ID WHERE t.Template_Type_Code LIKE '%BK%';
SELECT rt.Template_Type_Code, COUNT(DISTINCT d.Document_ID) AS Document_Count FROM Ref_Template_Types rt INNER JOIN Templates t ON rt.Template_Type_Code = t.Template_Type_Code INNER JOIN Documents d ON t.Template_ID = d.Template_ID GROUP BY rt.Template_Type_Code
SELECT Template_Type_Code, COUNT(Template_ID) AS Document_Count FROM Templates GROUP BY Template_Type_Code;
SELECT Template_Type_Code FROM Ref_Template_Types JOIN Templates ON Ref_Template_Types.Template_Type_Code = Templates.Template_Type_Code GROUP BY Template_Type_Code ORDER BY COUNT(Document_ID) DESC LIMIT 1;
SELECT ttt.Template_Type_Code FROM Ref_Template_Types ttt JOIN Templates t ON ttt.Template_Type_Code = t.Template_Type_Code JOIN Documents d ON t.Template_ID = d.Document_ID GROUP BY ttt.Template_Type_Code ORDER BY COUNT(d.Document_ID) DESC LIMIT 1;
SELECT DISTINCT Template_Type_Code FROM Ref_Template_Types WHERE Template_Type_Code NOT IN ( SELECT DISTINCT Template_Type_Code FROM Templates );
SELECT DISTINCT Template_Type_Code FROM Ref_Template_Types WHERE Template_Type_Code NOT IN ( SELECT T.Template_Type_Code FROM Templates T JOIN Documents D ON T.Template_ID = D.Template_ID );
SELECT Template_Type_Code, Template_Type_Description FROM Ref_Template_Types;
SELECT Template_Type_Code, Template_Type_Description FROM Ref_Template_Types;
SELECT Template_Type_Description FROM Ref_Template_Types WHERE Template_Type_Code = 'AD';
SELECT Template_Type_Description FROM Ref_Template_Types WHERE Template_Type_Code = 'AD'
SELECT Template_Type_Code FROM Ref_Template_Types WHERE Template_Type_Description = 'Book';
SELECT Template_Type_Code FROM Ref_Template_Types WHERE Template_Type_Description = 'Book';
SELECT DISTINCT TT.Template_Type_Description FROM Ref_Template_Types TT JOIN Templates T ON TT.Template_Type_Code = T.Template_Type_Code
SELECT DISTINCT T.Template_Type_Description FROM Templates T JOIN Documents D ON T.Template_ID = D.Template_ID WHERE D.Document_Name IS NOT NULL
SELECT Template_ID FROM Templates INNER JOIN Ref_Template_Types ON Templates.Template_Type_Code = Ref_Template_Types.Template_Type_Code WHERE Ref_Template_Types.Template_Type_Description = 'Presentation';
SELECT T1.Template_ID FROM Templates AS T1 JOIN Ref_Template_Types AS T2 ON T1.Template_Type_Code = T2.Template_Type_Code WHERE T2.Template_Type_Description = 'Presentation';
SELECT COUNT(*) FROM Paragraphs
SELECT COUNT(Paragraph_ID) FROM Paragraphs
SELECT COUNT(DISTINCT Paragraph_ID) FROM Paragraphs WHERE Document_ID = (SELECT Document_ID FROM Documents WHERE Document_Name = 'Summer Show');
SELECT COUNT(P.Paragraph_ID) FROM Paragraphs P JOIN Documents D ON P.Document_ID = D.Document_ID WHERE D.Document_Name = 'Summer Show';
SELECT p.Paragraph_ID, p.Paragraph_Text, d.Document_Name FROM Paragraphs p JOIN Documents d ON p.Document_ID = d.Document_ID WHERE p.Paragraph_Text LIKE '%Korea%';
SELECT P.Paragraph_ID, D.Document_Name, P.Other_Details FROM Paragraphs P INNER JOIN Documents D ON P.Document_ID = D.Document_ID WHERE P.Paragraph_Text LIKE '%Korea%';
SELECT p.Paragraph_ID, p.Paragraph_Text FROM Paragraphs p JOIN Documents d ON p.Document_ID = d.Document_ID WHERE d.Document_Name = 'Welcome to NY';
SELECT P.Paragraph_ID, P.Paragraph_Text FROM Paragraphs P JOIN Documents D ON P.Document_ID = D.Document_ID WHERE D.Document_Name = 'Welcome to NY';
SELECT P.Phrase_Text FROM Paragraphs P JOIN Documents D ON P.Document_ID = D.Document_ID WHERE D.Document_Name = 'Customer reviews';
SELECT P.Paragraph_Text FROM Paragraphs P INNER JOIN Documents D ON P.Document_ID = D.Document_ID WHERE D.Document_Name = 'Customer reviews';
SELECT Documents.Document_ID, COUNT(Paragraphs.Paragraph_ID) FROM Paragraphs JOIN Documents ON Paragraphs.Document_ID = Documents.Document_ID GROUP BY Documents.Document_ID ORDER BY Documents.Document_ID;
SELECT Document_ID, COUNT(*) FROM Paragraphs GROUP BY Document_ID ORDER BY Document_ID;
SELECT d.Document_ID, d.Document_Name, COUNT(p.Paragraph_ID) AS Num_Paragraphs FROM Documents d LEFT JOIN Paragraphs p ON d.Document_ID = p.Document_ID GROUP BY d.Document_ID, d.Document_Name;
SELECT D.Document_ID, D.Document_Name, COUNT(P.Paragraph_ID) AS Paragraph_Count FROM Documents D LEFT JOIN Paragraphs P ON D.Document_ID = P.Document_ID GROUP BY D.Document_ID, D.Document_Name;
SELECT DISTINCT d.Document_ID FROM Documents d JOIN Paragraphs p ON d.Document_ID = p.Document_ID GROUP BY d.Document_ID HAVING COUNT(p.Paragraph_ID) >= 2;
SELECT T1.Document_ID FROM Documents AS T1 JOIN Paragraphs AS T2 ON T1.Document_ID = T2.Document_ID GROUP BY T1.Document_ID HAVING COUNT(T2.Paragraph_ID) >= 2;
SELECT d.Document_ID, d.Document_Name, COUNT(p.Paragraph_ID) AS Paragraph_Count FROM Documents d LEFT JOIN Paragraphs p ON d.Document_ID = p.Document_ID GROUP BY d.Document_ID, d.Document_Name ORDER BY Paragraph_Count DESC LIMIT 1;
SELECT D.Document_ID, D.Document_Name FROM Documents D JOIN ( SELECT Document_ID, COUNT(*) as Paragraph_Cnt FROM Paragraphs GROUP BY Document_ID ORDER BY Paragraph_Cnt DESC LIMIT 1 ) P ON D.Document_ID = P.Document_ID;
SELECT Document_ID FROM Documents WHERE (Document_ID, Paragraphs) = ( SELECT Document_ID, COUNT(*) as cnt FROM Paragraphs GROUP BY Document_ID ORDER BY cnt LIMIT 1 );
SELECT Document_ID FROM Documents JOIN Paragraphs ON Documents.Document_ID = Paragraphs.Document_ID GROUP BY Document_ID ORDER BY COUNT(Paragraph_ID) LIMIT 1
SELECT Document_ID FROM Paragraphs WHERE Paragraph_ID BETWEEN 1 AND 2;
SELECT D.Document_ID FROM Documents D JOIN Paragraphs P ON D.Document_ID = P.Document_ID GROUP BY D.Document_ID HAVING COUNT(P.Paragraph_ID) BETWEEN 1 AND 2
SELECT Document_ID FROM Paragraphs WHERE Paragraph_Text = 'Brazil' INTERSECT SELECT Document_ID FROM Paragraphs WHERE Paragraph_Text = 'Ireland'
SELECT p.Document_ID FROM Paragraphs p WHERE p.Paragraph_Text LIKE '%Brazil%' AND p.Paragraph_Text LIKE '%Ireland%';
SELECT COUNT(Teacher_ID) FROM course_arrange;
SELECT COUNT(Teacher_ID) FROM course_arrange;
SELECT Name FROM teacher ORDER BY CAST(Age AS INTEGER) ASC
SELECT Name FROM teacher ORDER BY Age ASC;
SELECT T1.Age, T1.Hometown FROM teacher AS T1
SELECT Teacher_ID, Age, Hometown FROM teacher;
SELECT Name FROM teacher WHERE Hometown != 'Little Lever Urban District'
SELECT Name FROM teacher WHERE Hometown != 'Little Lever Urban District';
SELECT Name FROM teacher WHERE Age = '32' OR Age = '33';
SELECT T1.Name FROM teacher AS T1 JOIN course_arrange AS T2 ON T1.Teacher_ID = T2.Teacher_ID WHERE CAST(T1.Age AS INT) IN (32, 33);
SELECT Hometown FROM teacher WHERE Age = ( SELECT MIN(Age) FROM teacher ) LIMIT 1
SELECT t.Hometown FROM teacher t WHERE t.Age = ( SELECT MIN(Age) FROM teacher );
SELECT T2.Hometown, COUNT(T1.Teacher_ID) as num_teachers FROM course_arrange AS T1 INNER JOIN teacher AS T2 ON T1.Teacher_ID = T2.Teacher_ID GROUP BY T2.Hometown
SELECT Hometown, COUNT(*) as TeacherCount FROM teacher GROUP BY Hometown
SELECT T1.Hometown FROM teacher AS T1 INNER JOIN course_arrange AS T2 ON T1.Teacher_ID = T2.Teacher_ID GROUP BY T1.Hometown ORDER BY COUNT(T2.Course_ID) DESC LIMIT 1
SELECT Hometown FROM teacher GROUP BY Hometown ORDER BY COUNT(Teacher_ID) DESC LIMIT 1
SELECT T1.Hometown FROM teacher AS T1 INNER JOIN course_arrange AS T2 ON T1.Teacher_ID = T2.Teacher_ID GROUP BY T1.Hometown HAVING COUNT(T1.Teacher_ID) >= 2
SELECT T1.Hometown FROM teacher AS T1 JOIN course_arrange AS T2 ON T1.Teacher_ID = T2.Teacher_ID GROUP BY T1.Hometown HAVING COUNT(T1.Teacher_ID) >= 2;
SELECT t.Name, c.Course FROM teacher t JOIN course_arrange ca ON t.Teacher_ID = ca.Teacher_ID JOIN course c ON ca.Course_ID = c.Course_ID;
SELECT T1.Name, T2.Course FROM teacher AS T1 JOIN course_arrange AS T3 ON T1.Teacher_ID = T3.Teacher_ID JOIN course AS T2 ON T2.Course_ID = T3.Course_ID
SELECT t.Name FROM teacher t INNER JOIN course_arrange ca ON t.Teacher_ID = ca.Teacher_ID INNER JOIN course c ON ca.Course_ID = c.Course_ID ORDER BY t.Name ASC
SELECT Name, Course FROM teacher JOIN course_arrange ON teacher.Teacher_ID = course_arrange.Teacher_ID JOIN course ON course_arrange.Course_ID = course.Course_ID ORDER BY Name ASC;
SELECT T2.Name FROM course_arrange AS T1 INNER JOIN teacher AS T2 ON T1.Teacher_ID = T2.Teacher_ID WHERE T1.Course_ID IN ( SELECT Course_ID FROM course WHERE Course = 'Math' );
SELECT T2.Name FROM course_arrange AS T1 JOIN teacher AS T2 ON T1.Teacher_ID = T2.Teacher_ID
SELECT t.Name, COUNT(c.Course_ID) AS Course_Count FROM teacher t JOIN course_arrange ca ON t.Teacher_ID = ca.Teacher_ID GROUP BY t.Teacher_ID;
SELECT t.Name, COUNT(c.Course_ID) FROM teacher AS t INNER JOIN course_arrange AS ca ON t.Teacher_ID = ca.Teacher_ID GROUP BY t.Name
SELECT T2.Name FROM course_arrange AS T1 JOIN teacher AS T2 ON T1.Teacher_ID = T2.Teacher_ID GROUP BY T1.Teacher_ID HAVING COUNT(T1.Course_ID) >= 2;
SELECT T2.Name FROM course_arrange AS T1 JOIN teacher AS T2 ON T1.Teacher_ID = T2.Teacher_ID GROUP BY T1.Teacher_ID, T2.Name HAVING COUNT(T1.Course_ID) >= 2;
SELECT t.Name FROM teacher t LEFT JOIN course_arrange ca ON t.Teacher_ID = ca.Teacher_ID WHERE ca.Course_ID IS NULL;
SELECT T1.Name FROM teacher AS T1 LEFT JOIN course_arrange AS T2 ON T1.Teacher_ID = T2.Teacher_ID WHERE T2.Course_ID IS NULL;
SELECT COUNT(ID) FROM visitor WHERE Age < 30;
SELECT T2.Name FROM visitor AS T1 JOIN museum AS T2 ON T1.ID = 12345 AND T2.Museum_ID = T1.visitor_ID WHERE T1.Level_of_membership > 4 ORDER BY T1.Level_of_membership DESC;
SELECT AVG(v.Age) FROM visitor v WHERE v.Level_of_membership <= 4;
SELECT T1.Name, T2.Level_of_membership FROM visitor AS T2 JOIN museum AS T1 ON T2.ID IN ( SELECT visitor_ID FROM visit WHERE Museum_ID = T1.Museum_ID ) WHERE T2.Level_of_membership > 4 ORDER BY T2.Age DESC
SELECT Museum_ID, Name FROM museum ORDER BY Num_of_Staff DESC LIMIT 1;
SELECT AVG(Num_of_Staff) FROM museum WHERE Open_Year < '2009'
SELECT T1.Open_Year, T1.Num_of_Staff FROM museum AS T1 WHERE T1.Name = 'Plaza Museum'
SELECT Name FROM museum WHERE Num_of_Staff > ( SELECT MIN(Num_of_Staff) FROM museum WHERE Open_Year > '2010' );
SELECT v.ID, v.Name, v.Age FROM visitor v JOIN visit vi ON v.ID = vi.visitor_ID JOIN visit vi2 ON v.ID = vi2.visitor_ID AND vi.Museum_ID <> vi2.Museum_ID GROUP BY v.ID, v.Name, v.Age HAVING COUNT(vi.Museum_ID) > 1;
SELECT v.ID, v.Name, vm.Level_of_membership FROM visitor v JOIN visit vi ON v.ID = vi.visitor_ID JOIN ( SELECT visitor_ID, SUM(Total_spent) AS Total_Spent FROM visit GROUP BY visitor_ID ORDER BY Total_Spent DESC LIMIT 1 ) vis ON vi.visitor_ID = vis.visitor_ID JOIN visitor vm ON vi.visitor_ID = vm.ID
SELECT T1.Museum_ID, T1.Name FROM museum AS T1 INNER JOIN visit AS T2 ON T1.Museum_ID = T2.Museum_ID GROUP BY T1.Museum_ID ORDER BY COUNT(T2.visitor_ID) DESC LIMIT 1;
SELECT Name FROM museum WHERE Museum_ID NOT IN ( SELECT Museum_ID FROM visit )
SELECT v.Name, v.Age FROM visitor v JOIN visit vi ON v.ID = vi.visitor_ID WHERE (vi.Museum_ID, vi.Num_of_Ticket) IN ( SELECT Museum_ID, MAX(Num_of_Ticket) FROM visit GROUP BY Museum_ID );
