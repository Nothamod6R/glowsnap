package screenshot

import (
	"fmt"
	"io"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"glowsnap/services/settings"

	"github.com/godbus/dbus/v5"
)

type Service struct {
	conn *dbus.Conn
}

func NewService(conn *dbus.Conn) *Service {
	return &Service{conn: conn}
}

func (s *Service) commonCapture(interactive bool) (string, error) {
	if s.conn == nil {
		return "", fmt.Errorf("D-Bus connection not initialized")
	}

	cfg := settings.Load()

	screenshotsDir := cfg.ScreenshotSaveDir()
	if err := os.MkdirAll(screenshotsDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create Screenshots directory: %w", err)
	}

	destPath := filepath.Join(screenshotsDir, buildScreenshotName(cfg.Screenshot.FilenamePattern)+".png")

	portalObj := s.conn.Object("org.freedesktop.portal.Desktop", "/org/freedesktop/portal/desktop")
	options := map[string]dbus.Variant{
		"handle_token": dbus.MakeVariant(fmt.Sprintf("glowsnap_%d", time.Now().UnixNano())),
		"interactive":  dbus.MakeVariant(interactive),
	}
	if cfg.Screenshot.CopyToClipboard {
		options["copy_to_clipboard"] = dbus.MakeVariant(true)
	}

	var handle dbus.ObjectPath
	err := portalObj.Call("org.freedesktop.portal.Screenshot.Screenshot", 0, "", options).Store(&handle)
	if err != nil {
		return "", fmt.Errorf("failed to call Screenshot portal: %w", err)
	}

	matchRule := fmt.Sprintf("type='signal',interface='org.freedesktop.portal.Request',member='Response',path='%s'", handle)
	addMatch := s.conn.BusObject().Call("org.freedesktop.DBus.AddMatch", 0, matchRule)
	if addMatch.Err != nil {
		return "", fmt.Errorf("failed to add match: %w", addMatch.Err)
	}
	defer s.conn.BusObject().Call("org.freedesktop.DBus.RemoveMatch", 0, matchRule)

	signalCh := make(chan *dbus.Signal, 1)
	s.conn.Signal(signalCh)
	defer s.conn.RemoveSignal(signalCh)

	var respSignal *dbus.Signal
	select {
	case sig := <-signalCh:
		respSignal = sig
	case <-time.After(30 * time.Second):
		return "", fmt.Errorf("timeout waiting for Screenshot portal response")
	}

	var response uint32
	var results map[string]dbus.Variant
	if err := dbus.Store(respSignal.Body, &response, &results); err != nil {
		return "", fmt.Errorf("failed to parse portal response: %w", err)
	}
	if response != 0 {
		if response == 1 {
			return "", fmt.Errorf("screenshot cancelled by user")
		}
		return "", fmt.Errorf("portal rejected the request with code %d", response)
	}

	uriVar, ok := results["uri"]
	if !ok {
		return "", fmt.Errorf("response does not contain 'uri'")
	}
	uriStr, ok := uriVar.Value().(string)
	if !ok {
		return "", fmt.Errorf("invalid 'uri' value type")
	}

	parsedURI, err := url.Parse(uriStr)
	if err != nil {
		return "", fmt.Errorf("invalid URI: %s", uriStr)
	}
	if parsedURI.Scheme != "file" {
		return "", fmt.Errorf("unsupported URI scheme: %s", parsedURI.Scheme)
	}
	srcPath := parsedURI.Path

	err = os.Rename(srcPath, destPath)
	if err != nil {
		srcFile, openErr := os.Open(srcPath)
		if openErr != nil {
			return "", fmt.Errorf("failed to open source file: %w", openErr)
		}
		defer srcFile.Close()

		dstFile, createErr := os.Create(destPath)
		if createErr != nil {
			return "", fmt.Errorf("failed to create destination file: %w", createErr)
		}
		defer dstFile.Close()

		if _, copyErr := io.Copy(dstFile, srcFile); copyErr != nil {
			os.Remove(destPath)
			return "", fmt.Errorf("failed to copy file: %w", copyErr)
		}
		os.Remove(srcPath)
	}

	return destPath, nil
}

func (s *Service) CaptureFullScreen() (string, error) {
	return s.commonCapture(false)
}

func buildScreenshotName(pattern string) string {
	ts := time.Now().Format("2006-01-02_15-04-05")
	if strings.TrimSpace(pattern) == "" {
		pattern = "screenshot_{date}"
	}
	name := strings.ReplaceAll(pattern, "{date}", ts)
	name = strings.Map(func(r rune) rune {
		switch r {
		case '/', '\\', ':', '*', '?', '"', '<', '>', '|':
			return '_'
		}
		return r
	}, name)
	if strings.TrimSpace(name) == "" {
		name = "screenshot_" + ts
	}
	return name
}

func (s *Service) CaptureArea() (string, error) {
	return s.commonCapture(true)
}
