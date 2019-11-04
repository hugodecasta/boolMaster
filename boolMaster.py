import requests
import json

class BoolMasterException(Exception):
    pass

class BoolMasterConnector(object):

    def __init__(self, host):
        self.host = host

    def send(self, method, **kwargs):
        url = 'http://'+self.host+'/?method='+method
        for arg, value in kwargs.items():
            url += '&'+arg+'='+value
        response = requests.get(url)
        if response.status_code != 200:
            raise BoolMasterException('Status code not 200')
        return response.json()

    def read_key(self, key):
        return self.send('read_key', key=key)

    def key_exists(self, key):
        return self.send('key_exists', key=key)

    def key_remove(self, key):
        return self.send('key_remove', key=key)

    def write_key(self, key, json_data):
        file_data = json.dumps(json_data)
        return self.send('write_key', key=key, file_data=file_data)

# ---------------------------------------