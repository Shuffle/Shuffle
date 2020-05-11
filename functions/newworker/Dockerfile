FROM python:3.7-alpine as base

FROM base as builder
RUN apk --no-cache add --update alpine-sdk

RUN mkdir /install
WORKDIR /install

COPY ./worker/requirements.txt /requirements.txt

RUN git clone "https://github.com/aio-libs/aioredis.git"
RUN pip install --prefix="/install" ./aioredis
RUN pip install --prefix="/install" --no-deps asteval
RUN pip install --prefix="/install" six
RUN pip install --prefix="/install" -r /requirements.txt

FROM base

COPY --from=builder /install /usr/local
COPY ./umpire/common /app/common
COPY ./worker /app/worker

WORKDIR /app

CMD python -m worker.worker
