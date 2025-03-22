import os
import consul
import threading

class ConsulClient:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                # Read from environment variables
                host = os.getenv("CONSUL_HOST", "localhost")
                port = int(os.getenv("CONSUL_PORT", 8500))
                cls._instance.client = consul.Consul(host=host, port=port)
        return cls._instance

    def get_client(self):
        return self.client
    
    def get_service_address(self, service_name):
        services = self.client.agent.services()

        service_info = next((service for service in services.values() if service["Service"] == service_name), None)

        if service_info:
            print(f"Service found: {service_name}")
            return f"http://{service_info['Address']}:{service_info['Port']}"

        print(f"Service not found: {service_name}")
        return None