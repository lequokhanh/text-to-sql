FROM python:3.10-slim

# Set the working directory
WORKDIR /app

# Copy only the dependency list to leverage Docker cache
COPY requirements.txt .

# Install dependencies. The --no-cache-dir flag keeps the image smaller.
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your application code.
COPY ./src/ .

# Expose the port your app listens on.
EXPOSE 5000

# Run the application.
CMD ["python", "app.py"]
