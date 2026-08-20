```mermaid
architecture-beta
    group api(API Layer)
    group db(Databases)
    group workers(Workers)
    
    service frontend(Frontend)
    service backend(Backend) in api
    service postgres(PostgreSQL) in db
    service mongo(MongoDB) in db
    service redis(Redis) in db
    service minio(MinIO Storage)
    service celery(Celery Worker) in workers
    
    frontend:R -- L:backend
    backend:R -- L:postgres
    backend:R -- L:mongo
    backend:R -- L:redis
    backend:R -- L:minio
    celery:R -- L:redis
    celery:R -- L:minio
    celery:R -- L:postgres
    celery:R -- L:mongo
```
