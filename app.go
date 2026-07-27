package main

import (
	"context"
	"os/exec"

	"github.com/godbus/dbus/v5"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	
	"glowsnap/services/screenshot" 
)

type App struct {
	ctx               context.Context
	dbusConn          *dbus.Conn
	screenshotService *screenshot.Service
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	conn, err := dbus.SessionBus()
	if err != nil {
		runtime.LogError(ctx, "Failed to connect to D-Bus: "+err.Error())
		return
	}
	a.dbusConn = conn

	a.screenshotService = screenshot.NewService(conn)
}

func (a *App) shutdown(ctx context.Context) {
	if a.dbusConn != nil {
		a.dbusConn.Close()
	}
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

func (a *App) TakeScreenshot() {
	if a.screenshotService == nil {
		runtime.LogError(a.ctx, "Screenshot service not initialized")
		return
	}

	path, err := a.screenshotService.CaptureFullScreen()
	if err != nil {
		runtime.LogError(a.ctx, "Screenshot failed: "+err.Error())
		return
	}

	runtime.LogInfo(a.ctx, "Screenshot saved: "+path)
}