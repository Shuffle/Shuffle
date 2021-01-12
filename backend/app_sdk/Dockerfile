FROM python:3.7-alpine as base

FROM base as builder
RUN apk --no-cache add --update alpine-sdk libffi libffi-dev musl-dev openssl-dev

RUN mkdir /install
WORKDIR /install

COPY requirements.txt /requirements.txt
RUN pip3 install -r /requirements.txt

FROM base

COPY --from=builder /install /usr/local
COPY __init__.py /app/walkoff_app_sdk/__init__.py
COPY app_base.py /app/walkoff_app_sdk/app_base.py
