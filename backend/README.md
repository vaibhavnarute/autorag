# AutoRAG Backend

## Setup

1. Create and activate a Python 3.11 virtual environment:
   ```
   python -m venv .venv
   .venv\Scripts\activate  # On Windows
   source .venv/bin/activate  # On Linux/Mac
   ```
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Copy `.env.example` to `.env` and fill in your environment variables.

4. Run database migrations:
   ```
   alembic upgrade head
   ```

5. Start the FastAPI server:
   ```
   uvicorn app.main:app --reload
   ```

## Project Structure
- `app/` - Main FastAPI app code
- `alembic/` - Database migrations
- `.env.example` - Example environment variables

## API Docs
Visit [http://localhost:8000/docs](http://localhost:8000/docs) for the OpenAPI documentation. 