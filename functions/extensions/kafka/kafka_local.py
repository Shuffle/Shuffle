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
group = "testing"
server = "localhost:9092"
def produce():
    try:
        #group_id=group,
        #value_serializer=lambda x: json.dumps(x).encode('utf-8')
        producer = KafkaProducer(
            bootstrap_servers=[server],
        )
    except kafka.errors.NoBrokersAvailable as e:
        print(f"Error with producer: {e}")
        sleep(5)
        produce()
        return
    except ValueError as e:
        print(f"ValuError with producer: {e}")
        sleep(5)
        produce()
        return
        
        
    for i in range(15):
        producer.send(topic, json.dumps({"some": i, "data": "luuuuul"}))

    producer.flush()
    producer.close()
    exit()

        #print(f"Adding data {data}")

        #try:
        #    ret = producer.send(topic, value=data)
        #    print(ret.get())
        #    producer.flush()

        #    #future = producer.send('foobar', b'another_message')
        #    #result = future.get(timeout=60)
        #    #print(result)

        #except kafka.errors.KafkaTimeoutError as e:
        #    print("Kafka error: %s" % e)
        #    continue

def consume():
    print("Starting consumer")
    #group_id=group,
    #auto_offset_reset="earliest",
    #enable_auto_commit=True,
    consumer = KafkaConsumer(
        topic,
        bootstrap_servers=[server],
        auto_offset_reset='earliest',
        max_poll_records=2,
    )
    #value_deserializer=lambda x: json.loads(x.decode('utf-8'))

    consumer.poll()
    #consumer.seek_to_beginning()

    print(f"Getting data from topic {topic}")
    for message in consumer:
        #message = message.value
        #message = message
        print("MSG: ", message)
        ret = requests.post("%s/api/v1/%s/execute" % shuffle_url, headers=headers, data=message)
        print(ret.status_code)
        print(ret.text)

if __name__ == "__main__":
    if topic == "workflow_None":
        topic = "testing"
    print("Starting producer on %s for topic %s" % (server, topic))
    produce()
    #consume()
