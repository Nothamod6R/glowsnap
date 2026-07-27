package main

import (
	"context"
	"fmt"
	"os"
	"os/exec"

	"github.com/godbus/dbus/v5"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"glowsnap/services/screenshot"
	"glowsnap/services/screencast"
)

type App struct {
	ctx               context.Context
	dbusConn          *dbus.Conn
	screenshotService *screenshot.Service
	screenCastService *screencast.ScreenCastService
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
	a.screenCastService = screencast.NewScreenCastService(conn)
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

func (a *App) TakeAreaScreenshot() {
	if a.screenshotService == nil {
		runtime.LogError(a.ctx, "Screenshot service not initialized")
		return
	}
	path, err := a.screenshotService.CaptureArea()
	if err != nil {
		runtime.LogError(a.ctx, "Area screenshot failed: "+err.Error())
		return
	}
	runtime.LogInfo(a.ctx, "Area screenshot saved: "+path)
}

func (a *App) StartRecording(outputPath string, captureMic bool, captureSystemAudio bool) error {
	if a.screenCastService == nil {
		return fmt.Errorf("recording service not initialized")
	}
	return a.screenCastService.StartRecording(outputPath, captureMic, captureSystemAudio)
}

func (a *App) PauseRecording() error {
	if a.screenCastService == nil {
		return fmt.Errorf("recording service not initialized")
	}
	return a.screenCastService.PauseRecording()
}

func (a *App) ResumeRecording() error {
	if a.screenCastService == nil {
		return fmt.Errorf("recording service not initialized")
	}
	return a.screenCastService.ResumeRecording()
}

func (a *App) StopRecording() (string, error) {
	if a.screenCastService == nil {
		return "", fmt.Errorf("recording service not initialized")
	}
	return a.screenCastService.StopRecording()
}

func (a *App) GetHomeDir() string {
	home, _ := os.UserHomeDir()
	return home
}