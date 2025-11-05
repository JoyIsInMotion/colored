from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import Response

# Create the FastAPI app
app = FastAPI()

# Simple test route
@app.get("/")
def read_root():
    return {"message": "Hello from Colored bg-service!"}

# Image echo endpoint
@app.post("/echo-image")
async def echo_image(file: UploadFile = File(...)):
    """
    For now:
    - Accept one uploaded file called "file"
    - Check it's an image
    - Read the bytes
    - Return the exact same image back
    """

    # Basic validation
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Read raw bytes
    content = await file.read()

    # Return them back with the same type
    return Response(content=content, media_type=file.content_type)
