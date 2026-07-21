from pymongo import MongoClient
from pymongo.server_api import ServerApi
import dns.resolver

# Force Google DNS to bypass local ISP timeout issues with SRV records
dns.resolver.default_resolver = dns.resolver.Resolver(configure=False)
dns.resolver.default_resolver.nameservers = ['8.8.8.8']

uri = "mongodb+srv://rahul72124272_db_user:ucqqOa9enp7UUR7j@testing.00yxf5s.mongodb.net"
# Create a new client and connect to the server
client = MongoClient(uri, server_api=ServerApi('1'))
# Send a ping to confirm a successful connection
try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(e)