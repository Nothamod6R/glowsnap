package main

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"sync"
	"time"

	"glowsnap/services/screencast"
	"glowsnap/services/screenshot"

	"github.com/godbus/dbus/v5"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
    ctx               context.Context
    dbusConn          *dbus.Conn
    screenshotService *screenshot.Service
    screenCastService *screencast.ScreenCastService
    httpServer        *http.Server
    screenshotsURL    string
    serverMu          sync.Mutex
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

    home, _ := os.UserHomeDir()
    screenshotsDir := filepath.Join(home, "Pictures", "Screenshots")
    if _, err := os.Stat(screenshotsDir); os.IsNotExist(err) {
        runtime.LogWarning(ctx, "Screenshots directory not found, creating it.")
        os.MkdirAll(screenshotsDir, 0755)
    }

    fs := http.FileServer(http.Dir(screenshotsDir))
    mux := http.NewServeMux()
    mux.Handle("/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Access-Control-Allow-Origin", "*")
        fs.ServeHTTP(w, r)
    }))

    listener, err := net.Listen("tcp", "127.0.0.1:0")
    if err != nil {
        runtime.LogError(ctx, "Failed to start HTTP server: "+err.Error())
        return
    }
    port := listener.Addr().(*net.TCPAddr).Port
    a.screenshotsURL = fmt.Sprintf("http://127.0.0.1:%d", port)

    a.httpServer = &http.Server{Handler: mux}
    go func() {
        if err := a.httpServer.Serve(listener); err != nil && err != http.ErrServerClosed {
            runtime.LogError(ctx, "HTTP server error: "+err.Error())
        }
    }()

    runtime.LogInfo(ctx, "Screenshots server started at "+a.screenshotsURL)
}

func (a *App) shutdown(ctx context.Context) {
    if a.httpServer != nil {
        shutdownCtx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
        defer cancel()
        a.httpServer.Shutdown(shutdownCtx)
    }
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



func (a *App) ListScreenshots() ([]string, error) {
    home, err := os.UserHomeDir()
    if err != nil {
        return nil, err
    }
    dir := filepath.Join(home, "Pictures", "Screenshots")
    entries, err := os.ReadDir(dir)
    if err != nil {
        return nil, err
    }

    var files []string
    for _, entry := range entries {
        if entry.IsDir() {
            continue
        }
        ext := filepath.Ext(entry.Name())
        switch ext {
        case ".png", ".jpg", ".jpeg", ".webp", ".bmp":
            files = append(files, entry.Name())
        }
    }
    return files, nil
}

func (a *App) GetScreenshotsBaseURL() string {
    return a.screenshotsURL
}