# GlowSnap

<p align="center">
  <img src="./packaging/io.github.libreglow.glowsnap.png" alt="GlowSnap Logo" width="128">
</p>

<p align="center">
  <b>A modern open-source screenshot and visual editing tool for Linux.</b>
  <br>
  Capture, customize, and transform your screenshots into beautiful visuals with a simple and elegant workflow.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-Linux-blue">
  <img src="https://img.shields.io/badge/license-MIT-green">
  <img src="https://img.shields.io/badge/status-Stable%20-blue">
</p>

<p align="center">
  <img src="./docs/images/banner.png" alt="GlowSnap Banner">
</p>

## About

GlowSnap is an open-source Linux productivity tool designed to make screenshots more powerful and beautiful.

It helps you capture your screen, organize your screenshots, and turn them into polished visuals with modern editing tools, customizable styles, and a clean user experience.

Built with simplicity and performance in mind, GlowSnap aims to bring a premium screenshot workflow to Linux.

Turn raw code and screenshots into polished, professional assets in one click. Perfect for content creators, developers, and testers on Linux.
<p align="center">
  <img src="./docs/images/res.png" alt="GlowSnap">
</p>

## Features

### Screenshot Studio

- Full screen screenshots
- Area selection capture
- Screenshot gallery
- Full-screen image viewer

### Visual Editor

- Free drawing
- Arrows and shapes
- Text editing
- Custom colors and opacity
- Crop tools

---

## Screenshots

<p align="center">
  <img src="./docs/images/studio.png" width="800" alt="GlowSnap Studio">
</p>

<p align="center">
  <img src="./docs/images/editor.png" width="800" alt="GlowSnap Editor">
</p>

---

## Installation

### Linux

GlowSnap is currently in active development.

A Flatpak release is coming soon:

```
Coming soon on Flathub
```

---

## Building with Docker

GlowSnap ships a [multi-stage `Dockerfile`](./Dockerfile) that provides a fully
reproducible Linux build environment. It installs the native toolchain (Go,
Node, Wails/WebKitGTK 4.1 system libraries) inside an isolated container, builds
the frontend, runs the test suite, and compiles the final binary.

This container is **strictly for building and testing** — it does not run the
GUI and does not forward X11/Wayland, DBus, or audio.

> **Prerequisite:** the build uses BuildKit, which is enabled by default in
> modern Docker. On older Docker versions set `DOCKER_BUILDKIT=1`.

### Build the binary (and run the tests)

The tests run as part of the build. The default final stage (`artifacts`) is a
minimal image containing only the compiled binary at `/glowsnap`:

```bash
docker build -t glowsnap:build .
```

### Export only the binary

Explicitly target the `artifacts` stage and write the binary to `./out`:

```bash
docker build --target artifacts -o out/ .
./out/glowsnap --version
```

### Run the test suite inside the container

Tag the runnable `builder` stage (it contains the Go toolchain and source, and
its working directory is `/build`), then run the tests exactly as CI does:

```bash
docker build --target builder -t glowsnap:builder .
docker run --rm glowsnap:builder go test -tags webkit2_41 ./...
```

### Build with a custom version string

The injected version defaults to `dev`. Pass a release version with an `ARG`:

```bash
docker build --build-arg VERSION=1.1.0 -t glowsnap:build .
```

### Portability note

The resulting binary is a **reproducible Linux build**, but it is **not a
universally portable binary across all Linux distributions**. GlowSnap links
dynamically against GTK/WebKitGTK and other system libraries that must be
present on the target machine at runtime. For a self-contained, distribution
independent artifact, use the AppImage packaging (see `scripts/build-appimage.sh`).

---

## Built With

- **Go** — Backend and native system integration
- **Wails** — Desktop application framework
- **React + TypeScript** — User interface
- **Tailwind CSS** — Styling
- **shadcn/ui** — UI components
- **Konva** — Canvas-based editing

---

## Roadmap

### v1.1.0

- [x] Add screencast ( BETA )
- [ ] Add settings

### v1.1.1

- [ ] Add more fonts
- [ ] Add blur effect to the editor

### Future

- Screenshot
- Advanced image editor
- Productivity tools ecosystem
- More native Linux integrations

---

## Contributing

Contributions are welcome!

Whether you are a developer, designer, tester, or Linux enthusiast, you can help improve GlowSnap.

Check out our contribution guide:

```
CONTRIBUTING.md
```

---

## License

GlowSnap is licensed under the MIT License.

You are free to use, modify, and distribute this software.

---

## Vision

GlowSnap is not only a screenshot tool.

The goal is to build a collection of beautiful, simple, and open-source productivity tools designed specifically for Linux users.
