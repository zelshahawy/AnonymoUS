FROM python:3.11-slim

WORKDIR /app

COPY pyproject.toml .

RUN pip install --upgrade pip \
	&& pip install .

COPY . .

EXPOSE 5005

# 4) run your FastAPI app; adjust "main:app" if your module/name differ
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5005"]
