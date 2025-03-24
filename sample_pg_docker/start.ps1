docker build -t my-postgres-sample .
docker rm -vf postgres-sample
docker run --name postgres-sample -p 5432:5432 -d my-postgres-sample
