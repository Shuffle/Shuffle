FROM python:3.9.1-alpine as base

FROM base as builder
RUN apk --no-cache add --update alpine-sdk libffi libffi-dev musl-dev openssl-dev tzdata

RUN mkdir /install
WORKDIR /install
COPY requirements.txt /requirements.txt
RUN pip3 install --prefix="/install" -r /requirements.txt

FROM base
COPY --from=builder /install /usr/local

WORKDIR /app
COPY sub.py /app/sub.py
CMD python sub.py 
