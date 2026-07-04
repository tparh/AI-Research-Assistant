from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
from app.services.pdf_service import process_pdf_upload

router = APIRouter(tags=["upload"])


@router.post("/pdf")
async def upload_pdf(file: UploadFile = File(...)) -> JSONResponse:
    """Upload a PDF file, save it locally, read its text, and return metadata."""

    if file.content_type != "application/pdf":
        return JSONResponse(
            status_code=200,
            content={
                "success": False,
                "doc_id": None,
                "message": "Only PDF files are accepted.",
            },
        )

    try:
        result = await process_pdf_upload(file)
        return JSONResponse(status_code=200, content=result)
    except Exception as exc:
        import traceback
        import logging

        logging.getLogger("uvicorn.error").error("Upload endpoint error: %s", exc)
        logging.getLogger("uvicorn.error").error(traceback.format_exc())
        return JSONResponse(
            status_code=200,
            content={
                "success": False,
                "doc_id": None,
                "message": "Upload failed safely. Please try again.",
            },
        )
