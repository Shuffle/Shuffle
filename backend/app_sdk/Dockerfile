#FROM python:3.9.1-alpine as base
FROM python:3.10.0-alpine as base

FROM base as builder
RUN apk --no-cache add --update alpine-sdk libffi libffi-dev musl-dev openssl-dev tzdata coreutils

RUN mkdir /install
WORKDIR /install

FROM base

#--no-cache 
RUN apk update && apk add --update tzdata libmagic alpine-sdk libffi libffi-dev musl-dev openssl-dev coreutils

COPY --from=builder /install /usr/local
COPY requirements.txt /requirements.txt
RUN pip3 install -r /requirements.txt

COPY __init__.py /app/walkoff_app_sdk/__init__.py
COPY app_base.py /app/walkoff_app_sdk/app_base.py
