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
	"golang.org/x/sys/unix"
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
	a.screenCastService.SetOnRecordingEnd(func() {
		runtime.EventsEmit(a.ctx, "recording-ended")
	})

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
	if a.screenCastService != nil {
		a.screenCastService.Cleanup()
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

func (a *App) ResizeToSettings() {
	runtime.WindowSetSize(a.ctx, 380, 460)
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

func (a *App) StartRecording(captureMic bool, captureSystemAudio bool, micDevice string) (string, error) {
	if a.screenCastService == nil {
		return "", fmt.Errorf("recording service not initialized")
	}
	return a.screenCastService.StartRecording(captureMic, captureSystemAudio, micDevice)
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

func (a *App) CancelRecording() error {
	if a.screenCastService == nil {
		return fmt.Errorf("recording service not initialized")
	}
	return a.screenCastService.CancelRecording()
}

func (a *App) GetVideosDir() string {
	dir, err := screencast.VideosDir()
	if err != nil {
		return ""
	}
	return dir
}

func (a *App) ListMicrophones() ([]screencast.AudioDevice, error) {
	return screencast.ListMicrophones()
}

func (a *App) GetSystemAudioSupported() screencast.SystemAudioInfo {
	return screencast.GetSystemAudioInfo()
}

func (a *App) GetSavedMicrophone() string {
	return screencast.LoadSettings().Microphone
}

func (a *App) SaveMicrophone(name string) error {
	return screencast.SaveMicrophone(name)
}

func (a *App) GetHomeDir() string {
	home, _ := os.UserHomeDir()
	return home
}

type ScreenshotInfo struct {
	Name       string `json:"name"`
	Path       string `json:"path"`
	Size       int64  `json:"size"`
	CreatedAt  int64  `json:"createdAt"`
	ModifiedAt int64  `json:"modifiedAt"`
	Date       int64  `json:"date"`
	DateSource string `json:"dateSource"`
}

func birthTime(path string) (int64, string) {
	var stx unix.Statx_t
	if err := unix.Statx(unix.AT_FDCWD, path, 0, unix.STATX_BTIME, &stx); err == nil {
		if stx.Mask&unix.STATX_BTIME != 0 && stx.Btime.Sec > 0 {
			return stx.Btime.Sec, "birth"
		}
	}
	return 0, ""
}

func (a *App) ListScreenshots() ([]ScreenshotInfo, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return nil, err
	}
	dir := filepath.Join(home, "Pictures", "Screenshots")
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, err
	}

	var files []ScreenshotInfo
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		ext := filepath.Ext(entry.Name())
		switch ext {
		case ".png", ".jpg", ".jpeg", ".webp", ".bmp":
		default:
			continue
		}
		full := filepath.Join(dir, entry.Name())
		info, err := os.Stat(full)
		if err != nil {
			continue
		}
		modTime := info.ModTime().Unix()
		birth, src := birthTime(full)

		var date int64
		var dateSource string
		if birth > 0 {
			date = birth
			dateSource = src
		} else {
			date = modTime
			dateSource = "mtime"
		}

		files = append(files, ScreenshotInfo{
			Name:       entry.Name(),
			Path:       full,
			Size:       info.Size(),
			CreatedAt:  birth,
			ModifiedAt: modTime,
			Date:       date,
			DateSource: dateSource,
		})
	}
	if files == nil {
		files = []ScreenshotInfo{}
	}
	return files, nil
}

func (a *App) GetScreenshotsBaseURL() string {
	return a.screenshotsURL
}

func (a *App) SaveFileDialog(defaultName string) (string, error) {
	filePath, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Save Edited Image",
		DefaultFilename: defaultName,
		Filters: []runtime.FileFilter{
			{DisplayName: "PNG Image (*.png)", Pattern: "*.png"},
		},
	})
	if err != nil {
		return "", err
	}
	if filePath == "" {
		return "", fmt.Errorf("no file selected")
	}
	return filePath, nil
}

func (a *App) WriteFile(filePath string, data []byte) error {
	return os.WriteFile(filePath, data, 0644)
}

func (a *App) ResizeToStudio() {
	runtime.WindowMaximise(a.ctx)
}

func (a *App) RenameScreenshot(oldName, newName string) error {
	home, err := os.UserHomeDir()
	if err != nil {
		return err
	}
	dir := filepath.Join(home, "Pictures", "Screenshots")
	oldPath := filepath.Join(dir, oldName)
	newPath := filepath.Join(dir, newName)
	return os.Rename(oldPath, newPath)
}

func (a *App) DeleteScreenshot(fileName string) error {
	home, err := os.UserHomeDir()
	if err != nil {
		return err
	}
	path := filepath.Join(home, "Pictures", "Screenshots", fileName)
	return os.Remove(path)
}
