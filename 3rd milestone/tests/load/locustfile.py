from locust import HttpUser, task

class SportsPlatformUser(HttpUser):
    @task
    def load_homepage(self):
        self.client.get("/")
