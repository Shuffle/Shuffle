FROM golang:1.16.0-buster as builder

# Add files
RUN mkdir /app
RUN mkdir /app_sdk
WORKDIR /app
ADD ./go-app/main.go /app
ADD ./go-app/walkoff.go /app
ADD ./go-app/docker.go /app
ADD ./go-app/oauth2.go /app

ADD ./go-app/go.mod /app

# Required files for code generation
ADD ./app_sdk/app_base.py /app_sdk
ADD ./app_sdk_kali/app_base.py /app_sdk_kali
ADD ./app_sdk_kali/static_baseline.py /app_sdk_kali
ADD ./app_sdk_blackarch/app_base.py /app_sdk_blackarch
ADD ./app_sdk_blackarch/static_baseline.py /app_sdk_blackarch
ADD ./app_sdk_jupyter_all_spark_notebook/app_base.py /app_sdk_jupyter_all_spark_notebook
ADD ./app_sdk_jupyter_all_spark_notebook/static_baseline.py /app_sdk_jupyter_all_spark_notebook
ADD ./app_sdk_jupyter_base/app_base.py /app_sdk_jupyter_base
ADD ./app_sdk_jupyter_base/static_baseline.py /app_sdk_jupyter_base
ADD ./app_sdk_jupyter_datascience_notebook/app_base.py /app_sdk_jupyter_datascience_notebook
ADD ./app_sdk_jupyter_datascience_notebook/static_baseline.py /app_sdk_jupyter_datascience_notebook
ADD ./app_sdk_jupyter_minimal/app_base.py /app_sdk_jupyter_minimal
ADD ./app_sdk_jupyter_minimal/static_baseline.py /app_sdk_jupyter_minimal
ADD ./app_sdk_jupyter_pyspark_notebook/app_base.py /app_sdk_jupyter_pyspark_notebook
ADD ./app_sdk_jupyter_pyspark_notebook/static_baseline.py /app_sdk_jupyter_pyspark_notebook
ADD ./app_sdk_jupyter_r_notebook/app_base.py /app_sdk_jupyter_r_notebook
ADD ./app_sdk_jupyter_r_notebook/static_baseline.py /app_sdk_jupyter_r_notebook
ADD ./app_sdk_jupyter_sagemath_notebook/app_base.py /app_sdk_jupyter_sagemath_notebook
ADD ./app_sdk_jupyter_sagemath_notebook/static_baseline.py /app_sdk_jupyter_sagemath_notebook
ADD ./app_sdk_jupyter_scipy_notebook/app_base.py /app_sdk_jupyter_scipy_notebook
ADD ./app_sdk_jupyter_scipy_notebook/static_baseline.py /app_sdk_jupyter_scipy_notebook
ADD ./app_sdk_jupyter_tensorflow_notebook/app_base.py /app_sdk_jupyter_tensorflow_notebook
ADD ./app_sdk_jupyter_tensorflow_notebook/static_baseline.py /app_sdk_jupyter_tensorflow_notebook
ADD ./app_sdk_homeassistant/app_base.py /app_sdk_homeassistant
ADD ./app_sdk_homeassistant/static_baseline.py /app_sdk_homeassistant
ADD ./app_sdk_anaconda/app_base.py /app_sdk_anaconda
ADD ./app_sdk_anaconda/static_baseline.py /app_sdk_anaconda
ADD ./app_gen /app_gen

RUN go get -v

RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o webapp .

# Certificate build - gets required certs
FROM alpine:latest as certs
RUN apk --update add ca-certificates

FROM alpine:3.12

COPY --from=builder /app/ /app
COPY --from=builder /app_sdk/ /app_sdk
COPY --from=builder /app_sdk_kali/ /app_sdk_kali
COPY --from=builder /app_sdk_blackarch/ /app_sdk_blackarch
COPY --from=builder /app_sdk_jupyter_all_spark_notebook/ /app_sdk_jupyter_all_spark_notebook
COPY --from=builder /app_sdk_jupyter_base/ /app_sdk_jupyter_base
COPY --from=builder /app_sdk_jupyter_datascience_notebook/ /app_sdk_jupyter_datascience_notebook
COPY --from=builder /app_sdk_jupyter_minimal/ /app_sdk_jupyter_minimal
COPY --from=builder /app_sdk_jupyter_pyspark_notebook/ /app_sdk_jupyter_pyspark_notebook
COPY --from=builder /app_sdk_jupyter_r_notebook/ /app_sdk_jupyter_r_notebook
COPY --from=builder /app_sdk_jupyter_sagemath_notebook/ /app_sdk_jupyter_sagemath_notebook
COPY --from=builder /app_sdk_jupyter_scipy_notebook/ /app_sdk_jupyter_scipy_notebook
COPY --from=builder /app_sdk_jupyter_tensorflow_notebook/ /app_sdk_jupyter_tensorflow_notebook
COPY --from=builder /app_sdk_homeassistant/ /app_sdk_homeassistant
COPY --from=builder /app_sdk_anaconda/ /app_sdk_anaconda
COPY --from=builder /app_gen/ /app_gen
COPY --from=certs /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt

WORKDIR /app
EXPOSE 5001
CMD ["./webapp"]
