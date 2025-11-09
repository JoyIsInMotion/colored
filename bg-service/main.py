from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import Response

from trendyol_bg import remove_background

app = FastAPI()


@app.get("/")
def read_root():
    return {"message": "Hello from Colored bg-service!"}


# keep echo endpoint for testing if you like
@app.post("/echo-image")
async def echo_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    content = await file.read()
    return Response(content=content, media_type=file.content_type)


@app.post("/remove-background")
async def remove_background_endpoint(file: UploadFile = File(...)):
    """
    Accepts an uploaded image ("file"),
    runs background removal,
    returns a PNG with transparent background.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    image_bytes = await file.read()

    try:
        result_png = remove_background(image_bytes)
    except Exception as e:
        # show error while we're still developing
        raise HTTPException(status_code=500, detail=f"Background removal failed: {e}")

    return Response(content=result_png, media_type="image/png")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=9000)
