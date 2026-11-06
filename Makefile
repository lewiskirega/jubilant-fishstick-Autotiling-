# ==============================================================================
# Fedora AutoTile - Makefile
# Professional developer and distribution targets
# ==============================================================================

SHELL := /usr/bin/env bash
UUID := fedora-autotile@codefort.dev
ROOT_DIR := $(shell pwd)
SCHEMAS_DIR := $(ROOT_DIR)/schemas
SRC_FILES := $(shell find $(ROOT_DIR)/src -name "*.js") $(ROOT_DIR)/extension.js $(ROOT_DIR)/prefs.js

.DEFAULT_GOAL := help

.PHONY: help
help: ## Show this help message
	@echo "Fedora AutoTile Development & Build System"
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

.PHONY: check
check: lint ## Alias for lint

.PHONY: lint
lint: ## Validate JavaScript syntax and schema validity
	@echo "==> Running syntax and validation checks..."
	@node --check $(ROOT_DIR)/extension.js
	@node --check $(ROOT_DIR)/prefs.js
	@for f in $(SRC_FILES); do \
		node --check "$$f" || exit 1; \
	done
	@glib-compile-schemas --strict $(SCHEMAS_DIR)
	@echo "✓ All syntax and schema checks passed."

.PHONY: test
test: lint ## Run automated unit and layout tests
	@echo "==> Running test suite..."
	@bash $(ROOT_DIR)/scripts/test.sh

.PHONY: build
build: ## Compile schemas and prepare the extension build
	@echo "==> Building Fedora AutoTile..."
	@bash $(ROOT_DIR)/scripts/build.sh

.PHONY: pack
pack: test ## Build production distribution ZIP archives
	@echo "==> Packaging extension..."
	@bash $(ROOT_DIR)/scripts/pack.sh

.PHONY: release
release: pack ## Prepare release assets and generate SHA256 checksums
	@echo "==> Generating SHA256 checksums for release..."
	@sha256sum $(ROOT_DIR)/fedora-autotile.zip $(ROOT_DIR)/$(UUID).shell-extension.zip > $(ROOT_DIR)/SHA256SUMS.txt
	@cat $(ROOT_DIR)/SHA256SUMS.txt
	@echo "✓ Release assets and checksums generated."

.PHONY: install
install: ## Install extension to user extension directory (~/.local/share/gnome-shell/extensions)
	@echo "==> Installing Fedora AutoTile..."
	@bash $(ROOT_DIR)/scripts/install.sh --source

.PHONY: dev-install
dev-install: ## Install development build and enable extension
	@echo "==> Installing developer build..."
	@bash $(ROOT_DIR)/scripts/dev-install.sh

.PHONY: uninstall
uninstall: ## Remove extension from user directory (preserves settings)
	@echo "==> Uninstalling Fedora AutoTile..."
	@bash $(ROOT_DIR)/scripts/uninstall.sh

.PHONY: update
update: ## Check and install updates from latest GitHub release
	@echo "==> Checking for updates..."
	@bash $(ROOT_DIR)/scripts/update.sh

.PHONY: clean
clean: ## Remove build artifacts, compiled schemas, and temporary archives
	@echo "==> Cleaning build artifacts..."
	@rm -f $(ROOT_DIR)/*.zip $(ROOT_DIR)/SHA256SUMS.txt $(ROOT_DIR)/RELEASE_NOTES.md
	@rm -f $(SCHEMAS_DIR)/gschemas.compiled
	@echo "✓ Clean complete."
