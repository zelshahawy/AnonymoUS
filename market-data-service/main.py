import uvicorn
from fastapi import FastAPI
from routes import router

app = FastAPI()
app.include_router(router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5005)
