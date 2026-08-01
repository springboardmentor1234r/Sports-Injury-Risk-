.PHONY: setup up down test clean

setup:
	chmod +x setup.sh && ./setup.sh

up:
	docker-compose up -d --build

down:
	docker-compose down

test:
	pytest tests/

clean:
	find . -type d -name __pycache__ -exec rm -r {} +
	rm -rf .pytest_cache
