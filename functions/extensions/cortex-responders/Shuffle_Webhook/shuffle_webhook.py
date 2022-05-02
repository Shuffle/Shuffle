#!/usr/bin/env python3
#encoding: utf-8

from cortexutils.responder import Responder
import requests

class Shuffle(Responder):
   def __init__(self):
      Responder.__init__(self)
      self.api_key = self.get_param("config.api_key", "")
      self.webhook_url = self.get_param("config.webhook_url", "")
      self.webhook_id = self.get_param("config.webhook_id", "")
      self.verify = self.get_param('config.verifyssl', True, None)
      self.data = self.get_param('data')

   def run(self):
      Responder.run(self)
      headers = {
         "Content-Type": "application/json",
         "Accept": "application/json",
         "User-Agent": "Cortex-Analyzer"
      }
      requests.post(self.webhook_url, headers=headers,verify=self.verify, json=self.data)

      self.report({'message': 'message sent'})

if __name__ == '__main__':
    Shuffle().run()
