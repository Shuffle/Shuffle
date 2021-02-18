package main

import (
	"context"
	//"encoding/json"
	//"fmt"
	"github.com/aws/aws-lambda-go/lambda"
	"net/http"
)

type LambdaPayload struct {
	RequestContext struct {
		Elb struct {
			TargetGroupArn string `json:"targetGroupArn"`
		} `json:"elb"`
	} `json:"requestContext"`
	HTTPMethod            string            `json:"httpMethod"`
	Path                  string            `json:"path"`
	Headers               map[string]string `json:"headers"`
	QueryStringParameters map[string]string `json:"queryStringParameters"`
	Body                  string            `json:"body"`
	IsBase64Encoded       bool              `json:"isBase64Encoded"`
}

type LambdaResponse struct {
	IsBase64Encoded   bool   `json:"isBase64Encoded"`
	StatusCode        int    `json:"statusCode"`
	StatusDescription string `json:"statusDescription"`
	Headers           struct {
		SetCookie   string `json:"Set-cookie"`
		ContentType string `json:"Content-Type"`
	} `json:"headers"`
	Body string `json:"body"`
}

func lambda_handler(ctx context.Context, payload LambdaPayload) (LambdaResponse, error) {
	response := &LambdaResponse{}
	response.Headers.ContentType = "text/html"
	response.StatusCode = http.StatusBadRequest
	response.StatusDescription = http.StatusText(http.StatusBadRequest)
	if payload.HTTPMethod == http.MethodGet && payload.Path == "/myfavoritecar" {
		res := "TEST"
		//car := &Car{}
		//car.Model = "Corvette"
		//car.Color = "Red"
		//car.Year = 1999
		//res, err := json.Marshal(car)
		//if err != nil {
		//	fmt.Println(err)
		//	response.StatusCode = http.StatusInternalServerError
		//	response.StatusDescription = http.StatusText(http.StatusInternalServerError)
		//	return *response, err
		//}
		response.Headers.ContentType = "application/json"
		response.Body = string(res)
		response.StatusCode = http.StatusOK
		response.StatusDescription = http.StatusText(http.StatusOK)
		return *response, nil
	} else {
		return *response, nil
	}
}

func main() {
	lambda.Start(lambda_handler)
}
