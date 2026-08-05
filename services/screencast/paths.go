package screencast

import (
	"os"
	"path/filepath"
	"strings"
	"time"
)

func GenerateFilename() string {
	return "screencast_" + time.Now().Format("2006-01-02_15-04-05") + ".mp4"
}

func VideosDir() (string, error) {
	if d := os.Getenv("XDG_VIDEOS_DIR"); d != "" && filepath.IsAbs(d) {
		dir := filepath.Join(d, "Screencasts")
		if err := os.MkdirAll(dir, 0755); err != nil {
			return "", err
		}
		return dir, nil
	}

	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}

	videos := filepath.Join(home, "Videos")
	if d := xdgVideosFromUserDirs(home); d != "" {
		videos = d
	}

	dir := filepath.Join(videos, "Screencasts")
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", err
	}
	return dir, nil
}

func NewOutputPath() (string, error) {
	dir, err := VideosDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, GenerateFilename()), nil
}

func xdgVideosFromUserDirs(home string) string {
	data, err := os.ReadFile(filepath.Join(home, ".config", "user-dirs.dirs"))
	if err != nil {
		return ""
	}
	for _, line := range strings.Split(string(data), "\n") {
		line = strings.TrimSpace(line)
		if !strings.HasPrefix(line, "XDG_VIDEOS_DIR=") {
			continue
		}
		val := strings.TrimSpace(strings.TrimPrefix(line, "XDG_VIDEOS_DIR="))
		val = strings.Trim(val, "\"")
		if val == "" {
			return ""
		}
		if strings.HasPrefix(val, "$HOME") {
			return filepath.Join(home, strings.TrimPrefix(val, "$HOME"))
		}
		return val
	}
	return ""
}
