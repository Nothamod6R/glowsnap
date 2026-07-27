package main

import (
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"time"
	"net/url"

	"github.com/godbus/dbus/v5"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx      context.Context
	dbusConn *dbus.Conn   
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
	if a.dbusConn == nil {
		runtime.LogError(a.ctx, "D-Bus connection not initialized")
		return
	}

	homeDir, err := os.UserHomeDir()
	if err != nil {
		runtime.LogError(a.ctx, "Failed to get home directory: "+err.Error())
		return
	}
	screenshotsDir := filepath.Join(homeDir, "Pictures", "Screenshots")
	if err := os.MkdirAll(screenshotsDir, 0755); err != nil {
		runtime.LogError(a.ctx, "Failed to create Screenshots directory: "+err.Error())
		return
	}

	timestamp := time.Now().Format("2006-01-02_15-04-05")
	destPath := filepath.Join(screenshotsDir, fmt.Sprintf("screenshot_%s.png", timestamp))

	portalObj := a.dbusConn.Object("org.freedesktop.portal.Desktop", "/org/freedesktop/portal/desktop")
	options := map[string]dbus.Variant{
		"handle_token": dbus.MakeVariant(fmt.Sprintf("glowsnap_%d", time.Now().UnixNano())),
		"interactive":  dbus.MakeVariant(false),
	}

	var handle dbus.ObjectPath
	err = portalObj.Call("org.freedesktop.portal.Screenshot.Screenshot", 0, "", options).Store(&handle)
	if err != nil {
		runtime.LogError(a.ctx, "Failed to call Screenshot portal: "+err.Error())
		return
	}

	matchRule := fmt.Sprintf("type='signal',interface='org.freedesktop.portal.Request',member='Response',path='%s'", handle)
	addMatch := a.dbusConn.BusObject().Call("org.freedesktop.DBus.AddMatch", 0, matchRule)
	if addMatch.Err != nil {
		runtime.LogError(a.ctx, "Failed to add match: "+addMatch.Err.Error())
		return
	}
	defer a.dbusConn.BusObject().Call("org.freedesktop.DBus.RemoveMatch", 0, matchRule)

	signalCh := make(chan *dbus.Signal, 1)
	a.dbusConn.Signal(signalCh)
	defer a.dbusConn.RemoveSignal(signalCh)

	var respSignal *dbus.Signal
	select {
	case sig := <-signalCh:
		respSignal = sig
	case <-time.After(10 * time.Second):
		runtime.LogError(a.ctx, "Timeout waiting for Screenshot portal response")
		return
	}

	var response uint32
	var results map[string]dbus.Variant
	if err := dbus.Store(respSignal.Body, &response, &results); err != nil {
		runtime.LogError(a.ctx, "Failed to parse portal response: "+err.Error())
		return
	}
	if response != 0 {
		runtime.LogError(a.ctx, fmt.Sprintf("Portal rejected the request with code: %d", response))
		return
	}

	uriVar, ok := results["uri"]
	if !ok {
		runtime.LogError(a.ctx, "Response does not contain 'uri'")
		return
	}
	uriStr, ok := uriVar.Value().(string)
	if !ok {
		runtime.LogError(a.ctx, "Invalid 'uri' value type")
		return
	}

	parsedURI, err := url.Parse(uriStr)
	if err != nil {
		runtime.LogError(a.ctx, "Invalid URI: "+uriStr)
		return
	}
	if parsedURI.Scheme != "file" {
		runtime.LogError(a.ctx, "Unsupported URI scheme: "+parsedURI.Scheme)
		return
	}
	srcPath := parsedURI.Path

	err = os.Rename(srcPath, destPath)
	if err != nil {
		runtime.LogWarning(a.ctx, "os.Rename failed, falling back to io.Copy: "+err.Error())

		srcFile, openErr := os.Open(srcPath)
		if openErr != nil {
			runtime.LogError(a.ctx, "Failed to open source file: "+openErr.Error())
			return
		}
		defer srcFile.Close()

		dstFile, createErr := os.Create(destPath)
		if createErr != nil {
			runtime.LogError(a.ctx, "Failed to create destination file: "+createErr.Error())
			return
		}
		defer dstFile.Close()

		if _, copyErr := io.Copy(dstFile, srcFile); copyErr != nil {
			runtime.LogError(a.ctx, "Failed to copy file: "+copyErr.Error())
			os.Remove(destPath)
			return
		}
		os.Remove(srcPath)
	}

	runtime.LogInfo(a.ctx, "Screenshot saved successfully: "+destPath)
}