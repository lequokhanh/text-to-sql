SELECT COUNT(Singer_ID) FROM singer
SELECT COUNT(Singer_ID) FROM singer_in_concert
SELECT Name, Country, Age FROM singer ORDER BY Age DESC;
SELECT Name, Country, Age FROM singer ORDER BY Age DESC;
SELECT AVG(Age), MIN(Age), MAX(Age) FROM singer WHERE Country = 'France';
SELECT AVG(Age) AS Average_age, MIN(Age) AS Min_age, MAX(Age) AS Max_age FROM singer WHERE Country = 'France';
SELECT T2.Name, T2.`Song_release_year` FROM singer AS T1 JOIN singer AS T2 ON T1.Age > T2.Age ORDER BY T2.Age LIMIT 1;
SELECT S.Name, T2.Song_release_year FROM singer AS T1 INNER JOIN (SELECT Singer_ID, MIN(Song_release_year) AS Song_release_year FROM singer GROUP BY Singer_ID) AS T2 ON T1.Singer_ID = T2.Singer_ID WHERE T1.Age = ( SELECT MAX(Age) FROM singer );
SELECT DISTINCT T1.Country FROM singer AS T1 JOIN singer_in_concert AS T2 ON T1.Singer_ID = T2.Singer_ID WHERE T1.Age > 20;
SELECT DISTINCT Country FROM singer WHERE Age > 20;
SELECT Country, COUNT(Name) as Singer_Count FROM singer GROUP BY Country;
SELECT Country, COUNT(*) FROM singer GROUP BY Country;
SELECT Song_Name FROM singer WHERE Age > ( SELECT AVG(Age) FROM singer )
SELECT T1.Song_Name FROM singer AS T1 JOIN ( SELECT Singer_ID FROM singer GROUP BY Singer_ID HAVING AVG(Age) > (SELECT AVG(Age) FROM singer) ) AS T2 ON T1.Singer_ID = T2.Singer_ID
SELECT Location, Name FROM stadium WHERE Capacity BETWEEN 5000 AND 10000;
SELECT DISTINCT Location, Name FROM stadium WHERE Capacity BETWEEN 5000 AND 10000;
SELECT MAX(Capacity), AVG(Average) FROM stadium;
SELECT AVG(Capacity) as Average_Capacity, MAX(Highest) as Max_Capacity FROM stadium;
SELECT Name, Capacity FROM stadium ORDER BY Average DESC LIMIT 1;
SELECT s.Name, s.Capacity FROM stadium s WHERE (s.Average = ( SELECT MAX(Average) FROM stadium ));
SELECT COUNT(concert_ID) FROM concert WHERE YEAR IN ('2014', '2015')
SELECT COUNT(concert_ID) FROM concert WHERE Year = '2014' OR Year = '2015';
SELECT T1.Name, COUNT(T2.concert_ID) AS Number_of_concerts FROM stadium AS T1 JOIN concert AS T2 ON T1.Stadium_ID = T2.Stadium_ID
SELECT s.Name, COUNT(c.concert_ID) as Concerts FROM concert c JOIN stadium s ON c.Stadium_ID = s.Stadium_ID GROUP BY s.Name;
SELECT s.Name, s.Capacity FROM stadium s JOIN concert c ON s.Stadium_ID = c.Stadium_ID WHERE CAST(c.Year AS INT) >= 2014 GROUP BY s.Name, s.Capacity ORDER BY COUNT(s.Stadium_ID) DESC LIMIT 1;
SELECT s.Name, s.Capacity FROM stadium s JOIN concert c ON s.Stadium_ID = c.Stadium_ID GROUP BY s.Name, s.Capacity ORDER BY COUNT(c.concert_ID) DESC LIMIT 1
SELECT Year FROM concert GROUP BY Year ORDER BY COUNT(Year) DESC LIMIT 1
SELECT YEAR FROM concert GROUP BY YEAR ORDER BY COUNT(concert_ID) DESC LIMIT 1
SELECT Name FROM stadium WHERE Stadium_ID NOT IN (SELECT Stadium_ID FROM event WHERE EventType = 'concert');
SELECT Name FROM stadium WHERE Stadium_ID NOT IN ( SELECT Stadium_ID FROM concert );
SELECT T1.Country FROM singer AS T1 WHERE T1.Age > 40 INTERSECT SELECT T1.Country FROM singer AS T1 WHERE T1.Age < 30;
SELECT s.Name FROM stadium AS s LEFT JOIN concert AS c ON s.Stadium_ID = c.Stadium_ID WHERE c.Year != 2014 OR c.Year IS NULL;
SELECT DISTINCT T1.Name FROM stadium AS T1 LEFT JOIN concert AS T2 ON T1.Stadium_ID = T2.Stadium_ID WHERE T2.concert_Name IS NULL OR (T2.Year != '2014');
SELECT c.concert_Name, c.Theme, COUNT(si.Singer_ID) AS Singer_Count FROM concert c LEFT JOIN singer_in_concert si ON c.concert_ID = si.concert_ID GROUP BY c.concert_Name
SELECT c.concert_Name, c.Theme, COUNT(s.Singer_ID) AS number_of_singers FROM concert c JOIN singer_in_concert sic ON c.concert_ID = sic.concert_ID JOIN singer s ON sic.Singer_ID = s.Singer_ID GROUP BY c.concert_Name, c.Theme;
SELECT S.Name, COUNT(C.concert_ID) FROM singer_in_concert C INNER JOIN singer S ON C.Singer_ID = S.Singer_ID GROUP BY S.Name
SELECT S.Name, COUNT(CI.concert_ID) AS Concerts FROM singer_in_concert CI JOIN singer S ON CI.Singer_ID = S.Singer_ID GROUP BY S.Name
SELECT T3.Name FROM singer_in_concert AS T1 INNER JOIN concert AS T2 ON T1.concert_ID = T2.concert_ID INNER JOIN singer AS T3 ON T1.Singer_ID = T3.Singer_ID WHERE T2.Year = '2014';
SELECT Name FROM singer INNER JOIN singer_in_concert ON singer.Singer_ID = singer_in_concert.Singer_ID INNER JOIN concert ON singer_in_concert.concert_ID = concert.concert_ID WHERE concert.Year = '2014';
SELECT T2.Name, T2.Country FROM singer AS T1 INNER JOIN concert AS T2 ON T1.Singer_ID = T2.concert_ID WHERE T1.Song_Name LIKE '%Hey%'
SELECT Name, Country FROM singer WHERE Song_Name LIKE '%Hey%';
SELECT DISTINCT S.Name, S.Location FROM stadium AS S JOIN concert AS C ON S.Stadium_ID = C.Stadium_ID WHERE C.Year IN ('2014', '2015') GROUP BY S.Name, S.Location HAVING COUNT(C.concert_ID) > 1;
SELECT s.Name, s.Location FROM stadium AS s INNER JOIN concert AS c ON s.Stadium_ID = c.Stadium_ID WHERE c.Year IN ('2014', '2015') GROUP BY c.concert_Name HAVING COUNT(DISTINCT c.concert_ID) > 1;
SELECT COUNT(*) FROM stadium AS s INNER JOIN concert AS c ON s.Stadium_ID = c.Stadium_ID WHERE s.Capacity = ( SELECT MAX(Capacity) FROM stadium );
SELECT COUNT(T2.concert_ID) FROM stadium AS T1 JOIN concert AS T2 ON T1.Stadium_ID = T2.Stadium_ID WHERE T1.Capacity = ( SELECT MAX(Capacity) FROM stadium );
SELECT COUNT(*) FROM Pets WHERE weight > 10;
SELECT COUNT(*) FROM Pets WHERE weight > 10;
SELECT weight FROM Pets WHERE PetID IN ( SELECT PetID FROM Has_Pet WHERE StuID IN ( SELECT StuID FROM Student ORDER BY Age ASC LIMIT 1 ) );
SELECT T2.weight FROM Pets AS T2 INNER JOIN Has_Pet AS T1 ON T2.PetID = T1.PetID WHERE (T2.pet_age = ( SELECT MIN(T3.pet_age) FROM Pets AS T3 ));
SELECT p.PetType, MAX(p.weight) AS MaxWeight FROM Pets p LEFT JOIN Has_Pet hp ON p.PetID = hp.PetID GROUP BY p.PetType
SELECT p.pet_type, MAX(p.weight) AS max_weight FROM Pets p GROUP BY p.pet_type;
SELECT COUNT(*) FROM Student AS S JOIN Has_Pet AS HP ON S.StuID = HP.StuID WHERE S.Age > 20;
SELECT COUNT(*) FROM Student AS S INNER JOIN Has_Pet AS HP ON S.StuID = HP.StuID WHERE S.Age > 20
SELECT COUNT(*) FROM Student S JOIN Has_Pet HP ON S.StuID = HP.StuID JOIN Pets P ON HP.PetID = P.PetID WHERE S.Sex = 'F' AND P.PetType = 'dog';
SELECT COUNT(*) FROM Student JOIN Has_Pet ON Student.StuID = Has_Pet.StuID JOIN Pets ON Has_Pet.PetID = Pets.PetID WHERE Student.Sex = 'F' AND Pets.PetType = 'dog';
SELECT COUNT(DISTINCT PetType) FROM Pets
SELECT COUNT(DISTINCT PetType) FROM Pets;
SELECT T1.Fname FROM Student AS T1 INNER JOIN Has_Pet AS T2 ON T1.StuID = T2.StuID INNER JOIN Pets AS T3 ON T2.PetID = T3.PetID WHERE T3.PetType IN ('cat', 'dog');
SELECT T1.Fname FROM Student AS T1 INNER JOIN Has_Pet AS T2 ON T1.StuID = T2.StuID INNER JOIN Pets AS T3 ON T2.PetID = T3.PetID WHERE T3.PetType IN ('cat', 'dog');
SELECT Fname FROM Student WHERE StuID IN ( SELECT StuID FROM Has_Pet hp1 JOIN Pets p ON hp1.PetID = p.PetID WHERE p.PetType IN ('cat', 'dog') );
SELECT S.Fname FROM Student S INNER JOIN Has_Pet HP ON S.StuID = HP.StuID WHERE P.PetType IN ('cat', 'dog') GROUP BY S.StuID HAVING COUNT(DISTINCT PetType) = 2
SELECT S.Fname, S.LName, S.Age FROM Student S LEFT JOIN Has_Pet HP ON S.StuID = HP.StuID WHERE HP.PetID IS NULL;
SELECT s.Fname, s.LName, s.Age FROM Student s LEFT JOIN Has_Pet hp ON s.StuID = hp.StuID WHERE hp.PetID IS NULL;
SELECT StuID FROM Student s LEFT JOIN Has_Pet hp ON s.StuID = hp.StuID WHERE hp.PetID IS NULL;
SELECT StuID FROM Student WHERE StuID NOT IN ( SELECT StuID FROM Has_Pet WHERE PetID = ANY ( SELECT PetID FROM Pets WHERE PetType = 'cat' ) );
SELECT S.Fname, S.Age FROM Student S WHERE S.StuID IN ( SELECT H.PetID FROM Has_Pet H JOIN Pets P ON H.PetID = P.PetID WHERE P.PetType = 'dog' AND P.PetID NOT IN (SELECT PetID FROM Pets WHERE PetType = 'cat') );
SELECT Fname FROM Student WHERE StuID IN ( SELECT StuID FROM Has_Pet WHERE PetID NOT IN ( SELECT PetID FROM Pets WHERE PetType = 'cat' ) );
SELECT P.pet_type, MIN(P.weight) AS youngest_weight FROM Pets P JOIN Has_Pet H ON P.PetID = H.PetID WHERE P.pet_age = (SELECT MIN(P2.pet_age) FROM Pets P2)
SELECT p.PetType, MIN(p.pet_age) AS MinAge, MIN(p.weight) FROM Pets p JOIN Has_Pet hp ON p.PetID = hp.PetID
SELECT P.PetID, P.weight FROM Pets P JOIN Has_Pet HP ON P.PetID = HP.PetID WHERE P.pet_age > 1;
SELECT T2.PetID, Pets.weight FROM Student AS T1 INNER JOIN Has_Pet AS T2 ON T1.StuID = T2.StuID INNER JOIN Pets ON T2.PetID = Pets.PetID WHERE T1.Age > 1;
SELECT PetType, AVG(pet_age) as avg_age, MAX(pet_age) as max_age FROM Pets GROUP BY PetType;
SELECT PetType, AVG(pet_age) as avg_age, MAX(pet_age) as max_age FROM Pets GROUP BY PetType
SELECT AVG(P.weight) AS avg_weight FROM Pets P JOIN Has_Pet HP ON P.PetID = HP.PetID GROUP BY P.PetType
SELECT AVG(T2.weight) AS average_weight FROM Student AS T1 INNER JOIN Has_Pet AS T2 ON T1.StuID = T2.StuID INNER JOIN Pets AS T3 ON T2.PetID = T3.PetID GROUP BY T3.PetType
SELECT T1.Fname, T2.Age FROM Student AS T1 JOIN Has_Pet AS T3 ON T1.StuID = T3.StuID JOIN Student AS T2 ON T3.StuID = T2.StuID
SELECT DISTINCT Fname, Age FROM Student WHERE StuID IN (SELECT StuID FROM Has_Pet);
SELECT P.PetID FROM Student S JOIN Has_Pet HP ON S.StuID = HP.StuID JOIN Pets P ON HP.PetID = P.PetID WHERE S.LName = 'Smith';
SELECT P.PetID FROM Student S INNER JOIN Has_Pet HP ON S.StuID = HP.StuID INNER JOIN Pets P ON HP.PetID = P.PetID WHERE S.LName = 'Smith';
SELECT StuID, COUNT(*) AS NumPets FROM Has_Pet GROUP BY StuID HAVING COUNT(*) > 0;
SELECT StuID FROM Has_Pet GROUP BY StuID HAVING COUNT(*) > 1;
SELECT T1.Fname, T1.Sex FROM Student AS T1 JOIN Has_Pet AS T2 ON T1.StuID = T2.StuID GROUP BY T1.StuID HAVING COUNT(T2.PetID) > 1;
SELECT S.Fname, S.Sex FROM Student S JOIN Has_Pet HP ON S.StuID = HP.StuID GROUP BY S.StuID, S.Fname, S.Sex HAVING COUNT(DISTINCT HP.PetID) > 1;
SELECT T2.LName FROM Pets AS T1 INNER JOIN Student AS T2 ON T1.PetID NOT IN ( SELECT PetID FROM Has_Pet WHERE StuID = T2.StuID ) WHERE pet_age = 3;
SELECT LName FROM Student WHERE StuID IN ( SELECT StuID FROM Has_Pet hp JOIN Pets p ON hp.PetID = p.PetID WHERE pet_age = 3 );
SELECT AVG(T1.Age) FROM Student T1 LEFT JOIN Has_Pet T2 ON T1.StuID = T2.StuID WHERE T2.PetID IS NULL;
SELECT AVG(Age) FROM Student WHERE StuID NOT IN (SELECT StuID FROM Has_Pet);
SELECT COUNT(ContId) FROM continents;
SELECT COUNT(ContId) FROM continents
SELECT c.ContId, c.Continent, COUNT(*) FROM countries AS t1 INNER JOIN continents AS c ON t1.Continent = c.ContId GROUP BY c.ContId;
SELECT C.ContId, C.Continent, COUNT(CountryName) AS CountryCount FROM continents C JOIN countries CO ON C.ContId = CO.Continent GROUP BY C.ContId, C.Continent;
SELECT COUNT(CountryId) FROM countries
SELECT COUNT(DISTINCT CountryName) FROM countries
SELECT C.Maker, C.FullName, COUNT(M.ModelId) AS Number FROM car_makers C JOIN model_list M ON C.Id = M.Maker GROUP BY C.Maker, C.FullName
SELECT m.Id, m.Maker, m.FullName, COUNT(model_list.ModelId) AS ModelsProduced FROM car_makers m JOIN model_list ON m.Id = model_list.Maker GROUP BY m.Id, m.Maker, m.FullName
SELECT T1.Model FROM car_names AS T1 INNER JOIN model_list AS T2 ON T1.MakeId = T2.Maker WHERE T1.MakeId IN ( SELECT MakeId FROM car_data AS T3 INNER JOIN cars_data AS T4 ON T3.Id = T4.Id ORDER BY T4.Horsepower LIMIT 1 )
SELECT m.Model FROM cars_data c INNER JOIN model_list m ON c.Id = m.ModelId WHERE c.Horsepower = ( SELECT MIN(Horsepower) FROM cars_data )
SELECT Model FROM cars_data WHERE Weight < ( SELECT AVG(Weight) FROM cars_data )
SELECT T1.Model FROM car_names AS T1 INNER JOIN cars_data AS T2 ON T1.MakeId = T2.Id WHERE T2.Weight < ( SELECT AVG(Weight) FROM cars_data );
SELECT T2.Maker FROM cars_data AS T1 INNER JOIN car_makers AS T2 ON T1.Year = 1970 AND T2.Id = ANY ( SELECT Id FROM cars_data WHERE Year = 1970 )
SELECT DISTINCT T1.Maker FROM car_makers AS T1 INNER JOIN cars_data AS T2 ON T1.Id = T2.Id WHERE T2.Year = 1970
SELECT T1.Maker, MIN(T2.Year) AS production_time FROM car_makers AS T1 INNER JOIN model_list AS T3 ON T1.Id = T3.Maker INNER JOIN cars_data AS T2 ON T3.ModelId = T2.Id GROUP BY T1.Maker
SELECT T1.Maker, T2.Year FROM car_makers AS T1 INNER JOIN cars_data AS T2 ON T1.Id = T2.Id WHERE T2.Year = ( SELECT MIN(Year) FROM cars_data );
SELECT DISTINCT T2.Model FROM cars_data AS T1 INNER JOIN model_list AS T2 ON T1.Id = T2.ModelId WHERE T1.Year > 1980
SELECT DISTINCT M.Model FROM model_list AS M JOIN car_makers AS C ON M.Maker = C.Id JOIN cars_data AS D ON C.Id = ( SELECT Maker FROM cars_data WHERE Year > 1980 GROUP BY Maker ORDER BY COUNT(Maker) DESC LIMIT 1 )
SELECT c.Continent, COUNT(cm.Id) FROM continents c JOIN countries co ON c.ContId = co.Continent JOIN car_makers cm ON co.CountryId = cm.Country GROUP BY c.Continent
SELECT c.Continent, COUNT(cm.Maker) FROM continents c JOIN countries co ON c.ContId = co.Continent JOIN car_makers cm ON co.CountryName = cm.Country GROUP BY c.Continent
SELECT Country FROM car_makers GROUP BY Country ORDER BY COUNT(Maker) DESC LIMIT 1;
SELECT CountryName FROM countries WHERE CountryId = ( SELECT CountryId FROM car_makers GROUP BY CountryId ORDER BY COUNT(Maker) DESC LIMIT 1 );
SELECT COUNT(*) as CarModelsCount, c.Maker FROM cars_data cd JOIN car_makers c ON cd.Year = ( SELECT MAX(Year) FROM cars_data WHERE Maker = c.FullName ) GROUP BY c.Maker;
SELECT T1.Id, T1.FullName, COUNT(T2.ModelId) AS Count FROM car_makers AS T1 INNER JOIN model_list AS T2 ON T1.Id = T2.Maker GROUP BY T1.Id, T1.FullName
SELECT t2.Accelerate FROM car_makers AS t1 INNER JOIN cars_data AS t2 ON t1.Id = 3 WHERE t1.Maker = 'AMC Hornet Sportabout (SW)';
SELECT Accelerate FROM cars_data WHERE Model = 'amc hornet sportabout (sw)';
SELECT COUNT(Maker) FROM car_makers WHERE Country = 'France'
SELECT COUNT(CountryName) FROM countries WHERE CountryName = 'France';
SELECT COUNT(*) FROM model_list ml JOIN car_makers cm ON ml.Maker = cm.Id WHERE cm.Country = 'USA';
SELECT COUNT(DISTINCT t1.Model) FROM model_list AS t1 INNER JOIN car_makers AS t2 ON t1.Maker = t2.Id WHERE t2.Country = 'United States';
SELECT CAST(SUM(CASE WHEN Cylinders = 4 THEN MPG ELSE 0 END) AS REAL) / COUNT(*) FROM cars_data WHERE Cylinders = 4;
SELECT AVG(MPG) FROM cars_data WHERE Cylinders = 4;
SELECT MIN(C.weight) FROM cars_data C INNER JOIN car_names CN ON C.Id = 1 WHERE CN.Model LIKE '1974' AND C.Cylinders = 8
SELECT MIN(T1.Weight) FROM cars_data AS T1 JOIN car_names AS T2 ON T1.MakeId = 0;
SELECT DISTINCT T1.Maker, T2.Model FROM car_makers AS T1 INNER JOIN model_list AS T2 ON T1.Id = T2.Maker
SELECT M.Maker, ML.Model FROM car_makers AS M INNER JOIN model_list AS ML ON M.Id = ML.Maker
SELECT T2.CountryName, T1.Id FROM car_makers AS T1 INNER JOIN countries AS T2 ON T1.Country = T2.CountryId GROUP BY T2.CountryName HAVING COUNT(T2.CountryId) > 0
SELECT c.CountryId, c.CountryName FROM countries c JOIN car_makers cm ON c.CountryName = cm.Country GROUP BY c.CountryId, c.CountryName;
SELECT COUNT(Id) FROM cars_data WHERE Horsepower > 150
SELECT COUNT(*) FROM cars_data WHERE Horsepower > 150;
SELECT AVG(Weight) FROM cars_data GROUP BY Year;
SELECT AVG(Weight), Year FROM cars_data GROUP BY Year;
SELECT c.CountryName FROM countries c JOIN car_makers cm ON c.CountryId = 1 GROUP BY c.CountryName HAVING COUNT(cm.Maker) >= 3 AND c.Continent = 2
SELECT T1.CountryName FROM countries AS T1 INNER JOIN car_makers AS T2 ON T1.CountryId = T2.Country WHERE T1.Continent = 'Europe' GROUP BY T1.CountryId HAVING COUNT(T2.Id) >= 3;
SELECT MAX(cars_data.Horsepower), car_makers.Maker FROM cars_data JOIN car_makers ON cars_data.Id = car_makers.Id WHERE cars_data.Cylinders = 3;
SELECT T1.Maker FROM car_makers AS T1 INNER JOIN model_list AS T2 ON T1.Id = T2.Maker INNER JOIN cars_data AS T3 ON T2.ModelId = T3.Id WHERE T3.Cylinders = 3 ORDER BY T3.Horsepower DESC LIMIT 1
SELECT MAX(CAST(MPG AS REAL)) FROM cars_data
SELECT m.Model FROM cars_data c JOIN model_list m ON c.Id = m.ModelId ORDER BY CAST(REPLACE(c.MPG, 'mpg', '') AS REAL) DESC LIMIT 1;
SELECT AVG(CAST(Horsepower AS REAL)) FROM cars_data WHERE Year < 1980
SELECT AVG(CAST(SUBSTR(Horsepower, 1, INSTR(Horsepower, '-') - 1) AS INTEGER)) FROM cars_data WHERE YEAR < 1980
SELECT AVG(c.Edispl) FROM cars_data c JOIN model_list m ON c.Id = '???' -- cannot determine foreign key; WHERE m.Model = 'volvo'
SELECT AVG(T1.Edispl) FROM cars_data AS T1 JOIN model_list AS T2 ON T1.Id = T2.ModelId JOIN car_makers AS T3 ON T3.Id = T2.Maker WHERE T3.Maker = 'Volvo'
SELECT MAX(Accelerate) FROM cars_data GROUP BY Cylinders;
SELECT MAX(Accelerate) AS Max_Accelerate FROM cars_data GROUP BY Cylinders;
SELECT c.ModelId FROM car_names AS c INNER JOIN model_list AS m ON c.MakeId = m.Maker GROUP BY c.Model ORDER BY COUNT(c.Model) DESC LIMIT 1;
SELECT t2.Maker, COUNT(t3.ModelId) AS TotalVersions FROM car_makers t1 INNER JOIN model_list t2 ON t1.Id = t2.Maker GROUP BY t2.Maker ORDER BY TotalVersions DESC LIMIT 1
SELECT COUNT(*) FROM cars_data WHERE Cylinders > 4;
SELECT COUNT(*) FROM cars_data WHERE Cylinders > 4;
SELECT COUNT(Id) FROM cars_data WHERE YEAR = 1980;
SELECT COUNT(Id) FROM cars_data WHERE Year = 1980;
SELECT COUNT(Maker) FROM car_makers JOIN model_list ON car_makers.Id = model_list.Maker WHERE car_makers.FullName = 'American Motor Company';
SELECT COUNT(c.Id) FROM cars_data c INNER JOIN car_makers cm ON c.Maker = cm.FullName WHERE cm.Maker = 'American Motor Company'
SELECT c.Id, c.FullName FROM car_makers AS c INNER JOIN cars_data AS cd ON c.Id = cd.Id GROUP BY c.Id HAVING COUNT(cd.Id) > 3
SELECT m.Maker, c.Id FROM car_makers c JOIN model_list ml ON c.Id = ml.Maker GROUP BY c.Id HAVING COUNT(ml.ModelId) > 3;
SELECT DISTINCT Model FROM model_list JOIN car_makers ON model_list.Maker = car_makers.Id WHERE car_makers.FullName = 'General Motors' OR cars_data.Weight > 3500;
SELECT M.Model FROM model_list AS M INNER JOIN car_makers AS C ON M.Maker = C.Id WHERE (C.Maker = 'General Motors') OR (M.Maker IN ( SELECT Id FROM car_makers WHERE Weight > 3500 ));
SELECT Year FROM cars_data WHERE Weight BETWEEN 3000 AND 4000;
SELECT DISTINCT Year FROM cars_data WHERE Weight < 4000 INTERSECT SELECT DISTINCT Year FROM cars_data WHERE Weight > 3000;
SELECT T1.Horsepower FROM cars_data AS T1 INNER JOIN car_names AS T2 ON T1.Id = T2.MakeId ORDER BY T1.Accelerate DESC LIMIT 1;
SELECT t1.Horsepower FROM cars_data t1 JOIN car_names t2 ON t2.MakeId = ( SELECT MakeId FROM cars_data ORDER BY Accelerate DESC LIMIT 1 );
SELECT T2.Cylinders FROM cars_data AS T1 INNER JOIN model_list AS T2 ON T1.ModelId = T2.ModelId WHERE T2.Model = 'volvo' ORDER BY Accelerate ASC LIMIT 1;
SELECT T2.Cylinders FROM model_list AS T1 INNER JOIN cars_data AS T2 ON T1.ModelId = 18 AND T1.Maker = 7 INNER JOIN car_makers AS T3 ON T3.Id = T1.Maker WHERE T2.Accelerate = ( SELECT MIN(T2.Accelerate) FROM cars_data AS T2 INNER JOIN model_list AS T1 ON T2.ModelID IS NULL ) AND T1.Model = 'Volvo';
SELECT COUNT(Id) FROM cars_data WHERE Accelerate > ( SELECT MAX(CAST(REPLACE(Horsepower, 'hp', '') AS REAL)) FROM cars_data );
SELECT COUNT(Id) FROM cars_data WHERE Accelerate > ( SELECT MAX(Accelerate) FROM cars_data WHERE Horsepower = ( SELECT Horsepower FROM cars_data ORDER BY Horsepower DESC LIMIT 1 ) );
SELECT COUNT(CountryName) FROM countries WHERE CountryId IN ( SELECT Country FROM car_makers GROUP BY Country HAVING COUNT(Maker) > 2 )
SELECT COUNT(T1.CountryName) FROM countries AS T1 INNER JOIN car_makers AS T2 ON T2.Country = T1.CountryId WHERE COUNT(DISTINCT T2.Maker) > 2 GROUP BY T1.CountryName
SELECT COUNT(Id) FROM cars_data WHERE Cylinders > 6;
SELECT COUNT(*) FROM cars_data WHERE Cylinders > 6;
SELECT Model FROM car_names JOIN model_list ON car_names.MakeId = model_list.Maker WHERE Cylinders = 4 ORDER BY Horsepower DESC LIMIT 1;
