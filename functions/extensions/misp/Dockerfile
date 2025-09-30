FROM python:3.9.4-alpine as base

FROM base as builder 

RUN mkdir /install
WORKDIR /install

FROM base
RUN apk add g++

COPY --from=builder /install /usr/local
COPY requirements.txt /requirements.txt
RUN pip3 install -r /requirements.txt


RUN mkdir /app
WORKDIR /app
COPY requirements.txt /app/requirements.txt
RUN python3 -m pip install -r /app/requirements.txt

COPY sub.py /app/sub.py

CMD ["python3", "sub.py"]
