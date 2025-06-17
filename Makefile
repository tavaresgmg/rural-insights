.PHONY: help dev build test install clean

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

dev: ## Start development servers with hot reload
	@echo "🚀 Starting Rural Insights development environment..."
	docker-compose up

build: ## Build production images
	@echo "🔨 Building production images..."
	docker-compose build --no-cache

test: ## Run all tests
	@echo "🧪 Running tests..."
	cd backend && python -m pytest
	cd frontend && npm test

install: ## Install all dependencies
	@echo "📦 Installing dependencies..."
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

clean: ## Clean up containers and volumes
	@echo "🧹 Cleaning up..."
	docker-compose down -v
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type d -name node_modules -exec rm -rf {} +

logs: ## Show logs from all services
	docker-compose logs -f

backend-shell: ## Access backend container shell
	docker-compose exec backend /bin/bash

frontend-shell: ## Access frontend container shell
	docker-compose exec frontend /bin/sh