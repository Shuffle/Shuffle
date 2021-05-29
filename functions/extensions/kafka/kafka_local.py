import json 
import os
import requests
from time import sleep
from kafka import KafkaProducer, KafkaConsumer
import kafka

shuffle_url = os.getenv("SHUFFLE_URL")
shuffle_apikey = os.getenv("SHUFFLE_APIKEY")
shuffle_workflow = os.getenv("SHUFFLE_WORKFLOW")
    
headers = {"Authorization": "Bearer %s" % shuffle_apikey}
topic = "workflow_%s" % shuffle_workflow
server = "localhost:9092"
def produce():
    print("Starting producer")
    producer = KafkaProducer(
        bootstrap_servers=[server],
        value_serializer=lambda x:
        json.dumps(x).encode('utf-8')
    )
    
    print("Adding data!")
    for e in range(15):
        data = {"some": e, "data": "luuuuul"}

        try:
            ret = producer.send(topic, value=data)
            print(ret.get())
        except kafka.errors.KafkaTimeoutError as e:
            print("Kafka error: %s" % e)
            continue

def consume():
    print("Starting consumer")
    consumer = KafkaConsumer(
        topic,
        bootstrap_servers=[server],
        auto_offset_reset="earliest",
        enable_auto_commit=True,
        value_deserializer=lambda x: json.loads(x.decode('utf-8'))
    )

    print("Getting data")
    for message in consumer:
        message = message.value
        print("MSG: ", message)
        ret = requests.post("%s/api/v1/%s/execute" % shuffle_url, headers=headers, data=message)
        print(ret.status_code)
        print(ret.text)

if __name__ == "__main__":
    produce()
    #consume()
