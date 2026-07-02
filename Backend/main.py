from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "Krishna", "Message": "FastAPI is working perfectly!"}