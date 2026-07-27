package main

import (
	"context"
	"os/exec"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx context.Context
}
func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) OpenToolsPalette() {
	cmd := exec.Command("glowsnap", "--palette")
	cmd.Start()
}

func (a *App) ResizeToPalette() {
	runtime.WindowSetSize(a.ctx, 520, 100) 
	runtime.WindowCenter(a.ctx)
}

func (a *App) ResizeToStudio() {
	runtime.WindowSetSize(a.ctx, 1024, 768) 
	runtime.WindowCenter(a.ctx)
}

