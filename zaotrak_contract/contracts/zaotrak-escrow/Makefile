default: build

all: test

test:
	cargo test

build:
	stellar contract build
	@ls -l target/wasm32v1-none/release/*.wasm 2>/dev/null || true

fmt:
	cargo fmt --all

clean:
	cargo clean
