FROM python:3.11-slim

WORKDIR /app

# 1) copy only the pyproject so we can leverage the cache
COPY pyproject.toml .

# 2) install all deps defined in pyproject.toml
RUN pip install --upgrade pip \
	&& pip install .

# 3) copy the rest of your service code
COPY . .

EXPOSE 5005

# 4) run your FastAPI app; adjust "main:app" if your module/name differ
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5005"]
