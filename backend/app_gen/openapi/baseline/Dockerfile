# Base our app image off of the WALKOFF App SDK image
FROM frikky/shuffle:app_sdk as base

# We're going to stage away all of the bloat from the build tools so lets create a builder stage
#FROM base as builder

# Install all alpine build tools needed for our pip installs
#RUN apk --no-cache add --update alpine-sdk libffi libffi-dev musl-dev openssl-dev 

# Install all of our pip packages in a single directory that we can copy to our base image later
#RUN mkdir /install
#WORKDIR /install
#COPY requirements.txt /requirements.txt
#
## Switch back to our base image and copy in all of our built packages and source code
#FROM base
#COPY --from=builder /install /usr/local


# Install any binary dependencies needed in our final image - this can be a lot of different stuff
#RUN apk --no-cache add --update libmagic
WORKDIR /
COPY requirements.txt /requirements.txt
RUN pip install --prefix="/usr/local" -r /requirements.txt
COPY src /app

# Finally, lets run our app!
WORKDIR /app
CMD python app.py --log-level DEBUG
